export interface TemplateSection {
  key: string
  label: string
  placeholder?: string
}

export interface ClinicalTemplate {
  id: string
  name: string
  description: string
  specialty?: string
  sections: TemplateSection[]
}

export const CLINICAL_TEMPLATES: ClinicalTemplate[] = [
  {
    id: "soap",
    name: "SOAP",
    description: "Subjetivo · Objetivo · Análisis · Plan",
    sections: [
      { key: "S", label: "Subjetivo — Anamnesis", placeholder: "Motivo de consulta, síntomas, historia..." },
      { key: "O", label: "Objetivo — Exploración y pruebas", placeholder: "Constantes, exploración física, analítica..." },
      { key: "A", label: "Valoración diagnóstica", placeholder: "Diagnósticos por orden de probabilidad..." },
      { key: "P", label: "Plan terapéutico", placeholder: "Tratamiento, seguimiento, derivaciones..." },
    ],
  },
  {
    id: "soapie",
    name: "SOAPIE",
    description: "Enfermería: SOAP + Intervención + Evaluación",
    specialty: "Enfermería",
    sections: [
      { key: "S", label: "Subjetivo" },
      { key: "O", label: "Objetivo" },
      { key: "A", label: "Análisis / Diagnóstico enfermero" },
      { key: "P", label: "Plan de cuidados" },
      { key: "I", label: "Intervenciones realizadas" },
      { key: "E", label: "Evaluación de resultados" },
    ],
  },
  {
    id: "soapier",
    name: "SOAPIER",
    description: "SOAPIE + Revisión del plan",
    specialty: "Enfermería",
    sections: [
      { key: "S", label: "Subjetivo" },
      { key: "O", label: "Objetivo" },
      { key: "A", label: "Análisis / Diagnóstico enfermero" },
      { key: "P", label: "Plan de cuidados" },
      { key: "I", label: "Intervenciones realizadas" },
      { key: "E", label: "Evaluación de resultados" },
      { key: "R", label: "Revisión y ajuste del plan" },
    ],
  },
  {
    id: "dar",
    name: "DAR",
    description: "Datos · Acción · Respuesta",
    specialty: "Enfermería",
    sections: [
      { key: "D", label: "Datos — Hallazgos subjetivos y objetivos" },
      { key: "A", label: "Acción — Intervenciones realizadas" },
      { key: "R", label: "Respuesta del paciente" },
    ],
  },
  {
    id: "pie",
    name: "PIE",
    description: "Problema · Intervención · Evaluación",
    specialty: "Enfermería",
    sections: [
      { key: "P", label: "Problema identificado" },
      { key: "I", label: "Intervenciones realizadas" },
      { key: "E", label: "Evaluación de resultados" },
    ],
  },
  {
    id: "birp",
    name: "BIRP",
    description: "Comportamiento · Intervención · Respuesta · Plan",
    specialty: "Salud Mental",
    sections: [
      { key: "B", label: "Comportamiento — Estado mental observado" },
      { key: "I", label: "Intervención terapéutica" },
      { key: "R", label: "Respuesta del paciente" },
      { key: "P", label: "Plan de seguimiento" },
    ],
  },
  {
    id: "dap",
    name: "DAP",
    description: "Datos · Análisis · Plan — Psicoterapia",
    specialty: "Psicología / Psiquiatría",
    sections: [
      { key: "D", label: "Datos de la sesión" },
      { key: "A", label: "Análisis clínico y progreso" },
      { key: "P", label: "Plan terapéutico" },
    ],
  },
  {
    id: "isbar",
    name: "ISBAR",
    description: "Identificación · Situación · Background · Análisis · Recomendación",
    specialty: "Comunicación clínica / Transferencia",
    sections: [
      { key: "I", label: "Identificación del paciente" },
      { key: "S", label: "Situación actual" },
      { key: "B", label: "Antecedentes relevantes" },
      { key: "A", label: "Análisis clínico" },
      { key: "R", label: "Recomendación / Solicitud" },
    ],
  },
  {
    id: "girp",
    name: "GIRP",
    description: "Objetivo · Intervención · Respuesta · Plan",
    specialty: "Salud Mental / Trabajo Social",
    sections: [
      { key: "G", label: "Objetivo terapéutico abordado" },
      { key: "I", label: "Intervención realizada" },
      { key: "R", label: "Respuesta del paciente" },
      { key: "P", label: "Plan de seguimiento" },
    ],
  },
  {
    id: "apso",
    name: "APSO",
    description: "Análisis · Plan · Subjetivo · Objetivo (orientado al médico)",
    sections: [
      { key: "A", label: "Análisis / Impresión diagnóstica" },
      { key: "P", label: "Plan" },
      { key: "S", label: "Subjetivo" },
      { key: "O", label: "Objetivo" },
    ],
  },
  {
    id: "nota_urgencias",
    name: "Urgencias",
    description: "Nota de urgencias / guardia",
    specialty: "Urgencias y Emergencias",
    sections: [
      { key: "motivo", label: "Motivo de consulta" },
      { key: "antecedentes", label: "Antecedentes relevantes" },
      { key: "exploracion", label: "Exploración física y constantes" },
      { key: "pruebas", label: "Pruebas complementarias" },
      { key: "juicio", label: "Juicio clínico" },
      { key: "tratamiento", label: "Tratamiento administrado" },
      { key: "destino", label: "Destino del paciente" },
    ],
  },
  {
    id: "informe_alta",
    name: "Informe de alta",
    description: "Alta hospitalaria con resumen del ingreso",
    sections: [
      { key: "motivo_ingreso", label: "Motivo de ingreso" },
      { key: "antecedentes", label: "Antecedentes personales" },
      { key: "evolucion", label: "Evolución durante el ingreso" },
      { key: "exploracion_alta", label: "Exploración al alta" },
      { key: "diagnosticos", label: "Diagnósticos al alta" },
      { key: "tratamiento_alta", label: "Tratamiento al alta" },
      { key: "recomendaciones", label: "Recomendaciones y seguimiento" },
    ],
  },
  {
    id: "nota_preoperatoria",
    name: "Preoperatorio",
    description: "Valoración preoperatoria",
    specialty: "Cirugía / Anestesiología",
    sections: [
      { key: "procedimiento", label: "Procedimiento planificado" },
      { key: "antecedentes", label: "Antecedentes quirúrgicos y médicos" },
      { key: "medicacion", label: "Medicación habitual" },
      { key: "alergias", label: "Alergias conocidas" },
      { key: "exploracion", label: "Exploración física y analítica" },
      { key: "riesgo", label: "Valoración del riesgo (ASA, etc.)" },
      { key: "plan_anestesico", label: "Plan anestésico" },
    ],
  },
  {
    id: "nota_postoperatoria",
    name: "Postoperatorio",
    description: "Nota de evolución postoperatoria",
    specialty: "Cirugía",
    sections: [
      { key: "procedimiento_realizado", label: "Procedimiento realizado" },
      { key: "evolucion", label: "Evolución postoperatoria" },
      { key: "exploracion", label: "Exploración física" },
      { key: "constantes", label: "Constantes y analítica" },
      { key: "complicaciones", label: "Complicaciones" },
      { key: "plan", label: "Plan de cuidados y alta" },
    ],
  },
  {
    id: "nota_uci",
    name: "UCI / UVI",
    description: "Nota de evolución en cuidados intensivos",
    specialty: "Cuidados Intensivos",
    sections: [
      { key: "neurologia", label: "Estado neurológico (GCS, sedación)" },
      { key: "respiratorio", label: "Sistema respiratorio (ventilación)" },
      { key: "cardiovascular", label: "Sistema cardiovascular (hemodinámica)" },
      { key: "renal", label: "Función renal y balance hídrico" },
      { key: "digestivo", label: "Nutrición y aparato digestivo" },
      { key: "infeccion", label: "Infección / antibioterapia" },
      { key: "plan_uci", label: "Plan del día / objetivos" },
    ],
  },
  {
    id: "vgi_geriatria",
    name: "VGI Geriátrica",
    description: "Valoración Geriátrica Integral",
    specialty: "Geriatría",
    sections: [
      { key: "clinica", label: "Valoración clínica" },
      { key: "funcional", label: "Valoración funcional (Barthel, Katz)" },
      { key: "cognitiva", label: "Valoración cognitiva (MMSE, MoCA)" },
      { key: "afectiva", label: "Valoración afectiva (GDS, Yesavage)" },
      { key: "social", label: "Valoración social y cuidadores" },
      { key: "nutricional", label: "Valoración nutricional (MNA)" },
      { key: "sindromes", label: "Síndromes geriátricos" },
      { key: "plan_geriatrico", label: "Plan de intervención integral" },
    ],
  },
  {
    id: "examen_mental",
    name: "Examen del estado mental",
    description: "MSE — Mental Status Examination",
    specialty: "Psiquiatría",
    sections: [
      { key: "apariencia", label: "Apariencia y conducta" },
      { key: "habla", label: "Habla y lenguaje" },
      { key: "estado_animo", label: "Estado de ánimo y afecto" },
      { key: "pensamiento", label: "Contenido y forma del pensamiento" },
      { key: "percepciones", label: "Percepciones (alucinaciones, ilusiones)" },
      { key: "cognicion", label: "Cognición y orientación" },
      { key: "insight", label: "Insight y juicio" },
      { key: "plan_psiq", label: "Impresión diagnóstica y plan" },
    ],
  },
  {
    id: "nota_enfermeria",
    name: "Valoración enfermera (Gordon)",
    description: "Patrones funcionales de Marjory Gordon",
    specialty: "Enfermería",
    sections: [
      { key: "percepcion_salud", label: "Percepción-manejo de la salud" },
      { key: "nutricional", label: "Nutricional-metabólico" },
      { key: "eliminacion", label: "Eliminación" },
      { key: "actividad", label: "Actividad-ejercicio" },
      { key: "sueno", label: "Sueño-descanso" },
      { key: "cognitivo", label: "Cognitivo-perceptivo" },
      { key: "autopercepcion", label: "Autopercepción-autoconcepto" },
      { key: "rol", label: "Rol-relaciones" },
      { key: "sexualidad", label: "Sexualidad-reproducción" },
      { key: "afrontamiento", label: "Afrontamiento-tolerancia al estrés" },
      { key: "valores", label: "Valores-creencias" },
    ],
  },
]

export const DEFAULT_TEMPLATE_ID = "soap"

export function getTemplate(id: string): ClinicalTemplate {
  return CLINICAL_TEMPLATES.find(t => t.id === id) ?? CLINICAL_TEMPLATES[0]
}

/** Group templates by specialty for a grouped dropdown */
export function getTemplateGroups(): { label: string; templates: ClinicalTemplate[] }[] {
  const general = CLINICAL_TEMPLATES.filter(t => !t.specialty)
  const specialties = new Map<string, ClinicalTemplate[]>()
  for (const t of CLINICAL_TEMPLATES) {
    if (t.specialty) {
      if (!specialties.has(t.specialty)) specialties.set(t.specialty, [])
      specialties.get(t.specialty)!.push(t)
    }
  }
  return [
    { label: "General", templates: general },
    ...Array.from(specialties.entries()).map(([label, templates]) => ({ label, templates })),
  ]
}
