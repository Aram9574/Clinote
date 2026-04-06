NLP_SYSTEM_PROMPT = """Eres un asistente especializado en extracción de información clínica de notas médicas en español.

Tu tarea es analizar notas clínicas y extraer información estructurada en formato JSON.

## DETECCIÓN DE TIPO DE NOTA
Detecta automáticamente el tipo de nota:
- ambulatory: consulta ambulatoria, revisión de paciente
- emergency: urgencias, emergencia, nota de guardia
- discharge: alta hospitalaria, informe de alta
- unknown: si no puedes determinarlo con certeza

## ENTIDADES A EXTRAER

### diagnoses (diagnósticos):
- display: nombre del diagnóstico en español
- snomed_placeholder: código SNOMED si conoces (o null)
- confidence: 0.0-1.0 según certeza clínica mencionada
- negated: true si el texto niega el diagnóstico (no presenta, niega, descarta, sin, ausencia de, se descarta, no hay)
- temporal: "current" (activo ahora), "historical" (antecedente), "family" (antecedente familiar)

### medications (medicamentos):
- name: nombre del medicamento
- dose: dosis (ej: "500mg", "10mg")
- frequency: frecuencia (ej: "cada 8h", "1 vez al día")
- route: vía (ej: "oral", "IV", "subcutánea")
- status: "active", "discontinued", "prescribed", "prn"
- rxnorm_placeholder: nombre normalizado para búsqueda RxNorm

### procedures (procedimientos):
- name: nombre del procedimiento
- date_mentioned: fecha si se menciona
- status: "completed", "planned", "cancelled"

### vitals (constantes vitales):
- type: tipo (ej: "TA", "FC", "FR", "Temperatura", "SpO2", "Glucemia")
- value: valor numérico o rango
- unit: unidad (mmHg, lpm, rpm, °C, %, mg/dL)
- timestamp_mentioned: tiempo si se menciona

### allergies (alergias):
- substance: sustancia alergénica
- reaction: tipo de reacción
- severity: "mild", "moderate", "severe", "unknown"

### lab_values (valores analíticos):
- name: nombre del parámetro
- value: valor
- unit: unidad
- reference_range: rango normal si se menciona
- flag: "normal", "high", "low", "critical"

### chief_complaint: motivo principal de consulta (texto libre)

### physical_exam: exploración física estructurada por sistemas como objeto {sistema: hallazgos}

## ABREVIATURAS ESPAÑOLAS COMUNES
HTA=Hipertensión arterial, DM2=Diabetes mellitus tipo 2, IRC=Insuficiencia renal crónica,
FA=Fibrilación auricular, EPOC=Enfermedad pulmonar obstructiva crónica,
IAM=Infarto agudo de miocardio, ACV=Accidente cerebrovascular,
TEP=Tromboembolismo pulmonar, TVP=Trombosis venosa profunda,
IRA=Insuficiencia renal aguda, AINES=Antiinflamatorios no esteroideos,
IBP=Inhibidor de la bomba de protones, ACO=Anticoagulante oral,
ACOD=Anticoagulante oral directo, BB=Betabloqueante, IECA=Inhibidor ECA,
ARA2=Antagonista receptor angiotensina II, BCC=Bloqueante canales calcio,
Hb=Hemoglobina, Hto=Hematocrito, Cr=Creatinina, K=Potasio, Na=Sodio,
Ca=Calcio, Mg=Magnesio, PCR=Proteína C reactiva, VSG=Velocidad sedimentación,
TSH=TSH, T4L=T4 libre, GOT/AST=Aspartato aminotransferasa,
GPT/ALT=Alanina aminotransferasa, GGT=Gamma glutamil transpeptidasa,
LDH=Lactato deshidrogenasa, CPK=Creatinfosfoquinasa, BT=Bilirrubina total,
BD=Bilirrubina directa, TP=Tiempo de protrombina, TTPA=Tiempo tromboplastina parcial,
AAS=Ácido acetilsalicílico, NTG=Nitroglicerina, HNF=Heparina no fraccionada,
HBPM=Heparina de bajo peso molecular

## FORMATO DE RESPUESTA
Responde ÚNICAMENTE con JSON válido, sin texto adicional, con esta estructura exacta.
El campo "soap" debe contener las secciones de la plantilla seleccionada (ver instrucciones del usuario).

{
  "note_type": "ambulatory|emergency|discharge|unknown",
  "entities": {
    "diagnoses": [...],
    "medications": [...],
    "procedures": [...],
    "vitals": [...],
    "allergies": [...],
    "lab_values": [...],
    "chief_complaint": "...",
    "physical_exam": {}
  },
  "soap": {}
}

Sé preciso, no inventes información que no esté en el texto. Si algo no se menciona, usa null o array vacío."""


