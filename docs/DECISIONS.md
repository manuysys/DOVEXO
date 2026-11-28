# Decisiones de ARVOKTA

Registro de decisiones transversales. Las decisiones de cada producto viven en
su propia carpeta:

- DOVEXO: [`products/dovexo/docs/DECISIONS.md`](../products/dovexo/docs/DECISIONS.md)
- Sales Agent: [`sales-agent/docs/DECISIONS.md`](../sales-agent/docs/DECISIONS.md)

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

## ADR-004 — Investigación interna con fuentes gratuitas, evidencia y sin APIs pagas

**Fecha:** 2026-11-28
**Estado:** aceptada

**Contexto:** ARVOKTA investiga empresas para prospección y debe sostener esa
investigación con fuentes verificables, sin ampliar costos fijos ni presentar
inferencias como hechos.

**Decisión:** las herramientas internas de investigación (hoy el Sales Agent y su
Fase 3B) usan fuentes gratuitas y accesibles: OpenStreetMap/Overpass, CSV, alta
manual y sitios web públicos. No se contratan APIs pagas, pruebas con tarjeta ni
servicios de scraping agresivo. Cada dato recolectado conserva su fuente (URL),
fecha y evidencia; los hechos y contactos se distinguen de las hipótesis y de lo
verificado por una persona. El enriquecimiento web aplica las restricciones de
seguridad del producto (solo HTTP/HTTPS público, bloqueo de red interna,
redirecciones y tamaño acotados). El detalle de implementación vive en los ADR
del producto: ADR-S013 (hechos, procedencia y SSRF) y ADR-S014 (lotes, worker y
reintentos).

**Consecuencias:**

- La investigación se puede auditar y repetir sin depender de un proveedor pago.
- Un sitio que bloquea el acceso o depende de JavaScript puede quedar sin datos;
  se informa el error y no se completa con suposiciones.
- La cobertura es menor que la de un servicio pago, pero no agrega costos por
  consulta y la trazabilidad es explícita.
- Cualquier incorporación futura de una API paga requiere una decisión nueva y
  autorización explícita.
