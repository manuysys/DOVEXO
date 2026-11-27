# PROMPT MAESTRO — ARVOKTA SALES AGENT
## Desarrollo completo de una plataforma inteligente de prospección comercial, investigación de empresas y CRM

---

# 1. TU ROL Y OBJETIVO

Actuá como un equipo de desarrollo de software senior compuesto por:

- Software Architect.
- Senior Full-Stack Developer.
- Backend Engineer.
- Frontend Engineer.
- Database Architect.
- AI Engineer.
- Data Engineer.
- UX/UI Designer.
- QA Engineer.
- Especialista en automatización de procesos comerciales.

Tu responsabilidad es diseñar, implementar, probar y documentar una aplicación web real llamada **ARVOKTA Sales Agent**.

No quiero una demostración visual, un prototipo estático ni simplemente una planificación técnica. Quiero que construyas una aplicación funcional, con frontend, backend, base de datos, autenticación, servicios, procesamiento de tareas y una arquitectura preparada para crecer.

Debés trabajar directamente sobre los archivos del proyecto, ejecutar comandos, instalar las dependencias necesarias, desarrollar las funcionalidades y comprobar que realmente funcionan.

No te limites a mostrar código en la conversación. Creá los archivos correspondientes dentro del repositorio.

Cuando una funcionalidad no esté implementada, no la simules ni la presentes como operativa.

Si algo no se puede implementar por falta de acceso a un proveedor externo, desarrollá la interfaz correspondiente, su abstracción y un fallback funcional, y documentá exactamente qué falta.

## Prioridad absoluta

Todo el desarrollo inicial debe realizarse utilizando tecnologías, bibliotecas, herramientas y fuentes de datos gratuitas.

NO contratar servicios.
NO utilizar API keys pagas.
NO activar pruebas que requieran tarjeta bancaria.
NO generar costos de infraestructura.
NO implementar integraciones que generen cargos inesperados.

Si una funcionalidad requiere un servicio que no tiene una alternativa gratuita comprobable, primero construí una alternativa local o dejá su integración preparada para más adelante.

El sistema debe poder desarrollarse y utilizarse localmente sin depender de servicios comerciales externos.

---

# 2. CONTEXTO DE ARVOKTA

ARVOKTA es una empresa de tecnología que desarrolla productos SaaS.

Uno de sus productos actuales es **DOVEXO**.

DOVEXO es una plataforma de gestión para empresas de servicios técnicos y operaciones de campo.

Permite centralizar procesos como:

- Gestión de clientes.
- Solicitudes de servicio.
- Órdenes de trabajo.
- Presupuestos.
- Aprobaciones online.
- Agenda.
- Asignación de técnicos.
- Seguimiento de trabajos.
- Pagos y saldos.
- Portal de clientes.
- Aplicación PWA para técnicos.
- Automatización.
- Asistencia mediante IA.

Los potenciales clientes de DOVEXO son empresas que administran solicitudes, clientes, trabajos, instalaciones, visitas técnicas, mantenimiento, presupuestos y personal operativo.

Sin embargo, ARVOKTA podrá desarrollar otros productos en el futuro.

Por eso, esta herramienta NO debe construirse exclusivamente alrededor de DOVEXO.

## Concepto central

ARVOKTA Sales Agent debe ser una plataforma comercial interna, reutilizable y modular.

Su arquitectura tendrá:

**Un motor general de prospección:**
- Descubrimiento de organizaciones.
- Investigación web.
- Extracción de datos.
- Normalización.
- Verificación.
- Detección de duplicados.
- Clasificación.
- Puntuación.
- CRM.
- Historial de interacciones.

**Múltiples configuraciones comerciales:**
- Productos de ARVOKTA.
- Públicos objetivos.
- Rubros.
- Criterios de compatibilidad.
- Problemas que resuelve cada producto.
- Propuestas de valor.
- Estrategias comerciales.
- Plantillas de mensajes.

DOVEXO será el primer producto configurado, pero no tendrá que existir código específico de DOVEXO dentro del motor principal.

La lógica de prospección debe funcionar para distintos productos mediante configuraciones, reglas y perfiles comerciales.

---

# 3. CONFIGURACIÓN INICIAL DEL SISTEMA

La primera versión tendrá la siguiente configuración.

## Nombre

ARVOKTA Sales Agent.

## Idioma

Español.

Preparar internacionalización futura, pero toda la interfaz inicial será en español rioplatense/neutro.

## País

Argentina.

El sistema debe contemplar:

- Ciudad Autónoma de Buenos Aires.
- Provincia de Buenos Aires.
- Catamarca.
- Chaco.
- Chubut.
- Córdoba.
- Corrientes.
- Entre Ríos.
- Formosa.
- Jujuy.
- La Pampa.
- La Rioja.
- Mendoza.
- Misiones.
- Neuquén.
- Río Negro.
- Salta.
- San Juan.
- San Luis.
- Santa Cruz.
- Santa Fe.
- Santiago del Estero.
- Tierra del Fuego.
- Tucumán.

La búsqueda debe permitir seleccionar todo el país, una provincia o localidades específicas.

No limitar las búsquedas a Buenos Aires ni al AMBA.

## Rubros iniciales

Crear un catálogo configurable con los siguientes identificadores:

1. `hvac`: refrigeración, climatización, aire acondicionado, calefacción y refrigeración industrial.
2. `it_support`: soporte informático, reparación de PC, redes, infraestructura, servidores y asistencia IT.
3. `electronic_security`: cámaras, CCTV, alarmas, cercos eléctricos, control de acceso y seguridad electrónica.
4. `industrial_maintenance`: mantenimiento industrial, mantenimiento edilicio, instalaciones técnicas y servicios operativos.
5. `gates_automation`: automatización de portones, barreras, accesos, puertas automáticas y sistemas similares.
6. `appliance_repair`: service y reparación de electrodomésticos.
7. `electrical_installations`: instalaciones eléctricas, mantenimiento eléctrico, electricidad comercial e industrial.

Cada rubro deberá tener palabras clave, sinónimos, términos alternativos y búsquedas relacionadas.

El catálogo debe poder ampliarse sin modificar la lógica central.

## Criterio de búsqueda

Buscar empresas de todos los tamaños.

No descartar automáticamente:

- Profesionales independientes.
- Técnicos particulares.
- Pequeñas empresas.
- Empresas familiares.
- PyMEs.
- Empresas medianas.
- Empresas grandes.

El objetivo es descubrir oportunidades, no excluir empresas por no tener una estructura empresarial conocida.

El sistema puede identificar indicios de tamaño, pero no debe inventar cantidades de empleados ni descartar prospectos únicamente por su tamaño.

---

# 4. PRINCIPIOS DE ARQUITECTURA

La aplicación debe respetar los siguientes principios:

