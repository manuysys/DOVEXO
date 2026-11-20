# Changelog

## 2026-11-20 — Landing v3: dirección de arte "Oficio en orden"

- Sistema de marketing acotado con `.mk-root`: **Archivo** (Omnibus-Type, eje de
  ancho) para toda la landing y tokens papel `#F3F0E6`, tinta `#123B31`, señal
  `#D9541E`, línea `#D8D2C2` y pizarra `#5A665F`. La app conserva sus colores y
  radios; la familia display pasa a Archivo y deja de cargarse Space Grotesk.
- Héroe claro: "El oficio, en orden.", captura real del tenant demo al 175 % con
  dos llamadas numeradas. Sin Three.js, gradientes ni animación de entrada.
- `page.tsx` deja de montar `SmoothScroll` (Lenis), `Journey` (GSAP),
  `FeaturesBento` y `TrustStrip`. Se agregan `OrderRail` ("Una sola orden",
  cuatro estaciones con la misma OT) y `ModuleIndex` (índice de ocho módulos).
- Cabecera de papel opaca, sin `border-b` ni `backdrop-blur`: elimina el borde y
  la transparencia que se veían al scrollear.
- Tour, precios, FAQ, CTA final y footer retematizados. Se quita el resplandor
  azul; "Recomendado" pasa a sello rotado. La prueba de 14 días ya no figura
  "en implementación": se activa al registrarse.
- `AGENTS.md`: regla de subagentes con `opencode-go/deepseek-v4.1-flash` y uso de
  skills/MCP.
- Verificado: `pnpm typecheck` OK; `pnpm lint` OK (2 warnings preexistentes);
  `pnpm test` 281/281; `pnpm build` OK, 32 rutas.

## 2026-11-19 — Héroe propio sin watermark y contenedor más ancho

- El héroe de la landing deja Spline y vuelve a la escena isométrica propia:
  `HeroScene` (Three.js en desktop, después de idle y sin reduced motion) y
  `HeroFallback` (SVG en mobile/reduced motion). Sin badge ni runtime de terceros.
  Commit `4b27ea0`; ADR-020. `spline-hero.tsx`, el paquete y el poster quedan sin
  uso, para una eventual vuelta con plan Hobby.
- Contenedor de marketing ampliado de `max-w-6xl` (1152 px) a `max-w-7xl`
  (1280 px) en header, hero y secciones; menos margen lateral en pantallas anchas.
- Verificado con typecheck, build y ESLint de marketing; deploy web
  `saas-gestion-5zlid2yi1` (Production). El badge de Spline deja de aplicar.

## 2026-11-18 — Landing v2, hardening de seguridad y deploy a producción

- Landing v2 (commit `4ed02eb`): escena 3D de Spline publicada e integrada en
  `apps/web/src/components/marketing/spline-hero.tsx` (`@splinetool/react-spline`
  ^4.2.0). Solo desktop (`min-width: 1024px`), carga dinámica y render 2x con
  `scale(0.5)` para suavizar bordes; mobile y estado de carga usan el poster
  `public/spline-hero-2x.webp` (1126x938). El badge "Built with
  Spline" queda visible por la licencia del plan Free.
- Tour de producto con capturas reales del tenant demo en
  `public/product-tour/*.webp` (dashboard, órdenes, presupuestos, agenda, técnico,
  portal y presupuesto público), con `next/image` y marcos de navegador/teléfono.
  El frame dice "DOVEXO · panel".
- `journey.tsx` usa GSAP ScrollTrigger (línea con scrub y stagger) y respeta
  `prefers-reduced-motion`. Se eliminaron `Marquee` y la scanline `mk-scan`.
