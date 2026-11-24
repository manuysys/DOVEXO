# Guion de demostración comercial (10-15 minutos)

**Última actualización:** 2026-11-14 (nota de precios vigentes agregada el
2026-11-24)
**Fuente:** `PREVENTA_ENTREVISTA_LISTA.txt` (sección 11) + estado verificado en
`docs/PROJECT_STATUS.md` y `docs/PILOT_READINESS.md`.
**Evidencia de demo:** auditoría con HTTP real contra producción del
**2026-11-14** (~35 requests, sin 5xx). Detalle en la sección 5.
**Precios vigentes (2026-11-24):** Starter $19.900 · Professional $39.900 ·
Business $64.900 por mes, con cupos separados de oficina y técnicos. Las filas
de planes de la sección 5 son evidencia del 2026-11-14 y se conservan como
historial; para cotizar, usar `PRICING_VALIDATION.md` §1 y `PLANES_EXPLICADOS.md`.
**Regla central:** mostrar únicamente funciones comprobadas y usar registros
claramente identificados como datos de ejemplo. No mostrar operaciones ficticias
como si fueran datos reales de una empresa.

---

## 1. Preparación antes de la demo

1. **Resetear la demo** para partir del estado semilla limpio:
   `POST /api/v1/admin/demo/reset` contra
   `https://saas-gestion-api.vercel.app` con un **platform admin**
   (`founder@saasgestion.com`). No hay botón en la UI; `demo@saasgestion.com`
   no es platform admin. El reset recrea: 3 clientes, 2 solicitudes,
   2 órdenes, 1 presupuesto, 1 turno y 1 pago. Si en la demo anterior se
   aprobó el presupuesto, el reset es obligatorio antes de la siguiente
   (ver §3.1).
2. Tener abiertas en pestañas:
   - Panel: `https://saas-gestion-web.vercel.app` (login `demo@saasgestion.com`
     / `Demo12345!`).
   - Portal del cliente: `https://saas-gestion-web.vercel.app/portal/servicios-demo`
     (acceso por enlace desde la ficha del cliente).
3. Verificar conexión y, si se va a mostrar la app móvil, tener el APK
   instalado en un Android físico (ver sección 5: solo si está instalado).

## 2. Escenario (datos de ejemplo del tenant `servicios-demo`)

"Un cliente nos escribe porque **su aire acondicionado enciende pero no
enfría**. Vamos a seguir ese trabajo de punta a punta."

Todos los datos que se muestran son de ejemplo:

| Registro | Dato de ejemplo |
|---|---|
| Cliente | Carlos Gomez (`carlos@example.com`, +54 11 5555-1001), marcado como cliente demo |
| Otros clientes | Maria Lopez (revisión de instalación eléctrica), Taller Central (mantenimiento preventivo) |
| Solicitud | "Aire acondicionado no enfria" — prioridad alta, origen WhatsApp |
| Orden | "Reparacion aire acondicionado" (`WO-2026-0001`) — turno mañana 10:00 (hora argentina; 2026-11-15 13:00 UTC), con técnico asignado (verificado 2026-11-14) |
| Presupuesto | Ítems: "Diagnostico y reparacion" $45.000 (+IVA 21%) y "Carga de gas refrigerante" $28.000 (−5% desc., +IVA 21%); subtotal $73.000, descuento $1.400, IVA $15.036, **total $86.636,00** |
| Número de presupuesto | `QT-2026-0001`, estado `sent` con enlace público vivo (verificado 2026-11-14; ver riesgo en §3.1) |
| Pago de ejemplo | 1 pago parcial de $20.000 (verificado 2026-11-14) |

## 3. Recorrido de 13 pasos (sección 11 del mandato)

Duración objetivo: 10-15 minutos. No avanzar sin explicar qué problema de la
empresa resuelve cada paso. Durante el recorrido el enlace público se muestra
**sin aprobar**: la aprobación es el paso final, opcional, con la mitigación de
la sección 3.1. La app móvil se menciona; no se demuestra salvo que haya un APK
instalado y probado en el dispositivo (ver sección 5).

