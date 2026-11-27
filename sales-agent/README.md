# ARVOKTA Sales Agent

Sistema interno de prospección comercial, investigación de empresas, scoring y
CRM. Es multiproducto: DOVEXO es el primer producto configurado.

## Estado

Fases 0, 1, 2A, 2B, 4 y 5 completadas y verificadas localmente: login, dashboard,
productos, campañas, worker persistente, seed de DOVEXO, descubrimiento
provincial con OpenStreetMap/Overpass, empresas, contactos, alta manual y
deduplicación, importación CSV, campañas con una corrida por provincia y
exportación CSV. Una campaña real de Buenos Aires/instalaciones eléctricas
guardó cinco empresas nuevas.

El enriquecimiento de sitios (fase 3) y la prueba real contra Meta quedan
pendientes. El scoring, los mensajes, WhatsApp (consola/simulador) y el CRM ya
están implementados. No se enviaron mensajes reales a terceros.

Ver [`docs/IMPLEMENTATION_STATUS.md`](docs/IMPLEMENTATION_STATUS.md).

## Especificación

La especificación completa está en [`docs/SPEC.md`](docs/SPEC.md).

## Estructura

```text
sales-agent/
├── frontend/     Next.js (App Router, TypeScript, Tailwind)
├── backend/      FastAPI, SQLAlchemy, SQLite, Alembic, worker
├── scripts/      PowerShell para Windows
└── docs/         Especificación, arquitectura, fuentes, seguridad y estado
```

## Requisitos

- Windows 10/11 con PowerShell.
- Python 3.12 con `uv`.
- Node.js 24 con `pnpm`.
- No requiere Docker.
- No requiere servicios pagos.

## Inicio rápido

Se completa cuando el scaffold de la Fase 1 esté implementado. Los comandos
previstos son:

```powershell
cd sales-agent/backend
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8001
```

```powershell
cd sales-agent/frontend
pnpm install
pnpm dev
```

## Reglas

Leer [`AGENTS.md`](AGENTS.md). No mezclar este producto con DOVEXO. No inventar
datos de empresas ni contactos. Las fuentes iniciales son gratuitas:
OpenStreetMap/Overpass, CSV y alta manual.
