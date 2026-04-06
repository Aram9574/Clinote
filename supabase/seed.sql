-- ============================================================
-- CLINOTE — Seed Data
-- Realistic Spanish clinical content for development/testing
-- ============================================================

-- Fixed UUIDs for deterministic test references
-- Organization
-- org_id:       'a1b2c3d4-0000-0000-0000-000000000001'

-- Users
-- physician:      'b1000000-0000-0000-0000-000000000001'
-- org_admin:      'b2000000-0000-0000-0000-000000000002'
-- platform_admin: 'b3000000-0000-0000-0000-000000000003'

-- Cases
-- case_1: 'c1000000-0000-0000-0000-000000000001'
-- case_2: 'c2000000-0000-0000-0000-000000000002'
-- case_3: 'c3000000-0000-0000-0000-000000000003'
-- case_4: 'c4000000-0000-0000-0000-000000000004'
-- case_5: 'c5000000-0000-0000-0000-000000000005'

-- ============================================================
-- Organization
-- ============================================================

INSERT INTO organizations (id, name, tax_id, country, plan)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Clínica San Rafael',
  'B-12345678',
  'ES',
  'clinic'
);

-- ============================================================
-- Users
-- NOTE: auth.users rows must be created before inserting here.
-- In production these are created via Supabase Auth sign-up.
-- For local dev, insert into auth.users manually or via Supabase Studio.
-- ============================================================

INSERT INTO users (id, email, full_name, role, org_id, mfa_enabled, notes_used_this_month)
VALUES
  (
    'b1000000-0000-0000-0000-000000000001',
    'dr.garcia@clinicasanrafael.es',
    'Dra. María García López',
    'physician',
    'a1b2c3d4-0000-0000-0000-000000000001',
    false,
    3
  ),
  (
    'b2000000-0000-0000-0000-000000000002',
    'admin@clinicasanrafael.es',
    'Dr. Carlos Martínez Ruiz',
    'org_admin',
    'a1b2c3d4-0000-0000-0000-000000000001',
    true,
    1
  ),
  (
    'b3000000-0000-0000-0000-000000000003',
    'platform@clinote.io',
    'Administrador Plataforma',
    'platform_admin',
    NULL,
    true,
    0
  );

-- ============================================================
-- Cases
-- ============================================================

-- Case 1: Hypertensive patient with diabetes — ambulatory visit
INSERT INTO cases (
  id, user_id, input_hash, note_type,
  word_count, processing_ms, model_version,
  soap_structured, entities, created_at
) VALUES (
  'c1000000-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000001',
  'sha256:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
  'ambulatory',
  312,
  1840,
  'clinote-nlp-v1.2',
  '{
    "S": "Paciente de 58 años con antecedentes de hipertensión arterial y diabetes mellitus tipo 2 de 10 años de evolución. Refiere cefalea occipital de 2 días de duración, visión borrosa ocasional y poliuria. No refiere dolor torácico ni disnea.",
    "O": "TA: 168/102 mmHg (brazo derecho), FC: 84 lpm, FR: 16 rpm, T: 36,8°C, SatO2: 97%. Peso: 92 kg, Talla: 170 cm, IMC: 31,8 kg/m². Glucemia capilar: 214 mg/dL. Fondo de ojo: cruces arteriovenosos grado II. Exploración neurológica: normal.",
    "A": "1. Crisis hipertensiva sin daño orgánico agudo (urgencia hipertensiva). 2. Diabetes mellitus tipo 2 con mal control glucémico. 3. Retinopatía hipertensiva grado II.",
    "P": "1. Ajuste de tratamiento antihipertensivo: aumentar amlodipino a 10 mg/24h. 2. Añadir enalapril 10 mg/12h. 3. Reforzar adherencia a metformina 850 mg/8h. 4. Derivar a oftalmología para revisión de fondo de ojo. 5. Analítica de control en 4 semanas (HbA1c, función renal, iones). 6. Dieta hipocalórica e hiposódica. 7. Revisión en consulta en 2 semanas."
  }'::jsonb,
  '{
    "chief_complaint": "Cefalea occipital y visión borrosa de 2 días de evolución",
    "diagnoses": [
      {"display": "Crisis hipertensiva sin daño orgánico agudo", "snomed_placeholder": "SNOMED:38341003", "confidence": 0.94, "negated": false, "temporal": "current"},
      {"display": "Diabetes mellitus tipo 2", "snomed_placeholder": "SNOMED:44054006", "confidence": 0.99, "negated": false, "temporal": "historical"},
      {"display": "Retinopatía hipertensiva grado II", "snomed_placeholder": "SNOMED:59276001", "confidence": 0.87, "negated": false, "temporal": "current"}
    ],
    "medications": [
      {"name": "amlodipino", "dose": "10 mg", "frequency": "24h", "route": "oral", "status": "ajuste", "rxnorm_placeholder": "RxNorm:17767"},
      {"name": "enalapril", "dose": "10 mg", "frequency": "12h", "route": "oral", "status": "nuevo", "rxnorm_placeholder": "RxNorm:3827"},
      {"name": "metformina", "dose": "850 mg", "frequency": "8h", "route": "oral", "status": "continuar", "rxnorm_placeholder": "RxNorm:6809"}
    ],
    "vitals": [
      {"type": "tension_arterial", "value": "168/102", "unit": "mmHg", "timestamp_mentioned": null},
      {"type": "frecuencia_cardiaca", "value": "84", "unit": "lpm", "timestamp_mentioned": null},
      {"type": "glucemia_capilar", "value": "214", "unit": "mg/dL", "timestamp_mentioned": null},
      {"type": "imc", "value": "31.8", "unit": "kg/m2", "timestamp_mentioned": null},
      {"type": "saturacion_o2", "value": "97", "unit": "%", "timestamp_mentioned": null}
    ],
    "allergies": [],
    "lab_values": [
      {"name": "Glucemia capilar", "value": "214", "unit": "mg/dL", "reference_range": "70-110", "flag": "high"}
    ],
    "procedures": [
      {"name": "Fondo de ojo", "date_mentioned": null, "status": "realizado"},
      {"name": "Analítica de control", "date_mentioned": "en 4 semanas", "status": "pendiente"}
    ],
    "physical_exam": {
      "tension_arterial": "168/102 mmHg brazo derecho",
      "fondo_de_ojo": "cruces arteriovenosos grado II",
      "neurologia": "exploración normal"
    }
  }'::jsonb,
  now() - interval '5 days'
);

