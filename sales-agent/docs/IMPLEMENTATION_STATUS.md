# Estado de implementación — ARVOKTA Sales Agent

**Última actualización:** 2026-11-28
**Fase actual:** fases 1, 2A, 2B, 3B, 4 y 5 implementadas y verificadas
localmente. La prueba real contra Meta/WhatsApp sigue pendiente: el provider
activo es el de consola (`configured=false`, `mode=console`).

## Fase 0 — Estructura y especificación

- [x] Monorepo ARVOKTA con `products/dovexo` y `sales-agent`.
- [x] Especificación, AGENTS, README y documentación base.
- [x] Stack, restricciones de costo cero y scripts PowerShell.

## Fase 1 — Núcleo funcional

- [x] Backend FastAPI, SQLite WAL, Alembic, auth con cookie HttpOnly y Argon2id.
- [x] Productos CRUD, DOVEXO precargado, siete rubros y 24 provincias.
- [x] Campañas CRUD, dashboard, worker persistente, campaña inicial.
- [x] Frontend login, layout, dashboard, productos y campañas.
- [x] 33 tests backend, 29 frontend.

## Fase 2A — Descubrimiento provincial

- [x] `OverpassProvider` con HTTPX, reintentos, backoff y límites.
- [x] Búsqueda por provincia/rubro; empresas, sectores, fuentes OSM y contactos.
- [x] Worker `search_run`, deduplicación y alta manual.
- [x] `/search`, `/prospects`, detalle, alta manual e historial.
- [x] 70 tests backend, 53 frontend; búsqueda real Córdoba/HVAC con 5 empresas.

## Fase 2B — Importación, campañas y exportación

- [x] Importación CSV con preview, validación, duplicados, confirmación
  idempotente e historial. Límites: 2 MB / 500 filas; columnas `nombre` y
  `rubros` obligatorias.
- [x] Una búsqueda por provincia al iniciar una campaña; jobs `search_run`
  encolados; pausa/cancelación; conteos y progreso en la UI.
- [x] Revisión de `possible_duplicate`: filtrar, marcar como descubierta o
  descartada, sin borrar.
- [x] Exportación CSV de empresas con filtros, BOM, contactos y neutralización de
  fórmulas solo en la salida.
- [x] 84 tests backend, 75 tests frontend, build de 20 rutas en ese corte.

## Fase 3B — Enriquecimiento web de empresas

- [x] Lectura de sitios oficiales con HTTPX y BeautifulSoup, sin navegador
  headless ni APIs pagas. Fuentes guardadas en `company_sources` con
  `source_type="website"`; los hechos en `company_facts`.
- [x] Migración `99fc0d443a3e` (`company_facts`), compatible con SQLite y
  aplicada en `data/arvokta.db`. Es la cabeza actual de Alembic.
- [x] Hechos tipificados con valor, URL, título, extracto, confianza y fecha:
  `service`, `activity`, `locality`, `coverage`, `contact_page` y
  `description`.
- [x] Contactos publicados con procedencia (`source_url`, `source_title`,
  `source_collected_at`, `source_confidence`, `verified_at`). Un contacto
  publicado no es verificado: solo una persona puede marcarlo `verified`.
- [x] WhatsApp solo desde un enlace explícito `wa.me`, `api.whatsapp.com` o
  `whatsapp://` que incluya teléfono. Nunca se marca `verified` de forma
  automática.
- [x] No se pisan contactos manuales, verificados ni `do_not_contact`; tampoco
  se degrada evidencia existente ni se completa un dato que el sitio no publica.
- [x] Endpoints:
  - `POST /api/v1/companies/{id}/enrich` (admin, síncrono, una empresa).
  - `POST /api/v1/companies/enrich` (admin, lote; acepta `company_ids` o
    filtros y un máximo de 50 empresas).
  - `GET /api/v1/companies/enrich/jobs` y
    `GET /api/v1/companies/enrich/jobs/{id}` (admin; estado, intentos, error y
    resultado del job).
  - `GET /api/v1/companies?has_website=true` (candidatos con sitio web).
  - El detalle de empresa devuelve `facts` y los contactos con su procedencia.
- [x] Seguridad y límites: bloqueo de loopback, redes privadas, link-local y
  endpoints de metadata; validación de redirecciones (máximo 3); timeout de
  10 s; 1 MB por página; máximo 5 páginas; User-Agent identificable. Sin APIs
  pagas.
