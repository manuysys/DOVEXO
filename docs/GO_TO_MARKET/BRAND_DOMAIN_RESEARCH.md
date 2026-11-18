# Investigación de dominio e identidad de marca — DOVEXO / ARVOKTA

**Fecha de investigación:** 2026-11-15
**Autor:** agente research (ARVOKTA/DOVEXO)
**Alcance:** investigación pública de solo lectura. No se registró, compró ni contactó a nadie.
**Contexto:** empresa **ARVOKTA**, producto **DOVEXO** (ADR-016 en `docs/DECISIONS.md`). El dominio propio está pendiente y frena `EMAIL_FROM` con marca, URL productiva y ficha de Google Play.

---

## 1. Disponibilidad de dominios (RDAP)

Método: consultas RDAP a los registros autoritativos (Verisign para `.com`, NIC.ar para `.com.ar` vía el redirector `rdap.org`, y Google Registry para `.app`/`.dev` vía `rdap.org`). Un **404 del RDAP del registro** significa que el dominio no figura registrado en ese registro al momento de la consulta. La disponibilidad efectiva solo se confirma al iniciar el trámite de registro.

### Resumen

| Dominio | Estado RDAP (2026-11-15) | Detalle |
|---|---|---|
| `dovexo.com` | **Registrado** (en venta aftermarket) | GoDaddy, desde 2018, expira 2027-03-15. En venta a **USD 1.995** en fruits.co |
| `dovexo.com.ar` | **Libre** (no registrado) | RDAP NIC.ar respondió 404 |
| `arvokta.com` | **Libre** (no registrado) | RDAP Verisign respondió 404 |
| `arvokta.com.ar` | **Libre** (no registrado) | RDAP NIC.ar respondió 404 |
| `dovexo.app` | **Libre** (no registrado) | RDAP Google Registry respondió 404 |
| `dovexo.dev` | **Libre** (no registrado) | RDAP Google Registry respondió 404 |
| `getdovexo.com` | **Libre** (no registrado) | RDAP Verisign respondió 404 |

### Detalle por dominio

#### `dovexo.com` — REGISTRADO (con venta aftermarket)

- **Fuente:** `https://rdap.verisign.com/com/v1/domain/dovexo.com` (consultado 2026-11-15).
- **Registrar:** GoDaddy.com, LLC (IANA Registrar ID 146).
- **Registrado:** 2018-03-15T19:00:31Z. **Expira:** 2027-03-15T19:00:31Z. Último cambio del registro: 2026-10-13.
- **Estado EPP:** `client delete prohibited`, `client renew prohibited`, `client transfer prohibited`, `client update prohibited` (dominio bloqueado, típico de marketplace).
- **Nameservers:** `ns1.gofruits.co` / `ns2.gofruits.co`; sin DNSSEC (`delegationSigned: false`).
- **DNS visible:** el sitio `https://dovexo.com` sirve la landing del marketplace **fruits.co** (get fruits GmbH, Múnich): *"This domain is for sale"* — **USD 1.995,00** (VAT incluido) o *lease-to-own* desde **USD 102,13/mes**. Fuente: `https://dovexo.com` (fetch del 2026-11-15). El registro DNS coincide con el parking del marketplace: un lookup público de DNS (Robtex, `https://robtex.com/en/dns-lookup/de/705`) muestra que `dovexo.com` comparte IP con otros dominios listados en el marketplace fruits.co.
- **Lectura de riesgo:** registrado en **2018**, casi 8 años antes de la elección del nombre DOVEXO (ADR-016, 2026-11-10), y hoy es un dominio estacionado sin negocio detrás. Es comprable, pero a precio aftermarket (~130 veces el costo anual de un `.com` normal). El titular no es visible en RDAP (datos redactados); no se intentó identificarlo ni contactarlo.

#### `dovexo.com.ar` — LIBRE

- **Fuente:** `https://rdap.org/domain/dovexo.com.ar` → redirect a `https://rdap.nic.ar/domain/dovexo.com.ar`, respuesta 404 (2026-11-15). `rdap.nic.ar` es el RDAP oficial del registro `.ar` según el bootstrap de IANA que usa el redirector.
- Sin registrante ni nameservers asociados.

