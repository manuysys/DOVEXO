# Decisiones técnicas (ADR)

Registro breve de decisiones. Cada entrada indica contexto, decisión y
consecuencias. Si una decisión se reemplaza, marcar la anterior como obsoleta.

## ADR-001 — Monorepo con `apps/web` y `apps/api`

**Fecha:** 2026-11-07
**Estado:** aceptada

**Contexto:** frontend y backend evolucionan juntos y comparten contrato OpenAPI.

**Decisión:** un solo repositorio con `apps/web` (Next.js) y `apps/api`
(FastAPI), más `docs/`, `scripts/`, `infra/` y `.opencode/`.

**Consecuencias:** despliegues independientes, versionado coordinado, un solo
lugar para documentación y agentes.

## ADR-002 — Next.js + FastAPI + PostgreSQL

**Fecha:** 2026-11-07
**Estado:** aceptada

**Contexto:** el fundador domina Python, FastAPI, Next.js y React; el producto
necesita API robusta, tipado y ecosistema maduro.

**Decisión:** Next.js (App Router, TypeScript estricto, Tailwind) para web;
FastAPI + Pydantic + SQLAlchemy + Alembic para API; PostgreSQL como base
relacional.

**Consecuencias:** dos runtimes, contrato OpenAPI como fuente de verdad,
generación de cliente TypeScript.

## ADR-003 — Autenticación self-hosted

**Fecha:** 2026-11-07
**Estado:** aceptada

**Contexto:** se evaluó Supabase Auth. El fundador priorizó control y evitar
dependencia de un proveedor.

**Decisión:** autenticación propia en FastAPI: Argon2id para contraseñas, JWT de
acceso de corta duración, refresh token rotativo, cookies `HttpOnly`, rate
limiting y auditoría.

**Consecuencias:** más trabajo inicial y responsabilidad de seguridad, pero
control total y posibilidad de migrar a un proveedor externo mediante un
adaptador.

## ADR-004 — PostgreSQL portable para desarrollo local

**Fecha:** 2026-11-07
**Estado:** aceptada

**Contexto:** Docker Desktop está instalado pero sin WSL/Hyper-V operativo. El
contexto exige no depender de Docker.

**Decisión:** usar binarios portables de PostgreSQL 17.11 en `.local/postgres`,
con `initdb` en `.local/pgdata`, puerto 55432 y scripts de inicio/parada.

**Consecuencias:** entorno reproducible sin admin ni Docker; en producción se
usará un PostgreSQL administrado o contenedor, con la misma versión mayor.

## ADR-005 — Dinero con `Decimal` y `NUMERIC`

**Fecha:** 2026-11-07
**Estado:** aceptada

**Decisión:** todos los importes se representan con `Decimal` en Python y
`NUMERIC(14,2)` en PostgreSQL. Nunca `float`.

**Consecuencias:** cálculos exactos; el frontend formatea con
`Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })`.

## ADR-006 — Multi-tenancy por `tenant_id` + validación en backend

**Fecha:** 2026-11-07
**Estado:** aceptada

**Decisión:** cada entidad de negocio tiene `tenant_id`; todos los repositorios y
endpoints lo aplican desde la sesión autenticada. Se evaluará RLS como defensa
en profundidad.

**Consecuencias:** pruebas de aislamiento obligatorias; nunca confiar en el
`tenant_id` enviado por el cliente.

## ADR-007 — OpenCode con subagentes especializados

**Fecha:** 2026-11-07
**Estado:** aceptada

**Decisión:** usar agentes `backend`, `frontend`, `database`, `security`, `qa`,
`research`, `docs`, `reviewer` y `devops`, con permisos acotados por carpeta y
modelos según la tarea.

**Consecuencias:** trabajo paralelo con archivos disjuntos; revisión cruzada;
mayor consumo de tokens, controlado por modelos económicos en tareas mecánicas.

## ADR-008 — Presupuestos con ítems históricos y aprobación pública

**Fecha:** 2026-11-08
**Estado:** aceptada

**Contexto:** el presupuesto debe conservar precios y conceptos aunque cambie
el catálogo, y el cliente debe poder aprobarlo sin crear una cuenta.

**Decisión:**

- `quotes` guarda totales calculados con `Decimal`/`Numeric(14,2)`.
- `quote_items` guarda una copia histórica de descripción, cantidad, precio,
  descuento, impuesto y total de línea.
- El número es `QT-YYYY-0001`, único por tenant.
- Cada presupuesto tiene un `public_token` URL-safe aleatorio.
- Los endpoints públicos `/api/v1/public/quotes/{token}` no requieren auth y
  solo exponen los datos del presupuesto, sin IDs internos.
- Estados: `draft → sent → approved/rejected`; no se aprueba un borrador.
- Al enviar/aprobar/rechazar se actualiza `work_orders.commercial_status`.
- El PDF se genera con `reportlab` y se sirve autenticado.

**Consecuencias:** el enlace público es un bearer secreto; no debe compartirse
públicamente. El PDF no reemplaza la aprobación registrada en el sistema.

## ADR-009 — Automatizaciones in-process con eventos de dominio

**Fecha:** 2026-11-08
**Estado:** aceptada

**Contexto:** el MVP necesita reaccionar a eventos de negocio sin introducir
Kafka, Redis ni un worker separado.

**Decisión:** emitir eventos dentro de la transacción del servicio de negocio y
ejecutar reglas activas en un savepoint. Cada ejecución tiene
`idempotency_key = rule_id:event_id`, estado y error. Las acciones iniciales son
`notify` y `notify_user`; `send_whatsapp` queda `skipped` hasta configurar la
integración. No hay outbox ni reintentos programados todavía.

**Consecuencias:** simple y transaccional; si el proceso se cae, no hay
reintento automático. Para producción con volumen se evaluará outbox + worker.

## ADR-010 — IA desacoplada con proveedor determinista por defecto

**Fecha:** 2026-11-08
**Estado:** aceptada

**Contexto:** no hay API key de un proveedor externo y el producto no debe
depender de un vendedor.

