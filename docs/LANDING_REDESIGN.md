# Rediseño de la landing — Fase 1 (hero + base visual)

**Fecha:** 2026-11-18
**Estado:** implementado en local, **no desplegado**. Producción sigue mostrando
la landing anterior.
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

### Spline (estado: no integrado)

Se creó un diorama de servicio en Spline (oficina DOVEXO, casa, van, técnico y
nodos) y se verificó con captura live del editor:

- Archivo: `https://app.spline.design/file/836805d9-4a49-4108-96af-0215c8ebb17b`
- **No publicado.**
- **No integrado al frontend.**

**Decisión pendiente:** definir si se usa como embed (`iframe`/runtime de Spline)
o como render estático (imagen o video). El criterio es performance: peso,
impacto en LCP/CLS y comportamiento en mobile. No hay medición todavía, así que
no se elige una opción en este documento.

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

- **No hay despliegue:** producción sigue con la landing anterior.
- No se corrió Lighthouse ni se midieron Core Web Vitals.
- No se corrió una auditoría automática de accesibilidad (axe u otra).
- No se revisó el hero en 360 px ni en tablet.
- El build no se repitió después del ajuste final del header.

---

## 7. Pendientes de la landing

| Sección / pieza | Estado | Qué falta |
|---|---|---|
| Hero | Implementado en local | Revisión visual final en 1440/390, corregir overflow y contraste, desplegar |
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
3. Desplegar el hero a Vercel y comparar contra producción.
4. Decidir Spline (embed vs. render estático) con una medición de peso y LCP.
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
| Spline sin publicar | El archivo vive en el editor, no en el repo | Documentar el enlace y no referenciarlo desde la app hasta decidir |

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
