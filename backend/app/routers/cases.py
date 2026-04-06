from fastapi import APIRouter, Depends, HTTPException, Request, Response
from app.middleware.auth import get_current_user_with_profile, get_supabase_client
from app.models.request import UpdateSOAPRequest
from app.services.audit_service import log_action
from app.services.pdf_generator import generate_case_pdf
from datetime import datetime, timezone

router = APIRouter()


@router.get("/cases")
async def list_cases(
    page: int = 1,
    per_page: int = 20,
    user_data=Depends(get_current_user_with_profile),
    supabase_client=Depends(get_supabase_client)
):
    user_id = user_data["profile"]["id"]
    offset = (page - 1) * per_page

    cases_resp = supabase_client.table("cases").select(
        "id, note_type, word_count, processing_ms, created_at, alerts(id, severity)"
    ).eq("user_id", user_id).order("created_at", desc=True).range(offset, offset + per_page - 1).execute()

    cases = []
    for case in (cases_resp.data or []):
        alerts = case.pop("alerts", [])
        cases.append({
            **case,
            "alert_count": len(alerts),
            "critical_alert_count": sum(1 for a in alerts if a.get("severity") == "critical")
        })

    return {"cases": cases, "page": page, "per_page": per_page}


@router.get("/cases/{case_id}")
async def get_case(
    case_id: str,
    user_data=Depends(get_current_user_with_profile),
    supabase_client=Depends(get_supabase_client)
):
    user_id = user_data["profile"]["id"]

    case_resp = supabase_client.table("cases").select(
        "*, alerts(*)"
    ).eq("id", case_id).eq("user_id", user_id).single().execute()

    if not case_resp.data:
        raise HTTPException(status_code=404, detail="Case not found")

    return case_resp.data


@router.patch("/cases/{case_id}/soap")
async def update_soap(
    case_id: str,
    soap_update: UpdateSOAPRequest,
    request: Request,
    user_data=Depends(get_current_user_with_profile),
    supabase_client=Depends(get_supabase_client)
):
    user_id = user_data["profile"]["id"]

    existing = supabase_client.table("cases").select("soap_structured, user_id").eq("id", case_id).single().execute()
    if not existing.data or existing.data.get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Case not found")

    current_soap = existing.data.get("soap_structured") or {}
    update_data = soap_update.model_dump(exclude_none=True)
    updated_soap = {**current_soap, **update_data}

    supabase_client.table("cases").update({"soap_structured": updated_soap}).eq("id", case_id).execute()

    await log_action(
        supabase_client, user_id, "update_soap", "case", case_id,
        request.client.host if request.client else None,
        request.headers.get("user-agent"),
        request_id=getattr(request.state, "request_id", None)
    )

    return {"success": True, "soap_structured": updated_soap}


@router.post("/cases/{case_id}/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    case_id: str,
    alert_id: str,
    request: Request,
    user_data=Depends(get_current_user_with_profile),
    supabase_client=Depends(get_supabase_client)
):
    user_id = user_data["profile"]["id"]

    # Verify ownership
    case_check = supabase_client.table("cases").select("user_id").eq("id", case_id).single().execute()
    if not case_check.data or case_check.data.get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Case not found")

    supabase_client.table("alerts").update({
        "acknowledged": True,
        "acknowledged_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", alert_id).eq("case_id", case_id).execute()

    await log_action(
        supabase_client, user_id, "acknowledge_alert", "alert", alert_id,
        request.client.host if request.client else None,
        request.headers.get("user-agent"),
        request_id=getattr(request.state, "request_id", None)
    )

    return {"success": True, "acknowledged": True}


@router.get("/cases/{case_id}/evidence")
async def get_evidence(
    case_id: str,
    user_data=Depends(get_current_user_with_profile),
    supabase_client=Depends(get_supabase_client)
):
    user_id = user_data["profile"]["id"]

    case_resp = supabase_client.table("cases").select("entities, user_id").eq("id", case_id).single().execute()
    if not case_resp.data or case_resp.data.get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Case not found")

    entities = case_resp.data.get("entities") or {}
    evidence = entities.get("_evidence", [])

    return {"evidence": evidence, "case_id": case_id}


@router.get("/cases/{case_id}/export/pdf")
async def export_case_pdf(
    case_id: str,
    request: Request,
    user_data=Depends(get_current_user_with_profile),
    supabase_client=Depends(get_supabase_client)
):
    user_id = user_data["profile"]["id"]

    case_resp = supabase_client.table("cases").select(
        "id, note_type, created_at, soap_structured, entities, user_id"
    ).eq("id", case_id).single().execute()

    if not case_resp.data or case_resp.data.get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Case not found")

    pdf_bytes = generate_case_pdf(case_resp.data)

    await log_action(
        supabase_client, user_id, "export_pdf", "case", case_id,
        request.client.host if request.client else None,
        request.headers.get("user-agent"),
        request_id=getattr(request.state, "request_id", None)
    )

    return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=clinote_case_{case_id}.pdf"})
