# Rediseño de la landing — Fase 1 (hero + base visual)

**Fecha:** 2026-11-18
**Estado:** implementado en local en la fase 1. **Actualización 2026-11-18:** la
landing v2 se desplegó a producción; ver la sección 9 ("Implementación final"). Las
afirmaciones de "no desplegado" de esta cabecera quedan obsoletas.
**Alcance de esta fase:** tokens del design system en `apps/web` y rediseño del
hero de la landing. El resto de las secciones queda para fases siguientes.

Documentos relacionados: [`DESIGN_AUDIT.md`](DESIGN_AUDIT.md) (hallazgos
L-01…L-12), [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) (especificación de tokens y
componentes), [`LANDING_AUDIT.md`](LANDING_AUDIT.md) (auditoría previa del
contenido), [`DEMO.md`](DEMO.md) (credenciales y entorno demo),
[`PROJECT_STATUS.md`](PROJECT_STATUS.md).

---

## 1. Objetivo y alcance

La auditoría visual del 2026-11-18 encontró que el hero ocupaba toda la pantalla,
el titular de cinco líneas dominaba la composición, el producto se veía chico y
las credenciales de demo competían con el CTA. Además, la app seguía usando la
paleta vieja (teal/ámbar/paper) mientras el brief define azul `#315EFB` como
primario.

Esta fase resuelve dos cosas:

1. **Base visual:** tokens nuevos en `apps/web/src/app/globals.css` y migración
   de los componentes base Button, Card, Badge, Input y StatCard.
2. **Hero:** layout de dos columnas, composición de producto con mockups reales,
   CTA primario azul, credenciales colapsadas y una ilustración isométrica 2D
   que reemplaza visualmente a la escena 3D en mobile.

**Fuera de alcance (no implementado):** tabs de demo, sección de beneficios,
precios, FAQ, footer, login y dashboard. Esas pantallas conservan el lenguaje
visual anterior y se abordan en fases posteriores.

---

## 2. Antes / después

Referencias a los hallazgos de [`DESIGN_AUDIT.md`](DESIGN_AUDIT.md).

| # | Antes | Después | Estado |
|---|---|---|---|
| L-01 | Hero de pantalla completa con titular de 5 líneas; mockups chicos y desconectados | Grid de dos columnas (`1.02fr / 1fr` en `lg`), titular con `clamp(2.5rem, 5.4vw, 4.6rem)` y composición de producto a la derecha | Corregido |
| L-02 | Escena 3D casi invisible; era el único soporte visual | La 3D queda como fondo decorativo y se suma `ServiceMap` (SVG isométrico) con mockups reales encima | Mitigado (la 3D no se eliminó) |
| L-03 | Sin captura del dashboard ni del teléfono; solo tarjetas de texto chico | `PanelMockup` (dashboard), `PhoneTechMockup` (teléfono del técnico) y tarjeta de presupuesto aprobado, con datos de `demo-data.ts` | Corregido |
| L-04 | Credenciales demo visibles en el primer pantallazo | Se movieron a un `<details>` cerrado: "Ver credenciales de la demo" | Corregido (siguen en el hero, colapsadas) |
| L-05 | CTA primario ámbar de la marca vieja | `ctaPrimary` usa `bg-primary` (`#315EFB`) con `mk-glow-primary`; secundario outline blanco | Corregido |
| L-06 | "Prueba gratuita de 14 días: en implementación…" | "14 días de prueba. Sin tarjeta. Podés empezar hoy." | Corregido en copy |
| L-07 | Tarjetas flotantes con 10–12 px y contraste bajo | La tarjeta de presupuesto usa 14 px en el identificador y 12 px en el importe; los mockups conservan texto interno de 9–11 px por ser decorativos | Parcial |
| L-08 | "Datos ilustrativos" repetido y conjunto poco creíble | Un solo rótulo por composición, en `hero-visual.tsx` | Corregido |
| L-09 | Hero mobile largo: texto + 2 CTA + credenciales antes del producto | Credenciales colapsadas y fila de confianza compacta; el hero sigue siendo `min-h-[100svh]` | Parcial |
| L-10 | Mockup flotante cortado al final del viewport | Composición con `aspect-ratio` propio (4/4.6 mobile, 5/4 sm, 6/5 lg) y teléfono oculto por debajo de `sm` | Parcial (requiere revisión visual final) |
| L-11 | Bloque de credenciales de ~120 px empujaba el producto fuera de pantalla | El `<details>` cerrado ocupa una línea | Corregido |
| L-12 | En mobile no había reemplazo visual de la 3D | `ServiceMap` se renderiza en todos los tamaños; la 3D sigue siendo solo desktop | Corregido |

