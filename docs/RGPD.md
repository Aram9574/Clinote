# CLINOTE — Cumplimiento del RGPD

## 1. Responsable del tratamiento

**Nombre:** CLINOTE SL (en constitución)
**Contacto DPD:** privacy@clinote.app
**Sede:** España

---

## 2. Datos tratados

### 2.1 Datos de usuario (cuenta)
- Email, nombre completo, rol (médico/admin)
- Datos de autenticación (gestionados por Supabase Auth)
- Información de suscripción (gestionada por Stripe)

### 2.2 Datos clínicos procesados
CLINOTE procesa notas clínicas que pueden contener datos de salud de pacientes (Categoría Especial según Art. 9 RGPD).

**Pseudoanonimización:** Las notas clínicas se procesan pero NO se almacena el texto original. Solo se persiste:
- El hash SHA-256 de la nota (para deduplicación)
- Las entidades clínicas extraídas (diagnósticos, medicamentos, etc.)
- La nota SOAP estructurada
- El bundle FHIR

**No almacenamos:**
- El texto original de la nota clínica
- Datos identificativos del paciente (nombre, DNI, fecha de nacimiento)
- Imágenes o documentos adjuntos

### 2.3 Datos de auditoría
- Logs de acciones del usuario (qué acción, cuándo, IP)
- Retenidos 12 meses

---

## 3. Base jurídica del tratamiento

| Finalidad | Base jurídica | Artículo RGPD |
|-----------|--------------|---------------|
| Prestación del servicio | Ejecución de contrato | Art. 6.1.b |
| Mejora del servicio | Interés legítimo | Art. 6.1.f |
| Datos de salud de pacientes | Interés legítimo médico / consentimiento | Art. 9.2.h + Art. 9.2.a |
| Facturación | Obligación legal | Art. 6.1.c |
| Comunicaciones comerciales | Consentimiento | Art. 6.1.a |

**Nota sobre datos de pacientes:** El médico es el responsable del tratamiento de los datos de sus pacientes. CLINOTE actúa como encargado del tratamiento. Se requiere contrato DPA (ver sección 7).

---

## 4. Política de retención

| Tipo de dato | Retención | Acción al vencer |
|-------------|-----------|-----------------|
| Cuenta de usuario | Hasta eliminación de cuenta | Anonimización o borrado |
| Casos clínicos | Hasta eliminación por usuario | Borrado en cascada |
| Logs de auditoría | 12 meses | Borrado automático |
| Caché de evidencia | 24 horas | Borrado automático |
| Datos de facturación | 7 años (obligación fiscal) | Archivado seguro |

---

## 5. Derechos del interesado

El usuario puede ejercer los siguientes derechos contactando a privacy@clinote.app:

- **Acceso (Art. 15):** Exportación de todos sus datos via `/api/v1/users/export`
- **Rectificación (Art. 16):** Actualización de datos de perfil
- **Supresión (Art. 17):** Eliminación de cuenta y todos sus datos
- **Portabilidad (Art. 20):** Exportación en formato JSON/FHIR
- **Oposición (Art. 21):** Desactivación del tratamiento para mejora del servicio
- **Limitación (Art. 18):** Posibilidad de pausar el tratamiento

**Tiempo de respuesta:** 30 días naturales (ampliable a 60 días con notificación).

---

## 6. Transferencias internacionales

| Proveedor | País | Mecanismo |
|-----------|------|-----------|
| Anthropic (Claude API) | EEUU | Cláusulas Contractuales Tipo (CCT) |
| Supabase | EEUU / UE | CCT + opción región UE |
| Vercel | EEUU | CCT |
| Railway | EEUU | CCT |
| Stripe | EEUU | CCT + Privacy Shield sucesor |

**Recomendación para uso clínico:** Se recomienda configurar Supabase en región EU (Frankfurt) para minimizar transferencias de datos de salud fuera de la UE.

---

## 7. Contrato de Encargado del Tratamiento (DPA)

Para clientes B2B (plan Clínica), CLINOTE actúa como encargado del tratamiento de los datos de los pacientes del cliente.

### Cláusulas mínimas del DPA:

1. **Objeto y duración:** CLINOTE procesa datos de salud pseudoanonimizados en nombre del Centro/Clínica para la finalidad de documentación clínica.

2. **Naturaleza del tratamiento:** Procesamiento automatizado con IA para extracción de entidades clínicas y generación de documentación estructurada.

3. **Tipo de datos:** Entidades clínicas extraídas (diagnósticos, medicamentos, valores analíticos). NO texto original completo.

4. **Categorías de interesados:** Pacientes del Centro Sanitario.

5. **Obligaciones del Encargado (CLINOTE):**
   - Tratar los datos únicamente conforme a instrucciones documentadas
   - Garantizar la confidencialidad del personal con acceso
   - Implementar medidas técnicas y organizativas adecuadas
   - No subcontratar sin autorización previa
   - Asistir al Responsable en el ejercicio de derechos
   - Suprimir o devolver datos al término del contrato
   - Aportar información para auditorías

6. **Subencargados autorizados:** Anthropic Inc. (procesamiento IA), Supabase Inc. (almacenamiento)

7. **Medidas de seguridad:** Cifrado en tránsito (TLS 1.3), cifrado en reposo, control de acceso por roles, logs de auditoría, MFA obligatorio para administradores.

---

## 8. Secciones requeridas en la Política de Privacidad

La política de privacidad publicada en el sitio web debe incluir:

- [ ] Identidad y datos de contacto del Responsable
- [ ] Datos de contacto del Delegado de Protección de Datos (si aplica)
- [ ] Finalidades y bases jurídicas del tratamiento
- [ ] Destinatarios de los datos (proveedores cloud)
- [ ] Transferencias internacionales y garantías
- [ ] Plazos de conservación
- [ ] Derechos del interesado y cómo ejercerlos
- [ ] Derecho a presentar reclamación ante la AEPD
- [ ] Si el suministro de datos es obligatorio o voluntario
- [ ] Existencia de decisiones automatizadas y lógica aplicada

---

## 9. Análisis de Riesgo (resumen)

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|-----------|
| Acceso no autorizado a datos clínicos | Baja | Alto | RLS Supabase + JWT + MFA |
| Fuga de datos en tránsito | Muy baja | Alto | TLS obligatorio |
| Uso indebido por empleado | Baja | Medio | Audit log, control de accesos |
| Incidente en proveedor cloud | Baja | Alto | Backups, proveedores certificados |
| Prompt injection → fuga datos | Muy baja | Medio | Sanitizador + pseudoanonimización |

---

*Última actualización: Abril 2026*
*Versión: 1.0*