-- Case 2: Chest pain — emergency
INSERT INTO cases (
  id, user_id, input_hash, note_type,
  word_count, processing_ms, model_version,
  soap_structured, entities, created_at
) VALUES (
  'c2000000-0000-0000-0000-000000000002',
  'b1000000-0000-0000-0000-000000000001',
  'sha256:b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
  'emergency',
  285,
  2100,
  'clinote-nlp-v1.2',
  '{
    "S": "Varón de 67 años con antecedentes de cardiopatía isquémica (IAM anterior en 2018, stent en DA), HTA, dislipemia y tabaquismo activo (40 paquetes-año). Acude por dolor torácico opresivo de 45 minutos de evolución, irradiado a brazo izquierdo y mandíbula. Sudoración profusa y sensación de mareo. No toma nitroglicerina en domicilio.",
    "O": "TA: 145/90 mmHg, FC: 102 lpm, FR: 22 rpm, T: 36,5°C, SatO2: 94% basal. ECG: elevación ST en V1-V4 de 2 mm. Troponina I: 1.8 ng/mL (VN < 0.04). Aspecto sudoroso y ansioso. Auscultación cardíaca: rítmica, sin soplos.",
    "A": "Síndrome coronario agudo con elevación del ST (SCACEST) anterior. Factores de riesgo cardiovascular múltiples.",
    "P": "1. Activación código infarto. 2. AAS 300 mg + ticagrelor 180 mg vo stat. 3. HBPM enoxaparina 1 mg/kg sc. 4. O2 si SatO2 < 90%. 5. Traslado urgente a hemodinámica para ICP primaria. 6. Monitorización continua ECG y constantes. 7. Acceso venoso periférico x2."
  }'::jsonb,
  '{
    "chief_complaint": "Dolor torácico opresivo de 45 minutos con irradiación a brazo izquierdo y mandíbula",
    "diagnoses": [
      {"display": "SCACEST anterior", "snomed_placeholder": "SNOMED:401303003", "confidence": 0.97, "negated": false, "temporal": "current"},
      {"display": "Cardiopatía isquémica", "snomed_placeholder": "SNOMED:53741008", "confidence": 0.99, "negated": false, "temporal": "historical"},
      {"display": "Hipertensión arterial", "snomed_placeholder": "SNOMED:38341003", "confidence": 0.99, "negated": false, "temporal": "historical"},
      {"display": "Dislipemia", "snomed_placeholder": "SNOMED:370992007", "confidence": 0.99, "negated": false, "temporal": "historical"}
    ],
    "medications": [
      {"name": "ácido acetilsalicílico", "dose": "300 mg", "frequency": "stat", "route": "oral", "status": "nuevo", "rxnorm_placeholder": "RxNorm:1191"},
      {"name": "ticagrelor", "dose": "180 mg", "frequency": "stat", "route": "oral", "status": "nuevo", "rxnorm_placeholder": "RxNorm:1116632"},
      {"name": "enoxaparina", "dose": "1 mg/kg", "frequency": "stat", "route": "subcutanea", "status": "nuevo", "rxnorm_placeholder": "RxNorm:67108"}
    ],
    "vitals": [
      {"type": "tension_arterial", "value": "145/90", "unit": "mmHg", "timestamp_mentioned": null},
      {"type": "frecuencia_cardiaca", "value": "102", "unit": "lpm", "timestamp_mentioned": null},
      {"type": "frecuencia_respiratoria", "value": "22", "unit": "rpm", "timestamp_mentioned": null},
      {"type": "saturacion_o2", "value": "94", "unit": "%", "timestamp_mentioned": null}
    ],
    "allergies": [],
    "lab_values": [
      {"name": "Troponina I", "value": "1.8", "unit": "ng/mL", "reference_range": "< 0.04", "flag": "critical"}
    ],
    "procedures": [
      {"name": "ECG 12 derivaciones", "date_mentioned": null, "status": "realizado"},
      {"name": "ICP primaria", "date_mentioned": null, "status": "urgente"},
      {"name": "Acceso venoso periférico", "date_mentioned": null, "status": "realizado"}
    ],
    "physical_exam": {
      "aspecto_general": "sudoroso y ansioso",
      "auscultacion_cardiaca": "rítmica sin soplos"
    }
  }'::jsonb,
  now() - interval '3 days'
);