**Decisión:** interfaz `AIProvider` con tres implementaciones:
`DeterministicProvider` (local, sin red, responde intenciones frecuentes con
datos reales), `OpenAICompatibleProvider` y `OllamaProvider`. El proveedor se
elige con `AI_PROVIDER`. Se registran tokens y costo estimado por tenant. La IA
no ejecuta acciones ni recibe SQL libre; solo recibe un snapshot del negocio.

**Consecuencias:** la demo funciona sin claves y sin simular un LLM. Las
respuestas deterministas son limitadas y se informa claramente el modo.

## ADR-011 — Suscripciones con precio histórico y panel global

**Fecha:** 2026-11-08
**Estado:** aceptada

**Decisión:** `plans` guarda el precio de lista; `subscriptions` guarda
`price_snapshot` para no alterar contratos existentes. El registro crea una
suscripción `trialing` al plan Starter si existe. El panel global requiere
`is_platform_admin` o un email en `PLATFORM_ADMIN_EMAILS` y muestra métricas
agregadas, no datos de clientes.

**Consecuencias:** el enforcement de límites es parcial; los cobros reales con
Mercado Pago quedan para una etapa posterior.

## ADR-012 — WhatsApp Cloud API oficial con secretos cifrados

**Fecha:** 2026-11-08
**Estado:** aceptada. La verificación del webhook (secreto y comportamiento sin
secreto) queda reemplazada por ADR-019 (2026-11-18). El resto de la decisión sigue vigente.

**Decisión:** usar la API oficial de WhatsApp Business. Los tokens y secretos
por tenant se cifran con Fernet usando `WHATSAPP_ENCRYPTION_KEY`. El webhook
valida `X-Hub-Signature-256` con HMAC SHA-256 y es idempotente por
`wa_message_id`. No se automatiza WhatsApp Web ni se simulan envíos.

**Consecuencias:** sin credenciales de Meta no se puede probar end-to-end. La
plataforma sigue funcionando si WhatsApp no está configurado.

## ADR-013 — Rate limiting en memoria para una instancia

**Fecha:** 2026-11-08
**Estado:** aceptada

**Decisión:** limitar login, registro, refresh y enlaces públicos con una
ventana deslizante en memoria. Se configura por variables de entorno y se
desactiva en pruebas.

**Consecuencias:** suficiente para desarrollo y una sola instancia. En
producción con varias instancias hace falta Redis/Upstash o el rate limiting del
proveedor.

## ADR-014 — Frontend y API en Vercel, PostgreSQL en Neon

**Fecha:** 2026-11-08
**Estado:** aceptada

**Contexto:** la demo dependía de una máquina local y un túnel rápido de
Cloudflare, sin uptime ni URL estable.

**Decisión:** desplegar el frontend Next.js y la API FastAPI como proyectos
separados de Vercel. La API usa el preset FastAPI zero-config, `app/main.py`
como entrypoint, Python 3.12 y `requirements.txt`. PostgreSQL se provisiona con
el marketplace de Neon (plan Free, región `gru1`) y las migraciones se ejecutan
con la conexión directa. En producción la API usa `NullPool` y asyncpg con
`ssl=require`.

**Consecuencias:** la demo queda disponible sin depender de una PC. Los planes
gratuitos tienen límites, cold starts y una ventana de restauración acotada. Para
producción se necesita un plan pago, dominio propio, backups verificados y rate
limiting compartido.

## ADR-015 — Marca provisional Arreglo

**Fecha:** 2026-11-09
**Estado:** obsoleta en el nombre de producto (reemplazada por ADR-016). La paleta y la tipografía siguen vigentes.

**Contexto:** el producto necesita una marca para la landing y la comunicación,
pero no hay nombre definitivo ni logo.

**Decisión:** usar **Arreglo** como marca provisional. `arreglo.com.ar` aparece
disponible en RDAP (pendiente de confirmar en NIC.ar). Paleta ink/teal/amber/
paper, tipografía Space Grotesk + Geist y un monograma simple. La identidad
definitiva queda sujeta a búsqueda de marca y registro de dominio.

**Consecuencias:** la landing y la documentación usan Arreglo; el nombre se
puede cambiar centralizándolo en `apps/web/src/lib/brand.ts` y en la
documentación. No invertir en piezas definitivas hasta validar marca/dominio.

## ADR-016 — ARVOKTA empresa, DOVEXO producto

**Fecha:** 2026-11-10
**Estado:** aceptada para el nombre de producto. Dominio pendiente. Reemplaza el nombre de ADR-015.

**Contexto:** ARREGLO fue una marca provisional sin registro de marca ni dominio confirmado. El proyecto necesita separar la empresa titular del producto comercial, para contratos, Play Console, emails y UI. `PROXIMOS_PASOS.txt` pide centralizar el nombre y no hacer reemplazos masivos que rompan rutas o identificadores.

**Decisión:**

- **ARVOKTA** es la empresa (titular legal y cuenta de desarrollador).
- **DOVEXO** es el nombre comercial del producto para UI, emails, PDF, landing, documentación y app móvil.
- El dominio de DOVEXO está **pendiente**. No se usa un dominio en `EMAIL_FROM` productivo hasta verificarlo en Resend.
- Android: `applicationId` `com.dovexo.mobile`, scheme `dovexo`, slug `dovexo`. El cambio debe hacerse antes de generar la keystore de release y de la primera subida a Play, porque el `applicationId` no se puede cambiar después.
- **No se renombran** rutas (`/api/v1/...`, `/q/[token]`, `/tech`, `/portal/...`), tablas, migraciones, slug del tenant demo `servicios-demo`, nombres de proyectos Vercel y repositorio, paquete Python ni variables de entorno.
- ARREGLO queda como nombre histórico. `apps/web/src/lib/brand.ts` y
  `apps/mobile/app.json` ya usan DOVEXO/ARVOKTA y `com.dovexo.mobile`. La
  keystore de release fue generada después del cambio.

**Consecuencias:**

- Los identificadores internos quedan con nombres antiguos (`arreglo`, `saas-gestion`). Es deuda visible y aceptada, no un error.
- Hay una contradicción documental: `PROXIMOS_PASOS.txt`, sección 2, dice que DOVEXO "no está aprobado". Este ADR lo registra como aprobado para el nombre de producto a partir de la decisión del 2026-11-10. Quien emitió el documento fuente debe actualizarlo. Hasta entonces, no usar DOVEXO en documentos legales ni en la ficha de Play.
- Búsqueda de marca y registro del dominio siguen pendientes. Riesgo: DOVEXO puede tener conflictos de marca no verificados.
- Antes de la primera subida a Play no se puede cambiar el `applicationId` sin crear una app nueva.

