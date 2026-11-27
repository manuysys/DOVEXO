# Benchmark competitivo (GO TO MARKET)

**Última actualización:** 2026-11-14
**Fuente de datos:** resumen de `docs/COMPETITOR_BENCHMARK.md` (2026-11-09) y
`docs/COMPETITIVE_ANALYSIS.md` (verificación del 2026-11-08). **Los datos de
competidores no fueron reverificados desde esa fecha**; antes de usarlos en una
decisión comercial, repetir la verificación con el skill `competitive-research`.

---

## 1. Investigación previa existente en docs/

- **`docs/COMPETITIVE_ANALYSIS.md`** (2026-11-08): relevamiento con fuente
  oficial, fecha y clasificación por competidor. Fuente única de datos.
- **`docs/COMPETITOR_BENCHMARK.md`** (2026-11-09): tabla sintética y lectura
  estratégica; **no agrega datos**, remite a la fuente.
- **`docs/CUSTOMER_RESEARCH.md`** (2026-11-08): hipótesis H1-H7 y plan de 10
  entrevistas; **0 entrevistas realizadas**.

### Conclusiones clave del relevamiento previo

- De los 8 competidores locales relevados, **6 están pensados para mostrador**
  (talleres de reparación de celulares, electrodomésticos, mecánica). Solo
  **Ordion** y **AppTec** atacan el servicio a domicilio de forma nativa: ese
  es el espacio donde compite DOVEXO.
- Precio de entrada: DOVEXO Starter (19.900 desde el 2026-11-24) queda por
  debajo de Ordion Emprendedor (25.000, incluye 3 técnicos + 1 admin) y de
  AppTec Starter (49.000). La comparación de capacidad no es directa (1 usuario
  de oficina y 1 técnico en DOVEXO Starter).
- Diferenciales posibles con base en lo implementado: presupuesto público con
  precio histórico (ADR-008), transparencia de límites, PWA sin tienda de
  aplicaciones. **No declarar un diferencial si la función no está
  "implementada y probada"** en `docs/FEATURE_TRUTH_MATRIX.md`.

### Competidores con datos relevados (2026-11-08, por reverificar)

| Competidor | Segmento principal | Entrada (ARS/mes) | Techo | Técnicos/usuarios |
|---|---|---|---|---|
| Ordion | Servicios técnicos a domicilio | 25.000 | 150.000 | 3 téc. + 1 admin (Emprendedor) hasta ilimitado |
| AppTec | Técnicos a domicilio e ISPs | 49.000 | 85.000 | 1 (Gratis), 3 (Starter), 20 (Pro), 50+ (Enterprise) |
| OrdenSoft | Talleres de reparación | 24.000 | 49.000 | 1 en Básico; multi-usuario desde Profesional |
| GestiónPro | Talleres de electrónica y línea blanca | 34.500 | 86.500 | Multi-PC en red |
| STApp | Talleres de celulares y electrónica | 19.999 | 19.999 | 1 en Free; ilimitados en Profesional |
| Nixora CRM | Celulares, PC y electrónica | 19.900 | 49.900 | 1 en Básico; hasta 5 en Pro |
| Mecaris | Talleres mecánicos | 28.000 (+8.000/módulo) | 44.000 | Usuarios y órdenes sin límite en Base |
| TallerOS (talleros.ar) | Talleres mecánicos y lubricentros | 45.000 | 150.000 | Usuarios ilimitados desde PRO |
| TallerOS (talleros.io) | Talleres multi-rubro | 18.000 | 35.000 | 1 (Gratis), 5 (Starter), 15 (Profesional) |

Detalle completo (WhatsApp, IA, app, offline, plan free) en
`docs/COMPETITOR_BENCHMARK.md` §2.

## 2. Estructura de comparación (dimensiones del mandato §13)

Al actualizar el benchmark, comparar cada competidor en estas dimensiones
(fila DOVEXO actualizada el 2026-11-24 con los precios v2 de ADR-027; el
relevamiento de competidores sigue al 2026-11-08):

