"""
5 realistic Spanish clinical notes for testing.
Each note includes the complexity needed to test all CLINOTE features.
"""

# Note 1: Cardiology - FA + anticoagulation + renal failure (polypharmacy)
CARDIOLOGY_NOTE = """
Paciente varón de 72 años que acude a revisión de cardiología.

Antecedentes: HTA, FA permanente, IRC estadio 3b (Cr basal 2.1 mg/dL), DM2,
hiperuricemia. Intervención coronaria percutánea en 2019.
Alergias: AINES (urticaria), contraste yodado (reacción anafiláctica previa).

Medicación habitual: Warfarina 5mg/día, Bisoprolol 5mg/12h,
Ramipril 5mg/día, Furosemida 40mg/día, Alopurinol 100mg/día,
Omeprazol 20mg/día, Metformina 850mg/12h.

Motivo de consulta: Revisión anual. Refiere episodio de epistaxis hace 2 semanas
que cedió con compresión. Niega sangrado digestivo ni hematuria. Buen control
tensional en domicilio (130-140/80-85 mmHg). Disnea de esfuerzo moderada estable.

Exploración: TA 138/84 mmHg, FC 68 lpm irregular, FR 16 rpm,
SatO2 96% basal. Peso 84kg. Apirético.
ACR: Arrítmico. No soplos. MVC con algún crepitante bibasal fino.
Abdomen: Normal. MMII: No edemas.

Analítica reciente (hace 3 días):
- Hb 11.2 g/dL, Hto 33%, VCM 89 fL
- Leucocitos 7.800/mm3, Plaquetas 178.000/mm3
- Creatinina 2.4 mg/dL (↑ vs basal), Urea 68 mg/dL
- Na 138 mEq/L, K 5.2 mEq/L
- INR 3.8 (rango terapéutico 2-3)
- Glucemia basal 142 mg/dL, HbA1c 7.8%
- Perfil hepático normal

ECG: FA con respuesta ventricular controlada ~65-70 lpm.
Ecocardiograma (hace 6 meses): FE 48%, hipertrofia VI moderada, AI dilatada.

Plan: Reducir warfarina a 4mg/día (INR supraterapeútico),
control analítico en 2 semanas. Valorar cambio a ACOD dado nivel de anticoagulación
inestable + IR moderada (consulta con nefrología antes). Mantener resto medicación.
Derivar a endocrinología por mal control diabético. Restricción hídrica 1.5L/día.
"""

# Note 2: Diabetes - DM2 + metformin + peripheral neuropathy
DIABETES_NOTE = """
Mujer de 58 años, diabética tipo 2 de 12 años de evolución,
acude a revisión trimestral a consulta de Atención Primaria.

Antecedentes: DM2 (insulinizada desde hace 2 años), HTA, dislipemia,
obesidad grado II (IMC 34.2). No fumadora. No alergias conocidas.

Tratamiento: Insulina glargina 32UI/noche, Metformina 1000mg/12h,
Sitagliptina 100mg/día, Enalapril 10mg/día, Atorvastatina 40mg/noche,
Aspirina 100mg/día (prevención secundaria - ACV lacunar en 2021).

Motivo de consulta: Peor control glucémico en las últimas semanas.
Refiere sensación de quemazón y parestesias en pies bilateral,
especialmente nocturna, de 3-4 meses de evolución. Niega úlceras ni
traumatismos recientes. Refiere mareos ocasionales al levantarse.

Glucemias en diario: basales 140-180 mg/dL, postprandiales 200-240 mg/dL.

Exploración: TA 152/88 mmHg (sentada), 138/78 mmHg (de pie - hipotensión ortostática).
Peso 91kg (+2kg vs última visita).
Exploración neurológica: Sensibilidad vibratoria disminuida en ambos pies.
Reflejos aquíleos abolidos bilateral. Monofilamento de Semmes-Weinstein:
respuesta reducida en 5/10 puntos. Pie derecho: cambios tróficos,
piel seca, ausencia vello. Pulsos pedios presentes y simétricos.
Fondo de ojo (última revisión hace 1 año): retinopatía no proliferativa leve.

Analítica:
- HbA1c 9.2% (objetivo <7%)
- Glucemia 186 mg/dL
- Creatinina 1.1 mg/dL, FGe 62 mL/min
- Microalbuminuria: 85 mg/g creatinina (↑, previamente normal)
- LDL 98 mg/dL, HDL 44 mg/dL, TG 210 mg/dL
- TSH 2.3 mUI/L

Diagnóstico principal: Mal control glucémico. Polineuropatía diabética periférica.
Nefropatía diabética incipiente (microalbuminuria).
Hipotensión ortostática de probable origen autonómico.

Plan: Aumentar insulina glargina a 36UI. Añadir Pregabalina 75mg/12h para neuropatía.
Derivar a endocrinología por HbA1c > 9%. Revisión de pie diabético en 3 meses.
Aumentar enalapril a 20mg/día por microalbuminuria.
Control analítico completo en 3 meses.
"""

