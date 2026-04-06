# CLINOTE — Estudio de Mercado España
*Análisis estratégico SaaS médico hispanohablante — Abril 2026*

## Resumen ejecutivo

CLINOTE no tiene competencia directa real en España. Los médicos dedican 35-45% de su jornada a documentación, con sistemas EMR obsoletos, y una tasa de burnout del 43% donde la burocracia es el factor nº1. Ningún competidor combina NLP en español, SOAP, alertas farmacológicas, FHIR R4 y evidencia en un solo producto accesible.

---

## 1. Pain Points — Médicos españoles

- **2,5-3,5 horas/día** dedicadas a documentación (SEMI, 2023)
- **42% de médicos de familia** completa notas fuera del horario laboral ("efecto pijama")
- **61%** considera que la burocracia impide atención óptima (Barómetro Sanitario 2024)
- Burnout: **43,6%** de médicos, 67% lo atribuye a carga documental (OMC 2024)

**Sistemas EMR más criticados:** Selene (Madrid), SAP IS-H, OpenSanitas, ABUCASIS, OMI-AP — todos sin NLP, interfaces de los 2000-2010, sin alertas integradas.

---

## 2. Mapa competitivo

| Feature | Nuance DAX | Nabla | Shas/ClinicCloud | Amboss | **CLINOTE** |
|---|---|---|---|---|---|
| NLP español clínico | Parcial | Parcial | No | No | **Sí** |
| Generación SOAP | Sí | Sí | No | No | **Sí** |
| Output FHIR R4 | No | No | No | No | **Sí** |
| Alertas farmacológicas | No | Parcial | No | No | **Sí** |
| Búsqueda evidencia | No | No | No | Sí | **Sí** |
| Precio accesible individual | No | No | Sí | Sí | **Sí** |
| RGPD España | No | Sí | Sí | Sí | **Sí** |

**Conclusión:** CLINOTE no tiene competidor directo en el mercado español.

---

## 3. Regulación y compliance

| Requisito | Obligatorio | Cuándo |
|---|---|---|
| RGPD / LOPD-GDD | Sí, desde día 1 | Datos de salud = Art. 9 RGPD |
| DPO (Delegado Protección Datos) | Sí | Desde que procesa datos sistemáticamente |
| CE Medical Device (MDR) | Potencial Clase IIa | Si alertas se presentan como diagnósticas |
| ENS (nivel Alto) | Solo para sector público | Fase 2+ |
| ISO 27001 | Recomendado | Para clínicas privadas medianas |

**Estrategia:** Posicionar alertas como "informativas, no diagnósticas" + disclaimer claro → evita MDR en fase inicial. Implementar pseudoanonimización de datos del paciente en el frontend.

---

## 4. Modelo de compra y precio

- **Médico individual:** decisión autónoma, 1-2 semanas, umbral psicológico €50/mes ✅ (€39 bien calibrado)
- **Grupo clínicas:** 2-8 semanas, umbral €150-300/mes para toda la clínica ✅ (€199 competitivo)
- **Hospital privado:** 3-18 meses, comités, SLA requerido → Fase 2
- **SNS público:** licitación, ENS obligatorio → evitar primeros 24 meses

---

## 5. Canales de distribución prioritarios

1. **Colegios médicos** — CGCOM + provinciales (Madrid: 40.000 colegiados). Propuesta: Free para todos los colegiados + 30% dto en Pro
2. **semFYC** (22.000 socios) + **SEMERGEN** (16.000) — congreso anual
3. **Twitter/X médico español** — early adopters tech-savvy
4. **Doctoralia** (40.000 médicos registrados) — partnership de integración
5. **ClinicCloud / Shas** — plugin/módulo de IA complementario (revenue share 20-30%)

---

## 6. Eventos 2026

| Evento | Fecha | Asistentes | Prioridad |
|---|---|---|---|
| Congreso semFYC | Junio, Santiago | 3.000-4.000 | 🔴 MUY ALTA |
| HIT (Healthcare IT) | Abril/Mayo, Bilbao | 1.500 | 🔴 MUY ALTA |
| Congreso SEMERGEN | Octubre | 2.500-3.000 | 🔴 MUY ALTA |
| Congreso SEMES | Mayo/Junio | 1.500-2.000 | 🟡 ALTA |
| SEMI Congress | Noviembre | 2.000 | 🟡 ALTA |

---

## 7. Mercado potencial

- **TAM:** 250.000 médicos × €39/mes = €117M/año
- **SAM (privado):** 60.000 médicos = €28M/año
- **SOM objetivo 3 años:** 3.000 suscriptores Pro = **€1.4M ARR**

**Hitos realistas:**
- Mes 12: 150 de pago → €6.000 MRR
- Mes 24: 600 de pago → €24.000 MRR
- Mes 36: 1.500 de pago → €60.000 MRR

---

## 8. Top 10 acciones próximos 90 días

1. Conseguir 3-5 médicos de AP como beta testers con acceso gratuito 3 meses
2. Publicar artículo LinkedIn: "Por qué los EMR españoles no entienden el lenguaje clínico real"
3. Registrar en Product Hunt con demo en vídeo real
4. Contactar área de innovación del Colegio de Médicos de Madrid/Barcelona
5. Preparar comunicación para semFYC 2026 (plazo abstract: enero-febrero)
6. Implementar pseudoanonimización en el frontend (checkbox antes de procesar)
7. Añadir "Calculadora de ROI" en la landing page
8. Contactar ClinicCloud/Shas para acuerdo de integración como módulo IA
9. Publicar conformidad FHIR R4 y contactar con HL7 España
10. Precio fundacional €29/mes primeros 6 meses (urgencia + recompensa early adopters)

---

## 9. Features prioritarias para el mercado español

1. **Plantillas por especialidad** (AP, urgencias, cardiología...) — mayor impacto en conversión
2. **Modo urgencias** — interfaz simplificada para alta presión
3. **Export como informe de alta / consulta** con membrete personalizable
4. **API para integración con Shas/ClinicCloud** — elimina fricción de adopción
5. **Pseudoanonimización** — reduce barrera RGPD