| Dimensión | DOVEXO (estado real) | Qué verificar del competidor |
|---|---|---|
| Usuarios de oficina | 1 / 3 / 5 según plan (incluye al dueño) | Cantidad incluida por plan |
| Técnicos | 1 / 5 / 20 según plan (no ocupan cupo de oficina) | Cantidad incluida por plan |
| Órdenes | 100 / 1.000 / 10.000 nuevas por mes (no limita el historial) | Límite de órdenes u operaciones |
| Almacenamiento | Fotos en PostgreSQL (BYTEA; migrar a S3 pendiente) | Límite de fotos/archivos y dónde almacenan |
| IA | Asistente con datos reales (Groq/fallback determinista, solo lectura), incluido sin tokens; límite mensual por empresa igual para todos | IA propia, chatbot o ninguna |
| WhatsApp | No operativo (sin credenciales de Meta) | Integración real o "manual" |
| Automatizaciones | Reglas por evento con notificaciones in-app | Notificaciones automáticas, recordatorios |
| Soporte | Contacto directo con el fundador (sin SLA) | Canal, horario, SLA |
| Integraciones | Mercado Pago no implementado; email sin dominio verificado | Pagos online, facturación, WhatsApp |
| Precio | 19.900 / 39.900 / 64.900 (evaluación de 14 días; sin cobro automático) | Entrada y techo, con fecha de verificación |

## 3. Filas por categoría de competidor

| Categoría | Ejemplos | Estado de investigación |
|---|---|---|
| Software global de field service (no local) | ServiceTitan, Jobber | **Pendiente.** Jobber es mencionado como referencia en `MEJORAS_Y_PROGRESO.txt` §9 sin investigación en el repo. Popularidad internacional no equivale a aplicabilidad en Argentina: relevar foco en procesos, no en diseño. |
| Soluciones locales para servicios técnicos a domicilio | Ordion, AppTec | Relevadas 2026-11-08. Competencia directa del segmento. |
| Soluciones locales para talleres (mostrador) | OrdenSoft, GestiónPro, STApp, Nixora, Mecaris, TallerOS | Relevadas 2026-11-08. Rubro adyacente; sirven de referencia de precios, no de dominio. |
| Referencias locales pendientes | SistemaLoop, Lumex | **Pendiente de relevar** (mencionadas en `MEJORAS_Y_PROGRESO.txt` §9 sin datos en el repo). |
| Status quo (competencia real en la calle) | Planillas Excel + cuaderno + grupos de WhatsApp | El competidor más frecuente en PyMEs pequeñas. Validar en entrevistas H2 (bloque F: herramientas actuales). |
| Gestorías/consultoras PyME (software a medida o gestión tercerizada) | Varias, sin relevamiento | **Pendiente.** Pueden competir por presupuesto de administración PyME. |

## 4. Reglas de uso (de `docs/COMPETITOR_BENCHMARK.md` §6)

1. Un dato de competidor solo entra si está en `COMPETITIVE_ANALYSIS.md` con
   fecha y clasificación de fuente.
2. No comparar precio sin indicar la fecha de verificación del competidor.
3. No usar funciones de un competidor como "lo que el cliente quiere" sin
   pasar por entrevistas.
4. No declarar diferenciales de DOVEXO que no estén implementados y probados.
5. Rangos de precio "validados en entrevistas" no existen todavía: la
   investigación es de escritorio, la validación real viene de las
   entrevistas de este GO TO MARKET.

## 5. Investigación pendiente

- Reverificar precios y funciones de los 8 competidores relevados (los
  publicados datan del 2026-11-08).
- Relevar SistemaLoop, Lumex y Jobber con el skill `competitive-research` y
  agregarlos a `COMPETITIVE_ANALYSIS.md` con la misma metodología.
- Detectar competidores nuevos que aparezcan en las entrevistas (bloque F) y
  registrarlos con fuente.