### 4.1. Modularidad

Cada funcionalidad importante debe estar aislada en un módulo.

No crear un archivo gigante que contenga toda la lógica.

Separar:

- Descubrimiento.
- Investigación.
- Extracción.
- Normalización.
- Verificación.
- Clasificación.
- Scoring.
- Generación de mensajes.
- CRM.
- Automatizaciones.
- Gestión de productos.
- Gestión de campañas.

### 4.2. Proveedores intercambiables

Nunca acoplar la aplicación a una API específica.

Implementar interfaces o contratos para:

- Proveedores de descubrimiento.
- Proveedores de investigación web.
- Proveedores de IA.
- Proveedores de almacenamiento.
- Proveedores de geocodificación.

Ejemplo conceptual:

`CompanyDiscoveryProvider`

Implementaciones iniciales:

- `OpenStreetMapProvider`
- `CsvImportProvider`
- `ManualCompanyProvider`

En el futuro podrán agregarse otros proveedores sin reescribir los servicios que consumen sus resultados.

### 4.3. Datos trazables

Todo dato importante extraído de una fuente externa debe registrar:

- Valor obtenido.
- URL de procedencia.
- Tipo de fuente.
- Fecha y hora de consulta.
- Método de extracción.
- Nivel de confianza.
- Estado de validación.

No permitir que una conclusión de IA se guarde como si fuera un hecho comprobado.

### 4.4. Funcionar sin IA externa

El sistema debe poder trabajar incluso sin una API de inteligencia artificial.

Implementar:

- Reglas determinísticas.
- Plantillas.
- Puntuación basada en evidencia.
- Generación básica de mensajes.

La integración de IA debe ser opcional.

### 4.5. Persistencia y recuperación

No depender únicamente de memoria RAM para el procesamiento de búsquedas.

Guardar los trabajos en base de datos.

Una búsqueda debe conservar su estado aunque se cierre el frontend o se reinicie el backend.

Los trabajos fallidos deben poder reintentarse.

---

# 5. STACK TECNOLÓGICO

Utilizar tecnologías gratuitas y de código abierto.

Elegir versiones estables y compatibles al momento de implementar. Fijar versiones mediante los archivos de dependencias y conservar lockfiles.

## Frontend

- Next.js.
- React.
- TypeScript.
- Tailwind CSS.
- shadcn/ui cuando sea conveniente.
- Lucide Icons.
- TanStack Query para consultas y caché, si aporta valor.
- React Hook Form.
- Zod.

Usar Next.js App Router.

Implementar componentes reutilizables, layouts, estados de carga, errores, confirmaciones y validación de formularios.

No llenar el frontend de lógica de negocio.

## Backend

- Python.
- FastAPI.
- Pydantic.
- SQLAlchemy 2.
- Alembic.
- HTTPX.
- BeautifulSoup.
- Playwright cuando sea realmente necesario.
- RapidFuzz para comparaciones aproximadas.
- Phonenumbers para normalización telefónica.
- Pytest.
- Ruff.

Separar routers, schemas, modelos, servicios, repositorios y workers.

## Base de datos

SQLite será la base de datos predeterminada durante el desarrollo local.

Utilizar SQLAlchemy y Alembic para permitir migrar posteriormente a PostgreSQL sin reconstruir el dominio.

Mantener compatibilidad futura con PostgreSQL mediante una configuración de conexión.

No hacer que Supabase sea una dependencia obligatoria para la primera versión.

No almacenar la base de datos dentro de una carpeta temporal.

## Procesamiento de tareas

Desarrollar un worker independiente del servidor HTTP.

En el MVP utilizar una cola persistente sencilla basada en la base de datos.

Los trabajos deben contar con:

- Estado.
- Tipo.
- Parámetros.
- Fecha de creación.
- Fecha de inicio.
- Fecha de finalización.
- Cantidad de intentos.
- Error.
- Resultado.

Estados posibles:

`pending`, `running`, `completed`, `failed`, `cancelled`.

Implementar bloqueos simples para evitar que dos workers ejecuten simultáneamente el mismo trabajo.

No incorporar Redis ni otros servicios externos si no son necesarios.

## Inteligencia artificial local

Diseñar una interfaz `AIProvider`.

Permitir integrar Ollama como proveedor local opcional.

La aplicación debe funcionar sin Ollama.

Cuando esté disponible:

- Utilizar un modelo configurado por variable de entorno.
- Enviar únicamente la información necesaria.
- Solicitar respuestas estructuradas.
- Validar el JSON devuelto.
- Manejar tiempos de espera.
- Manejar errores.
- Reintentar de forma limitada.
- Evitar que una respuesta inválida rompa el procesamiento.

No asumir que todos los equipos tienen GPU ni modelos instalados.

No descargar modelos automáticamente.

---

# 6. CONDICIÓN OBLIGATORIA: COSTO CERO

Durante toda la implementación:

- No usar servicios pagos.
- No usar servicios que requieran tarjeta bancaria.
- No instalar software comercial de pago.
- No consumir créditos de API sin autorización.
- No incluir claves secretas en el código.
- No activar cuentas de servicios externos.
- No desplegar nada con facturación.

Todo debe poder ejecutarse localmente.

## Fuentes gratuitas iniciales

Implementar como primera fuente de descubrimiento:

### OpenStreetMap / Overpass API

Utilizar datos abiertos de OpenStreetMap para descubrir empresas y establecimientos que tengan etiquetas relevantes.

Investigar etiquetas como:

- `craft`
- `office`
- `shop`
- `industrial`
- `service`
- `man_made`
- `amenity`

La consulta debe utilizar filtros adecuados para cada rubro.

No asumir que todos los comercios están registrados ni que todos tienen teléfono o web.

Implementar:

- Consultas por zona geográfica.
- Consultas por categoría.
- Paginación o subdivisión geográfica cuando sea necesaria.
- Caché.
- Límites de frecuencia.
- Reintentos con backoff.
- Identificación de resultados previamente procesados.

Respetar las políticas de uso de Overpass y las condiciones de OpenStreetMap.

No lanzar miles de consultas consecutivas.

### Importación CSV

Desarrollar un importador que permita incorporar empresas desde archivos CSV.

Debe incluir:

- Detección de columnas.
- Mapeo de campos.
- Validación.
- Vista previa.
- Detección de duplicados.
- Informe de registros omitidos.
- Posibilidad de deshacer una importación si todavía no se usaron esos registros.

### Ingreso manual

Permitir agregar una empresa manualmente con su sitio web, localidad, rubro y contactos conocidos.

### Investigación de sitios oficiales

Para empresas descubiertas:

- Consultar la página oficial.
- Detectar enlaces de contacto.
- Extraer teléfonos y correos publicados.
- Buscar enlaces oficiales de WhatsApp.
- Identificar servicios ofrecidos.
- Extraer descripciones relevantes.
- Guardar fuentes y evidencia.