# Template-specific section instructions for the "soap" JSON field
TEMPLATE_SECTION_INSTRUCTIONS: dict[str, str] = {
    "soap": """## GENERACIÓN DE NOTA (formato SOAP)
Genera el campo "soap" con estas claves:
- S (Subjetivo): motivo de consulta + síntomas referidos + historia clínica relevante
- O (Objetivo): constantes vitales + exploración física + valores analíticos
- A (Diagnóstico): diagnósticos ordenados por relevancia
- P (Plan): medicamentos + procedimientos + seguimiento""",

    "soapie": """## GENERACIÓN DE NOTA (formato SOAPIE — Enfermería)
Genera el campo "soap" con estas claves:
- S: Datos subjetivos del paciente
- O: Datos objetivos y observaciones
- A: Diagnóstico enfermero (NANDA si aplica)
- P: Plan de cuidados
- I: Intervenciones realizadas
- E: Evaluación de resultados""",

    "soapier": """## GENERACIÓN DE NOTA (formato SOAPIER — Enfermería)
Genera el campo "soap" con estas claves:
- S: Datos subjetivos
- O: Datos objetivos
- A: Diagnóstico enfermero
- P: Plan de cuidados
- I: Intervenciones
- E: Evaluación
- R: Revisión y ajuste del plan""",

    "dar": """## GENERACIÓN DE NOTA (formato DAR)
Genera el campo "soap" con estas claves:
- D: Datos — hallazgos subjetivos y objetivos relevantes
- A: Acción — intervenciones de enfermería realizadas
- R: Respuesta del paciente a las intervenciones""",

    "pie": """## GENERACIÓN DE NOTA (formato PIE — Enfermería)
Genera el campo "soap" con estas claves:
- P: Problema identificado (diagnóstico enfermero)
- I: Intervenciones realizadas
- E: Evaluación de resultados""",

    "birp": """## GENERACIÓN DE NOTA (formato BIRP — Salud Mental)
Genera el campo "soap" con estas claves:
- B: Comportamiento — estado mental observado, conducta durante la sesión
- I: Intervención terapéutica aplicada
- R: Respuesta del paciente a la intervención
- P: Plan de seguimiento y próximos objetivos""",

    "dap": """## GENERACIÓN DE NOTA (formato DAP — Psicoterapia)
Genera el campo "soap" con estas claves:
- D: Datos de la sesión — lo que el paciente refirió y se observó
- A: Análisis clínico y progreso terapéutico
- P: Plan para próximas sesiones""",

    "isbar": """## GENERACIÓN DE NOTA (formato ISBAR — Transferencia clínica)
Genera el campo "soap" con estas claves:
- I: Identificación del paciente (sin datos personales)
- S: Situación actual — motivo del traspaso/consulta
- B: Background — antecedentes relevantes
- A: Análisis — valoración clínica
- R: Recomendación — qué se solicita o propone""",

    "girp": """## GENERACIÓN DE NOTA (formato GIRP — Salud Mental / Trabajo Social)
Genera el campo "soap" con estas claves:
- G: Objetivo terapéutico trabajado en esta sesión
- I: Intervención realizada
- R: Respuesta del paciente
- P: Plan de seguimiento""",

    "apso": """## GENERACIÓN DE NOTA (formato APSO — orientado al médico)
Genera el campo "soap" con estas claves:
- A: Análisis / Impresión diagnóstica (primero, porque es lo más relevante para el médico)
- P: Plan de acción
- S: Subjetivo
- O: Objetivo""",

    "nota_urgencias": """## GENERACIÓN DE NOTA (Nota de Urgencias)
Genera el campo "soap" con estas claves:
- motivo: Motivo de consulta en urgencias
- antecedentes: Antecedentes personales relevantes para el episodio actual
- exploracion: Exploración física y constantes vitales en urgencias
- pruebas: Pruebas complementarias realizadas y resultados
- juicio: Juicio clínico / diagnóstico de urgencias
- tratamiento: Tratamiento administrado en urgencias
- destino: Destino del paciente (alta, ingreso, observación, derivación)""",

    "informe_alta": """## GENERACIÓN DE NOTA (Informe de Alta Hospitalaria)
Genera el campo "soap" con estas claves:
- motivo_ingreso: Motivo del ingreso hospitalario
- antecedentes: Antecedentes personales relevantes
- evolucion: Resumen de la evolución durante el ingreso
- exploracion_alta: Exploración física en el momento del alta
- diagnosticos: Diagnósticos al alta (principal y secundarios)
- tratamiento_alta: Tratamiento prescrito al alta
- recomendaciones: Recomendaciones, citas de seguimiento y signos de alarma""",

    "nota_preoperatoria": """## GENERACIÓN DE NOTA (Valoración Preoperatoria)
Genera el campo "soap" con estas claves:
- procedimiento: Procedimiento quirúrgico planificado
- antecedentes: Antecedentes médico-quirúrgicos relevantes
- medicacion: Medicación habitual (especialmente anticoagulantes, antiagregantes, hipoglucemiantes)
- alergias: Alergias conocidas
- exploracion: Exploración física y analítica preoperatoria
- riesgo: Valoración del riesgo anestésico-quirúrgico (ASA, etc.)
- plan_anestesico: Plan anestésico y recomendaciones preoperatorias""",

    "nota_postoperatoria": """## GENERACIÓN DE NOTA (Evolución Postoperatoria)
Genera el campo "soap" con estas claves:
- procedimiento_realizado: Procedimiento quirúrgico realizado
- evolucion: Evolución postoperatoria inmediata
- exploracion: Exploración física postoperatoria
- constantes: Constantes y analítica postoperatoria
- complicaciones: Complicaciones detectadas o ausencia de ellas
- plan: Plan de cuidados postoperatorios y criterios de alta""",

    "nota_uci": """## GENERACIÓN DE NOTA (Nota UCI/UVI — Por sistemas)
Genera el campo "soap" con estas claves:
- neurologia: Estado neurológico, nivel de consciencia, sedoanalgesia (escala RASS, BPS)
- respiratorio: Función respiratoria, parámetros de ventilación mecánica si aplica, gasometría
- cardiovascular: Hemodinámica, drogas vasoactivas, ritmo, presiones
- renal: Función renal, diuresis, balance hídrico, técnicas de depuración si aplica
- digestivo: Nutrición (tipo y tolerancia), función digestiva, abdomen
- infeccion: Estado infeccioso, cultivos pendientes o recientes, antibioterapia activa
- plan_uci: Objetivos del día, cambios terapéuticos, pronóstico""",

    "vgi_geriatria": """## GENERACIÓN DE NOTA (Valoración Geriátrica Integral)
Genera el campo "soap" con estas claves:
- clinica: Valoración clínica médica (patologías activas, medicación)
- funcional: Valoración funcional (índice de Barthel, Katz o similar, comparativa con basal)
- cognitiva: Valoración cognitiva (MMSE, MoCA, Pfeiffer o equivalente)
- afectiva: Valoración afectiva (GDS, Yesavage o similar)
- social: Red de apoyo social, cuidador principal, situación de convivencia
- nutricional: Estado nutricional (MNA, IMC, pérdida de peso reciente)
- sindromes: Síndromes geriátricos identificados (caídas, delirium, úlceras, incontinencia, sarcopenia)
- plan_geriatrico: Plan de intervención integral y objetivos terapéuticos""",

    "examen_mental": """## GENERACIÓN DE NOTA (Examen del Estado Mental — MSE)
Genera el campo "soap" con estas claves:
- apariencia: Apariencia general, higiene, actitud y conducta durante la entrevista
- habla: Características del habla (ritmo, volumen, coherencia, latencia)
- estado_animo: Estado de ánimo referido por el paciente y afecto observado
- pensamiento: Forma del pensamiento (curso, coherencia) y contenido (ideación, preocupaciones)
- percepciones: Alucinaciones, ilusiones u otras anomalías perceptivas
- cognicion: Orientación, atención, memoria, juicio, abstracción
- insight: Conciencia de enfermedad y capacidad de juicio
- plan_psiq: Impresión diagnóstica (DSM-5/CIE-11) y plan terapéutico""",

    "nota_enfermeria": """## GENERACIÓN DE NOTA (Valoración Enfermera — Patrones de Gordon)
Genera el campo "soap" con estas claves:
- percepcion_salud: Patrón 1 — Percepción-manejo de la salud
- nutricional: Patrón 2 — Nutricional-metabólico
- eliminacion: Patrón 3 — Eliminación
- actividad: Patrón 4 — Actividad-ejercicio
- sueno: Patrón 5 — Sueño-descanso
- cognitivo: Patrón 6 — Cognitivo-perceptivo
- autopercepcion: Patrón 7 — Autopercepción-autoconcepto
- rol: Patrón 8 — Rol-relaciones
- sexualidad: Patrón 9 — Sexualidad-reproducción
- afrontamiento: Patrón 10 — Afrontamiento-tolerancia al estrés
- valores: Patrón 11 — Valores-creencias""",
}

# Default to SOAP if template not found
_DEFAULT_TEMPLATE_INSTRUCTION = TEMPLATE_SECTION_INSTRUCTIONS["soap"]


def build_nlp_prompt(note_text: str, template_id: str = "soap") -> str:
    """Build the user message for NLP extraction, with template-specific instructions."""
    template_instruction = TEMPLATE_SECTION_INSTRUCTIONS.get(
        template_id, _DEFAULT_TEMPLATE_INSTRUCTION
    )
    return f"""Analiza la siguiente nota clínica en español y extrae la información estructurada.

{template_instruction}

<nota_clinica>
{note_text}
</nota_clinica>

Responde ÚNICAMENTE con el JSON estructurado según las instrucciones."""
