# Sistema de feedback de producto

**Última actualización:** 2026-11-14
**Fuente:** `PREVENTA_ENTREVISTA_LISTA.txt` (sección 16).
**Regla:** no modificar el producto porque una persona sugirió una
funcionalidad. Registrar cada solicitud, clasificarla y priorizar problemas
compartidos por varios clientes. No convertir DOVEXO en un software
personalizado diferente para cada empresa.

---

## 1. Clasificación de solicitudes

| Categoría | Qué es | Ejemplo típico |
|---|---|---|
| **Problema central** | Apunta al dolor operativo que DOVEXO resuelve (recepción, presupuesto, agenda, cobros). | "Me pierdo los presupuestos que no me contestan." |
| **Mejora de usabilidad** | El producto funciona pero es lento, confuso o incómodo. | "Tardé en encontrar dónde cargar el pago parcial." |
| **Funcionalidad adicional** | Pide algo nuevo que no existe hoy. | "Quiero mandar recordatorios automáticos de turnos." |
| **Integración** | Pide conexión con algo externo (WhatsApp, email, cobros, facturación). | "Que mande WhatsApp cuando apruebo un presupuesto." |
| **Personalización específica** | Necesidad propia de una empresa, no compartida. | "Necesito un campo particular para mi rubro." |
| **Problema técnico** | Error, falla o comportamiento incorrecto. | "No pude cargar una foto." |
| **Necesidad fuera del alcance** | Contradice la visión o el MVP (GPS, ERP, facturación fiscal completa, inventario complejo). | "¿Tiene ruteo optimizado con GPS?" |

## 2. Criterios de priorización

Evaluar cada solicitud con estos criterios (del mandato):

| Criterio | Pregunta clave |
|---|---|
| **Frecuencia** | ¿Cuántas veces aparece en entrevistas/pilotos? |
| **Cantidad de clientes afectados** | ¿Cuántas empresas lo necesitan, no solo una? |
| **Impacto** | ¿Cuánto mejora el circuito central o el dolor principal? |
| **Costo de desarrollo** | ¿Cuánto trabajo implica? ¿Depende de terceros (Meta, Resend, Mercado Pago)? |
| **Complejidad de mantenimiento** | ¿Cuánto cuesta mantenerlo vivo después? |
| **Compatibilidad con la visión** | ¿Es consistente con DOVEXO (servicios técnicos a domicilio) o lo desvía? |

**Reglas:**

- Priorizar problemas compartidos por varios clientes sobre pedidos de uno.
- Una sugerencia de funcionalidad no es prueba de que alguien pagaría:
  contrastar con `INTERVIEW_RESULTS.md` (bloque G) antes de priorizar.
- Las necesidades fuera del alcance se registran y se archivan; no se
  desarrollan por capricho.
- Antes de decidir desarrollo, revisar `docs/PRIORITIZED_BACKLOG.md` y
  `docs/FEATURE_TRUTH_MATRIX.md` (no duplicar trabajo ni prometer lo que ya
  está planificado).

## 3. Registro de solicitudes

*(Vacío: no hay entrevistas ni pilotos realizados todavía. Cada entrada se
carga con fecha y fuente verificable.)*

| ID | Fecha | Fuente (entrevista/piloto/empresa) | Categoría | Pedido (texto literal o resumen fiel) | Frecuencia observada | Clientes afectados | Impacto (alto/medio/bajo) | Costo (alto/medio/bajo) | Mantenimiento | Visión (sí/no) | Decisión | Prioridad |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — | — | — | — | — | — |

## 4. Proceso

1. Capturar la solicitud en la entrevista (`INTERVIEW_TEMPLATE.md`), el piloto
   (`PILOT_PROGRAM.md` §3) o el contacto diario.
2. Cargar una fila en la tabla §3 con la categoría y los criterios.
3. Revisar semanalmente junto con `METRICS.md`: patrones repetidos suben de
   prioridad.
4. Las decisiones que cambien producto se registran en
   `docs/PROJECT_STATUS.md` y, si corresponden, en `docs/DECISIONS.md` (ADR).