#### `arvokta.com` — LIBRE

- **Fuente:** `https://rdap.verisign.com/com/v1/domain/arvokta.com`, respuesta 404 (2026-11-15).

#### `arvokta.com.ar` — LIBRE

- **Fuente:** `https://rdap.org/domain/arvokta.com.ar` → `https://rdap.nic.ar/domain/arvokta.com.ar`, respuesta 404 (2026-11-15).

#### `dovexo.app` — LIBRE

- **Fuente:** `https://rdap.org/domain/dovexo.app` → `https://pubapi.registry.google/rdap/domain/dovexo.app`, respuesta 404 (2026-11-15). (El endpoint directo `rdap.nic.google` dio error de transporte; la consulta vía `rdap.org`, que resuelve el servidor RDAP autoritativo con el bootstrap de IANA, sí respondió.)

#### `dovexo.dev` — LIBRE

- **Fuente:** `https://rdap.org/domain/dovexo.dev` → `https://pubapi.registry.google/rdap/domain/dovexo.dev`, respuesta 404 (2026-11-15).

#### `getdovexo.com` — LIBRE

- **Fuente:** `https://rdap.verisign.com/com/v1/domain/getdovexo.com`, respuesta 404 (2026-11-15).

---

## 2. Conflictos de marca visibles (búsqueda web, no oficial)

**Límite importante:** esto NO es una búsqueda oficial de marcas (INPI/USPTO/EUIPO). Solo cubre lo indexado públicamente en la web a la fecha. Una coincidencia no detectada aquí no descarta un registro de marca vigente; la verificación formal es el trámite INPI descrito al final.

### "DOVEXO" — sin hallazgos de empresa/producto con el nombre exacto

Búsqueda `"DOVEXO"` (2026-11-15). **Sin hallazgos públicos de empresas, productos o apps con el nombre exacto "DOVEXO" en las búsquedas realizadas.** Lo que apareció:

- Un **usuario personal** llamado "Dovexo" en la plataforma china de ofertas `smzdm.com` (resúmenes de compras de hardware, sin marca propia). Fuente: `https://www.smzdm.com/zy/gather/a3qo5tru4x/` (2026-11-15).
- Un **perfil personal** `@vivienne.dovexo` en Lemon8 (red social lifestyle). Fuente: `https://www.lemon8-app.com/@vivienne.dovexo?region=gb` (2026-11-15).
- Cadenas de URL casuales con coincidencia de caracteres (artículo de Aftenposten con id `dOveXO`, oferta laboral con id `DovExO`): ruido de índices de URLs, no marcas.

**Nombres similares (no idénticos) existentes** — relevantes solo como riesgo fonético bajo, rubros distintos al nuestro:

| Nombre | Rubro | País | Fuente |
|---|---|---|---|
| Dovex (DOVEX Kft.) | Distribuidor de cosmética de lujo (B2B) | Hungría | `https://dovex.hu/` |
| Dovex Export Company | Exportador de fruta (manzanas, peras) | EE. UU. (Washington) | `https://dovex.com/about/` |
| Dovex AI | Infraestructura de datos para IA (RLHF) | global | `https://dovexai.io/` |
| DOUXO | Línea dermatológica veterinaria (Ceva) | global | `https://www.douxo.com/es` |

Ninguno opera en software de gestión para servicios técnicos ni en Argentina; ninguno se llama "Dovexo". Riesgo estimado: **bajo**, con la salvedad de que una búsqueda formal en INPI es la única comprobación válida.

### "ARVOKTA" — sin hallazgos públicos en las búsquedas realizadas

Búsqueda `"ARVOKTA"` (2026-11-15): **sin hallazgos públicos relevantes**. Los resultados fueron ruido no relacionado (una página de Scribd bloqueada por challenge y un sitio spam de "case study solutions"). No aparecen empresas, productos ni apps con ese nombre.

### Trámite de marca en Argentina (próximo paso, no ejecutado)

Para verificación formal en Argentina aplica el **INPI** (Ley de Marcas 22.362), con la Clasificación de Niza. Para DOVEXO como SaaS + app corresponderían típicamente:

- **Clase 9**: software, aplicaciones descargables.
- **Clase 42**: servicios de diseño y desarrollo de software, SaaS.

Datos verificables hoy (fuentes oficiales y prensa especializada, consultadas 2026-11-15):

- Portal de trámites y buscador de marcas: `https://portaltramites.inpi.gob.ar/MarcasConsultas/ConsultaTuMarca` (la búsqueda de anterioridades es gratuita).
- Aranceles: 1 solicitud **por clase** = **100 UMAPI** con hasta 20 posiciones de nomenclador. Con la UMAPI de noviembre 2026 ($420,43) son **~ARS 42.043 por clase**; desde el 01/12/2026 la UMAPI pasa a $429,68. Fuente oficial: `https://portaltramites.inpi.gob.ar/InfoPortal/Aranceles`; corrobora `https://unamarca.com.ar/aranceles-inpi/`.
- Dos clases (9 + 42) ≈ **ARS ~84.086** solo en aranceles (noviembre 2026), sin honorarios profesionales.

---

## 3. Costos estimados de registro (fuentes públicas, sin crear cuentas)

| TLD | Costo verificado | Renovación | Fuente (fecha de consulta: 2026-11-15) |
|---|---|---|---|
| `.com` | **USD 11,81**/año en Porkbun (registro = renovación = transferencia) | USD 11,81 | `https://porkbun.com/products/domains` y `https://porkbun.com/tld/com` (precio "all-in", sin sorpresas de ICANN) |
| `.com.ar` | **ARS 8.500**/año (alta = renovación = transferencia). **No es gratuito.** | ARS 8.500 | Página oficial `https://nic.ar/es/dominios/aranceles` (aranceles de la Res. 5/2024, vigentes desde 15/01/2024; corroborado por prensa: `https://www.diariouno.com.ar/economia/fuertes-subas-registrar-o-renovar-dominios-internet-nic-argentina-n1276741` y guías de oct-nov 2026) |
| `.ar` (directo) | ARS 25.500/año | ARS 25.500 | Ídem |
| `.app` | USD 8,75 primer año (promo); renovación USD 14,93 | USD 14,93 | `https://porkbun.com/products/domains` |
| `.dev` | USD 8,75 primer año (promo); renovación USD 12,87 | USD 12,87 | `https://porkbun.com/products/domains` |
| `dovexo.com` (aftermarket) | **USD 1.995** o lease desde USD 102,13/mes | — | `https://dovexo.com` (listado fruits.co, 2026-11-15) |

Notas y límites de verificación:

- El rango habitual "`.com` ~USD 10-15/año" se confirma con el precio público de Porkbun (USD 11,81). **Namecheap y Cloudflare no se pudieron verificar hoy por fetch** (Namecheap devolvió 403; la página de Porkbun es la única cita directa). No usar "Namecheap cuesta X" sin verificar.
- `.com.ar` requiere **CUIT/CUIL + Clave Fiscal nivel 2** y se tramita en Trámites a Distancia (TAD); titularidad 100% bajo el CUIT de ARVOKTA. Registrar vía intermediarios cuesta más (guías 2026 citan ARS 18.000-29.000/año) y deja la titularidad en manos del intermediario. Fuente: `https://nic.ar/es/ayuda/instructivos/registro-de-dominio` y `https://mejordigital.com.ar/como-registrar-dominios-ar/`.
- `.app` y `.dev` exigen HTTPS obligatorio (están en la HSTS preload list de los navegadores) — no es un problema para Next.js/Vercel, solo tenerlo presente.
- Los montos en ARS se ajustan; confirmar el cuadro vigente en `nic.ar/es/dominios/aranceles` antes de pagar.

---

## 4. Recomendación de compra (hipótesis — la decisión final es del fundador)

### Qué se destraba con cada dominio