**Lo que no cambió:** el resto de la landing (`Marquee`, `TrustStrip`, `Journey`,
`FeaturesBento`, `ProductTour`, `Pricing`, `Faq`, `FinalCta`, `SiteFooter`)
mantiene la estética anterior. Este documento no afirma que la landing completa
esté rediseñada.

---

## 3. Composición del hero

Archivos: `apps/web/src/components/marketing/hero.tsx` y
`hero-visual.tsx`.

### Columna de texto

Orden y jerarquía:

1. Eyebrow: "Software para servicios técnicos a domicilio".
2. `<h1>`: "Del primer llamado al último cobro, **todo en orden.**" (el acento
   va en ámbar).
3. Descripción (`brand.description`).
4. CTA primario "Crear mi empresa" (`/register`) y secundario "Probar la demo"
   (`/login`).
5. Línea de prueba: "14 días de prueba. Sin tarjeta. Podés empezar hoy."
6. Fila de confianza con tres características comprobables.
7. `<details>` con las credenciales de demo.

La entrada del texto usa `.mk-rise` con retrasos escalonados por CSS
(`delayStyle`), sin esperar JavaScript, para que el LCP sea el titular.

### Columna visual

`HeroVisual` es un contenedor con `aspect-ratio` y tres capas:

| Capa | Componente | Posición / tamaño | Notas |
|---|---|---|---|
| Fondo 3D | `HeroScene` → `HeroCanvas` | `absolute inset-0` | Solo desktop, lazy, con `HeroFallback` SVG hasta el primer frame |
| Ilustración 2D | `ServiceMap` | `absolute inset-0`, `opacity-70` | SVG puro, decorativo, visible en mobile |
| Producto | `PanelMockup` | arriba a la izquierda, 82 % (76 % en `lg`) | Dashboard con métricas del día |
| Producto | `PhoneTechMockup` | abajo a la derecha, 34 %, máx. 190 px | Oculto por debajo de `sm` |
| Producto | Tarjeta "Presupuesto aprobado" | abajo a la izquierda, 58 %, máx. 260 px | Número e importe de `demo-data.ts` |

El parallax usa `useScroll` + `useTransform`: la escena se mueve de `24` a `-40`
y las tarjetas de `-10` a `34`. Con `useReducedMotion` ambos rangos quedan en
`[0, 0]`.

**Datos:** todos salen de `apps/web/src/lib/marketing/demo-data.ts`
(`getDemoSummary`, `demoOperation`, `demoRefs.approvedQuoteId`, `getQuote`) y se
formatean con `formatArs`. El rótulo "Datos ilustrativos" aparece una sola vez.

**Accesibilidad:** `ServiceMap` y los mockups son `aria-hidden`; el `<details>`
es operable por teclado y tiene `focus-visible` con outline ámbar.

---

## 4. Decisiones de diseño

