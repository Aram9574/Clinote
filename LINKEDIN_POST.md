# LINKEDIN POST — CLINOTE

---

## VERSION CORTA (Post estandar — ~1.100 caracteres)

> Listo para copiar y pegar directamente en LinkedIn. Usa saltos de linea tal como aparecen.

---

He construido CLINOTE: una herramienta que convierte notas clinicas en español en registros medicos estructurados en segundos.

El problema real: los medicos hispanohablantes invierten hasta el 40% de su jornada documentando. Esa informacion queda atrapada en texto libre, invisible para sistemas de soporte clinico, incompatible con los estandares de interoperabilidad.

Lo que hace CLINOTE:

→ Analiza la nota clinica libre con Claude Sonnet via streaming SSE
→ Extrae entidades: diagnosticos, farmacos, laboratorio, constantes vitales, alergias
→ Genera el SOAP estructurado automaticamente
→ Lanza 3 modulos de soporte de decision en paralelo: interacciones RxNorm, valores criticos (35+ reglas), razonamiento LLM contextual
→ Exporta un bundle FHIR R4 valido listo para integracion con HCE
→ Recupera evidencia de PubMed y Cochrane en segundo plano

El stack tecnico:

Next.js 15 + FastAPI Python 3.11 + Supabase (PostgreSQL + RLS multitenant) + Redis + Anthropic Claude + Stripe

Arquitectura multi-tenant con Row-Level Security, rate limiting por plan, cumplimiento RGPD y 27/27 tests pasando.

El proyecto esta en GitHub con Docker Compose para levantar el entorno en 3 pasos.

Si trabajas en HealthTech, interoperabilidad clinica o simplemente te interesa ver como combinar IA generativa con estandares medicos, echale un vistazo.

#IA #HealthTech #SaaS #Python #NextJS #MedTech #FHIR #NLP #FastAPI #Supabase

---

## VERSION LARGA (Articulo LinkedIn)

> Para publicar como articulo en LinkedIn. Sin limite de caracteres. Usa los saltos de linea y secciones tal como aparecen.

---

**Titulo del articulo:**
CLINOTE: lo que aprendi construyendo un SaaS de NLP clinico para medicos hispanohablantes

---

**Cuerpo del articulo:**

Llevo tiempo pensando en un problema concreto que afecta a millones de medicos en Espana y Latinoamerica: la documentacion clinica.

Un medico de atencion primaria puede atender entre 30 y 50 pacientes al dia. Por cada consulta escribe una nota en texto libre. Esas notas contienen todo lo que importa clinicamente: diagnosticos activos, farmacos, interacciones potenciales, valores de laboratorio criticos. Pero esa informacion esta enterrada en parrafos sin estructura, en abreviaturas especificas de cada especialidad (HTA, DM2, EPOC, IAM, IRC...), en un formato que ningun sistema informatico puede procesar directamente.

El resultado: los sistemas de soporte de decision clinica (CDSS) no funcionan porque no tienen datos estructurados. Los registros no son interoperables. Y el medico sigue copiando y pegando manualmente lo mismo de siempre.

Decidi construir CLINOTE para atacar exactamente ese problema.

---

**Que hace CLINOTE**

CLINOTE recibe una nota clinica en español, en texto libre, exactamente como la escribiria un medico. Sin formularios. Sin campos estructurados. Sin cambiar el flujo de trabajo.

En el backend, un pipeline de streaming SSE procesa la nota en tiempo real:

1. Claude Sonnet extrae las entidades clinicas (diagnosticos, farmacos con dosis y via, alergias, valores de laboratorio, constantes vitales, procedimientos, antecedentes familiares) y construye el SOAP estructurado — todo en una unica llamada al modelo, con respuesta JSON parseada sobre el stream.

2. El motor CDSS lanza tres modulos en paralelo:
   — Comprobacion de interacciones farmacologicas via API RxNorm/NLM
   — Motor de reglas de valores criticos (35+ umbrales: potasio > 6.0, SpO2 < 90%, hemoglobina < 7.0...)
   — Razonamiento contextual LLM para riesgos que las reglas no capturan (se activa con 2+ diagnosticos o 3+ farmacos)

3. El mapper FHIR R4 genera un bundle valido con recursos Condition, MedicationStatement, Observation, AllergyIntolerance y Procedure, listo para integracion con cualquier HCE compatible con HL7.

