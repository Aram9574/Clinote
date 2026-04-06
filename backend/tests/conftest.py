import os
import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from tests.fixtures.clinical_notes_es import ALL_NOTES

# Inject dummy env vars before any app imports so Pydantic Settings doesn't fail
os.environ.setdefault("ANTHROPIC_API_KEY", "sk-ant-test-key")
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-anon-key")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379")
os.environ.setdefault("STRIPE_SECRET_KEY", "sk_test_dummy")
os.environ.setdefault("STRIPE_WEBHOOK_SECRET", "whsec_test_dummy")


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def mock_anthropic_client():
    """Mock Anthropic client for tests that don't need real API calls."""
    with patch("anthropic.AsyncAnthropic") as mock:
        yield mock


@pytest.fixture
def sample_entities_cardiology():
    return {
        "diagnoses": [
            {"display": "Fibrilación auricular", "negated": False, "temporal": "current", "confidence": 0.95},
            {"display": "Insuficiencia renal crónica", "negated": False, "temporal": "current", "confidence": 0.9},
            {"display": "Hipertensión arterial", "negated": False, "temporal": "current", "confidence": 0.95},
            {"display": "Diabetes mellitus tipo 2", "negated": False, "temporal": "current", "confidence": 0.9},
        ],
        "medications": [
            {"name": "Warfarina", "dose": "5mg", "frequency": "cada 24h", "rxnorm_placeholder": "warfarin"},
            {"name": "Bisoprolol", "dose": "5mg", "frequency": "cada 12h", "rxnorm_placeholder": "bisoprolol"},
            {"name": "Ramipril", "dose": "5mg", "frequency": "cada 24h", "rxnorm_placeholder": "ramipril"},
            {"name": "Metformina", "dose": "850mg", "frequency": "cada 12h", "rxnorm_placeholder": "metformin"},
        ],
        "lab_values": [
            {"name": "INR", "value": "3.8", "unit": "", "flag": "high"},
            {"name": "Creatinina", "value": "2.4", "unit": "mg/dL", "flag": "high"},
            {"name": "K", "value": "5.2", "unit": "mEq/L", "flag": "high"},
        ],
        "vitals": [
            {"type": "TA", "value": "138/84", "unit": "mmHg"},
            {"type": "FC", "value": "68", "unit": "lpm"},
        ],
        "procedures": [],
        "allergies": [
            {"substance": "AINES", "reaction": "urticaria", "severity": "moderate"},
        ],
        "chief_complaint": "Revisión anual de cardiología",
        "physical_exam": {}
    }


@pytest.fixture
def sample_entities_polypharmacy():
    return {
        "diagnoses": [
            {"display": "Fibrilación auricular", "negated": False, "temporal": "current", "confidence": 0.95},
            {"display": "Insuficiencia cardíaca congestiva", "negated": False, "temporal": "current", "confidence": 0.9},
            {"display": "Intoxicación digitálica", "negated": False, "temporal": "current", "confidence": 0.95},
        ],
        "medications": [
            {"name": "Warfarina", "rxnorm_placeholder": "warfarin"},
            {"name": "AAS", "rxnorm_placeholder": "aspirin"},
            {"name": "Digoxina", "rxnorm_placeholder": "digoxin"},
            {"name": "Furosemida", "rxnorm_placeholder": "furosemide"},
            {"name": "Espironolactona", "rxnorm_placeholder": "spironolactone"},
            {"name": "Metformina", "rxnorm_placeholder": "metformin"},
            {"name": "Sertralina", "rxnorm_placeholder": "sertraline"},
        ],
        "lab_values": [
            {"name": "Na", "value": "128", "unit": "mEq/L", "flag": "low"},
            {"name": "K", "value": "5.8", "unit": "mEq/L", "flag": "high"},
            {"name": "Creatinina", "value": "2.8", "unit": "mg/dL", "flag": "high"},
            {"name": "BNP", "value": "890", "unit": "pg/mL", "flag": "high"},
        ],
        "vitals": [],
        "procedures": [],
        "allergies": [],
        "chief_complaint": "Empeoramiento estado general, náuseas, confusión",
        "physical_exam": {}
    }