## ADR-017 — Importador CSV/XLSX con vista previa y commit; neutralización solo en la salida

**Fecha:** 2026-11-11
**Estado:** aceptada

**Contexto:** los pilotos necesitan cargar su cartera de clientes sin intervención
técnica. El archivo es un dato no confiable: puede traer fórmulas para Excel,
XLSX comprimido de forma abusiva o filas que dupliquen clientes existentes.

**Decisión:**

- Flujo en dos pasos. `preview` valida, detecta duplicados y persiste un
  `import_jobs` con estado `preview`. `commit` recibe solo el `job_id`, toma el
  lock de la fila del tenant, crea únicamente filas válidas y no duplicadas, y
  marca el job como `applied`.
- Idempotencia: un job `applied` devuelve el mismo `commit_result` sin crear
  clientes nuevos.
- Límites: 2 MB y 500 filas. XLSX con máximo 1000 entradas comprimidas, 20 MB
  descomprimidos y ratio de compresión 100. Se valida la firma del archivo antes
  de parsear.
- XLSX con `openpyxl` (modo solo lectura) y `defusedxml`. CSV con la biblioteca
  estándar.
- Neutralización de fórmulas (prefijo `'`) **solo al generar `errors.csv`**. Los
  valores persistidos y el preview JSON no se modifican, para no alterar el dato
  original.
- Roles: `owner`, `admin` y `dispatcher`.

**Consecuencias:**

- El dato guardado queda exacto (por ejemplo, un teléfono `+54 11...` se conserva).
  Dentro de `errors.csv`, un campo que empieza con `+` o `-` aparece con `'` al
  principio, por diseño.
- `import_jobs` guarda datos personales en `rows_json` hasta el reset de demo. No
  hay política de retención todavía; queda registrado en `KNOWN_ISSUES.md`.
- El commit se hace en una sola transacción: si falla a mitad, no queda ningún
  cliente creado a medias.
- `openpyxl` y `defusedxml` deben estar en `requirements.txt` para el deploy en
  Vercel. Resuelto el 2026-11-11: ambas están en `apps/api/requirements.txt` y
  el preview XLSX respondió 200 en producción.
- No se importan órdenes. Queda para una iteración posterior.

## ADR-018 — Héroe 3D con Spline publicado y fallback estático

**Fecha:** 2026-11-18
**Estado:** obsoleta para el héroe desde el 2026-11-19: el badge del plan Free y el
dentado del render llevaron a reemplazarla por la escena isométrica propia
(ADR-020). Se conserva como registro; el código y el poster de Spline quedan en
el repo para una eventual vuelta con plan Hobby.

**Contexto:** la fase 1 del rediseño de la landing dejó Spline sin decidir: la
escena existía en el editor, no estaba publicada y no había medición de peso ni
de LCP. El héroe necesitaba un recurso 3D sin penalizar mobile ni el primer render.

**Decisión:**

- Escena publicada en Spline:
  - Viewer: `https://my.spline.design/dovexoheroservice-Vy1dJ8IKuodt02Zjwk4P0sbI/`
  - Runtime: `https://prod.spline.design/4zymsRJr14mnwaEJ/scene.splinecode`
- Integración con `@splinetool/react-spline` ^4.2.0 en
  `apps/web/src/components/marketing/spline-hero.tsx`, con carga dinámica.
- Solo en desktop (`min-width: 1024px`). En mobile y mientras carga se muestra el
  poster estático `apps/web/public/spline-hero-2x.webp` (1126x938).
- El canvas se renderiza al 200% del contenedor y se escala al 50%
  (`transform: scale(0.5)`, `transformOrigin: top left`) para duplicar la
  resolución efectiva y reducir el dentado del render 3D.

**Consecuencias:**

- **Badge "Built with Spline" visible** por la licencia del plan Free. No se oculta.
  El plan Hobby lo quita: $15/mes con facturación mensual o $12/mes con anual
  (precios informados como oficiales el 2026-11-18). La contratación queda a
  decisión del fundador.
- **Dependencia de terceros:** el runtime se sirve desde `prod.spline.design`. No se
  documentó ni probó el comportamiento si el servicio cae; queda pendiente.
- **Sin medición registrada:** no hay medición de peso ni de LCP en el repositorio
  al cierre de esta decisión. La condición "medir antes de integrar" de
  `LANDING_REDESIGN.md` §8 queda abierta.
- **`prefers-reduced-motion`:** la escena **sí** se condiciona. `spline-hero.tsx` usa
  `(min-width: 1024px) and (prefers-reduced-motion: no-preference)`; con reduced
  motion se muestra solo el poster estático. (El reporte inicial de esta sesión
  decía lo contrario por un error de lectura; corregido el 2026-11-18.)
- Las decisiones anteriores de Spline (no integrar, no publicar) quedan obsoletas.

## ADR-019 — Confianza de proxy explícita y webhook de WhatsApp fail-closed

**Fecha:** 2026-11-18
**Estado:** aceptada. Reemplaza el comportamiento de confianza en `X-Real-IP` y
`X-Forwarded-For` descrito en el changelog del 2026-11-11, y reemplaza parcialmente
la verificación del webhook de ADR-012.

**Contexto:** la auditoría de backend del 2026-11-18 encontró (entre otros) IP
falseable por cabeceras sin proxy confiable, comparación de `Origin` por prefijo,
webhook de WhatsApp sin secreto global y sin tope de tamaño. Detalle en
`SECURITY_AUDIT.md` §8.

**Decisión:**

- `apps/api/app/core/client_ip.py`: `X-Real-IP` y `X-Forwarded-For` se leen solo si
  `TRUST_PROXY_HEADERS=true`. Valor por defecto: `false`. En el entorno Production de
  Vercel de la API se configuró `true`.
