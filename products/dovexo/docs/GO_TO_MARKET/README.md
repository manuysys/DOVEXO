# GO TO MARKET — Etapa de preventa y primeras ventas de DOVEXO

**Última actualización:** 2026-11-14
**Mandato fuente:** `PREVENTA_ENTREVISTA_LISTA.txt` (raíz del repo).
**Estado real del producto:** `docs/PROJECT_STATUS.md` y `docs/PILOT_READINESS.md`.

---

## 1. Objetivo de la etapa

Pasar de **SaaS desarrollado** a **empresa con clientes reales**.

Durante esta etapa el foco deja de ser agregar funcionalidades. El objetivo es
encontrar negocios que tengan el problema que DOVEXO resuelve y que estén
dispuestos a pagar por resolverlo, contrastando el producto ya construido con la
realidad de las PyMEs de servicios técnicos.

### Objetivos iniciales (del mandato)

| Objetivo | Meta |
|---|---|
| Negocios potenciales investigados | 20 o más |
| Conversaciones de descubrimiento | 8 a 12 |
| Empresas interesadas en probar el producto | 3 o más |
| Empresas que usen realmente el sistema | 2 o más |
| Información sobre disposición a pagar | Relevada y documentada |
| Pilotos satisfactorios convertidos en clientes pagos | Intentar, sin prometer resultados |

Estas cantidades son objetivos de trabajo, no resultados garantizados.

### Estado comercial real (al 2026-11-14)

- **0 entrevistas realizadas.** No existe ningún cliente, conversación ni
  resultado comercial. Ver `docs/CUSTOMER_RESEARCH.md` (0 de 10 entrevistas).
- Prospectos verificados: **21 principales (P-001 a P-021) + lista de
  reserva**, investigación del **2026-11-14** con fuente y fecha en cada dato
  (`MARKET_RESEARCH.md`). Incluye los 4 conocidos (UBE Refrigeración, TOTALAIR,
  El Mejor Clima, Multitecnia) y una recomendación de orden de entrevistas.
  **Ninguno confirmó interés en DOVEXO.** Son contactos públicos, no clientes
  ni acuerdos. No se contactó a ninguna empresa.
- `docs/GO_TO_MARKET/PROSPECTS.csv` ya está completo (2026-11-14): 21 prospectos
  (P-001 a P-021), todos `Verified` con `source_url` y `verified_at`; los 4
  conocidos enriquecidos con sus teléfonos publicados. `public_email` queda
  vacío en el CSV cuando no está publicado (el por qué de cada caso, con el
  detalle de las fichas, está en `MARKET_RESEARCH.md`);
  `contact_permission=none` en todos.

---

## 2. Reglas de oro

1. **No contactar sin autorización del fundador.** Ningún agente envía mensajes,
   emails ni llamadas a empresas. Los borradores se preparan; el fundador los
   revisa, personaliza y envía. Ver `SALES_MESSAGES.md`.
2. **No inventar nada.** No inventar clientes, conversaciones, respuestas,
   resultados, teléfonos ni correos. Si un dato no está verificado, se deja
   vacío y se marca como pendiente. Cada dato de prospecto lleva fuente y fecha.
