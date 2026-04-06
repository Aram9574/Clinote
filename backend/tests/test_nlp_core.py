import pytest
import json
from unittest.mock import AsyncMock, MagicMock, patch


@pytest.mark.asyncio
async def test_extract_entities_returns_correct_structure():
    """Test that NLP extraction returns properly structured entities."""
    mock_response_data = {
        "note_type": "ambulatory",
        "entities": {
            "diagnoses": [
                {"display": "Fibrilación auricular", "negated": False, "temporal": "current", "confidence": 0.95, "snomed_placeholder": None}
            ],
            "medications": [
                {"name": "Warfarina", "dose": "5mg", "frequency": "cada 24h", "route": "oral", "status": "active", "rxnorm_placeholder": "warfarin"}
            ],
            "procedures": [],
            "vitals": [{"type": "TA", "value": "138/84", "unit": "mmHg", "timestamp_mentioned": None}],
            "allergies": [],
            "lab_values": [{"name": "INR", "value": "3.8", "unit": "", "reference_range": "2-3", "flag": "high"}],
            "chief_complaint": "Revisión anual",
            "physical_exam": {"corazon": "arrítmico"}
        },
        "soap": {
            "S": "Paciente acude a revisión anual",
            "O": "TA 138/84 mmHg, FC 68 lpm irregular. INR 3.8",
            "A": "1. Fibrilación auricular permanente (INR supraterapeútico)",
            "P": "Reducir warfarina. Control en 2 semanas."
        }
    }

    mock_stream = AsyncMock()
    mock_stream.__aenter__ = AsyncMock(return_value=mock_stream)
    mock_stream.__aexit__ = AsyncMock(return_value=None)

    async def fake_text_stream():
        yield json.dumps(mock_response_data)

    mock_stream.text_stream = fake_text_stream()

    with patch("anthropic.AsyncAnthropic") as mock_anthropic:
        mock_client = MagicMock()
        mock_anthropic.return_value = mock_client
        mock_client.messages.stream.return_value = mock_stream

        from app.services.nlp_core import extract_clinical_entities

        events = []
        async for event in extract_clinical_entities("Paciente varón de 72 años con FA permanente en tratamiento con Warfarina 5mg. INR actual 3.8. TA 138/84 mmHg. Revisión anual de cardiología."):
            events.append(event)

        sections = {e["section"] for e in events}
        assert "entities" in sections
        assert "soap" in sections
        assert "note_type" in sections


@pytest.mark.asyncio
async def test_extract_entities_handles_negation():
    """Test that negated entities (niega, no presenta) are properly flagged."""
    mock_response_data = {
        "note_type": "emergency",
        "entities": {
            "diagnoses": [
                {"display": "TEP", "negated": True, "temporal": "current", "confidence": 0.1, "snomed_placeholder": None},
                {"display": "EPOC", "negated": False, "temporal": "current", "confidence": 0.9, "snomed_placeholder": None}
            ],
            "medications": [],
            "procedures": [],
            "vitals": [],
            "allergies": [],
            "lab_values": [],
            "chief_complaint": "Disnea",
            "physical_exam": {}
        },
        "soap": {"S": "Disnea", "O": "", "A": "EPOC. TEP descartado.", "P": ""}
    }

    mock_stream = AsyncMock()
    mock_stream.__aenter__ = AsyncMock(return_value=mock_stream)
    mock_stream.__aexit__ = AsyncMock(return_value=None)

    async def fake_text_stream():
        yield json.dumps(mock_response_data)

    mock_stream.text_stream = fake_text_stream()

    with patch("anthropic.AsyncAnthropic") as mock_anthropic:
        mock_client = MagicMock()
        mock_anthropic.return_value = mock_client
        mock_client.messages.stream.return_value = mock_stream

        from app.services.nlp_core import extract_clinical_entities

        events = []
        async for event in extract_clinical_entities("Disnea aguda. Descarta TEP clínicamente. EPOC conocida. Niega TVP."):
            events.append(event)

        entities_event = next((e for e in events if e["section"] == "entities"), None)
        assert entities_event is not None
        diagnoses = entities_event["data"].get("diagnoses", [])
        negated = [d for d in diagnoses if d.get("negated")]
        assert len(negated) >= 1
