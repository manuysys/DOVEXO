# Pricing y protocolo de validación

**Última actualización:** 2026-11-24 (precios de lanzamiento v2; ADR-027)
**Regla:** **no cambiar precios sin autorización del fundador.** Este documento
registra los precios actuales con fuente y define cómo validar disposición a
pagar en entrevistas, sin inducir.

---

## 1. Precios actuales (verificados en el código)

Fuente: `apps/web/src/lib/brand.ts` (precios y cupos que muestra la landing) y
la migración de planes `ad1d19f0512b` (`update_plan_pricing_and_demo_snapshot`),
que carga los mismos valores en la base y quita `ai_monthly_tokens` de los
límites. **No consta aplicada en Neon** al 2026-11-24. Contraste:
`apps/api/app/services/plan_limits_service.py` (validación de cupos) y
`apps/web/src/lib/marketing/pricing.ts` + `pricing.test.ts` (formato).

| Plan | Precio (ARS/mes) | Usuarios de oficina | Técnicos | Órdenes nuevas por mes | Asistente de IA |
|---|---|---|---|---|---|
| **Starter** | **19.900** | 1 | 1 | 100 | Incluido, sin tokens aparte |
| **Professional** | **39.900** | 3 | 5 | 1.000 | Incluido, sin tokens aparte |
| **Business** | **64.900** | 5 | 20 | 10.000 | Incluido, sin tokens aparte |

Notas que cambian desde la versión anterior de esta tabla:

- **Cupos separados:** `max_users` cuenta solo usuarios de oficina
  (`owner`/`admin`/`dispatcher`/`viewer`) e **incluye al dueño**;
  `max_technicians` cuenta solo técnicos. Un técnico **no** consume cupo de
  oficina. Antes ambos cupos eran el mismo número y se leían como “usuarios”.
- **Sin tokens públicos de IA:** desaparece la columna de tokens por plan. El
  asistente está incluido en los tres planes, sin costo aparte y sin cuota
  comercial publicada. Hoy hay un límite mensual de uso por empresa, **igual
  para todos los planes**, configurable en el backend (`ai_monthly_token_limit`,
  valor por defecto 200.000 tokens). Se mide internamente; `/settings/billing`
  muestra el uso de usuarios de oficina, técnicos y órdenes, no el de IA. Al
  alcanzar el tope se pausa el asistente y el resto del sistema sigue
  funcionando.
- Trial de suscripción: **14 días** (se crea `trialing` al registrar la
  empresa; hoy no se cobra automáticamente — ver `docs/PROJECT_STATUS.md`,
  "Limitaciones conocidas"). Es distinto del **piloto de 30 días** para 3
  empresas (`PILOT_PROGRAM.md`).
- Formato de presentación: ARS sin decimales, formato es-AR
  (`apps/web/src/lib/marketing/pricing.ts`).
- Antes de cotizar a un prospecto, re-verificar la landing y el código (el
  mandato pide "verificar la landing antes de cotizar"). La explicación para
  clientes está en `PLANES_EXPLICADOS.md`.

## 2. Qué incluye cada plan según lo implementado

Las **funciones son las mismas en los tres planes** (lista `featureRows` en
`apps/web/src/components/marketing/pricing.tsx`); lo que cambia son los
**límites**: usuarios de oficina, técnicos y órdenes nuevas por mes. Funciones
implementadas y verificadas (`docs/PROJECT_STATUS.md`, "Hecho y verificado"):

- Clientes e historial.
- Solicitudes y órdenes de trabajo con transiciones y auditoría.
- Presupuestos con ítems históricos, PDF y enlace público revocable.
- Agenda y asignación de técnicos.
- PWA para técnicos (sin instalar app) y app móvil Android.
- Pagos y saldo pendiente.
- Automatizaciones y notificaciones in-app.
- Asistente de IA con datos reales (Groq en producción, fallback determinista).
- Portal del cliente con enlace seguro.
- Importador de clientes CSV/XLSX y onboarding de cuatro pasos.

