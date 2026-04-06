import asyncio
import httpx
from typing import List, Optional
from app.config import get_settings
from app.models.internal import ClinicalAlert


# RxNorm API endpoints
RXNORM_BASE = "https://rxnav.nlm.nih.gov/REST"


async def get_rxcui(drug_name: str, client: httpx.AsyncClient) -> Optional[str]:
    """Get RxCUI for a drug name from RxNorm."""
    try:
        resp = await client.get(
            f"{RXNORM_BASE}/rxcui.json",
            params={"name": drug_name, "allsrc": "0"},
            timeout=5.0
        )
        resp.raise_for_status()
        data = resp.json()
        rxcui = data.get("idGroup", {}).get("rxnormId", [])
        return rxcui[0] if rxcui else None
    except Exception:
        return None


async def check_interactions(medications: list) -> List[ClinicalAlert]:
    """
    Check drug interactions using RxNorm API.
    Returns list of ClinicalAlert objects for high/moderate severity interactions.
    """
    if len(medications) < 2:
        return []

    alerts = []

    async with httpx.AsyncClient() as client:
        # Get RxCUI for each medication
        rxcui_tasks = [
            get_rxcui(med.get("rxnorm_placeholder") or med.get("name", ""), client)
            for med in medications
        ]
        rxcuis = await asyncio.gather(*rxcui_tasks)

        # Filter to valid RxCUIs
        valid_rxcuis = [r for r in rxcuis if r is not None]

        if len(valid_rxcuis) < 2:
            return []

        # Check interactions for all valid RxCUIs
        try:
            resp = await client.get(
                f"{RXNORM_BASE}/interaction/list.json",
                params={"rxcuis": " ".join(valid_rxcuis)},
                timeout=10.0
            )
            resp.raise_for_status()
            data = resp.json()

            full_interactions = data.get("fullInteractionTypeGroup", [])
            for group in full_interactions:
                for interaction_type in group.get("fullInteractionType", []):
                    for pair in interaction_type.get("interactionPair", []):
                        severity = pair.get("severity", "").lower()
                        if severity in ("high", "moderate"):
                            drug1 = pair.get("interactionConcept", [{}])[0].get(
                                "minConceptItem", {}).get("name", "")
                            drug2 = ""
                            if len(pair.get("interactionConcept", [])) > 1:
                                drug2 = pair["interactionConcept"][1].get(
                                    "minConceptItem", {}).get("name", "")

                            description = pair.get("description", "")

                            alert_severity = "critical" if severity == "high" else "warning"

                            alerts.append(ClinicalAlert(
                                severity=alert_severity,
                                category="drug_interaction",
                                message=f"Interacción {'crítica' if severity == 'high' else 'importante'}: {drug1} + {drug2}",
                                detail=description,
                                source="rxnorm"
                            ))

        except Exception:
            # Graceful degradation
            pass

    return alerts