- Hardening backend (commits `859e3a7` y `440737c`), 10 hallazgos de auditoría
  (detalle en `SECURITY_AUDIT.md`, sección 8):
  - Fix de `/ai/usage` (commit `85239e0`): `AIUsageItem` con `from_attributes`;
    producción responde 200.
  - IP real solo con `TRUST_PROXY_HEADERS=true` (nuevo `app/core/client_ip.py`).
  - Comparación exacta de `Origin` (esquema, host y puerto).
  - `/ai/chat` solo para `owner`, `admin` y `dispatcher`; rate limit por
    `tenant_id:user_id`.
  - Webhook de WhatsApp: tope de 1 MB, HMAC sobre bytes crudos y
    `WHATSAPP_APP_SECRET` obligatorio (fail-closed).
  - `POST /tenants` crea suscripción trial; sin suscripción se usa el plan `starter`.
  - Device tokens scopeados por `(tenant_id, user_id, token)`.
  - Adjuntos del técnico: lectura en chunks de 64 KiB, tope de 5 MB, nombre
    saneado y `X-Content-Type-Options: nosniff`.
  - `/ai/usage` calcula totales con `SUM` sobre todo el tenant.
  - Refresh con `SELECT ... FOR UPDATE` y ventana de gracia de 10 s; el cliente
    móvil usa single-flight en `apps/mobile/src/lib/api.ts`.
- Tests: nuevo `apps/api/tests/test_security_hardening.py` (21 pruebas) y
  actualizaciones en `test_security.py` y `test_whatsapp.py`.
- Verificación: `scripts/verify.ps1` con **Todo OK** y código de salida 0 (608 s):
  ruff OK, format OK (160 archivos), basedpyright 0 errores, pytest 203 pasadas,
  ESLint OK, TypeScript OK, Vitest 281 pasadas, build de 28 rutas y `tsc` móvil OK.
- Configuración de producción: `TRUST_PROXY_HEADERS=true` agregado al entorno
  Production de la API en Vercel.
- Deploy a producción (2026-11-18):
  - API: deployment `saas-gestion-gc9224fim`, alias `saas-gestion-api.vercel.app`.
  - Web: deployment `saas-gestion-evispxp11`, alias `saas-gestion-web.vercel.app`.
  - Evidencia de la API: `/health/live` y `/health/ready` 200, login demo 200,
    `/ai/usage` 200, `/ai/chat` con técnico 403, `POST /webhooks/whatsapp` sin
    secreto 503 (esperado), dashboard, equipo, clientes, presupuestos,
    suscripción, notificaciones y PDF 200.
  - Evidencia de la web: `/` 200 con Spline y tour, `/login` 200, login demo con
    redirección a `/dashboard` sin errores de consola, `/tech`, `/portal/servicios-demo`,
    `/privacy`, `/terms`, `/onboarding` y `/settings/import` 200.
- Documentación: ADR-018 y ADR-019 en `DECISIONS.md`; `COSTS_2026-11-18.md`;
  `KNOWN_ISSUES.md`, `LANDING_REDESIGN.md`, `SECURITY_AUDIT.md`, `DEPLOY_VERCEL.md`,
  `WHATSAPP_INTEGRATION.md` y `FEATURE_TRUTH_MATRIX.md` actualizados.
- Pendiente tras este bloque: badge de Spline, `WHATSAPP_APP_SECRET` sin
  configurar en producción, lock en `revoke_refresh_token`, APK nuevo con el
  cliente móvil corregido y backups sin verificar.

## 2026-11-18 — Rediseño visual integral del frontend

- Design system DOVEXO: tokens nuevos (primary `#315EFB`, deep, teal, violet,
  estados, superficies, motion), utilidades tipográficas, 13 componentes UI
  migrados y stories en Storybook.
- Landing: hero con mockups reales e ilustración isométrica 2D, credenciales
  demo colapsadas, beneficios alternados, tour de 6 tabs, pricing accesible,
  trust strip verificable, FAQ y footer.
- Dashboard: overflow mobile corregido (P0), KPIs accionables sin duplicar,
  hero compacto, checklist y shell con tokens.
- Módulos rediseñados: clientes, órdenes/solicitudes, presupuestos/pagos,
  agenda (día/semana/equipo con conflictos), automatizaciones, asistente,
  panel global, configuración y onboarding.
- PWA del técnico: guard de rol para 403, home/detalle, offline real, fotos y
  materiales. Portal y presupuesto público rediseñados; app móvil con tokens,
  tabs y pagos.
- Fix backend aislado: `AIUsageItem` acepta objetos ORM (`from_attributes`);
  `/api/v1/ai/usage` deja de devolver 500.
