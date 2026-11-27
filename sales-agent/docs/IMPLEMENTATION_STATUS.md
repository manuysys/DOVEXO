# Estado de implementación — ARVOKTA Sales Agent

**Última actualización:** 2026-11-27
**Fase actual:** fases 1, 2A, 2B, 4 y 5 implementadas y verificadas
localmente. Enriquecimiento de sitios (fase 3) y prueba real contra Meta
pendientes.

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
- [x] 106 tests backend, 102 tests frontend, build de 21 rutas.

## Verificación ejecutada

```text
Backend  uv run ruff check .              -> All checks passed
         uv run ruff format --check .     -> 113 files already formatted
         uv run pytest -q                 -> 106 passed, 1 warning (TestClient)
         uv run alembic check             -> No new upgrade operations detected
Frontend pnpm typecheck                   -> OK
         pnpm lint                        -> OK
         pnpm test                        -> 102 passed (25 archivos)
         pnpm build                       -> 21 rutas
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

Las pruebas de WhatsApp usan el provider de consola y números de simulación. No
se envió ningún mensaje real a terceros. Las conversaciones simuladas con
números de prueba no representan empresas.

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
  actual envía texto; antes de usar producción hay que configurar la plantilla y
  el número de negocio. Ver `docs/WHATSAPP_SETUP.md`.
- `FOUNDER_PHONE` no está configurado; las notificaciones al fundador quedan
  registradas como no enviadas.
- La vista de oportunidades está limitada a 100 registros; no hay paginación
  todavía.
- Una campaña nacional 24×7 genera hasta 168 consultas Overpass y puede tardar.
- CSV solo admite filas con al menos un rubro válido; no hay XLSX ni mapeo
  interactivo de columnas.
- La deduplicación difusa sigue limitada a 500 candidatos y exige localidad.
- El enriquecimiento de sitios oficiales, la extracción de servicios y la
  evidencia web (fase 3) están pendientes.

## Próxima fase

1. Cargar credenciales Meta, verificar el webhook y aprobar la plantilla de
   primer contacto; probar con un número de prueba autorizado.
2. Ejecutar el relevamiento nacional por provincia/rubro y exportar el dataset.
3. Implementar enriquecimiento de sitios y evidencia (fase 3).
4. Completar la auditoría de DOVEXO (exportación, legal, soporte y backups) y
   aplicar la migración pendiente en Neon cuando exista `DATABASE_URL_SYNC`.