# Note 3: COPD exacerbation with negative history elements
COPD_NOTE = """
Varón de 65 años, exfumador (IPA 45), que acude a urgencias por disnea progresiva.

Antecedentes: EPOC GOLD III (FEV1 42% basal), cor pulmonale, HTA.
No diabetes. No cardiopatía isquémica. No neoplasia conocida.
No alergias medicamentosas.

Medicación habitual: Tiotropio 18mcg/día (inhalador),
Salmeterol/fluticasona 50/500mcg/12h, Salbutamol inhalado a demanda.

Motivo de consulta: Aumento de disnea de 3 días de evolución hasta
hacerse de mínimos esfuerzos. Aumento del volumen y purulencia del esputo
(de blanquecino a amarillo-verdoso). Niega fiebre.
Niega dolor torácico. Descarta hemoptisis.
Niega clínica de TVP (sin dolor ni edema en MMII). Sin viajes recientes.

Exploración:
TA 148/88 mmHg, FC 98 lpm, FR 26 rpm, Temperatura 37.1°C, SpO2 83% basal (→ 91% con VMF al 35%).
Peso 71kg. Regular estado general. Uso de musculatura accesoria.
ACR: Murmullo vesicular muy disminuido globalmente. Roncus bilaterales.
Sin sibilancias audibles. Tonos cardíacos apagados. No soplos.
Abdomen: Normal.
MMII: Leve edema bilateral hasta tobillo. Sin signos de TVP.
Neurológico: Alerta y orientado. No asterixis.

Gasometría arterial basal:
- pH 7.34
- pO2 51 mmHg
- pCO2 58 mmHg
- HCO3 31 mEq/L
- SatO2 83%

Analítica:
- Hb 16.8 g/dL (poliglobulia secundaria)
- Leucocitos 14.200/mm3 (neutrofilia 82%)
- PCR 78 mg/L
- Creatinina 1.3 mg/dL
- BNP 320 pg/mL

Rx tórax: Hiperinsuflación bilateral. Sin condensaciones.
Sin derrame pleural. Silueta cardíaca amplia.

Diagnóstico: Exacerbación grave de EPOC de probable etiología infecciosa bacteriana.
Insuficiencia respiratoria hipercápnica parcialmente compensada.

Tratamiento: Ingreso en planta neumología.
Broncodilatadores: Ipratropio 500mcg + Salbutamol 5mg nebulizados c/4h.
Corticoides sistémicos: Prednisona 40mg/día vía oral 5 días.
Antibioterapia: Amoxicilina-clavulánico 875/125mg/8h oral 7 días.
Oxigenoterapia controlada VMF 28% para SpO2 88-92%.
Monitorización gasométrica en 2h.
"""

# Note 4: Post-surgical with vitals, labs, procedure history
POSTSURGICAL_NOTE = """
Alta hospitalaria. Mujer de 67 años intervenida de neoplasia de colon.

Diagnóstico principal: Adenocarcinoma de colon descendente pT3N1M0 (estadio III).
Diagnóstico secundario: HTA, hipotiroidismo subclínico.

Procedimiento realizado: Hemicolectomía izquierda laparoscópica con anastomosis
término-terminal el 28/03/2026. Cirugía sin incidencias. EBL estimado 250mL.
Tiempo quirúrgico 180 minutos. Reconversión a laparotomía: no.

Evolución postoperatoria (días 1-7):
- Día 1-2: UCI. Analgesia IV. Tolerancia oral al día 3.
- Día 4: Inicio deambulación. Herida quirúrgica sin signos infección.
- Día 5-6: Dolor abdominal moderado controlado con tramadol oral.
- Día 7 (hoy): Buen estado general. Tolerando dieta blanda.

Al alta:
TA 132/78 mmHg, FC 76 lpm, FR 14 rpm, Temperatura 36.8°C, SpO2 98%.
Peso 63kg (−2.5kg vs ingreso).

Analítica al alta:
- Hb 9.8 g/dL (anemia posquirúrgica)
- Plaquetas 487.000/mm3
- PCR 18 mg/L (en descenso)
- Leucocitos 9.100/mm3
- Na 138 mEq/L, K 3.9 mEq/L
- Creatinina 0.9 mg/dL
- Albúmina 2.9 g/dL (hipoalbuminemia leve)
- TSH 4.8 mUI/L

Medicación al alta:
- Tramadol retard 100mg/12h (máximo 5 días, luego paracetamol)
- Enoxaparina 40mg/día SC (profilaxis TEP 4 semanas)
- Pantoprazol 40mg/día
- Hierro oral: Ferroglicina sulfato 567mg/12h (anemia posquirúrgica)
- Levotiroxina 50mcg/día (inicio nuevo, por TSH elevada)

Cita oncología médica en 4 semanas para valorar quimioterapia adyuvante
(FOLFOX 6 meses según protocolo). Revisión cirugía en 2 semanas.
Herida quirúrgica: retirar puntos en Atención Primaria a los 10-12 días.
Restricciones: no conducir 4 semanas, no levantamiento pesos >3kg por 6 semanas.

Pronóstico: Moderado. Estadio III con posible beneficio de quimioterapia adyuvante.
"""

