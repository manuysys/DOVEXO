# Changelog

## 2026-11-27 — Exportación CSV por tenant

- **API:** nuevos `GET /api/v1/exports/customers.csv`,
  `/exports/orders.csv`, `/exports/quotes.csv` y `/exports/payments.csv`.
- **Permisos:** `owner`, `admin` y `dispatcher` descargan; `viewer` y
  `technician` reciben 403. Cada consulta filtra por el tenant de la membresía
  validada, no por un `tenant_id` enviado por el cliente.
- **Formato:** CSV UTF-8 con BOM, cabeceras en español, fechas en
  `America/Argentina/Buenos_Aires` e importes con `Decimal` de 2 decimales. La
  neutralización de fórmulas (`=`, `+`, `-`, `@`, tab, CR, LF) se aplica solo a
  la salida; los datos persistidos no se modifican.
- **Transporte:** respuesta en streaming y cabecera `Content-Disposition` con el
  nombre del archivo (`clientes-2026-11-27.csv`); CORS la expone a la web.
- **Auditoría:** cada descarga registra `export_downloaded` en `audit_logs`.
- **Web:** ruta `/settings/export` con cuatro tarjetas (clientes, órdenes,
  presupuestos y pagos) y descarga directa.
- **Pruebas:** backend con **232 pytest** (permisos por rol, aislamiento por
  tenant, BOM, cabeceras, fechas, `Decimal`, neutralización solo en salida y
  auditoría) y ruff/format/basedpyright OK; frontend con **317 tests**, lint,
  typecheck y build OK.
- **Verificación en producción (2026-11-27):** los cuatro endpoints respondieron
  200 con `demo@saasgestion.com`, `Content-Disposition` correcto y BOM `EF BB BF`;
  `/settings/export` descargó `clientes-2026-11-27.csv` (573 bytes, 5 líneas) sin
  errores de consola. El 403 de `viewer`/`technician` y el aislamiento entre
  tenants están cubiertos solo por tests locales.
- **Pendiente:** los demás puntos de la auditoría externa del 2026-11-26 —legal
  con abogado, soporte con tiempos y backup real con restauración probada— no se
  tocaron en esta entrada.

## 2026-11-26 — Correcciones de la auditoría externa

- Se unificó el trial: `/terms` ya no promete “14 días”; ahora dice “acceso de
  evaluación”, igual que la landing. La fecha legal se actualizó al 2026-11-26.
- `brand.description` ya no dice “cobrá”; ahora “registrá pagos, controlá saldos
  pendientes y mantené cada cobro asociado a su orden”.
- Se agregó `docs/GO_TO_MARKET/AUDIT_RESPONSE_2026-11-26.md` con la verificación
  de los hallazgos (precios viejos y “Arreglo” no están en producción; legal,
  exportación CSV, soporte y backups quedaban pendientes en esa fecha) y el guion
  de grabación para el auditor.
- Deploy web de las dos correcciones de copy.

## 2026-11-24 — Precios de lanzamiento v2 y cupos separados de oficina/técnicos

- **Planes:** Starter $19.900 (1 usuario de oficina, 1 técnico, 100 órdenes
  nuevas/mes), Professional $39.900 (3, 5, 1.000) y Business $64.900 (5, 20,
  10.000). Reemplazan 29.900/59.900/99.900 con usuarios y técnicos igualados.
- **Cupos separados en el backend:** `max_users` cuenta solo usuarios de oficina
  (`owner`/`admin`/`dispatcher`/`viewer`) e incluye al dueño; `max_technicians`
  cuenta solo técnicos. Un técnico no consume cupo de oficina. Las invitaciones
  pendientes reservan cupo. `billing/detail` expone `users_count` y
  `technicians_count` por separado.
- **IA sin tokens públicos:** el asistente queda incluido en los tres planes, sin
  costo aparte. Se elimina la columna de tokens por plan de la landing y de la
  documentación comercial. Se mantiene el límite mensual global por empresa
  (`ai_monthly_token_limit`, 200.000 por defecto), igual para todos, medido
  internamente; al alcanzarlo responde 429 y se reanuda el mes siguiente.
  `/settings/billing` muestra el uso de usuarios de oficina, técnicos y órdenes,
  no el de IA.
- **Landing:** `apps/web/src/lib/brand.ts` con precios y cupos nuevos; la sección
  de precios y las FAQ explican “usuario de oficina” (incluye al dueño) y que los
  técnicos no ocupan ese cupo.