-- Case 3: COPD exacerbation — emergency
INSERT INTO cases (
  id, user_id, input_hash, note_type,
  word_count, processing_ms, model_version,
  soap_structured, entities, created_at
) VALUES (
  'c3000000-0000-0000-0000-000000000003',
  'b1000000-0000-0000-0000-000000000001',
  'sha256:c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
  'emergency',
  241,
  1950,
  'clinote-nlp-v1.2',
  '{
    "S": "Mujer de 72 años con EPOC GOLD III diagnosticada hace 8 años, exfumadora (30 paquetes-año). Presenta desde hace 3 días aumento de disnea basal, aumento de expectoración purulenta amarillo-verdosa y fiebre de 38,2°C. Refiere que en el último año ha tenido 3 exacerbaciones que requirieron hospitalización.",
    "O": "TA: 132/78 mmHg, FC: 110 lpm, FR: 28 rpm, T: 38,4°C, SatO2: 88% basal (con O2 al 24% SatO2 93%). Uso de musculatura accesoria. Sibilancias y roncus difusos en auscultación. Gasometría arterial (FiO2 24%): pH 7.32, PaO2 68 mmHg, PaCO2 58 mmHg, HCO3- 30 mEq/L.",
    "A": "Exacerbación aguda grave de EPOC. Insuficiencia respiratoria hipercápnica parcialmente compensada. Probable infección bacteriana.",
    "P": "1. O2 controlado para mantener SatO2 88-92%. 2. Salbutamol 2.5 mg + ipratropio 0.5 mg nebulizados c/20 min x3, luego c/4h. 3. Metilprednisolona 40 mg iv/6h. 4. Amoxicilina-clavulánico 875/125 mg vo c/8h x7 días. 5. Gasometría arterial de control en 1h. 6. Ingreso hospitalario. 7. Fisioterapia respiratoria."
  }'::jsonb,
  '{
    "chief_complaint": "Disnea, expectoración purulenta y fiebre de 3 días de evolución en paciente EPOC",
    "diagnoses": [
      {"display": "Exacerbación aguda de EPOC", "snomed_placeholder": "SNOMED:195951007", "confidence": 0.96, "negated": false, "temporal": "current"},
      {"display": "EPOC GOLD III", "snomed_placeholder": "SNOMED:13645005", "confidence": 0.99, "negated": false, "temporal": "historical"},
      {"display": "Insuficiencia respiratoria hipercápnica", "snomed_placeholder": "SNOMED:409623005", "confidence": 0.91, "negated": false, "temporal": "current"}
    ],
    "medications": [
      {"name": "salbutamol", "dose": "2.5 mg", "frequency": "c/20min x3 luego c/4h", "route": "nebulizado", "status": "nuevo", "rxnorm_placeholder": "RxNorm:435"},
      {"name": "ipratropio", "dose": "0.5 mg", "frequency": "c/20min x3 luego c/4h", "route": "nebulizado", "status": "nuevo", "rxnorm_placeholder": "RxNorm:7213"},
      {"name": "metilprednisolona", "dose": "40 mg", "frequency": "6h", "route": "intravenosa", "status": "nuevo", "rxnorm_placeholder": "RxNorm:41493"},
      {"name": "amoxicilina-clavulánico", "dose": "875/125 mg", "frequency": "8h x7 días", "route": "oral", "status": "nuevo", "rxnorm_placeholder": "RxNorm:723"}
    ],
    "vitals": [
      {"type": "tension_arterial", "value": "132/78", "unit": "mmHg", "timestamp_mentioned": null},
      {"type": "frecuencia_cardiaca", "value": "110", "unit": "lpm", "timestamp_mentioned": null},
      {"type": "frecuencia_respiratoria", "value": "28", "unit": "rpm", "timestamp_mentioned": null},
      {"type": "temperatura", "value": "38.4", "unit": "°C", "timestamp_mentioned": null},
      {"type": "saturacion_o2", "value": "88", "unit": "%", "timestamp_mentioned": "basal"}
    ],
    "allergies": [],
    "lab_values": [
      {"name": "pH arterial", "value": "7.32", "unit": null, "reference_range": "7.35-7.45", "flag": "low"},
      {"name": "PaO2", "value": "68", "unit": "mmHg", "reference_range": "80-100", "flag": "low"},
      {"name": "PaCO2", "value": "58", "unit": "mmHg", "reference_range": "35-45", "flag": "high"},
      {"name": "HCO3-", "value": "30", "unit": "mEq/L", "reference_range": "22-26", "flag": "high"}
    ],
    "procedures": [
      {"name": "Gasometría arterial", "date_mentioned": null, "status": "realizado"},
      {"name": "Gasometría arterial de control", "date_mentioned": "en 1h", "status": "pendiente"},
      {"name": "Fisioterapia respiratoria", "date_mentioned": null, "status": "pendiente"}
    ],
    "physical_exam": {
      "auscultacion": "sibilancias y roncus difusos",
      "uso_musculatura_accesoria": "presente"
    }
  }'::jsonb,
  now() - interval '2 days'
);

