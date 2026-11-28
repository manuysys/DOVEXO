# ARVOKTA Sales Agent

Sistema interno de prospección comercial, investigación de empresas, scoring y
CRM. Es multiproducto: DOVEXO es el primer producto configurado.

## Estado

Fases 0, 1, 2A, 2B, 3B, 4 y 5 completadas y verificadas localmente: login,
dashboard, productos, campañas, worker persistente, seed de DOVEXO,
descubrimiento provincial y nacional con OpenStreetMap/Overpass, empresas,
contactos, alta manual y deduplicación, importación CSV, campañas con una corrida
por provincia, exportación CSV y enriquecimiento web de sitios oficiales.

El relevamiento nacional dejó **212 empresas**, de las cuales **37 tienen sitio
web**. El lote de enriquecimiento del 2026-11-28 procesó 37 jobs iniciales más 1
reenriquecimiento manual: 27 completados y 11 fallidos; 25 empresas quedaron con
`last_enriched_at`, 24 con hechos o evidencia y 22 con contactos nuevos. Se
agregaron 84 contactos (44 teléfonos, 17 emails, 23 WhatsApp).

Scoring, mensajes, WhatsApp y CRM están implementados. WhatsApp sigue en modo
consola (`configured=false`, `mode=console`): no se envió nada real ni se
activaron credenciales de Meta.

Tests vigentes: 157 backend y 158 frontend; build de 22 rutas. Los 11 jobs que
fallaron no se completaron con datos inventados.

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

```powershell
cd sales-agent/backend
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8001
uv run python -m app.workers.runner
```

```powershell
cd sales-agent/frontend
pnpm install
pnpm dev
```

## Reglas

Leer [`AGENTS.md`](AGENTS.md). No mezclar este producto con DOVEXO. No inventar
datos de empresas ni contactos. Las fuentes son gratuitas: OpenStreetMap/Overpass,
CSV, alta manual y sitios web públicos. Sin APIs pagas.