- **Dashboard:** el shell pasa a ancho completo (sin `max-w-7xl`) y la tarjeta de
  plan actual usa el precio de lista del plan; se eliminan las franjas laterales
  en pantallas anchas y el precio viejo en `/settings/billing`.
- **Nuevo documento comercial:** `docs/GO_TO_MARKET/PLANES_EXPLICADOS.md` con la
  tabla, el detalle de cada plan, la explicación de la IA, lo que no incluye,
  evaluación vs piloto, FAQ y mensajes cortos listos para enviar.
- **Documentación actualizada:** ADR-027 en `DECISIONS.md`;
  `PRICING_VALIDATION.md` §1-§2; referencia de precios en `PILOT_PROGRAM.md`;
  nota de precios vigentes en `DEMO_SCRIPT.md` (la tabla de evidencia del
  2026-11-14 se conserva); fila nueva en el mapa de `GO_TO_MARKET/README.md`;
  dimensiones de DOVEXO en `GO_TO_MARKET/COMPETITOR_BENCHMARK.md` §2 y respuesta
  de precio en `INTERVIEW_PREP_TOTALAIR_2026-11-24.md`.
- **Migración de planes:** `ad1d19f0512b`
  (`update_plan_pricing_and_demo_snapshot`) carga los valores nuevos en `plans`,
  quita `ai_monthly_tokens` de los límites, actualiza el snapshot de precio del
  tenant demo a Professional y tiene `downgrade` completo. **No consta aplicada
  en Neon**: producción sigue mostrando los precios anteriores en
  `/api/v1/plans` y `/settings/billing` hasta que se aplique.
- **Verificación (local):** backend ruff/format/basedpyright OK y **207 pytest**;
  frontend lint 0 errores (4 warnings preexistentes), typecheck OK, **284 tests**
  y build de **32 rutas**.
- **Deploy 2026-11-24:** web y API en producción. Landing con
  19.900/39.900/64.900; `/settings/billing` con 1/3/5 usuarios de oficina,
  1/5/20 técnicos y 100/1.000/10.000 órdenes; dashboard sin overflow a 1536 y
  1920 px. La base de Neon sigue con los precios viejos porque la migración
  `ad1d19f0512b` no se pudo aplicar (Vercel oculta el secreto de la base); el
  panel usa un override de display hasta aplicarla.

## 2026-11-23 — Landing v7: secciones por rol, sello y sistema compartido

- Se eliminan el eyebrow del hero, los tags, el microcopy y las etiquetas
  decorativas de las secciones; los datos funcionales suben a 12–15 px.
- Se corrige el recorte del hero (sin `overflow-hidden` en la sección) y del
  panel de producto (sticky de 680 px con paneles densos).
- Nuevo `ApprovalStamp` rectangular, integrado en el presupuesto; reemplaza el
  `FoilSeal` flotante en el hero, el panel de producto y el presupuesto público.
- El panel de agenda muestra dos turnos, la orden pendiente y una nota de
  conflicto; se elimina la nota “Misma orden…” y los rótulos “01/04”.
- Migración: carpeta de vidrio + vista previa de `clientes.xlsx`, resumen de
  válidas/errores y archivo flotante.
- Nuevas secciones: La oficina, El técnico, El cliente y Control/seguridad. La
  landing pasa de 6 a 10 secciones (~9.984 px) con paneles live, phone frame y
  roles/auditoría reales. Se quita el tope de 1600 px: el layout es full-bleed
  con gutters de 20–32 px; el hero y el pinned pasan a dos columnas desde
  1280 px para no recortar el panel en 1024/1124.
- Motion: `mk-scroll-reveal` con `animation-timeline: view()`; se mantienen el
  estado aprobado/tilt, el pinned con WebGL y el auto-drop. Reduced motion deja
  todo visible.
- Sistema compartido: paleta paper/ink/panel/señal y Bricolage/Epilogue/Plex en
  `--ds-*`, app-shell, dashboard, login, PageHeader, presupuesto público y
  tokens de Expo. El dashboard del tenant demo se verificó en navegador.
- Demo: botón “Reiniciar demo” en `/admin` para platform admins.
- APK v7 release local (debug-signed) compilado en `.local/apk/dovexo-v7-release.apk`
  (95.128.702 bytes, SHA-256 `BD87350B7482ABC9B8DBCDC0B81EE87340130D599783ECB8B860CAB5A036DEC3`).
  Se instaló en el teléfono (`com.dovexo.mobile`, versión 1.0.0); abrió el
  welcome y el deep link `dovexo://tech` mostró el login de técnico. MIUI
  bloquea la inyección de taps por ADB (`INJECT_EVENTS`) hasta habilitar
  “Depuración USB (Ajustes de seguridad)”.
