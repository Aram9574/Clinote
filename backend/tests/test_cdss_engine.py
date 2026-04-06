import pytest
from app.services.cdss_engine import check_critical_values, _parse_numeric_value
from app.models.internal import ClinicalAlert


def test_parse_numeric_value():
    assert _parse_numeric_value("6.8 mEq/L") == 6.8
    assert _parse_numeric_value("128") == 128.0
    assert _parse_numeric_value("3.8") == 3.8
    assert _parse_numeric_value("text") is None


def test_critical_potassium_high():
    lab_values = [{"name": "k", "value": "6.8 mEq/L", "unit": "mEq/L"}]
    alerts = check_critical_values(lab_values)
    assert len(alerts) == 1
    assert alerts[0].severity == "critical"
    assert alerts[0].category == "critical_value"
    assert "K" in alerts[0].message or "potasio" in alerts[0].message.lower() or "k" in alerts[0].message.lower()


def test_critical_potassium_high_exact():
    """Test that K > 6.5 is flagged as critical."""
    lab_values = [{"name": "potasio", "value": "6.5", "unit": "mEq/L"}]
    alerts = check_critical_values(lab_values)
    assert any(a.severity == "critical" for a in alerts), "K=6.5 should be critical"


def test_warning_potassium_high():
    lab_values = [{"name": "potasio", "value": "5.8", "unit": "mEq/L"}]
    alerts = check_critical_values(lab_values)
    assert len(alerts) == 1
    assert alerts[0].severity == "warning"


def test_critical_sodium_low():
    lab_values = [{"name": "na", "value": "118", "unit": "mEq/L"}]
    alerts = check_critical_values(lab_values)
    assert len(alerts) == 1
    assert alerts[0].severity == "critical"


def test_critical_hemoglobin_low():
    lab_values = [{"name": "hb", "value": "4.5", "unit": "g/dL"}]
    alerts = check_critical_values(lab_values)
    assert len(alerts) == 1
    assert alerts[0].severity == "critical"


def test_warning_hemoglobin():
    lab_values = [{"name": "hemoglobina", "value": "6.5", "unit": "g/dL"}]
    alerts = check_critical_values(lab_values)
    assert len(alerts) == 1
    assert alerts[0].severity == "warning"


def test_normal_values_no_alerts():
    lab_values = [
        {"name": "k", "value": "4.1", "unit": "mEq/L"},
        {"name": "na", "value": "138", "unit": "mEq/L"},
        {"name": "creatinina", "value": "1.1", "unit": "mg/dL"},
    ]
    alerts = check_critical_values(lab_values)
    assert len(alerts) == 0


def test_multiple_critical_values():
    lab_values = [
        {"name": "k", "value": "6.8", "unit": "mEq/L"},
        {"name": "na", "value": "118", "unit": "mEq/L"},
        {"name": "ph", "value": "7.05", "unit": ""},
    ]
    alerts = check_critical_values(lab_values)
    assert len(alerts) == 3
    assert all(a.severity == "critical" for a in alerts)


def test_bnp_elevated():
    lab_values = [{"name": "bnp", "value": "450", "unit": "pg/mL"}]
    alerts = check_critical_values(lab_values)
    assert len(alerts) == 1
    assert alerts[0].severity == "critical"


def test_troponin_critical():
    lab_values = [{"name": "troponina", "value": "0.15", "unit": "ng/mL"}]
    alerts = check_critical_values(lab_values)
    assert len(alerts) == 1
    assert alerts[0].severity == "critical"
