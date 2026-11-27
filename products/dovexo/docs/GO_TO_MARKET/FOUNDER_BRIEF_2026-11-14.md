# Informe al fundador — Etapa de preventa (2026-11-14)

**Preparado por:** tech lead (OpenCode) según el mandato de
`PREVENTA_ENTREVISTA_LISTA.txt`. Todo lo que sigue está basado en trabajo
verificado hoy; nada se inventó y nada se envió a ninguna empresa.

## 1. Estado del producto (lo que hay para mostrar)

- Demo en producción verificada el 2026-11-14 con ~35 requests HTTP reales, sin
  5xx: panel, clientes, órdenes, presupuesto `QT-2026-0001` ($86.636) con PDF
  real, enlace público vivo, agenda con turno de mañana 10:00, pago parcial,
  dashboard operativo, equipo, planes (Starter $29.900 / Professional $59.900 /
  Business $99.900) y portal del cliente completo.
- PWA del técnico `/tech` activa (verificada 200): se muestra en el navegador
  sin instalar nada.
- Importador CSV/XLSX, onboarding de 4 pasos y reset de demo por API, todos
  verificados en producción.

## 2. Lo que NO se puede prometer (estado real)

WhatsApp con entrega real (`configured:false`), emails entregados (proveedor
`console`), push, GPS, Mercado Pago, facturación fiscal, SLA ni backups
restaurados. La app móvil existe (APK debug + AAB firmado) pero nunca se probó
en un dispositivo físico: se menciona, no se demuestra.

## 3. Prospectos (investigación del 2026-11-14)

21 prospectos principales verificados con fuente y fecha (`PROSPECTS.csv`,
P-001 a P-021) más una lista de reserva. Sin contacto con ninguna empresa;
`contact_permission=none` en todos.

**Orden de contacto recomendado (recomendación, no interés de las empresas):**

1. **El Mejor Clima (P-003)** — móvil publicado, web propia, 5,0★ con 38
   reseñas, servicio 24 h.
2. **TOTALAIR (P-002)** — móvil publicado, dirección y horarios.
3. **UBE (P-001)** — fijo publicado, dirección y horarios.
4. Reservas de alto volumen: **Autoclima (P-009)** y **Service Caribe (P-011)**.

Todos los emails figuran como no publicados: el canal de primer contacto será
teléfono/WhatsApp público.

## 4. Material comercial listo (en este directorio)

- Perfil de cliente e hipótesis a validar: `CUSTOMER_PROFILE.md`.
- Guion de entrevista completo (bloques A-G, reglas, ficha, matriz 0-14) con la
  hoja corta de 8 preguntas: `INTERVIEW_TEMPLATE.md`.
- Demo de 10-15 min con evidencia real y mitigación del riesgo de aprobar el
  único presupuesto en vivo: `DEMO_SCRIPT.md`.
- Programa de pilotos de 30 días, 3 cupos: `PILOT_PROGRAM.md`.
- 12 plantillas de mensajes con placeholders: `SALES_MESSAGES.md`.
- Validación de precios sin "¿pagarías X?": `PRICING_VALIDATION.md`.
- Benchmark competitivo: `COMPETITOR_BENCHMARK.md`.
- Registro de resultados de entrevistas (vacío a propósito): `INTERVIEW_RESULTS.md`.
- Sistema de feedback y métricas: `PRODUCT_FEEDBACK.md`, `METRICS.md`.
- Plan de acción: `NEXT_ACTIONS.md`.

Revisado por un agente reviewer contra el mandato: **apto con correcciones
menores**, cero bloqueantes; las correcciones se aplicaron antes de este
informe.

## 5. Riesgos de esta etapa

| Riesgo | Mitigación |
|---|---|
| Aprobar el único presupuesto del demo en vivo | Aprobar solo al final y resetear por API después (o mostrar solo el enlace) |
| Promesas de WhatsApp/email/push | Tabla mostrar/no mostrar en el guion de demo; revisar antes de cada demo |
| Datos de contacto parcialmente desactualizados | Verificar teléfono en la primera llamada; la fuente y fecha están en el CSV |
| Apps de reserva sin datos suficientes | Investigar con más profundidad antes de usarlas |
| Nada de esto valida disposición a pagar | Solo las entrevistas lo validan; el protocolo de precios evita preguntas directas |

## 6. Qué hace la IA vs qué hacés vos

**La IA (hecho o a pedido):** investigación de prospectos, material comercial,
guiones, plantillas, auditoría de la demo, registro y orden de los datos.
**Vos:** autorizar cada envío, personalizar los mensajes, llamar, entrevistar,
tomar las decisiones de producto y cobro.

## 7. Próximos 14 días (propuesta)

1. Vos revisás este paquete y la lista de prospectos.
2. Elegís los 3 primeros contactos (sugerencia: El Mejor Clima, TOTALAIR, UBE).
3. Personalizás y enviás los primeros mensajes (`SALES_MESSAGES.md`, momento 1)
   — con tu autorización explícita.
4. Coordinás las entrevistas (momento 4) y las conducís con la hoja corta.
5. Después de cada entrevista: cargás resultados en `INTERVIEW_RESULTS.md`,
   actualizás `PROSPECTS.csv` y `METRICS.md`.
6. Cuando haya interesados: demo ensayada (`DEMO_SCRIPT.md`, con reset después
   si se aprueba el presupuesto) y propuesta de piloto.

## 8. Lo que falta del lado del producto para la etapa (no urgente)

- Probar el APK en un Android físico (para poder mostrar la app real).
- Dominio propio + Resend (para que los mensajes salgan con marca).
- Restricción conocida y aceptada: la demo corre en planes gratuitos.