- `Origin` se compara de forma exacta por esquema, host y puerto (`urlparse`).
- Webhook de WhatsApp:
  - `WHATSAPP_APP_SECRET` global es obligatorio. Sin él, el POST responde 503.
  - `GET` con `WHATSAPP_VERIFY_TOKEN` vacío responde 503.
  - El HMAC se calcula sobre los bytes crudos antes de parsear; el cuerpo tiene tope de
    1 MB.
  - La verificación por tenant (`app_secret` por tenant) se mantiene como defensa en
    profundidad.
- Refresh de sesión: `SELECT ... FOR UPDATE` en la rotación y ventana de gracia
  `REFRESH_REUSE_GRACE_SECONDS=10` para rotaciones concurrentes legítimas. Un
  reuso fuera de la ventana revoca la familia completa, como antes.

**Consecuencias:**

- Si `TRUST_PROXY_HEADERS=true` y no hay un proxy de confianza delante de la API,
  cualquier cliente puede falsear su IP. Si queda en `false` detrás de Vercel, el rate
  limit por IP se aplica sobre la IP del proxy. Ambas configuraciones tienen un
  riesgo; por eso la variable es explícita.
- **El webhook de WhatsApp responde 503 en producción** hasta configurar
  `WHATSAPP_APP_SECRET` en Vercel. Es intencional (fail-closed) y no indica un fallo
  de deploy.
- **Secreto global:** un solo `WHATSAPP_APP_SECRET` sirve para todos los tenants.
  Si se compromete, afecta a todos. Riesgo residual abierto: no hay decisión
  registrada para pasar a un secreto por tenant verificado.
- **Ventana de gracia de 10 s:** una rotación concurrente legítima no cierra la
  sesión. Un token rotado y reusado dentro de esa ventana tampoco dispara la
  revocación. Faltan tests de reuso fuera de la ventana.
- `revoke_refresh_token` (logout) todavía no toma lock. Pendiente.

## ADR-020 — Héroe isométrico propio sin watermark de terceros

**Fecha:** 2026-11-19
**Estado:** aceptada. Reemplaza ADR-018 para el héroe de la landing.

**Contexto:** la escena de Spline se publicó e integró el 2026-11-18, pero en la
revisión visual el render se vio dentado y el badge "Built with Spline" del plan
Free quedó grande. Cubrir el badge con un elemento de la UI equivale a quitar el
watermark y no es una opción válida. El repo ya tenía una escena isométrica
propia (`hero-canvas.tsx` con Three.js y `hero-fallback.tsx` en SVG) con la
paleta del design system.

**Decisión:**

- El héroe usa `HeroScene` (`hero-scene.tsx`): Three.js en desktop, después de
  idle y sin reduced motion; `HeroFallback` (SVG) en mobile, con reduced motion
  o mientras carga.
- Se quita Spline del héroe. `spline-hero.tsx`, `@splinetool/react-spline` y el
  poster `spline-hero-2x.webp` quedan en el repo sin uso, para poder volver si se
  contrata Hobby.
- Los chips de producto y el gradiente se mantienen.

**Consecuencias:**

- Sin watermark, sin dependencia de `prod.spline.design` y sin el costo de Spline.
- La escena es más abstracta que el diorama literal de Spline (oficina, van,
  casa); no hay interacción 3D con la escena.
- Si se contrata Spline Hobby, revertir es un cambio acotado: volver a
  `SplineHero` en `hero-visual.tsx` y restaurar el poster.

## ADR-021 — Identidad de marketing “Oficio en orden”

**Fecha:** 2026-11-20
**Estado:** aceptada

**Contexto:** la landing mezclaba tres épocas (héroe 3D oscuro, secciones claras,
panel azul), seis acentos y una cabecera translúcida con un borde visible al
scrollear. El público son técnicos, instaladores y empresas chicas de servicios
argentinas, no equipos de producto.

**Decisión:**

- Papel obra `#F3F0E6`, tinta verde `#123B31` y una sola señal naranja `#D9541E`.
  El naranja nunca es fondo de botón: marca folios, reglas, focos y sellos.
- **Archivo** (Omnibus-Type, Buenos Aires) como única familia de la landing, con
  eje de ancho para etiquetas. `.mk-root` acota el cambio de cuerpo y color; la
  familia display pasa a Archivo también en el panel y se deja de cargar Space
  Grotesk.
- Héroe claro con captura real del producto (dashboard del tenant demo) al 175 %
  y dos llamadas numeradas. Sin 3D, gradientes ni animación de entrada.
- Se retiran de la landing `SmoothScroll` (Lenis), `Journey` (GSAP),
  `FeaturesBento` y `TrustStrip`. La narrativa pasa a `OrderRail` (la misma OT en
  solicitud, turno, presupuesto y cobro) y `ModuleIndex` (índice de módulos).
- Cabecera de papel opaca, sin `border-b` ni `backdrop-blur`.

**Consecuencias:**

- Menos JS en la landing: el LCP es texto más una imagen `priority`.
- La app conserva colores, radios y componentes; solo cambia la familia display,
  que pasa a Archivo y deja de cargar Space Grotesk. La migración de tokens de
  color del panel queda para la fase 2.
- `journey.tsx`, `features-bento.tsx`, `trust-strip.tsx`, `hero-scene.tsx`,
  `hero-canvas.tsx` y `spline-hero.tsx` quedan sin uso. No se borran para no
  perder el trabajo; se pueden eliminar cuando la dirección valide en producción.
- El naranja sobre papel no llega a 4.5:1. Se usa en textos ≥24 px/700, iconos,
  reglas y focos; para texto pequeño va `#A63C10`.
- La prueba de 14 días se comunica como activa al registrarse. Si el flujo de
  trial cambia, hay que corregir héroe, precios y FAQ a la vez.

## ADR-022 — Landing v4 “El expediente vivo”

**Fecha:** 2026-11-22
**Estado:** parcialmente reemplazada por ADR-024 en la landing (tipografía, paleta y composición). Se conserva como historial. El punto de motion se amplía en ADR-023 (2026-11-22).

**Contexto:** la landing v3 era clara y honesta, pero el producto se mostraba como una captura plana, el recorrido era estático y la tipografía no diferenciaba la marca. Las referencias de Originkit, Supahero/Anubi, MotionSites y Fontshare pedían una pieza con más oficio, no más decoración.

**Decisión:**