| Dominio | Qué destraba |
|---|---|
| `dovexo.com.ar` (ARS 8.500/año) | `EMAIL_FROM` con marca en Resend (ej. `no-reply@dovexo.com.ar`), URL productiva propia para la web/API (hoy `saas-gestion-web.vercel.app` / `saas-gestion-api.vercel.app`), URL de política de privacidad para la **ficha de Google Play**. Es la pieza mínima para todo el bloque actual. |
| `dovexo.com` (USD 1.995 hoy) | Lo mismo + identidad "internacional" y email `@dovexo.com` corto. No destraba nada que `.com.ar` no destruya ya. |
| `dovexo.app` / `dovexo.dev` (~USD 9-15/año) | Alternativa global barata para URL productiva si no se quiere `.com.ar`; ambas obligan a HTTPS (correcto para SaaS). `.dev` comunica "herramienta técnica"; `.app` comunica producto. |
| `getdovexo.com` (~USD 12/año) | Solo como defensa/alias. **Débil para email**: Resend documenta que dominios "que parecen tu marca pero no son" (ej. `example-alerts.com` en vez de `alerts.example.com`) generan desconfianza en destinatarios y filtros antispam. Fuente: `https://resend.com/docs/dashboard/domains/introduction`. |
| `arvokta.com` + `arvokta.com.ar` (~USD 12 + ARS 8.500) | Protección de la razón social (empresa, no producto): email corporativo futuro y bloqueo de terceros. |

### Hipótesis recomendada

1. **Mínimo viable para empezar: `dovexo.com.ar`.** Libre (verificado por RDAP), cuesta ARS 8.500/año (~USD 5-6 al cambio de las guías citadas), se registra a nombre de ARVOKTA con CUIT propio (titularidad directa, sin intermediarios) y destraba los tres bloqueos actuales: Resend `EMAIL_FROM`, URL productiva y ficha de Play. El mercado inicial es Argentina (AGENTS.md), así que el `.com.ar` además comunica localidad, no es un parche.
2. **Sumar `dovexo.com` solo si el presupuesto de marca lo permite** — y no al precio aftermarket: `dovexo.com` está tomado y en venta a USD 1.995 (fruits.co). Recomendación: **no pagarlo ahora**. Es un dominio estacionado sin uso (registro 2018, sin negocio); si más adelante el producto se internacionaliza, se puede negociar o monitorear el vencimiento (2027-03-15) sin urgencia. Mientras tanto, el gap `.com` no bloquea ninguna operación actual.
3. **Alternativa global inmediata y barata: `dovexo.app`** (~USD 8,75 primer año). Recomendada solo si el fundador quiere una URL global distinta de `.com.ar` para el producto; no es necesaria para desbloquear nada hoy.
4. **Defensivos opcionales (bajo costo, decisión discrecional):** `arvokta.com` (USD 11,81) y `arvokta.com.ar` (ARS 8.500) — la empresa está 100% libre en ambas zonas hoy; registrarlos evita que un tercero tome el nombre de la razón social. `getdovexo.com`: no lo compraría — aporte nulo para email y confuso para el usuario.
5. **Resend y entregabilidad:** cualquier dominio elegido se agrega y verifica en Resend (SPF/DKIM/DMARC). Resend recomienda enviar desde un subdominio (ej. `mail.dovexo.com.ar`) para aislar la reputación de las emails transaccionales (invitaciones de equipo, accesos al portal). Fuente: `https://resend.com/docs/dashboard/domains/introduction`.

### Riesgos a tener en cuenta

- **La marca no se asegura comprando el dominio.** El registro de dominio no otorga derechos de marca en Argentina; si DOVEXO o ARVOKTA se vuelven activos comercialmente, el registro INPI es la protección real.
- `dovexo.com` registrado desde 2018 por un tercero: si ARVOKTA crece con "DOVEXO" solo en `.com.ar`, convive con un `.com` ajeno en venta. Riesgo de confusión bajo (el otro dominio está estacionado), pero existe y es la principal razón para reevaluar la compra del `.com` cuando haya ingresos.
- Los nombres parecidos "Dovex" (cosmética Hungría, fruta EE. UU.) y "Dovex AI" existen pero en rubros y países distintos; no son "DOVEXO" y no detectan conflicto directo en la búsqueda web realizada.

---

## 5. Próximos pasos concretos

