# ARVOKTA Sales Agent — Backend (Fase 1)

API interna en FastAPI + SQLite con worker de cola persistente. No incluye
descubrimiento de empresas ni enriquecimiento: eso corresponde a la Fase 2 en
adelante.

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
| `OLLAMA_BASE_URL` / `OLLAMA_MODEL` | Reservadas para IA local opcional; no se usan en Fase 1. |

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
- `GET /dashboard/metrics|activity|jobs`
- `POST /jobs/noop` (solo admin; encola un trabajo de prueba)

`start` valida producto y filtros, y crea un `search_run` + `job` en estado
`pending`. En Fase 1 no hay proveedores: el worker **no** procesa `search_run` y
los deja pendientes para la Fase 2.

## Worker

```powershell
uv run python -m app.workers.runner
uv run python -m app.workers.runner --once
uv run python -m app.workers.runner --max-jobs 10 --poll-seconds 5
```

Toma trabajos `pending` con un `UPDATE` condicional (un solo worker gana cada
trabajo). Solo procesa `noop`; los errores se guardan en `error_message` y se
reintentan hasta `max_attempts` con espera creciente.

## Definiciones del dashboard

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

Las pruebas usan un SQLite temporal y no acceden a internet.