- Verificación: `verify.ps1` OK (backend y frontend), 281 Vitest, build de 28
  rutas, Storybook build OK y `tsc` móvil OK. En ese momento producción no se
  había desplegado; el deploy se hizo el mismo día (ver la entrada anterior).

## 2026-11-17 — Decisión P0-D: aviso de demo

- Decisión sobre credenciales de demo (auditoría externa): se mantiene la demo
  abierta durante la preventa con un aviso visible en el panel para el tenant
  `servicios-demo` ("datos de ejemplo, no cargar información real"),
  implementado en `apps/web/src/components/app-shell.tsx`.
- Las credenciales de plataforma (`founder@`) no figuran en la documentación
  comercial de `docs/GO_TO_MARKET/`; solo la cuenta demo pública aparece en el
  guion de demo.
- Sin cambios en API ni base de datos.

## 2026-11-15 — Paquete de preventa, auditoría externa y verificación integral

- Paquete comercial `docs/GO_TO_MARKET/` (14 archivos): perfil de cliente,
  `PROSPECTS.csv` con 21 prospectos verificados (P-001 a P-021), guion de
  entrevista con hoja corta de 8 preguntas, guion de demo con evidencia de
  producción, programa de pilotos, mensajes, validación de precios, benchmark,
  feedback, métricas y plan de 14 días.
- Borradores de primer contacto para El Mejor Clima, TOTALAIR y UBE
  (`OUTREACH_DRAFTS_2026-11-14.md`), pendientes de aprobación del fundador.
  Ningún mensaje fue enviado.
- Investigación de marca y dominios (`BRAND_DOMAIN_RESEARCH.md`): `dovexo.com`
  registrado (en venta USD 1.995); `dovexo.com.ar`, `arvokta.com`,
  `arvokta.com.ar`, `dovexo.app` y `dovexo.dev` libres según RDAP (2026-11-15).
- Auditoría externa del 2026-11-14 verificada:
  - IDs de orden duplicados en la landing: no reproducibles en el deploy actual
    (la landing usa `OT-2026-0001..0003` del dataset único).
  - Enlace de APK roto: causa raíz era el mirror de tmpfiles.org del workflow
    `mirror-apk.yml`, eliminado. Las 3 releases tienen `app-release.apk` adjunto
    (30.819.479 bytes). Links actualizados a `mobile-apk-5` y SHA-256 agregado a
    `MOBILE_BUILD.md` (`437FE51E...E3D3`).
  - Credenciales de demo: decisión pendiente del fundador (P0-D).
- Hallazgo propio: el workflow `Database backup` figura "success" pero no produce
  artifacts porque falta `NEON_DATABASE_URL`. Ahora falla si el secreto no está
  configurado. No hay backups reales desde el 2026-11-10.
- `scripts/verify.ps1`: se agregó el chunk de `test_demo_reset.py`,
  `test_imports.py` y `test_onboarding.py` (faltaba). Salida real del 2026-11-15:
  ruff/basedpyright OK, pytest 179 pruebas (3 chunks), Vitest 210 pruebas,
  `next build` 28 rutas, `tsc` móvil OK; código de salida 0.
- Fix del seed de demo: la orden `WO-2026-0001` ahora se asigna al técnico del
  tenant demo (`appointment_technician_id`) en vez del actor, para que la PWA
  `/tech` muestre el trabajo asignado después de un reset. Test de reset
  actualizado (el actor ajeno sigue sin asignarse). API redesplegada.
- Sin cambios de código de producto fuera del seed de demo en esta entrada.

## 2026-11-11 — Importador CSV/XLSX, onboarding y reset de demo

- Importador de clientes CSV y XLSX (`/api/v1/imports/customers/preview`,
  `/commit` y `/{job_id}/errors.csv`) con vista previa, errores por fila,
  duplicados contra la base y dentro del archivo, y commit idempotente.
- Pantalla `/settings/import` con carga, vista previa, confirmación y descarga de
  errores.
- Límites anti zip-bomb y de payload: 2 MB y 500 filas; XLSX con 1000 entradas,
  20 MB descomprimidos y ratio máximo 100; verificación de firma del archivo.
