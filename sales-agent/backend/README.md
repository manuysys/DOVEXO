# ARVOKTA Sales Agent — Backend (Fases 1–5, incluye 3B)

API interna en FastAPI + SQLite con worker de cola persistente. Incluye login,
productos, campañas, descubrimiento provincial y nacional con
OpenStreetMap/Overpass, importación y exportación CSV, alta manual, contactos,
fuentes, deduplicación, enriquecimiento web con hechos y evidencia,
oportunidades, scoring determinístico, mensajes con aprobación, WhatsApp y CRM.
La IA opcional queda para más adelante.

## Requisitos

- Python 3.12 gestionado por `uv`.
- Sin Docker, sin servicios pagos, sin modelos de IA descargados.

## Puesta en marcha

```powershell
cd sales-agent/backend
Copy-Item .env.example .env   # solo la primera vez; completar JWT_SECRET y admin
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --port 8001
```

La base local queda en `data/arvokta.db`. Al iniciar, el backend aplica semillas
idempotentes: admin inicial (si `users` está vacía), 7 rubros, producto DOVEXO y
la campaña `DOVEXO — Argentina — Prospección inicial`.

Si el esquema no está migrado, `/api/v1/ready` responde 503 y el arranque avisa
que hay que ejecutar `alembic upgrade head`.

## Variables de entorno

| Variable | Comportamiento |
| --- | --- |
| `DATABASE_URL` | `sqlite:///./data/arvokta.db`. Las rutas relativas se resuelven contra `backend/`. |
| `JWT_SECRET` | Firma de JWT. Obligatorio de al menos 32 caracteres en producción. |
| `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` | Credenciales del admin inicial. Solo se usan si no hay usuarios. |
| `CORS_ORIGINS` | Orígenes permitidos, separados por coma. Por defecto `http://localhost:3001`. |
| `APP_ENV` | `development` o `production`. En producción se desactivan docs y la cookie es `Secure`. |
| `LOG_LEVEL` | Nivel de logging (no se registran cuerpos, contraseñas ni tokens). |
| `OLLAMA_BASE_URL` / `OLLAMA_MODEL` | Reservadas para IA local opcional; todavía no se usan. |
| `OVERPASS_URL` | Endpoint de Overpass. Por defecto `https://overpass-api.de/api/interpreter`. |
| `OVERPASS_TIMEOUT_SECONDS` | Timeout de consulta/HTTP. Por defecto 60. |
| `OVERPASS_MAX_RETRIES` | Reintentos ante 429/5xx o error de red. Por defecto 2. |
| `OVERPASS_REQUEST_DELAY_SECONDS` | Espera entre consultas por rubro. Por defecto 0,5 s. |
| `OVERPASS_USER_AGENT` | User-Agent identificable enviado a Overpass. |
| `ENRICHMENT_USER_AGENT` | User-Agent identificable enviado a los sitios de las empresas. |
| `ENRICHMENT_TIMEOUT_SECONDS` | Timeout HTTP por página. Por defecto 10. |
| `ENRICHMENT_MAX_PAGE_BYTES` | Tamaño máximo por página. Por defecto 1 MB. |
| `ENRICHMENT_MAX_PAGES` | Páginas internas leídas por empresa. Por defecto 5. |
| `ENRICHMENT_MAX_REDIRECTS` | Redirecciones seguidas y validadas. Por defecto 3. |
| `ENRICHMENT_PAGE_DELAY_SECONDS` | Pausa entre páginas de una misma empresa. Por defecto 1 s. |
| `ENRICHMENT_JOB_DELAY_SECONDS` | Pausa del worker entre empresas del lote. Por defecto 1 s. |
| `ENRICHMENT_BATCH_LIMIT` | Empresas por defecto al encolar sin límite explícito. Por defecto 20; el máximo absoluto es 50. |
| `WHATSAPP_ACCESS_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` | Credenciales de Meta Cloud API. Si faltan, se usa el provider de consola. |
| `WHATSAPP_VERIFY_TOKEN` | Token de verificación del webhook. Sin él, `GET /webhooks/whatsapp` responde 503. |
| `WHATSAPP_APP_SECRET` | Secreto para validar `X-Hub-Signature-256`. Sin él, el webhook responde 503. |
| `WHATSAPP_SENDER_PHONE` | Número remitente informado por `/whatsapp/status`. |
| `WHATSAPP_API_VERSION` | Versión de Graph API. Por defecto `v23.0`. |
| `FOUNDER_PHONE` | Número que recibe aviso de cada WhatsApp entrante. Vacío = sin aviso. |

