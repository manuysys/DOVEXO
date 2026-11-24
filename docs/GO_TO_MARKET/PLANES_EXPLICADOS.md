# Planes explicados

**Última actualización:** 2026-11-24
**Para quién:** clientes y prospectos (documento de lectura, sin jerga técnica).
**Fuente de los datos:** `apps/web/src/lib/brand.ts` (precios y cupos de la
landing) y `apps/api` (`plan_limits_service.py`, `billing.py`). Los precios y
cupos de la base se cargan con una migración nueva, **todavía no aplicada en
Neon** (ver §12).
**Regla:** no cambiar precios ni prometer funciones que no estén operativas.
Antes de cotizar, re-verificar `PRICING_VALIDATION.md` §1.

---

## 1. Tres planes, las mismas funciones

DOVEXO tiene tres planes: **Starter**, **Professional** y **Business**.

Las funciones son las mismas en los tres. Lo único que cambia es la
**capacidad**: cuántas personas de oficina entran, cuántos técnicos y cuántas
órdenes nuevas por mes se pueden crear.

Nada de “el plan caro tiene el módulo bueno”. Si una función existe, está en
Starter y también en Business.

## 2. Precios y cupos

| Plan | Precio (ARS/mes) | Usuarios de oficina | Técnicos | Órdenes nuevas por mes |
|---|---|---|---|---|
| **Starter** | **$19.900** | 1 | 1 | 100 |
| **Professional** | **$39.900** | 3 | 5 | 1.000 |
| **Business** | **$64.900** | 5 | 20 | 10.000 |

- Montos en pesos argentinos, por mes, sin decimales.
- Los usuarios de oficina **incluyen al dueño**.
- Los técnicos **no ocupan cupo de oficina**: tienen su propia cuenta y se
  cuentan aparte.
- Hoy no se cobra automáticamente. Al registrarte se activa un **acceso de
  evaluación**; el cobro se informa y se acuerda antes de activarlo.

## 3. Qué significa “usuario de oficina”

Es la persona que trabaja desde la oficina o desde la computadora: el dueño,
un administrador, quien coordina los trabajos y quien solo consulta.

| Rol | Qué hace | ¿Ocupa cupo de oficina? |
|---|---|---|
| Dueño (`owner`) | Todo, incluida la configuración de la empresa y el plan | Sí |
| Administrador (`admin`) | Gestión completa, equipo y configuración | Sí |
| Coordinador (`dispatcher`) | Clientes, solicitudes, órdenes, agenda y presupuestos | Sí |
| Consulta (`viewer`) | Solo lectura | Sí |
| Técnico (`technician`) | Sus trabajos asignados, desde el celular | **No**: tiene cupo propio en “Técnicos” |

Detalles que conviene saber:

- **El dueño ocupa un lugar.** En Starter, el único usuario de oficina es el
  dueño: si quiere que otra persona coordine, necesita Professional.
- **Una invitación pendiente reserva el cupo** hasta que la persona acepta o la
  invitación vence. Así no se puede invitar de más y descubrirlo después.
- **Un técnico puede tener su propia cuenta sin gastar lugar de oficina.** Cada
  cuenta tiene un solo rol por empresa: si el dueño además sale a la calle, va a
  necesitar dos cuentas con dos emails distintos (una de oficina y una de
  técnico), y cada una ocupa su cupo. No se puede tener los dos roles con el
  mismo usuario en la misma empresa.

## 4. Qué significa “orden nueva por mes”

Es la cantidad de **trabajos (órdenes de trabajo) que se crean en el mes
calendario**, contando desde el día 1 a las 00:00 hora argentina.

- **No es un límite histórico.** Las órdenes de meses anteriores no se borran ni
  se pierden: el historial completo sigue disponible, se puede consultar y
  cobrar.
- **No cuenta lo que ya existe.** Si importás clientes, si tenés órdenes viejas
  o si trabajás una orden durante semanas, eso no suma al cupo del mes.
- **Sí cuenta cada orden creada**, incluso si nace de convertir una solicitud.
- Si se llega al tope, el sistema no permite crear ni convertir más órdenes
  hasta el mes siguiente o hasta cambiar de plan. Lo que ya está cargado sigue
  funcionando: agenda, presupuestos, pagos, portal del cliente y PWA del técnico.