Utilizar HTTPX y BeautifulSoup como primera opción.

Playwright debe utilizarse solamente cuando una página requiera renderizado JavaScript y el acceso sea permitido.

Respetar robots.txt, términos de uso, límites de solicitudes y mecanismos de protección.

No utilizar CAPTCHA solvers.

No acceder a cuentas privadas.

No automatizar la extracción de información que requiera iniciar sesión.

No implementar scraping de LinkedIn, perfiles privados, grupos o información protegida de redes sociales.

No eludir bloqueos ni restricciones técnicas.

### Búsqueda web futura

Diseñar una abstracción para proveedores de búsqueda web.

Si existe un proveedor con plan gratuito realmente utilizable, puede incorporarse como adaptador opcional, pero solamente después de verificar sus condiciones, cuotas, restricciones y posibles costos.

No depender de endpoints no oficiales que podrían dejar de funcionar.

No hacer scraping indiscriminado de resultados de motores de búsqueda.

Si no hay un proveedor gratuito y permitido, mantener el sistema operativo mediante OSM, importación CSV e ingreso manual.

La ausencia de un proveedor pago no debe impedir continuar el desarrollo.

---

# 7. DISEÑO MULTIPRODUCTO

Esta es una de las partes arquitectónicas más importantes.

NO construir una aplicación específica para DOVEXO.

Crear un sistema donde ARVOKTA pueda registrar tantos productos como necesite.

## Entidad Product

Cada producto debe incluir:

- ID.
- Nombre.
- Slug.
- Descripción.
- Propuesta de valor.
- Problemas que resuelve.
- Público objetivo.
- Sectores relevantes.
- Palabras clave.
- Tipos de clientes.
- Necesidades que indica compatibilidad.
- Criterios de scoring.
- Configuración de mensajes.
- Estado.
- Fecha de creación.
- Fecha de actualización.

La configuración deberá poder editarse desde el frontend.

## Productos iniciales

Crear automáticamente un producto:

Nombre: DOVEXO.

Descripción:

Plataforma SaaS para empresas de servicios técnicos, instalaciones y operaciones de campo.

Problemas que resuelve:

- Falta de centralización de clientes.
- Solicitudes desorganizadas.
- Órdenes de trabajo dispersas.
- Presupuestos manuales.
- Dificultad para coordinar técnicos.
- Agenda desorganizada.
- Seguimiento insuficiente de trabajos.
- Control de pagos y saldos.
- Falta de historial de clientes.
- Procesos administrativos repetitivos.

Propuesta de valor:

Centralizar la operación de empresas de servicios técnicos en una única plataforma para organizar clientes, solicitudes, presupuestos, órdenes de trabajo, agenda, técnicos y pagos.

Público objetivo:

Empresas y profesionales que prestan servicios técnicos, instalaciones, reparaciones y mantenimiento.

Sectores iniciales:

Los siete rubros definidos anteriormente.

No asumir que todas las empresas del sector tienen una necesidad real. La compatibilidad debe inferirse a partir de la información disponible y mostrar su nivel de confianza.

## Entidad Campaign

Una campaña es una acción de prospección relacionada con un producto.

Ejemplo:

Producto: DOVEXO.

Campaña: DOVEXO — Argentina — Prospección inicial.

Configuración:

- País: Argentina.
- Provincias: todas.
- Rubros: todos los iniciales.
- Tamaño de empresa: todos.
- Estado: activa.

Cada campaña tendrá sus propios criterios de búsqueda, filtros, estadísticas y prospectos relacionados.

Una empresa podrá pertenecer a distintas campañas y ser evaluada para distintos productos sin duplicarse en la base global.

---

# 8. DESCUBRIMIENTO DE EMPRESAS

Crear el módulo `discovery`.

Responsabilidades:

- Recibir los parámetros de búsqueda.
- Generar consultas por rubro.
- Generar consultas por zona.
- Consultar los proveedores disponibles.
- Normalizar resultados.
- Identificar empresas existentes.
- Guardar fuentes.
- Actualizar la campaña.
- Registrar estadísticas.

## Tipos de búsqueda

### Búsqueda nacional

Permitir buscar en todo el país.

No ejecutar una única consulta gigantesca.

Dividir las búsquedas por provincia, localidad y rubro.

Crear trabajos individuales y procesarlos respetando límites de frecuencia.

### Búsqueda provincial

Permitir seleccionar una provincia y combinarla con distintos rubros.

### Búsqueda local

Permitir ingresar una localidad y rubros.

### Búsqueda por palabras clave

Permitir términos libres.

Ejemplos:

- servicio técnico refrigeración industrial.
- mantenimiento de aire acondicionado comercial.
- instalación de cámaras de seguridad.
- soporte IT para empresas.
- reparación de portones automáticos.
- mantenimiento eléctrico industrial.
- service de electrodomésticos a domicilio.

### Búsqueda por campaña

Poder configurar una campaña y procesar automáticamente todas las combinaciones geográficas y de rubros.

## Deduplicación

Implementar un servicio específico.

Orden de comparación:

1. Dominio web normalizado.
2. Teléfono normalizado.
3. ID de proveedor.
4. Nombre comercial normalizado.
5. Localidad.
6. Comparación aproximada con RapidFuzz.

No fusionar automáticamente registros cuando la coincidencia sea dudosa.

Crear un estado `possible_duplicate` para revisión manual.

Una empresa puede utilizar distintos nombres comerciales y distintas sucursales. La deduplicación no debe destruir esa información.

---

# 9. INVESTIGACIÓN Y ENRIQUECIMIENTO

Crear el módulo `enrichment`.

Una vez que se encuentra una empresa, investigar sus fuentes públicas.

## Páginas a priorizar

En este orden:

1. Página principal del sitio oficial.
2. Página de servicios.
3. Página de contacto.
4. Página de nosotros.
5. Página de mantenimiento o soporte.
6. Otras páginas oficiales relevantes.

Evitar recorrer indiscriminadamente todo el sitio.

Aplicar límites configurables de páginas, tamaño y tiempo.

## Datos a extraer

- Nombre comercial.
- Descripción.
- Servicios.
- Rubros.
- Actividades.
- Tipos de clientes que atiende.
- Localidades en las que trabaja.
- Cobertura geográfica.
- Instalaciones.
- Reparaciones.
- Mantenimiento.
- Visitas técnicas.
- Presupuestos.
- Atención de urgencias.
- Canales de contacto.

No inventar cantidad de empleados, técnicos, clientes o sucursales.

Usar etiquetas como:

- `observed`: información explícita encontrada.
- `inferred`: interpretación razonable.
- `unknown`: no se encontró información.