SQLite se abre con `journal_mode=WAL`, `foreign_keys=ON` y `busy_timeout` para
que API y worker compartan el archivo con transacciones cortas.

## Endpoints

Todos bajo `/api/v1`, salvo salud. La autenticación usa cookie HttpOnly
`arvokta_access` (JWT de 8 h, SameSite=Lax). También se acepta
`Authorization: Bearer <token>` para herramientas internas.

- `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`
- `GET /health`, `GET /ready`
- `GET /meta/provinces` (24 provincias), `GET /meta/sectors` (7 rubros)
- `GET|POST /products`, `GET|PATCH|DELETE /products/{id}` (`DELETE` desactiva)
- `GET|POST /campaigns`, `GET|PATCH /campaigns/{id}`,
  `POST /campaigns/{id}/start|pause|cancel`
- `POST /search-runs`, `GET /search-runs` (`campaign_id`, `status`,
  `province_code`, `limit`, `offset`), `GET /search-runs/{id}`,
  `POST /search-runs/{id}/retry|cancel`
- `POST /imports/preview`, `POST /imports/{id}/confirm`, `GET /imports`,
  `GET /imports/{id}`
- `GET /companies` (`search_run_id`, `query`, `province`, `sector`,
  `discovery_status`, `has_website`, `limit`, `offset`), `GET|POST /companies`,
  `GET|PATCH /companies/{id}`, `GET|POST /companies/{id}/contacts`,
  `GET /companies/export.csv` (solo admin)
- `POST /companies/{id}/enrich` (admin, síncrono), `POST /companies/enrich`
  (admin, lote de hasta 50), `GET /companies/enrich/jobs`,
  `GET /companies/enrich/jobs/{id}`
- `POST /companies/{id}/leads`, `GET /leads`, `GET|PATCH /leads/{id}`,
  `POST /leads/{id}/score`, `GET /leads/{id}/evaluations`
- `GET|POST /leads/{id}/activities`, `GET /activities`
- `POST /leads/{id}/messages/generate`, `GET /leads/{id}/messages`,
  `PATCH /messages/{id}`, `POST /messages/{id}/approve|send|mark-sent`
- `GET|POST /suppressions`, `DELETE /suppressions/{id}`
- `GET /whatsapp/status`, `POST /whatsapp/simulate/inbound`,
  `GET /whatsapp/threads`, `GET /whatsapp/threads/{id}` (alias `/threads/{id}`)
- `GET|POST /webhooks/whatsapp` (público, verificación y firma de Meta)
- `GET /dashboard/metrics|activity|jobs`
- `POST /jobs/noop` (solo admin; encola un trabajo de prueba)

## Campañas nacionales y por provincia

`POST /campaigns/{id}/start` crea **una búsqueda por provincia** del filtro de la
campaña (o las 24 si no hay filtros), con los rubros y el `limit` configurado en
`search_config` (1–200, por defecto 50). Cada búsqueda recibe su job `search_run`
en una única transacción. La respuesta es
`{campaign, search_runs: [{id, province_code, status}], total_jobs}`. El request
no llama a Overpass: solo encola.

El worker procesa los jobs secuencialmente. Una campaña nacional con 7 rubros
genera 24 jobs y hasta 168 consultas a Overpass, con espera entre consultas; puede
tardar varios minutos. `pause` cancela las búsquedas pendientes y deja terminar la
que ya esté en curso; `cancel` marca también las que están corriendo para que el
worker descarte sus resultados. Al reanudar con `start` se generan búsquedas
nuevas.

