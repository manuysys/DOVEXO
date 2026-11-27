# AGENTS.md — ARVOKTA Sales Agent

## Contexto

ARVOKTA Sales Agent es una plataforma interna de prospección comercial,
investigación de empresas, scoring y CRM. No es un producto que se vende a
clientes: lo usa el equipo de ARVOKTA para encontrar y gestionar oportunidades
para los productos de la empresa.

El primer producto configurado es **DOVEXO**, pero el motor es multiproducto. No
hardcodear DOVEXO en la lógica central: productos, campañas, sectores, perfiles y
mensajes se configuran desde la base y la UI.

La especificación completa está en [`docs/SPEC.md`](docs/SPEC.md). Es la fuente
de verdad del alcance. Si una decisión de este archivo contradice el SPEC, se
corrige el SPEC o se registra la decisión en `docs/DECISIONS.md`.

## Estado

La fuente de verdad del avance es
[`docs/IMPLEMENTATION_STATUS.md`](docs/IMPLEMENTATION_STATUS.md). No declarar
implementado lo que no esté probado.

## Stack y restricciones

- Frontend: Next.js App Router, React, TypeScript estricto, Tailwind.
- Backend: Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2, Alembic, HTTPX,
  BeautifulSoup, RapidFuzz, Phonenumbers, Pytest, Ruff.
- Base local: SQLite en `backend/data/arvokta.db`. No usar una carpeta temporal.
- Worker separado con cola persistente en base. Sin Redis ni servicios externos.
- Autenticación propia con JWT y Argon2id. Sin registro público. El admin inicial
  se define por variables de entorno.
- IA opcional: interfaz `AIProvider`, Ollama opcional y motor determinístico por
  defecto. No descargar modelos ni asumir GPU.
- Fuentes iniciales gratuitas: OpenStreetMap/Overpass, CSV y alta manual.
  No usar APIs pagas, pruebas con tarjeta ni scraping agresivo.
- No inventar empresas, contactos, teléfonos, servicios ni problemas. Si no hay
  datos, mostrar cero o pendiente. La IA no puede presentar hipótesis como hechos.
- No implementar envíos automáticos de WhatsApp. Los mensajes se generan, se
  aprueban y se envían manualmente.

## Estructura

```text
sales-agent/
├── frontend/     Next.js
├── backend/      FastAPI + SQLite + Alembic + worker
├── scripts/      PowerShell
└── docs/         SPEC, arquitectura, fuentes, seguridad, estado
```

## Comandos

Se completan cuando el scaffold de la Fase 1 esté creado:

```powershell
cd sales-agent/backend
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8001
uv run python -m app.workers.runner

cd sales-agent/frontend
pnpm install
pnpm dev
```

## Reglas de trabajo

- Leer el SPEC y el estado antes de implementar.
- Entregas pequeñas y ejecutables. Al cerrar una etapa: tests, documentación y
  actualización de `IMPLEMENTATION_STATUS.md`.
- No tocar DOVEXO (`products/dovexo`) desde este producto.
- No guardar secretos reales en `.env.example`.
- Cada endpoint debe tener validación, manejo de errores, autenticación cuando
  corresponda y tests.
- Las pruebas unitarias no dependen de internet; los proveedores externos se
  simulan.
