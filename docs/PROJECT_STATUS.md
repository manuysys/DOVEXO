# Estado del proyecto

**Última actualización:** 2026-11-18
**Fase:** preventa / customer discovery activa (GO_TO_MARKET) + landing v2 con
héroe 3D de Spline y hardening de seguridad del backend (desplegados el
2026-11-18; `main`, commit `440737c`). Base técnica: Hito 2
completo + PWA, app móvil Android DOVEXO, portal del cliente, dashboard
operativo, automatizaciones, IA con Groq, suscripciones, panel global, WhatsApp,
importador CSV/XLSX, onboarding y reset de demo (pilot-ready).

## Resumen

La aplicación corre de punta a punta: registro, login, refresh de sesión,
creación de empresa, aislamiento por tenant, clientes, solicitudes, órdenes de
trabajo, presupuestos con PDF y aprobación pública, agenda, asignación de
técnicos, pagos, dashboard operativo, PWA para técnicos, app móvil Android
DOVEXO para técnicos y clientes, portal del cliente, invitaciones de equipo,
automatizaciones con notificaciones, asistente de IA, planes y suscripciones,
panel global del SaaS, configuración de WhatsApp Cloud API, importador de clientes
desde CSV y XLSX con vista previa, onboarding de cuatro pasos y reset del tenant
demo.

Desde el 2026-11-14 la etapa activa es **preventa / customer discovery**: el
paquete comercial está en `docs/GO_TO_MARKET/` (21 prospectos verificados con
fuente, guion de entrevista, guion de demo, programa de pilotos y borradores de
contacto), a la espera de la aprobación del fundador para enviar mensajes.

El frontend y la API están desplegados en Vercel. La base PostgreSQL está en
Neon (plan Free, región `gru1`). La demo ya no depende de una máquina local ni
de un túnel. La empresa es **ARVOKTA** y el producto **DOVEXO**; el dominio
propio está pendiente.

## Hecho y verificado

### Entorno

- [x] Repositorio Git inicializado con remoto `origin`.
- [x] `AGENTS.md`, documentación base y `.env.example`.
- [x] OpenCode: agentes, skills, comandos y Context7 MCP.
- [x] Node 24 vía `fnm`, Python 3.12 vía `uv`.
- [x] PostgreSQL 17.11 portable en `127.0.0.1:55432` para desarrollo local.
- [x] PostgreSQL administrado en Neon para la demo pública.
- [x] API FastAPI desplegada en Vercel con runtime Python 3.12.
- [x] CI en GitHub Actions para backend y frontend.
- [x] Scripts de backup, restore y healthcheck.

### Backend

- [x] FastAPI + SQLAlchemy 2 async + Pydantic v2 + Alembic.
- [x] Modelos: `tenants`, `users`, `memberships`, `refresh_tokens`, `customers`,
  `service_requests`, `work_orders`, `work_order_events`, `work_order_materials`,
  `work_order_attachments`, `quotes`, `quote_items`, `quote_events`,
  `appointments`, `payments`, `automation_rules`, `automation_executions`,
  `notifications`, `ai_usage_logs`, `plans`, `subscriptions`, `whatsapp_configs`,
  `whatsapp_messages`, `customer_access_tokens`, `device_tokens`,
  `email_deliveries`, `invitations` y `portal_settings` en `tenants`.
- [x] Modelos del bloque 2026-11-11: `import_jobs` (job de importación con
  `tenant_id`, `status`, `summary`, `rows_json`, `errors_json`, `created_by`,
  `applied_at`) y `onboarding_state` (columna JSONB nullable en `tenants`).
- [x] Migraciones: `84e62c6788cb`, `ba3b1d3acd4d`, `50e8c050aada`,
  `de0e021aa0ca`, `51fc582e7593`, `5ffb8399d836`, `c0cc7ae032ee`,
  `76aba18b0e16`, `a1b2c3d4e5f6`, `b2c3d4e5f6a7` y `c3d4e5f6a7b8` (aplicadas en
  Neon).
- [x] Migraciones del bloque 2026-11-11: `d4e5f6a7b8c9` (`import_jobs`) y
  `e5f6a7b8c9d0` (`tenants.onboarding_state`). Aplicadas en Neon; `alembic current`
  = `e5f6a7b8c9d0` (head). Verificadas localmente: upgrade, downgrade y `alembic
  check` sin drift.
- [x] Auth: registro, login, refresh rotativo, logout, `/me`.
- [x] Argon2id, JWT de acceso, cookies `HttpOnly`.
- [x] Multi-tenancy por `X-Tenant-ID` validado contra membresía.
- [x] Clientes, solicitudes, órdenes, transiciones y auditoría.
- [x] Presupuestos con `Decimal`, ítems históricos, PDF y token público.
- [x] Revocación del enlace público de presupuesto y rate limit en aprobación.
- [x] Límite de órdenes por mes del plan aplicado en creación y conversión.
- [x] Agenda, conflictos, reprogramación y asignación de técnicos.
- [x] Pagos manuales, parciales, anulación y recálculo de estado.
- [x] Dashboard summary y dashboard operativo (`/dashboard/operations`):
  turnos de hoy, órdenes atrasadas, sin técnico, presupuestos por vencer y
  trabajos finalizados con saldo.
