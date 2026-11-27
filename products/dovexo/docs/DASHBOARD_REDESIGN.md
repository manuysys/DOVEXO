# Rediseño del dashboard — Fase 3

**Fecha:** 2026-11-18
**Estado:** implementado en local; pendiente de verificación central y deploy.
**Alcance:** shell del panel, dashboard del owner/admin y checklist de onboarding.
**Referencias:** [`DESIGN_AUDIT.md`](DESIGN_AUDIT.md) (D-01…D-11),
[`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md), [`PROJECT_STATUS.md`](PROJECT_STATUS.md).

## 1. Problemas corregidos

| Hallazgo | Corrección |
|---|---|
| **D-08/D-09/D-10 (P0)**: overflow horizontal en 390px | Se eliminó la grilla fija de 3 columnas del hero y se reemplazó por `flex-wrap` con `min-w-0`; los KPIs pasan a `grid-cols-2` en mobile; el checklist usa header `flex-col` y botón `self-start`. Verificado con Playwright: `scrollWidth = 390`, `innerWidth = 390`, `overflow = false`. |
| D-01: KPIs duplicados (hero + 5 tarjetas) | El hero conserva 3 métricas de contexto (órdenes abiertas, presupuestos pendientes, pendiente de cobro) y la fila de tarjetas muestra 5 métricas **distintas y accionables**: clientes, turnos de hoy, sin técnico, presupuestos por vencer, finalizadas con saldo. |
| D-02: hero demasiado alto y KPIs apretados | Hero más compacto (`p-5/sm:p-7`), acciones en columna en mobile, métricas en `flex-wrap`. |
| D-03: superficie menta fuera de paleta | Checklist en `bg-primary/5` con borde `primary/15`, iconografía y enlaces en `primary`/`success`. |
| D-04: CTA ámbar y dos CTAs de igual peso | CTA principal azul (`primary`), secundario outline; el header del panel usa el mismo criterio. |
| Paleta legacy en el shell | Sidebar `bg-deep`, ítem activo `bg-primary/20` con punto teal, header `bg-bg/85`, selector de empresa con tokens nuevos, banner demo en `warning-soft`. |
| Estados y textos legacy | `text-slate`→`text-text-2`, `text-ink`→`text-text`, `divide-mist`→`divide-border`, errores a `danger-soft`/`danger-strong`. |

## 2. Composición del dashboard

1. **Hero de operación**: saludo, empresa, 3 métricas de contexto y acciones (nuevo presupuesto, asistente).
2. **Primeros pasos**: checklist de onboarding con progreso real y acción por paso.
3. **KPIs accionables**: 5 tarjetas con enlace de acción y tono semántico.
4. **Hoy / Requiere atención / Actividad reciente**: agenda del día, alertas operativas con enlaces y notificaciones.
5. **Accesos rápidos**: 6 módulos con iconografía Lucide y hover con token teal.

## 3. Evidencia

- Capturas locales: `.local/design-audit/dashboard-new-1440.png` y
  `dashboard-new-390.png`.
- Overflow mobile medido con Playwright: `overflow: false`.
- `pnpm typecheck` OK; `pnpm test` 244 pruebas OK; build pendiente de la
  verificación final del bloque (los agentes de módulos están en curso).
- Producción no se actualizó.

## 4. Pendientes

- Verificación visual de `/agenda`, `/orders`, `/quotes`, `/payments`,
  `/customers` (agentes en curso).
- Revisión de contraste del banner demo y del sidebar en 360px.
- Actualizar `PROJECT_STATUS.md` y `CHANGELOG.md` al cerrar el bloque.
