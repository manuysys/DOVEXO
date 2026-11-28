# Changelog de ARVOKTA

## 2026-11-28 — Enriquecimiento web y relevamiento nacional del Sales Agent

- Se implementa la Fase 3B de ARVOKTA Sales Agent: enriquecimiento de sitios
  oficiales con hechos y evidencia. Se agregan `POST /companies/{id}/enrich`,
  `POST /companies/enrich` (lote de hasta 50), los endpoints de jobs
  `GET /companies/enrich/jobs[/{id}]` y el filtro `GET /companies?has_website=`.
- La migración `99fc0d443a3e` crea `company_facts` (compatible con SQLite) y
  queda aplicada en `data/arvokta.db`. Los hechos (`service`, `activity`,
  `locality`, `coverage`, `contact_page`, `description`) guardan valor, URL,
  título, extracto, confianza y fecha. Los contactos exponen su procedencia
  (`source_url`, `source_title`, `source_collected_at`, `source_confidence`,
  `verified_at`).
- Seguridad: solo HTTP/HTTPS públicos, bloqueo de loopback/redes
  privadas/link-local/metadata, redirecciones validadas (máximo 3), timeout de
  10 s, 1 MB por página, máximo 5 páginas y User-Agent identificable. Sin APIs
  pagas ni navegador headless. Un WhatsApp solo se registra desde un enlace
  explícito con teléfono y nunca queda verificado automáticamente.
- UI `/enrichment` con candidatos, selección de hasta 50, encolado de lotes y
  jobs con estado, intentos, errores y resultado. La ficha muestra hechos con
  fuente/confianza/fecha y distingue contactos “Publicado” de “Verificado
  manualmente”. Verificada en navegador, sin errores de consola.
- Resultado real del lote: 37 empresas con sitio web, 37 jobs iniciales y 1
  reenriquecimiento manual; 27 completados y 11 fallidos. 25 empresas con
  `last_enriched_at`, 24 con hechos/evidencia y 22 con contactos nuevos. Se
  agregaron 84 contactos (44 teléfonos, 17 emails, 23 WhatsApp); 484 hechos y
  67 fuentes web. Fallos: 3 HTTP 403, 4 DNS sin resolver, 2 `ConnectError`, 1
  HTTP 404 y Alpha Clima bloqueada por redirección a `0.0.0.0` (`unsafe`, sin
  reintento). No se inventaron datos.
- Baseline antes del enriquecimiento: 212 empresas, 37 con web, 18 emails, 56
  teléfonos y 6 WhatsApp. Después: 35 emails, 100 teléfonos y 29 WhatsApp;
  162 contactos publicados y 2 verificados manualmente.
- Relevamiento nacional: 24 provincias, 7 rubros y 24 búsquedas; 20 completadas
  y 4 fallidas por HTTP 502 de Overpass. El reintento de Formosa, Jujuy,
  Mendoza y Tierra del Fuego completó 4/4 (+2, +7, +10 y +9 empresas; +28 en
  total), con 0 duplicados. Total: 212 empresas, 37 con sitio web.
- Verificación: 157 tests backend; ruff y format OK; `alembic check` sin drift;
  158 tests frontend; lint, typecheck y build de 22 rutas.
- WhatsApp sigue sin credenciales reales (`configured=false`, `mode=console`);
  el simulador se verificó con un thread de prueba y no se envió nada real. No
  se activaron credenciales de Meta.
- No se modificó DOVEXO. Su exportación CSV sigue implementada; la auditoría
  externa pendiente queda en legal, soporte y backups.

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
- 116 tests backend, 102 frontend, build de 21 rutas. La plantilla de primer
  contacto de Meta ya tiene soporte de código; faltan credenciales y la prueba
  real. El enriquecimiento de sitios queda pendiente.

## Producto DOVEXO

El historial detallado de DOVEXO se conserva en
[`products/dovexo/docs/CHANGELOG.md`](../products/dovexo/docs/CHANGELOG.md).