- Neutralización de fórmulas (`=`, `+`, `-`, `@`, tab, CR, LF) solo en
  `errors.csv`; los datos persistidos no se modifican (ADR-017).
- Locks de la fila de tenant en el commit del importador y en el onboarding.
- Onboarding de cuatro pasos (`/api/v1/onboarding`: GET, PATCH y `complete`) con
  progreso guardado en `tenants.onboarding_state`, pantalla `/onboarding` y
  checklist en el dashboard.
- Reset del tenant demo (`POST /api/v1/admin/demo/reset`): solo platform admin,
  solo sobre `servicios-demo`, conserva `audit_logs` y registra `demo_reset`.
- Seed versionado en `apps/api/app/seed/demo.py`, idempotente, con un turno futuro.
- Migraciones `d4e5f6a7b8c9` (`import_jobs`) y `e5f6a7b8c9d0`
  (`tenants.onboarding_state`). Aplicadas en Neon; `alembic current` =
  `e5f6a7b8c9d0` (head). Verificadas localmente: upgrade, downgrade y
  `alembic check` sin drift.
- Tests: 179 pruebas pytest y 210 pruebas Vitest, **reportadas** por la sesión de
  implementación. Verificación de producción contra Vercel + Neon: todos los
  endpoints nuevos (preview, commit, errors.csv, onboarding GET/PATCH/complete,
  demo reset) respondieron 200. Teléfono `+54 11 4000-9001` persistido sin
  apóstrofo. XLSX real respondió 200 (sin 422).
- `openpyxl` y `defusedxml` agregados a `apps/api/requirements.txt` y desplegados;
  el preview XLSX en producción funciona (ADR-014 resuelto para este bloque).
- Documentación: `PROJECT_STATUS.md`, `PILOT_READINESS.md` (criterios 10 a 14),
  `ROADMAP.md`, `DECISIONS.md` (ADR-017) y `KNOWN_ISSUES.md`.
- Verificación local con `scripts/verify.ps1` pendiente de salida real: el
  PostgreSQL portable no pudo iniciarse en esta sesión por conflicto de
  `postgres.log` en Windows. No afecta la producción ni el despliegue.

## 2026-11-11 — Endurecimiento de seguridad del portal e invitaciones

- Portal del cliente con versión de sesión (`customers.portal_access_version`):
  revocar o regenerar un acceso invalida los JWT ya emitidos.
- Consumo atómico del token de portal para impedir dos verificaciones
  concurrentes con el mismo enlace.
- Revocación de tokens pendientes al generar un enlace nuevo.
- Reenvío de invitaciones con idempotencia por token; cada reenvío envía un
  correo nuevo y las invitaciones vencidas liberan cupo.
- Escape HTML de nombres y URLs en las plantillas de email.
- Validación de `Origin` al aceptar invitaciones y `Referrer-Policy:
  no-referrer` en `/portal/[slug]`.
- Rate limiting con `X-Real-IP` y último hop de `X-Forwarded-For`.
- Login demo del portal restringido al slug literal `servicios-demo`.
- Migración `c3d4e5f6a7b8` aplicada en local y Neon.
- 127 pruebas pytest.

## 2026-11-10 — DOVEXO, equipo, portal seguro y AAB firmado

- Identidad: ARVOKTA como empresa y DOVEXO como producto; web, PWA y Android
  actualizados. Android `com.dovexo.mobile`, scheme `dovexo`.
- Email transaccional con módulo único, plantillas HTML/texto, proveedor
  `console` y Resend opcional, registro de envíos e idempotencia.
- Invitaciones de equipo: crear, listar, reenviar, revocar y aceptar; token
  hasheado, expiración de 7 días, validación de email y límites de plan.
- Portal del cliente: acceso generado desde la ficha, enlace copiable o email,
  token hasheado, expiración, revocación y `dev_token` deshabilitado en
  producción.
- Migración `b2c3d4e5f6a7` aplicada en Neon.
- Android: keystore de release generada, secretos en GitHub Actions y AAB
  firmado `dovexo-android-aab` (36 MB) generado y verificado.
