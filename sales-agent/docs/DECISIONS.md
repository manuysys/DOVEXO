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

## ADR-S006 — Descubrimiento provincial con Overpass en Fase 2A

**Fecha:** 2026-11-27
**Estado:** aceptada

**Contexto:** la Fase 1 no ejecutaba descubrimiento. La Fase 2 debe usar fuentes
gratuitas y no inventar empresas.

**Decisión:** `OverpassProvider` consulta OpenStreetMap por provincia argentina
(`ISO3166-2`) y por rubro, con una consulta por rubro, límite total, timeout,
reintentos con backoff, User-Agent identificable y sin APIs pagas. El worker
procesa `search_run`, guarda empresas/fuentes/contactos/sectores y actualiza
conteos. La Fase 2A es **provincial**: la búsqueda nacional y la ejecución
completa de una campaña con 24 provincias quedan para 2B. Si una campaña
nacional se intenta ejecutar, falla con un mensaje claro y no inventa datos.

**Consecuencias:** los tests usan Overpass mockeado y no dependen de internet.
El mapeo de etiquetas OSM para algunos rubros es conservador y debe revisarse con
datos reales. La disponibilidad de Overpass afecta la búsqueda real; el error se
informa y el job puede reintentarse.

## ADR-S007 — Deduplicación con procedencia y revisión humana

**Fecha:** 2026-11-27
**Estado:** aceptada

**Decisión:** comparar dominio normalizado, teléfono normalizado, URL estable de
OSM, nombre normalizado + localidad y RapidFuzz. Los duplicados exactos se omiten
pero dejan una fuente con `search_run_id` para trazabilidad. Los posibles
duplicados se guardan con `discovery_status="possible_duplicate"` para revisión;
no se fusionan automáticamente. Cada empresa conserva fuentes y contactos con su
origen.

**Consecuencias:** una empresa puede aparecer en varias búsquedas sin perder
trazabilidad. La revisión de posibles duplicados ya tiene filtros y acciones en
la Fase 2B; la fusión automática sigue prohibida. La búsqueda difusa se limita a
500 candidatos y exige localidad, adecuada para la escala provincial inicial.

## ADR-S008 — Importación CSV con preview y confirmación idempotente

**Fecha:** 2026-11-27
**Estado:** aceptada

**Decisión:** CSV UTF-8 de hasta 2 MB y 500 filas, con columnas `nombre` y
`rubros` obligatorias; se aceptan alias de columnas y separadores `,`, `;` o tab.
El preview valida filas, provincias, rubros, web, teléfono y email, detecta
duplicados contra la base y dentro del archivo, y no crea empresas. La
confirmación crea solo filas válidas y no duplicadas, es idempotente y registra
el lote. No se guarda el archivo original; se guarda el mapeo, las filas
normalizadas y los errores.

**Consecuencias:** el operador ve exactamente qué se va a crear antes de
confirmar. Las filas sin rubro válido se rechazan. El informe descargable por
lote queda pendiente; el CSV de empresas se exporta por separado.

## ADR-S009 — Campañas con una búsqueda por provincia y exportación CSV

**Fecha:** 2026-11-27
**Estado:** aceptada

**Decisión:** iniciar una campaña crea una `SearchRun` y un `job` por provincia
(24 si no hay filtros), con los rubros y el límite de la campaña; el worker las
procesa secuencialmente. Pausar cancela las pendientes; cancelar cancela
pendientes y en ejecución. La UI muestra el progreso por provincia y los
conteos reales. La exportación CSV de empresas usa los filtros del listado,
UTF-8 con BOM, encabezados en español y neutralización de fórmulas solo en la
salida.

**Consecuencias:** una campaña nacional 24×7 puede generar hasta 168 consultas
Overpass y tardar; es una operación de fondo, no un request. La pausa deja
terminar la consulta en curso. La base conserva los datos exactos; el apóstrofo
de neutralización aparece solo en el CSV.

## ADR-S010 — Scoring determinístico y aprobación humana del primer contacto

**Fecha:** 2026-11-27
**Estado:** aceptada

**Decisión:** el scoring de compatibilidad y confianza es determinístico,
explicable y persistido; no se presenta una hipótesis como hecho. Cada mensaje
de primer contacto se genera como borrador, requiere aprobación humana y solo
después puede enviarse. No se hacen envíos masivos ni en frío. El envío manual
desde el teléfono del fundador se registra con “Marcar enviado manualmente” y no
se confunde con un envío del proveedor.

**Consecuencias:** el pipeline conserva la trazabilidad de la evaluación y de la
aprobación. Una persona sigue siendo responsable del primer contacto. La
generación automática de texto no implica envío automático.

## ADR-S011 — WhatsApp: consola sin credenciales, Meta con webhook cerrado y bot de entrantes

**Fecha:** 2026-11-27
**Estado:** aceptada

**Contexto:** el fundador pidió un chatbot que converse con las empresas desde su
teléfono, pero las credenciales de Meta todavía no están disponibles y el
producto exige no hacer envíos automáticos en frío.

**Decisión:** sin `WHATSAPP_ACCESS_TOKEN`/`WHATSAPP_PHONE_NUMBER_ID` se usa
`ConsoleWhatsAppProvider`; los envíos quedan `simulated` y nunca se presentan
como reales. Con credenciales se usa Meta Cloud API. El webhook verifica token y
HMAC, falla cerrado sin App Secret y es idempotente. El bot solo responde a
mensajes **entrantes** de conversaciones existentes, con respuestas
determinísticas y handoff humano; no inicia conversaciones ni hace envíos en
frío. La notificación al fundador depende de `FOUNDER_PHONE`. El primer contacto
sigue requiriendo aprobación humana y, en producción, plantilla aprobada por
Meta.

**Consecuencias:** se puede probar todo el flujo localmente sin cuentas pagas.
La prueba real contra Meta y la plantilla de primer contacto quedan pendientes
hasta recibir credenciales. La regla anterior de “sin envíos automáticos” se
interpreta como prohibición de envíos automáticos en frío o masivos; las
respuestas a entrantes están permitidas y auditadas.

## ADR-S012 — Confirmación manual de WhatsApp y lista de no contacto

**Fecha:** 2026-11-27
**Estado:** aceptada

**Decisión:** un teléfono publicado no se trata como WhatsApp. La persona que
opera el sistema debe confirmar manualmente el número; se guarda como contacto
`whatsapp` verificado con etiqueta “Confirmado manualmente”. Los contactos con
`do_not_contact` o en la lista de supresiones no reciben mensajes. El envío
requiere aprobación previa y respeta la ventana de atención de Meta.

**Consecuencias:** la base no inventa canales. La confirmación es una acción
humana explícita y el envío real sigue sujeto a las reglas de Meta.