-- Case 4: Discharge summary — heart failure
INSERT INTO cases (
  id, user_id, input_hash, note_type,
  word_count, processing_ms, model_version,
  soap_structured, entities, created_at
) VALUES (
  'c4000000-0000-0000-0000-000000000004',
  'b1000000-0000-0000-0000-000000000001',
  'sha256:d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5',
  'discharge',
  398,
  2380,
  'clinote-nlp-v1.2',
  '{
    "S": "Paciente de 74 años, mujer, con antecedentes de insuficiencia cardíaca con fracción de eyección reducida (FEVI 35%), fibrilación auricular permanente, HTA y enfermedad renal crónica estadio 3a (FGe 52 mL/min/1.73m²). Ingresa por descompensación de insuficiencia cardíaca con disnea de reposo, ortopnea y edemas en miembros inferiores hasta rodillas. Peso al ingreso: 74 kg (ganancia de 5 kg respecto a peso seco).",
    "O": "Ecocardiografía: FEVI 30%, dilatación VI, regurgitación mitral moderada. NT-proBNP: 8540 pg/mL. Creatinina: 1.6 mg/dL. Na+: 134 mEq/L. K+: 4.1 mEq/L. Rx tórax: cardiomegalia, infiltrado intersticial bilateral. ECG: FA con respuesta ventricular controlada 72 lpm.",
    "A": "Descompensación de insuficiencia cardíaca con FEVI reducida. Fibrilación auricular permanente con respuesta ventricular controlada. Hiponatremia leve. Disfunción renal crónica estable.",
    "P": "Alta tras 6 días de ingreso con buena respuesta a diuresis iv. Peso al alta: 69 kg. Tratamiento al alta: furosemida 40 mg/24h, carvedilol 12.5 mg/12h, enalapril 5 mg/12h, eplerenona 25 mg/24h, acenocumarol ajustado a INR 2-3. Restricción hídrica 1.5L/día. Control en consulta de IC en 7 días. Objetivos: peso diario, dieta hiposódica, actividad física adaptada."
  }'::jsonb,
  '{
    "chief_complaint": "Descompensación de insuficiencia cardíaca: disnea de reposo, ortopnea y edemas",
    "diagnoses": [
      {"display": "Insuficiencia cardíaca con FEVI reducida", "snomed_placeholder": "SNOMED:84114007", "confidence": 0.98, "negated": false, "temporal": "historical"},
      {"display": "Fibrilación auricular permanente", "snomed_placeholder": "SNOMED:49436004", "confidence": 0.99, "negated": false, "temporal": "historical"},
      {"display": "Hipertensión arterial", "snomed_placeholder": "SNOMED:38341003", "confidence": 0.99, "negated": false, "temporal": "historical"},
      {"display": "Enfermedad renal crónica estadio 3a", "snomed_placeholder": "SNOMED:700379002", "confidence": 0.97, "negated": false, "temporal": "historical"},
      {"display": "Hiponatremia leve", "snomed_placeholder": "SNOMED:89627008", "confidence": 0.92, "negated": false, "temporal": "current"}
    ],
    "medications": [
      {"name": "furosemida", "dose": "40 mg", "frequency": "24h", "route": "oral", "status": "alta", "rxnorm_placeholder": "RxNorm:4603"},
      {"name": "carvedilol", "dose": "12.5 mg", "frequency": "12h", "route": "oral", "status": "alta", "rxnorm_placeholder": "RxNorm:20352"},
      {"name": "enalapril", "dose": "5 mg", "frequency": "12h", "route": "oral", "status": "alta", "rxnorm_placeholder": "RxNorm:3827"},
      {"name": "eplerenona", "dose": "25 mg", "frequency": "24h", "route": "oral", "status": "alta", "rxnorm_placeholder": "RxNorm:298869"},
      {"name": "acenocumarol", "dose": null, "frequency": "ajustado INR 2-3", "route": "oral", "status": "alta", "rxnorm_placeholder": "RxNorm:11289"}
    ],
    "vitals": [],
    "allergies": [],
    "lab_values": [
      {"name": "NT-proBNP", "value": "8540", "unit": "pg/mL", "reference_range": "< 125", "flag": "critical"},
      {"name": "Creatinina", "value": "1.6", "unit": "mg/dL", "reference_range": "0.5-1.1", "flag": "high"},
      {"name": "Sodio", "value": "134", "unit": "mEq/L", "reference_range": "136-145", "flag": "low"},
      {"name": "Potasio", "value": "4.1", "unit": "mEq/L", "reference_range": "3.5-5.0", "flag": "normal"},
      {"name": "FEVI", "value": "30", "unit": "%", "reference_range": "> 55", "flag": "critical"}
    ],
    "procedures": [
      {"name": "Ecocardiografía", "date_mentioned": null, "status": "realizado"},
      {"name": "Rx tórax", "date_mentioned": null, "status": "realizado"},
      {"name": "ECG", "date_mentioned": null, "status": "realizado"}
    ],
    "physical_exam": {
      "edemas": "miembros inferiores hasta rodillas",
      "ecg": "FA con respuesta ventricular controlada 72 lpm"
    }
  }'::jsonb,
  now() - interval '1 day'
);

