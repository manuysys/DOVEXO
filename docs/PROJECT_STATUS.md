# Estado de ARVOKTA

**Última actualización:** 2026-11-27
**Fase:** consolidación de la empresa en un monorepo; DOVEXO en producción y
ARVOKTA Sales Agent en desarrollo.

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

**Fase 1 completada y verificada localmente:** login, dashboard, productos,
campañas, worker persistente, seed de DOVEXO, 33 tests de backend, 29 de frontend
y build de 18 rutas. La API corre en `localhost:8001` y la web en
`localhost:3001`. El descubrimiento de empresas queda para la Fase 2; no se
cargan datos ficticios.

- Especificación: [`sales-agent/docs/SPEC.md`](../sales-agent/docs/SPEC.md)
- Estado de implementación:
  [`sales-agent/docs/IMPLEMENTATION_STATUS.md`](../sales-agent/docs/IMPLEMENTATION_STATUS.md)

## Reestructuración del repositorio (2026-11-27)

- La raíz pasó a ser **ARVOKTA**.
- DOVEXO se movió a `products/dovexo/` conservando su historial (`git mv`).
- Se creó `sales-agent/` para el sistema interno.
- Se actualizaron los paths de CI, scripts, `.opencode` y documentación.
- Los deployments de DOVEXO requieren actualizar el Root Directory en Vercel a
  `products/dovexo/apps/web` y `products/dovexo/apps/api`.

## Pendiente de empresa

- [ ] Actualizar los root directories de Vercel y verificar el deploy de DOVEXO
  desde la nueva estructura.
- [x] Completar la Fase 1 del Sales Agent: login, dashboard, productos,
  campañas, worker, seed de DOVEXO y tests (33 backend + 29 frontend).
- [ ] Implementar la Fase 2 del Sales Agent: descubrimiento OSM/Overpass, CSV,
  alta manual y deduplicación.
- [ ] Cerrar la auditoría externa de DOVEXO (legal, exportación CSV, soporte,
  backups).
- [ ] Aplicar la migración de planes de DOVEXO en Neon.

## Regla

No declarar terminado un producto por compilar. Cada producto debe tener
persistencia, permisos, validaciones, pruebas y documentación propia.