- [x] PWA de técnicos: órdenes asignadas, transiciones, notas, materiales y
  fotos con validación de tipo/tamaño.
- [x] Auth móvil para técnicos: login, refresh rotativo y logout sin cookies.
- [x] Invitaciones de equipo con token hasheado, expiración, reenvío, revocación
  y aceptación; límites de usuarios/técnicos con lock.
- [x] Email transaccional con proveedor `console` y Resend opcional; registro de
  envíos e idempotencia. Sin dominio verificado no hay entrega productiva.
- [x] Portal del cliente: acceso seguro generado desde la ficha del cliente,
  envío por email o enlace copiable, token hasheado, revocación, resumen,
  solicitudes, órdenes, turnos, presupuestos, pagos y aprobación/rechazo.
- [x] `dev_token` deshabilitado en producción.
- [x] Revocación de sesión de portal por versión: revocar o regenerar el acceso
  invalida los JWT de portal ya emitidos.
- [x] Consumo atómico del token de portal (un solo uso ante verificaciones
  concurrentes).
- [x] Escape HTML de nombres y enlaces en emails transaccionales.
- [x] Reenvío de invitación con idempotencia por token; invitaciones vencidas
  liberan cupo.
- [x] Validación de `Origin` al aceptar invitaciones y `Referrer-Policy:
  no-referrer` en el portal.
- [x] IP real para rate limiting: `X-Real-IP` y `X-Forwarded-For` solo se leen
  con `TRUST_PROXY_HEADERS=true` (default `false`; desde 2026-11-18, ADR-019).
  Reemplaza la confianza implícita en ambas cabeceras descrita antes.
- [x] Direcciones de cliente expuestas al técnico.
- [x] Push con Expo para asignación y cambio de estado, sin revertir la
  operación si falla el envío.
- [x] Idempotencia móvil con `client_request_id` en notas, materiales y fotos.
- [x] Trial de suscripción de 14 días.
- [x] Automatizaciones: reglas por evento, condiciones, acciones `notify` y
  `notify_user`, ejecuciones idempotentes e historial. `send_whatsapp` queda
  `skipped` hasta configurar credenciales.
- [x] Notificaciones in-app con lectura individual y masiva.
- [x] Asistente de IA: proveedor determinista local, Groq/OpenAI-compatible y
  Ollama opcionales, cuotas y registro de uso.
- [x] Groq configurado en producción con `openai/gpt-oss-120b` y fallback
  determinista si se agota la cuota externa.
- [x] Planes, suscripción con precio histórico, uso y límites.
- [x] Panel global: métricas agregadas, empresas y cambio de suscripción.
- [x] WhatsApp Cloud API: configuración cifrada, webhook con firma HMAC,
  idempotencia y envío de texto. Sin credenciales reales no está probado
  end-to-end.
- [x] Rate limiting compartido en PostgreSQL con fallback en memoria.
- [x] Lockout de login por email/IP y revocación de familia de refresh tokens.
- [x] Auditoría de auth, admin, presupuestos y pagos en `audit_logs`.
- [x] Validación de `Origin` en endpoints con cookie.
- [x] Request ID, logs estructurados y `TrustedHostMiddleware`.
- [x] `/docs`, `/redoc` y `/openapi.json` ocultos en producción.
- [x] Cabeceras de seguridad HTTP.
- [x] Health checks `/api/v1/health/live` y `/ready`.
- [x] Importador de clientes CSV y XLSX (`/api/v1/imports/customers/*`):
  - Vista previa con validación por fila, duplicados contra la base y dentro del
    archivo, y errores por línea.
  - Commit idempotente: un job aplicado devuelve el mismo resultado sin crear
    clientes nuevos. Solo se crean filas válidas y no duplicadas.
  - Descarga `errors.csv` con línea, datos y error.
  - Roles: `owner`, `admin`, `dispatcher`. Técnicos y viewers no pueden importar.
  - Límites: 2 MB, 500 filas. XLSX: 1000 entradas comprimidas, 20 MB
    descomprimidos y razón de compresión máxima 100 (anti zip-bomb). Se valida
    la firma del archivo (magic bytes) antes de parsear.
  - Neutralización de fórmulas (`=`, `+`, `-`, `@`, tab, CR, LF) **solo en el
    `errors.csv` de salida**; los datos persistidos no se modifican.
  - Lock de la fila de tenant en el commit para serializar importaciones.
  - Rate limit: 30 previews y 30 commits por ventana.