- Figma no se pudo actualizar: el MCP Starter agotó el rate limit. El archivo
  existente sigue en v6. Documentado en `FIGMA_STORYBOARD.md`.
- Verificación: backend ruff/format/basedpyright OK y 203 pytest; frontend lint 0
  errores (4 warnings), typecheck OK, 281 tests, build 28 rutas; mobile tsc OK.
  Lighthouse móvil 99/100/100/100 y desktop 100/100/100/100; Axe 0 violaciones.
  Playwright sin overflow de 320 a 1920; hero, pinned, auto-drop, sello y
  dashboard con demo verificados. Se corrigieron los min-width de producto,
  agenda, precios y migración que recortaban el borde derecho en 320–1124.
  **No desplegado.**

## 2026-11-23 — Landing v6: full-bleed, motion, WebGL y Figma

- Layout full-bleed de 1600 px con gutters de 20–32 px en todas las secciones;
  se corrige el espacio lateral y el panel del hero entra completo desde 1024.
- `TextReveal` por palabras con IntersectionObserver propio, hero con líneas y
  stagger; sin títulos ocultos si el observer no dispara.
- Hero: `QuoteDemo` se auto-aprueba una vez a los 2.6 s, muestra el sello y
  sigue clickeable; tilt de puntero de hasta 4°. El sello se oculta en
  mobile/tablet.
- Producto pinned: cuatro pasos con paneles live, sticky de 620 px y una escena
  Three.js propia (terreno de líneas + cuatro nodos), lazy, un solo contexto,
  pausa fuera de viewport y reduced motion. Se retiran marquesina y progress
  line.
- Migración: `glass-folder-cards` con auto-drop de un archivo al entrar en
  viewport, además de hover/click.
- Figma: archivo `DOVEXO Landing v6 — Storyboard` con variables, text styles,
  componente `Quote Panel`, frames de hero/pinned/mobile y notas de motion.
  https://www.figma.com/design/DcjgOeLHZ980LjHFuPtz55
- Originkit sigue bloqueado por el límite diario; no hay archivos en el repo.
- Verificado: `pnpm lint` 0 errores (5 warnings), `pnpm typecheck` OK,
  `pnpm test` 281/281, `pnpm build` 28 rutas. Lighthouse móvil y desktop
  100/100/100/100 (LCP 1.2 s / 0.3 s; TBT 60/0 ms; CLS 0). Axe 4.14: 0
  violaciones WCAG 2.2 AA. Playwright: auto-aprobación, sello, sticky y
  auto-drop verificados; sin overflow de 360 a 1440.

## 2026-11-23 — Landing v5: Anubi + Better Stack, UI live y glass folder

- Remake visual completo sobre las referencias reales **anubi.io** y
  **betterstack.com**: Bricolage Grotesque para cuerpo, Epilogue para
  titulares e IBM Plex Mono para etiquetas; off-white `#F7F7F5`, negro
  `#0F0F0F`, paneles `#0B0C14` y naranja de señal `#E4572E`. Boska deja de
  cargarse en la landing.
- Hero nuevo con titular Epilogue grande, tags de módulos y un objeto real:
  `QuoteDemo`, un presupuesto en HTML que se aprueba en el lugar y muestra el
  sello. Sin captura de dashboard, sin halo y sin teléfono flotante.
- `ProductStory`: cuatro secciones con UI live construida desde `demoOperation`
  (solicitud, agenda, presupuesto y cobros), paneles oscuros sobre página clara.
  Se van `OrderRail`, `ProductTour`, `OperationalTicker` y los `OT/QT` repetidos.
- Migración con `glass-folder-cards`, un componente local con carpeta de vidrio,
  arte generado en canvas y archivos de ejemplo. Se monta con lazy loading para
  no gastar main thread antes del LCP.
- Precios, FAQ y CTA se conservan retematizados; el footer y la cabecera usan la
  nueva tipografía y el logo negro.
- Originkit: se pidieron 12 componentes, pero el CLI consumió las 3 descargas
  diarias en un lote sin escribir archivos y el endpoint devuelve 429. Estado y
  comandos en `docs/ORIGINKIT_INTEGRATION.md`.