| Decisión | Implementación | Motivo |
|---|---|---|
| Azul como color de acción | `--ds-primary: #315efb`; `--ds-deep: #17243d`; `--ds-teal: #11a69a`; `--ds-warning: #d69b28` | Un solo color para la acción principal; el ámbar queda para acentos y estados de atención |
| Alias legacy durante la migración | `ink`, `teal`, `amber`, `paper`, `mist`, `slate` siguen expuestos en `@theme inline` | Evita romper las páginas que todavía no se migraron |
| CTA de marketing separado del Button de la app | `ctaPrimary` y `ctaGhostDark` en `components/marketing/ui.ts` | La landing tiene libertad de composición; el Button del panel mantiene su API |
| Credenciales fuera del recorrido principal | `<details>` cerrado por defecto | El CTA y la propuesta de valor recuperan el primer plano; las credenciales siguen disponibles para probar la demo |
| Confianza con hechos verificables | "Datos aislados por empresa", "Links de presupuesto seguros", "Historial de cada trabajo" | Son capacidades implementadas (aislamiento por tenant, token público, auditoría), no promesas de marketing |
| Una sola etiqueta de datos ilustrativos | Rótulo en `hero-visual.tsx` | Evita repetir el aviso en cada tarjeta sin ocultar que los datos son de ejemplo |
| Escala tipográfica con utilidades | `.text-display`, `.text-h1`…`.text-h4`, `.text-body`, `.numeric` en `globals.css` | Unifica jerarquía y habilita números tabulares en importes |

**Deuda visible:** los mockups de marketing todavía usan clases legacy
(`bg-teal`, `text-amber`, `bg-ink`). Funcionan por los alias, pero deben migrarse
a los tokens semánticos en la próxima fase. El acento del titular y el outline
de foco también usan el ámbar legacy (`#F59E0B`), distinto del `warning` del
sistema (`#D69B28`).

---

## 5. Uso de 2D y 3D

### SVG isométrico (`service-map.tsx`)

- SVG puro, `viewBox="0 0 640 460"`, sin dependencias.
- Piezas: oficina, van, técnico, casa y nodos de ruta, en la paleta del sistema.
- Decorativo: `aria-hidden="true"`.
- Animaciones: `.mk-route-dash` (ruta punteada) y `.mk-node-ring` (anillo de
  nodo). Ambas se desactivan con `prefers-reduced-motion: reduce` en
  `globals.css`.

### Three.js (`hero-scene.tsx` / `hero-canvas.tsx`)

- Se carga con `dynamic(..., { ssr: false })`.
- Condición: `(min-width: 1024px) and (prefers-reduced-motion: no-preference)`.
- Espera `requestIdleCallback` (timeout 2.5 s) o 1.2 s de fallback.
- Cámara ortográfica, fondo transparente, `pixelRatio` limitado a 1.5.
- Se pausa fuera de pantalla (`IntersectionObserver`) y con la pestaña oculta.
- Libera geometrías, materiales, renderer y contexto WebGL al desmontar.
- Si WebGL falla, queda `HeroFallback` (SVG con la misma geometría).

### Spline (obsoleto: publicado e integrado el 2026-11-18, ver §9)

En la fase 1 se creó un diorama de servicio en Spline (oficina DOVEXO, casa, van,
técnico y nodos). El archivo del editor fue
`https://app.spline.design/file/836805d9-4a49-4108-96af-0215c8ebb17b`.

Esta sección describía la decisión como pendiente ("no publicado, no integrado").
Queda **obsoleta**: la decisión final está en ADR-018 y en la sección 9.

---

## 5.1. Secciones posteriores al hero (2026-11-18)

Se rediseñaron las secciones restantes de la landing con los tokens nuevos:

- **Section heading / Reveal / Marquee**: tipografía del design system, reveal
  de 0,45 s con 12 px de desplazamiento, respeto a `prefers-reduced-motion` y
  marquee fino en `primary`.
- **Trust strip**: 4 pilares comprobables (aislamiento por empresa, accesos por
  rol, links de presupuesto revocables, historial auditado), sin logos ni
  certificaciones inventadas.
- **Journey**: línea de tiempo estática en `bg-deep`, sin parallax ni GSAP.
- **Features**: 4 filas alternadas texto/composición en lugar de cards
  idénticas; WhatsApp aparece como "requiere configuración".
- **Product tour**: 6 tabs con Radix (Dashboard, Órdenes, Presupuestos, Agenda,
  Técnico, Portal), altura estable en desktop, scroll horizontal en mobile y
  transición de 200 ms.
- **Pricing**: jerarquía por borde/etiqueta, tabla comparativa accesible,
  límites con números tabulares y notas honestas sobre enforcement y trial.