- **Boska** (Fontshare, ITF Free Font License) para titulares editoriales; Archivo se mantiene para cuerpo, UI y etiquetas; Geist Mono para IDs e importes. Boska se self-hostea en `apps/web/src/app/fonts/` y se documenta su licencia.
- **Sello de hojalata:** un sello circular iridiscente (cobre/ámbar/verde, sin violeta) en CSS, con una sola pasada de brillo y fallback estático con `prefers-reduced-motion`. Se usa en el hero, no en cada sección.
- **Hero como expediente:** panel real del tenant demo, tarjeta de presupuesto aprobada, sello y teléfono del técnico. La captura del hero se recorta a lo visible y se sirve en 35 KB; el texto no espera JS.
- **Una sola orden:** `OrderRail` pasa a ser una historia sticky/scroll-linked con cuatro estaciones y roles (oficina, técnico, cliente). La base es CSS y un handler de scroll con `requestAnimationFrame`; el detalle de motion se define en ADR-023.
- **Menos repetición:** se retira `ModuleIndex` de la página; el tour absorbe la lista compacta de módulos y se elimina el chrome falso de browser.
- **Migración:** nueva sección “De la planilla a DOVEXO” con importador CSV/XLSX, onboarding y primera orden.
- **Truth pass:** se reemplaza “prueba de 14 días” por “acceso de evaluación” hasta que el trial tenga vencimiento real; los límites que se muestran son los que el backend valida.
- **Motion:** la primera versión priorizó el LCP y quedó demasiado estática; el detalle de motion real se define en ADR-023. Sin GSAP, Lenis ni Three.js en el bundle de la landing.

**Consecuencias:**

- Lighthouse móvil y desktop en la v4 sin motion: 100/100/100/100; LCP 1.2 s móvil y 0.3 s desktop. Axe: 0 violaciones WCAG 2.2 AA en 1440 y 390. Con motion, ver ADR-023.
- La página sigue siendo editorial, pero ahora tiene un objeto visual propio y una narrativa de producto.
- Boska es una fuente closed source con licencia comercial gratuita; no se modifica ni se redistribuye fuera de la app. Si se cambia de fuente, actualizar `layout.tsx`, `globals.css` y este ADR.
- El dashboard conserva sus tokens `ds-*`; la landing usa `mk-*`. No se unificaron en esta iteración para no ampliar el alcance.
- Las capturas del tour son del tenant demo y deben recapturarse cuando cambie la UI del panel.

## ADR-023 — Motion real en la landing (v4.1)

**Fecha:** 2026-11-22
**Estado:** reemplazada por ADR-024 en la landing. Se conserva como historial.

**Contexto:** la v4 quedó correcta en dirección visual, pero demasiado quieta. De las referencias se había tomado sobre todo la paleta y la materialidad, no los momentos de movimiento. El usuario pidió explícitamente animaciones con Framer Motion, GSAP o anime.js y que las referencias se usaran de verdad.

**Decisión:**

- **Hero con Motion mínimo:** entrada por líneas (`mk-line`), `mk-rise`
  escalonado, halo iridiscente, sello y teléfono flotante. El dossier queda
  fuera de Motion y usa una imagen directa para no demorar el LCP.
- **Motion (Framer Motion)** para los momentos que necesitan estado o scroll:
  - `OrderRail`: crossfade + escala de la imagen activa, hover/tap de las estaciones y línea de progreso con `useScroll`.
  - `ProductTour`: pill activa con `layoutId` y hover del visual.
  - `Migration`: entrada de la tarjeta, stagger de pasos y conteo animado de filas.
- **CSS** para el resto, sin sumar otra librería:
  - `mk-line`: entrada de las dos líneas del titular, con `overflow-hidden` y `translateY`.
  - `mk-rise`: entrada escalonada de eyebrow, descripción, CTAs y dossier; la lista de proof queda estática para no bajar el contraste durante la animación.
  - `mk-seal-in`, `mk-float-phone`: sello y teléfono; el teléfono flota 7 s.
  - `mk-halo`: halo iridiscente que respira (9 s) inspirado en Originkit.
  - `mk-marquee-track`: tira operativa de 28 s inspirada en la franja de Anubi/MotionSites; se pausa al hover.
- **Extracciones explícitas:** Originkit aporta la materialidad iridiscente y el halo; Anubi, la escala tipográfica, la entrada por líneas y el objeto flotante; MotionSites, la tira horizontal y el ritmo del recorrido; Fontshare, Boska.
- **Una sola librería de motion:** no se agregan GSAP ni anime.js para evitar duplicar sistema y peso. GSAP queda disponible para otras piezas de la app, pero la landing no lo necesita.
- **Reduced motion:** se respeta en CSS y con `useReducedMotion`; el contenido queda visible sin animación.

**Consecuencias:**

- Lighthouse: desktop 99/100/100/100 (LCP 0.9 s); mobile 83/100/100/100
  (LCP sintético 4.8 s sobre el panel del hero, LCP observado 318 ms); CLS 0 en
  ambos. El costo es el panel visible como LCP; el texto sigue en 1.2 s.
- Axe 4.14: 0 violaciones WCAG 2.2 AA en 1440 y 390.
- La landing vuelve a tener un momento de entrada, un recorrido con scroll y microinteracciones; el bundle de Motion se compensa con la captura del hero recortada a 35 KB y sin Three.js/Lenis/GSAP.
- El movimiento del hero no depende de JS para el texto; el resto de los componentes animados son cliente y requieren JS, como las tabs y el rail.

## ADR-024 — Landing v5: Anubi + Better Stack con UI live (2026-11-23)

**Fecha:** 2026-11-23
**Estado:** parcialmente reemplazada por ADR-025 en la landing (full-bleed, motion, WebGL y Figma). Se conserva como historial.

**Contexto:** la v4.1 seguía sintiéndose como una maqueta: dashboard capturado, marquesina de palabras, rail con línea de progreso y microtextos. El usuario pidió rehacerla usando como referencia **anubi.io** y **betterstack.com**. Se inspeccionaron las dos páginas reales: Anubi usa `#FCFCFC`, negro, Bricolage Grotesque + Epilogue + IBM Plex Mono, tipo enorme y un objeto orbital; Better Stack usa `#0B0C14`, secciones de producto con UI real y copy específico por módulo.

**Decisión:**

