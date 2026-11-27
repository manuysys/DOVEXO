# Changelog de ARVOKTA

## 2026-11-27 — Reestructuración a monorepo y comienzo del Sales Agent

- La raíz del repositorio pasa a ser **ARVOKTA**.
- DOVEXO se mueve a `products/dovexo/` con `git mv` para conservar historial.
- Se crea `sales-agent/` con la especificación, la estructura inicial y la
  documentación de empresa.
- Se agregan `AGENTS.md`, `README.md`, `package.json` y `docs/` a nivel ARVOKTA.
- Se actualizan los paths de CI, scripts, `.opencode` y documentación.
- Se implementa la Fase 1 de ARVOKTA Sales Agent: backend FastAPI + SQLite +
  Alembic, auth con cookie HttpOnly, productos, campañas, dashboard, worker
  persistente, seed de DOVEXO y frontend Next.js con login, dashboard, productos
  y campañas. 33 tests de backend y 29 de frontend; build de 19 rutas.
- Se implementa la Fase 2A: descubrimiento provincial con OpenStreetMap/Overpass,
  empresas, contactos, fuentes, deduplicación, alta manual y pantallas de
  búsqueda/prospectos/historial. 70 tests backend, 53 frontend y build de 20
  rutas. Búsqueda real de prueba: Córdoba/HVAC, límite 5, 5 empresas nuevas y 0
  duplicados.
- Se implementa la Fase 2B: importación CSV con preview/confirmación idempotente,
  campañas con una corrida por provincia, revisión de posibles duplicados y
  exportación CSV de empresas. 84 tests backend, 75 frontend y build de 20 rutas.
  Campaña real Buenos Aires/instalaciones eléctricas: 5 empresas nuevas, 0
  duplicados. Enriquecimiento, scoring, mensajes, WhatsApp y CRM quedan para las
  fases 3-5.
- Root directories de Vercel actualizados y deploy verificado: `saas-gestion-web`
  apunta a `products/dovexo/apps/web` y `saas-gestion-api` a
  `products/dovexo/apps/api`. Web production `kie45n9mj` Ready; API production
  `7r0gb50fp` Ready; API conectada a GitHub; landing con 19.900/39.900/64.900 y
  login demo `200` contra Vercel + Neon. Rama mergeada a `main`.

## 2026-11-27 — Oportunidades, scoring, WhatsApp y CRM del Sales Agent

- Se implementan oportunidades por empresa+producto, scoring determinístico
  explicable, mensajes de WhatsApp con aprobación humana, persistencia de
  conversaciones, respuestas automáticas a entrantes, CRM, actividades,
  supresiones y métricas reales.
- El provider de consola permite probar todo el flujo sin credenciales; el
  webhook de Meta valida token/HMAC y falla cerrado. No se enviaron mensajes
  reales a terceros.
- Se verificó localmente: empresa → oportunidad → score 68/80 → mensaje →
  aprobación → envío simulado → entrante → bot → thread → CRM/dashboard.
- 106 tests backend, 102 frontend, build de 21 rutas. La plantilla de primer
  contacto de Meta y el enriquecimiento de sitios quedan pendientes.

## Producto DOVEXO

El historial detallado de DOVEXO se conserva en
[`products/dovexo/docs/CHANGELOG.md`](../products/dovexo/docs/CHANGELOG.md).