- **FAQ**: acordeón nativo con foco visible y encabezado sticky.
- **CTA final y footer**: dos acciones claras, 4 columnas y enlaces legales
  existentes.

**Riesgos conocidos:** `lib/marketing/content.ts` conserva exports sin uso
(`tourTabs`, `productStats`, `featureCards`, `trustItems`) que conviene limpiar;
las clases custom de tipografía (`text-h1`, `text-body`) se interpretan como
color en `tailwind-merge` y deben combinarse con template literals; `Reveal`
renderiza `opacity: 0` en SSR hasta que hidrata. La verificación visual de estas
secciones queda pendiente.

---

## 6. Evidencia de verificación

### Capturas locales

En `.local/design-audit/` (no versionado):

- `hero-new-1440.png`
- `hero-new-390.png`

### Comandos

```powershell
cd apps/web
pnpm typecheck
pnpm test
pnpm build
```

| Comando | Resultado reportado | Observación |
|---|---|---|
| `pnpm typecheck` | OK | Sin errores de TypeScript |
| `pnpm test` | 219 pruebas OK | Vitest |
| `pnpm build` | OK | Ejecutado **antes** del último ajuste del header |
| `pnpm lint` | No reportado en este bloque | Ejecutar antes de desplegar |

### Qué no se verificó

- ~~**No hay despliegue:** producción sigue con la landing anterior.~~ Obsoleto desde
  el 2026-11-18: la landing v2 está desplegada (sección 9).
- No se corrió Lighthouse ni se midieron Core Web Vitals.
- No se corrió una auditoría automática de accesibilidad (axe u otra).
- No se revisó el hero en 360 px ni en tablet.
- El build no se repitió después del ajuste final del header.

---

## 7. Pendientes de la landing

| Sección / pieza | Estado | Qué falta |
|---|---|---|
| Hero | Desplegado el 2026-11-18 (sección 9) | Revisión visual final en 1440/390 y contraste AA; medición de peso y LCP |
| Header | Ajustado a tokens nuevos | Verificar con el build final y en mobile |
| `Marquee` | Sin cambios | Definir si se mantiene, se acorta o se reemplaza |
| `TrustStrip` | Sin cambios | Alinear copy y estilo con la fila de confianza del hero |
| `Journey` | Sin cambios | Rediseñar las siete etapas con el sistema nuevo |
| `FeaturesBento` (beneficios) | Sin cambios | Reagrupar por beneficio, no por módulo |
| `ProductTour` (tabs de demo) | Sin cambios | Tabs interactivas con mockups y estados reales |
| `Pricing` | Sin cambios | Precios, límites y aclaración de que no se cobra todavía |
| `Faq` | Sin cambios | Revisar preguntas y respuestas contra el estado real del producto |
| `FinalCta` | Sin cambios | Adaptar al CTA azul |
| `SiteFooter` | Sin cambios | Ordenar columnas, legales y contacto |

### Próximos pasos

1. Revisar `hero-new-1440.png` y `hero-new-390.png`; corregir overflow y
   contraste antes de cualquier deploy.
2. Ejecutar `pnpm lint`, `pnpm typecheck`, `pnpm test` y `pnpm build` sobre el
   estado final del header.
3. ~~Desplegar el hero a Vercel y comparar contra producción.~~ Hecho el 2026-11-18.
4. ~~Decidir Spline (embed vs. render estático) con una medición de peso y LCP.~~
   Obsoleto: Spline se integró el 2026-11-18 (ADR-018). Falta la medición.
5. Fase 2: tabs de demo y beneficios.
6. Fase 3: precios, FAQ y footer.
7. Auditar contraste AA y correr Lighthouse al cerrar la fase.

---

