# Métricas comerciales

**Última actualización:** 2026-11-14
**Fuente:** `PREVENTA_ENTREVISTA_LISTA.txt` (secciones 4 y 17).
**Nota clave:** **no medir solamente registros.** Una empresa registrada que no
utiliza DOVEXO no es necesariamente un cliente validado. Lo que vale es el uso
real y la disposición a pagar.

---

## 1. Definiciones

| Métrica | Definición | Cómo se cuenta |
|---|---|---|
| **Prospectos investigados** | Empresas del segmento sobre las que se relevó información pública. | Filas creadas en `PROSPECTS.csv` con datos y fuente. |
| **Prospectos verificados** | Empresas con datos de contacto (teléfono/email/canal público) confirmados con fuente y fecha. | Filas con `verified_at` no vacío. |
| **Contactos realizados** | Mensajes o llamadas efectivamente enviados por el fundador. | Filas con `status ≥ Contacted` y `last_contact_date`. |
| **Tasa de respuesta** | Proporción de contactos que obtuvieron respuesta. | Responded ÷ Contacted. |
| **Entrevistas agendadas** | Conversaciones de descubrimiento con día y hora confirmados. | `status = Interview_scheduled`. |
| **Entrevistas realizadas** | Conversaciones de descubrimiento completadas. | `status = Interviewed`; detalle en `INTERVIEW_RESULTS.md`. |
| **Problemas confirmados** | Problemas operativos documentados con historia concreta (no opiniones). | Secciones "Problemas detectados" con hechos en `INTERVIEW_RESULTS.md`. |
| **Demos realizadas** | Demostraciones completadas con el guion de `DEMO_SCRIPT.md`. | `status = Demo_completed`. |
| **Pilotos ofrecidos** | Propuestas de piloto formuladas (30 días, 3 cupos). | `status = Pilot_proposed`. |
| **Pilotos aceptados / activos** | Empresas que iniciaron el piloto y lo usan. | `status = Pilot_active`. |
| **Empresas activas** | Empresas que usan DOVEXO en su operación real en la semana. | Uso semanal real (ver abajo); **un registro sin uso no cuenta**. |
| **Conversión a pago** | Empresas piloto que pasaron a plan pago con consentimiento explícito. | `status = Paying_customer`. |
| **Tiempo hasta el primer valor (time-to-value)** | Días desde el alta del piloto hasta el primer circuito completo real (solicitud → presupuesto → orden → visita → pago). | Fecha del primer circuito real menos fecha de alta. |
| **Uso semanal** | Frecuencia de uso real por semana (días activos, órdenes cargadas, presupuestos emitidos). | Datos del panel/uso reportado en la reunión semanal del piloto. |
| **Abandono (churn)** | Pilotos o clientes pagos que dejan de usar o cancelan. | Piloto terminado sin conversión, o cliente pago que baja. |
| **Disposición a pagar** | Señal concreta de voluntad de pago (rango expresado, aceptación de escenario, pregunta por condiciones). | Sección "Disposición a pagar" en `INTERVIEW_RESULTS.md`; ver protocolo en `PRICING_VALIDATION.md` §3. |

## 2. Metas iniciales de la etapa (objetivos de trabajo, no garantizados)

- Investigar **20+** negocios potenciales.
- **8 a 12** conversaciones de descubrimiento.
- **3+** empresas interesadas en probar.
- **2+** empresas usando realmente el sistema.
- Información de disposición a pagar documentada.
- Intentar convertir pilotos satisfactorios en clientes pagos.

## 3. Tabla de seguimiento semanal

*(Vacía: la etapa comercial recién arranca. Completar todos los lunes con
datos reales.)*

| Semana (desde-hasta) | Investigados | Verificados | Contactos | Respuestas (tasa) | Entrevistas agendadas | Entrevistas realizadas | Problemas confirmados | Demos | Pilotos ofrecidos | Pilotos activos | Empresas activas | Conversión a pago | Notas |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — | — | — | — | — | — | — |

## 4. Tabla de pilotos (time-to-value y uso)

| Empresa | Alta del piloto | Primer circuito real (fecha) | Time-to-value | Uso semanal (resumen) | Evaluación final | Conversión | Churn |
|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — |

## 5. Reglas de medición

1. Registrar la fuente de cada número (fila de `PROSPECTS.csv`,
   `INTERVIEW_RESULTS.md` o datos del sistema).
2. No inflar métricas: los registros sin uso ni respuesta no cuentan como
   avance.
3. Actualizar esta tabla semanalmente; si una semana no se trabajó, dejarlo
   asentado con su motivo.
4. Los valores acumulados del mandato se reportan al fundador conforme a la
   sección 20 del txt (informe con estado, prospectos, riesgos y próximos
   pasos).