4. En segundo plano, un task asincrono busca evidencia en PubMed E-utilities y Cochrane, con cache de 24h en Supabase, y la entrega via SSE cuando esta disponible.

El medico ve los resultados apareciendo en pantalla en tiempo real. El tiempo medio de procesamiento es inferior a 3 segundos para la extraccion primaria.

---

**El stack tecnico y por que cada pieza**

Next.js 15 con App Router para el frontend — SSR nativo, proteccion de rutas con middleware, y la UI construida con Tailwind + shadcn/ui con un sistema de diseño propio (paleta Navy/Teal, alertas en ambar y rojo critico).

FastAPI + Python 3.11 para el backend — el soporte nativo de async generators hace que la implementacion SSE sea limpia y legible. El rate limiting se gestiona con slowapi + Redis, con limites distintos por plan (free: 2 req/min, pro: 10 req/min, clinic: 30 req/min).

Supabase como capa de datos — PostgreSQL con Row-Level Security para el aislamiento multitenant real. 7 tablas, 14 politicas RLS, 4 funciones PostgreSQL. Los usuarios de una organizacion no pueden acceder a los datos de otra, y eso esta garantizado a nivel de base de datos, no solo de aplicacion.

Redis / Upstash para rate limiting y cache de evidencia. Si Redis no esta disponible en desarrollo, slowapi cae a memoria en proceso — aceptable en local, no en produccion.

Stripe para la gestion de suscripciones — checkout, portal de cliente, webhooks con verificacion HMAC. Setup automatizado con un script Python que crea los productos y precios y devuelve los IDs.

---

**Seguridad y cumplimiento**

Desde el principio diseñe el sistema para ser RGPD-compatible:

- Las notas clinicas nunca se almacenan en crudo en los logs de auditoria. Solo se guarda un hash de la nota, junto con el user_id, IP y user-agent.
- Cada accion del usuario genera un registro de auditoria en una tabla dedicada con patron fire-and-forget (nunca bloquea la respuesta).
- El sanitizador de entrada usa expresiones regulares para detectar intentos de prompt injection, preservando intencionalmente los patrones del texto clinico (dosis de farmacos, valores de laboratorio, abreviaturas medicas).
- Auditoria de seguridad completa: 0 issues criticos. Todas las rutas autenticadas, inputs validados, sin secretos hardcodeados, CORS restringido.

La documentacion RGPD completa (base legal, plazos de retencion, derechos del paciente, plantilla DPA) esta en el repositorio.

---

**Infraestructura y CI/CD**

Backend desplegado en Railway via Dockerfiles multi-stage con usuario no-root. Frontend en Vercel con headers de seguridad configurados (X-Frame-Options, X-Content-Type-Options, Referrer-Policy).

GitHub Actions con dos pipelines:
- CI: pytest + tsc + next build en cada push y PR
- CD: deploy paralelo a Railway y Vercel en merge a main

27/27 tests unitarios pasando (completamente mockeados, sin necesidad de API key real para ejecutarlos).

---

**Lo que aprendie construyendo esto**

El parsing de JSON sobre un stream de tokens no es trivial cuando el modelo puede envolver la respuesta en bloques de codigo markdown. Hay que limpiar el wrapper antes de parsear, y manejar el error sin romper el stream completo al usuario.

El aislamiento multitenant real requiere pensar la seguridad a nivel de base de datos, no solo de aplicacion. Las politicas RLS de Supabase son la implementacion correcta, pero añaden complejidad al modelo de datos que hay que diseñar desde el principio.

Combinar tres fuentes de alertas clinicas (reglas deterministicas + API externa + razonamiento LLM) en una respuesta coherente obliga a pensar bien en como deduplicar, priorizar y presentar la informacion al medico sin generar ruido.

---

**Donde esta el proyecto**

El repositorio esta en GitHub con Docker Compose para levantar el entorno completo en 3 pasos. Incluye fixtures clinicos realistas en español para probar el sistema localmente sin necesidad de datos reales.

Si trabajas en HealthTech, interoperabilidad clinica, NLP medico, o simplemente te interesa la arquitectura de sistemas de IA en produccion, estare encantado de leer tus comentarios o preguntas.

#IA #HealthTech #SaaS #Python #NextJS #MedTech #FHIR #NLP #FastAPI #Supabase #OpenSource #ClinicalNLP #DigitalHealth #España #Latinoamerica
