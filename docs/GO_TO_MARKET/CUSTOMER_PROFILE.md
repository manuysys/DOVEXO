# Perfil del cliente ideal inicial

**Última actualización:** 2026-11-14
**Fuente:** `PREVENTA_ENTREVISTA_LISTA.txt` (secciones 2 y 5) e
hipótesis previas de `docs/CUSTOMER_RESEARCH.md` (§2 y §3, sin entrevistas
realizadas: todo lo que sigue es hipótesis, no datos validados).

---

## 1. Cliente ideal inicial (hipótesis de ICP)

Una **PyME de servicios técnicos a domicilio**, con prioridad en:

1. Instalación de aire acondicionado y climatización.
2. Refrigeración (doméstica y comercial).
3. Mantenimiento de climatización.

**Características esperadas (todas por confirmar en entrevistas):**

- Zona: Gran Buenos Aires Oeste (Haedo, El Palomar, Morón, Hurlingham,
  Santos Lugares, Castelar, Ramos Mejía, San Justo, Caseros y localidades
  cercanas). Es la cohorte inicial de conveniencia, no una afirmación sobre
  todo el mercado.
- Trabajos **recurrentes**: service, mantenimiento preventivo, revisión de
  instalaciones, no solo instalaciones únicas.
- Entre **2 y 20 técnicos** (se admiten hasta 2 casos de 1 técnico con ayudante
  y alto volumen de presupuestos para contrastar el límite inferior).
- Gestión actual desordenada: **WhatsApp + cuaderno/pizarra + planilla Excel**,
  sin software integrado.
- Entrevistado ideal: dueño, socio gerente, coordinador operativo o responsable
  administrativo que **toma la decisión de compra** y vive la operación diaria.

**Propuesta de valor con la que trabajamos:** "Clientes, trabajos, técnicos y
presupuestos conectados en un solo lugar."

---

## 2. Hipótesis explícitas a validar en entrevistas

Ninguna de estas hipótesis está confirmada. El registro con umbrales de
confirmación/refutación está en `docs/CUSTOMER_RESEARCH.md` §2 (H1 a H7).
Resumen operativo:

| ID | Hipótesis | Qué observar en la entrevista |
|---|---|---|
| H1 | El dolor principal es el desorden operativo y la pérdida de seguimiento, no la falta de un "CRM tradicional". | Relatos de trabajos perdidos, visitas olvidadas o reclamos sin estado claro. |
| H2 | WhatsApp es el canal central de entrada y coordinación, pero desconectado de órdenes, agenda y cobros. | Audios, fotos y direcciones buscadas scrolleando chats. |
| H3 | Se pierde facturación real por presupuestos enviados sin seguimiento. | No saben cuántos presupuestos enviaron ni cuáles siguen abiertos. |
| H4 | La asignación de técnicos y la programación generan solapamientos, tiempos muertos o viajes en vano. | Coordinación manual; visitas fallidas y reprogramaciones caóticas. |
| H5 | Los técnicos en calle usarían una interfaz web móvil simple si no exige instalar APKs. | Disposición del dueño y de los técnicos a cerrar la orden desde el navegador del celular. |
| H6 | Disposición a pagar entre ARS 25.000 y 65.000/mes si el sistema ahorra tiempo y evita perder presupuestos o cobros. | Bloque G del guion; comparación con el valor de una visita promedio. |
| H7 | El miedo a "cargar todo de cero" y la falta de tiempo son la principal barrera de adopción. | Abandonos de software previo o rechazo a probar herramientas nuevas. |

Además, medir en cada entrevista (variables del perfil):

- **Volumen:** servicios por semana y por técnico; estacionalidad.
- **Dolor administrativo:** dónde se va el tiempo administrativo; cuánto
  tiempo o dinero cuesta el problema hoy (bloque G, preguntas 2 y 3).
- **Disposición a pagar:** quién decide, con qué frecuencia comprarían, qué
  valor asignan (ver protocolo en `PRICING_VALIDATION.md`).

---

## 3. Señales de que NO es buen fit (criterios de exclusión)

No todo negocio del rubro es cliente potencial. Señales de no-encaje:

| Señal | Por qué no encaja |
|---|---|
| **Solo 1 técnico sin volumen** (menos de 3 trabajos por semana, "changas" esporádicas). | No hay suficiente operación para justificar una suscripción mensual. |
| **Procesos ya digitalizados** (ERP, software similar bien adoptado, operación con equipo administrativo). | El dolor que resolvemos no existe o ya está resuelto; el costo de cambio supera el beneficio. |
| **Trabajos únicos esporádicos** sin clientes recurrentes ni presupuestos (solo instalación puntual, sin service ni seguimiento). | El circuito solicitud → presupuesto → orden → agenda → pago pierde sentido sin recurrencia. |
| Grandes contratistas (>50 empleados, ERP corporativo tipo SAP). | Excede las capacidades del MVP actual y el modelo de planes. |
| Talleres exclusivamente de mostrador sin visitas ni coordinación de técnicos. | El dominio central de DOVEXO es el servicio a domicilio. |
| Empresa grande con operaciones complejas (ej.: refrigeración comercial/industrial con múltiples sucursales). | Posible contacto para una segunda etapa, no para el cliente inicial. |

Los criterios se documentan en `PROSPECTS.csv` (`lost_reason` cuando cierre)
y la calificación 0-14 del mandato (§10) se aplica después de cada entrevista.
El puntaje no es la única decisión: una empresa con puntaje alto puede no ser
buen piloto si sus necesidades exceden lo que DOVEXO hace hoy.

---

## 4. Segmento prioritario

El segmento prioritario es **climatización y refrigeración**. No ampliar a
talleres de reparación ni a otros sectores antes de entender bien las
necesidades del primer segmento.
