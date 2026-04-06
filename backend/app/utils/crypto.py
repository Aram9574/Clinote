import hashlib


def hash_note(note_text: str) -> str:
    """Create SHA-256 hash of note for deduplication."""
    return hashlib.sha256(note_text.encode('utf-8')).hexdigest()