Solo se puede iniciar una campaña en `draft` o `paused`; una campaña `active` o
`cancelled` responde 409. `GET /campaigns/{id}` incluye los conteos de búsquedas
por estado. Cancelar una campaña no revierte las empresas que el worker ya haya
guardado.

## Importación CSV

`POST /imports/preview` recibe `multipart/form-data` con `file`:

- UTF-8 (acepta BOM), hasta 2 MB y 500 filas de datos.
- Detecta columnas por alias: `name`/`nombre`/`empresa`/`razón social`,
  `website`/`web`/`sitio`, `phone`/`teléfono`, `email`/`correo`,
  `province`/`provincia`, `locality`/`localidad`, `address`/`dirección` y
  `sectors`/`sector`/`rubro`.
- Acepta separadores `,`, `;` o tab. Los rubros se separan con `,`, `;`, `|` o
  `/` y se normalizan contra el catálogo (slug, nombre o sinónimo).
- Valida provincia, web, teléfono, email y rubros. Las filas inválidas se
  informan con `row_number` y `message`; las duplicadas se detectan contra la
  base y dentro del archivo.
- El preview no crea empresas.

`POST /imports/{id}/confirm` crea solo las filas válidas y no duplicadas. Es
idempotente: si se repite devuelve los mismos conteos y no duplica empresas. Las
empresas importadas quedan con `discovery_status = imported` (o
`possible_duplicate` si el nombre es parecido), `source_type = csv_import` y la
referencia del archivo en la fuente.

Retención: del lote se guardan el mapeo, las filas válidas normalizadas y los
errores; **no se guarda el archivo original**. Esos datos contienen contactos
comerciales y quedan en la base local hasta que un administrador los depure
manualmente. No hay borrado automático en esta fase.

`POST /search-runs` recibe `{province_code, sector_slugs, keywords?, limit?,
campaign_id?}`. Valida provincia y rubros y crea un `SearchRun` + `Job`
`search_run` en una sola transacción. Una campaña nacional se materializa como
una búsqueda por provincia (ver “Campañas nacionales y por provincia”); el
worker las procesa secuencialmente y una falla de Overpass queda registrada en
la búsqueda y en su job, sin inventar empresas.

`POST /companies` es el alta manual. Ante un duplicado exacto por dominio,
teléfono o nombre + localidad responde 409 con `detail` y `duplicate_of`. Si la
coincidencia es difusa, guarda la empresa como `possible_duplicate` y la
devuelve. `DELETE` no se implementó para empresas: se corrigen con `PATCH`.

## Revisión de posibles duplicados

`GET /companies?discovery_status=possible_duplicate` lista los registros que
coincidieron de forma difusa. Se corrigen con `PATCH /companies/{id}` y
`discovery_status` puede pasar a `discovered`, `possible_duplicate`, `rejected`,
`archived`, `manual`, `imported` o `enriched`. No hay borrado de empresas.

## Exportación CSV

`GET /companies/export.csv` (admin) acepta los mismos filtros que el listado y
devuelve UTF-8 con BOM, encabezados en español y una fila por empresa con rubros,
contactos principales y fuente. Las celdas que comienzan con `=`, `+`, `-`, `@`,
tab, CR o LF se prefijan con un apóstrofo para que Excel no las ejecute como
fórmula; los datos guardados no se modifican.

## Enriquecimiento web (Fase 3B)

Lee el sitio oficial de una empresa y guarda datos con evidencia. No usa
navegador headless, IA ni APIs pagas. La tabla `company_facts` se creó en la
migración `99fc0d443a3e` (solo agrega una tabla; es compatible con SQLite y su
`downgrade` la elimina).

### Endpoints

