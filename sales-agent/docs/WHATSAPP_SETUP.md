# WhatsApp y Meta — configuración del Sales Agent

**Estado:** integración preparada para Cloud API, pero **todavía no probada
contra Meta**. Sin `WHATSAPP_ACCESS_TOKEN` y `WHATSAPP_PHONE_NUMBER_ID` el
sistema usa `ConsoleWhatsAppProvider`: registra los mensajes como `simulated` y
no sale a la red.

## 1. Variables de entorno

Copiar `sales-agent/backend/.env.example` a `sales-agent/backend/.env` y
completar solo en el entorno local o en el gestor de secretos. **No versionar
`.env`.**

```dotenv
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_SENDER_PHONE=
WHATSAPP_API_VERSION=v23.0
WHATSAPP_TIMEOUT_SECONDS=30
WHATSAPP_FIRST_CONTACT_TEMPLATE=
WHATSAPP_TEMPLATE_LANGUAGE=es_AR
FOUNDER_PHONE=
```

- `WHATSAPP_ACCESS_TOKEN`: token de la app de Meta con permiso para enviar.
- `WHATSAPP_PHONE_NUMBER_ID`: ID del número de negocio, no el número visible.
- `WHATSAPP_VERIFY_TOKEN`: cadena elegida por ARVOKTA para el `GET` de
  verificación del webhook.
- `WHATSAPP_APP_SECRET`: App Secret de Meta; el webhook valida
  `X-Hub-Signature-256`. Sin este valor el `POST` falla cerrado con 503.
- `WHATSAPP_SENDER_PHONE`: número visible del remitente, solo para mostrar en la
  UI; no se usa para enviar.
- `WHATSAPP_FIRST_CONTACT_TEMPLATE`: nombre exacto de la plantilla aprobada para
  el primer contacto. Sin este valor, un envío real de primer contacto falla con
  un error claro y **no** cae a texto libre.
- `WHATSAPP_TEMPLATE_LANGUAGE`: código de idioma de la plantilla (`es_AR`).
- `FOUNDER_PHONE`: número del fundador para avisos de respuestas. Si está vacío,
  el aviso queda registrado como no enviado.

## 2. Webhook

URL pública (HTTPS) que se configura en Meta:

```text
https://<host-publico>/api/v1/webhooks/whatsapp
```

- `GET`: Meta envía `hub.mode`, `hub.verify_token` y `hub.challenge`. Si el token
  coincide, se devuelve el challenge; si no, 403. Si el token no está
  configurado, 503.
- `POST`: se valida la firma HMAC SHA-256 sobre los bytes crudos. El cuerpo tiene
  un tope de 1 MB; los mensajes se guardan de forma idempotente por
  `wa_message_id`. Si falta el App Secret, 503 (no se acepta tráfico sin
  verificar).
- Para desarrollo local se necesita un túnel HTTPS (por ejemplo, Cloudflare
  Tunnel o ngrok). No se debe exponer la API local directamente.

## 3. Plantilla de primer contacto

Meta no permite enviar texto libre a un contacto que nunca escribió. El primer
contacto debe usar una **plantilla aprobada** por Meta. El provider ya soporta
`send_template`; configurá `WHATSAPP_FIRST_CONTACT_TEMPLATE` con el nombre exacto.
Si falta, el envío real falla con un error claro y no se envía texto libre. La
plantilla aprobada debe declarar **dos parámetros de body**: `{{1}}` = nombre de
la empresa y `{{2}}` = nombre del producto (DOVEXO). El envío de follow-up
dentro de la ventana de atención sigue usando texto.

Plantilla sugerida para aprobar en Meta (los parámetros exactos se ajustan al
texto que se quiera enviar):

```text
Hola {{1}}, soy Juan Manuel de ARVOKTA. Vi que {{2}} trabaja en servicios
técnicos. Estamos ayudando a empresas como la suya a ordenar clientes,
presupuestos, agenda y pagos con DOVEXO. ¿Le interesa una demo breve?
Si prefiere no recibir más mensajes, responda BAJA.
```

El sistema exige aprobación humana antes de enviar y no hace envíos masivos en
frío. La plantilla no reemplaza esa aprobación.

## 4. Probar sin credenciales (modo consola)

1. Iniciar API, worker y web.
2. Crear una oportunidad desde la ficha de una empresa.
3. Generar un mensaje, revisarlo y aprobarlo.
4. Presionar **Enviar**: el mensaje queda `simulated`, con `vía console` y
   “Modo simulado”; no sale a WhatsApp.
5. En `/messages`, usar **Simular entrante** con un teléfono de prueba. El bot
   guarda el entrante y responde de forma determinística.
6. Verificar el hilo, la actividad y el estado del lead en CRM.

La API de simulación es solo para admin:

```text
POST /api/v1/whatsapp/simulate/inbound
{ "phone": "+549XXXXXXXXXX", "name": "Prueba", "text": "Hola" }
```

No usar números de terceros para las pruebas.

## 5. Checklist para activar Meta

- [ ] Número de WhatsApp Business dedicado y verificado.
- [ ] App de Meta con WhatsApp Cloud API y token de sistema.
- [ ] `WHATSAPP_PHONE_NUMBER_ID` y `WHATSAPP_ACCESS_TOKEN` cargados.
- [ ] Webhook público con HTTPS y `WHATSAPP_VERIFY_TOKEN` coincidente.
- [ ] `WHATSAPP_APP_SECRET` cargado; probar que un POST sin firma devuelve 403.
- [ ] Plantilla de primer contacto aprobada en Meta; cargar
  `WHATSAPP_FIRST_CONTACT_TEMPLATE` con dos parámetros (`{{1}}` empresa,
  `{{2}}` producto) y probar un envío autorizado.
- [ ] `FOUNDER_PHONE` configurado y probado con un mensaje autorizado.
- [ ] Probar con un número propio de prueba antes de contactar empresas.
- [ ] Revisar opt-in, lista de no contacto y límites de frecuencia.
- [ ] No enviar en frío ni en masa; mantener la aprobación humana.

## 6. Límites y privacidad

- No se confunde un teléfono publicado con un WhatsApp: la confirmación es
  manual y queda registrada.
- Los contactos con `do_not_contact` o en la lista de supresiones no reciben
  mensajes.
- Los mensajes generados no se envían solos; el primer contacto requiere
  aprobación.
- El bot solo responde a mensajes entrantes, dentro de la ventana de atención de
  Meta. No inicia conversaciones.
- Los logs no deben incluir tokens, App Secret ni cuerpos completos de mensajes
  en producción.