3. **Honestidad de la demo.** La demo usa exclusivamente los datos de ejemplo
   del tenant `servicios-demo`, claramente identificados como demo. No se
   muestran como datos reales de una empresa. No se vende ninguna funcionalidad
   que no funcione hoy:
   - WhatsApp: configuración implementada, **sin credenciales de Meta**; los
     envíos de automatización quedan `skipped`. No está probado end-to-end.
   - Email: proveedor `console` en producción; **los emails no se entregan**
     hasta verificar dominio y configurar Resend.
   - Push: implementado con Expo, **no probado** en dispositivo (requiere
     EAS projectId y development build).
   - GPS: **no existe**. Está fuera del MVP.
   - Mercado Pago: **no implementado**. No hay cobros automáticos reales.
   - Facturación fiscal completa: fuera del MVP.
   - Ver la tabla completa en `DEMO_SCRIPT.md` (sección "SE PUEDE MOSTRAR /
     NO SE PUEDE MOSTRAR TODAVÍA").
4. **No confundir entrevista con venta.** La primera charla es de descubrimiento:
   primero se escucha, no se muestra DOVEXO. Ver `INTERVIEW_TEMPLATE.md`.
5. **No marcar a una empresa como interesada sin que lo haya manifestado.**
6. **No prometer disponibilidad, SLA ni soporte garantizado.** El piloto es una
   etapa inicial; ver `PILOT_PROGRAM.md`.
7. **No pedir datos reales hasta validar privacidad, seguridad y backups.** La
   restauración de backups todavía no está probada (`docs/PILOT_READINESS.md`,
   criterio 18).
8. **No cambiar precios sin autorización.** Ver `PRICING_VALIDATION.md`.
9. **Nunca describir como implementado algo que solo está planificado.**

---

## 3. Mapa de archivos

| Archivo | Contenido | Estado |
|---|---|---|
| `README.md` | Este documento: objetivo, reglas y mapa. | Completo |
| `CUSTOMER_PROFILE.md` | Perfil del cliente ideal inicial, señales de no-encaje e hipótesis a validar. | Completo |
| `MARKET_RESEARCH.md` | Investigación de prospectos del 2026-11-14: 21 prospectos principales (P-001 a P-021) + lista de reserva, cada dato con fuente y fecha; metodología, limitaciones, fichas e hipótesis de problemas (sin validar) y recomendación de orden de entrevistas. | Completo (investigación 2026-11-14; limitaciones documentadas en su §1.3) |
| `PROSPECTS.csv` | CRM de prospectos con 22 campos. Completo (2026-11-14): 21 prospectos `Verified` (P-001 a P-021) con fuente y fecha; teléfonos publicados incluidos en los que lo tienen. | Completo (21/21) |
| `INTERVIEW_TEMPLATE.md` | Ficha de registro + guion completo de entrevista (bloques A a G) + reglas. | Completo |
| `INTERVIEW_RESULTS.md` | Registro de entrevistas realizadas. | Estructura vacía (0 entrevistas) |
| `DEMO_SCRIPT.md` | Guion de demo de 10-15 min con datos de `servicios-demo` y tabla de qué se puede mostrar (evidencia HTTP del 2026-11-14). | Completo |
| `PILOT_PROGRAM.md` | Programa de pilotos: 30 días, 3 cupos, condiciones y conversión. | Completo |
| `SALES_MESSAGES.md` | Mensajes para cada etapa del proceso comercial, listos para personalizar. | Completo |
| `PRICING_VALIDATION.md` | Precios actuales con fuente, qué incluye cada plan y protocolo de validación en entrevistas. | Completo (precios v2, 2026-11-24) |
| `PLANES_EXPLICADOS.md` | Explicación de los tres planes para clientes: cupos, qué es un usuario de oficina y una orden nueva, IA incluida, qué no incluye, evaluación vs piloto, FAQ y mensajes cortos. | Completo (2026-11-24) |
| `COMPETITOR_BENCHMARK.md` | Resumen del benchmark competitivo existente y estructura para ampliarlo. | Completo (datos al 2026-11-08, reverificar) |
| `PRODUCT_FEEDBACK.md` | Clasificación y priorización de feedback de entrevistas y pilotos. | Estructura vacía |
| `METRICS.md` | Métricas comerciales con definiciones y tabla semanal. | Estructura vacía |
| `NEXT_ACTIONS.md` | Plan de acción de los próximos 14 días, dividido entre IA y fundador. | Investigación completada (2026-11-14); pendientes de research y autorización del fundador registrados |

---

## 4. Cómo se usa esta carpeta

1. El agente `research` investiga prospectos y completa `PROSPECTS.csv` y
   `MARKET_RESEARCH.md`, siempre con fuente y fecha de verificación.
2. El fundador revisa los prospectos, aprueba contactos y envía los mensajes de
   `SALES_MESSAGES.md` personalizados.
3. Cada entrevista se registra con `INTERVIEW_TEMPLATE.md` y se carga en
   `INTERVIEW_RESULTS.md`.
4. El feedback se clasifica en `PRODUCT_FEEDBACK.md`; las métricas se actualizan
   semanalmente en `METRICS.md`.
5. Los documentos deben mantenerse completos, relacionados y actualizados.
   No dejar conversaciones sin próxima acción.