- APK debug DOVEXO `mobile-apk-4` publicado.
- 123 pruebas pytest y 130 pruebas Vitest.
- Nuevos documentos: `TEAM_API.md`, `PILOT_READINESS.md`, `ANDROID_RELEASE.md`,
  `EMAIL_RESEND.md`, `BACKUP_RESTORE.md`.

## 2026-11-10 — DOVEXO y preparación de pilotos (documentación)

Solo cambios documentales. No hay código nuevo en esta entrada.

- Identidad: ARVOKTA como empresa y DOVEXO como producto (ADR-016). ADR-015
  (ARREGLO) queda obsoleta en el nombre.
- `docs/BRAND.md` actualizado: nombre aprobado, dominio pendiente, reglas de
  centralización y lista de identificadores que no se renombran.
- `docs/PILOT_READINESS.md` nuevo: 20 criterios de `PROXIMOS_PASOS.txt`, con
  estado real (0 hechos, 6 en curso, 11 pendientes, 3 bloqueados) y bloqueos externos.
- `docs/ROADMAP.md`: Hito 9 "Pilot-ready". Solo está marcado como hecho el workflow
  de backup existente en el repositorio.
- `docs/KNOWN_ISSUES.md`: bloqueos de dominio, Resend, Play Console, keystore,
  `applicationId`, dispositivo y restauración de backups.
- Pendiente (no implementado): módulo de email, invitaciones de técnicos, acceso
  al portal sin `dev_token`, importador CSV y XLSX, onboarding, reset de demo,
  build firmado y prueba en dispositivo, restauración de backup verificada.

## 2026-11-10 — App móvil Android, portal del cliente y dashboard operativo

- App Expo / React Native (SDK 58) para Android en `apps/mobile`, con dos
  experiencias: técnico y cliente. No es un wrapper web.
- Técnico: login, trabajos asignados con filtros, detalle, transiciones,
  llamada al cliente, dirección, notas, materiales, fotos, cola offline con
  idempotencia y registro de push.
- Cliente: login por email o teléfono con magic link (token de desarrollo en la
  demo), resumen, solicitud de servicio, órdenes, turnos, presupuestos con
  aprobación/rechazo, pagos y detalle con ítems.
- Backend: `POST /auth/mobile/login|refresh|logout`, `/notifications/devices`,
  `/portal/{slug}/*`, direcciones de cliente, `portal_settings`, push con Expo y
  `client_request_id` en notas, materiales y adjuntos.
- Migración `76aba18b0e16` aplicada en Neon: `customer_access_tokens`,
  `device_tokens`, direcciones, `portal_settings` y constraints de idempotencia.
- Trial de suscripción alineado a 14 días.
- Dashboard operativo: `GET /dashboard/operations` con turnos de hoy, órdenes
  atrasadas, sin técnico, presupuestos por vencer y trabajos finalizados con
  saldo; nueva UI de centro de operaciones.
- Landing P0: dataset único `demo-data.ts`, IDs y estados coherentes, 27 tests de
  integridad, copy honesto sobre IA/offline/WhatsApp/trial y FAQ ampliado.
- Nueve documentos de auditoría, matriz de verdad, benchmark y backlog
  priorizado en `docs/`.
- Android SDK local, scripts de entorno, CI móvil y guía de build.
- APK release arm64 generado en GitHub Actions y publicado como release
  `mobile-apk-3` (30.8 MB, firma de debug).
- Límite de órdenes por mes del plan aplicado en creación y conversión de
  solicitudes.
- Revocación del enlace público de presupuestos y rate limit también en
  aprobación/rechazo.
- 99 pruebas pytest y 95 pruebas de frontend.

## 2026-11-09 — Landing Arreglo, Groq y design system

- Marca provisional **Arreglo** centralizada en `apps/web/src/lib/brand.ts`.
- Landing v2 oscura: hero full-bleed ink, Three.js isométrico lazy, scanlines,
  tarjetas flotantes, contadores animados, marquee y CTA final con grilla.
- GSAP ScrollTrigger con recorrido fijado, Lenis smooth scroll, tilt 3D y Motion
  para microinteracciones; fallback SVG y `prefers-reduced-motion`.
