from pydantic import BaseModel, Field, validator
from typing import Optional


class AnalyzeRequest(BaseModel):
    note_text: str = Field(..., min_length=1, max_length=15000)
    note_type_hint: Optional[str] = Field(None, pattern="^(ambulatory|emergency|discharge|unknown)$")
    template_id: Optional[str] = Field("soap", max_length=50)

    @validator('note_text')
    def validate_word_count(cls, v):
        words = len(v.split())
        if words < 20:
            raise ValueError(f'Note must have at least 20 words, got {words}')
        if words > 2000:
            raise ValueError(f'Note must have at most 2000 words, got {words}')
        return v.strip()


class AcknowledgeAlertRequest(BaseModel):
    pass  # No body needed, just the action


class UpdateSOAPRequest(BaseModel):
    # Support any template section keys (SOAP, DAR, PIE, BIRP, etc.)
    model_config = {"extra": "allow"}

    S: Optional[str] = Field(None, max_length=5000)
    O: Optional[str] = Field(None, max_length=5000)
    A: Optional[str] = Field(None, max_length=5000)
    P: Optional[str] = Field(None, max_length=5000)