- [x] Lote máximo de 50; el worker lo procesa secuencialmente con pausa entre
  empresas; 3 intentos con backoff para errores de lectura.
- [x] UI `/enrichment`: candidatos, selección de hasta 50, encolado de lote y
  jobs con estado, intentos, errores y resultado. La ficha muestra los datos
  extraídos agrupados con fuente, confianza y fecha, y distingue contactos
  “Publicado” de “Verificado manualmente”. Verificado con navegador y sin
  errores de consola.
- [x] 157 tests backend; ruff y format OK; `alembic check` sin drift. 158 tests
  frontend; lint, typecheck y build de 22 rutas.

### Resultado real del lote (2026-11-28)

- 37 empresas con sitio web. Se encolaron 37 jobs iniciales y 1
  reenriquecimiento manual (Prof Instalaciones): 27 completados y 11 fallidos.
- 25 empresas quedaron con `last_enriched_at`; 24 con hechos o evidencia
  verificable; 22 con contactos nuevos.
- 84 contactos nuevos: 44 teléfonos, 17 emails y 23 WhatsApp. Quedaron 162
  contactos publicados y 2 verificados manualmente.
- 484 hechos: 296 servicios, 96 localidades, 51 páginas de contacto, 18
  descripciones, 15 actividades y 8 coberturas. 67 fuentes web.
- Fallos registrados: 3 HTTP 403, 4 DNS sin resolver, 2 `ConnectError` y 1
  HTTP 404. Alpha Clima quedó `unsafe` por una redirección a
  `http://0.0.0.0`; ese caso no se reintenta. No se inventaron datos.
- Baseline antes del enriquecimiento: 212 empresas, 37 con web, 18 emails, 56
  teléfonos y 6 WhatsApp. Después: 35 emails, 100 teléfonos y 29 WhatsApp.

### Relevamiento nacional y reintento

- Campaña nacional: 24 provincias, 7 rubros y 24 búsquedas. 20 completadas y 4
  fallidas por HTTP 502 de Overpass.
- Reintento específico de Formosa, Jujuy, Mendoza y Tierra del Fuego: 4/4
  completadas, con +2, +7, +10 y +9 empresas respectivamente (+28 en total),
  0 duplicados y 0 errores.
- Total: 212 empresas; 37 con sitio web.

## Fase 4 — Scoring y mensajes (determinístico)

- [x] Oportunidad por empresa+producto, única; estado inicial `new`.
- [x] Scoring DOVEXO explicable: compatibilidad 0-100, confianza 0-100,
  factores y razones; persistido en `lead_evaluations`.
- [x] Mensajes de WhatsApp generados con datos verificados de empresa/producto;
  sin promesas ni datos inventados; incluyen “respondé BAJA”.
- [x] Aprobación humana obligatoria; el generador nunca envía.
- [x] Envío por proveedor de consola (simulado) o Meta Cloud API; estados
  `simulated`/`sent`; `contact_id` y metadata de entrega auditables.
- [x] Envío manual registrado con “Marcar enviado manualmente” y enlace
  `wa.me` con texto precargado.
- [x] Tests de scoring, generación, aprobación, bloqueo sin aprobación,
  proveedor simulado y contacto resuelto.

## Fase 5 — CRM y WhatsApp

- [x] Pipeline por estados, notas, próximo seguimiento, actividades e historial.
- [x] Lista de no contacto (supresiones) y bloqueo de generación/envío.
- [x] Confirmación manual de un WhatsApp publicado, sin asumir que un teléfono
  cualquiera tiene WhatsApp.
- [x] Hilos y mensajes de WhatsApp persistidos; asociación por lead, empresa o
  teléfono; simulación de entrantes sin Meta.
- [x] Webhook de Meta: verificación de token, HMAC SHA-256 sobre bytes crudos,
  fail-closed sin secreto, idempotencia por `wa_message_id`, límite de tamaño.
- [x] Bot determinístico para responder entrantes, sin envíos en frío; handoff
  humano y notificación al fundador cuando `FOUNDER_PHONE` está configurado.
- [x] Dashboard con métricas reales de empresas, oportunidades, contactos,
  contactados, respuestas y reuniones.
- [x] Primer contacto real preparado con plantilla aprobada de Meta
  (`send_template`), sin fallback a texto libre si falta configuración; modo
  consola intacto.
- [x] 116 tests backend, 102 tests frontend, build de 21 rutas (corte histórico
  de la Fase 5; el conteo vigente está en “Verificación ejecutada”).

