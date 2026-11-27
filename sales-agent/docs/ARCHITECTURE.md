# Arquitectura — ARVOKTA Sales Agent

## Principio

Motor general de prospección, investigación, scoring y CRM. Los productos de
ARVOKTA se configuran como datos (`products`, `campaigns`, perfiles y mensajes),
no como código específico. DOVEXO es la primera configuración.

## Componentes

```text
Frontend Next.js
      │
      ▼
API FastAPI  ──────► SQLite (SQLAlchemy + Alembic)
      │                     ▲
      │                     │
      ▼                     │
Worker separado ────────────┘
      │
      ├── discovery (OSM/Overpass, CSV, manual)
      ├── enrichment (HTTPX + BeautifulSoup)
      ├── normalización y deduplicación
      ├── scoring determinístico
      └── generación de mensajes (determinística u Ollama)
```

## Módulos del backend

- `api/v1`: routers REST.
- `core`: configuración, seguridad, logging.
- `database`: engine, sesiones, base.
- `models`: SQLAlchemy.
- `schemas`: Pydantic.
- `repositories`: consultas y persistencia.
- `services/discovery`: proveedores y normalización de resultados.
- `services/enrichment`: lectura de sitios y extracción.
- `services/contacts`: normalización y verificación.
- `services/deduplication`: dominio, teléfono, nombre y fuzzy matching.
- `services/scoring`: compatibilidad y confianza configurables.
- `services/ai`: `AIProvider`, determinístico y Ollama.
- `services/outreach`: generación de mensajes y estados de aprobación.
- `services/crm`: pipeline, actividades y seguimientos.
- `providers`: adaptadores intercambiables.
- `workers`: cola persistente y runner.

## Modelo de datos

El esquema completo está en `SPEC.md` §15. Entidades principales:
`users`, `products`, `campaigns`, `sectors`, `companies`, `company_sectors`,
`company_sources`, `contacts`, `leads`, `campaign_leads`, `lead_evaluations`,
`search_runs`, `jobs`, `outreach_messages`, `activities`, `suppression_entries`
e `import_batches`.

## Decisiones

- SQLite local con SQLAlchemy 2 y Alembic; preparado para PostgreSQL.
- Worker separado con cola en base; sin Redis.
- Proveedores detrás de interfaces; tests con respuestas simuladas.
- IA opcional; el sistema funciona con reglas determinísticas y plantillas.
- Sin envíos automáticos: aprobación humana y envío manual.
