# Estado de ARVOKTA

**Última actualización:** 2026-11-27
**Fase:** consolidación de la empresa en un monorepo; DOVEXO en producción y
ARVOKTA Sales Agent en desarrollo avanzado.

## Productos

### DOVEXO

Producto comercial de gestión para empresas de servicios técnicos. Está
desplegado en Vercel y Neon. Su estado detallado, pendientes y verificaciones
viven en [`products/dovexo/docs/PROJECT_STATUS.md`](../products/dovexo/docs/PROJECT_STATUS.md).

- Frontend: https://saas-gestion-web.vercel.app
- API: https://saas-gestion-api.vercel.app
- Pendiente crítico: aplicar la migración de planes `ad1d19f0512b` en Neon y
  cerrar los hallazgos de la auditoría externa del 2026-11-26.

### ARVOKTA Sales Agent

Sistema interno de prospección comercial, investigación de empresas, scoring y
CRM. Es multiproducto: DOVEXO es el primer producto configurado, no código
hardcodeado. Usa Next.js + FastAPI + SQLite en local, worker con cola persistente
y fuentes gratuitas (OpenStreetMap/Overpass, CSV y alta manual).

**Fases 1, 2A, 2B, 4 y 5 completadas y verificadas localmente:** login,
dashboard, productos, campañas, worker persistente, seed de DOVEXO,
descubrimiento provincial con OpenStreetMap/Overpass, empresas, contactos, alta
manual, deduplicación, importación CSV, campañas con una corrida por provincia,
exportación CSV, oportunidades, scoring determinístico, mensajes con aprobación
humana, WhatsApp con provider de consola y simulador, bot de respuestas, CRM,
actividades, supresiones y métricas reales.

Búsquedas reales: Córdoba/HVAC (5 empresas) y Buenos Aires/instalaciones
eléctricas (5 empresas nuevas, 0 duplicados). 106 tests backend, 102 frontend y
build de 21 rutas. La API corre en `localhost:8001` y la web en `localhost:3001`.

El flujo local completo se verificó: empresa → oportunidad → score 68/80 →
mensaje → aprobación → envío simulado → entrante simulado → respuesta del bot →
conversación visible en `/messages` → CRM y dashboard actualizados. **No se
envió ningún mensaje real a terceros.**

Pendientes del Sales Agent:

- Cargar credenciales de Meta/WhatsApp y probar el webhook real con un número
  autorizado; definir la plantilla de primer contacto.
- Ejecutar el relevamiento nacional por provincia/rubro y exportar el dataset.
- Implementar el enriquecimiento de sitios y evidencias (fase 3).
- Agregar paginación a oportunidades (hoy se muestran hasta 100).
- `FOUNDER_PHONE` no está configurado; las notificaciones al fundador quedan
  registradas como no enviadas.

- Especificación: [`sales-agent/docs/SPEC.md`](../sales-agent/docs/SPEC.md)
- Estado de implementación:
  [`sales-agent/docs/IMPLEMENTATION_STATUS.md`](../sales-agent/docs/IMPLEMENTATION_STATUS.md)
- Configuración de WhatsApp:
  [`sales-agent/docs/WHATSAPP_SETUP.md`](../sales-agent/docs/WHATSAPP_SETUP.md)

## Reestructuración del repositorio (2026-11-27)

- La raíz pasó a ser **ARVOKTA**.
- DOVEXO se movió a `products/dovexo/` conservando su historial (`git mv`).
- Se creó `sales-agent/` para el sistema interno.
- Se actualizaron los paths de CI, scripts, `.opencode` y documentación.
- Los deployments de DOVEXO requieren actualizar el Root Directory en Vercel a
  `products/dovexo/apps/web` y `products/dovexo/apps/api`.

## Pendiente de empresa

- [x] Root directories de Vercel actualizados y deploy de DOVEXO verificado
  (2026-11-27): web production `kie45n9mj` Ready; API production `7r0gb50fp`
  Ready; API conectada a GitHub; landing con 19.900/39.900/64.900 y login demo
  `200` contra Vercel + Neon. Rama `feat/arvokta-monorepo` mergeada a `main`.
- [x] Completar la Fase 1 del Sales Agent: login, dashboard, productos,
  campañas, worker, seed de DOVEXO y tests (33 backend + 29 frontend).
- [x] Implementar la Fase 2A del Sales Agent: descubrimiento provincial
  OSM/Overpass, empresas, contactos, alta manual y deduplicación (70 tests
  backend + 53 frontend; búsqueda real con 5 empresas).
- [x] Implementar la Fase 2B del Sales Agent: CSV, campañas con una corrida por
  provincia, revisión de duplicados y exportación CSV (84 tests backend + 75
  frontend; campaña real de Buenos Aires con 5 empresas).
- [x] Implementar scoring, mensajes, WhatsApp (consola/simulador), bot de
  respuestas y CRM del Sales Agent (106 tests backend + 102 frontend; flujo local
  verificado; sin envíos reales).
- [ ] Implementar el enriquecimiento de sitios y evidencias del Sales Agent.
- [ ] Cargar credenciales Meta/WhatsApp, plantilla de primer contacto y número
  del fundador; probar un envío real autorizado.
- [ ] Ejecutar el relevamiento nacional y exportar el dataset de empresas.
- [ ] Cerrar la auditoría externa de DOVEXO (legal, exportación CSV, soporte,
  backups).
- [ ] Aplicar la migración de planes de DOVEXO en Neon.

## Regla

No declarar terminado un producto por compilar. Cada producto debe tener
persistencia, permisos, validaciones, pruebas y documentación propia.