- Verificado: `pnpm lint` 0 errores (5 warnings, 2 del `<img>` del componente de
  carpetas), `pnpm typecheck` OK, `pnpm test` 281/281, `pnpm build` 28 rutas.
  Lighthouse móvil y desktop 100/100/100/100 (LCP 1.2 s / 0.3 s; TBT 60/0 ms;
  CLS 0). Axe 4.14: 0 violaciones WCAG 2.2 AA en 1440 y 390. Playwright:
  aprobación del presupuesto y apertura de la carpeta OK, sin overflow de 360 a
  1440 y sin errores de consola.

## 2026-11-22 — Landing v4.1: motion real

- Se reincorpora **Motion (Framer Motion)** después de que la v4 quedara
  demasiado estática: crossfade + escala del rail, hover/tap de estaciones, pill
  de tabs con `layoutId`, entrada de migración y conteo de filas.
- Hero: titular que entra por líneas (`mk-line`), eyebrow/descripción/CTAs con
  `mk-rise` escalonado, halo iridiscente que respira (9 s), sello con entrada
  física y teléfono flotante. El texto sigue sin depender de JS.
- Nueva tira operativa (`operational-ticker.tsx`) con marquesina de 28 s,
  pausa al hover y datos de la misma orden; guiño a la franja de Anubi y al
  ritmo de MotionSites.
- Rail con progreso atado al scroll y crossfade de imágenes; tabs con pill
  animada; migración con conteo de filas y stagger de pasos.
- `prefers-reduced-motion` verificado: CSS apaga halo/sello/teléfono/ticker y
  Motion apaga crossfade, hover, pill y conteo.
- Verificado: `pnpm lint` 0 errores (2 warnings preexistentes), `pnpm typecheck`
  OK, `pnpm test` 281/281, `pnpm build` 28 rutas. Lighthouse desktop
  99/100/100/100 (LCP 0.9 s) y mobile 83/100/100/100 (LCP sintético 4.8 s sobre
  el panel del hero; LCP observado 318 ms; CLS 0). Axe 4.14: 0 violaciones WCAG
  2.2 AA en 1440 y 390. Detalle en ADR-023.

## 2026-11-22 — Landing v4: “El expediente vivo”

- Dirección de arte nueva sobre la base de ADR-021: **Boska** (Fontshare, ITF
  Free Font License) self-hosted para titulares, Archivo para cuerpo/UI y Geist
  Mono para IDs. `--font-mk-display` queda acotada a marketing.
- Hero nuevo (`hero-dossier.tsx`): panel real del tenant demo recortado a la
  zona visible (35 KB), tarjeta de presupuesto aprobada, sello de hojalata
  (`foil-seal.tsx`) y teléfono del técnico. `100svh`, sin chrome falso ni
  caption; el producto asoma en mobile.
- `OrderRail` se reescribe como historia sticky/scroll-linked de cuatro
  estaciones con roles; en la primera pasada, sin Motion. El activo se calcula
  con scroll + `requestAnimationFrame`; en mobile el visual queda sticky. La
  v4.1 agrega crossfade y progreso con Motion.
- `ProductTour` absorbe la lista de módulos, elimina el chrome de browser y
  recaptura las pantallas sin scrollbar (`*-v4.webp`). En mobile las tabs pasan a
  una grilla de 2 filas y la lista de módulos se oculta.
- Nueva sección de migración “De la planilla a DOVEXO” con importador,
  onboarding y primera orden.
- Truth pass: se quita la cuota de tokens de IA por plan (el backend aplica un
  límite global), “prueba de 14 días” pasa a “acceso de evaluación”, se corrige
  la respuesta de privacidad y se oculta la tabla de precios en mobile.
- La primera pasada retiró Motion/GSAP/Lenis/Three.js del bundle de la landing
  para priorizar el LCP; la v4.1 reincorpora Motion de forma selectiva (ADR-023).
- Cabecera: CTA visible desde `sm` y `aria-expanded` en el botón de menú.
  Tabs con foco visible; el sello ya no tapa el folio del panel.
- Verificado: `pnpm lint` 0 errores (2 warnings preexistentes), `pnpm typecheck`
  OK, `pnpm test` 281/281, `pnpm build` 28 rutas. Lighthouse móvil y desktop
  100/100/100/100 (LCP 1.2 s / 0.3 s). Axe 4.14: 0 violaciones WCAG 2.2 AA en
  1440 y 390. Playwright: sin overflow de 360 a 1920 y gutters alineados.
- Pendiente: deploy a Vercel, QA visual en producción y recaptura del tour
  cuando cambie la UI del panel.

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