## 8. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Peso de Three.js en el bundle | Aumenta el JS de la landing | Carga dinámica, solo desktop, sin reduced motion y después de idle; medir el chunk antes de desplegar |
| `iframe` de Spline | Peso, CLS, dependencia de terceros y cookies | No integrar sin medición; preferir render estático o fachada con click-to-load |
| Contraste insuficiente | Textos de 10–12 px en `white/55`–`white/60` sobre `deep` pueden no cumplir AA | Subir opacidad o tamaño mínimo; revisar con contraste medido, no a ojo |
| Overflow horizontal en mobile | Mockups absolutos dentro de un hero de `100svh` | `overflow-hidden` en la sección y `aspect-ratio` controlado; probar 360 y 390 |
| Alias legacy | Pueden ocultar usos incorrectos de color | Migrar mockups y secciones en fases; retirar alias al final |
| Copy de prueba | "14 días sin tarjeta" depende de que el cobro siga desactivado | Actualizar el copy si se habilita facturación |
| Deriva de datos de demo | `demo-data.ts` debe seguir siendo coherente con el producto | Tests de integridad existentes; revisar al cambiar estados o IDs |
| ~~Spline sin publicar~~ (obsoleto desde 2026-11-18) | La escena ya está publicada e integrada (ADR-018) | Riesgos vigentes de la integración: sección 9 |

---

## 9. Implementación final (2026-11-18)

Estado: **desplegada en producción** el 2026-11-18 (deployment
`saas-gestion-evispxp11`, alias `https://saas-gestion-web.vercel.app`). Commit de la
landing v2: `4ed02eb`. Decisión: ADR-018.

### Héroe 3D con Spline

> Reemplazado el 2026-11-19 por la escena isométrica propia (ADR-020). Esta
> sección queda como registro histórico de la integración con Spline.

| Elemento | Valor |
|---|---|
| Viewer publicado | `https://my.spline.design/dovexoheroservice-Vy1dJ8IKuodt02Zjwk4P0sbI/` |
| Runtime | `https://prod.spline.design/4zymsRJr14mnwaEJ/scene.splinecode` |
| Paquete | `@splinetool/react-spline` ^4.2.0 |
| Componente | `apps/web/src/components/marketing/spline-hero.tsx` |
| Poster estático | `apps/web/public/spline-hero-2x.webp` (1126x938) |

**Reglas de fallback (implementadas):**

1. En mobile (menos de 1024 px) no se carga Spline. Se muestra el poster estático.
2. Mientras la escena carga, se muestra el poster.
3. En desktop (`min-width: 1024px`) la escena se carga de forma dinámica.

**Regla de movimiento (implementada):** la escena se condiciona a
`(min-width: 1024px) and (prefers-reduced-motion: no-preference)`. Con reduced
motion se muestra el poster estático, igual que en mobile.

**Badge:** "Built with Spline" visible por la licencia del plan Free. Costos (precios
informados como oficiales el 2026-11-18): Hobby $15/mes con facturación mensual o
$12/mes con anual. Pro $30/$25 y Max $70/$60. Detalle en `COSTS_2026-11-18.md`.
Mientras el plan sea Free, el badge es visible en el hero.

### Tour de producto y secciones

- Tour con capturas reales del tenant demo, en `apps/web/public/product-tour/*.webp`
  (dashboard, órdenes, presupuestos, agenda, técnico, portal y presupuesto público),
  generadas desde `servicios-demo`. Componente `product-tour.tsx`, con `next/image` y
  marcos de navegador y teléfono.
- El frame del tour dice "DOVEXO · panel". No se usa un dominio que todavía no existe.
- `journey.tsx` usa GSAP ScrollTrigger (línea con scrub y stagger). Respeta
  `prefers-reduced-motion`.
- Se eliminaron `Marquee` y la scanline `mk-scan` de la landing.

### Verificación (2026-11-18)

- `scripts/verify.ps1`: Todo OK, código de salida 0. Vitest 281 pruebas y build de
  28 rutas.
- Producción (HTTP y navegador): `/` 200 con Spline y tour; `/login` 200; login demo
  con redirección a `/dashboard` sin errores de consola; `/privacy` y `/terms` 200.

**No verificado:** peso del bundle y de la escena, LCP, CLS, Lighthouse, auditoría de
contraste AA, comportamiento ante caída del runtime de Spline y QA visual en las 8
resoluciones.

