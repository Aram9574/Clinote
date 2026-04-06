import re
from typing import Optional


def validate_note_text(text: str) -> tuple[bool, Optional[str]]:
    """Validate clinical note text. Returns (is_valid, error_message)."""
    if not text or not text.strip():
        return False, "El texto de la nota no puede estar vacío"

    words = text.split()
    word_count = len(words)

    if word_count < 20:
        return False, f"La nota debe tener al menos 20 palabras (tiene {word_count})"

    if word_count > 2000:
        return False, f"La nota no puede superar las 2000 palabras (tiene {word_count})"

    return True, None


def sanitize_clinical_text(text: str) -> str:
    """Basic sanitization for clinical text - removes obvious prompt injection patterns."""
    injection_patterns = [
        r"ignore\s+(previous|all)\s+instructions",
        r"disregard\s+(previous|all)\s+instructions",
        r"<\|system\|>",
        r"<\|user\|>",
        r"<\|assistant\|>",
    ]

    cleaned = text
    for pattern in injection_patterns:
        cleaned = re.sub(pattern, "[REDACTED]", cleaned, flags=re.IGNORECASE)

    return cleaned
