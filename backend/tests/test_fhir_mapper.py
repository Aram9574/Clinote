import pytest
from app.services.fhir_mapper import map_entities_to_fhir


def test_fhir_bundle_structure(sample_entities_cardiology):
    bundle = map_entities_to_fhir(sample_entities_cardiology)

    assert bundle["resourceType"] == "Bundle"
    assert bundle["type"] == "document"
    assert "id" in bundle
    assert "timestamp" in bundle
    assert "entry" in bundle
    assert len(bundle["entry"]) > 0


def test_fhir_has_composition(sample_entities_cardiology):
    bundle = map_entities_to_fhir(sample_entities_cardiology)
    resource_types = [e["resource"]["resourceType"] for e in bundle["entry"]]
    assert "Composition" in resource_types
    assert "Patient" in resource_types


def test_fhir_conditions_from_diagnoses(sample_entities_cardiology):
    bundle = map_entities_to_fhir(sample_entities_cardiology)
    conditions = [e["resource"] for e in bundle["entry"] if e["resource"]["resourceType"] == "Condition"]
    assert len(conditions) == len(sample_entities_cardiology["diagnoses"])


def test_fhir_negated_condition_refuted():
    entities = {
        "diagnoses": [
            {"display": "TEP", "negated": True, "temporal": "current", "confidence": 0.1}
        ],
        "medications": [], "procedures": [], "vitals": [],
        "allergies": [], "lab_values": [], "chief_complaint": None, "physical_exam": {}
    }
    bundle = map_entities_to_fhir(entities)
    conditions = [e["resource"] for e in bundle["entry"] if e["resource"]["resourceType"] == "Condition"]
    assert len(conditions) == 1
    verification = conditions[0]["verificationStatus"]["coding"][0]["code"]
    assert verification == "refuted"


def test_fhir_historical_condition_resolved():
    entities = {
        "diagnoses": [
            {"display": "IAM antiguo", "negated": False, "temporal": "historical", "confidence": 0.9}
        ],
        "medications": [], "procedures": [], "vitals": [],
        "allergies": [], "lab_values": [], "chief_complaint": None, "physical_exam": {}
    }
    bundle = map_entities_to_fhir(entities)
    conditions = [e["resource"] for e in bundle["entry"] if e["resource"]["resourceType"] == "Condition"]
    assert conditions[0]["clinicalStatus"]["coding"][0]["code"] == "resolved"


def test_fhir_medication_statements(sample_entities_cardiology):
    bundle = map_entities_to_fhir(sample_entities_cardiology)
    med_statements = [e["resource"] for e in bundle["entry"] if e["resource"]["resourceType"] == "MedicationStatement"]
    assert len(med_statements) == len(sample_entities_cardiology["medications"])


def test_fhir_observations_for_vitals(sample_entities_cardiology):
    bundle = map_entities_to_fhir(sample_entities_cardiology)
    observations = [e["resource"] for e in bundle["entry"] if e["resource"]["resourceType"] == "Observation"]
    expected_count = len(sample_entities_cardiology["vitals"]) + len(sample_entities_cardiology["lab_values"])
    assert len(observations) == expected_count


def test_fhir_allergy_intolerances(sample_entities_cardiology):
    bundle = map_entities_to_fhir(sample_entities_cardiology)
    allergies = [e["resource"] for e in bundle["entry"] if e["resource"]["resourceType"] == "AllergyIntolerance"]
    assert len(allergies) == len(sample_entities_cardiology["allergies"])


def test_fhir_entry_uuids_unique(sample_entities_cardiology):
    bundle = map_entities_to_fhir(sample_entities_cardiology)
    ids = [e["resource"]["id"] for e in bundle["entry"]]
    assert len(ids) == len(set(ids))