- `POST /companies/{id}/enrich` (solo admin): enriquece una empresa de forma
  síncrona. Devuelve `company_id`, `status`, `fields_updated`,
  `contacts_added`, `facts_added`, `sources_added`, `evidence` y `error`.
  Responde 400 si la empresa no tiene web o si la URL es `unsafe`; 502 si el
  sitio no se pudo leer.
- `POST /companies/enrich` (solo admin): encola un lote. Acepta
  `{company_ids?, limit?, search_run_id?, province?, sector?, query?}`; si no se
  envían IDs, usa los filtros y solo considera empresas con web. El máximo es
  50 empresas y el límite por defecto es `ENRICHMENT_BATCH_LIMIT` (20). Devuelve
  `{queued, skipped, jobs: [{id, company_id, status}], candidates}`. Omite
  empresas sin web y las que ya tienen un job activo. Un pedido con más de 50
  IDs responde 422.
- `GET /companies/enrich/jobs?limit=50` (solo admin; límite 1–200): jobs de
  enriquecimiento con estado, intentos, `max_attempts`, error y resultado.
- `GET /companies/enrich/jobs/{id}` (solo admin): detalle de un job.
- `GET /companies?has_website=true|false`: filtra empresas con o sin sitio web.

El detalle de empresa incluye `facts` y cada contacto con `source_url`,
`source_title`, `source_collected_at`, `source_confidence` y `verified_at`.

### Datos y procedencia

`company_facts` guarda `fact_type`, `value`, `normalized_value`, `source_url`,
`source_title`, `evidence_excerpt`, `confidence`, `collected_at` y
`source_id`. Tipos usados: `service`, `activity`, `locality`, `coverage`,
`contact_page` y `description`. La página leída también queda en
`company_sources` con `source_type="website"`.

Un contacto extraído del sitio queda `published`, no `verified`: la etiqueta
“Publicado” indica que aparece en el sitio y “Verificado manualmente” que una
persona lo confirmó. Un WhatsApp solo se crea desde un enlace explícito
`wa.me`, `api.whatsapp.com` o `whatsapp://` que incluya teléfono; nunca se marca
`verified` automáticamente. El proceso no pisa contactos manuales, verificados
ni `do_not_contact`, no degrada evidencia existente y no completa campos que el
sitio no publica.

### Seguridad y límites

- Solo HTTP/HTTPS públicos. Se bloquean loopback, redes privadas, link-local y
  endpoints de metadata; las redirecciones se validan una por una (máximo 3).
- Timeout de 10 s, 1 MB por página y máximo 5 páginas internas por empresa.
- User-Agent identificable y pausa entre páginas (`ENRICHMENT_PAGE_DELAY_SECONDS`).
- Sin APIs pagas, sin scraping autenticado y sin ejecutar JavaScript.

### Worker, errores y reintentos

El worker procesa `enrich_company` de a una empresa, con una pausa entre jobs
(`ENRICHMENT_JOB_DELAY_SECONDS`). Cada job tiene 3 intentos con backoff creciente
(30 s × intento, tope de 300 s).

| Situación | Resultado |
| --- | --- |
| Sitio leído | `ok`; guarda hechos, fuentes y contactos. |
| Empresa sin web | `no_website`; no crea nada. |
| Error de red, DNS, 403/404 | `fetch_error`; el job se reintenta hasta 3 veces. |
| URL interna, loopback, metadata o redirección bloqueada | `unsafe`; no se reintenta. |

`last_enriched_at` se actualiza solo cuando la investigación terminó con datos
leídos. Un error de red o una URL bloqueada no cuentan como empresa investigada.
Las páginas internas que fallan se omiten sin abortar el resto del sitio. Los
errores quedan visibles en el job; no se rellenan datos faltantes.

## Oportunidades, scoring y CRM

`POST /companies/{id}/leads` crea una oportunidad única por empresa y producto;
sin `product_id` usa DOVEXO. `GET /leads` acepta `status`, `product_id`,
`company_id`, `limit` y `offset`. `PATCH /leads/{id}` permite estado, notas y
próximo seguimiento; cada cambio queda en `activities`.