-- Case 5: Ambulatory — type 1 diabetes follow-up with hypoglycemia
INSERT INTO cases (
  id, user_id, input_hash, note_type,
  word_count, processing_ms, model_version,
  soap_structured, entities, created_at
) VALUES (
  'c5000000-0000-0000-0000-000000000005',
  'b1000000-0000-0000-0000-000000000001',
  'sha256:e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6',
  'ambulatory',
  266,
  1720,
  'clinote-nlp-v1.2',
  '{
    "S": "Varón de 32 años con diabetes mellitus tipo 1 desde los 14 años. En tratamiento con pauta bolo-basal (glargina 28 UI noche + aspart preprandial según ratio). Refiere episodios de hipoglucemia nocturna 3-4 veces por semana en las últimas 2 semanas. Niega hipoglucemias graves o pérdida de conciencia. Revisión de sensor de glucosa continua (FreeStyle Libre): TIR 58%, tiempo en hipoglucemia 12%, TBR < 54 mg/dL: 4%. HbA1c en analítica de hace 1 mes: 7.8%.",
    "O": "TA: 118/74 mmHg, FC: 72 lpm, Peso: 78 kg, IMC: 24.1 kg/m². Glucemia capilar: 94 mg/dL. Exploración de pies: pulsos presentes, sensibilidad conservada, sin lesiones. Microalbuminuria: 18 mg/g creatinina (normal).",
    "A": "Diabetes mellitus tipo 1 con hipoglucemias nocturnas frecuentes. Mal tiempo en rango. Sin complicaciones microvasculares evidentes.",
    "P": "1. Reducir dosis de glargina: de 28 UI a 24 UI nocturnas. 2. Reevaluar ratio de corrección: considerar aumentar de 1:10 a 1:12 g CHO. 3. Educación diabetológica sobre snack nocturno de proteína y carbohidrato complejo. 4. Revisión de datos de sensor en 4 semanas. 5. Mantener seguimiento por endocrinología. 6. Actualizar app de gestión diabetológica."
  }'::jsonb,
  '{
    "chief_complaint": "Hipoglucemias nocturnas frecuentes en paciente con DM tipo 1",
    "diagnoses": [
      {"display": "Diabetes mellitus tipo 1", "snomed_placeholder": "SNOMED:46635009", "confidence": 0.99, "negated": false, "temporal": "historical"},
      {"display": "Hipoglucemia nocturna recurrente", "snomed_placeholder": "SNOMED:302866003", "confidence": 0.95, "negated": false, "temporal": "current"}
    ],
    "medications": [
      {"name": "insulina glargina", "dose": "24 UI", "frequency": "noche", "route": "subcutanea", "status": "ajuste", "rxnorm_placeholder": "RxNorm:274783"},
      {"name": "insulina aspart", "dose": "según ratio", "frequency": "preprandial", "route": "subcutanea", "status": "ajuste", "rxnorm_placeholder": "RxNorm:285018"}
    ],
    "vitals": [
      {"type": "tension_arterial", "value": "118/74", "unit": "mmHg", "timestamp_mentioned": null},
      {"type": "frecuencia_cardiaca", "value": "72", "unit": "lpm", "timestamp_mentioned": null},
      {"type": "glucemia_capilar", "value": "94", "unit": "mg/dL", "timestamp_mentioned": null},
      {"type": "imc", "value": "24.1", "unit": "kg/m2", "timestamp_mentioned": null}
    ],
    "allergies": [],
    "lab_values": [
      {"name": "HbA1c", "value": "7.8", "unit": "%", "reference_range": "< 7.0", "flag": "high"},
      {"name": "Microalbuminuria", "value": "18", "unit": "mg/g creatinina", "reference_range": "< 30", "flag": "normal"},
      {"name": "TIR (sensor)", "value": "58", "unit": "%", "reference_range": "> 70", "flag": "low"},
      {"name": "Tiempo hipoglucemia", "value": "12", "unit": "%", "reference_range": "< 4", "flag": "high"}
    ],
    "procedures": [
      {"name": "Revisión de pies diabéticos", "date_mentioned": null, "status": "realizado"},
      {"name": "Revisión sensor glucosa continua", "date_mentioned": null, "status": "realizado"}
    ],
    "physical_exam": {
      "pies": "pulsos presentes, sensibilidad conservada, sin lesiones"
    }
  }'::jsonb,
  now() - interval '6 hours'
);

