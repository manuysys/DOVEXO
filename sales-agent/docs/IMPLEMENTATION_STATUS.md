# Estado de implementación — ARVOKTA Sales Agent

**Última actualización:** 2026-11-27
**Fase actual:** Fase 1 completada y verificada localmente; Fase 2 pendiente.

## Fase 0 — Estructura y especificación

- [x] Repositorio ARVOKTA con `products/dovexo` y `sales-agent`.
- [x] Especificación del producto en `sales-agent/docs/SPEC.md`.
- [x] `AGENTS.md`, README y documentación base.
- [x] Decisión de stack y restricciones de costo cero.
- [x] Scripts de PowerShell.

## Fase 1 — Núcleo funcional

Implementado y verificado localmente:

- [x] Backend FastAPI, configuración y SQLite con WAL.
- [x] Alembic y 17 tablas del esquema base.
- [x] Login con admin inicial por variables de entorno, Argon2id, JWT en cookie
  HttpOnly, `/me` y logout. Sin registro público.
- [x] Productos CRUD con desactivación lógica; DOVEXO precargado.
- [x] Siete rubros y 24 provincias.
- [x] Campañas CRUD, start/pause/cancel. El start crea `search_run` y `job`
  pendientes; no ejecuta descubrimiento en Fase 1.
- [x] Campaña inicial `DOVEXO — Argentina — Prospección inicial`.
- [x] Dashboard con métricas reales y ceros sin datos.
- [x] Worker persistente con `jobs`; procesa `noop` y deja `search_run` pendiente.
- [x] Frontend Next.js: login, layout, dashboard, productos, campañas, detalle,
  placeholders honestos para Fase 2/3/5 y configuración.
- [x] Tests: 33 backend, 29 frontend.
- [x] Build de frontend con 18 rutas.

## Verificación ejecutada

```text
Backend  uv run ruff check .              -> All checks passed
         uv run ruff format --check .     -> 60 files already formatted
         uv run pytest -q                 -> 33 passed
Frontend pnpm typecheck                   -> OK
         pnpm test                        -> 29 passed (7 archivos)
         pnpm build                       -> 18 rutas
Smoke    login admin -> dashboard         -> OK
         dashboard DOVEXO + campaña       -> OK
         /products, /campaigns, detalle   -> OK
         worker noop                      -> completed
```

## Cómo ejecutar

```powershell
cd sales-agent/backend
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --port 8001
```

```powershell
cd sales-agent/frontend
pnpm install
pnpm dev
```

Credenciales locales: ver `sales-agent/backend/.env` (no versionado). La API
queda en `http://localhost:8001` y la web en `http://localhost:3001`.

## Limitaciones conocidas de la Fase 1

- Rate limit de login en memoria; para varias instancias hace falta un backend
  compartido.
- Sin refresh token ni recuperación de contraseña.
- Sin descubrimiento, enriquecimiento, scoring ni mensajes todavía.
- `search_run` queda pendiente por diseño hasta la Fase 2.
- Un solo worker; SQLite local.
- La UI de campañas permite iniciar una campaña activa y el backend responde
  conflicto; falta pulir el estado de los botones.

## Próxima fase — Descubrimiento

- OpenStreetMap/Overpass.
- Búsqueda nacional/provincial/local por rubro.
- Importación CSV, alta manual y deduplicación.
- Historial de búsquedas y ejecución real de `search_run`.
- Tests con proveedores simulados.