El scoring es determinístico y no usa IA. Toma los factores de
`product.scoring_config`, evalúa rubros, web, dirección, teléfono/email, fuentes
y texto disponible, y calcula por separado:

- compatibilidad comercial (0–100), y
- confianza de la información (0–100).

Cada evaluación guarda `score_breakdown`, razones legibles y las fuentes usadas.
Una ficha incompleta obtiene menor confianza; no se completan datos faltantes.
`GET /leads/{id}/evaluations` conserva el historial.

`GET|POST /leads/{id}/activities` y `GET /activities` registran llamadas, notas,
seguimientos y cambios de estado.

## Mensajes y aprobación

`POST /leads/{id}/messages/generate` genera un texto determinístico para
WhatsApp (`first_contact`, `follow_up` o `demo_invite`) con el remitente “Juan
Manuel, de ARVOKTA”, datos guardados de la empresa/producto y una vía de baja
(“respondé BAJA”). Queda en `pending_approval`; no se envía.

El flujo es: editar (`PATCH /messages/{id}`), aprobar
(`POST /messages/{id}/approve`), enviar (`POST /messages/{id}/send`) y, si el
envío se hizo por fuera, marcar manualmente (`POST /messages/{id}/mark-sent`).
No se puede enviar ni marcar sin aprobación.

Sin credenciales de Meta se usa `ConsoleWhatsAppProvider`: devuelve
`status = simulated`, guarda `delivery_status`, no marca `sent_at` y no envía
nada real. Con `WHATSAPP_ACCESS_TOKEN` y `WHATSAPP_PHONE_NUMBER_ID` se usa
`MetaWhatsAppProvider` contra Graph API. No hay envíos en frío ni masivos.

Los mensajes se bloquean si la empresa, el teléfono o el contacto están en la
lista de no contacto.

## WhatsApp

`GET /whatsapp/status` indica `configured`, `mode` (`meta` o `console`),
`sender_phone` y si hay `FOUNDER_PHONE`.

El webhook `GET /webhooks/whatsapp` responde el `hub.challenge` con el token
configurado. `POST /webhooks/whatsapp` valida `X-Hub-Signature-256` sobre los
bytes crudos, limita a 1 MB, es idempotente por `wa_message_id`, guarda el
inbound, actualiza el lead/actividad y responde con un bot breve que agradece,
pregunta qué servicio se necesita y ofrece handoff humano. Si hay
`FOUNDER_PHONE`, avisa al fundador. Un remitente desconocido queda en un thread
sin empresa/contacto; no se inventa una empresa. Los envíos del bot y del aviso
respetan la lista de no contacto.

`POST /whatsapp/simulate/inbound` (solo admin) prueba el flujo sin Meta. Los
threads se consultan en `GET /whatsapp/threads` y `GET /whatsapp/threads/{id}`.

## Lista de no contacto

`GET|POST /suppressions` y `DELETE /suppressions/{id}`. Se puede suprimir una
empresa completa, un teléfono, un email o un contacto normalizado. La supresión
por empresa se guarda con la clave `company:{id}`. Bloquea generación y envío de
mensajes y respuestas automáticas de WhatsApp.

## Descubrimiento con OpenStreetMap (Fase 2A)

El provider consulta Overpass una vez por rubro, filtrando por
`area["ISO3166-2"="AR-X"]["boundary"="administrative"]`. Los resultados se
normalizan (nombre, web, teléfono, email, WhatsApp publicado, dirección,
localidad, coordenadas, URL de OSM y tags) y se descartan los elementos sin
nombre. Si Overpass devuelve una lista vacía, la búsqueda termina `completed`
con `records_found = 0`; no se inventan empresas.

Mapeo conservador de etiquetas:

| Rubro | Etiquetas OSM |
| --- | --- |
| `hvac` | `craft=hvac`, `shop=hvac` |
| `it_support` | `office=it`, `shop=computer` |
| `electronic_security` | `shop=security` |
| `industrial_maintenance` | `industrial=machine_shop` |
| `gates_automation` | `shop=doors` |
| `appliance_repair` | `craft=electronics_repair` |
| `electrical_installations` | `craft=electrician` |

