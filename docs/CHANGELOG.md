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
  y campañas. 33 tests de backend y 29 de frontend; build de 18 rutas.
- Root directories de Vercel actualizados y deploy verificado: `saas-gestion-web`
  apunta a `products/dovexo/apps/web` y `saas-gestion-api` a
  `products/dovexo/apps/api`. Web production `kie45n9mj` Ready; API production
  `7r0gb50fp` Ready; API conectada a GitHub; landing con 19.900/39.900/64.900 y
  login demo `200` contra Vercel + Neon. Rama mergeada a `main`.

## Producto DOVEXO

El historial detallado de DOVEXO se conserva en
[`products/dovexo/docs/CHANGELOG.md`](../products/dovexo/docs/CHANGELOG.md).
