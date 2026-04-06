from pydantic import BaseModel
from typing import Optional, List, Any
from enum import Enum


class NoteType(str, Enum):
    ambulatory = "ambulatory"
    emergency = "emergency"
    discharge = "discharge"
    unknown = "unknown"


class AlertSeverity(str, Enum):
    critical = "critical"
    warning = "warning"
    info = "info"


class AlertCategory(str, Enum):
    drug_interaction = "drug_interaction"
    critical_value = "critical_value"
    differential_diagnosis = "differential_diagnosis"
    drug_disease_interaction = "drug_disease_interaction"
    monitoring_gap = "monitoring_gap"
    guideline_deviation = "guideline_deviation"


class DiagnosisResponse(BaseModel):
    display: str
    snomed_placeholder: Optional[str] = None
    confidence: float
    negated: bool = False
    temporal: str = "current"


class MedicationResponse(BaseModel):
    name: str
    dose: Optional[str] = None
    frequency: Optional[str] = None
    route: Optional[str] = None
    status: Optional[str] = None
    rxnorm_placeholder: Optional[str] = None


class ProcedureResponse(BaseModel):
    name: str
    date_mentioned: Optional[str] = None
    status: Optional[str] = None


class VitalResponse(BaseModel):
    type: str
    value: str
    unit: Optional[str] = None
    timestamp_mentioned: Optional[str] = None


class AllergyResponse(BaseModel):
    substance: str
    reaction: Optional[str] = None
    severity: Optional[str] = None


class LabValueResponse(BaseModel):
    name: str
    value: str
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    flag: Optional[str] = None


class ClinicalEntitiesResponse(BaseModel):
    diagnoses: List[DiagnosisResponse] = []
    medications: List[MedicationResponse] = []
    procedures: List[ProcedureResponse] = []
    vitals: List[VitalResponse] = []
    allergies: List[AllergyResponse] = []
    lab_values: List[LabValueResponse] = []
    chief_complaint: Optional[str] = None
    physical_exam: dict = {}


class SOAPResponse(BaseModel):
    S: str = ""
    O: str = ""
    A: str = ""
    P: str = ""


class AlertResponse(BaseModel):
    id: str
    case_id: str
    severity: AlertSeverity
    category: AlertCategory
    message: str
    detail: Optional[str] = None
    source: Optional[str] = None
    acknowledged: bool = False
    acknowledged_at: Optional[str] = None
    created_at: str


class CaseResponse(BaseModel):
    id: str
    user_id: str
    note_type: NoteType
    word_count: Optional[int] = None
    processing_ms: Optional[int] = None
    model_version: Optional[str] = None
    soap_structured: Optional[SOAPResponse] = None
    entities: Optional[ClinicalEntitiesResponse] = None
    alerts: List[AlertResponse] = []
    created_at: str


class CaseListItem(BaseModel):
    id: str
    note_type: NoteType
    word_count: Optional[int] = None
    processing_ms: Optional[int] = None
    alert_count: int = 0
    critical_alert_count: int = 0
    created_at: str


class EvidenceItem(BaseModel):
    title: str
    source: str
    year: Optional[str] = None
    summary: Optional[str] = None
    url: Optional[str] = None
    pmid: Optional[str] = None


class AnalyzeStreamEvent(BaseModel):
    section: str
    data: Any
    done: bool = False