- Landing nueva con hero, recorrido, bento de funciones, product tour, precios,
  FAQ, CTA, páginas de privacidad/términos, sitemap, robots y OG image.
- Design system inicial: Button, Card, Badge, Input, PageHeader, EmptyState,
  Skeleton, StatCard, Dialog, Tabs, Tooltip y DropdownMenu.
- Panel: sidebar ink, command palette (`⌘K`), notificaciones en popover,
  dashboard con hero oscuro, anillos de salud operativa y actividad reciente.
- Clientes, órdenes (tablero + tabla), presupuestos, pagos, agenda y solicitudes
  renovados con métricas, badges y menos superficies blancas.
- PWA técnico: filtros por estado, cards y shell renovados.
- Presupuesto público: nueva identidad, confirmación de rechazo con Dialog y
  barra de decisión sticky.
- Login/registro con identidad Arreglo y cuenta demo visible.
- **Groq** configurado como proveedor de IA externo
  (`openai/gpt-oss-120b`), con fallback determinista ante cuota agotada.
- `APIKEYS.txt` movido a `.local` y agregado a `.gitignore`.
- Documentación: `docs/BRAND.md`, `docs/PRODUCTION_CHECKLIST.md` y ADR-015.
- Seguridad P0: rate limiting compartido en PostgreSQL, lockout, revocación de
  familia de refresh tokens, audit log, validación de Origin, request ID,
  TrustedHost y docs ocultos en producción.
- Migración `c0cc7ae032ee` con `rate_limit_buckets`, `auth_attempts` y
  `audit_logs`.
- CI de seguridad con `pip-audit` y `pnpm audit`, Dependabot y workflow de
  backup diario de Neon.
- 83 pruebas pytest y 70 pruebas de frontend.

## 2026-11-08 — Despliegue 24/7 en Vercel + Neon

- PostgreSQL administrado en Neon (plan Free, región `gru1`).
- API FastAPI desplegada en Vercel con runtime Python 3.12 y preset FastAPI.
- Migraciones Alembic aplicadas contra Neon.
- Frontend Vercel apuntando a la API persistente.
- Cookies cross-site `SameSite=None; Secure` verificadas con refresh de sesión.
- Demo pública sin túnel ni dependencia de la máquina local.
- Datos demo cargados en Neon: clientes, solicitudes, órdenes, presupuestos,
  turno, pago, suscripción, automatización y notificación.
- `requirements.txt`, `.python-version` y `vercel.json` para el deploy de la API.

## 2026-11-08 — PWA, automatizaciones, IA, suscripciones y WhatsApp

- PWA para técnicos: `/tech`, detalle, transiciones, notas, materiales y fotos.
- Modelos `work_order_materials` y `work_order_attachments` con migración
  `51fc582e7593`.
- Automatizaciones: `automation_rules`, `automation_executions`, eventos de
  dominio, condiciones, acciones, idempotencia e historial.
- Notificaciones in-app con campana, contador y lectura individual/masiva.
- Asistente de IA con proveedor determinista, OpenAI-compatible y Ollama,
  cuotas, uso y costo estimado.
- Planes, suscripciones con precio histórico, uso y panel global del SaaS.
- WhatsApp Cloud API: configuración cifrada, webhook con firma HMAC, mensajes
  idempotentes y envío de texto.
- Rate limiting en memoria y cabeceras de seguridad.
- Migración `5ffb8399d836` con automatizaciones, notificaciones, IA,
  suscripciones, WhatsApp y `users.is_platform_admin`.
- Frontend: `/automations`, `/notifications`, `/assistant`, `/settings/billing`,
  `/settings/whatsapp` y `/admin`.
- CI, backups, restore y healthcheck.
- Investigación competitiva con fuentes oficiales al 2026-11-08.
- 73 pruebas pytest y 61 pruebas de frontend.

## 2026-11-08 — Despliegue público temporal

- Frontend en Vercel: `https://saas-gestion-web.vercel.app`.
- API local expuesta por túnel de Cloudflare.
- Tenant demo con clientes, solicitudes, órdenes, presupuestos, turno, pago,
  suscripción y automatización.
- Registro y alta de cliente probados desde el dominio público.

