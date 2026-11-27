# Estado de implementación — ARVOKTA Sales Agent

**Última actualización:** 2026-11-27
**Fase actual:** Fase 2A completada y verificada localmente; Fase 2B pendiente.

## Fase 0 — Estructura y especificación

- [x] Repositorio ARVOKTA con `products/dovexo` y `sales-agent`.
- [x] Especificación en `sales-agent/docs/SPEC.md`.
- [x] `AGENTS.md`, README y documentación base.
- [x] Stack y restricciones de costo cero.
- [x] Scripts PowerShell.

## Fase 1 — Núcleo funcional

- [x] Backend FastAPI, SQLite con WAL, Alembic.
- [x] Login Argon2id, JWT en cookie HttpOnly, `/me`, logout; sin registro público.
- [x] Productos CRUD con DOVEXO precargado.
- [x] Siete rubros y 24 provincias.
- [x] Campañas CRUD, start/pause/cancel.
- [x] Campaña inicial `DOVEXO — Argentina — Prospección inicial`.
- [x] Dashboard con métricas reales y ceros sin datos.
- [x] Worker persistente con cola `jobs`.
- [x] Frontend Next.js: login, layout, dashboard, productos, campañas, detalle.
- [x] Tests: 33 backend, 29 frontend; build de 19 rutas.

## Fase 2A — Descubrimiento provincial

Implementado y verificado localmente:

- [x] `CompanyDiscoveryProvider` y `OverpassProvider` con HTTPX, timeout,
  reintentos, backoff, User-Agent y URL configurable.
- [x] Búsqueda por provincia argentina (`ISO3166-2`) y por rubro, con límite
  total; una consulta por rubro, sin consultas gigantes.
- [x] Guardado de empresas, sectores, fuentes OSM y contactos publicados
  (teléfono, email, web, WhatsApp publicado).
- [x] `search_runs` con estado, conteos, error, `search_config`, `limit` y
  `company_sources.search_run_id`.
- [x] Worker `search_run`: ejecuta el provider, guarda, deduplica y actualiza
  contadores; cancelación y retry.
- [x] Deduplicación por dominio, teléfono, URL OSM, nombre + localidad y
  RapidFuzz; duplicados exactos se omiten, posibles duplicados quedan marcados
  para revisión. No hay fusión automática.
- [x] API: `/search-runs`, `/companies`, detalle, alta manual, contactos.
- [x] Frontend: `/search` real con polling, `/prospects` con filtros y
  paginación, `/prospects/[id]`, `/prospects/new`, `/search-history`.
- [x] 70 tests backend, 53 tests frontend, build de 20 rutas.

## Verificación ejecutada

```text
Backend  uv run ruff check .              -> All checks passed
         uv run ruff format --check .     -> 81 files already formatted
         uv run pytest -q                 -> 70 passed
         alembic upgrade/downgrade/upgrade -> OK
Frontend pnpm typecheck                   -> OK
         pnpm test                        -> 53 passed (13 archivos)
         pnpm build                       -> 20 rutas
Smoke    login admin -> dashboard         -> OK
         búsqueda real Overpass AR-X/hvac -> 5 empresas, 5 nuevas, 0 duplicados
         /prospects y detalle             -> OK, 0 errores de consola
         worker search_run                -> completed en ~41 s
```

La búsqueda real se ejecutó con límite 5 sobre Córdoba y el rubro HVAC. Guardó
cinco empresas reales de OpenStreetMap con teléfonos y una web publicada.

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

## Limitaciones de la Fase 2A

- Búsqueda **por provincia**; la búsqueda nacional y la ejecución completa de una
  campaña con 24 provincias quedan para la Fase 2B. La campaña inicial no debe
  ejecutarse como búsqueda nacional todavía.
- CSV, importación masiva y alta manual desde archivo quedan para Fase 2B.
- El mapeo de etiquetas OSM para `industrial_maintenance` y `gates_automation` es
  conservador y puede necesitar ajuste con datos reales.
- La deduplicación difusa limita a 500 candidatos y exige localidad; es adecuada
  para la escala provincial inicial.
- Sin enriquecimiento de sitios, scoring, generación de mensajes ni CRM; esas
  son las fases 3-5.
- La búsqueda real depende de la disponibilidad de Overpass; los tests no usan
  internet y el sistema informa el error si el proveedor falla.

## Próxima fase — 2B

- CSV: preview, mapeo, validación, duplicados, confirmación e informe.
- Búsqueda nacional y por campaña con trabajos subdivididos por provincia/rubro.
- Reintentos y límites de frecuencia; caché.
- Completar el flujo de revisión de posibles duplicados.
