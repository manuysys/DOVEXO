# Pricing y protocolo de validación

**Última actualización:** 2026-11-14
**Regla:** **no cambiar precios sin autorización del fundador.** Este documento
registra los precios actuales con fuente y define cómo validar disposición a
pagar en entrevistas, sin inducir.

---

## 1. Precios actuales (verificados en el código)

Fuente: `apps/web/src/lib/brand.ts` (líneas 42-64), contrastado con el test
`apps/web/src/lib/marketing/pricing.test.ts` y con la fila de referencia de
DOVEXO/Arreglo en `docs/COMPETITOR_BENCHMARK.md` (§2).

| Plan | Precio (ARS/mes) | Usuarios | Técnicos | Órdenes por mes | Tokens del asistente IA por mes |
|---|---|---|---|---|---|
| **Starter** | **29.900** | 1 | 1 | 100 | 50.000 |
| **Professional** | **59.900** | 5 | 5 | 1.000 | 200.000 |
| **Business** | **99.900** | 20 | 20 | 10.000 | 1.000.000 |

- Trial de suscripción: **14 días** (se crea `trialing` al registrar la
  empresa; hoy no se cobra automáticamente — ver `docs/PROJECT_STATUS.md`,
  "Limitaciones conocidas").
- Formato de presentación: ARS sin decimales, formato es-AR
  (`apps/web/src/lib/marketing/pricing.ts`).
- Antes de cotizar a un prospecto, re-verificar la landing y el código (el
  mandato pide "verificar la landing antes de cotizar").

## 2. Qué incluye cada plan según lo implementado

Las **funciones son las mismas en los tres planes** (`planFeatures` en
`apps/web/src/lib/brand.ts`); lo que cambia son los **límites** (usuarios,
técnicos, órdenes por mes, tokens de IA). Funciones implementadas y verificadas
(`docs/PROJECT_STATUS.md`, "Hecho y verificado"):

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
- Enforcement de límites: aplicado en órdenes por mes, usuarios y técnicos;
  el enforcement completo en todos los endpoints está pendiente
  (ADR-011, `docs/PROJECT_STATUS.md` "Pendiente").

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

## 5. Registro de decisiones de precio

Ningún cambio de precio se hace automáticamente desde esta etapa. Si la
validación sugiere un ajuste, se registra aquí como propuesta y lo decide el
fundador.