- **Tipografía:** Bricolage Grotesque para cuerpo/UI; Epilogue para titulares; IBM Plex Mono para etiquetas. Boska deja de cargarse en la landing.
- **Paleta:** off-white `#F7F7F5`, negro `#0F0F0F`, paneles `#0B0C14`, un solo naranja de señal `#E4572E`. Sin violeta.
- **Hero:** tipo Epilogue grande, tags de módulos y un objeto real: `QuoteDemo`, un presupuesto en HTML que se aprueba en el lugar. Sin captura de dashboard, sin halo, sin teléfono flotante. La aprobación es el único momento de motion del hero; el sello aparece una vez.
- **Producto:** `ProductStory` con cuatro módulos (solicitud, agenda, presupuesto, cobros), cada uno con un panel oscuro de UI live construido con `demoOperation`. Sin capturas ni tabs de screenshots.
- **Migración:** se integra `glass-folder-cards` (componente local provisto por el usuario) con archivos de ejemplo; se monta con lazy loading para no gastar main thread antes del LCP.
- **Se retiran:** `OperationalTicker`, `OrderRail`, `ProductTour`, el halo, el teléfono flotante, el conteo y los `OT/QT` repetidos por la página.
- **Precios/FAQ/CTA:** se conservan, retematizados con la nueva tipografía y tokens.
- **Sin datos inventados:** no hay logos, testimonios, clientes ni métricas de terceros. Los paneles usan el dataset demo y lo declaran.
- **Originkit:** se pidieron 12 componentes; el CLI consumió las 3 descargas diarias en un lote sin escribir archivos y el endpoint devuelve 429. Quedan pendientes; el detalle está en `docs/ORIGINKIT_INTEGRATION.md`.

**Consecuencias:**

- Lighthouse móvil y desktop: 100/100/100/100; LCP 1.2 s móvil y 0.3 s desktop; TBT 60 ms / 0 ms; CLS 0.
- Axe 4.14: 0 violaciones WCAG 2.2 AA en 1440 y 390.
- `pnpm lint` 0 errores (5 warnings: 3 preexistentes y 2 `<img>` del componente de carpetas), `pnpm typecheck` OK, `pnpm test` 281/281, `pnpm build` 28 rutas.
- Playwright: sin overflow de 360 a 1440; aprobación del presupuesto y apertura de la carpeta verificadas; sin errores de consola.
- La carpeta de vidrio se copió y se le corrigieron dos reglas de lint (setState en efecto y acceso a ref en render) sin cambiar su comportamiento visual.
- Pendiente: componentes Originkit cuando se resetee la cuota, deploy a Vercel y QA en producción.

## ADR-025 — Landing v6: full-bleed, motion y WebGL propio (2026-11-23)

**Fecha:** 2026-11-23
**Estado:** aceptada. Reemplaza ADR-024 en layout, motion y escena. Se conserva como historial.

**Contexto:** la v5 tenía buen producto y tipografía, pero el usuario marcó tres problemas concretos: demasiado espacio lateral, el panel parecía cortado en su captura y la página seguía siendo estática. Sumó `bizar.ro` y `motiveone.com` como referencias de WebGL, tipografía cinética y secuencia pinned, y pidió usar Figma en serio.

**Decisión:**

- **Layout full-bleed:** contenedor de 1600 px con gutters de 20–32 px en header, hero, producto, migración, precios, FAQ y CTA. El hero ocupa el ancho completo y el panel entra completo desde 1024.
- **Texto:** `TextReveal` con IntersectionObserver propio y palabras enmascaradas; el hero mantiene `mk-line` y `mk-rise`. No hay títulos que queden ocultos si el observer no dispara.
- **Hero:** `QuoteDemo` se auto-aprueba una vez a los 2.6 s, muestra el sello y permite click. El panel tiene tilt de puntero de hasta 4°; el sello vive fuera del contenedor 3D para no quedar clipeado. En mobile/tablet el sello se oculta y queda el estado textual.
- **Producto pinned:** una secuencia de cuatro pasos con panel sticky (620 px), paneles live que cambian por scroll y WebGL de fondo. Sin marquesina, sin progress line y sin metadata repetida. En mobile los paneles se apilan.
- **WebGL propio:** `operational-scene.tsx` con Three.js: terreno de líneas y cuatro nodos; un solo contexto, lazy mount, pausa fuera de viewport, DPR máximo 1.5, fallback CSS y reduced motion.
- **Migración:** `glass-folder-cards` con auto-drop de un archivo al entrar en viewport, además de hover/click. Se mantiene lazy.
- **Figma:** archivo `DOVEXO Landing v6 — Storyboard` con variables, text styles, componente Quote Panel, frames de hero/pinned/mobile y notas de motion. Ver `docs/FIGMA_STORYBOARD.md`.
- **Originkit:** sigue bloqueado por el límite diario; no hay archivos de Originkit en el repo. Ver `docs/ORIGINKIT_INTEGRATION.md`.

**Consecuencias:**

- Lighthouse móvil y desktop: 100/100/100/100; LCP 1.2 s / 0.3 s; TBT 60 ms / 0 ms; CLS 0.
- Axe 4.14: 0 violaciones WCAG 2.2 AA en 1440 y 390.
- `pnpm lint` 0 errores (5 warnings, 2 del `<img>` del componente de carpetas), `pnpm typecheck` OK, `pnpm test` 281/281, `pnpm build` 28 rutas.
- Playwright: sin overflow de 360 a 1440; auto-aprobación, sello, pinned sticky y auto-drop verificados.
- Figma MCP Starter cortó al intentar la variante `Aprobado`; el archivo quedó con el componente base y todos los frames.
- Pendiente: deploy, QA en producción, variante de Figma y componentes Originkit cuando se resetee la cuota.

## ADR-026 — Landing v7: secciones por rol, sello y sistema compartido (2026-11-23)

**Fecha:** 2026-11-23
**Estado:** aceptada. Extiende ADR-025; no reemplaza la dirección de arte.

**Contexto:** la v6 seguía teniendo un panel de producto demasiado vacío, un
sello flotante que se recortaba, etiquetas decorativas en 9–11 px y la carpeta
de migración aislada. El usuario pidió además más secciones y que la misma
identidad bajara al dashboard, el portal, la PWA y la app móvil.

