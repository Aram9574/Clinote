import asyncio
import json
from typing import List
import anthropic

from app.config import get_settings
from app.models.internal import ClinicalAlert
from app.services.interaction_checker import check_interactions
from prompts.cdss_contextual import CDSS_SYSTEM_PROMPT, build_cdss_prompt


CRITICAL_VALUE_THRESHOLDS = {
    "glucosa": (40.0, 70.0, 400.0, 500.0),
    "glucemia": (40.0, 70.0, 400.0, 500.0),
    "glucose": (40.0, 70.0, 400.0, 500.0),
    "potasio": (2.5, 3.0, 5.5, 6.5),
    "potassium": (2.5, 3.0, 5.5, 6.5),
    "k": (2.5, 3.0, 5.5, 6.5),
    "sodio": (120.0, 130.0, 150.0, 160.0),
    "sodium": (120.0, 130.0, 150.0, 160.0),
    "na": (120.0, 130.0, 150.0, 160.0),
    "creatinina": (None, None, 5.0, 10.0),
    "creatinine": (None, None, 5.0, 10.0),
    "cr": (None, None, 5.0, 10.0),
    "hemoglobina": (5.0, 7.0, None, None),
    "hemoglobin": (5.0, 7.0, None, None),
    "hb": (5.0, 7.0, None, None),
    "inr": (None, None, 3.5, 5.0),
    "ph": (7.10, 7.25, 7.55, 7.65),
    "po2": (40.0, 55.0, None, None),
    "pao2": (40.0, 55.0, None, None),
    "pco2": (20.0, 30.0, 55.0, 70.0),
    "paco2": (20.0, 30.0, 55.0, 70.0),
    "hco3": (10.0, 15.0, 35.0, 45.0),
    "bicarbonato": (10.0, 15.0, 35.0, 45.0),
    "calcio": (6.0, 7.5, 11.0, 13.0),
    "calcium": (6.0, 7.5, 11.0, 13.0),
    "ca": (6.0, 7.5, 11.0, 13.0),
    "magnesio": (1.0, 1.5, 4.0, 6.0),
    "magnesium": (1.0, 1.5, 4.0, 6.0),
    "mg": (1.0, 1.5, 4.0, 6.0),
    "fosforo": (1.0, 1.5, 7.0, 9.0),
    "phosphorus": (1.0, 1.5, 7.0, 9.0),
    "troponina": (None, None, 0.04, 0.1),
    "troponin": (None, None, 0.04, 0.1),
    "bnp": (None, None, 100.0, 400.0),
    "procalcitonina": (None, None, 0.5, 2.0),
    "procalcitonin": (None, None, 0.5, 2.0),
    "lactato": (None, None, 2.0, 4.0),
    "lactate": (None, None, 2.0, 4.0),
    "amoniaco": (None, None, 80.0, 150.0),
    "ammonia": (None, None, 80.0, 150.0),
    "bilirrubina": (None, None, 10.0, 20.0),
    "bilirubin": (None, None, 10.0, 20.0),
    "bt": (None, None, 10.0, 20.0),
    "plaquetas": (20000.0, 50000.0, 1000000.0, 1500000.0),
    "platelets": (20000.0, 50000.0, 1000000.0, 1500000.0),
    "leucocitos": (1.0, 2.0, 30.0, 50.0),
    "wbc": (1.0, 2.0, 30.0, 50.0),
    "neutrofilos": (0.5, 1.0, None, None),
    "neutrophils": (0.5, 1.0, None, None),
    "tp": (None, None, 20.0, 30.0),
    "ttpa": (None, None, 80.0, 120.0),
    "dd": (None, None, 500.0, 2000.0),
    "d-dimero": (None, None, 500.0, 2000.0),
}

CRITICAL_VALUE_ACTIONS = {
    "glucosa": "Valorar insulina IV / glucagón según contexto. Control glucémico urgente.",
    "glucemia": "Valorar insulina IV / glucagón según contexto. Control glucémico urgente.",
    "potasio": "ECG urgente. Si K>6.5: gluconato cálcico IV + insulina+glucosa. Si K<2.5: reposición IV.",
    "sodio": "Corrección gradual de sodio. Si Na<120 sintomático: solución salina hipertónica controlada.",
    "creatinina": "Valorar nefrología urgente. Revisar nefrotóxicos. Ajuste de dosis de medicamentos.",
    "hemoglobina": "Transfusión si Hb<7 o inestabilidad hemodinámica. Buscar causa de sangrado.",
    "inr": "Vitamina K ± plasma fresco congelado según contexto clínico y sangrado activo.",
    "ph": "Gasometría completa. Identificar causa. UCI si pH<7.20.",
    "troponina": "Protocolo SCA. ECG seriados. Cardiología urgente.",
    "bnp": "Valorar insuficiencia cardíaca aguda. Ecocardiograma.",
    "procalcitonina": "Valorar sepsis. Hemocultivos. Antibioterapia empírica según foco.",
    "lactato": "Valorar hipoperfusión tisular. Resucitación y búsqueda de foco séptico.",
}