| # | Paso | Qué mostrar | Qué decir (idea clave) |
|---|---|---|---|
| 1 | **Registro del cliente** | Clientes → ficha de Carlos Gomez ya cargada (o alta de un cliente nuevo) | "Todo cliente queda con su ficha, teléfono y dirección; ya no vive solo en el chat." |
| 2 | **Creación de solicitud** | Solicitudes → "Aire acondicionado no enfria" (prioridad alta, origen WhatsApp como dato cargado) | "Cada pedido entra al sistema, aunque llegue por WhatsApp o teléfono; nada se olvida." |
| 3 | **Generación de orden** | Solicitud → convertir en orden de trabajo (`WO-2026-0001` en el seed) | "Un clic y la consulta se convierte en trabajo con estado, prioridad e historial." |
| 4 | **Preparación de presupuesto** | Presupuestos → `QT-2026-0001`: ítems, cantidades, descuento, IVA | "Armo el presupuesto en minutos y queda guardado con sus precios históricos." |
| 5 | **Generación del PDF** | Presupuesto → ver el PDF en vivo | "El PDF sale listo para enviar, con los datos de la empresa." |
| 6 | **Envío del enlace público** | Copiar el enlace público y abrirlo **en el celular del prospecto** para que lo vea. **No aprobar todavía** (ver §3.1) | "Le mando al cliente un enlace; no necesita crear cuenta ni instalar nada." |
| 7 | **Programación de visita** | Agenda → turno de mañana 10:00 (hora argentina) de la orden | "La visita queda en la agenda con día y hora; veo toda la semana de un vistazo." |
| 8 | **Asignación de técnico** | Orden → técnico asignado (en el seed ya viene asignado) | "Asigno cada trabajo al técnico disponible y él lo ve en su teléfono." |
| 9 | **Acceso desde la app móvil** | **Mencionar** la app de técnico y la PWA `/tech`; demostrar solo si hay APK instalado y probado en el dispositivo | "El técnico ve sus trabajos del día desde el celular." |
| 10 | **Registro del trabajo** | Solo con APK o PWA a mano: notas, materiales, fotos y cambio de estado; si no, narrarlo sin simular pantallas | "El técnico registra lo que hizo, los materiales y las fotos, con o sin señal (datos guardados localmente)." |
| 11 | **Portal del cliente** | Portal → acceso de Carlos Gomez: resumen, solicitudes, órdenes, turnos, presupuestos y pagos | "El cliente también tiene su vista: ve todo lo suyo sin llamar por teléfono." |
| 12 | **Registro de pago** | Pagos → en el seed ya hay 1 pago parcial de $20.000; mostrar el saldo recalculado (o registrar otro) | "Cargo lo cobrado y el sistema recalcula el saldo pendiente solo." |
| 13 | **Dashboard actualizado + planes** | Dashboard / centro de operaciones y, al cerrar, `/settings/billing` con plan y uso | "Acá veo el negocio completo: trabajos de hoy, atrasados, sin técnico, presupuestos por vencer y saldos pendientes." |
| — | **(Opcional, SIEMPRE al final) Aprobación desde el celular** | Abrir el enlace en el teléfono del prospecto y aprobar ahí, como último paso de la demo, con la mitigación de §3.1 | "El cliente aprueba desde el celular y queda registrado en el sistema, no en un chat perdido." |

### 3.1 Riesgo de la aprobación en vivo y mitigación (2026-11-14)

> **Nota de desvío respecto del txt:** el listado literal de la sección 11 pone
> la aprobación como paso 7. Acá se movió al final como paso opcional por el
> riesgo explicado abajo; la historia completa está presente, solo cambia el
> orden de ese paso.

- `QT-2026-0001` es el **único presupuesto** del tenant demo y está `sent` con
  su enlace público vivo (verificado con HTTP real el 2026-11-14).
- Si se aprueba en vivo, queda `approved` hasta que se ejecute un reset por
  API. Las demos siguientes pierden el paso "aprobación desde el celular"
  hasta resetear.
- Mitigación recomendada (elegir una antes de arrancar la demo):
  1. Mostrar la aprobación **al final de la demo, en el teléfono del
     prospecto**, y después resetear la demo por API:
     `POST /api/v1/admin/demo/reset` contra
     `https://saas-gestion-api.vercel.app` (solo platform admin
     `founder@saasgestion.com`; no hay botón en la UI).
  2. Mostrar solo el enlace abierto en el celular del prospecto (página
     pública del presupuesto) sin aprobar nunca.
- Si se aprobó sin querer, o la demo cerró con aprobación: ejecutar el reset
  por API antes de la próxima demo para volver al estado `sent`.

## 4. Preguntas para cerrar la demo

- "¿Este circuito se parece a cómo trabajan hoy? ¿Qué parte les falta o les
  sobra?"
- "¿Qué paso de los que viste te ahorra más trabajo en tu operación actual?"
- "¿Qué te gustaría probar con datos de tu empresa?" (→ puente a
  `PILOT_PROGRAM.md`)

## 5. SE PUEDE MOSTRAR / NO SE PUEDE MOSTRAR TODAVÍA

Evidencia: auditoría con **HTTP real contra producción del 2026-11-14**
(~35 requests, sin 5xx), más `docs/PROJECT_STATUS.md` y
`docs/PILOT_READINESS.md`. Antes de cada demo, verificar que la tabla siga
siendo cierta contra el estado del repo.

### ✅ Verificado el 2026-11-14 con HTTP real (se puede mostrar)