- [x] Onboarding de cuatro pasos (`/api/v1/onboarding`):
  - `GET`, `PATCH` (merge parcial; el horario se reemplaza completo) y
    `POST /complete`. Solo `owner` y `admin`.
  - Progreso guardado en `tenants.onboarding_state`.
  - Límites: 16 KB serializado, 20 servicios, precio máximo
    `999999999999.99`, horas en formato `HH:MM`, zona horaria y moneda validadas.
  - Lock de la fila de tenant en lectura y escritura.
- [x] Reset del tenant demo (`POST /api/v1/admin/demo/reset`):
  - Solo platform admin (`is_platform_admin` o email en
    `PLATFORM_ADMIN_EMAILS`). Un usuario común recibe 403.
  - Opera únicamente sobre el tenant con slug `servicios-demo`. No toca otros
    tenants (test de aislamiento).
  - Limpia datos de negocio y conserva `audit_logs`. Registra `demo_reset` con
    IP y conteos.
  - Seed versionado en `apps/api/app/seed/demo.py`, idempotente, con un turno
    futuro: mañana a las 10:00 hora argentina (13:00 UTC), según `_tomorrow_at`.
  - Rate limit: 10 resets por ventana. Lock de la fila del tenant demo.
- [x] 179 pruebas pytest al cierre del bloque 2026-11-11. La cifra vigente es
  203 (2026-11-18; ver "Landing v2, hardening y deploy").

### Frontend

- [x] Next.js 16.4.5 + React 19 + TypeScript estricto + Tailwind 4.
- [x] Landing pública de producto con identidad **DOVEXO** (nombre histórico: Arreglo; ADR-016).
- [x] Hero oscuro full-bleed con Three.js isométrico lazy, scanlines, tarjetas
  flotantes y contadores. _(Estado del 2026-11-09. Desde 2026-11-18 la landing v2
  quitó scanlines y Marquee y usa Spline en desktop; ver la sección nueva.)_
- [x] GSAP ScrollTrigger con recorrido fijado, Lenis smooth scroll, marquee,
  tilt 3D y Motion para microinteracciones. _(Marquee eliminado el 2026-11-18;
  `journey.tsx` usa ScrollTrigger con scrub y stagger.)_
- [x] Design system inicial: Button, Card, Badge, Input, PageHeader, EmptyState,
  Skeleton, StatCard, ProgressRing, Dialog, Tabs, Tooltip y DropdownMenu.
- [x] Panel con command palette (`⌘K`), notificaciones en popover y dashboard
  renovado con hero oscuro, anillos de salud operativa y actividad reciente.
- [x] Clientes con búsqueda, avatares, estados y confirmación de archivado.
- [x] Órdenes con vista de tablero por estado y vista de tabla.
- [x] Presupuestos con métricas, filtros por estado y tabla renovada.
- [x] Pagos con métricas de total, cantidad y ticket promedio.
- [x] Agenda con cabecera de día, timeline y estados.
- [x] Solicitudes con métricas, prioridad, origen y conversión a orden.
- [x] Registro, login y cierre de sesión con identidad DOVEXO.
- [x] Contexto de autenticación con refresh automático y selector de empresa.
- [x] Dashboard con métricas reales y centro de operaciones accionable.
- [x] Clientes, solicitudes, órdenes y detalle con historial.
- [x] Presupuestos, PDF y página pública `/q/[token]` rediseñada.
- [x] Agenda, pagos y asignación de técnicos.
- [x] PWA `/tech` y `/tech/orders/[id]` con manifest, service worker y offline.
- [x] Filtros por estado en la PWA del técnico.
- [x] Automatizaciones y notificaciones con campana y contador.
- [x] Asistente `/assistant` con preguntas rápidas y estado honesto del proveedor.
- [x] Facturación `/settings/billing` con plan, uso y cambio de plan.
- [x] Panel global `/admin` para platform admins.
- [x] WhatsApp `/settings/whatsapp` con configuración, mensajes y envío.
- [x] Navegación por rol; técnicos usan su propio shell.
- [x] Cliente API tipado, TanStack Query, React Hook Form + Zod.
- [x] Landing con dataset único de demo (`demo-data.ts`), IDs y estados
  coherentes, 27 tests de integridad y copy honesto.
- [x] Identidad DOVEXO/ARVOKTA en landing, login, panel, PWA y páginas legales.
- [x] Sección Equipo con invitaciones, reenvío, revocación y aceptación pública.
- [x] Detalle de cliente con acceso al portal: enviar por email o copiar enlace.
- [x] Importador en `/settings/import`: carga de archivo, vista previa con
  errores y duplicados, confirmación, descarga de `errors.csv` y estados de
  error y carga.
- [x] Onboarding en `/onboarding`: asistente de cuatro pasos (empresa, servicios
  y horarios, equipo, primeros datos) con progreso guardado y reanudable.
- [x] Checklist de inicio en el dashboard (`OnboardingChecklist`).
- [x] Vitest con 281 pruebas al 2026-11-18 (210 al cierre del bloque 2026-11-11).