Cada hallazgo debe tener su correspondiente fuente cuando sea posible.

---

# 10. MÓDULO DE CONTACTOS Y VERIFICACIÓN

Crear un módulo específico para teléfonos, WhatsApp, correos y páginas de contacto.

Nunca asumir que un teléfono es WhatsApp.

## Tipos de contacto

- WhatsApp.
- Teléfono fijo.
- Celular.
- Email.
- Formulario web.
- Instagram empresarial.
- Facebook empresarial.
- Otro canal público.

## Estados de verificación

WhatsApp:

1. `not_found`: no encontrado.
2. `phone_only`: hay teléfono publicado, pero no enlace WhatsApp confirmado.
3. `published_link`: existe un enlace WhatsApp publicado por la empresa.
4. `manual_confirmed`: una persona comprobó manualmente que permite iniciar una conversación.
5. `invalid`: el contacto fue comprobado como inválido.
6. `do_not_contact`: se debe excluir.

El sistema nunca debe transformar automáticamente `phone_only` en `published_link`.

## Enlaces

Detectar:

- `wa.me`
- `api.whatsapp.com`
- `whatsapp.com`
- enlaces equivalentes.

Extraer el número cuando esté disponible.

Normalizar números argentinos a formato internacional cuando sea posible.

Usar librerías adecuadas y conservar siempre el valor original.

No indicar que un número está activo por el solo hecho de tener un formato correcto.

## Evidencia

Guardar:

- URL donde apareció.
- Texto visible relacionado.
- Fecha de descubrimiento.
- Tipo de verificación.
- Estado.

## Privacidad y contacto

Un dato publicado no debe interpretarse automáticamente como consentimiento para cualquier comunicación.

No implementar envío automático de mensajes en este MVP.

No implementar automatización de WhatsApp Web.

No utilizar métodos masivos de validación de números.

No enviar mensajes para comprobar si una cuenta existe.

Respetar las solicitudes de no contacto.

---

# 11. SCORING COMERCIAL

Crear un módulo `scoring` reutilizable para todos los productos.

El puntaje deberá depender de la configuración del producto y no estar codificado exclusivamente para DOVEXO.

## Dos valores diferentes

### A. Compatibilidad comercial

Puntaje de 0 a 100.

Indica qué tan bien parece encajar la empresa con la propuesta de valor del producto.

### B. Confianza de la información

Puntaje de 0 a 100.

Indica qué tan completa, reciente y verificable es la información utilizada.

Nunca confundir compatibilidad con certeza.

Una empresa puede tener 95/100 de compatibilidad y solamente 40/100 de confianza si la información disponible es muy escasa.

## Configuración inicial de DOVEXO

Ponderación propuesta:

- Afinidad del rubro: 0–30.
- Evidencia de trabajo de campo e instalaciones: 0–20.
- Reparaciones y mantenimiento: 0–15.
- Gestión de presupuestos, visitas o servicios: 0–15.
- Señales de operaciones con clientes recurrentes: 0–10.
- Calidad de la evidencia comercial: 0–10.

Total: 100.

Los factores deben poder configurarse desde el producto.

Las empresas pequeñas no deben recibir una penalización automática.

No asumir que una empresa tiene problemas administrativos solo porque no publica información sobre sus procesos.

La IA debe distinguir entre:

- Hechos.
- Indicios.
- Hipótesis.
- Información desconocida.

## Explicación

Cada puntaje debe incluir razones legibles.

Ejemplo:

Compatibilidad: 88/100.

Razones:

- Ofrece mantenimiento de climatización comercial.
- Realiza instalaciones a domicilio.
- Publica servicios de reparación.
- Trabaja con empresas y hogares.
- Tiene un canal comercial publicado.

Confianza: 82/100.

Razones:

- Información extraída de su web oficial.
- Página de servicios accesible.
- Contacto publicado en la página oficial.
- Datos consultados recientemente.

---

# 12. MÓDULO DE INTELIGENCIA ARTIFICIAL

La IA será una capa opcional.

Crear:

`AIProvider`

Implementar:

`OllamaProvider`

La aplicación debe operar aunque no exista una instancia de Ollama.

## Funciones de IA

1. Clasificar rubros.
2. Resumir empresas.
3. Detectar servicios relevantes.
4. Identificar evidencias de operaciones técnicas.
5. Analizar compatibilidad con un producto.
6. Proponer necesidades potenciales.
7. Explicar el puntaje.
8. Generar mensajes personalizados.

## Restricciones

La IA nunca podrá:

- Inventar teléfonos.
- Inventar correos.
- Inventar servicios.
- Inventar ubicaciones.
- Inventar personal.
- Afirmar que una empresa usa un sistema específico sin evidencia.
- Afirmar que una empresa tiene problemas administrativos sin evidencia.
- Presentar una hipótesis como un hecho.

Todas las respuestas estructuradas deberán validarse mediante Pydantic.

Si falla la IA, guardar el error y continuar con reglas determinísticas cuando sea posible.

No bloquear el sistema porque Ollama no responda.

---

# 13. GENERACIÓN DE MENSAJES

Crear un módulo `outreach`.

El sistema debe poder redactar mensajes personalizados para cada empresa y producto.

## Tipos de mensajes

- Primer contacto.
- Presentación comercial.
- Investigación de procesos actuales.
- Seguimiento.
- Respuesta sugerida.
- Invitación a una demostración.
- Propuesta de reunión.

## Estilo de redacción

Los mensajes de ARVOKTA deben:

- Ser profesionales.
- Sonar naturales.
- Ser directos.
- Evitar lenguaje robótico.
- No ser excesivamente largos.
- No utilizar demasiadas palabras comerciales.
- No hacer promesas no confirmadas.
- Mostrar que se investigó la empresa.
- Adaptarse al canal de contacto.
- Evitar frases artificiales como "revolucionamos tu negocio".

El remitente inicial será:

Juan Manuel, de ARVOKTA.

La empresa comercializadora será siempre ARVOKTA.

El producto que se presenta será DOVEXO, salvo que se configure otro producto.

No confundir los nombres de empresa y producto.

## Información utilizada

El generador deberá utilizar:

- Nombre de empresa.
- Rubro.
- Servicios comprobados.
- Localidad.
- Cobertura.
- Evidencias relevantes.
- Propuesta de valor del producto.
- Objetivo de campaña.

Si no hay información suficiente, generar un mensaje más general y marcarlo como tal.

## Aprobación humana

Todos los mensajes deben pasar por aprobación humana.

Estados:

- Draft.
- Pending approval.
- Approved.
- Rejected.
- Manually sent.
- Replied.
- Archived.

No implementar envíos automáticos.

Al abrir WhatsApp, el mensaje debe quedar disponible para copiar o revisar, pero la persona debe ser quien decida y realice el envío.