1. **Registrar `dovexo.com.ar` primero** (~ARS 8.500/año, titular ARVOKTA con CUIT en TAD — nic.ar). Verificar en el buscador de `https://nic.ar/buscar-dominio` que siga libre **al momento de iniciar el trámite** (el RDAP de hoy dice libre, pero la única confirmación válida es la del alta).
2. **Decidir si se suma `dovexo.com` (aftermarket USD 1.995 en fruits.co) o se difiere.** Antes de pagar: confirmar que el listado sigue vigente, comparar con el costo de espera (vence 2027-03-15) y evaluar si el producto necesita `.com` para clientes fuera de Argentina. Mi recomendación con los datos de hoy: diferirlo.
3. **Verificar el dominio en Resend y configurar DNS (SPF/DKIM/DMARC)** con subdominio de envío (ej. `mail.dovexo.com.ar`); recién entonces cambiar `EMAIL_FROM` a la marca y activar el proveedor productivo (hoy `console`).
4. **Apuntar la URL productiva al dominio** (custom domains de Vercel, sin costo extra en Hobby) para web, API y el enlace público de presupuestos `/q/[token]`.
5. **Usar el dominio como URL de política de privacidad en la ficha de Google Play** (requisito de la ficha) cuando se suba el AAB.
6. **Búsqueda formal de marca en INPI (gratuita)** en `https://portaltramites.inpi.gob.ar/MarcasConsultas/ConsultaTuMarca` para "DOVEXO" y "ARVOKTA" en clases 9 y 42, **antes** de invertir en materiales de marca. Si está libre, el registro cuesta ~ARS 42.043 por clase (UMAPI nov 2026; se ajusta mes a mes). Sin urgencia: es tarea posterior a la puesta en marcha del dominio, pero previa a invertir en branding.
7. **Opcional, misma semana:** registrar `arvokta.com` y `arvokta.com.ar` como defensivos (USD 11,81 + ARS 8.500) si el fundador quiere blindar la razón social.

---

## Registro de fuentes (todas consultadas el 2026-11-15)

| Dato | URL |
|---|---|
| RDAP dovexo.com (registrado, GoDaddy) | `https://rdap.verisign.com/com/v1/domain/dovexo.com` |
| Venta aftermarket dovexo.com (USD 1.995) | `https://dovexo.com` (landing fruits.co) |
| NS parking dovexo.com compartidos con marketplace | `https://robtex.com/en/dns-lookup/de/705` (lookup público que lista dominios con NS `gofruits.co`) |
| RDAP dovexo.com.ar / arvokta.com.ar (404 = libres) | `https://rdap.org/domain/dovexo.com.ar` → `https://rdap.nic.ar/...` |
| RDAP arvokta.com / getdovexo.com (404 = libres) | `https://rdap.verisign.com/com/v1/domain/...` |
| RDAP dovexo.app / dovexo.dev (404 = libres) | `https://rdap.org/domain/dovexo.app` → `https://pubapi.registry.google/rdap/...` |
| Aranceles oficiales `.ar` / `.com.ar` (ARS 8.500) | `https://nic.ar/es/dominios/aranceles` |
| Prensa aranceles NIC.ar (Res. 5/2024) | `https://www.diariouno.com.ar/economia/fuertes-subas-registrar-o-renovar-dominios-internet-nic-argentina-n1276741` |
| Precios públicos Porkbun (.com 11,81 / .app 8,75 / .dev 8,75) | `https://porkbun.com/products/domains` |
| Requisito de dominio verificado en Resend + recomendación de subdominio | `https://resend.com/docs/dashboard/domains/introduction` |
| Búsqueda de marcas INPI (gratuita) | `https://portaltramites.inpi.gob.ar/MarcasConsultas/ConsultaTuMarca` |
| Aranceles INPI (100 UMAPI/clase; UMAPI nov 2026 = $420,43) | `https://portaltramites.inpi.gob.ar/InfoPortal/Aranceles`; corrobora `https://unamarca.com.ar/aranceles-inpi/` |
| Búsqueda web "DOVEXO" / "ARVOKTA" | búsqueda web de esta sesión (2026-11-15); hallazgos listados en sección 2 |

*Fin del documento. No se registró ni compró nada durante esta investigación.*
