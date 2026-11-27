# Decisiones de ARVOKTA

Registro de decisiones transversales. Las decisiones de cada producto viven en
su propia carpeta:

- DOVEXO: [`products/dovexo/docs/DECISIONS.md`](../products/dovexo/docs/DECISIONS.md)
- Sales Agent: [`sales-agent/docs/DECISIONS.md`](../sales-agent/docs/DECISIONS.md)
  (se crea con las primeras decisiones del producto)

## ADR-001 — Monorepo ARVOKTA con productos separados

**Fecha:** 2026-11-27
**Estado:** aceptada

**Contexto:** ARVOKTA tenía un repositorio dedicado a DOVEXO. La empresa necesita
un espacio común para sus productos y para el sistema comercial interno, sin
mezclar código, datos ni credenciales.

**Decisión:** un monorepo con raíz `ARVOKTA`, productos en `products/` y el
sistema interno en `sales-agent/`. DOVEXO se movió con `git mv` para conservar
historial. Cada producto mantiene su propio `AGENTS.md`, documentación y
comandos. Los root directories de Vercel se actualizan a
`products/dovexo/apps/web` y `products/dovexo/apps/api`.

**Consecuencias:**

- Un solo historial y un solo lugar para la documentación de empresa.
- Los paths de CI, scripts, `.opencode` y documentación deben actualizarse.
- Los deployments de DOVEXO requieren actualizar Vercel antes de volver a
  desplegar desde `main`.
- El Sales Agent puede evolucionar sin tocar la lógica de DOVEXO.

## ADR-002 — Sales Agent con SQLite local, FastAPI y Next.js

**Fecha:** 2026-11-27
**Estado:** aceptada

**Contexto:** el Sales Agent es una herramienta interna de prospección y CRM. El
MVP debe funcionar en Windows sin Docker, sin servicios pagos y sin depender de
una base administrada.

**Decisión:** backend FastAPI + SQLAlchemy 2 + Alembic con SQLite local
(`sales-agent/backend/data/arvokta.db`), worker separado con cola persistente en
base, frontend Next.js App Router + Tailwind, autenticación propia con JWT y
Argon2id, sin registro público. Las fuentes de descubrimiento iniciales son
OpenStreetMap/Overpass, CSV y alta manual. La IA es opcional (Ollama) y existe un
motor determinístico.

**Consecuencias:**

- El MVP se puede ejecutar localmente sin Docker ni tarjetas.
- La base se puede migrar a PostgreSQL cambiando la URL y el driver.
- El worker y la API comparten el mismo esquema de trabajos.
- Las pruebas unitarias no dependen de internet; los proveedores externos se
  simulan.
