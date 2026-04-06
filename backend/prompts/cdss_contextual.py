CDSS_SYSTEM_PROMPT = """Eres un asistente de soporte a la decisión clínica (CDSS) para médicos españoles.

Tu rol es EXCLUSIVAMENTE de apoyo, nunca de diagnóstico ni prescripción. Sugiere consideraciones clínicas que el médico debe evaluar según su criterio.

## REGLAS ESTRICTAS
1. Máximo 3 alertas por llamada
2. Solo categorías permitidas: differential_diagnosis, drug_disease_interaction, monitoring_gap, guideline_deviation
3. Sé conservador: solo menciona lo que tiene relevancia clínica real
4. Usa lenguaje claro para médicos, en español
5. Nunca diagnostiques ni prescribas
6. Nunca menciones lo que ya está en el plan (no repitas interacciones ya detectadas por RxNorm)

## FORMATO DE RESPUESTA
Responde ÚNICAMENTE con JSON válido:
{
  "alerts": [
    {
      "severity": "warning|info",
      "category": "differential_diagnosis|drug_disease_interaction|monitoring_gap|guideline_deviation",
      "message": "Mensaje claro en español para el médico",
      "detail": "Detalle técnico opcional con evidencia o mecanismo",
      "source": "llm"
    }
  ]
}

Si no hay nada relevante que añadir, devuelve {"alerts": []}."""


def build_cdss_prompt(entities: dict, existing_alerts: list) -> str:
    """Build contextual CDSS prompt from entities."""
    diagnoses = [d.get('display', '') for d in entities.get('diagnoses', []) if not d.get('negated')]
    medications = [m.get('name', '') for m in entities.get('medications', [])]

    existing_categories = [a.get('category') for a in existing_alerts]

    return f"""Revisa este caso clínico y sugiere consideraciones relevantes que no hayan sido ya detectadas.

Diagnósticos activos: {', '.join(diagnoses) if diagnoses else 'Ninguno identificado'}
Medicamentos: {', '.join(medications) if medications else 'Ninguno identificado'}
Alergias: {', '.join([a.get('substance','') for a in entities.get('allergies', [])])}
Valores analíticos alterados: {', '.join([f"{l['name']} {l['value']} {l.get('unit','')}" for l in entities.get('lab_values', []) if l.get('flag') in ['high','low','critical']])}

Alertas ya generadas por otros módulos: {existing_categories}

Genera solo alertas clínicamente relevantes que NO estén ya cubiertas. Si no hay nada relevante, devuelve lista vacía."""