### App móvil

- [x] Expo SDK 58 + React Native 0.88 + Expo Router + TypeScript estricto.
- [x] Android primero, package `com.dovexo.mobile`, scheme `dovexo` (histórico: `com.arreglo.mobile`).
- [x] Experiencia de técnico: login, trabajos, filtros, detalle, transiciones,
  llamada, dirección, notas, materiales, fotos, historial y logout.
- [x] Experiencia de cliente: login por email o teléfono, demo, resumen,
  solicitud, órdenes, turnos, presupuestos, pagos y detalle con ítems.
- [x] Cola offline persistente para notas, materiales y fotos con idempotencia.
- [x] Registro de push con Expo, tolerante a fallos.
- [x] Tokens en `expo-secure-store`; refresh rotativo persistido.
- [x] `pnpm exec tsc --noEmit`, `expo export --platform android` y
  `expo-doctor` 20/20.
- [x] APK release arm64 generado en GitHub Actions (release `mobile-apk-5`,
  30.8 MB, identidad DOVEXO).
- [x] AAB firmado con keystore de release generado y verificado en GitHub
  Actions (artifact `dovexo-android-aab`, 36 MB).
- [ ] APK instalado y probado en un dispositivo físico.
- [ ] AAB subido a Google Play y prueba interna.

### Verificación ejecutada (histórica, 2026-11-10)

Estos números son del cierre previo al bloque 2026-11-11. Para el estado actual,
ver "Verificación del bloque 2026-11-11".

```text
ruff check          -> All checks passed
ruff format --check -> 143 files already formatted
basedpyright        -> 0 errors, 0 warnings, 0 notes
pytest              -> 127 passed
pnpm lint           -> sin errores
pnpm typecheck      -> sin errores
pnpm test           -> 130 passed
pnpm build          -> 27 rutas generadas
expo-doctor         -> 20/20 checks passed
scripts/verify.ps1  -> Todo OK
Android APK         -> mobile-apk-5 (DOVEXO, debug)
Android AAB         -> artifact dovexo-android-aab (release, 36 MB)
```

Flujo probado en navegador contra Vercel + Neon: registro, clientes, solicitud,
orden, presupuesto, aprobación pública, agenda, pago y dashboard. También se
verificó que la aprobación pública dispara una automatización y crea una
notificación in-app.

### Verificación del despliegue 24/7

```text
GET https://saas-gestion-api.vercel.app/api/v1/health/live  -> 200
GET https://saas-gestion-api.vercel.app/api/v1/health/ready -> 200
GET https://saas-gestion-api.vercel.app/docs                -> 404
GET https://saas-gestion-api.vercel.app/openapi.json        -> 404
POST /api/v1/auth/login (demo)                              -> 200 + X-Request-ID
GET /api/v1/quotes/{id}/pdf                                 -> 200 application/pdf
GET /api/v1/plans                                           -> 3 planes
GET /api/v1/subscription                                    -> Professional active
GET /api/v1/admin/metrics (fundador)                        -> 200
SELECT count(*) FROM audit_logs                             -> 1
SELECT count(*) FROM rate_limit_buckets                     -> 1
SELECT count(*) FROM auth_attempts                          -> 1
POST /api/v1/auth/mobile/login (técnico)                    -> 200, 1 tenant technician
POST /api/v1/auth/mobile/refresh                            -> 200, token rotado
POST /api/v1/auth/mobile/logout                             -> 204
GET  /api/v1/portal/servicios-demo                          -> 200, demo_available=true
POST /api/v1/portal/servicios-demo/auth/demo                -> 200, Carlos Gomez
GET  /api/v1/portal/servicios-demo/summary                  -> 200
GET  /api/v1/portal/servicios-demo/orders|quotes|appointments|payments -> 200
GET  /api/v1/dashboard/operations (demo)                    -> 200
GET  /api/v1/team (demo)                                    -> 200, 2 miembros
POST /api/v1/team/invitations (demo)                        -> 201, email_status=console
POST /api/v1/customers/{id}/portal-access (demo)            -> 200, email_status=not_sent
POST /api/v1/portal/servicios-demo/auth/verify              -> 200, Carlos Gomez
GET  /api/v1/portal/servicios-demo/me (JWT portal)          -> 200, Carlos Gomez
POST /api/v1/customers/{id}/portal-access/revoke (demo)     -> 204
GET  /api/v1/portal/servicios-demo/me (mismo JWT)           -> 401, sesión revocada
GET  https://saas-gestion-web.vercel.app/portal/servicios-demo -> 200, meta referrer no-referrer
POST /api/v1/portal/servicios-demo/auth/request             -> 200, dev_token ausente
```

### Verificación del bloque 2026-11-11 (importador, onboarding y reset de demo)

