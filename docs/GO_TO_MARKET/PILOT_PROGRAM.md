# Programa de pilotos de DOVEXO

**Última actualización:** 2026-11-14
**Fuente:** `PREVENTA_ENTREVISTA_LISTA.txt` (sección 12).
**Restricción:** no prometer disponibilidad, soporte ni integraciones que no
estén garantizadas. Ver `DEMO_SCRIPT.md` §5 para el estado real de cada
funcionalidad.

---

## 1. Resumen

- **Duración:** 30 días.
- **Cupos iniciales:** 3 empresas.
- **Participación:** voluntaria, sin costo durante el piloto.
- **Objetivo:** que la empresa use DOVEXO en su operación real y nos dé
  feedback honesto, para validar el producto y la disposición a pagar.

## 2. Qué ofrecemos

1. **Configuración acompañada:** armamos la empresa, el equipo y los servicios
   juntos (onboarding de cuatro pasos guiado por el fundador).
2. **Importación inicial de clientes:** cargamos su cartera de clientes desde
   CSV o XLSX con vista previa, control de duplicados y reporte de errores
   (funcionalidad verificada en producción).
3. **Capacitación:** una sesión inicial para el dueño/coordinador y otra breve
   para los técnicos (PWA `/tech` y, si hay APK instalado, la app móvil).
4. **Soporte directo:** contacto directo con el fundador durante el piloto.
   **Sin horarios garantizados ni SLA.**
5. **Reunión semanal de seguimiento:** breve (15-20 min) para revisar uso,
   dificultades y próximos pasos.
6. **Acceso a las funcionalidades verificadas:** todo lo que se lista en
   `DEMO_SCRIPT.md` §5 ("SE PUEDE MOSTRAR").

## 3. Qué pedimos a cambio

1. **Uso real:** operar el día a día dentro de DOVEXO durante el piloto.
2. **Feedback:** qué les sirve, qué falta, qué no funciona.
3. **Reporte de problemas:** avisarnos cuando algo falle o confunda.
4. **Participación en reuniones breves** semanales.
5. **Evaluación honesta del producto** al final del piloto.
6. **Permiso independiente** si quisieran usar su testimonio o logo más
   adelante. Nunca se exigen reseñas positivas ni se usan logos, nombres o
   datos de clientes en marketing sin autorización expresa.

## 4. Reglas del programa

- **Voluntario:** la empresa participa porque quiere; puede retirarse cuando
  quiera.
- **Etapa inicial:** se deja claro que DOVEXO está en una etapa temprana y que
  van a encontrar cosas en desarrollo.
- **Sin promesas de disponibilidad o SLA:** la infraestructura actual corre en
  planes free (Neon + Vercel) con cold starts y límites de uso.
- **Sin integraciones no garantizadas:** no prometer WhatsApp automático,
  envío de emails ni push (ver `DEMO_SCRIPT.md` §5).
- **Datos:** al inicio del piloto se puede trabajar con datos de prueba o con
  una carga inicial acotada. **No solicitar datos reales sensibles hasta
  validar privacidad, seguridad, backups y tratamiento de datos** (la
  restauración de backups todavía no está probada: `docs/PILOT_READINESS.md`
  criterio 18, pendiente).
- **Documentar cada piloto:** empresa, fecha de inicio, acuerdos y
  observaciones en `PROSPECTS.csv` (`status = Pilot_active`) y aprendizajes en
  `PRODUCT_FEEDBACK.md`.

## 5. Conversión a pago

- **Antes de comenzar el piloto, explicar las condiciones posteriores.** El
  acceso gratuito no se convierte en un servicio gratuito indefinido.
- Conversar desde el comienzo sobre: valor percibido, funciones realmente
  necesarias, precio que considerarían razonable y plan adecuado (ver
  `PRICING_VALIDATION.md`).
- **No realizar cobros automáticos sin consentimiento explícito.** El cobro
  solo se activa cuando la empresa acepta, con condiciones claras por escrito
  (qué plan, qué precio, desde cuándo).
- Al finalizar los 30 días: reunión de evaluación → si hay encaje, proponer
  plan; si no hay encaje, cerrar bien la relación (ver
  `SALES_MESSAGES.md`, "Cierre por falta de encaje").
- Referencia de precios vigentes: Starter ARS 29.900 · Professional ARS 59.900
  · Business ARS 99.900 (fuente en `PRICING_VALIDATION.md` §1).

## 6. Checklist de inicio de piloto

| # | Tarea | Responsable |
|---|---|---|
| 1 | Acordar condiciones del piloto (voluntario, 30 días, sin SLA) | Fundador |
| 2 | Crear la empresa (tenant) y registrar al dueño | Fundador |
| 3 | Onboarding acompañado (empresa, servicios y horarios, equipo, primeros datos) | Fundador + empresa |
| 4 | Importar cartera de clientes (CSV/XLSX con vista previa) | Fundador + empresa |
| 5 | Capacitación del dueño/coordinador y de los técnicos | Fundador |
| 6 | Cargar clientes de prueba o datos acotados según lo acordado | Empresa, con ayuda |
| 7 | Acordar día y hora de la reunión semanal | Ambos |
| 8 | Registrar el piloto en `PROSPECTS.csv` y arrancar `PRODUCT_FEEDBACK.md` | Fundador (agente docs) |