| Función | Evidencia del 2026-11-14 |
|---|---|
| Salud de la API | `GET /api/v1/health/live` y `GET /api/v1/health/ready` → 200 |
| Landing pública | `GET https://saas-gestion-web.vercel.app/` → 200 |
| Login demo | `POST /api/v1/auth/login` con `demo@saasgestion.com` → 200 |
| Clientes | 3 registros (Carlos Gomez, Maria Lopez, Taller Central) → 200 |
| Órdenes | 2 registros, entre ellos `WO-2026-0001` → 200 |
| Presupuestos | 1 registro: `QT-2026-0001`, estado `sent`, total $86.636,00 → 200 |
| PDF del presupuesto | `GET /api/v1/quotes/{id}/pdf` → 200 `application/pdf`, magic bytes `%PDF-` |
| Enlace público del presupuesto | `GET /public/quotes/{token}` → 200 |
| Agenda | 1 turno 2026-11-15 13:00 UTC (= mañana 10:00 ARG), con técnico asignado → 200 |
| Pagos | 1 pago parcial de $20.000 → 200 |
| Dashboard operativo | `GET /api/v1/dashboard/operations` → 200 |
| Onboarding de cuatro pasos | `GET /onboarding` (web) → 200 |
| Importador de clientes CSV/XLSX | `GET /settings/import` (web) → 200 |
| Equipo | 2 miembros → 200 |
| Planes y suscripción | 3 planes; suscripción Professional $59.900 → 200 |
| Portal del cliente | Auth demo (Carlos Gomez) + summary, orders, quotes, appointments, payments → 200 ×5 |

### ✅ Implementado y verificado antes (mostrable; sin re-verificación hoy)

| Función | Evidencia previa |
|---|---|
| Automatizaciones con notificaciones in-app | Reglas por evento con acciones `notify`/`notify_user`; la aprobación pública probada dispara automatización y notificación (2026-11-10) |
| Asistente de IA | En producción usa Groq (`openai/gpt-oss-120b`) con fallback determinista si se agota la cuota; informar el modo si preguntan |
| PWA para técnicos (`/tech`) | Probada en navegador contra Vercel + Neon |
| Revocación del enlace público y rate limit en aprobación | Implementado y probado |
| Invitaciones de equipo (token, reenvío, revocación, aceptación) | Implementado y probado; el email no se entrega: el enlace se comparte a mano |
| App móvil Android | Existe (APK `mobile-apk-5` con firma debug; AAB release firmado como artifact). **Mencionar que existe, no demostrar en vivo:** no fue probada en un dispositivo físico |

### ❌ NO SE PUEDE MOSTRAR / NO SE PUEDE AFIRMAR (todavía)

| Función | Estado real (2026-11-14) | Qué decir si preguntan |
|---|---|---|
| **WhatsApp operativo** | `GET /whatsapp/config` → `configured:false`: sin credenciales de Meta ni número; los envíos de automatización quedan `skipped`. No probado end-to-end | "Estamos integrando la API oficial de WhatsApp; todavía no está operativa. No te prometo que funcione hoy." |
| **Emails entregados** | Proveedor `console` en producción: los enlaces no llegan por email, se comparten a mano. Resend implementado pero sin dominio verificado | "Los emails hoy no se entregan; te comparto el enlace a mano. Está en camino con un dominio propio." |
| **App móvil demostrada en vivo** | APK debug sin probar en un dispositivo físico (verificado 2026-11-14) | "Tenemos la app para Android desarrollada; cuando esté probada en dispositivo te la muestro andando." |
| **Push notifications** | Implementado con Expo, no probado; requiere EAS projectId y development build | "No lo puedo mostrar todavía porque falta probarlo en dispositivo." |
| **GPS / rutas** | No existe. Fuera del MVP | "No lo tenemos y no lo vamos a prometer." |
| **Cobros con Mercado Pago** | No implementado | "Los pagos que ves son registros manuales; la integración de cobros online no está." |
| **Facturación fiscal completa** | Fuera del MVP (sin ARCA/factura electrónica) | "No hacemos facturación fiscal; vos la manejás como la manejás hoy." |
| **Reset de demo desde la UI** | No hay botón; solo API con platform admin (`founder@saasgestion.com`) | "Es un comando interno de operación, no una función de venta." |
| **Datos reales de una empresa** | Todo lo mostrado es el tenant demo `servicios-demo`, datos de ejemplo | Decirlo explícitamente al inicio de la demo |
| **Backups verificados** | Workflows y scripts existen; no hay restauración probada (PILOT_READINESS criterio 18) | "Estamos terminando de validar backups; no te pido datos sensibles hasta tener eso cerrado." |
| **Disponibilidad / SLA garantizados** | Infraestructura en planes Free (Neon) y Hobby (Vercel), con cold starts y límites | "Es una etapa inicial; en el piloto no te puedo garantizar un SLA." |

## 6. Reglas de oro durante la demo

1. Aclarar al inicio: "todo lo que ves son datos de ejemplo de una demo".
2. Mostrar el circuito completo, no pantallas sueltas: la fuerza está en la
   historia de punta a punta.
3. Si algo falla en vivo, decir qué pasó y seguir con lo que funciona; nunca
   improvisar promesas.
4. No mostrar GPS, push, WhatsApp automático, cobros online ni la app móvil
   demostrada en vivo como si funcionaran (la app se menciona; no se
   demuestra, ver sección 5).
5. La aprobación del presupuesto en vivo se hace solo como paso final
   opcional, con la mitigación de §3.1. Si se aprobó, resetear la demo por
   API antes de la próxima demo.
6. Cerrar con pregunta sobre la operación real del prospecto (puente a
   entrevista o piloto), no con discusión de precio.
