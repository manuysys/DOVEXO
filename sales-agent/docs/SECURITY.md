# Seguridad y privacidad — ARVOKTA Sales Agent

## Autenticación

- Aplicación privada de uso interno. Sin registro público.
- Login con email y contraseña.
- Contraseñas con Argon2id.
- JWT de acceso corto; refresh seguro si se implementa.
- Admin inicial desde variables de entorno; no hardcodear credenciales.
- CORS restringido a los orígenes configurados.
- Rate limiting en login y endpoints sensibles.
- No exponer documentación administrativa en producción.

## Datos

- La aplicación almacena datos de empresas y contactos comerciales públicos.
- No recolectar datos sensibles ni números privados no publicados como canal
  comercial.
- Registrar procedencia, fecha de consulta y confianza.
- Permitir corrección, eliminación, exportación y lista de no contacto.
- No interpretar que un teléfono publicado implica consentimiento para
  publicidad.
- No implementar spam ni envíos automáticos.

## Secretos

- `.env` local no versionado.
- `.env.example` solo con nombres y valores de ejemplo.
- No registrar contraseñas, tokens ni secretos en logs.
- No incluir claves de servicios pagos.

## Proveedores externos

- OSM/Overpass y sitios oficiales: respetar términos y límites.
- Ollama: opcional, local; no descargar modelos automáticamente.
- Cualquier proveedor nuevo requiere revisión de costo, términos y privacidad.