### Riesgos vigentes

| Riesgo | Mitigación actual | Pendiente |
|---|---|---|
| Dependencia de `prod.spline.design` | Poster estático en mobile y en la carga | Probar el comportamiento ante caída |
| Badge en plan Free | Ninguna (es la licencia) | Decidir plan |
| Movimiento sin reduced motion | Ninguna en la escena de Spline | Condicionar por la preferencia |
| Peso no medido | Carga dinámica solo en desktop | Medir peso y LCP |

---

## Referencia rápida de archivos

| Archivo | Rol |
|---|---|
| `apps/web/src/components/marketing/hero.tsx` | Layout y copy del hero |
| `apps/web/src/components/marketing/hero-visual.tsx` | Capas, mockups, parallax y rótulo de datos |
| `apps/web/src/components/marketing/service-map.tsx` | SVG isométrico 2D |
| `apps/web/src/components/marketing/hero-scene.tsx` | Carga condicional de la 3D |
| `apps/web/src/components/marketing/hero-canvas.tsx` | Escena Three.js |
| `apps/web/src/components/marketing/ui.ts` | `ctaPrimary`, `ctaGhostDark`, focos |
| `apps/web/src/app/globals.css` | Tokens, utilidades y animaciones |
| `apps/web/src/lib/marketing/demo-data.ts` | Datos de ejemplo del hero |

## 10. Landing v4 — “El expediente vivo” (2026-11-22)

La dirección v3 se mantiene en paleta y tono, pero el producto deja de ser una
captura plana y pasa a ser un expediente armado con piezas reales.

- **Tipografía:** Boska (Fontshare, ITF Free Font License) self-hosted en
  `apps/web/src/app/fonts/boska-variable.woff2` para titulares; Archivo para
  cuerpo, UI y etiquetas; Geist Mono para IDs e importes. `--font-mk-display`
  expone la familia solo a marketing. El texto no espera JS.
- **Hero:** panel real del tenant demo recortado a la zona visible
  (`dashboard-main-v4.webp`, 35 KB), tarjeta de presupuesto aprobada, sello de
  hojalata y teléfono del técnico. Sin chrome falso ni caption debajo de la
  imagen. El hero ocupa `100svh` y el producto asoma en mobile.
- **Sello:** `FoilSeal` con `conic-gradient` cobre/ámbar/verde y una sola pasada
  de brillo; `aria-hidden` y fallback estático con `prefers-reduced-motion`.
- **Una sola orden:** `OrderRail` sticky/scroll-linked con cuatro estaciones
  (solicitud, turno, presupuesto, cobro), roles y la misma `OT-2026-0001`.
  En mobile el visual queda sticky arriba y la lista se lee debajo. El estado
  activo se calcula con un handler de scroll y `requestAnimationFrame`.
- **Producto:** `ProductTour` absorbe la lista compacta de módulos en desktop;
  en mobile se oculta para no alargar la página y queda solo la nota de
  WhatsApp. Sin Motion: fade CSS `mk-fade` al cambiar de tab.
- **Migración:** nueva sección “De la planilla a DOVEXO” con importador,
  onboarding y primera orden; la vista previa está marcada como ejemplo.
- **Truth pass:** se retira la cuota de tokens de IA por plan (el backend aplica
  un límite global), se reemplaza “prueba de 14 días” por “acceso de evaluación”,
  se corrige la respuesta de privacidad y se quita la tabla de precios en mobile
  (las tarjetas ya muestran los límites).
- **Motion v4.1 (ADR-023):** la landing usa Motion para el crossfade del rail,
  la pill de tabs y el conteo de migración; el titular, el halo, el sello, el
  teléfono y la tira operativa son CSS. El dossier queda fuera de Motion para
  no demorar el LCP. Sin GSAP, Lenis ni Three.js en el bundle de la landing.

### Motion v4.1 (2026-11-22)

La primera pasada de la v4 priorizó el LCP y quedó demasiado quieta. Se
reincorporó movimiento con una sola librería (Motion) y CSS para lo que no
necesita estado:

