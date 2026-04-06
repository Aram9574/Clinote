"""
Input sanitizer for clinical note text.
Protects against prompt injection while preserving valid clinical text.
"""
import re
import logging
from typing import Tuple

logger = logging.getLogger(__name__)

# Patterns that indicate prompt injection attempts
INJECTION_PATTERNS = [
    # Classic instruction override patterns
    (r"ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions?", "instruction_override"),
    (r"disregard\s+(?:all\s+)?(?:previous|prior|above)\s+instructions?", "instruction_override"),
    (r"forget\s+(?:all\s+)?(?:previous|prior|above)\s+instructions?", "instruction_override"),
    (r"you\s+are\s+now\s+(?:a\s+)?(?:different|new|another)", "role_override"),
    (r"act\s+as\s+(?:if\s+you\s+are\s+)?(?:a\s+)?(?:different|new)", "role_override"),
    # System/role markers
    (r"<\|system\|>", "system_marker"),
    (r"<\|user\|>", "user_marker"),
    (r"<\|assistant\|>", "assistant_marker"),
    (r"\[SYSTEM\]", "system_marker"),
    (r"\[INST\]", "instruction_marker"),
    (r"<<SYS>>", "system_marker"),
    # Direct role injection
    (r"^system\s*:", "system_prefix"),
    (r"^assistant\s*:", "assistant_prefix"),
    # Jailbreak patterns
    (r"DAN\s+mode", "jailbreak"),
    (r"developer\s+mode", "jailbreak"),
    (r"jailbreak", "jailbreak"),
    # Excessive special characters that aren't clinical
    (r"[{}\[\]<>]{5,}", "excessive_special_chars"),
]

# Clinical text patterns to preserve (whitelist - these should NOT be flagged)
CLINICAL_PRESERVE_PATTERNS = [
    r"\d+\s*(?:mg|mcg|µg|g|ml|L|mEq|mmol|mmHg|lpm|rpm|°C|%)",  # drug doses/measurements
    r"(?:HTA|DM2|IRC|FA|EPOC|IAM|ACV|TEP|TVP|IRA)",  # Spanish medical abbreviations
    r"<\s*\d+",  # Lab values like "< 5"
    r">\s*\d+",  # Lab values like "> 100"
]


def sanitize_clinical_text(text: str) -> Tuple[str, bool, list]:
    """
    Sanitize clinical note text to remove prompt injection patterns.

    Args:
        text: Raw clinical note text

    Returns:
        Tuple of (sanitized_text, was_modified, list_of_removed_patterns)

    Design principle: Never reject valid clinical text. Only clean obvious injection attempts.
    Clinical abbreviations and special notation must be preserved.
    """
    if not text:
        return text, False, []

    sanitized = text
    removed_patterns = []

    for pattern, pattern_type in INJECTION_PATTERNS:
        # Check if this is a clinical false positive
        matches = list(re.finditer(pattern, sanitized, re.IGNORECASE | re.MULTILINE))

        for match in matches:
            match_text = match.group()

            # Check if this match overlaps with a clinical pattern (preserve it)
            is_clinical = False
            for clinical_pattern in CLINICAL_PRESERVE_PATTERNS:
                if re.search(clinical_pattern, match_text, re.IGNORECASE):
                    is_clinical = True
                    break

            if not is_clinical:
                removed_patterns.append({
                    "pattern_type": pattern_type,
                    "original_text": match_text[:100]
                })

        if matches and not all(
            any(re.search(cp, m.group(), re.IGNORECASE) for cp in CLINICAL_PRESERVE_PATTERNS)
            for m in matches
        ):
            sanitized = re.sub(pattern, "[CONTENIDO ELIMINADO]", sanitized, flags=re.IGNORECASE | re.MULTILINE)

    was_modified = sanitized != text
    return sanitized, was_modified, removed_patterns


def sanitize_and_log(
    text: str,
    user_id: str = None,
    audit_service=None,
    supabase_client=None,
    request_id: str = None
) -> str:
    """
    Sanitize text and log any sanitization events.

    Returns sanitized text. Never throws exceptions.
    """
    try:
        sanitized, was_modified, removed_patterns = sanitize_clinical_text(text)

        if was_modified:
            logger.warning(
                f"Input sanitization modified text for user {user_id}. "
                f"Removed patterns: {[p['pattern_type'] for p in removed_patterns]}"
            )

            # Log to audit if available (fire and forget)
            if audit_service and supabase_client and user_id:
                import asyncio
                try:
                    loop = asyncio.get_event_loop()
                    if loop.is_running():
                        asyncio.ensure_future(
                            audit_service.log_action(
                                supabase_client,
                                user_id,
                                "input_sanitized",
                                metadata={
                                    "patterns_removed": [p['pattern_type'] for p in removed_patterns],
                                    "request_id": request_id
                                }
                            )
                        )
                except Exception:
                    pass

        return sanitized

    except Exception as e:
        logger.error(f"Sanitizer error (returning original): {e}")
        return text  # Never reject valid text due to sanitizer error