-- ============================================================
-- Alerts
-- ============================================================

-- Alert for Case 1: Drug-disease interaction (enalapril + CKD risk)
INSERT INTO alerts (case_id, severity, category, message, detail, source, acknowledged)
VALUES (
  'c1000000-0000-0000-0000-000000000001',
  'warning',
  'drug_disease_interaction',
  'Monitorizar función renal al iniciar IECA en paciente diabético',
  'El inicio de enalapril en paciente con diabetes mellitus tipo 2 y posible nefropatía diabética requiere control de creatinina y potasio a los 7-14 días. Riesgo de hiperpotasemia y deterioro de función renal.',
  'Guía ESC Hipertensión 2023',
  false
);

-- Alert for Case 1: Monitoring gap
INSERT INTO alerts (case_id, severity, category, message, detail, source, acknowledged)
VALUES (
  'c1000000-0000-0000-0000-000000000001',
  'info',
  'monitoring_gap',
  'Solicitar HbA1c y microalbuminuria en paciente con DM2 e HTA',
  'El paciente tiene DM2 e HTA sin registro reciente de HbA1c ni microalbuminuria. Estas pruebas están indicadas al menos anualmente para cribado de complicaciones.',
  'GPC Diabetes Mellitus tipo 2 redGDPS 2022',
  false
);