- **Originkit:** halo iridiscente que respira detrás del expediente (9 s) y
  sello de hojalata con una pasada de brillo.
- **Anubi:** titular que entra por líneas, teléfono que flota y expediente que
  se compone en capas.
- **MotionSites:** tira operativa en marquesina (28 s, pausa al hover) y
  progreso del rail atado al scroll.
- **Motion:** hero con CSS (líneas, halo, sello y teléfono); crossfade + escala
  del rail, hover/tap de las estaciones, pill de tabs con `layoutId`, entrada de
  migración y conteo de filas. `useReducedMotion` apaga lo que depende de
  estado; el CSS lo hace con `prefers-reduced-motion`.

### Verificación

```text
pnpm lint          -> 0 errores (2 warnings preexistentes de React Hook Form)
pnpm typecheck     -> OK
pnpm test          -> 281/281
pnpm build         -> 28 rutas
Lighthouse mobile  -> 83 / 100 / 100 / 100; LCP sintético 4.8 s sobre el
                      panel del hero (LCP observado 318 ms); TBT 40 ms; CLS 0
Lighthouse desktop -> 99 / 100 / 100 / 100; LCP 0.9 s; TBT 0 ms; CLS 0
Axe 4.14           -> 0 violaciones WCAG 2.2 AA en 1440 y 390
Motion             -> hero/rail/tabs/migración con Framer Motion; CSS en
                      halo/sello/teléfono/ticker; reduced motion verificado
Playwright         -> sin overflow de 360 a 1920; gutters alineados;
                      tabs 2x3 en 390; hero con producto visible.
```

Revisión independiente con `design-reviewer` (DeepSeek V4.1 Flash): P0 ninguno;
se corrigieron P1 de cuotas de IA por plan y tabs mobile, y P2 de gutters,
sello/folio, FAQ, duplicación de listas y foco del tablist.

### Pendiente

- Deploy a Vercel y QA visual en producción.
- Recapturar el tour cuando cambie la UI del panel; las capturas actuales son
  del tenant demo.
- Probar en un Android físico la PWA y el APK.
## 11. Landing v5 — Anubi + Better Stack (2026-11-23)

La v4.1 quedó demasiado cerca de una maqueta. La v5 se rehizo sobre dos
referencias reales: `anubi.io` (tipo, off-white, objeto único) y
`betterstack.com` (paneles oscuros, producto por módulos, UI real).

### Dirección

- **Tipografía:** Bricolage Grotesque para cuerpo/UI; Epilogue para titulares;
  IBM Plex Mono para etiquetas. Boska deja de cargarse.
- **Paleta:** `#F7F7F5` off-white, `#0F0F0F` negro, `#0B0C14` paneles y
  `#E4572E` de señal. Sin violeta.
- **Hero:** titular Epilogue enorme, tags y `QuoteDemo`: un presupuesto en HTML
  que se aprueba en el lugar y muestra el sello. Sin captura de dashboard, halo,
  teléfono ni marquesina.
- **Producto:** `ProductStory` con cuatro paneles live: órdenes, agenda,
  presupuesto y cobros. Datos de `demoOperation`, declarados como ejemplo.
- **Migración:** `glass-folder-cards` con carpeta de vidrio, arte generado en
  canvas y archivos. Lazy mount para no gastar main thread antes del LCP.
- **Precios/FAQ/CTA:** retematizados; sin cambios de copy de fondo.
- **Se retiran:** `OperationalTicker`, `OrderRail`, `ProductTour`, halo,
  teléfono flotante, conteo y `OT/QT` repetidos.

### Verificación

```text
pnpm lint          -> 0 errores (5 warnings)
pnpm typecheck     -> OK
pnpm test          -> 281/281
pnpm build         -> 28 rutas
Lighthouse mobile  -> 100 / 100 / 100 / 100; LCP 1.2 s; TBT 60 ms; CLS 0
Lighthouse desktop -> 100 / 100 / 100 / 100; LCP 0.3 s; TBT 0 ms; CLS 0
Axe 4.14           -> 0 violaciones WCAG 2.2 AA en 1440 y 390
Playwright         -> aprobación y carpeta OK; sin overflow de 360 a 1440.
```

