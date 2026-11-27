# Fuentes de datos — ARVOKTA Sales Agent

## Principio

Toda la información comercial debe ser trazable. Cada dato importante guarda
valor, URL de procedencia, tipo de fuente, fecha de consulta, método de
extracción, confianza y estado de validación.

## Fuentes iniciales gratuitas

### OpenStreetMap / Overpass API

- Datos abiertos de establecimientos y empresas.
- Consultas por zona, rubro y etiquetas (`craft`, `office`, `shop`, `industrial`,
  `service`, `man_made`, `amenity`).
- Subdividir búsquedas nacionales por provincia/localidad/rubro.
- Respetar límites de frecuencia, caché y políticas de uso.
- No asumir que todos los comercios están registrados ni que tienen teléfono o web.

### Importación CSV

- Detección y mapeo de columnas.
- Validación, vista previa, duplicados e informe de omitidos.
- Posibilidad de deshacer una importación no utilizada.

### Alta manual

- Nombre, sitio, localidad, rubro y contactos conocidos.
- Registrar la fuente como carga manual.

### Sitios oficiales

- HTTPX + BeautifulSoup como primera opción.
- Playwright solo si la página requiere renderizado y el acceso es permitido.
- Respetar robots.txt, términos, límites y protecciones.
- No usar CAPTCHA solvers, cuentas privadas, LinkedIn ni redes protegidas.
- No eludir bloqueos.

## Fuentes no implementadas

- Búsqueda web genérica: abstracción preparada; solo se incorpora un proveedor
  gratuito y permitido después de verificar condiciones y cuotas.
- Directorios externos: solo si la fuente es pública y permite el uso.
- APIs pagas: prohibidas en el MVP.

## Reglas de calidad

- No inventar datos faltantes.
- No confundir dirección física con cobertura comercial.
- No confundir teléfono fijo con WhatsApp.
- No confundir una ficha de directorio con la web oficial.
- Mostrar el nivel de la fuente y la confianza.
- Mantener una lista de no contacto y respetar la oposición del titular.