Al registrar un mensaje como enviado, solicitar confirmación al usuario.

No marcarlo automáticamente como enviado por abrir un enlace.

---

# 14. CRM COMERCIAL

El CRM debe ser funcional y no una simple tabla.

Cada empresa tendrá una oportunidad por producto.

Una misma empresa podrá ser prospecto para varios productos de ARVOKTA.

## Estados iniciales

- New.
- Researched.
- Pending review.
- Approved.
- Contacted.
- Replied.
- Interested.
- Meeting scheduled.
- Proposal sent.
- Customer.
- Not interested.
- Invalid.
- Do not contact.

Permitir configurar el pipeline en el futuro.

## Historial

Guardar:

- Fecha de descubrimiento.
- Fecha de investigación.
- Mensajes generados.
- Mensajes enviados manualmente.
- Respuestas.
- Notas.
- Reuniones.
- Cambios de estado.
- Próxima acción.

## Seguimiento

Permitir registrar:

- Fecha del próximo seguimiento.
- Tipo de seguimiento.
- Motivo.
- Responsable.
- Estado.

No enviar recordatorios externos en el MVP; mostrar los pendientes dentro del dashboard.

---

# 15. DISEÑO DE BASE DE DATOS

Crear migraciones con Alembic.

Diseñar un modelo relacional consistente.

Entidades mínimas:

## users

- id.
- email.
- password_hash.
- role.
- is_active.
- created_at.
- updated_at.

## products

- id.
- name.
- slug.
- description.
- value_proposition.
- target_profile.
- pain_points.
- target_sectors.
- keywords.
- scoring_config.
- messaging_config.
- is_active.
- created_at.
- updated_at.

## campaigns

- id.
- product_id.
- name.
- description.
- country.
- province_filters.
- locality_filters.
- sector_filters.
- search_config.
- status.
- created_at.
- updated_at.

## companies

- id.
- name.
- normalized_name.
- legal_name.
- description.
- website.
- normalized_domain.
- province.
- locality.
- address.
- country.
- company_size_estimate.
- discovery_status.
- created_at.
- updated_at.
- last_enriched_at.

## company_sectors

- id.
- company_id.
- sector_id.
- confidence.
- source_id.

## sectors

- id.
- slug.
- name.
- synonyms.
- keywords.
- is_active.

## company_sources

- id.
- company_id.
- source_type.
- source_url.
- title.
- evidence_excerpt.
- collected_at.
- confidence.
- content_hash.

## contacts

- id.
- company_id.
- contact_type.
- original_value.
- normalized_value.
- label.
- is_primary.
- verification_status.
- source_id.
- verified_at.
- do_not_contact.
- created_at.
- updated_at.

## leads

Representan la relación entre una empresa y un producto.

- id.
- company_id.
- product_id.
- status.
- compatibility_score.
- information_confidence.
- assigned_notes.
- created_at.
- updated_at.
- last_activity_at.

Crear una restricción para evitar duplicar la misma oportunidad de empresa y producto.

## campaign_leads

Relaciona leads con campañas.

- id.
- campaign_id.
- lead_id.
- added_at.

## lead_evaluations

- id.
- lead_id.
- score.
- confidence.
- score_breakdown.
- reasons.
- evidence_ids.
- evaluation_method.
- model_name.
- evaluated_at.

Conservar evaluaciones anteriores.

## search_runs

- id.
- campaign_id.
- provider.
- query.
- location.
- sector.
- status.
- records_found.
- new_companies.
- duplicates.
- errors.
- started_at.
- finished_at.

## jobs

- id.
- job_type.
- payload.
- status.
- attempts.
- max_attempts.
- priority.
- scheduled_at.
- started_at.
- finished_at.
- error_message.
- created_at.

## outreach_messages

- id.
- lead_id.
- contact_id.
- campaign_id.
- channel.
- message_type.
- generated_text.
- edited_text.
- status.
- created_at.
- approved_at.
- sent_at.

## activities

- id.
- lead_id.
- activity_type.
- description.
- metadata.
- occurred_at.
- next_action_at.

## suppression_entries

- id.
- company_id.
- normalized_contact.
- reason.
- created_at.

## import_batches

- id.
- filename.
- imported_at.
- total_rows.
- successful_rows.
- skipped_rows.
- errors.

Agregar claves foráneas, índices y restricciones adecuadas.

No almacenar datos redundantes sin motivo.

Permitir futuras migraciones.

---

# 16. AUTENTICACIÓN Y SEGURIDAD

La aplicación será privada y de uso interno de ARVOKTA.

No implementar registro público.

Crear un sistema de login.

Usar contraseñas con hash seguro.

Las credenciales iniciales se deben definir mediante variables de entorno.

No dejar contraseñas hardcodeadas.

Crear:

`.env.example`

Variables esperadas:

- DATABASE_URL.
- JWT_SECRET.
- INITIAL_ADMIN_EMAIL.
- INITIAL_ADMIN_PASSWORD.
- CORS_ORIGINS.
- OLLAMA_BASE_URL.
- OLLAMA_MODEL.
- APP_ENV.
- LOG_LEVEL.

Las variables que no se configuren deben tener un comportamiento documentado.

No registrar contraseñas ni secretos en logs.

Validar todos los inputs.

Proteger endpoints.

Controlar CORS.

No exponer documentación administrativa o rutas sensibles sin autenticación en producción.

Mantener la aplicación preparada para introducir más usuarios en el futuro.

---

# 17. DISEÑO VISUAL Y EXPERIENCIA DE USUARIO

Quiero una interfaz moderna, profesional y de calidad SaaS.

No quiero un dashboard genérico con veinte tarjetas de colores.

Debe sentirse como una herramienta comercial seria.

## Identidad visual

Marca: ARVOKTA.

Producto: ARVOKTA Sales Agent.

Estilo:

- Minimalista.
- Moderno.
- Tecnológico.
- Profesional.
- Claro.
- Sofisticado.
- Fácil de utilizar.

Elegir una paleta consistente, con fondos neutros y acentos basados en la identidad visual de ARVOKTA.

No usar gradientes exagerados.

No abusar de sombras.

No utilizar animaciones innecesarias.

Usar estados visuales claros para:

- Correcto.
- Pendiente.
- Error.
- Advertencia.
- Información.

Tipografía legible.

Buen espaciado.

Jerarquía visual clara.

Responsive para notebooks, monitores, tablets y celulares.

El escritorio será la experiencia principal.

Implementar componentes reutilizables.

No llenar las pantallas con información secundaria.

## Layout principal

Sidebar izquierda:

- Overview.
- Productos.
- Campañas.
- Buscar empresas.
- Prospectos.
- Pendientes de aprobación.
- Contactos.
- CRM.
- Importaciones.
- Historial de búsquedas.
- Configuración.

