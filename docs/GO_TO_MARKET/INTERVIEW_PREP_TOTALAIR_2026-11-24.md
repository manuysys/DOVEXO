# Preparación de entrevista — TOTALAIR

**Fecha de entrevista:** 2026-11-24, mediodía (confirmar horario).
**Canal:** WhatsApp.
**Contacto:** TOTALAIR Aire Acondicionado, Haedo. Venta, instalación y reparación de A/C.
**Fuente:** `PROSPECTS.csv` (P-002) y conversación del 2026-11-23.
**Objetivo:** descubrir cómo organizan pedidos, presupuestos y técnicos. No vender
en la primera charla. Si hay fit, proponer un piloto de 30 días.

## Antes de la llamada

- Confirmar a las 11:45: “Hola, soy Juan Manuel. Quedamos en hablar hoy al
  mediodía. ¿Te queda bien a las 12:00?”. Ajustar si piden otro horario.
- Preguntar con quién se va a hablar y qué rol tiene.
- Tener a mano: este documento, `DEMO_SCRIPT.md`, `PILOT_PROGRAM.md` y una hoja
  para anotar.
- Probar los enlaces de demo antes de la charla. No abrir el enlace de portal
  de un solo uso hasta que el cliente lo pida.
- Estar en un lugar silencioso, con buena conexión y el teléfono cargado.

## Protocolo de 20 minutos

1. **Apertura (2 min).** Gracias por el tiempo. “La idea es entender cómo
   trabajan, no venderte nada hoy. ¿Te parece si te hago unas preguntas y, si
   querés, al final te muestro algo?”
2. **Contexto (3 min).** Rol, cantidad de técnicos, zona, volumen aproximado
   de trabajos por semana y estacionalidad.
3. **Recorrido real (8-10 min).** Pedir un ejemplo de la última semana:
   - ¿Cómo entra el pedido: llamada, WhatsApp, Instagram, presencial?
   - ¿Quién lo registra y dónde?
   - ¿Cómo se arma el presupuesto y cuánto tarda?
   - ¿Cómo siguen si el cliente no responde?
   - ¿Cómo asignan técnico, día y horario? ¿Qué pasa si se pisan dos visitas?
   - ¿Cómo cierran el cobro y controlan el saldo?
   - ¿Qué herramienta usan hoy: WhatsApp, Excel, papel, software?
4. **Dolor y decisiones (3 min).** ¿Qué es lo que más les complica? ¿Qué pasa
   cuando se pierde un pedido o un presupuesto? ¿Quién decide cambiar una
   herramienta? ¿Qué tendría que pasar para probar algo?
5. **Demo, solo si la piden (3 min).** Mostrar un solo recorrido: presupuesto
   público → aprobación → portal/técnico. No recorrer todo el producto.
6. **Cierre (2 min).** Agradecer. Preguntar si puedo mandar un resumen y si les
   interesa un piloto de 30 días. Acordar próximo paso concreto.

## Preguntas

- ¿Cuántos técnicos tienen y cómo se reparten las zonas?
- ¿Cuántos trabajos hacen por semana en temporada alta y baja?
- ¿Cómo llega la mayoría de los pedidos y quién los atiende?
- ¿Dónde anotan el pedido y qué datos guardan?
- ¿Cómo arman un presupuesto? ¿Cuánto tardan? ¿Qué pasa después de enviarlo?
- ¿Cómo hacen seguimiento de los presupuestos que no responden?
- ¿Cómo coordinan agenda, direcciones y cambios de último momento?
- ¿Cómo registran pagos parciales, saldos y cobros?
- ¿Qué herramientas usan y qué les falta?
- ¿Qué pasa cuando un técnico no tiene señal?
- ¿Quién toma la decisión de incorporar una herramienta?
- ¿Qué tendría que demostrarles DOVEXO para que valga la pena probarlo?

## Qué anotar

- Volumen: trabajos/semana, técnicos, zonas.
- Tiempo por presupuesto y tasa de aprobación aproximada.
- Principal pérdida: pedidos, presupuestos, cobros o coordinación.
- Herramientas actuales y quién las usa.
- Decisor y próxima fecha.
- Interés en demo/piloto: alto, medio, bajo.
- Objeciones textuales.