-- Alert for Case 2: Critical value (Troponin)
INSERT INTO alerts (case_id, severity, category, message, detail, source, acknowledged)
VALUES (
  'c2000000-0000-0000-0000-000000000002',
  'critical',
  'critical_value',
  'Troponina I críticamente elevada: 1.8 ng/mL (VN < 0.04)',
  'Elevación de troponina I 45x por encima del límite superior de la normalidad. Altamente sugestivo de necrosis miocárdica. Confirmar con ECG seriado y activar protocolo SCACEST.',
  'Criterios ESC SCACEST 2023',
  true
);

-- Alert for Case 2: Drug interaction
INSERT INTO alerts (case_id, severity, category, message, detail, source, acknowledged)
VALUES (
  'c2000000-0000-0000-0000-000000000002',
  'warning',
  'drug_interaction',
  'Doble antiagregación: riesgo hemorrágico elevado AAS + ticagrelor',
  'La combinación de AAS 300 mg y ticagrelor 180 mg está indicada en SCACEST pero multiplica el riesgo de sangrado. Contraindicado uso conjunto con anticoagulantes salvo indicación específica. Revisar necesidad de inhibidores de bomba de protones.',
  'ESC Guidelines SCACEST 2023',
  true
);

-- Alert for Case 3: Guideline deviation
INSERT INTO alerts (case_id, severity, category, message, detail, source, acknowledged)
VALUES (
  'c3000000-0000-0000-0000-000000000003',
  'warning',
  'guideline_deviation',
  'Considerar VMNI en exacerbación grave de EPOC con hipercapnia',
  'El paciente presenta acidosis respiratoria (pH 7.32, PaCO2 58 mmHg). Las guías GOLD 2024 recomiendan valorar ventilación mecánica no invasiva (VMNI) si pH < 7.35 con hipercapnia. No se documenta evaluación para VMNI en el plan.',
  'GOLD 2024 Guidelines COPD',
  false
);

-- Alert for Case 4: Drug-disease interaction (eplerenone + CKD)
INSERT INTO alerts (case_id, severity, category, message, detail, source, acknowledged)
VALUES (
  'c4000000-0000-0000-0000-000000000004',
  'warning',
  'drug_disease_interaction',
  'Eplerenona en ERC estadio 3: riesgo de hiperpotasemia',
  'La eplerenona está indicada en IC-FEr pero requiere precaución con FGe 30-60 mL/min/1.73m². Monitorizar potasio sérico al inicio y periódicamente. Contraindicada si K+ > 5.0 mEq/L o FGe < 30.',
  'GPC ESC Insuficiencia Cardíaca 2023',
  false
);

-- Alert for Case 4: Critical NT-proBNP
INSERT INTO alerts (case_id, severity, category, message, detail, source, acknowledged)
VALUES (
  'c4000000-0000-0000-0000-000000000004',
  'critical',
  'critical_value',
  'NT-proBNP críticamente elevado: 8540 pg/mL',
  'NT-proBNP 68x por encima del límite normal. Confirma descompensación grave de insuficiencia cardíaca. El valor de referencia para alta riesgo en > 75 años es > 1800 pg/mL. Requiere seguimiento ecocardiográfico y optimización de tratamiento.',
  'ESC Heart Failure Guidelines 2023',
  false
);

-- Alert for Case 5: Monitoring gap (hypoglycemia pattern)
INSERT INTO alerts (case_id, severity, category, message, detail, source, acknowledged)
VALUES (
  'c5000000-0000-0000-0000-000000000005',
  'warning',
  'monitoring_gap',
  'Hipoglucemias nocturnas frecuentes: ajuste de insulina basal necesario',
  'El paciente presenta tiempo en hipoglucemia del 12% (objetivo < 4%) y TBR < 54 mg/dL del 4% (objetivo < 1%). El patrón nocturno sugiere sobredosificación de insulina basal. La reducción propuesta de 28 a 24 UI está en línea con guías de ajuste ADA/EASD.',
  'ADA Standards of Care in Diabetes 2024',
  false
);

-- ============================================================
-- Prompt Versions
-- ============================================================

