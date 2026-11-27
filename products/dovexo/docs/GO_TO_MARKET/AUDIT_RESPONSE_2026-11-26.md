# Auditoría externa 2026-11-26 — verificación y plan

**Fuente:** devolución del auditor externo sobre la propuesta y el contenido
público de DOVEXO. No pudo autenticarse ni completar formularios desde su
entorno; la revisión de la experiencia real queda pendiente de una grabación.

## 1. Verificación de hallazgos

| Hallazgo | Estado | Evidencia |
|---|---|---|
| Precios viejos 29.900/59.900/99.900 y marca “Arreglo” | **No reproducible en producción** | El HTML de `https://saas-gestion-web.vercel.app` muestra 19.900/39.900/64.900, no contiene 29.900/59.900/99.900, “Arreglo” ni `arreglo.com.ar`. Es caché o una URL de deployment vieja. |
| Contradicción sobre la prueba gratuita | **Corregido** | `/terms` decía “prueba gratuita de 14 días”; ahora dice “acceso de evaluación”. La landing ya usaba “acceso de evaluación”. |
| Páginas legales provisionales | **Confirmado; pendiente de abogado** | El layout legal muestra “Borrador a revisar por asesor legal”; privacidad dice región pendiente y backups a definir. No se debe declarar revisado sin abogado. |
| Sin exportación completa | **Corregido** (2026-11-27) | Se implementaron `GET /api/v1/exports/customers.csv`, `/exports/orders.csv`, `/exports/quotes.csv` y `/exports/payments.csv` con permisos por rol (`owner`/`admin`/`dispatcher`; `viewer` y `technician` 403), aislamiento por tenant, CSV UTF-8 con BOM, cabeceras en español, fechas de Buenos Aires, `Decimal` de 2 decimales y auditoría `export_downloaded`. Web en `/settings/export`. Verificado en producción: cuatro endpoints 200 y descarga de `clientes-2026-11-27.csv` desde la web. Falta la eliminación de datos del tenant. |
| Sin soporte formal ni tiempos | **Confirmado; pendiente de definición** | La FAQ no define canal ni tiempos. Propuesta: email/WhatsApp directo durante el piloto, respuesta objetivo 48 h hábiles, sin SLA. |
| Sin backups/SLA definidos | **Confirmado; pendiente de operación** | No hay backup propio verificado; `NEON_DATABASE_URL` no está configurada en GitHub. Propuesta: backup diario, retención 7 días y prueba de restauración mensual antes de datos reales. |
| Copy “cobrá” | **Corregido** | `brand.description` ahora dice “registrá pagos. Controlá saldos pendientes…”. |
| Email `hola@arreglo.com.ar` | **No reproducible** | El HTML actual no contiene ese correo. El sitio usa `hola@arvokta.com`; falta confirmar que el buzón esté activo y monitoreado. |

## 2. Corregido y desplegado

- Términos: se eliminó la promesa de “14 días” y se unificó con “acceso de
  evaluación”; se actualizó la fecha a 2026-11-26.
- Copy comercial: se reemplazó “cobrá” por “registrá pagos y controlá saldos” en
  la descripción de marca.
- Deploy web en producción (`https://saas-gestion-web.vercel.app`).

## 3. Pendiente y decisiones

1. **Legal:** completar privacidad/términos con región de alojamiento (Vercel +
   Neon `gru1`), backups, retención, exportación y eliminación. Requiere revisión
   de abogado; no declarar “revisado” antes.
2. **Exportación CSV:** ~~implementar descargas de clientes, órdenes, presupuestos
   y pagos con permisos, aislamiento por tenant y pruebas~~. **Hecho el
   2026-11-27** (ADR-028); ver "Actualización 2026-11-27". Queda pendiente la
   eliminación de datos del tenant.
3. **Soporte:** definir email/WhatsApp monitoreado y tiempo objetivo. Propuesta:
   respuesta en 48 h hábiles durante el piloto, sin SLA.
4. **Backups:** configurar `NEON_DATABASE_URL`, ejecutar un backup real y probar
   la restauración. Sin esa prueba no se puede prometer continuidad.
5. **Grabación para el auditor:** el auditor no puede autenticarse; la evidencia
   tiene que ser un video o una secuencia de capturas con los seis recorridos.

