# Plantilla de registro de entrevista de descubrimiento

**Fuente:** `PREVENTA_ENTREVISTA_LISTA.txt` (secciones 7, 8 y 9).
**Cada entrevista completada se registra en `INTERVIEW_RESULTS.md` con esta
plantilla.** Separar siempre **hechos** (lo que dijo que hace), **opiniones**
(lo que valora) e **hipótesis** (lo que suponemos). No transformar la opinión
de una sola empresa en requisitos universales.

---

## Ficha de la entrevista

- **Empresa:**
- **Fecha:**
- **Actividad (rubro y servicios):**
- **Personas entrevistadas:**
- **Tamaño del negocio:**
- **Cantidad de técnicos:**
- **Herramientas utilizadas hoy:**
- **Volumen aproximado de trabajos (por semana/mes):**

---

## Duración y modalidad

- Primera conversación: **15 a 25 minutos**.
- **No comenzar mostrando DOVEXO.** Primero escuchar.
- Pedir permiso antes de grabar o almacenar la conversación.

## Presentación (leer o parafrasear)

> "Estoy desarrollando una plataforma para ayudar a empresas de servicios
> técnicos a organizar sus clientes, presupuestos, órdenes de trabajo y
> técnicos. Estoy hablando con negocios del rubro para entender cómo trabajan
> actualmente y qué problemas tienen. No te quiero vender nada en esta primera
> charla: me interesa conocer tu experiencia."

---

## Guion: bloques A a G

No hacer todas las preguntas si la respuesta ya surgió naturalmente.

### Bloque A — Conocer el negocio

1. ¿A qué tipo de servicios se dedican principalmente?
2. ¿Hace cuánto trabajan?
3. ¿Cuántas personas trabajan en el negocio?
4. ¿Cuántos técnicos tienen?
5. ¿Cuántos servicios realizan aproximadamente por semana?
6. ¿Trabajan solamente en domicilios o también tienen local/taller?
7. ¿Quién administra el negocio?

### Bloque B — Recepción de clientes

1. ¿Cómo reciben actualmente las solicitudes?
2. ¿Qué porcentaje llega por WhatsApp?
3. ¿También reciben llamadas o consultas de otros canales?
4. ¿Cómo registran los pedidos?
5. ¿Qué hacen para no olvidarse de una solicitud?
6. ¿Qué sucede cuando hay muchas consultas al mismo tiempo?
7. ¿Alguna vez perdieron un trabajo por no responder o dar seguimiento?

Profundizar sobre experiencias reales.

### Bloque C — Presupuestos

1. ¿Cómo preparan los presupuestos?
2. ¿Utilizan Excel, Word, PDF o algún sistema?
3. ¿Cómo los envían?
4. ¿Cómo registran si el cliente los aceptó?
5. ¿Realizan seguimiento de presupuestos pendientes?
6. ¿Cuánto tiempo dedican a esta tarea?
7. ¿Qué sucede cuando un cliente pide modificaciones?

### Bloque D — Organización de trabajos

1. ¿Cómo organizan la agenda?
2. ¿Cómo asignan cada trabajo?
3. ¿Cómo saben qué técnico está disponible?
4. ¿Cómo registran el resultado de una visita?
5. ¿Cómo guardan fotografías y observaciones?
6. ¿Qué ocurre cuando hay una reprogramación?
7. ¿Cómo consultan el historial de un cliente?

### Bloque E — Cobros

1. ¿Cómo registran los pagos?
2. ¿Cómo controlan saldos pendientes?
3. ¿Cómo identifican los trabajos finalizados que todavía no se cobraron?
4. ¿Cómo registran pagos parciales?
5. ¿Qué dificultades tienen con la administración del dinero?

### Bloque F — Tecnología actual

1. ¿Qué herramientas utilizan?
2. ¿Pagan algún software?
3. ¿Qué les gusta de ese sistema?
4. ¿Qué les falta?
5. ¿Qué tareas siguen resolviendo manualmente?
6. ¿Intentaron cambiar de sistema anteriormente?
7. ¿Qué les impediría implementar uno nuevo?

### Bloque G — Validación económica