### Pendiente

- Originkit: 12 componentes bloqueados por el límite diario; ver
  `ORIGINKIT_INTEGRATION.md`.
- Deploy a Vercel y QA visual en producción.
## 12. Landing v6 — full-bleed, motion y WebGL (2026-11-23)

La v5 seguía estática y con laterales vacíos. La v6 se apoya en Bizar (WebGL),
Motive (pinned y escala), Anubi (off-white/tipo) y Better Stack (producto).

- **Layout:** `max-w-[1600px]`, gutters 20–32 px, hero full-bleed; el panel
  entra completo desde 1024.
- **Texto:** `TextReveal` con IntersectionObserver propio; hero con `mk-line` y
  `mk-rise`; nada queda oculto si el observer no dispara.
- **Hero:** auto-aprobación a los 2.6 s, sello, tilt de 4°; sello oculto en
  mobile/tablet.
- **Producto:** secuencia pinned de cuatro pasos con paneles live, sticky de
  620 px y `operational-scene.tsx` (Three.js, un contexto, lazy, reduced motion).
- **Migración:** glass folder con auto-drop.
- **Figma:** https://www.figma.com/design/DcjgOeLHZ980LjHFuPtz55

Verificación local:

```text
pnpm lint          -> 0 errores (5 warnings)
pnpm typecheck     -> OK
pnpm test          -> 281/281
pnpm build         -> 28 rutas
Lighthouse mobile  -> 100 / 100 / 100 / 100; LCP 1.2 s; TBT 60 ms; CLS 0
Lighthouse desktop -> 100 / 100 / 100 / 100; LCP 0.3 s; TBT 0 ms; CLS 0
Axe 4.14           -> 0 violaciones WCAG 2.2 AA
Playwright         -> sin overflow de 360 a 1440; auto-aprobación, sticky y
                      auto-drop verificados.
```

Pendiente: deploy, QA en producción, variante Figma y Originkit.
## 13. Landing v7 — secciones por rol y sistema compartido (2026-11-23)

La v7 responde al feedback visual: recorte, panel vago, textos chicos, nota
sobrante, sello y carpeta sola. No cambia la dirección Anubi + Better Stack +
Motive.

- **Recorte:** se quita `overflow-hidden` del hero y el panel pinned pasa a
  680 px con paneles que entran completos; el sello queda dentro del panel.
- **Textos:** se eliminan eyebrow, tags, microcopy, “Datos de ejemplo” por panel,
  la nota de motion y los rótulos “01/04”. Lo funcional sube a 12–15 px.
- **Sello:** `ApprovalStamp` rectangular, doble borde y detalle; integrado en el
  presupuesto del hero, el panel de producto y el presupuesto público.
- **Migración:** carpeta + preview de planilla + resumen de errores + archivo
  flotante.
- **Secciones nuevas:** La oficina, El técnico, El cliente y Control. La página
  pasa de 6 a 10 secciones (~9.984 px). Ninguna usa testimonios, logos ni
  métricas de terceros.
- **Motion:** scroll-driven nativo para las secciones de rol; el resto conserva
  hero, pinned, WebGL y auto-drop.
- **Sistema compartido:** tokens y fuentes nuevos en dashboard, login, portal,
  PWA y Expo. La base se verificó con el tenant demo en el dashboard.

Verificación local:

```text
Backend  ruff/format/basedpyright OK; pytest 203
Frontend lint 0 errores (4 warnings); typecheck OK; 281 tests; build 28 rutas
Mobile   tsc OK
Lighthouse mobile  99 / 100 / 100 / 100; LCP 1.2 s; TBT 120 ms; CLS 0
Lighthouse desktop 100 / 100 / 100 / 100; LCP 0.3 s; TBT 0 ms; CLS 0
Axe 4.14 -> 0 violaciones
Playwright -> sin overflow de 320 a 1920; dashboard con demo verificado
```

Pendiente: deploy, QA en producción, Figma v7, APK nuevo y P0 de demo.