def _parse_numeric_value(value_str: str) -> float | None:
    import re
    match = re.search(r"[-+]?\d*\.?\d+", str(value_str))
    if match:
        try:
            return float(match.group())
        except ValueError:
            return None
    return None


def check_critical_values(lab_values: list) -> List[ClinicalAlert]:
    alerts = []
    for lab in lab_values:
        name = lab.get("name", "").lower().strip()
        value_str = lab.get("value", "")
        numeric_value = _parse_numeric_value(value_str)
        if numeric_value is None:
            continue
        thresholds = CRITICAL_VALUE_THRESHOLDS.get(name)
        if thresholds is None:
            continue
        low_crit, low_warn, high_warn, high_crit = thresholds
        action = CRITICAL_VALUE_ACTIONS.get(name, "Valorar urgentemente con equipo clínico.")
        if high_crit is not None and numeric_value >= high_crit:
            alerts.append(ClinicalAlert(
                severity="critical", category="critical_value",
                message=f"Valor crítico: {lab.get('name')} = {value_str} (>{high_crit})",
                detail=action, source="rules"
            ))
        elif low_crit is not None and numeric_value <= low_crit:
            alerts.append(ClinicalAlert(
                severity="critical", category="critical_value",
                message=f"Valor crítico bajo: {lab.get('name')} = {value_str} (<{low_crit})",
                detail=action, source="rules"
            ))
        elif high_warn is not None and numeric_value >= high_warn:
            alerts.append(ClinicalAlert(
                severity="warning", category="critical_value",
                message=f"Valor elevado: {lab.get('name')} = {value_str}",
                detail=action, source="rules"
            ))
        elif low_warn is not None and numeric_value <= low_warn:
            alerts.append(ClinicalAlert(
                severity="warning", category="critical_value",
                message=f"Valor bajo: {lab.get('name')} = {value_str}",
                detail=action, source="rules"
            ))
    return alerts


async def run_contextual_cdss(entities: dict, existing_alerts: List[ClinicalAlert]) -> List[ClinicalAlert]:
    diagnoses = [d for d in entities.get("diagnoses", []) if not d.get("negated")]
    medications = entities.get("medications", [])
    if len(diagnoses) < 2 and len(medications) < 3:
        return []
    settings = get_settings()
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    try:
        existing_alert_dicts = [a.model_dump() for a in existing_alerts]
        message = await client.messages.create(
            model=settings.claude_model,
            max_tokens=1024,
            system=CDSS_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": build_cdss_prompt(entities, existing_alert_dicts)}]
        )
        raw = message.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        if raw.endswith("```"):
            raw = raw[:-3]
        parsed = json.loads(raw.strip())
        alerts_data = parsed.get("alerts", [])
        return [
            ClinicalAlert(
                severity=a.get("severity", "info"),
                category=a.get("category", "differential_diagnosis"),
                message=a.get("message", ""),
                detail=a.get("detail"),
                source="llm"
            )
            for a in alerts_data[:3]
        ]
    except Exception:
        return []


def _deduplicate_and_sort_alerts(alerts: List[ClinicalAlert]) -> List[ClinicalAlert]:
    severity_order = {"critical": 0, "warning": 1, "info": 2}
    seen = set()
    unique = []
    for alert in alerts:
        key = (alert.category, alert.message[:50])
        if key not in seen:
            seen.add(key)
            unique.append(alert)
    return sorted(unique, key=lambda a: severity_order.get(a.severity, 99))[:10]


async def run_cdss(entities: dict) -> List[ClinicalAlert]:
    medications = entities.get("medications", [])
    lab_values = entities.get("lab_values", [])

    interaction_alerts, _ = await asyncio.gather(
        check_interactions(medications),
        asyncio.sleep(0)
    )
    critical_value_alerts = check_critical_values(lab_values)
    combined_early = list(interaction_alerts) + list(critical_value_alerts)
    contextual_alerts = await run_contextual_cdss(entities, combined_early)
    return _deduplicate_and_sort_alerts(combined_early + contextual_alerts)