No preguntar solamente si pagarían por una aplicación. Evitar sugerir un
precio antes de entender cómo valora la solución. Ver también el protocolo
completo en `PRICING_VALIDATION.md`.

1. ¿Qué problema de los que mencionaste te gustaría resolver primero?
2. ¿Qué impacto tiene actualmente?
3. ¿Cuánto tiempo o dinero te hace perder?
4. ¿Cómo sería una solución que realmente te sirviera?
5. ¿Cuánto estarías dispuesto a invertir para resolverlo?
6. ¿Quién tomaría la decisión de contratar una herramienta así?

### Cierre

> "Gracias por el tiempo. Estoy desarrollando DOVEXO y algunas de las cosas
> que me contaste son justamente las que buscamos resolver. ¿Te interesaría
> que te muestre una demostración corta cuando esté adaptada a tu forma de
> trabajar?"

Si la respuesta es positiva, coordinar una segunda reunión y registrarla en
`PROSPECTS.csv` (`status = Interviewed`, `next_action = coordinar demo`).

---

## Reglas para las entrevistas (sección 8 del mandato)

1. **No inducir respuestas.** No hacer preguntas que asuman que el negocio
   tiene un problema. No preguntar únicamente "¿te gustaría una aplicación
   que haga esto?": las personas pueden decir que sí por cortesía.
2. **Buscar historias concretas:** el último trabajo, el último presupuesto,
   el último conflicto de agenda, el último cliente olvidado, el último pago
   pendiente. Preguntar qué ocurrió realmente.
3. **Profundizar cuando mencione un problema:**
   - ¿Cuándo pasó?
   - ¿Con qué frecuencia sucede?
   - ¿Cómo lo resolvieron?
   - ¿Quién tuvo que intervenir?
   - ¿Qué consecuencia tuvo?
   - ¿Qué hicieron para evitarlo?
4. **No interpretar una sugerencia de funcionalidad como prueba de compra.**
5. **Pedir permiso antes de grabar o almacenar conversaciones.**
6. No solicitar datos personales innecesarios.

---

## Resultados (completar después de la entrevista)

### Problemas detectados
### Procesos actuales
### Consecuencias económicas
### Soluciones actuales
### Funciones valoradas
### Objeciones
### Disposición a pagar
### Interés en demo
### Interés en piloto
### Próximo paso
### Conclusiones
### Hipótesis que se confirmaron
### Hipótesis que se descartaron

### Calificación interna (0-14)

Puntuar de 0 a 2 cada criterio; documentar el motivo de cada puntaje.

| Criterio | Puntaje (0-2) | Motivo |
|---|---|---|
| 1. Tiene problemas operativos relevantes | | |
| 2. El problema ocurre frecuentemente | | |
| 3. Tiene suficiente volumen de trabajo | | |
| 4. Participa en las decisiones de compra | | |
| 5. Tiene disposición a cambiar sus procesos | | |
| 6. Está dispuesto a probar una solución | | |
| 7. Tiene capacidad y voluntad de pago | | |
| **Total (0-14)** | | |

Interpretación orientativa: 0-4 encaje bajo · 5-9 investigar más · 10-14
candidato interesante. El puntaje no es la única decisión.

---

## Anexo — Ficha rápida de 8 preguntas (hoja corta para la primera entrevista)

Esta es la hoja breve que recomendó el fundador para llevar a la primera
entrevista. Si la conversación fluye, después se completa la ficha completa de
la sección 9 y los bloques A-G.

**Ficha de entrevista comercial**

Empresa: ________________________  Fecha: ____________

- [ ] 1. ¿Cómo reciben actualmente los pedidos de los clientes?
- [ ] 2. ¿Cómo registran y organizan los trabajos?
- [ ] 3. ¿Cómo realizan y siguen presupuestos?
- [ ] 4. ¿Cómo organizan las visitas y los técnicos?
- [ ] 5. ¿Cómo controlan los pagos y saldos pendientes?
- [ ] 6. ¿Qué herramienta utilizan actualmente?
- [ ] 7. ¿Cuál es el problema administrativo que más tiempo les consume?
- [ ] 8. ¿Qué tendría que resolver una herramienta para que valga la pena pagarla?

Notas: ______________________________________________