**Decisión:**

- **Hero:** se eliminan el eyebrow, los tags y el microcopy. El panel no tiene
  `overflow-hidden`; el sello es un `ApprovalStamp` rectangular, integrado en
  la cabecera del presupuesto, con texto de 16 px y detalle de 12 px.
- **Producto:** panel sticky de 680 px, paneles densos (agenda con dos turnos y
  una orden pendiente), sin nota de motion ni etiquetas “01/04”. El paso se
  identifica con un número grande.
- **Secciones nuevas:** “La oficina ve todo”, “El técnico trabaja sin señal”,
  “El cliente aprueba sin cuenta” y “Cada empresa, separada”. Usan paneles live,
  un phone frame con la PWA y los roles/auditoría reales. No hay logos,
  testimonios ni métricas de terceros.
- **Migración:** la carpeta de vidrio se acompaña con la vista previa de
  `clientes.xlsx`, el resumen de válidas/errores y un archivo flotante. El
  auto-drop se mantiene.
- **Motion:** `mk-scroll-reveal` con `animation-timeline: view()` para las
  secciones de rol, sin hidratar un componente cliente extra; el hero conserva
  tilt/estado aprobado, el producto el pinned + WebGL y la carpeta el auto-drop.
  Reduced motion deja todo visible.
- **Sistema compartido:** `--ds-*` pasa a la paleta de la landing (paper, ink,
  panel, señal), `--font-display` a Epilogue, `--font-sans` a Bricolage y
  `--font-mono` a IBM Plex Mono. Se actualizan `app-shell`, dashboard, login,
  PageHeader, presupuesto público y tokens de Expo. No se rediseñó cada pantalla
  del dashboard en esta sesión; la base visual y los componentes compartidos ya
  apuntan a la identidad nueva.
- **Demo:** botón “Reiniciar demo” en `/admin` para platform admins; usa el
  endpoint existente y conserva auditoría.

**Consecuencias:**

- La landing pasa de 6 a 10 secciones y de ~6.000 a ~9.984 px de alto.
- Se quita el tope de 1600 px: el hero y las secciones usan ancho completo con
  gutters de 20–32 px. El hero recién pasa a dos columnas desde 1280 px para que
  el panel no quede fuera de vista en 1024/1124.
- El panel pinned también pasa a dos columnas desde 1280; en 1024/1124 los
  paneles se apilan y no hay recorte horizontal.
- Lighthouse móvil 99/100/100/100 (LCP 1.2 s, TBT 120 ms, CLS 0) y desktop
  100/100/100/100. Axe 0. El 99 móvil se mantiene con el hero aprobado desde el primer paint y
  el producto; el resto de las secciones usa CSS scroll-driven.
- Backend: ruff, format, basedpyright y 203 pytest. Frontend: 281 tests, 28
  rutas, lint 0 errores (4 warnings). Mobile: `tsc` OK.
- **Figma:** el archivo queda en v6; el MCP Starter agotó el rate limit y no se
  pudo crear la v7 ni la variante `Aprobado`. Ver `FIGMA_STORYBOARD.md`.
- **No desplegado:** falta Vercel, QA en producción y APK nuevo con los tokens.

## ADR-027 — Precios de lanzamiento v2 y cupos separados de oficina/técnicos (2026-11-24)

**Fecha:** 2026-11-24
**Estado:** aceptada. Reemplaza los valores de planes de la migración
`5ffb8399d836` y la tabla de `PRICING_VALIDATION.md` §1 vigente hasta el
2026-11-14. **No reemplaza ADR-011**, que sigue vigente para el mecanismo de
suscripciones, `price_snapshot` y el panel global; tampoco cambia el modo
`trialing`.

**Contexto:** la tabla anterior (Starter $29.900 / Professional $59.900 /
Business $99.900, con “usuarios” y “técnicos” siempre iguales y tokens de IA por
plan) tenía tres problemas comerciales y uno técnico:

1. El precio de entrada dejaba afuera al técnico independiente, que es el
   segmento más fácil de conseguir en la etapa de preventa.
2. Un mismo número para usuarios y técnicos no reflejaba la operación real: una
   empresa con 1 persona en oficina y 4 técnicos quedaba forzada a un plan
   pensado para 5 personas de oficina.
3. Vender “tokens de IA” por plan obliga a explicar una unidad que el cliente no
   quiere administrar y que el backend no aplica por plan: hay un límite global
   por empresa (`ai_monthly_token_limit`).
4. El backend contaba usuarios y técnicos con el mismo cupo, así que la landing y
   el producto no podían prometer cupos separados sin cambiar la validación.

**Decisión:**

Precios de lanzamiento v2 (ARS/mes):

| Plan | Precio | Usuarios de oficina | Técnicos | Órdenes nuevas/mes |
|---|---|---|---|---|
| Starter | 19.900 | 1 | 1 | 100 |
| Professional | 39.900 | 3 | 5 | 1.000 |
| Business | 64.900 | 5 | 20 | 10.000 |

- **`max_users` cuenta solo usuarios de oficina** (`owner`, `admin`,
  `dispatcher`, `viewer`) y **incluye al dueño**. Las invitaciones pendientes a
  esos roles reservan cupo.
- **`max_technicians` cuenta solo técnicos.** Un técnico no consume cupo de
  oficina. `billing/detail` devuelve `users_count` y `technicians_count` por
  separado.
- **La IA no se vende por tokens.** Está incluida en los tres planes, sin costo
  aparte y sin cuota comercial publicada. Se mantiene el límite mensual global
  por empresa, igual para todos los planes, medido internamente. `/settings/billing`
  muestra el uso de usuarios de oficina, técnicos y órdenes; el consumo de IA no
  se muestra. Al alcanzar el tope, el asistente responde 429 y se reanuda el mes
  siguiente; el resto del sistema no se afecta.
- **Orden nueva por mes** = órdenes de trabajo creadas desde el día 1 a las
  00:00 de `America/Argentina/Buenos_Aires`. No limita el historial.