## Actualización 2026-11-27

Se cerró la exportación CSV. Nuevos endpoints
`/api/v1/exports/{customers,orders,quotes,payments}.csv`, con roles
`owner`/`admin`/`dispatcher`, `viewer` y `technician` con 403, aislamiento por
tenant, UTF-8 con BOM, cabeceras en español, fechas de
`America/Argentina/Buenos_Aires`, importes con `Decimal` de 2 decimales,
neutralización solo en la salida, streaming y auditoría `export_downloaded`. La
web expone `/settings/export` con cuatro tarjetas. Detalle en ADR-028 y en
`CHANGELOG.md` (entrada 2026-11-27).

Verificado en producción el 2026-11-27 con `demo@saasgestion.com`: los cuatro
endpoints respondieron 200, con `Content-Disposition` correcto
(`clientes-2026-11-27.csv`), BOM `EF BB BF` y descarga válida desde la web sin
errores de consola. El 403 por rol y el aislamiento entre tenants se probaron
solo en tests locales, no en producción.

**Siguen pendientes**, sin cambios:

- **Legal:** privacidad y términos con región, retención, backups y eliminación
  requieren abogado. No se revisó ni se declara revisado.
- **Soporte:** falta definir canal monitoreado y tiempo objetivo de respuesta.
- **Backups:** `NEON_DATABASE_URL` sigue sin configurar en GitHub; no hay backup
  real ni restauración probada. No se afirma continuidad.
- **Eliminación de datos del tenant:** la exportación no la cubre.

## 4. Guion de grabación para el auditor

Preparación: resetear la demo, usar una ventana limpia a 1440×900 o 1920×1080,
no mostrar contraseñas ni datos personales reales, y mantener visible la URL.

1. **Cliente y solicitud:** login demo → Clientes → Nuevo cliente (nombre
   “Cliente Auditoría”, teléfono y dirección ficticios) → guardar → Solicitudes →
   Nueva → elegir el cliente → título y prioridad → guardar → convertir a orden.
2. **Orden, técnico y turno:** abrir la orden → asignar al técnico demo → Agenda →
   nuevo turno → mostrar detección de conflicto si se superpone.
3. **Presupuesto y aprobación:** Presupuestos → Nuevo → dos ítems (diagnóstico y
   carga de gas) → enviar → copiar el link público → abrirlo en incógnito →
   aprobar → volver a la orden y mostrar el estado comercial actualizado.
4. **Técnico en campo:** `/tech` → login técnico → trabajo asignado → iniciar →
   nota, material y foto → finalizar. Mostrar la cola offline si se puede.
5. **Pago y saldo:** Pagos → registrar un pago parcial → volver a la orden y al
   dashboard para mostrar el saldo actualizado.
6. **Automatizaciones, facturación y permisos:** Automatizaciones → regla de
   ejemplo; Facturación → plan, uso y límites; Equipo → roles e invitación;
   intentar una acción no permitida con un usuario técnico.

## 5. Borrador de respuesta al auditor

Este texto es el borrador del 2026-11-26. Desde entonces se cerró la exportación
CSV: hoy corresponde decir que ya está implementada y verificada en producción
(ver "Actualización 2026-11-27").

> Gracias, muy útil. Verifiqué el HTML de producción: no aparecen los precios
> viejos ni “Arreglo”; la landing actual está con 19.900/39.900/64.900 y DOVEXO.
> Lo que ves es caché o una URL de deployment anterior; probá con
> `https://saas-gestion-web.vercel.app` y hard refresh.
>
> Tenés razón en la contradicción del trial: los términos decían 14 días y ya lo
> unifiqué a “acceso de evaluación”. También corregí la copy de cobros
> (“registrá pagos y controlá saldos”).
>
> Quedan como prioridades: completar la política legal con región, backups,
> exportación y eliminación (requiere abogado), implementar exportación CSV,
> definir soporte con tiempos y probar backups/restauración. No vamos a cobrar
> hasta cerrar esos puntos.
>
> Te paso la grabación con los seis recorridos usando la cuenta demo y datos
> ficticios. Si preferís, primero te mando un documento con capturas y el detalle
> de cada paso.