El bloque se commiteó en `3e3ff21` y se desplegó en Vercel (API + web). Verificación contra
Vercel + Neon con evidencia HTTP real:

```text
GET /api/v1/health/ready                            -> 200
GET /api/v1/health/live                             -> 200
POST /api/v1/auth/login (demo owner)                -> 200
GET /api/v1/team                                    -> 200, 2 miembros

# Importador CSV
POST /api/v1/imports/customers/preview              -> 200 {total:4, valid:3, invalid:1}
POST /api/v1/imports/customers/commit               -> 200 {created:3, skipped_invalid:1}
GET  /api/v1/customers?query=devops.csv             -> 200
GET  /api/v1/imports/{job_id}/errors.csv            -> 200
DELETE /api/v1/customers/{id}  (x3 de prueba)       -> 204 x3
Consulta posterior devops.csv                        -> 0

# Importador XLSX (archivo real generado con openpyxl)
POST /api/v1/imports/customers/preview              -> 200 {total:2, valid:2}
  (no 422 "Librería XLSX no disponible": openpyxl y defusedxml ya están en
   apps/api/requirements.txt)

# phone persistido exacto sin apóstrofo: +54 11 4000-9001 (verificado en customers)
# errors.csv línea 5: '+54 11 4000-9004 (neutralización solo en salida, correcto)

# Onboarding
GET  /api/v1/onboarding                              -> 200
PATCH /api/v1/onboarding  timezone=Cordoba           -> 200 (aplicado)
PATCH /api/v1/onboarding  timezone=Buenos_Aires      -> 200 (restaurado)
POST  /api/v1/onboarding/complete                    -> 200

# Reset de demo (founder@saasgestion.com, platform admin)
POST /api/v1/admin/demo/reset                        -> 200 {customers:3, service_requests:2,
                                                      work_orders:2, quotes:1, appointments:1, payments:1}
GET  /api/v1/onboarding (demo post-reset)            -> 200, completed=false, step 1
GET  /api/v1/service-requests | work-orders | quotes |
  appointments | payments | customers                -> 200 todos

# Portal y dashboard
POST /api/v1/portal/servicios-demo/auth/demo         -> 200
GET  /api/v1/portal/servicios-demo/summary           -> 200
GET  /api/v1/dashboard/operations                    -> 200

# Web
GET  /                                              -> 200
GET  /onboarding                                    -> 200
GET  /settings/import                               -> 200
```

Tests (reportados por backend y frontend; suites locales no re-ejecutadas por QA por
falta de PostgreSQL local en esta sesión):

| Área | Archivos de test |
|---|---|
| Importador (API) | `apps/api/tests/test_imports.py` |
| Onboarding (API) | `apps/api/tests/test_onboarding.py` |
| Reset de demo (API) | `apps/api/tests/test_demo_reset.py` |
| Importador (web) | `apps/web/src/lib/import-utils.test.ts`, `apps/web/src/components/imports/customer-import.test.tsx` |
| Onboarding (web) | `apps/web/src/lib/onboarding-utils.test.ts`, `apps/web/src/components/onboarding/onboarding-wizard.test.tsx` |

Backend: `ruff check` OK, `ruff format --check` OK (158 files), `basedpyright` 0 errores.
Frontend: `pnpm lint`, `pnpm typecheck`, `pnpm test` OK (210 tests).

Cobertura de tests: validación de tipo, tamaño, firma y ratio de XLSX; límite de 500 filas;
duplicados contra la base y en el archivo; commit idempotente; aislamiento entre tenants;
permisos por rol (técnico y viewer no importan; `dispatcher` sí); neutralización solo en
`errors.csv`; sanitización de nombre de archivo; reset solo para platform admin, sin tocar
otros tenants, con idempotencia y con `audit_logs` preservados.

Nota local: el PostgreSQL portable de desarrollo (`127.0.0.1:55432`) no pudo iniciarse en
esta sesión por un conflicto de `sharing violation` en `postgres.log` en Windows. Eso no
afecta la producción (Neon) ni el despliegue en Vercel.

El refresh de sesión cross-site se verificó recargando el dashboard después del
login. El asistente devolvió `QT-2026-0002` con datos reales de Neon. Las
migraciones `b2c3d4e5f6a7` y `c3d4e5f6a7b8` quedaron aplicadas en Neon y la API
se redesplegó el 2026-11-11.

## Verificación de la auditoría externa (2026-11-15)

Una auditoría externa del 2026-11-14 reportó cuatro hallazgos. Verificación con evidencia:

| Hallazgo | Verificación 2026-11-15 | Estado |
|---|---|---|
| IDs de orden duplicados en la landing (OT-0141/OT-0142) | El HTML desplegado no contiene esos IDs; usa `OT-2026-0001..0003` desde `apps/web/src/lib/marketing/demo-data.ts` | No reproducible en el deploy actual; cerrado |
| Identidad "Arreglo" en la release del APK | `mobile-apk-4` y `mobile-apk-5` ya se llaman "DOVEXO Android APK (debug)"; solo la release histórica `mobile-apk-3` conserva el título viejo | Corregido en la release actual |
| Enlace de descarga del APK roto | Las 3 releases tienen `app-release.apk` adjunto (30.819.479 bytes); el enlace roto era el mirror de tmpfiles.org que escribía `mirror-apk.yml`. Workflow eliminado y links actualizados a `mobile-apk-5`. SHA-256: `437FE51EA5284EBD5F9FCE740DA738610B7A9142017CF8096A4BD078AD6EE3D3` | Corregido |
| Credenciales de demo expuestas (P0-D) | La demo usa datos ficticios, tiene reset por API y rate limiting, pero las credenciales son públicas en landing y docs | Decidido 2026-11-17: se mantiene abierta con aviso visible "datos de ejemplo" en el panel del tenant `servicios-demo`; credenciales de plataforma fuera de docs comerciales |

**Hallazgo propio (backup):** las 6 corridas del workflow `Database backup`
figuran "success" pero **no producen artifact**: `NEON_DATABASE_URL` no está
configurada y el workflow salía con warning. No hay backups desde el 2026-11-10.
El workflow ahora **falla** si falta el secreto (2026-11-15); el fundador debe
configurar `NEON_DATABASE_URL` en GitHub.

**Verificación local integral (2026-11-15):** `scripts/verify.ps1` salió con
código 0 con la suite completa: ruff check OK, ruff format OK (158 archivos),
basedpyright 0 errores, pytest 179 pruebas en tres chunks (71 + 56 + 52, todas
en 100 %), ESLint OK, TypeScript OK, Vitest 210 pruebas (24 archivos),
`next build` 28 rutas y `tsc` móvil OK. Se agregó al script el chunk de
`test_demo_reset.py`, `test_imports.py` y `test_onboarding.py`, que faltaba.

## Rediseño visual integral (2026-11-18)

Ejecutado sobre la rama `feat/frontend-redesign` según `MEJORA_FRONTEND.txt`.
Documentos: `DESIGN_AUDIT.md`, `DESIGN_SYSTEM.md`, `LANDING_REDESIGN.md`,
`DASHBOARD_REDESIGN.md`, `PWA_REDESIGN.md`, `MOBILE_REDESIGN.md`.

- **Design system:** tokens nuevos (primary `#315EFB`, deep, teal, violet,
  estados), tipografía, radios, sombras y motion en `globals.css`; los 13
  componentes de `components/ui/` migrados; stories de Button, Card, Badge,
  Input y StatCard; Storybook build OK.
- **Landing:** hero nuevo con mockups reales (panel, teléfono, notificación),
  ilustración isométrica 2D, escena Three.js lazy, credenciales demo
  colapsadas, fila de confianza y secciones rediseñadas (beneficios
  alternados, tour de 6 tabs, pricing accesible, trust strip, FAQ, CTA y
  footer).
- **Dashboard:** P0 de overflow mobile corregido (390 px sin scroll lateral,
  medido con Playwright), KPIs accionables sin duplicar, hero compacto,
  checklist y shell con tokens.
- **Módulos:** clientes (tabla + ficha con tabs y timeline), órdenes y
  solicitudes (tabla, kanban, detalle con timeline), presupuestos y pagos
  (detalle en dos columnas con PDF, métricas de cobro), agenda (día, semana y
  equipo con detección de conflictos), automatizaciones/asistente/panel global
  y configuración/onboarding.
- **PWA del técnico:** guard de rol (403 explicado), home y detalle,
  indicadores offline/sincronización, fotos y materiales; loading con shell.
- **Portal y presupuesto público:** home priorizada, aprobación simple, bug de
  vencimiento civil corregido, sumas de dinero en centavos, token fuera de la
  URL.
- **App Android:** tokens TS, tabs por rol, pestaña de pagos, bottom sheets,
  skeletons y sync offline; `tsc` OK.
- **Backend:** fix aislado en `AIUsageItem` (`from_attributes`) para que
  `/api/v1/ai/usage` no devuelva 500; sin cambios de contrato.
- **Verificación:** `scripts/verify.ps1` (backend ruff/basedpyright/pytest,
  frontend lint/typecheck/tests/build, móvil tsc) y `build-storybook` OK.
  Vitest: 281 pruebas en 35 archivos. Build: 28 rutas.
- **Producción:** en esta entrada no se había desplegado. El deploy se hizo el
  2026-11-18 (ver "Landing v2, hardening y deploy"). Siguen pendientes el QA
  visual de las 8 resoluciones en todas las rutas, la auditoría formal de
  a11y/performance y la prueba en Android físico.

## Landing v2, hardening y deploy (2026-11-18)

Detalle completo en `CHANGELOG.md` (entrada del mismo día). Resumen con el
estado de cada punto:

| Punto | Estado | Evidencia |
|---|---|---|
| Héroe 3D con Spline (desktop, poster estático en mobile) | Implementado y desplegado | Commit `4ed02eb`; ADR-018; `LANDING_REDESIGN.md` §9 |
| Badge "Built with Spline" visible | Vigente (plan Free) | Se oculta solo con plan pago; no contratado |
| Tour de producto con capturas reales del tenant demo | Implementado y desplegado | `apps/web/public/product-tour/*.webp` |
| GSAP ScrollTrigger en `journey.tsx` con reduced motion | Implementado; stagger verificado en producción | Commit `4ed02eb`; pasos con `opacity 0 → 1` al hacer scroll |
| 10 hallazgos de auditoría de backend | Corregidos y desplegados (API); el cliente móvil corregido está en `main` sin APK nuevo | `SECURITY_AUDIT.md` §8 |
| `/ai/usage` devolvía 500 | Corregido (commit `85239e0`); producción 200 | Evidencia de la API abajo |
| `TRUST_PROXY_HEADERS` en producción | Configurado en Vercel (API) | ADR-019 |
| `WHATSAPP_APP_SECRET` en producción | **No configurado**: webhook responde 503 a propósito | ADR-019; `KNOWN_ISSUES.md` |

**Verificación de `scripts/verify.ps1` (2026-11-18):** salida "Todo OK",
código 0, duración 608 s. ruff OK; format OK (160 archivos); basedpyright 0
errores; pytest **203 pasadas** (incluye `test_security_hardening.py`, 21
pruebas); ESLint OK; TypeScript OK; Vitest **281 pasadas**; build de **28
rutas**; `tsc` móvil OK.

**Deploy a producción (2026-11-18):**

| Proyecto | Deployment | Target | Alias |
|---|---|---|---|
| API | `saas-gestion-gc9224fim` | Production (Ready) | `https://saas-gestion-api.vercel.app` |
| Web | `saas-gestion-evispxp11` | Production (Ready) | `https://saas-gestion-web.vercel.app` |

Evidencia de la API (HTTP):

```text
GET  /api/v1/health/live                       -> 200
GET  /api/v1/health/ready                      -> 200
POST /api/v1/auth/login (demo)                 -> 200
GET  /api/v1/ai/usage                          -> 200
POST /api/v1/ai/chat (técnico)                 -> 403
POST /api/v1/auth/refresh (Origin web)         -> 401 (origen permitido, sin token)
POST /api/v1/auth/refresh (Origin evil/prefijo)-> 403
POST /api/v1/webhooks/whatsapp (sin secreto)   -> 503 (esperado, fail-closed)
GET  /api/v1/dashboard/operations              -> 200
GET  /api/v1/team, /customers, /quotes,
     /subscription, /notifications             -> 200
GET  /api/v1/quotes/{id}/pdf                   -> 200
```

Evidencia de la web (HTTP y navegador):

```text
GET  /                                  -> 200 (Spline y product-tour presentes)
GET  /login                             -> 200
Login demo -> /dashboard                -> OK, sin errores de consola
GET  /tech                              -> 200
GET  /portal/servicios-demo             -> 200
GET  /privacy, /terms, /onboarding,
     /settings/import                   -> 200
```

**No verificado en esta entrada:** medición de peso y LCP de Spline, Lighthouse,
auditoría de a11y, comportamiento ante caída del runtime de Spline, prueba del
APK con el cliente de refresh corregido, y flujo WhatsApp end-to-end (sigue sin
credenciales de Meta).

## Demo pública

- Frontend: https://saas-gestion-web.vercel.app
- API: https://saas-gestion-api.vercel.app
- Base de datos: Neon PostgreSQL (`gru1`, plan Free).
- Admin demo: `demo@saasgestion.com` / `Demo12345!`.
- Técnico demo: `tecnico@saasgestion.com` / `Tecnico12345!`.
- Cliente demo del portal: empresa `servicios-demo`, `carlos@example.com`.
- APK Android de prueba: https://github.com/manuysys/SAAS_GESTION_APP/releases/tag/mobile-apk-5
  (asset directo `app-release.apk`, SHA-256 en `docs/MOBILE_BUILD.md`)

Ver `docs/DEMO.md`. La demo ya no depende de esta máquina. Limitación: el plan
Free de Neon y el plan Hobby de Vercel tienen límites de uso y cold starts.

## Pendiente

- [ ] Autorizar y enviar los primeros mensajes a prospectos (borradores en
  `docs/GO_TO_MARKET/OUTREACH_DRAFTS_2026-11-14.md`; requiere aprobación del
  fundador).
- [ ] Entrevistas a clientes (8-12 planificadas; 0 realizadas).
- [ ] Instalar el APK en un Android real y recorrer técnico, cliente, fotos y
  offline.
- [ ] Publicar en Google Play con keystore de release, ficha, privacidad y data
  safety.