- **Migración nueva de planes:** `ad1d19f0512b`
  (`update_plan_pricing_and_demo_snapshot`) carga precios y cupos en `plans`,
  quita `ai_monthly_tokens` de los límites y actualiza el `price_snapshot` de la
  suscripción del tenant `servicios-demo` a Professional. Tiene `downgrade`
  completo. **No consta aplicada en Neon** al cierre de este ADR; no se afirma lo
  contrario.
- **Landing desplegada** el 2026-11-24 con los precios, los cupos separados y la
  aclaración de que el asistente está incluido con límite mensual. El dashboard
  usa ancho completo y la grilla de KPIs pasa a 3 columnas desde 1280 px para no
  cortarse en notebooks con zoom. `/settings/billing` muestra el catálogo nuevo
  con un override de display hasta aplicar la migración en Neon.
- **Documentación comercial:** `PLANES_EXPLICADOS.md` explica los planes para
  clientes; `PRICING_VALIDATION.md` §1, `PILOT_PROGRAM.md` y `DEMO_SCRIPT.md`
  referencian los valores nuevos sin reescribir la evidencia histórica.

**Consecuencias:**

- **Cobro automático pendiente.** Cambiar de plan sigue siendo un cambio de
  `plan_id` y `price_snapshot` sin pasarela: no hay débito, ni factura, ni
  prorrateo, ni bloqueo por falta de pago. Cualquier cobro se acuerda y se
  registra a mano. No prometer cobro automático.
- **Downgrade sin purga:** bajar de plan no elimina membresías ni datos. Si la
  empresa queda por encima del cupo, el backend solo bloquea nuevas invitaciones
  y nuevas órdenes hasta volver al rango.
- **Dos fuentes de verdad hasta aplicar la migración:** `brand.ts` (landing y
  display de facturación) y `plans` en la base. La landing y `/settings/billing`
  ya muestran los valores nuevos; `/api/v1/plans` y `/api/v1/subscription` siguen
  con los viejos. No cotizar contra la API sin verificar y quitar el override de
  facturación cuando la migración esté aplicada.
- **Precio de entrada más bajo:** Starter queda por debajo del piso de la
  hipótesis H6 (ARS 25.000–65.000) y Business dentro del techo. No valida la
  hipótesis: sigue sin haber entrevistas.
- **Riesgo comercial:** 100 órdenes/mes en Starter puede quedar corto para un
  técnico muy activo (unas 4-5 órdenes por día hábil). Es intencional: el
  objetivo es que el salto a Professional sea por volumen, no por funciones.
- **Verificación:** backend con 207 pytest y ruff/format/basedpyright OK;
  incluye `test_billing.py::test_subscription_usage_separates_office_users_from_technicians`,
  `test_invitations.py::test_technician_does_not_consume_office_user_seat` y
  `test_office_seat_is_free_after_inviting_a_technician`. Landing con 284 tests
  web, lint 0 errores (4 warnings preexistentes), typecheck OK y build de 32
  rutas. Evidencia de las sesiones de implementación del 2026-11-24; este ADR no
  re-ejecutó las suites.
- **Pendiente:** aplicar la migración en Neon, desplegar la landing, QA visual en
  producción y, más adelante, enforcement completo de límites y cobro real.

## ADR-028 — Contrato de exportación CSV por tenant (2026-11-27)

**Fecha:** 2026-11-27
**Estado:** aceptada. Complementa ADR-017 (importador CSV/XLSX), del que reutiliza
el criterio de neutralización de fórmulas solo en la salida.

**Contexto:** la auditoría externa del 2026-11-26 marcó como brecha funcional la
falta de exportación de datos. La FAQ solo prometía PDF de presupuestos. Sin
descargas, el cliente no puede sacar sus datos y la política de portabilidad
queda sin implementación. Se necesita un contrato único para no repetir lógica ni
abrir una vía de fuga entre tenants.

**Decisión:**

- **Endpoints:** `GET /api/v1/exports/customers.csv`, `/exports/orders.csv`,
  `/exports/quotes.csv` y `/exports/payments.csv`.
- **Autorización en backend:** solo `owner`, `admin` y `dispatcher`. `viewer` y
  `technician` reciben 403. El tenant sale de la membresía validada; nunca de un
  `tenant_id` enviado por el cliente.
- **Formato:** CSV UTF-8 con BOM (`EF BB BF`) para que Excel abra acentos y
  tildes, cabeceras en español, fechas convertidas a
  `America/Argentina/Buenos_Aires` e importes como `Decimal` con 2 decimales.
- **Neutralización solo en la salida:** los valores que empiezan con `=`, `+`, `-`,
  `@`, tab, CR o LF se prefijan al escribir el CSV. Los datos persistidos quedan
  intactos, de modo que la exportación es una representación y no una mutación.
- **Transporte:** streaming, sin materializar el tenant completo en memoria, y
  `Content-Disposition` con el nombre del archivo. CORS expone esa cabecera para
  que la web pueda leer el nombre.
- **Auditoría:** cada descarga registra `export_downloaded` en `audit_logs` con
  actor, recurso y conteo de filas.
- **Web:** `/settings/export` con cuatro tarjetas y descarga directa.

**Consecuencias:**

- **Portabilidad cubierta, eliminación no.** La exportación resuelve el derecho a
  sacar los datos; el borrado de datos del tenant sigue pendiente y es un punto
  aparte de `PRODUCTION_CHECKLIST.md` y de la auditoría.
- **Sin límite de filas explícito:** el streaming evita el problema de memoria,
  pero no hay paginación ni tope documentado. Si el volumen crece, hay que decidir
  un tope o un archivo diferido.
- **Exportar no es un borrado seguro:** el CSV queda en la máquina del usuario
  fuera del control del producto. La política de retención y el aviso legal
  siguen abiertos.
- **Cubierto por tests, no todo por producción:** permisos por rol y aislamiento
  entre tenants tienen tests locales; en producción solo se verificó la descarga
  con un owner de la demo.
- **Verificación:** backend con 232 pytest y ruff/format/basedpyright OK;
  frontend con 317 tests, lint, typecheck y build OK. En producción (2026-11-27),
  los cuatro endpoints respondieron 200 con `demo@saasgestion.com`,
  `Content-Disposition` correcto (`clientes-2026-11-27.csv`) y BOM `EF BB BF`; la
  web descargó el archivo desde `/settings/export` sin errores de consola. Este
  ADR no re-ejecutó las suites.
