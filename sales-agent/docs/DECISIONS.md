# Decisiones — ARVOKTA Sales Agent

## ADR-S001 — SQLite local con SQLAlchemy sync

**Fecha:** 2026-11-27
**Estado:** aceptada

**Contexto:** la Fase 1 debe correr en Windows sin Docker, sin servicios pagos y
sin una base administrada. El worker y la API comparten la misma base.

**Decisión:** SQLAlchemy 2 en modo sync con SQLite en
`sales-agent/backend/data/arvokta.db`, WAL, `foreign_keys=ON` y
`busy_timeout`. La URL se configura por `DATABASE_URL`; el esquema usa tipos
compatibles con PostgreSQL para una migración futura.

**Consecuencias:** menos complejidad de concurrencia que async; el worker y la
API usan transacciones cortas. Para varias instancias o más volumen se migra a
PostgreSQL.

## ADR-S002 — Worker con cola persistente en base

**Fecha:** 2026-11-27
**Estado:** aceptada

**Decisión:** tabla `jobs` con estado, tipo, payload, intentos, prioridad,
fechas y error. El worker corre en un proceso separado (`python -m
app.workers.runner`), reclama un trabajo pendiente con un `UPDATE` condicional y
lo marca `running`, `completed` o `failed`. En Fase 1 procesa `noop`; los
`search_run` quedan `pending` hasta la Fase 2.

**Consecuencias:** el estado sobrevive reinicios. No hay Redis. Un solo worker
por defecto; para escalar se agrega bloqueo/lease y más workers.

## ADR-S003 — Autenticación interna con cookie HttpOnly

**Fecha:** 2026-11-27
**Estado:** aceptada

**Decisión:** login con email/contraseña, Argon2id, JWT de 8 horas en cookie
HttpOnly `arvokta_access`, `SameSite=Lax`, `Secure` en producción. Sin registro
público ni refresh token en la Fase 1. El admin inicial se crea desde
`INITIAL_ADMIN_EMAIL`/`INITIAL_ADMIN_PASSWORD` solo si no hay usuarios.

**Consecuencias:** el frontend usa `credentials: "include"` y no guarda tokens en
JavaScript. Para producción se agrega refresh rotativo, recuperación de acceso y
más roles.

## ADR-S004 — Fase 1 sin descubrimiento ni datos ficticios

**Fecha:** 2026-11-27
**Estado:** aceptada

**Decisión:** la Fase 1 implementa productos, campañas, dashboard, worker y seed.
El botón de inicio de campaña crea `search_run` y `job` en `pending`, pero no
ejecuta descubrimiento. La UI lo muestra como “Fase 2”. No se cargan empresas,
contactos ni prospectos de ejemplo.

**Consecuencias:** el dashboard muestra cero en empresas/leads hasta que exista
un proveedor real. La Fase 2 implementa OSM/Overpass, CSV y alta manual.

## ADR-S005 — Contrato local API/web

**Fecha:** 2026-11-27
**Estado:** aceptada

**Decisión:** API en `http://localhost:8001`, web en `http://localhost:3001`,
prefijo `/api/v1`, CORS con credenciales para el origen web. El frontend usa un
cliente tipado centralizado y normaliza respuestas para tolerar variaciones del
contrato.

**Consecuencias:** DOVEXO puede seguir usando 8000/3000 sin colisión. Los scripts
de PowerShell arrancan cada proceso por separado.