- [ ] Entregar magic links del portal por email o WhatsApp.
- [ ] WhatsApp end-to-end con número y credenciales de Meta.
- [ ] Cobros reales con Mercado Pago y webhooks.
- [ ] Enforcement completo de límites por plan en todos los endpoints.
- [ ] Recordatorios automáticos programados (cron/worker).
- [ ] Modo de solo lectura de la demo o reset programado (el reset manual ya existe).
- [ ] Prueba E2E en navegador del importador, el onboarding y el reset contra Vercel + Neon.
- [ ] Configurar `NEON_DATABASE_URL` en GitHub y verificar un backup real con
  restauración (hoy no hay ningún backup; ver "Verificación de la auditoría externa").
- [ ] Comprar dominio (investigación en `docs/GO_TO_MARKET/BRAND_DOMAIN_RESEARCH.md`),
  configurar Resend y política de privacidad.
- [ ] Configurar `WHATSAPP_APP_SECRET` en Vercel (API, Production). Sin él, el
  webhook de WhatsApp responde 503 (ADR-019).
- [ ] Decidir el badge de Spline: aceptarlo con plan Free o contratar Hobby
  (costos en `COSTS_2026-11-18.md`).
- [ ] Agregar lock en `revoke_refresh_token` (logout), que hoy solo se bloquea
  en la rotación.
- [ ] Agregar test de reuso de refresh fuera de la ventana de gracia de 10 s.
- [ ] Compilar un APK nuevo para incluir el single-flight de refresh de
  `apps/mobile/src/lib/api.ts`.

## Próximo paso concreto

1. Autorizar y enviar los primeros mensajes (El Mejor Clima, TOTALAIR, UBE) y
   coordinar las primeras entrevistas.
2. Probar el APK `mobile-apk-5` en un dispositivo Android real y corregir lo que
   falle. Antes, compilar un APK nuevo con el cliente de refresh corregido.
3. Configurar `NEON_DATABASE_URL` en GitHub y verificar un backup real con
   restauración.
4. Registrar `dovexo.com.ar` (libre según RDAP 2026-11-15), verificarlo en Resend
   y configurar `EMAIL_FROM`.
5. Subir el AAB firmado a Google Play Console y crear la prueba interna.

## Limitaciones conocidas

- Neon Free y Vercel Hobby tienen límites de almacenamiento, conexiones y
  ejecución; no son un entorno productivo con SLA.
- Sin credenciales de Meta ni Mercado Pago. Groq está configurado en producción
  con fallback determinista.
- El rate limiting usa PostgreSQL con fallback en memoria; para varias instancias
  conviene Redis/Upstash o el WAF del proveedor.
- Las fotos de técnicos se guardan como `BYTEA` en PostgreSQL; migrar a S3 en
  producción.
- El asistente responde con Groq y cae a intenciones deterministas si se agota
  la cuota; el modo determinista no es un LLM.
- `send_whatsapp` en automatizaciones queda `skipped` hasta configurar WhatsApp.
- La suscripción se crea en modo `trialing` de 14 días, pero todavía no se cobra.
- Los cold starts de Vercel pueden agregar latencia a la primera request.
- Falta RLS, 2FA y recuperación de contraseña con email.
- El APK `mobile-apk-5` usa firma de debug; el AAB firmado con release existe
  como artifact, pero todavía no se subió a Play.
- Resend está implementado, pero sin dominio verificado el proveedor productivo
  no puede entregar. En producción se usa `console` y el enlace se copia a mano.
- `dev_token` está deshabilitado en producción; el login demo del portal sigue
  disponible solo para `servicios-demo`.
- Push requiere `eas projectId` y un development build; no se probó en
  dispositivo.
- El importador XLSX usa `openpyxl` y `defusedxml`, ya presentes en
  `apps/api/requirements.txt` (resuelto el 2026-11-11; ver "Verificación del bloque 2026-11-11").
- El webhook de WhatsApp está cerrado sin `WHATSAPP_APP_SECRET` (503). Eso es
  intencional, pero significa que WhatsApp no recibe eventos hasta configurar el
  secreto.
- El badge "Built with Spline" aparece en la landing mientras el plan sea Free.
- `revoke_refresh_token` (logout) no toma lock; solo la rotación lo hace.
- La ventana de gracia de refresh (10 s) acepta un token ya rotado dentro de ese
  plazo sin revocar la familia (ADR-019).
- El reset de demo solo lo ejecuta un platform admin. `demo@saasgestion.com` no es
  platform admin, así que no puede resetear la demo. No hay botón en la UI; el reset
  es solo por API.
- El importador solo crea clientes. No importa órdenes asociadas (pendiente del
  Hito 9).
- Los `import_jobs` guardan datos personales en `rows_json` y no tienen política de
  retención automática ni endpoint de borrado. Solo se eliminan con el reset de la demo.
- Las pruebas de dispositivo (Android físico) y la prueba E2E del bloque siguen
  pendientes.