## 2026-11-08 — Agenda, técnicos, pagos y dashboard

- Modelos `appointments` y `payments`.
- Migración `de0e021aa0ca_add_appointments_and_payments`.
- Agenda con detección de conflictos, reprogramación y cancelación.
- Asignación de técnicos a órdenes y turnos.
- Pagos manuales, parciales y anulación con recálculo de `payment_status`.
- Endpoint `GET /api/v1/technicians` y `GET /api/v1/dashboard/summary`.
- Frontend: agenda diaria, pagos, asignación de técnico en órdenes y dashboard
  con métricas reales.
- Navegación por rol para ocultar módulos financieros a técnicos y viewers.
- 37 pruebas pytest y 22 pruebas de frontend; flujo completo probado en navegador.

## 2026-11-08 — Presupuestos, PDF y aprobación pública

- Modelos `quotes`, `quote_items` y `quote_events`.
- Migración `50e8c050aada_add_quotes_and_quote_items`.
- Cálculos con `Decimal`/`Numeric`, ítems históricos y numeración `QT-YYYY-0001`.
- Endpoints internos de presupuestos: alta, edición en borrador, envío,
  aprobación, rechazo, eventos y PDF.
- Endpoints públicos por token para consultar, aprobar o rechazar.
- Actualización automática del estado comercial de la orden asociada.
- Frontend: listado, alta con ítems dinámicos, detalle, PDF, link público y
  página pública `/q/[token]`.
- Dashboard con presupuestos pendientes.
- Endurecimiento: `viewer` sin acceso, bloqueo de fila para decisiones
  concurrentes, vencimiento, límites de importes y validación cliente–orden.
- 23 pruebas pytest y 9 pruebas de frontend; flujo completo probado en navegador.

## 2026-11-08 — Solicitudes y órdenes de trabajo

- Modelos `service_requests`, `work_orders` y `work_order_events`.
- Migración `ba3b1d3acd4d_add_service_requests_and_work_orders`.
- Endpoints de solicitudes: listado, alta, edición y conversión a orden.
- Endpoints de órdenes: listado, alta, edición, transición de estado y eventos.
- Reglas de transición y permisos especiales para técnicos.
- Frontend: listado/alta de solicitudes, conversión a orden, listado de órdenes
  y detalle con transiciones e historial.
- Dashboard con métricas de clientes, solicitudes y órdenes.
- 11 pruebas pytest y flujo completo probado en navegador.

## 2026-11-08 — Vertical slice inicial

- Backend FastAPI con autenticación self-hosted (Argon2id + JWT + refresh rotativo).
- Multi-tenancy por `X-Tenant-ID` validado contra membresías.
- CRUD de clientes con aislamiento entre tenants.
- Migración inicial Alembic con `tenants`, `users`, `memberships`,
  `refresh_tokens` y `customers`.
- 8 pruebas pytest (health, auth, clientes, aislamiento).
- Frontend Next.js 16 con landing, registro, login, dashboard y clientes.
- Contexto de autenticación con refresh automático y selector de empresa.
- Vitest, ESLint, TypeScript estricto y build de producción.
- `scripts/verify.ps1` pasa completo.
- Prueba manual en navegador del flujo registro → dashboard → alta de cliente.
- Primer push a `https://github.com/manuysys/SAAS_GESTION_APP` (`main`).

## 2026-11-07 — Preparación del entorno

- Lectura completa del contexto maestro.
- Auditoría del entorno local.
- Inicialización del repositorio Git y remoto `origin`.
- `AGENTS.md` con instrucciones permanentes.
- Documentación base: producto, PRD, arquitectura, modelo de datos, seguridad,
  multi-tenancy, roadmap, despliegue y estado.
- Instalación de GitHub CLI y `fnm` con Node 24 LTS.
- Instalación de Python 3.12 vía `uv`.
- Descarga y configuración de PostgreSQL 17.11 portable.
- Configuración de OpenCode: MCP, agentes, skills y comandos.
- Scripts de base de datos y verificación.

## 2026-11-06 — Origen

- Creación del repositorio vacío `SAAS_GESTION_APP`.
- Incorporación del documento de contexto del proyecto.