# Note 5: Polypharmacy - 8+ medications with real interactions
POLYPHARMACY_NOTE = """
Paciente varón de 80 años, pluripatológico, que acude a revisión semestral
de medicina interna.

Antecedentes: FA permanente, HTA, ICC sistólica (FEVI 35%), DM2 insulinizada,
IRC crónica estadio 3a, anemia ferropénica, gota, depresión mayor,
enfermedad de Alzheimer leve.

Alergias: Penicilinas (exantema), Sulfamidas.

Medicación habitual (9 fármacos):
1. Warfarina 4mg/día (FA)
2. AAS 100mg/día (prevención secundaria cardíaca) ← INTERACCIÓN CON WARFARINA
3. Digoxina 0.125mg/día (control FC en FA + ICC)
4. Furosemida 40mg/12h (ICC)
5. Espironolactona 25mg/día (ICC)
6. Metformina 500mg/12h (DM2)
7. Insulina NPH 20UI/noche
8. Alopurinol 100mg/día (gota)
9. Sertralina 50mg/día (depresión)
10. Donepezilo 10mg/noche (Alzheimer)
11. Omeprazol 20mg/día

Motivo de consulta: El paciente viene acompañado de familiar.
Refiere empeoramiento del estado general en las últimas 2 semanas.
Anorexia marcada. Náuseas matutinas. Confusión fluctuante (familiar refiere
que "está más despistado"). Niega vómitos. Niega fiebre.
Niega disnea de reposo (tiene disnea a medianos esfuerzos estable).

Exploración:
TA 108/62 mmHg (↓, habitualmente 130-140/80), FC 56 lpm irregular.
Peso 68kg (-3kg vs hace 6 meses). FR 18 rpm. SatO2 94%.
Consciente, desorientado en tiempo. MMII: edemas bimaleolares ++.
ACR: Arrítmico, soplo sistólico eyectivo grado II/VI.
Crepitantes bibasales. Ingurgitación yugular leve.

Analítica de hoy:
- Na 128 mEq/L (hiponatremia) ← VALOR CRÍTICO
- K 5.8 mEq/L (hiperpotasemia) ← VALOR CRÍTICO
- Creatinina 2.8 mg/dL (deterioro agudo, basal 1.8)
- Urea 98 mg/dL
- Glucemia 88 mg/dL
- Digoxinemia: 2.8 ng/mL (rango terapéutico 0.5-2.0) ← TÓXICO
- INR 4.2 (supraterapeútico)
- Hb 9.1 g/dL
- BNP 890 pg/mL

Plan urgente: Ingreso hospitalario por intoxicación digitálica +
fracaso renal agudo + alteraciones electrolíticas graves.
Suspender digoxina. Suspender espironolactona temporalmente.
Reducir warfarina urgente (INR 4.2). Ajuste de metformina por FRA.
Restricción hídrica estricta. Monitorización ECG continua.
Revisión completa de medicación (deprescripción urgente).
"""


# Collection for easy access in tests
ALL_NOTES = {
    "cardiology": CARDIOLOGY_NOTE,
    "diabetes": DIABETES_NOTE,
    "copd": COPD_NOTE,
    "postsurgical": POSTSURGICAL_NOTE,
    "polypharmacy": POLYPHARMACY_NOTE,
}
