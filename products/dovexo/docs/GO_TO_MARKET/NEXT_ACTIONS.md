# Plan de acción — próximos 14 días

**Última actualización:** 2026-11-14
**Fuente:** `PREVENTA_ENTREVISTA_LISTA.txt` (secciones 19 y 19.1) — "No empezar
creando nuevas funcionalidades del producto."
**Regla general:** la IA investiga, prepara material y armar borradores;
**el fundador contacta, entrevista y aprueba**. Ningún mensaje sale sin su
autorización.

---

## 1. División de responsabilidades

| Puede hacer la IA (agentes) | Requiere al fundador |
|---|---|
| Investigar empresas y datos públicos (con fuente y fecha) | Autorizar y enviar cada mensaje |
| Completar `PROSPECTS.csv` y `MARKET_RESEARCH.md` | Realizar entrevistas y demos |
| Preparar guiones personalizados por empresa | Tomar decisiones comerciales (a quién priorizar, precios, pilotos) |
| Preparar la demo (reset, checklist, guion) | Definir calendario de contacto |
| Redactar borradores de mensajes (`SALES_MESSAGES.md`) | Firmar y personalizar los mensajes |
| Armar material comercial y análisis de objeciones | Ejecutar el piloto con las empresas |
| Actualizar métricas y feedback con datos reales que le reporte | Validar privacidad/backups antes de pedir datos reales |

## 2. Checklist de 14 días

### Bloque A — Auditoría y sistema (días 1-3, IA)

- [x] Auditar el estado real de DOVEXO (fuente: `docs/PROJECT_STATUS.md`,
  `docs/PILOT_READINESS.md`) y definir qué se puede mostrar en demo
  (`DEMO_SCRIPT.md` §5).
- [x] Crear la estructura `docs/GO_TO_MARKET/` con los 14 archivos (README + 13 documentos de la sección 18).
- [x] Cargar los 4 prospectos conocidos en `PROSPECTS.csv` (P-001 a P-004).
- [ ] Verificar el funcionamiento de la demo contra producción (login demo,
  recorrido de 13 pasos, reset previo). La auditoría HTTP del 2026-11-14
  verificó los recursos del demo (ver `DEMO_SCRIPT.md` §5); falta el recorrido
  interactivo ensayado en navegador.
- [ ] Preparar la demo: guion ensayado + datos de `servicios-demo` en pantalla.

### Bloque B — Investigación de prospectos (días 1-7, IA `research`)

**Completada el 2026-11-14** (`MARKET_RESEARCH.md`): 21 prospectos principales
verificados (P-001 a P-021) + lista de reserva, cada dato con fuente y fecha;
sin contacto con ninguna empresa.

- [x] Investigar **al menos 20 empresas** de Haedo, El Palomar, Morón,
  Hurlingham, Santos Lugares, Castelar, Ramos Mejía, San Justo y Caseros:
  21 prospectos principales + reserva. (Santos Lugares quedó solo con señales
  débiles: los tres negocios de esa localidad van a la reserva.)
- [x] Fuentes más allá de Google Maps: directorios de fichas
  (`aireflow.com.ar`), sitios web oficiales, `argentino.com.ar`, SuperGuía,
  Cylex y publicaciones comerciales de Facebook/Instagram. Sin datos
  inventados; cada fila con fuente y fecha.
- [x] Investigar en particular: UBE Refrigeración, TOTALAIR, El Mejor Clima,
  Multitecnia (primera tanda) y Solek SRL, MG Zero Ingeniería, Climatización
  Guido Orlando, Aires Colombia ARG (segunda tanda).
- [x] Redactar en `MARKET_RESEARCH.md` los hallazgos, las limitaciones y las
  hipótesis de problemas por empresa (marcadas como hipótesis, sin validar).
- [x] Identificar las 3 empresas con mejor encaje inicial y recomendar cuál
  parece más adecuada para empezar: El Mejor Clima (P-003), TOTALAIR (P-002) y
  UBE (P-001); alternativas con volumen alto: Autoclima (P-009) y Service
  Caribe (P-011).
- [x] Migrar a `PROSPECTS.csv` los datos verificados de los 21 prospectos:
  hecho el 2026-11-14. El CSV tiene P-001 a P-021, todos `Verified` con
  `source_url` y `verified_at`, validados con `Import-Csv` (21 filas × 22
  campos).
