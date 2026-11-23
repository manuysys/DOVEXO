# Referencias de diseño frontend

Documento vivo para registrar qué se toma de cada referencia y qué no. Las
referencias son inspiración visual y de interacción: no se copia código, assets,
tipografías ni prompts propietarios.

## Referencias

| Referencia | URL | Qué mirar | Qué no copiar |
|---|---|---|---|
| Originkit — Corolla Gleam | https://www.originkit.dev/components/corolla-gleam?preset=base | Material iridiscente, luz, profundidad y ritmo de un objeto central | Código del componente, shaders, assets o presets |
| Supahero — Anubi | https://supahero.io/hero/anubi | Composición de hero, escala tipográfica, entrada y foco de acción | Código, ilustraciones o animaciones exactas |
| Anubi (sitio real) | https://anubi.io/ | Off-white, Bricolage/Epilogue/Plex, tipo enorme, objeto orbital y cursor | WebGL, código, assets o el cursor ink exacto |
| Bizar | https://bizar.ro/ | WebGL propio, tipografía y lista de proyectos como objeto | WebGL, código, shaders o assets |
| Motive One | https://motiveone.com/ | Secuencia pinned, números gigantes, bandas oscuras y ritmo | Código, videos, logos o métricas |
| Better Stack | https://betterstack.com/ | Dark `#0B0C14`, producto por módulos, UI real y copy específico | Código, logos de clientes, testimonios o métricas |
| Figma v6 | https://www.figma.com/design/DcjgOeLHZ980LjHFuPtz55 | Tokens, texto, componente y frames de la v6 | No aplica: es el archivo de trabajo |
| MotionSites — Rain Gear | https://motionsites.ai/?prompt=rain-gear | Prompt y desglose de una landing con motion; estructura y momentos | Prompt textual si está detrás de login/pago; código o assets |
| Fontshare | https://www.fontshare.com/ | Tipografías display/texto con licencia ITF; pares y pesos. **Boska** queda fuera de la landing v5 | Fuentes sin verificar licencia; archivos de terceros |

## Criterios para DOVEXO

La dirección vigente es **“Anubi + Better Stack”** (ADR-024): off-white
`#F7F7F5`, negro, paneles `#0B0C14` y un solo naranja `#E4572E`; **Bricolage
Grotesque** para cuerpo/UI, **Epilogue** para titulares e **IBM Plex Mono**
para etiquetas. Boska ya no se usa en la landing.

- Anubi aporta la escala tipográfica, el objeto único y la entrada; Better Stack
  aporta la estructura de producto por módulos con UI live.
- El hero muestra un presupuesto real en HTML que se aprueba; no una captura de
  dashboard ni un mockup genérico.
- No inventar logos, testimonios, clientes ni métricas de terceros.
- Motion: una entrada de hero, una aprobación y el hover de paneles/carpeta;
  sin marquee, scroll-jacking, parallax ni GSAP/Lenis/Three.js.
- La UI del panel es live, con `demoOperation`; no capturas.
- Tipografías: verificar licencia antes de descargar; usar `next/font/local` y
  documentar la fuente y el archivo.

## Qué se tomó en la v4

- **Originkit — Corolla Gleam:** la materialidad iridiscente y una sola pasada
  de luz. Se implementó como halo iridiscente que respira detrás del expediente
  y sello (`FoilSeal`), sin shaders, código ni assets de la referencia.
- **Supahero — Anubi:** composición de hero con producto real a la derecha,
  escala tipográfica, entrada por líneas y objeto flotante (teléfono). No se
  copiaron ilustraciones ni animaciones.
- **MotionSites — Rain Gear:** ritmo del recorrido, tira horizontal y progreso
  atado al scroll. La implementación usa Motion y CSS propio; no se usó el
  prompt ni el código del sitio.
- **Fontshare — Boska:** familia editorial self-hosted con licencia ITF Free
  Font License. Se guarda el archivo y la atribución en
  `apps/web/src/app/fonts/README.md`.

## Qué se tomó en la v5

- **Anubi.io:** off-white, escala Epilogue, objeto único, tags y entrada
  tipográfica. No se copiaron el WebGL, el cursor ink ni los assets.
- **Better Stack:** paneles oscuros `#0B0C14`, estructura de producto por
  módulos, UI real y copy específico. No se copiaron logos, testimonios,
  métricas ni código.
- **Originkit:** los 12 componentes siguen pendientes por el límite diario; no
  hay archivos de Originkit en el repo. Ver `ORIGINKIT_INTEGRATION.md`.
- **Glass folder:** componente local provisto por el usuario; se integró en
  migración y se montó con lazy loading.

## Qué se tomó en la v6

- **Bizar:** el objeto WebGL propio y la idea de tipografía como escena; el
  terreno/nodos se programó con Three.js, sin copiar shaders ni assets.
- **Motive One:** la secuencia pinned, la escala de números/titulares y el
  contraste de bandas; no se copiaron videos, logos ni métricas.
- **Anubi:** el off-white, la tipografía y el objeto único.
- **Better Stack:** la estructura de producto con UI live.
- **Figma:** variables, text styles, componente Quote Panel, frames y notas de
  motion en `FIGMA_STORYBOARD.md`.

## Proceso

1. El `design-director` elige una referencia principal y una secundaria.
2. Capturar la referencia con Playwright en 1440 y 390; guardar en
   `docs/design/references/`.
3. Escribir un brief con: qué se toma, qué se descarta, tokens, layout y motion.
4. Implementar con `frontend`/`software-engineer` y motion con
   `motion-engineer`.
5. Revisar con `design-reviewer` y `browser-qa`; adjuntar capturas.
6. Registrar en este documento la decisión y el resultado.

## MotionSites `rain-gear`

El sitio carga prompts desde Supabase y puede requerir sesión o plan pago. Si el
prompt no es visible en la UI pública, pedirle al usuario que lo pegue; no
intentar saltar el paywall. Usarlo como referencia de estructura y ritmo, no
como texto literal para DOVEXO.