## 5. Los tres planes, uno por uno

### Starter — $19.900/mes

**Para quién:** el técnico independiente o el dueño que hace todo: atiende,
presupuesta, coordina y cobra. También sirve para una empresa chica que recién
empieza a ordenarse.

**Incluye:** 1 usuario de oficina (el dueño), 1 técnico y 100 órdenes nuevas por
mes. Las funciones completas de §6.

**Conviene pasar a Professional cuando:**

- entra una segunda persona a la oficina (aunque sea part-time o solo para
  facturar y cobrar), o
- hay un segundo técnico en la calle, o
- se superan las 100 órdenes nuevas en un mes.

### Professional — $39.900/mes

**Para quién:** la empresa con oficina y equipo en la calle. Alguien coordina,
otro presupuesta y varios técnicos hacen las visitas.

**Incluye:** 3 usuarios de oficina, 5 técnicos y 1.000 órdenes nuevas por mes.

**Conviene pasar a Business cuando:**

- hay más de 3 personas en la oficina, o
- hay más de 5 técnicos, o
- se superan las 1.000 órdenes nuevas en un mes.

### Business — $64.900/mes

**Para quién:** operaciones grandes, con varias cuadrillas y volumen alto de
visitas.

**Incluye:** 5 usuarios de oficina, 20 técnicos y 10.000 órdenes nuevas por mes.

**Si la operación supera estos cupos:** hoy no hay un plan superior publicado.
Se conversa caso por caso; no se promete un plan que no exista.

## 6. Funciones incluidas en los tres planes

1. **Clientes e historial:** ficha con datos, dirección, contacto y todo lo que
   se hizo con ese cliente.
2. **Solicitudes y órdenes:** cada pedido entra al sistema y se convierte en
   trabajo con estado, prioridad e historial de cambios con autor y fecha.
3. **Presupuestos con PDF y link para aprobar sin cuenta:** se arma el
   presupuesto, se descarga el PDF y el cliente lo aprueba desde el celular, sin
   crear usuario ni instalar nada. Los precios quedan guardados como históricos
   y el link se puede revocar.
4. **Agenda y asignación:** turnos con día y hora, detección de conflictos y
   asignación de cada trabajo al técnico.
5. **PWA para técnicos:** el técnico abre una dirección web en el celular y ve
   sus trabajos, sin instalar nada desde una tienda. Tiene cola offline para
   notas, materiales y fotos.
6. **Pagos y saldos:** se registran pagos totales o parciales, se anulan si hace
   falta y el saldo pendiente se recalcula solo.
7. **Automatizaciones y notificaciones:** reglas por evento (por ejemplo, cuando
   se aprueba un presupuesto) que generan notificaciones dentro del sistema.
8. **Asistente de IA:** preguntas en castellano sobre la operación, con datos
   reales de la empresa (ver §7).

## 7. Asistente de IA: incluido, sin tokens ni costo aparte

- **Está en los tres planes.** No se paga por uso ni se compran “tokens” como en
  otros productos.
- **Hoy tiene un límite mensual de uso por empresa, igual para todos los
  planes.** El mismo tope para Starter, Professional y Business.
- **El límite se mide internamente.** No es un número que el cliente tenga que
  administrar ni comprar. En `/settings/billing` se ve el uso de usuarios de
  oficina, técnicos y órdenes frente a los límites del plan; el consumo del
  asistente se mide aparte, internamente.
- **No ejecuta acciones.** Responde consultas y resume información: no crea
  órdenes, no manda mensajes, no cambia precios, no toca datos.
- **Si se alcanza el tope**, el asistente queda pausado hasta el mes siguiente.
  El resto del sistema sigue funcionando normalmente: órdenes, agenda,
  presupuestos, pagos, portal y PWA no se ven afectados.
- El tope puede ajustarse con el tiempo. Si eso pasa, se avisa; no se cobra
  aparte sin acuerdo previo.

## 8. Qué no incluye (hoy)

Ninguno de los tres planes incluye, por ahora:

| Función | Estado real |
|---|---|
| WhatsApp automático | La API oficial está implementada, pero falta el número y las credenciales de Meta. Los envíos automáticos quedan pendientes; no está operativo de punta a punta. |
| Email productivo | Los emails no se entregan: falta dominio verificado. Los enlaces se comparten a mano. |
| Cobros online con Mercado Pago | No implementado. Los pagos son registros manuales. |
| Facturación fiscal / AFIP | Fuera del alcance actual. La facturación se sigue manejando aparte. |
| GPS y rutas | No existe. Fuera del alcance. |
| App en Play Store | La app Android está desarrollada y se puede instalar un APK de prueba, pero no está publicada en la tienda. |
| SLA y backups garantizados | No hay SLA. La infraestructura corre en planes gratuitos, con límites y arranques en frío. Los backups todavía no tienen restauración probada. |

## 9. Acceso de evaluación y piloto

Son dos cosas distintas y conviene no mezclarlas al hablar con un cliente.

| | Acceso de evaluación | Piloto |
|---|---|---|
| Qué es | El acceso que se activa solo al registrarse | Un programa acompañado, con cupos limitados |
| Duración | 14 días de suscripción en estado de prueba | 30 días |
| Costo | Sin costo (hoy no se cobra automáticamente) | Sin costo |
| Acompañamiento | Ninguno especial: se usa el producto | Onboarding guiado, importación de clientes, capacitación y reunión semanal |
| Cupos | Sin límite de empresas | 3 empresas |
| SLA | No | No |

Detalle del piloto en `PILOT_PROGRAM.md`. Regla común: **nada se cobra
automáticamente sin consentimiento explícito** y por escrito (qué plan, qué
precio, desde cuándo).

El acceso de evaluación arranca en el plan **Starter**: 1 usuario de oficina,
1 técnico y 100 órdenes nuevas por mes. Si durante la prueba se necesita más
capacidad, el dueño puede cambiar de plan desde `/settings/billing`: el cambio
registra el plan y el precio contratado, pero **no procesa ningún pago**.

## 10. Preguntas frecuentes

**¿Los planes se diferencian por funciones?**
No. Las funciones son las mismas en los tres. Cambia la capacidad: usuarios de
oficina, técnicos y órdenes nuevas por mes.

**¿El dueño cuenta como usuario?**
Sí. El dueño es un usuario de oficina más. En Starter, ese lugar es el suyo.

**¿Los técnicos me sacan un lugar de oficina?**
No. Tienen su propio cupo. Podés tener 1 usuario de oficina y 1 técnico en
Starter sin problema.

**¿Qué pasa si me paso de las órdenes del mes?**
No se pueden crear órdenes nuevas hasta el mes siguiente o hasta cambiar de
plan. Todo lo que ya está cargado sigue andando: agenda, presupuestos, pagos,
portal del cliente y PWA.

**¿Pierdo el historial si cambio de plan?**
No. Cambiar de plan no borra clientes, órdenes, presupuestos ni pagos. El
historial queda completo. Los cupos se vuelven a controlar al invitar gente y al
crear órdenes.

**¿Puedo bajar de plan?**
Se puede conversar. Si la empresa tiene más gente que el cupo del plan nuevo, el
sistema no elimina a nadie automáticamente, pero no va a permitir sumar más
personas hasta estar dentro del cupo.

**¿La IA se paga aparte?**
No. Está incluida en los tres planes, con un límite mensual de uso por empresa
igual para todos.

**¿La IA hace cosas sola?**
No. Solo responde y resume. No crea órdenes, no manda mensajes y no modifica
datos.

**¿Puedo aprobar presupuestos sin que el cliente cree una cuenta?**
Sí. Se comparte un link y el cliente aprueba o rechaza desde el celular.

**¿Mis técnicos necesitan instalar una app?**
No. Abren la PWA en el navegador del celular. También existe una app Android,
pero todavía no está publicada en Play Store.

**¿Hay contrato de permanencia?**
No hay permanencia ni cobro automático hoy. Las condiciones de cobro se acuerdan
por escrito antes de activar cualquier pago.

**¿Hay SLA o backups garantizados?**
No. Es una etapa inicial. No prometemos disponibilidad garantizada ni
restauración de backups hasta tenerlo resuelto.

**¿Se integra con WhatsApp o Mercado Pago?**
Todavía no de punta a punta. WhatsApp está contemplado con la API oficial, pero
falta el número y las credenciales de Meta. Mercado Pago no está implementado.

