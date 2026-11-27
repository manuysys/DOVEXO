# Estado de implementación — ARVOKTA Sales Agent

**Última actualización:** 2026-11-27
**Fase actual:** Fase 2B completada y verificada localmente; Fase 3 y outreach
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
- [x] 84 tests backend, 75 tests frontend, build de 20 rutas.

## Verificación ejecutada

```text
Backend  uv run ruff check .              -> All checks passed
         uv run ruff format --check .     -> 86 files already formatted
         uv run pytest -q                 -> 84 passed
         alembic upgrade/check            -> OK
Frontend pnpm typecheck                   -> OK
         pnpm test                        -> 75 passed (18 archivos)
         pnpm build                       -> 20 rutas
Smoke    campaña AR-B / electrical_installations / limit 5
         -> 1 search run, 5 empresas nuevas, 0 duplicados, completed
         CSV preview real -> 2 filas, 1 válida, 1 con error, 0 duplicados
         CSV export -> 1.205 bytes, BOM, 5 filas de Buenos Aires
         consola del navegador -> 0 errores
```

La campaña real de Buenos Aires se ejecutó con Overpass y guardó cinco empresas
de instalaciones eléctricas. La importación CSV se probó en preview; no se
confirmó para no cargar una empresa ficticia en la base real.

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

## Limitaciones de 2B

- Una campaña nacional con 24 provincias y 7 rubros genera hasta 168 consultas
  Overpass y puede tardar. El worker las procesa secuencialmente; pausar deja
  terminar la consulta en curso y cancelar descarta sus resultados.
- CSV solo admite filas con al menos un rubro válido; no hay XLSX ni mapeo
  interactivo de columnas todavía.
- El informe de importación no tiene `report_url` descargable; el CSV de empresas
  sí se descarga.
- La deduplicación difusa sigue limitada a 500 candidatos y exige localidad.
- Sin enriquecimiento de sitios, scoring, mensajes, WhatsApp ni CRM todavía.

## Próxima fase — Enriquecimiento, scoring y outreach

- Enriquecimiento de sitios oficiales y evidencias.
- Scoring de compatibilidad y confianza explicable.
- Generación de mensajes con aprobación humana.
- WhatsApp Cloud API, webhook, chatbot de respuestas y handoff al fundador.
- CRM, actividades, seguimientos, lista de no contacto y exportación.
