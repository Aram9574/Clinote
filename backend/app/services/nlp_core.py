import json
import time
import asyncio
from typing import AsyncIterator, Optional
import anthropic

from app.config import get_settings
from app.models.internal import NLPResult, ParsedEntities, SOAPNote
from prompts.nlp_extraction import NLP_SYSTEM_PROMPT, build_nlp_prompt, TEMPLATE_SECTION_INSTRUCTIONS


async def extract_clinical_entities(
    note_text: str,
    template_id: str = "soap",
) -> AsyncIterator[dict]:
    """
    Stream NLP extraction results via SSE-compatible async generator.
    Yields dicts with keys: section, data, done
    """
    settings = get_settings()
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    start_time = time.time()

    yield {"section": "status", "data": {"stage": "Detectando tipo de nota..."}, "done": False}

    full_response = ""

    async with client.messages.stream(
        model=settings.claude_model,
        max_tokens=4096,
        system=NLP_SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": build_nlp_prompt(note_text, template_id)}
        ]
    ) as stream:
        yield {"section": "status", "data": {"stage": "Extrayendo entidades clínicas..."}, "done": False}

        async for text in stream.text_stream:
            full_response += text

    processing_ms = int((time.time() - start_time) * 1000)

    try:
        # Clean potential markdown code blocks
        clean_response = full_response.strip()
        if clean_response.startswith("```"):
            clean_response = clean_response.split("```")[1]
            if clean_response.startswith("json"):
                clean_response = clean_response[4:]
        if clean_response.endswith("```"):
            clean_response = clean_response[:-3]

        parsed = json.loads(clean_response.strip())

        note_type = parsed.get("note_type", "unknown")
        entities_data = parsed.get("entities", {})
        soap_data = parsed.get("soap", {})

        yield {"section": "note_type", "data": {"note_type": note_type}, "done": False}
        yield {"section": "entities", "data": entities_data, "done": False}
        yield {"section": "soap", "data": soap_data, "done": False}
        yield {
            "section": "metadata",
            "data": {
                "processing_ms": processing_ms,
                "model_version": get_settings().claude_model,
                "word_count": len(note_text.split())
            },
            "done": False
        }
        yield {"section": "complete", "data": {}, "done": True}

    except (json.JSONDecodeError, KeyError) as e:
        yield {
            "section": "error",
            "data": {"message": f"Error parsing NLP response: {str(e)}", "raw": full_response[:500]},
            "done": True
        }


async def extract_entities_sync(note_text: str) -> NLPResult:
    """Non-streaming version for internal use."""
    settings = get_settings()
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    start_time = time.time()

    message = await client.messages.create(
        model=settings.claude_model,
        max_tokens=4096,
        system=NLP_SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": build_nlp_prompt(note_text)}
        ]
    )

    processing_ms = int((time.time() - start_time) * 1000)

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    if raw.endswith("```"):
        raw = raw[:-3]

    parsed = json.loads(raw.strip())

    entities_data = parsed.get("entities", {})
    entities = ParsedEntities(**entities_data)
    soap_data = parsed.get("soap", {})
    soap = SOAPNote(**soap_data)

    return NLPResult(
        note_type=parsed.get("note_type", "unknown"),
        entities=entities,
        soap=soap,
        processing_ms=processing_ms,
        model_version=settings.claude_model
    )
