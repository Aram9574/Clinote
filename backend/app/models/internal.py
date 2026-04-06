from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class ParsedEntities(BaseModel):
    note_type: str = "unknown"
    diagnoses: List[dict] = []
    medications: List[dict] = []
    procedures: List[dict] = []
    vitals: List[dict] = []
    allergies: List[dict] = []
    lab_values: List[dict] = []
    chief_complaint: Optional[str] = None
    physical_exam: dict = {}


class SOAPNote(BaseModel):
    S: str = ""
    O: str = ""
    A: str = ""
    P: str = ""


class ClinicalAlert(BaseModel):
    severity: str  # critical, warning, info
    category: str
    message: str  # Plain Spanish message
    detail: Optional[str] = None  # Technical detail
    source: str  # rxnorm, rules, llm


class CDSSResult(BaseModel):
    alerts: List[ClinicalAlert] = []


class NLPResult(BaseModel):
    note_type: str
    entities: ParsedEntities
    soap: SOAPNote
    processing_ms: int
    model_version: str