Barra superior:

- Selector de producto.
- Campaña activa.
- Búsqueda global.
- Notificaciones internas.
- Perfil del usuario.

La interfaz debe permitir cambiar de producto y visualizar sus prospectos sin mezclar sus puntajes ni sus mensajes.

---

# 18. PANTALLAS DEL MVP

## 18.1. Login

Página simple y profesional.

Formulario:

- Email.
- Contraseña.

Validación.

Errores claros.

Sin registro público.

## 18.2. Dashboard

Mostrar:

- Total de empresas.
- Nuevas empresas descubiertas.
- Empresas investigadas.
- Leads por revisar.
- Contactos publicados.
- WhatsApp publicados.
- Leads aprobados.
- Empresas contactadas.
- Respuestas.
- Reuniones.

Mostrar métricas filtrables por producto y campaña.

No inventar datos para llenar el dashboard.

Los indicadores deben salir de la base real.

Mostrar una actividad reciente.

Mostrar tareas en ejecución.

## 18.3. Productos

Listar productos configurados.

Permitir:

- Crear.
- Editar.
- Activar.
- Desactivar.
- Ver configuración comercial.

Incluir DOVEXO precargado.

Crear un producto futuro de ejemplo únicamente si queda claramente identificado como demostración y no como producto real.

No generar datos falsos de prospectos.

## 18.4. Campañas

Listado de campañas.

Crear campaña.

Seleccionar producto.

Seleccionar provincias.

Seleccionar localidades.

Seleccionar rubros.

Configurar fuentes.

Definir límites de resultados.

Ejecutar.

Ver progreso.

Pausar.

Cancelar.

Consultar resultados.

## 18.5. Buscador

Pantalla central para iniciar búsquedas.

Diseñar un formulario intuitivo.

Opciones:

- País.
- Provincia.
- Localidad.
- Rubros.
- Palabras clave.
- Proveedor.
- Límite de resultados.
- Campaña.

Incluir la opción de buscar todo Argentina.

Mostrar progreso en tiempo real o mediante consultas periódicas al backend.

## 18.6. Resultados

Tabla de empresas.

Columnas:

- Nombre.
- Rubro.
- Localidad.
- Provincia.
- Sitio web.
- Canal de contacto.
- WhatsApp.
- Compatibilidad.
- Confianza.
- Estado.
- Fecha de descubrimiento.

Filtros:

- Rubro.
- Provincia.
- Localidad.
- Score.
- Confianza.
- Contacto disponible.
- WhatsApp publicado.
- Estado CRM.
- Producto.
- Campaña.

Permitir ordenar.

Paginación real del backend.

Selección múltiple.

Exportación CSV.

## 18.7. Detalle del prospecto

Vista individual de la empresa.

Secciones:

1. Información general.
2. Rubros.
3. Servicios.
4. Canales de contacto.
5. Fuentes y evidencias.
6. Evaluación comercial.
7. Mensajes.
8. Historial.
9. Actividades.
10. Próximos pasos.

Mostrar de manera evidente cuándo un dato es inferido y cuándo está confirmado.

## 18.8. Aprobación de prospectos

Bandeja de revisión humana.

Cada prospecto debe presentar:

- Nombre.
- Descripción.
- Fuente principal.
- Rubro.
- Compatibilidad.
- Confianza.
- Datos de contacto.
- Mensaje sugerido.

Acciones:

- Aprobar.
- Editar.
- Descartar.
- Marcar duplicado.
- No contactar.

## 18.9. Generador de mensajes

Permitir seleccionar:

- Producto.
- Canal.
- Tipo de mensaje.
- Estilo.
- Información relevante.

Mostrar el texto editable.

Mostrar las evidencias utilizadas.

Permitir regenerar.

Copiar.

Guardar borrador.

Aprobar.

Abrir el enlace de contacto manualmente.

## 18.10. CRM

Mostrar pipeline comercial.

Permitir cambiar estados mediante drag and drop o controles accesibles.

Guardar el historial.

Programar próximos seguimientos.

Agregar notas.

Buscar contactos.

## 18.11. Importaciones

Permitir subir CSV.

Previsualizar.

Mapear columnas.

Validar.

Detectar duplicados.

Confirmar.

Consultar informe.

## 18.12. Configuración

- Perfil.
- Productos.
- Rubros.
- Provincias.
- Proveedores.
- IA local.
- Configuración de búsquedas.
- Límites de consulta.
- Exportación.
- Backup.
- Logs.

---

# 19. API BACKEND

Diseñar endpoints REST claros y documentados.

Prefijo:

`/api/v1`

Endpoints iniciales:

## Auth

- POST `/auth/login`
- GET `/auth/me`
- POST `/auth/logout`

## Products

- GET `/products`
- POST `/products`
- GET `/products/{id}`
- PATCH `/products/{id}`
- DELETE `/products/{id}`

## Campaigns

- GET `/campaigns`
- POST `/campaigns`
- GET `/campaigns/{id}`
- PATCH `/campaigns/{id}`
- POST `/campaigns/{id}/start`
- POST `/campaigns/{id}/pause`
- POST `/campaigns/{id}/cancel`

## Search

- POST `/search-runs`
- GET `/search-runs`
- GET `/search-runs/{id}`
- POST `/search-runs/{id}/retry`
- POST `/search-runs/{id}/cancel`

## Companies

- GET `/companies`
- POST `/companies`
- GET `/companies/{id}`
- PATCH `/companies/{id}`
- DELETE `/companies/{id}`
- POST `/companies/{id}/enrich`
- POST `/companies/{id}/deduplicate`

## Contacts

- GET `/companies/{id}/contacts`
- POST `/companies/{id}/contacts`
- PATCH `/contacts/{id}`
- POST `/contacts/{id}/verify-manually`

## Leads

- GET `/leads`
- GET `/leads/{id}`
- PATCH `/leads/{id}`
- POST `/leads/{id}/score`
- POST `/leads/{id}/approve`
- POST `/leads/{id}/reject`

## Outreach

- GET `/leads/{id}/messages`
- POST `/leads/{id}/messages/generate`
- POST `/leads/{id}/messages`
- PATCH `/messages/{id}`
- POST `/messages/{id}/approve`
- POST `/messages/{id}/mark-sent`

## Activities

- GET `/leads/{id}/activities`
- POST `/leads/{id}/activities`

## Import

- POST `/imports/preview`
- POST `/imports/confirm`
- GET `/imports`
- GET `/imports/{id}`

## Dashboard

- GET `/dashboard/metrics`
- GET `/dashboard/activity`
- GET `/dashboard/jobs`

## Health

- GET `/health`
- GET `/ready`

Cada endpoint debe tener:

- Validación.
- Manejo de errores.
- Autenticación cuando corresponda.
- Respuestas consistentes.
- Documentación.
- Tests.

