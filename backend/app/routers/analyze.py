import json
import uuid
import time
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from sse_starlette.sse import EventSourceResponse
from typing import AsyncGenerator

from app.models.request import AnalyzeRequest
from app.middleware.auth import get_current_user_with_profile, get_supabase_client
from app.services.nlp_core import extract_clinical_entities
from app.services.cdss_engine import run_cdss
from app.services.fhir_mapper import map_entities_to_fhir
from app.services.evidence_layer import fetch_evidence
from app.services.audit_service import log_action
from app.utils.crypto import hash_note
from app.utils.validators import sanitize_clinical_text
from app.config import get_settings

router = APIRouter()


async def generate_analysis_stream(
    note_text: str,
    user_id: str,
    case_id: str,
    supabase_client,
    request: Request
) -> AsyncGenerator[dict, None]:
    """Main SSE stream generator for clinical note analysis."""

    entities_data = {}
    soap_data = {}
    note_type = "unknown"
    processing_ms = 0
    word_count = len(note_text.split())

    yield {"event": "status", "data": json.dumps({"stage": "Detectando tipo de nota...", "case_id": case_id})}

    # Stream NLP results
    async for event in extract_clinical_entities(note_text):
        section = event.get("section")

        if section == "entities":
            entities_data = event.get("data", {})
        elif section == "soap":
            soap_data = event.get("data", {})
        elif section == "note_type":
            note_type = event.get("data", {}).get("note_type", "unknown")
        elif section == "metadata":
            meta = event.get("data", {})
            processing_ms = meta.get("processing_ms", 0)
        elif section == "status":
            yield {"event": "status", "data": json.dumps(event.get("data", {}))}
            continue
        elif section == "error":
            yield {"event": "error", "data": json.dumps(event.get("data", {}))}
            return

        if section not in ("status", "metadata", "complete"):
            yield {"event": section, "data": json.dumps(event.get("data", {}))}

    yield {"event": "status", "data": json.dumps({"stage": "Analizando interacciones..."})}

    # Run CDSS
    settings = get_settings()
    cdss_alerts = await run_cdss(entities_data)

    yield {"event": "alerts", "data": json.dumps([a.model_dump() for a in cdss_alerts])}

    yield {"event": "status", "data": json.dumps({"stage": "Generando FHIR..."})}

    # Generate FHIR bundle
    fhir_bundle = map_entities_to_fhir(entities_data)
    yield {"event": "fhir", "data": json.dumps(fhir_bundle)}

    yield {"event": "status", "data": json.dumps({"stage": "Guardando caso..."})}

    # Save to Supabase
    try:
        alert_rows = [
            {
                "id": str(uuid.uuid4()),
                "case_id": case_id,
                "severity": a.severity,
                "category": a.category,
                "message": a.message,
                "detail": a.detail,
                "source": a.source
            }
            for a in cdss_alerts
        ]

        supabase_client.table("cases").update({
            "note_type": note_type,
            "word_count": word_count,
            "processing_ms": processing_ms,
            "model_version": settings.claude_model,
            "soap_structured": soap_data,
            "fhir_bundle": fhir_bundle,
            "entities": entities_data
        }).eq("id", case_id).execute()

        if alert_rows:
            supabase_client.table("alerts").insert(alert_rows).execute()

        # Increment notes counter
        supabase_client.rpc("increment_notes_used", {"p_user_id": user_id}).execute()

    except Exception as e:
        yield {"event": "warning", "data": json.dumps({"message": f"Error saving case: {str(e)}"})}

    yield {"event": "status", "data": json.dumps({"stage": "Buscando evidencia..."})}
    yield {"event": "complete", "data": json.dumps({"case_id": case_id, "processing_ms": processing_ms})}


@router.post("/analyze")
async def analyze_note(
    analyze_req: AnalyzeRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    user_data=Depends(get_current_user_with_profile),
    supabase_client=Depends(get_supabase_client)
):
    """Stream clinical note analysis via SSE."""
    profile = user_data["profile"]
    user_id = profile["id"]

    # Check monthly limit for free plan
    limits_resp = supabase_client.rpc("get_user_plan_limits", {"p_user_id": user_id}).execute()
    if limits_resp.data:
        limits = limits_resp.data
        if not limits.get("can_process", True):
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "monthly_limit_exceeded",
                    "message": "Has alcanzado el límite mensual de 10 notas del plan gratuito. Actualiza a Pro para continuar.",
                    "notes_used": limits.get("notes_used_this_month"),
                    "monthly_limit": limits.get("monthly_limit")
                }
            )

    # Sanitize input
    clean_note = sanitize_clinical_text(analyze_req.note_text)

    # Create case record immediately
    case_id = str(uuid.uuid4())
    note_hash = hash_note(clean_note)

    try:
        supabase_client.table("cases").insert({
            "id": case_id,
            "user_id": user_id,
            "input_hash": note_hash,
        }).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create case: {str(e)}")

    # Log the action
    background_tasks.add_task(
        log_action,
        supabase_client,
        user_id,
        "analyze_note",
        "case",
        case_id,
        request.client.host if request.client else None,
        request.headers.get("user-agent"),
        {"word_count": len(clean_note.split())},
        getattr(request.state, "request_id", None)
    )

    # Schedule evidence fetch as background task (after response)
    background_tasks.add_task(
        _background_evidence_fetch,
        clean_note,
        case_id,
        supabase_client
    )

    return EventSourceResponse(
        generate_analysis_stream(clean_note, user_id, case_id, supabase_client, request)
    )


async def _background_evidence_fetch(note_text: str, case_id: str, supabase_client):
    """Background task to fetch and store evidence."""
    try:
        case_resp = supabase_client.table("cases").select("entities").eq("id", case_id).single().execute()
        if case_resp.data and case_resp.data.get("entities"):
            evidence = await fetch_evidence(case_resp.data["entities"], case_id, supabase_client)
            if evidence:
                supabase_client.table("cases").update(
                    {"entities": {**case_resp.data.get("entities", {}), "_evidence": evidence}}
                ).eq("id", case_id).execute()
    except Exception:
        pass