- [ ] Pendientes informados por research (2026-11-14):
  - Reintentar la lectura de `multitecnia.com.ar` (no abrió en la sesión) y
    confirmar la dirección de la sucursal de Ramos Mejía (dato de ~2019 de
    SuperGuía).
  - Leer el contenido de la web Canva de El Mejor Clima
    (`elmejorclima.my.canva.site`): requiere JavaScript; solo quedó registrado
    el sitio y el teléfono publicado.
  - Canal de contacto: los emails no están publicados en todos los casos; el
    contacto será por teléfono/WhatsApp público, según lo que cada negocio
    publicó por escrito.
- [ ] Preparar un mensaje personalizado por empresa de la primera tanda
  (borradores en `SALES_MESSAGES.md`): **pendiente de autorización del
  fundador**; sin esa autorización no se redactan por empresa ni se envía
  nada.

### Bloque C — Preparación de entrevistas (días 4-7, IA + fundador)

- [ ] Preparar las **primeras 3 entrevistas**: ficha por empresa con el guion
  de `INTERVIEW_TEMPLATE.md` y las hipótesis a contrastar (H1-H7).
- [ ] Definir con el fundador el canal de contacto y los horarios posibles.
- [ ] (Fundador) Enviar los primeros mensajes autorizados.
- [ ] (Fundador) Realizar las entrevistas; registrar resultados en
  `INTERVIEW_RESULTS.md`.

### Bloque D — Demo y pilotos (días 8-14)

- [ ] Ajustar el guion de demo con lo aprendido en las primeras entrevistas.
- [ ] (Fundador) Realizar las demos con `DEMO_SCRIPT.md`.
- [ ] Presentar el programa de pilotos a las empresas interesadas
  (`PILOT_PROGRAM.md`).
- [ ] Arrancar `PRODUCT_FEEDBACK.md` y `METRICS.md` con los primeros datos
  reales.

### Bloque E — Informe al fundador (día 14)

Conforme a la sección 20 del mandato, presentar:

1. Estado de DOVEXO (auditado y contrastado con el código).
2. Lista de prospectos y estado de cada uno.
3. Empresas verificadas.
4. Empresas que requieren mayor investigación.
5. Entrevistas recomendadas.
6. Guion de entrevista por empresa.
7. Mensajes preparados (borradores para aprobación).
8. Guion de demostración.
9. Programa de pilotos.
10. Riesgos comerciales identificados.
11. Próximos 14 días.
12. Qué debe hacer el fundador.

## 3. Riesgos y pendientes que condicionan la etapa

- **WhatsApp, email real y push no operativos** (sin credenciales de Meta,
  dominio verificado ni Resend): los mensajes se coordinan a mano; no prometer
  automatizaciones de comunicación.
- **Backups sin restauración probada** (`docs/PILOT_READINESS.md` criterio 18):
  no pedir datos reales hasta validar privacidad y backups.
- **App móvil no probada en dispositivo físico** (criterio 16): en la demo,
  mostrar la app solo si hay APK instalado; si no, usar la PWA `/tech`.
- **Presupuesto demo único (`QT-2026-0001`):** si se aprueba en vivo queda
  `approved` hasta un reset por API (solo platform admin) y las demos
  siguientes pierden el paso de aprobación; mitigación en `DEMO_SCRIPT.md`
  §3.1.
- **0 entrevistas realizadas:** todo el material comercial descansa en
  hipótesis; priorizar conseguir las primeras conversaciones.

## 4. Registro de resultados

_(A completar por research y con lo que el fundador reporte de sus contactos:
fechas, respuestas, entrevistas agendadas.)_

| Fecha | Acción ejecutada | Quién | Resultado | Próxima acción |
|---|---|---|---|---|
| 2026-11-14 | Investigación de prospectos (21 principales + reserva, con fuente y fecha) | IA `research` | Completada en `MARKET_RESEARCH.md`; sin contacto con empresas. Pendientes: web de Multitecnia, contenido Canva de El Mejor Clima | Datos migrados a `PROSPECTS.csv` (P-001 a P-021) y pedir al fundador autorización para los mensajes personalizados |