## Qué no prometer

- Facturación fiscal/AFIP.
- Cobros online con Mercado Pago.
- WhatsApp automático o campañas masivas.
- GPS permanente, rutas avanzadas ni SLA.
- Que la app móvil está publicada en Google Play.
- Métricas o testimonios inventados.

## Demo real disponible

- **Panel:** `https://saas-gestion-web.vercel.app/login` con la cuenta demo.
- **Presupuesto público:** existe un presupuesto pendiente del tenant demo.
  Generar/ver el enlace antes de la charla; si se aprueba, queda registrado.
- **Portal del cliente:** generar un enlace de un solo uso desde el detalle del
  cliente demo. No abrirlo antes de la demo.
- **PWA del técnico:** `https://saas-gestion-web.vercel.app/tech` con la cuenta
  del técnico demo.
- **App Android:** APK v7 instalado en el teléfono; el login de técnico está en
  `dovexo://tech`.
- La landing v7 está en local, no desplegada. No mostrarla como si estuviera en
  producción.

## Preguntas que pueden hacer y respuesta honesta

**“¿Ya está funcionando?”**
Sí, el flujo de clientes, órdenes, presupuestos, aprobación, agenda y pagos
manuales funciona. Está en etapa piloto; no tenemos cobros online ni facturación
fiscal integrada.

**“¿Cuánto sale?”**
Hay planes desde ARS 29.900/mes. Para el piloto inicial puedo ofrecer 30 días sin
costo, con acompañamiento y 3 cupos. No quiero cerrar precio antes de entender
el volumen y el uso real.

**“¿Se integra con WhatsApp?”**
La API oficial de WhatsApp está contemplada, pero requiere credenciales y
número de Meta. Hoy no está operativa de punta a punta; no la prometo como lista.

**“¿Puedo importar mis clientes?”**
Sí, CSV o XLSX con vista previa, duplicados y errores por línea. No importa
órdenes históricas todavía.

**“¿Mis técnicos lo pueden usar sin señal?”**
Sí, la PWA/app tiene cola offline para notas, materiales y fotos; sincroniza al
volver la conexión.

**“¿Es seguro? ¿Quién ve mis datos?”**
Cada empresa tiene su tenant, roles y auditoría. El backend valida la
membresía; no se confía en el tenant que manda el frontend. No hay RLS todavía:
es una defensa adicional pendiente, no la prometo como implementada.

**“¿Factura AFIP?”**
No. Hoy se registran pagos manuales; la facturación fiscal se hace por fuera.

**“¿Me lo mostrás?”**
Sí, en 3 minutos: un presupuesto que el cliente aprueba y cómo se ve del lado
del técnico y del portal.

## Si acepta seguir

1. Agradecer por WhatsApp dentro de las 2 horas y mandar un resumen de 5 líneas.
2. Proponer **piloto de 30 días, sin costo**, con 3 cupos:
   - importación de clientes;
   - configuración de servicios y horarios;
   - invitación a un técnico;
   - primera orden real;
   - seguimiento semanal.
3. Acordar día de inicio y una reunión de 30 minutos para onboarding.
4. Definir 3 métricas simples: trabajos cargados, presupuestos enviados y
   cobros registrados.
5. A los 30 días, decidir plan y continuidad. No prometer disponibilidad
   garantizada ni precio futuro.

## Si no acepta ahora

- Preguntar si puedo volver a escribir en 2-3 semanas.
- Pedir una derivación a otra empresa del rubro.
- Registrar `No_response` o `Follow-up` en `PROSPECTS.csv`.
- No insistir más de dos veces.

## Después de la entrevista

Actualizar en `PROSPECTS.csv`:

- `status`: `Interviewed`, `Pilot_candidate` o `No_response`.
- `last_contact_date`.
- `next_action` con fecha.
- `interview_notes` con el dolor principal y el decisor.
- `interest_level` y `pilot_candidate`.

No escribir datos personales sensibles en el repositorio.
