# Primeros contactos — listos para enviar (2026-11-19)

**Estado:** listo para que el fundador envíe a mano. Ningún mensaje fue enviado.
**Fuente:** `OUTREACH_DRAFTS_2026-11-14.md` y `PROSPECTS.csv` (verificados el
2026-11-14). No agregar datos que no estén en el CSV.
**Regla:** enviar de a uno, personalizar el nombre si se conoce y registrar el
envío en `PROSPECTS.csv` (`status=Contacted`, `last_contact_date`, `next_action`).

## Orden de envío

| Orden | Prospecto | Canal | Contacto |
|---|---|---|---|
| 1 | P-003 El Mejor Clima | WhatsApp | +54 9 11 5570-3216 |
| 2 | P-002 TOTALAIR | WhatsApp | +54 9 11 5713-2105 |
| 3 | P-001 UBE Refrigeración | Llamada | +54 11 5813-4420 |

## 1. P-003 — El Mejor Clima (WhatsApp)

**Abrir WhatsApp con:** https://wa.me/5491155703216

```text
Hola, soy Juan Manuel. Estoy desarrollando una plataforma para empresas de
climatización: clientes, presupuestos, órdenes y técnicos conectados en un
solo lugar.

Vi el trabajo de El Mejor Clima (las reseñas y el servicio 24 h me llamaron
la atención) y estoy charlando con negocios del rubro de Zona Oeste para
entender cómo organizan el día a día: cómo reciben pedidos, cómo siguen los
presupuestos y cómo coordinan las visitas.

¿Te parece que hable con la persona que se encarga de eso? Una charla corta
de 15 o 20 minutos, sin compromiso. No es una venta: quiero conocer la
experiencia de ustedes en el rubro.
```

## 2. P-002 — TOTALAIR (WhatsApp)

**Abrir WhatsApp con:** https://wa.me/5491157132105

```text
Hola, soy Juan Manuel. Estoy desarrollando una plataforma para empresas de
servicios técnicos de climatización: clientes, presupuestos, órdenes de
trabajo y técnicos conectados en un solo lugar.

Encontré TOTALAIR en Haedo y estoy charlando con empresas del rubro de Zona
Oeste para entender cómo trabajan hoy: cómo reciben los pedidos, cómo arman
los presupuestos y cómo organizan las visitas de los técnicos.

¿Con quién de ustedes charla ese tema? Serían 15 o 20 minutos, sin
compromiso. No quiero vender nada en esta primera conversación: me interesa
conocer cómo les va con la parte administrativa.
```

## 3. P-001 — UBE Refrigeración (llamada)

**Llamar al:** +54 11 5813-4420

```text
Hola, buenas tardes. Soy Juan Manuel, de Haedo. Estoy desarrollando una
plataforma para empresas de refrigeración y me gustaría charlar 15 minutos
con la persona que organiza los presupuestos y las visitas. ¿Me puede pasar
el nombre de esa persona y un WhatsApp para coordinar? No es una venta:
estoy conociendo cómo trabaja el rubro antes de mostrar nada.
```

Si dan un WhatsApp, enviar el mismo texto de TOTALAIR cambiando el nombre de
la empresa por UBE Refrigeración.

## Seguimiento (solo si no responden en 3-4 días)

Máximo 2 seguimientos; después pasar a `No_response` y dejar la puerta abierta.

```text
Hola [NOMBRE], te escribo de nuevo por la charla de la que te hablé: estoy
conociendo cómo trabajan las empresas del rubro antes de definir el producto.
Tu experiencia con [EMPRESA] me sirve mucho.

Si estos días estás a full, entiendo perfectamente. ¿Dejo el tema para más
adelante o te interesa coordinar algo rápido? Una respuesta corta me alcanza.
```

## Después de cada envío

Actualizar en `docs/GO_TO_MARKET/PROSPECTS.csv`:

- `status`: `Contacted`.
- `last_contact_date`: fecha real del envío.
- `next_action`: `Seguimiento 1` con la fecha, o `Coordinar entrevista` si responde.

No prometer WhatsApp automático, email, push, GPS ni cobros online: no están
operativos para el cliente. Ver `DEMO_SCRIPT.md` §5 antes de una demo.