---

# 20. AUTOMATIZACIONES

La arquitectura debe permitir programar búsquedas recurrentes.

Pero no implementar una frecuencia excesiva.

Opciones futuras:

- Búsqueda diaria.
- Búsqueda semanal.
- Búsqueda mensual.

En el MVP la ejecución automática puede ser local.

El usuario debe poder habilitar o deshabilitar campañas programadas.

No repetir búsquedas idénticas sin necesidad.

Usar caché y recordar los resultados.

Si el backend está apagado, las tareas deben conservar su estado y no perderse.

---

# 21. CALIDAD DE DATOS

La calidad de los datos es una prioridad central.

No quiero una herramienta que devuelva cientos de teléfonos incorrectos.

Implementar:

- Normalización.
- Deduplicación.
- Procedencia.
- Fecha de consulta.
- Estado de verificación.
- Confianza.
- Registro de errores.
- Revisión humana.

Nunca completar información faltante inventando datos.

Nunca confundir una dirección física con cobertura comercial.

Nunca confundir un número fijo con WhatsApp.

Nunca confundir una ficha de directorio con una web oficial.

Las fuentes deben mostrar claramente su nivel:

- Web oficial.
- Perfil empresarial oficial.
- Directorio externo.
- OpenStreetMap.
- Importación manual.
- Otra fuente.

Para cada dato comercial importante, conservar una referencia a la fuente.

---

# 22. PRIVACIDAD Y CUMPLIMIENTO

La aplicación debe operar de manera responsable.

Considerar la normativa argentina vigente en materia de protección de datos personales, incluyendo la Ley 25.326 cuando resulte aplicable.

Implementar:

- Minimización de datos.
- Registro de procedencia.
- Posibilidad de corrección.
- Eliminación.
- Lista de no contacto.
- Retención razonable.
- Acceso restringido.
- Exportación.
- Auditoría de cambios relevantes.

No recolectar datos sensibles.

No extraer números privados de particulares cuando no estén claramente publicados como canales comerciales.

No interpretar automáticamente que publicar un teléfono implica consentimiento para recibir publicidad.

No implementar spam ni envíos indiscriminados.

No realizar envíos automáticos de WhatsApp en el MVP.

La aplicación debe ser una herramienta de investigación comercial y gestión de prospectos, con intervención humana.

---

# 23. TESTING

No declarar una etapa terminada únicamente porque compila.

Implementar pruebas reales.

## Backend

- Tests de modelos.
- Tests de repositorios.
- Tests de endpoints.
- Tests de deduplicación.
- Tests de normalización telefónica.
- Tests de scoring.
- Tests de importación CSV.
- Tests de tareas.
- Tests de autenticación.

## Frontend

- Tests de componentes importantes.
- Tests de formularios.
- Tests de filtros.
- Tests de navegación.
- Tests de estados de error y carga.

## Integración

Verificar:

1. Crear un producto.
2. Crear una campaña.
3. Iniciar una búsqueda.
4. Guardar resultados.
5. Evitar duplicados.
6. Investigar una empresa.
7. Guardar fuentes.
8. Crear un lead.
9. Calcular scoring.
10. Generar un mensaje.
11. Aprobar un prospecto.
12. Cambiar estado comercial.
13. Registrar una actividad.
14. Exportar CSV.

Todos los tests deben poder ejecutarse localmente.

No depender de internet para las pruebas unitarias.

Usar respuestas simuladas de proveedores externos exclusivamente dentro de los tests.

---

# 24. EXPERIENCIA DE DESARROLLO EN WINDOWS

El entorno de desarrollo principal será Windows.

No hacer que Docker sea obligatorio.

Todo debe poder iniciarse desde PowerShell.

Preparar instrucciones para:

1. Crear entorno virtual Python.
2. Instalar dependencias del backend.
3. Configurar variables de entorno.
4. Ejecutar migraciones.
5. Crear usuario administrador inicial.
6. Iniciar FastAPI.
7. Instalar dependencias de frontend.
8. Iniciar Next.js.
9. Ejecutar worker.
10. Ejecutar tests.

Crear scripts:

`start-backend.ps1`

`start-frontend.ps1`

`start-worker.ps1`

`start-all.ps1`

`run-tests.ps1`

Los scripts deben:

- Comprobar dependencias.
- Mostrar errores comprensibles.
- No sobrescribir configuraciones existentes.
- No revelar secretos.
- Ejecutar procesos correctamente.
- Permitir detenerlos.

Docker Compose puede incluirse como opción futura, pero la primera versión no puede depender de tener Docker instalado.

---

# 25. ESTRUCTURA DE CARPETAS

Crear una estructura clara y escalable.

Propuesta:

arvokta-sales-agent/
│
├── frontend/
│   ├── app/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── dashboard/
│   │   ├── companies/
│   │   ├── campaigns/
│   │   ├── leads/
│   │   ├── outreach/
│   │   └── crm/
│   ├── features/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   └── tests/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   ├── core/
│   │   ├── database/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── repositories/
│   │   ├── services/
│   │   │   ├── discovery/
│   │   │   ├── enrichment/
│   │   │   ├── contacts/
│   │   │   ├── deduplication/
│   │   │   ├── scoring/
│   │   │   ├── ai/
│   │   │   ├── outreach/
│   │   │   └── crm/
│   │   ├── providers/
│   │   │   ├── discovery/
│   │   │   ├── geocoding/
│   │   │   ├── web/
│   │   │   └── ai/
│   │   ├── workers/
│   │   └── utils/
│   ├── migrations/
│   └── tests/
│
├── scripts/
├── database/
├── docs/
│   ├── SPEC.md
│   ├── ARCHITECTURE.md
│   ├── DATA_SOURCES.md
│   ├── SECURITY.md
│   ├── DEVELOPMENT.md
│   └── IMPLEMENTATION_STATUS.md
│
├── storage/
├── .env.example
├── .gitignore
└── README.md

Podés ajustar la estructura cuando exista una razón técnica, pero mantené la separación de responsabilidades.

No crear archivos vacíos innecesarios.

---

# 26. FASES DE DESARROLLO

Trabajar por etapas.

No intentar construir todas las funcionalidades simultáneamente.

Cada fase debe dejar una versión ejecutable.

## FASE 0 — Inspección y planificación

Primero inspeccioná el entorno de trabajo.

- Comprobá el directorio actual.
- Revisá si existe un repositorio.
- Revisá los archivos existentes.
- Comprobá las herramientas disponibles.
- Comprobá versiones de Python y Node.
- No sobrescribas archivos del usuario.
- No modifiques el proyecto DOVEXO.
- No copies secretos de otros proyectos.

Si el repositorio está vacío, inicializalo.

Documentá las decisiones.

Crear:

