import uuid
from datetime import datetime, timezone
from typing import Optional


def _fhir_uuid() -> str:
    return str(uuid.uuid4())


def _fhir_datetime(dt_str: Optional[str] = None) -> str:
    if dt_str:
        return dt_str
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _map_temporal_to_clinical_status(temporal: str) -> str:
    mapping = {
        "current": "active",
        "historical": "resolved",
        "family": "resolved"
    }
    return mapping.get(temporal, "active")


def _map_negated_to_verification(negated: bool) -> str:
    return "refuted" if negated else "confirmed"


def map_entities_to_fhir(entities: dict, patient_id: str = None) -> dict:
    """Convert extracted clinical entities to FHIR R4 Bundle."""
    bundle_id = _fhir_uuid()
    if patient_id is None:
        patient_id = _fhir_uuid()

    composition_id = _fhir_uuid()
    entries = []
    section_references = []

    # Patient resource (pseudonymized)
    patient_entry = {
        "fullUrl": f"urn:uuid:{patient_id}",
        "resource": {
            "resourceType": "Patient",
            "id": patient_id,
            "meta": {"profile": ["http://hl7.org/fhir/StructureDefinition/Patient"]}
        }
    }
    entries.append(patient_entry)

    # Conditions (diagnoses)
    condition_refs = []
    for diag in entities.get("diagnoses", []):
        condition_id = _fhir_uuid()
        condition_refs.append({"reference": f"urn:uuid:{condition_id}"})
        entries.append({
            "fullUrl": f"urn:uuid:{condition_id}",
            "resource": {
                "resourceType": "Condition",
                "id": condition_id,
                "clinicalStatus": {
                    "coding": [{
                        "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                        "code": _map_temporal_to_clinical_status(diag.get("temporal", "current"))
                    }]
                },
                "verificationStatus": {
                    "coding": [{
                        "system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
                        "code": _map_negated_to_verification(diag.get("negated", False))
                    }]
                },
                "code": {
                    "text": diag.get("display", ""),
                    "coding": [{"system": "http://snomed.info/sct", "display": diag.get("display", "")}]
                    if diag.get("snomed_placeholder") else []
                },
                "subject": {"reference": f"urn:uuid:{patient_id}"},
                "extension": [{
                    "url": "http://clinote.app/fhir/StructureDefinition/confidence",
                    "valueDecimal": diag.get("confidence", 0.5)
                }]
            }
        })

    if condition_refs:
        section_references.append({
            "title": "Diagnósticos",
            "code": {"coding": [{"system": "http://loinc.org", "code": "11450-4"}]},
            "entry": condition_refs
        })

    # MedicationStatements
    med_refs = []
    for med in entities.get("medications", []):
        med_stmt_id = _fhir_uuid()
        med_refs.append({"reference": f"urn:uuid:{med_stmt_id}"})

        status_map = {
            "active": "active",
            "discontinued": "stopped",
            "prescribed": "intended",
            "prn": "active"
        }
        fhir_status = status_map.get(med.get("status", "active"), "active")

        entries.append({
            "fullUrl": f"urn:uuid:{med_stmt_id}",
            "resource": {
                "resourceType": "MedicationStatement",
                "id": med_stmt_id,
                "status": fhir_status,
                "medicationCodeableConcept": {
                    "text": med.get("name", ""),
                    "coding": [{"system": "http://www.nlm.nih.gov/research/umls/rxnorm", "display": med.get("rxnorm_placeholder") or med.get("name", "")}]
                },
                "subject": {"reference": f"urn:uuid:{patient_id}"},
                "dosage": [{
                    "text": " ".join(filter(None, [med.get("dose"), med.get("frequency"), med.get("route")])) or None,
                    "route": {"text": med.get("route")} if med.get("route") else None,
                }] if any([med.get("dose"), med.get("frequency"), med.get("route")]) else []
            }
        })

    if med_refs:
        section_references.append({
            "title": "Medicamentos",
            "code": {"coding": [{"system": "http://loinc.org", "code": "10160-0"}]},
            "entry": med_refs
        })

    # Observations (vitals + lab values)
    obs_refs = []
    for vital in entities.get("vitals", []):
        obs_id = _fhir_uuid()
        obs_refs.append({"reference": f"urn:uuid:{obs_id}"})
        entries.append({
            "fullUrl": f"urn:uuid:{obs_id}",
            "resource": {
                "resourceType": "Observation",
                "id": obs_id,
                "status": "final",
                "category": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "vital-signs"}]}],
                "code": {"text": vital.get("type", "")},
                "subject": {"reference": f"urn:uuid:{patient_id}"},
                "valueString": f"{vital.get('value', '')} {vital.get('unit', '')}".strip()
            }
        })

    for lab in entities.get("lab_values", []):
        obs_id = _fhir_uuid()
        obs_refs.append({"reference": f"urn:uuid:{obs_id}"})

        interpretation = None
        flag = lab.get("flag")
        if flag == "critical":
            interpretation = [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", "code": "AA"}]}]
        elif flag == "high":
            interpretation = [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", "code": "H"}]}]
        elif flag == "low":
            interpretation = [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", "code": "L"}]}]

        obs_resource = {
            "resourceType": "Observation",
            "id": obs_id,
            "status": "final",
            "category": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "laboratory"}]}],
            "code": {"text": lab.get("name", "")},
            "subject": {"reference": f"urn:uuid:{patient_id}"},
            "valueString": f"{lab.get('value', '')} {lab.get('unit', '')}".strip()
        }
        if interpretation:
            obs_resource["interpretation"] = interpretation
        if lab.get("reference_range"):
            obs_resource["referenceRange"] = [{"text": lab.get("reference_range")}]

        entries.append({"fullUrl": f"urn:uuid:{obs_id}", "resource": obs_resource})

    if obs_refs:
        section_references.append({
            "title": "Observaciones",
            "code": {"coding": [{"system": "http://loinc.org", "code": "30954-2"}]},
            "entry": obs_refs
        })

    # AllergyIntolerances
    allergy_refs = []
    for allergy in entities.get("allergies", []):
        allergy_id = _fhir_uuid()
        allergy_refs.append({"reference": f"urn:uuid:{allergy_id}"})

        criticality_map = {"mild": "low", "moderate": "high", "severe": "high", "unknown": "unable-to-assess"}

        entries.append({
            "fullUrl": f"urn:uuid:{allergy_id}",
            "resource": {
                "resourceType": "AllergyIntolerance",
                "id": allergy_id,
                "clinicalStatus": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical", "code": "active"}]},
                "verificationStatus": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification", "code": "confirmed"}]},
                "criticality": criticality_map.get(allergy.get("severity", "unknown"), "unable-to-assess"),
                "code": {"text": allergy.get("substance", "")},
                "patient": {"reference": f"urn:uuid:{patient_id}"},
                "reaction": [{"manifestation": [{"text": allergy.get("reaction", "")}]}] if allergy.get("reaction") else []
            }
        })

    if allergy_refs:
        section_references.append({
            "title": "Alergias",
            "code": {"coding": [{"system": "http://loinc.org", "code": "48765-2"}]},
            "entry": allergy_refs
        })

    # Procedures
    proc_refs = []
    for proc in entities.get("procedures", []):
        proc_id = _fhir_uuid()
        proc_refs.append({"reference": f"urn:uuid:{proc_id}"})

        status_map = {"completed": "completed", "planned": "preparation", "cancelled": "not-done"}

        entries.append({
            "fullUrl": f"urn:uuid:{proc_id}",
            "resource": {
                "resourceType": "Procedure",
                "id": proc_id,
                "status": status_map.get(proc.get("status", "completed"), "completed"),
                "code": {"text": proc.get("name", "")},
                "subject": {"reference": f"urn:uuid:{patient_id}"}
            }
        })

    if proc_refs:
        section_references.append({
            "title": "Procedimientos",
            "code": {"coding": [{"system": "http://loinc.org", "code": "47519-4"}]},
            "entry": proc_refs
        })

    # Composition
    composition_entry = {
        "fullUrl": f"urn:uuid:{composition_id}",
        "resource": {
            "resourceType": "Composition",
            "id": composition_id,
            "status": "final",
            "type": {"coding": [{"system": "http://loinc.org", "code": "11503-0", "display": "Medical records"}]},
            "subject": {"reference": f"urn:uuid:{patient_id}"},
            "date": _fhir_datetime(),
            "author": [{"display": "CLINOTE NLP System"}],
            "title": "Nota Clínica Estructurada",
            "section": section_references
        }
    }
    entries.insert(0, composition_entry)

    return {
        "resourceType": "Bundle",
        "id": bundle_id,
        "type": "document",
        "timestamp": _fhir_datetime(),
        "entry": entries
    }
