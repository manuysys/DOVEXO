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

## ADR-003 — WhatsApp interno con aprobación humana y modo consola

**Fecha:** 2026-11-27
**Estado:** aceptada

**Contexto:** el Sales Agent debe contactar empresas para DOVEXO desde el
teléfono del fundador. Las credenciales de Meta no están disponibles todavía y
no se deben hacer envíos en frío ni masivos.

**Decisión:** el primer contacto se genera como borrador, requiere aprobación
humana y se envía por Meta Cloud API cuando las credenciales estén configuradas.
Sin credenciales se usa un provider de consola que registra el mensaje como
simulado. El chatbot solo responde a mensajes entrantes y deriva a una persona;
no inicia conversaciones. El webhook de Meta valida token y firma HMAC y falla
cerrado. La confirmación de que un teléfono tiene WhatsApp es manual.

**Consecuencias:** el flujo se puede probar localmente sin cuentas pagas y sin
enviar mensajes reales. La plantilla de primer contacto, el número del fundador y
la prueba contra Meta quedan como pendientes de configuración. La regla de “sin
envíos automáticos” se interpreta como prohibición de envíos automáticos en frío
o masivos; las respuestas a entrantes están permitidas.