## 11. Mensajes cortos listos para enviar

Tono argentino, claro, sin jerga. No prometen nada que no esté operativo.

### General (los tres planes)

> DOVEXO tiene tres planes y los tres incluyen lo mismo: clientes e historial,
> solicitudes y órdenes, presupuestos con PDF y link para aprobar sin cuenta,
> agenda con asignación de técnicos, PWA para el celular del técnico, pagos y
> saldos, automatizaciones y asistente de IA.
>
> Lo que cambia es la capacidad: Starter $19.900 por mes (1 usuario de oficina,
> 1 técnico, 100 órdenes nuevas), Professional $39.900 (3 usuarios, 5 técnicos,
> 1.000 órdenes) y Business $64.900 (5 usuarios, 20 técnicos, 10.000 órdenes).
> Los usuarios de oficina incluyen al dueño; los técnicos no ocupan ese cupo.
> Hoy no se cobra automáticamente: al registrarte se activa un acceso de
> evaluación.

### Starter

> Starter es para el que hace todo: 1 usuario de oficina (el dueño), 1 técnico y
> 100 órdenes nuevas por mes, a $19.900. Incluye las funciones completas:
> presupuestos con link para aprobar sin cuenta, agenda, pagos y PWA para el
> técnico. Cuando entra una segunda persona a la oficina, un segundo técnico o
> pasás las 100 órdenes en el mes, conviene Professional.

### Professional

> Professional es para la empresa con oficina y gente en la calle: 3 usuarios de
> oficina, 5 técnicos y 1.000 órdenes nuevas por mes, a $39.900. Mismas
> funciones que Starter, más capacidad. Si necesitás más de 3 personas en
> oficina, más de 5 técnicos o más de 1.000 órdenes, el plan es Business.

### Business

> Business es para operaciones grandes: 5 usuarios de oficina, 20 técnicos y
> 10.000 órdenes nuevas por mes, a $64.900. Mismas funciones que los otros dos
> planes. Si la operación supera esos cupos, lo vemos caso por caso: hoy no hay
> un plan más grande publicado.

### Asistente de IA

> El asistente de IA está incluido en los tres planes y no se paga aparte: no se
> compran tokens. Responde preguntas sobre tu operación con tus datos y no
> ejecuta acciones (no crea órdenes ni manda mensajes). Tiene un límite mensual
> de uso por empresa, igual para todos los planes; si se alcanza, se pausa hasta
> el mes siguiente y el resto del sistema sigue funcionando igual.

### Piloto

> Estamos arrancando con 3 empresas en un piloto de 30 días, sin costo. Incluye
> configuración acompañada, importación de tu cartera de clientes, capacitación
> del equipo y una reunión breve por semana. No hay SLA ni backups garantizados
> todavía, así que al principio trabajamos con datos acotados. Al terminar, si
> sirve, vemos el plan y las condiciones por escrito; no hay cobro automático.

## 12. Fuente y vigencia

| Dato | Dónde vive |
|---|---|
| Precios y cupos que muestra la landing | `apps/web/src/lib/brand.ts` |
| Validación de cupos en el backend | `apps/api/app/services/plan_limits_service.py`, `apps/api/app/repositories/billing.py` |
| Precios y cupos en la base | Migración `ad1d19f0512b` (`update_plan_pricing_and_demo_snapshot`); **no consta aplicada en Neon** |
| Protocolo de validación de precios | `PRICING_VALIDATION.md` |
| Programa de pilotos | `PILOT_PROGRAM.md` |
| Estado real del producto | `docs/PROJECT_STATUS.md` |
| Decisión registrada | ADR-027 en `docs/DECISIONS.md` |

**Pendientes que afectan lo que se puede prometer:**

- La migración de planes `ad1d19f0512b` todavía no consta aplicada en Neon.
- La landing con estos precios está verificada en local, pero **no desplegada**.
- El cobro automático no está implementado: cambiar de plan desde
  `/settings/billing` solo registra el plan y el precio contratado. No hay pago,
  prorrateo ni factura.
- El enforcement de cupos cubre usuarios de oficina, técnicos y órdenes nuevas.
  Otros límites por plan no están aplicados en todos los endpoints.

Si un número de este documento no coincide con `brand.ts`, gana `brand.ts` y
este documento se corrige.
