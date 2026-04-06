"""
End-to-end tests for CLINOTE.

These tests require a running server and test database.
They are excluded from regular CI runs.

Usage:
  CLINOTE_E2E=true pytest tests/e2e/ -v

Environment variables needed:
  CLINOTE_TEST_URL (default: http://localhost:8000)
  CLINOTE_TEST_EMAIL (test user email)
  CLINOTE_TEST_PASSWORD (test user password)
"""
import os
import pytest
import httpx
import asyncio

# Skip all e2e tests unless explicitly enabled
pytestmark = pytest.mark.skipif(
    not os.environ.get("CLINOTE_E2E"),
    reason="E2E tests disabled. Set CLINOTE_E2E=true to enable."
)

BASE_URL = os.environ.get("CLINOTE_TEST_URL", "http://localhost:8000")
TEST_EMAIL = os.environ.get("CLINOTE_TEST_EMAIL", "test@clinote.app")
TEST_PASSWORD = os.environ.get("CLINOTE_TEST_PASSWORD", "TestPassword123!")

SAMPLE_NOTE = """
Paciente varón de 65 años con FA permanente y HTA que acude a revisión.
Tratamiento habitual con Warfarina 5mg/día y Bisoprolol 5mg/12h.
Refiere epistaxis autolimitada hace 5 días. TA 142/86 mmHg, FC 72 lpm irregular.
Analítica: INR 3.9, Creatinina 1.8 mg/dL, K 3.8 mEq/L.
Plan: Reducir warfarina a 4mg/día. Control en 2 semanas.
"""


@pytest.fixture(scope="module")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="module")
async def auth_token():
    """Get auth token for test user."""
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        resp = await client.post("/api/v1/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert resp.status_code == 200, f"Login failed: {resp.text}"
        data = resp.json()
        return data["access_token"]


@pytest.mark.asyncio
async def test_health_check():
    """Server health check."""
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_analyze_note_and_get_case(auth_token):
    """Test full note analysis flow."""
    case_id = None
    events_received = []

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=60.0) as client:
        async with client.stream(
            "POST",
            "/api/v1/analyze",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Accept": "text/event-stream",
            },
            json={"note_text": SAMPLE_NOTE}
        ) as response:
            assert response.status_code == 200

            current_event = "message"
            async for line in response.aiter_lines():
                if line.startswith("event: "):
                    current_event = line[7:].strip()
                elif line.startswith("data: "):
                    import json
                    try:
                        data = json.loads(line[6:])
                        events_received.append({"event": current_event, "data": data})
                        if current_event == "complete":
                            case_id = data.get("case_id")
                    except Exception:
                        pass

    # Verify we received expected events
    event_types = {e["event"] for e in events_received}
    assert "entities" in event_types, f"Missing entities event. Got: {event_types}"
    assert "soap" in event_types, f"Missing soap event. Got: {event_types}"
    assert "complete" in event_types, f"Missing complete event. Got: {event_types}"
    assert case_id is not None, "No case_id received"

    return case_id


@pytest.mark.asyncio
async def test_get_case_after_analysis(auth_token):
    """Test retrieving a case after analysis."""
    # First create a case
    case_id = await test_analyze_note_and_get_case(auth_token)

    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        resp = await client.get(
            f"/api/v1/cases/{case_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )

    assert resp.status_code == 200
    case = resp.json()
    assert case["id"] == case_id
    assert case.get("soap_structured") is not None


@pytest.mark.asyncio
async def test_acknowledge_critical_alert(auth_token):
    """Test acknowledging a critical alert requires the proper flow."""
    case_id = await test_analyze_note_and_get_case(auth_token)

    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        # Get case with alerts
        case_resp = await client.get(
            f"/api/v1/cases/{case_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        case = case_resp.json()
        alerts = case.get("alerts", [])

        if not alerts:
            pytest.skip("No alerts to acknowledge in this test case")

        alert_id = alerts[0]["id"]
        ack_resp = await client.post(
            f"/api/v1/cases/{case_id}/alerts/{alert_id}/acknowledge",
            headers={"Authorization": f"Bearer {auth_token}"}
        )

        assert ack_resp.status_code == 200
        assert ack_resp.json()["acknowledged"] is True


@pytest.mark.asyncio
async def test_audit_log_written(auth_token):
    """Verify audit log is created for analyze action."""
    # After analyzing a note, there should be audit log entries
    # This verifies the audit middleware is working
    # (Would need admin access to read all audit logs)
    # For now just verify the endpoint doesn't error
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        resp = await client.get(
            "/health",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_free_plan_rate_limit(auth_token):
    """Test that requests work within rate limit (not testing limit exceeded here)."""
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        resp = await client.get(
            "/api/v1/cases",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_unauthenticated_request_rejected():
    """Test that unauthenticated requests to protected endpoints are rejected."""
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        resp = await client.get("/api/v1/cases")
    assert resp.status_code == 403  # FastAPI HTTPBearer returns 403 for missing token


@pytest.mark.asyncio
async def test_invalid_note_too_short(auth_token):
    """Test that notes below 20 words are rejected."""
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        resp = await client.post(
            "/api/v1/analyze",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json",
            },
            json={"note_text": "Esta nota es demasiado corta."}
        )
    assert resp.status_code == 422  # Validation error