**Aclaraciones honestas al presentar planes** (no vender como operativo):

- WhatsApp (Cloud API) y envío real de emails no están operativos (sin
  credenciales de Meta / dominio verificado).
- Cobros online (Mercado Pago): no implementado.
- Facturación fiscal completa: fuera del MVP.
- Enforcement de límites: aplicado en órdenes nuevas por mes, usuarios de
  oficina (incluye al dueño e invitaciones pendientes) y técnicos; el
  enforcement completo en todos los endpoints está pendiente
  (ADR-011, ADR-027, `docs/PROJECT_STATUS.md` "Pendiente").
- IA: incluida en los tres planes, sin tokens comerciales. No ejecuta acciones y
  tiene un límite mensual de uso por empresa igual para todos; si se alcanza, se
  pausa el asistente hasta el mes siguiente.
- Precios y cupos de la base: la migración `ad1d19f0512b` **no consta aplicada
  en Neon** al 2026-11-24. No cotizar contra producción sin verificar la fila de
  `plans` primero.

## 3. Protocolo de validación en entrevistas

**NO preguntar "¿pagarías X?" directamente.** Las personas dicen que sí por
cortesía. Orden recomendado:

1. **Valor percibido primero.** Usar el bloque G del guion
   (`INTERVIEW_TEMPLATE.md`): qué problema resolvería primero, qué impacto
   tiene hoy, cuánto tiempo o dinero le cuesta, cómo sería una solución que
   realmente le sirviera.
2. **Costo actual del problema.** Comparar contra referencias del negocio:
   valor de una visita o instalación promedio, horas administrativas por
   semana, costo de un trabajo perdido o un cobro olvidado. No sugerir un
   precio antes de entender cómo valora la solución.
3. **Quién decide.** "¿Quién tomaría la decisión de contratar una herramienta
   así?" (bloque G, pregunta 6).
4. **Escenarios (después de escuchar valor).** Presentar tres escenarios sin
   anchor agresivo y evaluar la reacción:
   - **Básico:** un técnico, funciones centrales (clientes, órdenes,
     presupuestos, agenda, pagos) — referencia Starter.
   - **Medio:** equipo en la calle con coordinación, más volumen, automatiza-
     ciones y notificaciones — referencia Professional.
   - **Avanzado:** operación grande con control y escala — referencia Business.
   Presentar los escenarios por lo que resuelven, no como lista de precios,
   y anotar la reacción espontánea ("eso está caro", "por eso sí").
5. **Registrar todo** en `INTERVIEW_RESULTS.md` (sección "Disposición a
   pagar") y en `METRICS.md` (disposición a pagar), con la respuesta literal
   cuando sea posible.

**No presentar funcionalidades inexistentes para justificar precios** y no
usar las funciones de un competidor como "lo que el cliente quiere" sin pasar
por entrevistas (regla de `docs/COMPETITOR_BENCHMARK.md` §6).

## 4. Hipótesis de precios (sin confirmar)

`docs/CUSTOMER_RESEARCH.md` H6 propone una disposición a pagar entre
**ARS 25.000 y 65.000/mes**. **Pendiente de validación** (0 entrevistas
realizadas). La afirmación previa de un rango "validado en entrevistas" en
`docs/COMPETITIVE_ANALYSIS.md` fue identificada como sin sustento
(inconsistencia B-01 del benchmark) y debe tratarse como hipótesis.

Con los precios v2 (2026-11-24), Starter ($19.900) queda **por debajo del piso**
de esa hipótesis y Business ($64.900) **dentro del techo**. Eso no valida nada:
sigue sin haber entrevistas. Si al cotizar aparece rechazo por precio, registrar
la reacción literal en `INTERVIEW_RESULTS.md` y no ajustar el precio en la
conversación.

## 5. Registro de decisiones de precio

Ningún cambio de precio se hace automáticamente desde esta etapa. Si la
validación sugiere un ajuste, se registra aquí como propuesta y lo decide el
fundador.
