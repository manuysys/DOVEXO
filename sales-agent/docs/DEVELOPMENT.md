# Desarrollo — ARVOKTA Sales Agent

## Requisitos

- Windows 10/11 con PowerShell.
- Python 3.12 y `uv`.
- Node.js 24 y `pnpm`.
- No requiere Docker.

## Estructura

```text
sales-agent/
├── frontend/
├── backend/
├── scripts/
└── docs/
```

## Backend

```powershell
cd sales-agent/backend
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8001
```

## Frontend

```powershell
cd sales-agent/frontend
pnpm install
pnpm dev
```

## Worker

```powershell
cd sales-agent/backend
uv run python -m app.workers.runner
```

## Tests

```powershell
cd sales-agent/backend
uv run pytest

cd sales-agent/frontend
pnpm test
```

## Variables de entorno

Ver `sales-agent/.env.example`. Las variables previstas son:

- `DATABASE_URL` (SQLite local por defecto).
- `JWT_SECRET`.
- `INITIAL_ADMIN_EMAIL`.
- `INITIAL_ADMIN_PASSWORD`.
- `CORS_ORIGINS`.
- `OLLAMA_BASE_URL`.
- `OLLAMA_MODEL`.
- `APP_ENV`.
- `LOG_LEVEL`.

## Estado

Los comandos se confirman cuando el scaffold de la Fase 1 esté implementado.