- README.md.
- docs/SPEC.md.
- docs/ARCHITECTURE.md.
- docs/IMPLEMENTATION_STATUS.md.
- .env.example.

Después continuá con la implementación.

No te detengas después de escribir documentación.

## FASE 1 — Núcleo funcional

Implementar:

- Backend FastAPI.
- Frontend Next.js.
- Base SQLite.
- Migraciones.
- Login.
- Usuario administrador.
- Layout.
- Dashboard vacío con estados correctos.
- Productos.
- Campañas.
- Rubros.
- Provincias.
- API básica.
- Worker con cola persistente.

Precargar DOVEXO.

Crear una primera campaña:

`DOVEXO - Argentina - Prospección inicial`.

Todos los rubros iniciales deben estar seleccionados.

## FASE 2 — Descubrimiento

Implementar:

- OpenStreetMap Provider.
- Overpass queries.
- Búsqueda por provincia.
- Búsqueda por localidad.
- Búsqueda por rubro.
- Búsqueda nacional por trabajos subdivididos.
- CSV import.
- Alta manual.
- Deduplicación inicial.
- Historial de búsquedas.
- Estados de tareas.

No implementar scraping agresivo.

Probar primero con búsquedas pequeñas.

## FASE 3 — Enriquecimiento

Implementar:

- Lectura de sitios oficiales.
- Extracción de servicios.
- Extracción de contactos.
- Extracción de enlaces.
- Identificación de WhatsApp publicado.
- Evidencias.
- Fechas.
- Confianza.
- Normalización.
- Ficha de empresa.

## FASE 4 — Scoring y mensajes

Implementar:

- AIProvider.
- Ollama opcional.
- Motor determinístico.
- Scoring genérico.
- Perfil de producto.
- Explicaciones.
- Mensajes.
- Edición.
- Aprobación.

## FASE 5 — CRM

Implementar:

- Pipeline.
- Estados.
- Actividades.
- Seguimientos.
- Historial.
- Lista de supresión.
- Exportación.

## FASE 6 — Pruebas finales y robustez

- Ejecutar tests.
- Corregir errores.
- Probar recorridos completos.
- Verificar seguridad.
- Revisar UX.
- Comprobar que no haya datos inventados.
- Documentar limitaciones.
- Actualizar IMPLEMENTATION_STATUS.md.

---

# 27. CRITERIOS PARA CONSIDERAR TERMINADO EL MVP

El MVP estará terminado cuando:

1. La aplicación inicie correctamente en Windows.
2. El usuario pueda iniciar sesión.
3. Pueda crear y editar productos.
4. DOVEXO esté precargado.
5. Pueda crear campañas.
6. Pueda buscar empresas con fuentes gratuitas.
7. Pueda incorporar empresas por CSV.
8. Pueda agregar empresas manualmente.
9. Pueda investigar sitios oficiales.
10. Pueda guardar evidencias y fuentes.
11. Pueda extraer contactos públicos.
12. Pueda distinguir teléfono de WhatsApp publicado.
13. Pueda detectar duplicados.
14. Pueda calcular compatibilidad.
15. Pueda calcular confianza.
16. Pueda generar mensajes.
17. Pueda aprobar o descartar prospectos.
18. Pueda administrar su pipeline comercial.
19. Pueda registrar actividades.
20. Pueda exportar resultados.
21. Pueda excluir contactos.
22. No requiera servicios pagos.
23. Funcione sin IA externa.
24. Tenga pruebas automatizadas.
25. Tenga documentación completa.

No declarar terminado aquello que todavía no esté funcional.

---

# 28. MODO DE TRABAJO DEL AGENTE

Estas instrucciones son obligatorias.

## No te quedes explicando

Quiero que desarrolles.

No me devuelvas únicamente una arquitectura, un listado de recomendaciones o fragmentos de código.

Inspeccioná, implementá, ejecutá y probá.

## No hagas cambios destructivos

Antes de modificar archivos existentes, inspeccionalos.

No borrar código ni configuraciones sin justificación.

No tocar carpetas de otros proyectos.

No modificar DOVEXO.

## No introduzcas costos

Antes de agregar una dependencia o integración externa, verificar si es gratuita.

No configurar credenciales ficticias como si fueran reales.

No habilitar APIs que puedan cobrar.

## No simules resultados

Si una búsqueda no encuentra empresas, mostrar cero resultados.

Si un proveedor falla, informar el error.

Si no se pudo validar un contacto, dejarlo pendiente.

No fabricar empresas ni contactos para llenar la interfaz.

## No detengas innecesariamente el desarrollo

Si existe una decisión que puede resolverse mediante un criterio técnico razonable, elegí la alternativa más simple, documentala y continuá.

Solo solicitá intervención cuando sea verdaderamente necesaria.

## Trabajá con entregas pequeñas

Al finalizar cada etapa:

- Ejecutá los tests.
- Corregí errores.
- Actualizá documentación.
- Actualizá IMPLEMENTATION_STATUS.md.
- Informá qué quedó terminado.
- Informá qué falta.
- Indicá cómo ejecutar lo implementado.

No avances ignorando errores críticos.

## Calidad

Priorizá:

- Código mantenible.
- Tipado.
- Validación.
- Manejo de errores.
- Seguridad.
- Accesibilidad.
- Rendimiento razonable.
- Experiencia de usuario.
- Trazabilidad.

No sacrifiques arquitectura por rapidez, pero tampoco construyas abstracciones innecesarias.

---

# 29. PRIMERA TAREA CONCRETA

Comenzá ahora.

En primer lugar:

1. Inspeccioná el entorno y el repositorio actual.
2. Verificá las herramientas disponibles.
3. Confirmá que sea posible desarrollar sin Docker.
4. Creá la estructura inicial del proyecto.
5. Prepará la documentación.
6. Implementá la FASE 1.
7. Ejecutá backend y frontend.
8. Ejecutá las migraciones.
9. Ejecutá los tests.
10. Corregí los errores encontrados.

No te detengas en una planificación.

Quiero terminar esta primera ejecución con:

- Una aplicación que pueda abrir en el navegador.
- Una pantalla de login funcional.
- Un dashboard operativo.
- Un producto DOVEXO precargado.
- Una campaña inicial.
- La base de datos funcionando.
- Backend y frontend conectados.
- Scripts para iniciar el proyecto desde PowerShell.
- Documentación para continuar desarrollando.

Al finalizar, mostrámelo de forma clara:

1. Qué implementaste realmente.
2. Qué archivos importantes creaste.
3. Qué tecnologías utilizaste.
4. Qué pruebas ejecutaste y sus resultados.
5. Cómo iniciar todo.
6. Qué quedó pendiente para la siguiente fase.

**Empezá inspeccionando el entorno. Luego desarrollá la primera fase completa.**