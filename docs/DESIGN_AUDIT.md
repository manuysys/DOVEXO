# Auditoría visual — DOVEXO (Fase 0)

**Fecha:** 2026-11-18
**Alcance:** landing, login, dashboard, PWA del técnico. Evidencia capturada con
Playwright MCP contra producción.
**Capturas:** `.local/design-audit/` (no versionadas).

## Método

- Playwright MCP sobre `https://saas-gestion-web.vercel.app`.
- Resoluciones: 1920×1080, 1440×900, 390×844 (landing y dashboard).
- Login demo (`demo@saasgestion.com`) para el panel.
- PWA `/tech` con la sesión resultante (owner) para observar el estado de error.
- No se modificaron datos de la demo.

## Hallazgos por pantalla

### Landing — desktop 1440

| # | Hallazgo | Severidad |
|---|---|---|
| L-01 | El hero ocupa toda la pantalla y el titular de 5 líneas domina; el producto (mockups) queda chico y desconectado del texto | P1 |
| L-02 | La escena 3D isométrica es casi invisible (líneas teal muy bajas sobre navy); no comunica el flujo | P1 |
| L-03 | No hay captura del dashboard real ni del teléfono; solo tres tarjetas flotantes con texto chico | P1 |
| L-04 | Las credenciales demo están en el hero, compitiendo con el CTA y ocupando espacio comercial | P1 |
| L-05 | CTA primario en ámbar (marca vieja) y secundario outline; jerarquía mejorable | P1 |
| L-06 | “Prueba gratuita de 14 días: en implementación. Hoy no se cobra al registrarse.” es honesto pero suena a beta; reescribir | P2 |
| L-07 | Tarjetas flotantes con tipografía muy chica (10–12px) y contraste bajo | P2 |
| L-08 | El aviso “Datos ilustrativos” está bien ubicado, pero el conjunto no se lee como producto real | P2 |

### Landing — mobile 390

| # | Hallazgo | Severidad |
|---|---|---|
| L-09 | Hero largo: titular + descripción + 2 CTA + credenciales antes de ver producto | P1 |
| L-10 | El mockup flotante aparece cortado al final del viewport | P1 |
| L-11 | El bloque de credenciales ocupa ~120px y empuja el producto fuera de pantalla | P1 |
| L-12 | La escena 3D no se muestra (correcto por rendimiento) pero no hay reemplazo visual | P2 |

### Login

| # | Hallazgo | Severidad |
|---|---|---|
| A-01 | Card centrada correcta, pero credenciales demo dentro del formulario agregan ruido | P2 |
| A-02 | Botón deshabilitado “Ingresando…” con gris poco claro | P2 |
| A-03 | Fondo paper cálido y marca teal: no coincide con la paleta propuesta | P1 |

### Dashboard — desktop 1440

| # | Hallazgo | Severidad |
|---|---|---|
| D-01 | KPIs duplicados: hero (3 métricas) + fila de 5 tarjetas con las mismas | P1 |
| D-02 | Hero oscuro muy alto; los KPIs quedan apretados a la derecha | P1 |
| D-03 | Superficie “Primeros pasos” en verde menta fuera de la paleta | P1 |
| D-04 | CTA principal en ámbar (marca vieja) y dos CTAs de peso similar | P1 |
| D-05 | “Pendiente de cobro $0,00” con pago parcial registrado: revisar definición/dato mostrado | P1 (dato) |
| D-06 | La primera pantalla no muestra agenda ni “requiere atención” completos | P2 |
| D-07 | Navegación lateral correcta pero densa; iconos y labels consistentes | OK |

### Dashboard — mobile 390

| # | Hallazgo | Severidad |
|---|---|---|
| D-08 | **Overflow horizontal**: el contenido excede 390px y aparece scroll lateral | **P0** |
| D-09 | El hero se corta a la derecha; los KPIs no caben | P0 |
| D-10 | “Primeros pasos” desborda y corta el botón “Continuar configuración” | P0 |
| D-11 | Banner demo ocupa 3 líneas; aceptable pero se puede compactar | P2 |

### PWA `/tech` con sesión de owner

| # | Hallazgo | Severidad |
|---|---|---|
| P-01 | Muestra “No se pudieron cargar tus trabajos” (403 de `/technician/work-orders`) en vez de explicar que la sección es para técnicos o pedir login | **P0** (UX) |
| P-02 | El botón “Salir” no cerró la sesión en la prueba (la vista siguió con el owner) | P1 |
| P-03 | El estado de error está bien diseñado (banner rojo + reintentar), pero el mensaje es genérico | P2 |

## Problemas transversales

1. **Paleta**: la app usa teal/ámbar/paper; el brief define azul `#315EFB` como
   primario. Falta un sistema de tokens único y semántico.
2. **Estados**: no hay matriz sistemática de loading/empty/error/sin permiso/
   offline; cada módulo improvisa.
3. **Tipografía**: conviven Space Grotesk (display) y Geist; faltan utilidades
   de escala y números tabulares en importes.
4. **Componentes**: 13 componentes UI con estilos ad-hoc en las páginas;
   faltan tabla, select, switch, timeline, sheet, filter-bar, etc.
5. **Responsive**: el dashboard desborda en 390px; hay que auditar todas las
   rutas con la matriz completa.
6. **Accesibilidad**: falta revisión sistemática (foco, contraste, teclado).
7. **Performance**: baseline pendiente de Lighthouse formal (se hará al cerrar
   la Fase 1).

## Plan de corrección inmediato (Fase 1)

1. Tokens nuevos (paleta, tipografía, espaciado, radios, sombras, motion) con
   alias de compatibilidad.
2. Componentes base: Button, Card, Badge, Input, Table, Select, Switch, Sheet,
   Timeline, FilterBar.
3. Corregir el overflow del dashboard en mobile (P0) como parte del rediseño
   del shell.
4. PWA: mensaje de rol correcto + redirección a login (P0) en la Fase 5.

## Evidencia

- `landing-1920.png`, `landing-1440.png`, `landing-390.png`
- `dashboard-1440.png`, `dashboard-390.png`
- `tech-390.png`