## Verificación ejecutada

Los conteos que aparecen en cada fase son el corte histórico de esa etapa. El
corte vigente, con la Fase 3B incluida, es el siguiente:

```text
Backend  uv run ruff check .              -> All checks passed
         uv run ruff format --check .     -> OK
         uv run pytest -q                 -> 157 passed
         uv run alembic check             -> No new upgrade operations detected
Frontend pnpm lint                        -> OK
         pnpm typecheck                   -> OK
         pnpm test                        -> 158 passed
         pnpm build                       -> 22 rutas
```

Cortes anteriores conservados como historial:

```text
Smoke    campaña AR-B / electrical_installations / limit 5
         -> 1 search run, 5 empresas nuevas, 0 duplicados, completed
         CSV preview real -> 2 filas, 1 válida, 1 con error, 0 duplicados
         CSV export -> 1.205 bytes, BOM, 5 filas de Buenos Aires
         flujo real local: empresa -> oportunidad -> score 68/80 ->
         mensaje -> aprobación -> envío simulado -> inbound -> bot ->
         thread visible en /messages -> CRM/dashboard actualizados
```

La campaña real de Buenos Aires se ejecutó con Overpass y guardó cinco empresas
de instalaciones eléctricas. La importación CSV se probó en preview; no se
confirmó para no cargar una empresa ficticia en la base real.

El relevamiento nacional posterior dejó 212 empresas (37 con sitio web); el
detalle y el reintento de las cuatro provincias fallidas están en la Fase 3B.

Las pruebas de WhatsApp usan el provider de consola y números de simulación. No
se envió ningún mensaje real a terceros. Las conversaciones simuladas con
números de prueba no representan empresas. El estado actual es
`configured=false`, `mode=console`.

## Cómo ejecutar

```powershell
cd sales-agent/backend
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --port 8001
uv run python -m app.workers.runner
```

```powershell
cd sales-agent/frontend
pnpm install
pnpm dev
```

API: `http://localhost:8001`. Web: `http://localhost:3001`. Credenciales locales
en `sales-agent/backend/.env` (no versionado).

## Limitaciones actuales

- Sin credenciales de Meta/WhatsApp: todo envío real se simula en consola; el
  webhook falla cerrado si falta `WHATSAPP_APP_SECRET`.
- El primer contacto real con Meta requiere una plantilla aprobada. El provider
  ya implementa `send_template` y el envío se niega con un error claro si falta
  `WHATSAPP_FIRST_CONTACT_TEMPLATE`; no cae a texto libre. La plantilla debe
  declarar `{{1}}` = empresa y `{{2}}` = producto. Falta la prueba real con
  credenciales. Ver `docs/WHATSAPP_SETUP.md`.
- `FOUNDER_PHONE` no está configurado; las notificaciones al fundador quedan
  registradas como no enviadas.
- La vista de oportunidades está limitada a 100 registros; no hay paginación
  todavía.
- Una campaña nacional 24×7 genera hasta 168 consultas Overpass y puede tardar.
- CSV solo admite filas con al menos un rubro válido; no hay XLSX ni mapeo
  interactivo de columnas.
- La deduplicación difusa sigue limitada a 500 candidatos y exige localidad.
- El enriquecimiento web no ejecuta JavaScript ni usa navegador headless: los
  sitios que dependen de JS pueden quedar sin datos. Lee como máximo 5 páginas
  internas y 1 MB por página. El lote es de hasta 50 empresas y el valor por
  defecto de `ENRICHMENT_BATCH_LIMIT` es 20.
- Quedaron 11 jobs fallidos por errores del sitio o de red; no se reintentaron
  con datos inventados. Un caso `unsafe` (redirección a `0.0.0.0`) no se
  reintenta.
- La verificación de WhatsApp sigue siendo manual: un número publicado no se
  asume como WhatsApp.

## Próxima fase

1. Cargar credenciales Meta, verificar el webhook y aprobar la plantilla de
   primer contacto; probar con un número autorizado. No activar envíos reales
   sin esa prueba controlada.
2. Revisar los jobs de enriquecimiento fallidos que valga la pena reintentar y
   ampliar la cobertura sin APIs pagas.
3. Agregar campañas por rubro, paginación a oportunidades y exportar el dataset
   nacional.
4. Completar la auditoría de DOVEXO (legal, soporte y backups) y aplicar la
   migración pendiente en Neon cuando exista `DATABASE_URL_SYNC`.