INSERT INTO prompt_versions (name, version, content, is_active)
VALUES (
  'clinote_nlp_extraction',
  '1.2.0',
  'Eres un asistente clínico especializado en procesamiento de lenguaje natural médico en español. Tu tarea es analizar notas clínicas y extraer entidades estructuradas en formato JSON.

Extrae las siguientes entidades:
- diagnoses: diagnósticos mencionados (actuales, históricos, familiares; con indicador de negación)
- medications: medicamentos con dosis, frecuencia, vía de administración y estado (nuevo/continuar/ajuste/suspender)
- vitals: constantes vitales con valores y unidades
- allergies: alergias documentadas
- lab_values: resultados de laboratorio con valores de referencia y flags
- procedures: procedimientos realizados o planificados
- chief_complaint: motivo principal de consulta
- physical_exam: hallazgos de la exploración física por sistemas

Reglas:
1. Preserva terminología médica en español
2. Usa null para campos no mencionados
3. Normaliza unidades al formato estándar (mg/dL, mmHg, lpm, etc.)
4. Marca valores críticos como "flag": "critical"
5. No inventes datos no presentes en el texto
6. Responde únicamente con JSON válido sin texto adicional',
  true
);

INSERT INTO prompt_versions (name, version, content, is_active)
VALUES (
  'clinote_cdss_alerts',
  '1.1.0',
  'Eres un sistema de apoyo a la decisión clínica (CDSS) para médicos hispanohablantes. Analizas las entidades clínicas extraídas de una nota médica y generas alertas clínicas relevantes.

Genera alertas para las siguientes categorías:
- drug_interaction: interacciones entre medicamentos
- critical_value: valores de laboratorio o constantes críticos
- differential_diagnosis: diagnósticos diferenciales importantes no considerados
- drug_disease_interaction: contraindicaciones o precauciones fármaco-enfermedad
- monitoring_gap: pruebas o controles omitidos según guías clínicas
- guideline_deviation: desviaciones de guías de práctica clínica vigentes

Para cada alerta proporciona:
- severity: critical | warning | info
- category: una de las categorías anteriores
- message: mensaje corto (máximo 100 caracteres) en español
- detail: explicación detallada con evidencia (máximo 500 caracteres)
- source: guía clínica o referencia

Prioriza alertas accionables y evita alertas triviales o sin relevancia clínica.
Responde con un array JSON de alertas sin texto adicional.',
  true
);

INSERT INTO prompt_versions (name, version, content, is_active)
VALUES (
  'clinote_soap_generator',
  '1.0.0',
  'Eres un asistente médico experto en documentación clínica estructurada en español. Tu tarea es transformar texto libre de una nota clínica en formato SOAP estructurado.

Estructura SOAP:
- S (Subjetivo): Síntomas referidos por el paciente, historia clínica, antecedentes relevantes
- O (Objetivo): Exploración física, constantes vitales, resultados de pruebas complementarias
- A (Assessment/Valoración): Diagnósticos principales y secundarios, valoración clínica
- P (Plan): Tratamiento propuesto, seguimiento, derivaciones, educación al paciente

Reglas:
1. Mantén toda la información clínicamente relevante
2. Organiza lógicamente cada sección
3. Usa terminología médica española estándar
4. Si falta información para una sección, indícalo brevemente
5. Responde con un objeto JSON con claves S, O, A, P
6. No añadas información que no esté en el texto original',
  true
);

-- ============================================================
-- Sample audit log entries
-- ============================================================

INSERT INTO audit_log (user_id, action, resource_type, resource_id, ip_address, user_agent, metadata)
VALUES
  (
    'b1000000-0000-0000-0000-000000000001',
    'case.create',
    'cases',
    'c1000000-0000-0000-0000-000000000001',
    '192.168.1.50',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/121.0',
    '{"note_type": "ambulatory", "word_count": 312}'
  ),
  (
    'b1000000-0000-0000-0000-000000000001',
    'case.create',
    'cases',
    'c2000000-0000-0000-0000-000000000002',
    '192.168.1.50',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/121.0',
    '{"note_type": "emergency", "word_count": 285}'
  ),
  (
    'b1000000-0000-0000-0000-000000000001',
    'alert.acknowledge',
    'alerts',
    NULL,
    '192.168.1.50',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/121.0',
    '{"case_id": "c2000000-0000-0000-0000-000000000002", "severity": "critical"}'
  ),
  (
    'b2000000-0000-0000-0000-000000000002',
    'user.login',
    'users',
    'b2000000-0000-0000-0000-000000000002',
    '10.0.0.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0',
    '{"mfa_verified": true}'
  );
