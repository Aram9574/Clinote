import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.interaction_checker import check_interactions, get_rxcui
from app.services.cdss_engine import _deduplicate_and_sort_alerts
from app.models.internal import ClinicalAlert


@pytest.mark.asyncio
async def test_check_interactions_warfarin_aspirin():
    """Test that warfarin + aspirin interaction is detected."""
    medications = [
        {"name": "Warfarina", "rxnorm_placeholder": "warfarin"},
        {"name": "AAS", "rxnorm_placeholder": "aspirin"}
    ]

    mock_rxcui_response = {
        "idGroup": {"rxnormId": ["202421"]}
    }
    mock_rxcui_aspirin = {
        "idGroup": {"rxnormId": ["1191"]}
    }
    mock_interaction_response = {
        "fullInteractionTypeGroup": [{
            "fullInteractionType": [{
                "interactionPair": [{
                    "severity": "high",
                    "description": "Warfarin and aspirin increase bleeding risk",
                    "interactionConcept": [
                        {"minConceptItem": {"name": "warfarin"}},
                        {"minConceptItem": {"name": "aspirin"}}
                    ]
                }]
            }]
        }]
    }

    import httpx

    async def mock_get(url, **kwargs):
        mock_resp = MagicMock()
        mock_resp.raise_for_status = MagicMock()
        if "rxcui" in url and "warfarin" in str(kwargs.get("params", {})):
            mock_resp.json.return_value = mock_rxcui_response
        elif "rxcui" in url:
            mock_resp.json.return_value = mock_rxcui_aspirin
        elif "interaction/list" in url:
            mock_resp.json.return_value = mock_interaction_response
        else:
            mock_resp.json.return_value = {}
        return mock_resp

    with patch("httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client.get = mock_get
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client_class.return_value = mock_client

        alerts = await check_interactions(medications)

    assert len(alerts) > 0
    assert any(a.severity == "critical" for a in alerts)
    assert any(a.category == "drug_interaction" for a in alerts)


@pytest.mark.asyncio
async def test_no_interactions_single_drug():
    medications = [{"name": "Paracetamol", "rxnorm_placeholder": "acetaminophen"}]
    with patch("httpx.AsyncClient"):
        alerts = await check_interactions(medications)
    assert alerts == []


def test_deduplicate_alerts():
    alerts = [
        ClinicalAlert(severity="critical", category="drug_interaction", message="Interacción warfarina", source="rxnorm"),
        ClinicalAlert(severity="critical", category="drug_interaction", message="Interacción warfarina", source="rxnorm"),  # duplicate
        ClinicalAlert(severity="warning", category="critical_value", message="K elevado", source="rules"),
        ClinicalAlert(severity="info", category="monitoring_gap", message="Monitorización", source="llm"),
    ]
    result = _deduplicate_and_sort_alerts(alerts)
    assert len(result) == 3
    assert result[0].severity == "critical"
    assert result[1].severity == "warning"
    assert result[2].severity == "info"


def test_sort_alerts_by_severity():
    alerts = [
        ClinicalAlert(severity="info", category="monitoring_gap", message="Info alert", source="llm"),
        ClinicalAlert(severity="critical", category="critical_value", message="Critical alert", source="rules"),
        ClinicalAlert(severity="warning", category="drug_interaction", message="Warning alert", source="rxnorm"),
    ]
    result = _deduplicate_and_sort_alerts(alerts)
    assert result[0].severity == "critical"
    assert result[1].severity == "warning"
    assert result[2].severity == "info"


def test_max_10_alerts():
    alerts = [
        ClinicalAlert(severity="info", category="monitoring_gap", message=f"Alert {i}", source="llm")
        for i in range(15)
    ]
    result = _deduplicate_and_sort_alerts(alerts)
    assert len(result) <= 10