Dudas documentadas:

- `industrial=machine_shop` es un proxy imperfecto: identifica talleres
  industriales, no necesariamente empresas de mantenimiento.
- `shop=doors` incluye venta de puertas y aberturas; no garantiza
  automatización de portones.
- `shop=appliance` y `shop=electrical` se excluyeron porque son principalmente
  retail y no servicio técnico.
- `office=security` se excluyó porque suele incluir vigilancia y no
  necesariamente seguridad electrónica.
- El rubro se infiere de etiquetas explícitas; cuando el mapeo no alcanza, la
  empresa queda sin rubro y se revisa manualmente.

La búsqueda por palabras clave agrega una consulta por `name` sobre elementos con
`craft`, `shop`, `office` o `industrial`. No reemplaza la búsqueda por rubro y
respeta el mismo límite total.

Los datos de OpenStreetMap requieren atribución (`© OpenStreetMap contributors`)
cuando se muestren en la interfaz. El backend conserva la URL del elemento para
poder trazarlos.

Los teléfonos se normalizan con `phonenumbers` (región AR) y se conserva el valor
original. Un teléfono **nunca** se convierte en WhatsApp: solo se guarda como
WhatsApp un enlace `wa.me`/`api.whatsapp.com` publicado o una carga manual
explícita. Los contactos de OSM quedan `published`; los manuales, `unverified`.

## Deduplicación

Orden: dominio normalizado, teléfono normalizado, URL de OSM (ID de proveedor),
nombre normalizado + localidad y RapidFuzz (`WRatio` ≥ 90) para posibles
duplicados. Los exactos no crean una empresa nueva y se cuentan en `duplicates`;
aun así se registra la fuente de la corrida para poder filtrar por
`search_run_id`. Los difusos se guardan con `discovery_status =
possible_duplicate`. No hay fusión automática. La comparación difusa se limita a
500 candidatos y exige coincidencia de localidad normalizada; está pensada para
la escala local de la Fase 2A/2B.

## Worker

```powershell
uv run python -m app.workers.runner
uv run python -m app.workers.runner --once
uv run python -m app.workers.runner --max-jobs 10 --poll-seconds 5
```

Toma trabajos `pending` con un `UPDATE` condicional (un solo worker gana cada
trabajo). Procesa `noop`, `search_run` y `enrich_company`. Las transacciones de
guardado de búsquedas son por empresa; si el proveedor falla, la búsqueda queda
`failed` con error legible y el job se reintenta con espera creciente. Si se
cancela una búsqueda en curso, el worker deja de persistir resultados. Los jobs
de enriquecimiento se procesan de a uno con pausa entre empresas y 3 intentos
ante errores de lectura; un resultado `unsafe` no se reintenta.

## Definiciones del dashboard

- `leads` / `leads_total`: todas las oportunidades.
- `new_companies`: empresas creadas en los últimos 7 días.
- `investigated_companies`: empresas con `last_enriched_at`.
- `published_contacts` / `published_whatsapp`: contactos publicados o
  verificados y no bloqueados.
- Los conteos del pipeline incluyen el estado y los posteriores (por ejemplo
  `contacted_leads` también cuenta respondidos y reuniones).
- Todo lo que no tiene datos devuelve cero; no se generan empresas ni contactos
  de ejemplo.

## Verificación

```powershell
uv run alembic upgrade head
uv run pytest
uv run ruff check .
uv run ruff format --check .
```

Las pruebas usan un SQLite temporal y no acceden a internet. Overpass se simula
con `httpx.MockTransport`; el worker se prueba con un provider fake; WhatsApp se
prueba con el provider de consola y un fake. La suite incluye un test de
migración que ejecuta `alembic upgrade head` y `downgrade base` sobre una base
temporal desde cero.
