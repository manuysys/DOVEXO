# Design System — DOVEXO

**Versión del documento:** 1.0 (especificación)
**Fecha:** 2026-11-18
**Alcance:** panel web (`apps/web`), PWA del técnico, portal del cliente y app
móvil Android (`apps/mobile`). La landing pública se rige por las mismas bases
con libertad de composición (ver "Landing" al final).
**Estado:** los tokens de esta especificación se están implementando en
`apps/web/src/app/globals.css`. Al 2026-11-18 ese archivo todavía expone la
paleta anterior (`ink`, `teal`, `amber`, `paper`, `mist`, `slate`) y los
componentes la consumen. Este documento es la referencia de destino, no una
descripción de lo ya migrado. El detalle de qué está hecho y qué falta está en
"Estado de implementación".

Documentos relacionados: [`DESIGN_AUDIT.md`](DESIGN_AUDIT.md) (hallazgos que
originan el sistema), [`BRAND.md`](BRAND.md) (marca y nombres),
[`UX_IMPROVEMENTS.md`](UX_IMPROVEMENTS.md) (deuda de usabilidad),
[`DECISIONS.md`](DECISIONS.md) (ADR-015/016).

---

## 1. Fundamentos y dirección visual

**Dirección:** *Premium Operational SaaS*. Un producto que se ve caro porque es
ordenado, no porque tenga efectos.

Principios, en orden de prioridad:

1. **Jerarquía antes que decoración.** En cada pantalla hay una acción primaria,
   un dato principal y el resto en segundo plano. Si todo resalta, nada resalta.
2. **Densidad B2B.** El usuario trabaja ocho horas acá: tablas compactas, labels
   cortos, poca altura por fila (40–44 px), números alineados. La comodidad no
   se logra con aire excesivo sino con alineación y contraste.
3. **Superficies planas y bordes finos.** Cards blancas sobre fondo gris muy
   claro, borde de 1 px y, como máximo, una sombra `sm`. La elevación se reserva
   para lo que realmente flota (popover, menú, diálogo, header sticky).
4. **Color con significado.** El azul indica acción; verde/ámbar/rojo indican
   estado. Un color que no comunica nada se elimina.
5. **Precisión numérica.** Importes, cantidades y fechas usan números tabulares
   y alineación a la derecha. Nunca `float`, nunca cifras que "bailan" al
   actualizarse.
6. **Honestidad de estado.** Un vacío, un error o una función no disponible se
   dice con claridad. No se simula un LLM, no se muestra un dato de ejemplo como
   real.

**Prohibido en el producto:**

- Glassmorphism global (`backdrop-blur` en cards, sidebars o tablas).
- Gradientes decorativos en superficies de trabajo. El gradiente solo se acepta
  en el hero de la landing y en gráficos de datos.
- Sombras grandes y difusas sobre cards comunes.
- Animaciones de layout que muevan contenido sin que el usuario lo haya pedido.
- Iconografía mezclada (una sola familia: Lucide).
- Texto gris claro sobre gris claro para "suavizar". Si no se lee, no sirve.

---

## 2. Color

### 2.1 Tokens

| Token | Valor | Uso | Cuándo **no** usarlo |
|---|---|---|---|
| `primary` | `#315EFB` | Acción principal (botón primario), links, foco, ítem activo de navegación, selección | Fondos grandes de página, párrafos largos, estados de negocio (usar `success`/`warning`/`danger`) |
| `primary-dark` | `#1E3A8A` | Hover y pressed de `primary`; títulos sobre superficies azuladas; encabezados de PDF | Texto de cuerpo, bordes de inputs, íconos decorativos |
| `deep` | `#17243D` | Superficies oscuras (sidebar, hero del panel), títulos, botón `secondary` | Texto secundario (usar `text-2`), fondos de listas largas |
| `secondary` | `#4778FF` | Series de gráfico, chips informativos, hover de elementos azules claros | Competir con `primary` en la misma vista; acciones primarias |
| `accent-teal` | `#11A69A` | Indicador "técnico en sitio", series de gráfico, confirmaciones de segundo nivel | Reemplazar `success`; CTAs primarios |
| `violet` | `#7459D9` | Categoría de automatizaciones e IA, series de gráfico, tags de origen | Estados del ciclo de una orden (son `success`/`warning`/`danger`) |
| `cyan` | `#4CB7D8` | Rellenos informativos, íconos de "programado", gráficos | Texto sobre blanco: el contraste no alcanza. Solo como relleno con texto oscuro encima |
| `success` | `#16865A` | Finalizado, aprobado, pago confirmado, guardado correcto | Decoración, "en curso", cualquier cosa que no sea un resultado positivo |
| `warning` | `#D69B28` | Requiere atención, por vencer, saldo pendiente, cupo cerca del límite | Errores (usar `danger`), confirmaciones |
| `danger` | `#D94848` | Error, acción destructiva, vencido, token revocado | Todo lo "urgente" que no sea error; párrafos largos |
| `info` | `#315EFB` | Avisos informativos y badges neutros-informativos | Duplicar `primary` en la misma pantalla como si fueran dos acciones |
| `bg` | `#F5F7FA` | Fondo de la aplicación | Fondo de cards, tablas o inputs (usar `surface`) |
| `surface` | `#FFFFFF` | Cards, tablas, modales, inputs, popovers | Fondo de página (genera un plano infinito sin jerarquía) |
| `surface-2` | `#F0F3F8` | Header de tabla, fila alterna opcional, input deshabilitado, tabs inactivas, skeleton | Texto de cualquier tipo; fondo de un panel completo |
| `border` | `#E3E8F0` | Bordes de card, input, tabla y divisores | Texto, íconos, indicar estado (para eso hay color semántico) |
| `text` | `#182235` | Texto principal, títulos, importes | Texto secundario (usar `text-2`) |
| `text-2` | `#667085` | Labels, metadata, ayudas, placeholders | Importes, errores, datos críticos, texto sobre `deep` (usar blanco o `#CBD5E1`) |

**Regla de contraste:** todo par texto/fondo debe cumplir 4.5:1 (texto normal) o
3:1 (texto ≥ 24 px o ≥ 19 px bold). Ningún token de la tabla está aprobado por
medición todavía: la verificación con medidor de contraste es parte del cierre de
la Fase 1 (ver `DESIGN_AUDIT.md`). En particular, `text-2` sobre `surface-2` y
`warning` sobre blanco deben medirse antes de usarse en texto chico.

**Tintes de estado:** para badges y avisos, el fondo es el color base con
opacidad 10–12 % y el texto es el mismo color base. Si el contraste resultante no
llega a 4.5:1, se usa una variante oscurecida del base. No se inventan hex nuevos
por pantalla.

### 2.2 Alias legacy (temporales)

Durante la migración conviven los nombres viejos. Se mantienen **solo** para no
romper las clases existentes y se eliminan al cerrar la Fase 1.

| Alias legacy | Equivalente nuevo | Nota |
|---|---|---|
| `ink` | `deep` `#17243D` | Hoy es `#0B1F33`; el valor cambia al migrar |
| `teal` | `primary` `#315EFB` | Cambio de matiz, no solo de nombre |
| `amber` | `warning` `#D69B28` | Deja de usarse como CTA (hoy la landing lo usa así) |
| `paper` | `bg` `#F5F7FA` | El fondo cálido desaparece del producto |
| `mist` | `border` `#E3E8F0` | |
| `slate` | `text-2` `#667085` | |

Reglas de convivencia:

- Código nuevo usa **solo** tokens nuevos.
- Un archivo que se toca se migra completo: no se dejan ambos nombres en el mismo
  componente.
- Los alias se eliminan en un único commit al final, con `grep` de verificación.
- Los tokens `--mk-*` y las utilidades `.mk-*` de `globals.css` son **exclusivos de
  la landing** y no forman parte del sistema de producto.

---

## 3. Tipografía

| Rol | Familia | Uso |
|---|---|---|
| Body | **Geist Sans** | Todo el texto de interfaz, tablas, formularios, emails |
| Display | **Space Grotesk** | Títulos de página, cifras KPI, hero de landing, PDF |
| Mono | **Geist Mono** | Códigos (`OT-2026-0001`, `QT-2026-0001`), IDs, tokens, extractos de log |

Escala (px; el valor móvil aplica a `< 640px`):

| Token | Tamaño | Peso | Altura de línea | Tracking | Uso |
|---|---|---|---|---|---|
| `display` | 44 / 32 | 600 | 1.1 | -0.02em | Hero de landing, cifra principal de un KPI hero |
| `h1` | 32 / 26 | 600 | 1.2 | -0.015em | Título de página (`PageHeader`) |
| `h2` | 24 / 22 | 600 | 1.25 | -0.01em | Título de sección o card destacada |
| `h3` | 18 / 17 | 600 | 1.3 | -0.005em | Título de card, encabezado de panel |
| `h4` | 16 | 600 | 1.35 | 0 | Subtítulo dentro de card, label de grupo |
| `body` | 14 (panel) / 16 (público) | 400 | 1.5 | 0 | Texto general |
| `small` | 13 | 400 | 1.45 | 0 | Ayuda de campo, descripción secundaria |
| `caption` | 12 | 400 | 1.4 | 0 | Metadata, timestamps, notas al pie |
| `label` | 11–12 | 600 | 1.2 | 0.08em, mayúsculas | Label de campo, eyebrow, header de columna |
| `numeric` | 14 tabla / 24 KPI / 32 hero | 600 | 1.2 | 0 | Importes, cantidades, porcentajes |

Reglas:

- **Números tabulares obligatorios** en importes, tablas y contadores:
  `font-variant-numeric: tabular-nums`. En Geist Sans se aplica con la clase de
  utilidad; en Geist Mono es nativo.
- Importes: alineados a la derecha, formato
  `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })` (ADR-005).
  Nunca se alinea un importe a la izquierda dentro de una columna.
- Códigos de orden/presupuesto en `mono` para que se distingan de un nombre.
- No se baja de 12 px en producto. 11 px solo en `label` con mayúsculas y
  tracking, nunca en contenido.
- Máximo dos familias visibles por pantalla (`display` + `body`). `mono` es
  puntual.
- Un solo `h1` por página. Los `h2`/`h3` respetan el orden, no se eligen por
  tamaño.

---

## 4. Espaciado, radios, bordes y sombras

### 4.1 Espaciado

Base 4. Nombres alineados con los múltiplos de Tailwind.

| Token | px | Uso típico |
|---|---|---|
| `space-1` | 4 | Separación ícono-texto, gap entre chips |
| `space-2` | 8 | Gap entre label y valor, padding interno de badge |
| `space-3` | 12 | Gap entre campos, padding de celda compacta |
| `space-4` | 16 | Padding de card compacta, gap de grilla en mobile |
| `space-5` | 20 | Padding de card estándar (valor actual de `Card`) |
| `space-6` | 24 | Gap entre cards, padding de sección |
| `space-8` | 32 | Separación entre bloques de una página |
| `space-10` | 40 | Padding vertical de página en desktop |
| `space-12` | 48 | Separación entre secciones mayores |
| `space-16` | 64 | Hero, bloques de landing |

Regla: el espaciado comunica pertenencia. 4–8 px = mismo grupo; 16–24 px =
bloques distintos; 32+ px = secciones. No se usa espaciado arbitrario (`p-[18px]`).

### 4.2 Radios

| Elemento | Radio | Token |
|---|---|---|
| Input, select, textarea, botón | 8–10 px | `radius-control` |
| Card, tabla contenedora, panel | 12–16 px | `radius-surface` |
| Modal, sheet | 16–20 px | `radius-overlay` |
| Popover, dropdown, tooltip | 10–12 px | `radius-popover` |
| Badge, chip, avatar circular | 999 px | `radius-pill` |

Un solo radio por nivel. No se mezcla card de 12 con card de 16 en la misma
grilla.

### 4.3 Bordes

- 1 px `border` en toda superficie de trabajo.
- 2 px solo para foco y para el borde de selección de un ítem.
- Nunca bordes de color decorativo (un borde azul no indica nada por sí solo).

### 4.4 Sombras

| Token | Valor | Uso |
|---|---|---|
| `shadow-sm` | `0 1px 2px rgba(24,34,53,.04)` | Card en reposo (opcional; el borde ya separa) |
| `shadow-md` | `0 2px 4px rgba(24,34,53,.05), 0 8px 24px -12px rgba(24,34,53,.12)` | Popover, dropdown, tooltip, header sticky |
| `shadow-lg` | `0 24px 48px -24px rgba(24,34,53,.28)` | Modal, sheet, command palette |

**Regla dura:** no se aplica sombra a todas las cards. En una grilla de cards la
sombra se omite; el borde y el espacio hacen el trabajo. La sombra indica que el
elemento está por encima del plano de la página. Si todo tiene sombra, nada está
por encima.

---

## 5. Componentes

### 5.1 Implementados

Ubicación: `apps/web/src/components/ui/` (exportados desde `index.ts`). Todos
consumen tokens legacy hoy; la migración a los tokens nuevos está pendiente y no
cambia su API.

| Componente | Propósito | Variantes / tamaños actuales |
|---|---|---|
| `Button` | Acción. Único componente para clickeables con texto | `primary` (acción principal), `secondary` (acción sólida alternativa), `outline` (terciaria), `ghost` (barras densas), `danger` (destructiva), `link`. Tamaños `sm`, `md`, `lg`, `icon` |
| `Card` | Contenedor de una unidad de información con borde propio | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` |
| `Badge` | Estado corto de un conjunto cerrado | `neutral`, `success`, `warning`, `danger`, `info`, `teal` |
| `Input` | Campo de texto de una línea | Sin variantes; alto mínimo 44 px, foco con ring |
| `PageHeader` | Encabezado de página: título, descripción, acciones | Con `eyebrow` opcional; acciones a la derecha en desktop, debajo en mobile |
| `EmptyState` | Estado vacío con explicación y acción | Ícono + título + descripción + acción opcional |
| `Skeleton` | Placeholder de carga | `Skeleton`, `SkeletonText` (n líneas), `SkeletonCard` |
| `StatCard` | Métrica única con label, valor y ayuda | Tonos `default`, `teal`, `amber`, `danger` |
| `ProgressRing` | Progreso circular con label y detalle | Colores `teal`, `amber`, `ink`; 0–100 % |
| `Dialog` | Modal bloqueante | `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose` |
| `Tabs` | Cambio de vista dentro de una misma entidad | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` |
| `Tooltip` | Aclaración breve al pasar el cursor o enfocar | `TooltipProvider`, `Tooltip`, `TooltipTrigger`, `TooltipContent` |
| `DropdownMenu` | Menú de acciones contextuales | `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuSeparator` |

Notas de migración por componente:

- `Button.secondary` hoy es `teal`; pasa a `deep`. El azul (`primary`) queda solo
  para la acción principal.
- `Badge` y `StatCard` usan escalas de Tailwind (`emerald-100`, `amber-100`). Se
  reemplazan por los tintes de los tokens semánticos.
- `ProgressRing` y `StatCard` usan `font-display` para cifras: correcto, se
  mantiene, con `tabular-nums` agregado.

### 5.2 Planificados

Ninguno existe todavía en el repositorio. Se listan con su propósito para que el
diseño y la implementación no improvisen.

**Datos y navegación**

| Componente | Propósito | Variantes previstas |
|---|---|---|
| `Table` / `DataTable` | Listado denso con orden, selección y estados | `Table` (presentacional), `DataTable` (orden, paginación, selección, columnas configurables, estado vacío y de carga propios) |
| `Pagination` | Navegación de resultados largos | Por página, con rango visible ("1–25 de 340") |
| `FilterBar` | Filtros de un listado | Con búsqueda, chips activos, contador y "limpiar" |
| `SegmentedControl` | Elección excluyente de 2–4 opciones visibles | Solo texto, texto + ícono |
| `Timeline` | Historial de eventos de una orden o presupuesto | Compacta (sidebar) y extendida (detalle), con actor y timestamp |
| `Stepper` | Progreso de un flujo de varios pasos | Horizontal (onboarding) y vertical (checklist) |

**Formularios**

| Componente | Propósito | Variantes previstas |
|---|---|---|
| `Select` | Elección de una opción en lista | Simple, con búsqueda, múltiple |
| `Textarea` | Texto de varias líneas (notas del técnico) | Con contador de caracteres |
| `Checkbox` | Selección múltiple o aceptación | Con label, indeterminado |
| `Switch` | Preferencia que aplica al instante | On/off con label |
| `FormField` | Envoltura label + control + ayuda + error | Requerido, con ayuda, con error |
| `ConfirmDialog` | Confirmación de acción destructiva | Con nombre del recurso afectado y acción en `danger` |

**Superficies y feedback**

| Componente | Propósito | Variantes previstas |
|---|---|---|
| `Popover` | Contenido flotante no modal (notificaciones, detalle rápido) | Alineación por lado |
| `Sheet` | Panel lateral o inferior | Lateral (desktop, detalle), inferior (mobile, acciones) |
| `Avatar` | Identidad de una persona o empresa | Iniciales, imagen, con estado; tamaños `sm`/`md`/`lg` |
| `KpiCard` | Métrica con comparación y tendencia | Con `TrendBadge`, con sparkline |
| `TrendBadge` | Variación de una métrica | Positiva, negativa, neutra; siempre con signo y período |
| `ErrorState` | Error recuperable de una vista | Con acción "Reintentar" y detalle técnico plegado |
| `PermissionState` | El rol no permite ver la sección | Explica qué rol sí puede y ofrece volver |
| `OfflineBanner` | Sin conexión | Persistente, con estado de reintento |
| `SyncStatus` | Cola offline del técnico | Pendiente, sincronizando, sincronizado, fallido |

Criterio de creación: un componente nuevo entra al sistema solo si aparece en al
menos dos módulos. Si es de una sola pantalla, se implementa local y no se
exporta.

---

## 6. Matriz de estados

Todo listado, detalle y formulario debe definir estos diez estados. Un módulo no
se considera terminado si le falta alguno.

| Estado | Qué muestra | Componente | Regla de contenido |
|---|---|---|---|
| **Loading** | Acción en curso con feedback inmediato; el contenido previo se mantiene si existe | Botón con spinner y label en gerundio ("Guardando…"), barra superior para navegación | Nunca se bloquea la pantalla completa si ya había datos |
| **Skeleton** | Forma del contenido final, sin texto inventado | `Skeleton`, `SkeletonText`, `SkeletonCard`, filas de tabla | Se muestra solo en la primera carga; en refetch se conserva el contenido |
| **Empty** | Por qué está vacío y cómo empezar | `EmptyState` | Título corto + una línea de contexto + acción primaria. Ejemplo: "Todavía no hay clientes. Importá tu cartera desde un CSV o creá el primero." |
| **Populated** | Datos reales | Tabla, cards, detalle | Cifras tabulares, fechas en `America/Argentina/Buenos_Aires`, sin placeholders |
| **Error** | Qué pasó y qué hacer | `ErrorState` (planificado) o banner inline | "No pudimos cargar los clientes. Revisá la conexión y reintentá." + botón Reintentar. El código HTTP va plegado en "Detalle técnico" |
| **Success** | Confirmación de que la acción se aplicó | Toast o banner `success`, `Badge` en el ítem | Verbo en pasado y objeto: "Presupuesto enviado". Sin "¡Genial!" |
| **Disabled** | El control existe pero no aplica ahora | `Button`/`Input` con `disabled`, opacidad 60 % | Siempre con motivo visible cerca: "Necesitás plan Professional para asignar técnicos" |
| **Sin permiso** | El rol no accede | `PermissionState` (planificado) | Explica el rol requerido y ofrece una salida. Nunca un 403 crudo |
| **Offline** | Sin conexión, con lo que sí se puede hacer | `OfflineBanner` + `SyncStatus` (planificados) | "Sin conexión. Podés seguir cargando notas; se envían al reconectar." |
| **Datos parciales** | Algunos campos faltan o una fuente falló | Badge `warning` en el campo + nota al pie de la card | "Sin teléfono" en lugar de una celda vacía; nunca se oculta la fila |

Reglas transversales:

- **Los vacíos explican cómo empezar**, no describen la ausencia. "No hay
  resultados" solo es válido si además se ofrece limpiar filtros.
- **Los errores dicen qué hacer.** Un error sin acción siguiente es un bug de
  diseño.
- **Nunca mensajes técnicos** al usuario: sin `500`, sin `fetch failed`, sin
  `null`. El detalle técnico existe, pero plegado y para soporte.
- Un estado no se comunica solo por color: siempre color + texto (o ícono con
  texto alternativo).
- Si una vista tarda más de 300 ms en mostrar algo, hay skeleton. Si falla, hay
  `ErrorState`. No se deja la pantalla en blanco.

---

## 7. Motion

| Interacción | Duración | Nota |
|---|---|---|
| Hover de fila, link, ícono | 120–180 ms | Cambio de color o de fondo |
| Botón (hover, pressed, foco) | 100–160 ms | `active` puede ir a 100 ms con `scale(0.98)` |
| Cambio de tab | 180–220 ms | Contenido con fade, no desplazamiento |
| Apertura de panel, sheet, popover | 200–280 ms | Entrada con `opacity` + `translateY(4–8px)` |
| Cambio de layout (reordenar, colapsar) | 200–300 ms | Solo si el usuario lo disparó |
| Loop de marketing (marquee, scanline) | 5–7 s | Exclusivo de la landing |

**Easing estándar:** `cubic-bezier(0.2, 0.7, 0.2, 1)`. Es el que ya usa
`.mk-rise` en la landing y se adopta como `--ease-standard` en el producto. Para
salidas rápidas se permite `ease-out`; no se usa `linear` fuera de loops.

Reglas:

- Solo se animan `transform` y `opacity`. Nunca `width`, `height`, `top`, `left`,
  `margin` ni `box-shadow`.
- Nada de animación en la carga inicial de una tabla (retrasa la lectura).
- El progreso (`ProgressRing`) puede animar `stroke-dashoffset`; es la excepción
  aceptada porque comunica el dato.
- **`prefers-reduced-motion: reduce`** desactiva animaciones y transiciones
  (duración 0.01 ms) y detiene los loops de la landing. En `globals.css` hay una
  regla global (`*`, `*::before`, `*::after`) que cubre el producto y un bloque
  adicional para `.mk-*` que apaga las animaciones de marketing.
- Sin animaciones de más de 400 ms en interacción directa: se perciben lentas.

---

## 8. Accesibilidad

Objetivo: **WCAG 2.2 nivel AA** en panel, portal y PWA. La app móvil sigue las
guías de Android (TalkBack, tamaños táctiles).

- **Contraste:** 4.5:1 para texto normal, 3:1 para texto grande y para bordes de
  controles. `text-2` no se usa para datos críticos.
- **Foco visible:** anillo de 2 px `primary` con offset de 2 px, siempre visible
  sobre `surface` y sobre `deep` (en oscuro, anillo claro). `focus-visible`, no
  `focus`, para no marcar clicks de mouse.
- **Teclado:** todo flujo se completa sin mouse. Orden de tabulación = orden
  visual. `Escape` cierra diálogos y popovers. El foco vuelve al disparador al
  cerrar. Sin trampas de foco fuera de modales.
- **Labels:** todo input tiene `<label>` asociado; el placeholder no reemplaza al
  label. Los íconos solos llevan `aria-label`; los decorativos, `aria-hidden`.
- **Estados no solo por color:** un badge de estado lleva texto; un error lleva
  ícono + texto; una fila seleccionada lleva borde o check además del fondo.
- **Touch targets:** mínimo 44×44 px en PWA y móvil (WCAG 2.2 exige 24 px; el
  producto usa 44). En desktop, mínimo 32 px de alto en controles de tabla.
- **Formularios:** el error se asocia con `aria-describedby` y se anuncia con
  `role="alert"`. No se borra lo que el usuario escribió.
- **Tablas:** `<th scope="col">`, caption o título asociado, y orden anunciado
  (`aria-sort`).
- **Movimiento:** respetar `prefers-reduced-motion` (ver sección 7).
- **Zoom:** el layout funciona al 200 % sin scroll horizontal en 1280 px.

Verificación pendiente: auditoría con lector de pantalla y con axe/Lighthouse en
las rutas principales. Hoy no se ejecutó.

---

## 9. Uso correcto e incorrecto

**1. `primary` vs `secondary`**

- Correcto: "Guardar cambios" en `primary` (azul) y "Cancelar" en `outline`, uno
  al lado del otro.
- Incorrecto: dos botones `primary` con el mismo peso ("Guardar" y "Guardar y
  enviar") sin jerarquía; el usuario no sabe cuál es el camino esperado.
- Regla: una sola acción `primary` por vista. Si hay dos candidatas, una es
  `secondary` u `outline`. Destructivo siempre `danger`, nunca `primary` rojo
  disfrazado.

**2. Card vs sección**

- Correcto: una card por cliente en una grilla de clientes (unidad repetible con
  borde propio).
- Incorrecto: envolver cada campo del detalle de una orden en su propia card; se
  generan seis cajas para un solo formulario.
- Regla: si el contenido no se repite ni se puede seleccionar por separado, es
  una sección con `h3`, no una card. Nunca cards dentro de cards.

**3. Badge vs texto**

- Correcto: `Badge` con "En curso", "Aprobado", "Vencido" (conjunto cerrado y
  corto).
- Incorrecto: `Badge` con "El cliente aprobó el presupuesto el 12/11 y resta
  cobrar el saldo". Eso es texto, y un badge no se lee.
- Regla: badge para estado de 1–2 palabras; texto para explicación. Un badge no
  reemplaza un dato: el estado va acompañado del dato relevante en la fila.

**4. Color semántico**

- Correcto: `warning` para "vence en 3 días"; `danger` para "vencido hace 5 días".
- Incorrecto: `danger` en todo lo que requiere atención (incluido "sin técnico
  asignado" en una orden nueva), lo que satura la pantalla de rojo y hace que el
  error real pase desapercibido.
- Regla: `danger` = algo salió mal o es irreversible. `warning` = hay que actuar
  pronto. `success` = resultado positivo confirmado.

**5. Números**

- Correcto: columna "Total" alineada a la derecha con `tabular-nums`, formato
  `$ 125.400,00`.
- Incorrecto: importes centrados, con fuente proporcional y mezclando `$125400`
  con `$ 125.400,00` en la misma tabla.
- Regla: un solo formato por tabla, alineación decimal, sin abreviaturas
  (`$125,4k`) en contexto operativo.

---

## 10. Tokens para móvil

React Native no tiene CSS: los tokens son objetos TypeScript, con números en
densidad independiente (dp) y sin unidades string.

**Ubicación destino:** `apps/mobile/src/theme/tokens.ts` (**no existe todavía**).
Hoy los colores están en `apps/mobile/src/lib/theme.ts` con la paleta legacy
(`ink`, `teal`, `amber`, `paper`) y se reemplazan cuando se implemente este
archivo.

Especificación:

```ts
// apps/mobile/src/theme/tokens.ts — especificación, aún no implementado
export const colors = {
  primary: "#315EFB",
  primaryDark: "#1E3A8A",
  deep: "#17243D",
  secondary: "#4778FF",
  accentTeal: "#11A69A",
  violet: "#7459D9",
  cyan: "#4CB7D8",
  success: "#16865A",
  warning: "#D69B28",
  danger: "#D94848",
  info: "#315EFB",
  bg: "#F5F7FA",
  surface: "#FFFFFF",
  surface2: "#F0F3F8",
  border: "#E3E8F0",
  text: "#182235",
  text2: "#667085",
} as const;

export const spacing = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64 } as const;

export const radius = { control: 10, surface: 14, overlay: 18, popover: 12, pill: 999 } as const;

export const type = {
  display: { fontSize: 32, lineHeight: 36, fontWeight: "600" },
  h1: { fontSize: 26, lineHeight: 32, fontWeight: "600" },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: "600" },
  h3: { fontSize: 17, lineHeight: 22, fontWeight: "600" },
  body: { fontSize: 15, lineHeight: 22, fontWeight: "400" },
  small: { fontSize: 13, lineHeight: 18, fontWeight: "400" },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "400" },
  numeric: { fontSize: 24, lineHeight: 28, fontWeight: "600", fontVariant: ["tabular-nums"] },
} as const;

export const motion = { fast: 140, base: 200, panel: 260 } as const;
```

Reglas móviles:

- Misma paleta y mismos nombres semánticos que web. Si un color cambia, cambia en
  los dos lugares en el mismo cambio.
- Sin CSS, sin `rem`, sin strings de tamaño. Nada de `StyleSheet` con hex
  hardcodeado en pantallas: todo sale de `tokens.ts`.
- Sombras con `elevation` en Android y `shadowOffset`/`shadowOpacity` en iOS; no
  se traduce la sombra web.
- Tipografía: las familias del sistema (San Francisco / Roboto). Space Grotesk y
  Geist no se embeben en el APK en esta etapa; la jerarquía se logra con tamaño y
  peso.
- Touch targets de 44 dp mínimo, igual que en la PWA.

---

## 11. Landing

La landing comparte paleta y tipografía, pero no la densidad del panel: puede usar
hero oscuro, animaciones de 5–7 s y utilidades `.mk-*` propias. Lo que **no** puede
hacer:

- Inventar colores fuera de los tokens (los `--mk-*` son variantes de `deep` y
  `accent-teal`, no una paleta paralela).
- Usar `amber` como CTA principal: el CTA de la landing es `primary`.
- Mostrar datos de demo como reales. El dataset está marcado como ilustrativo.

---

## 12. Estado de implementación

| Ítem | Estado | Evidencia / pendiente |
|---|---|---|
| Tokens nuevos en `globals.css` | **Implementado** (2026-11-18) | Variables `--ds-*` + mapeo en `@theme inline`; los tokens legacy siguen como alias |
| Alias legacy | **Implementado** (transitorio) | `ink/teal/amber/paper/mist/slate` conviven con los nuevos; se eliminan al final de la Fase 8 |
| Escala tipográfica como utilidades | **Implementado** | `.text-display`, `.text-h1`…`.text-h4`, `.text-body`, `.text-small`, `.text-caption`, `.text-label`, `.numeric` |
| `tabular-nums` en tablas e importes | **Parcial** | Utilidad `.numeric` creada y usada en `StatCard`; falta aplicarla en tablas e importes de módulos |
| Migración de los 13 componentes a tokens nuevos | **Implementado** | Los 13 componentes de `components/ui/` usan tokens nuevos; Button, Card, Badge, Input y StatCard tienen stories en Storybook |
| Componentes planificados (sección 5.2) | **Pendiente** | Ninguno existe todavía en el repositorio |
| Matriz de estados aplicada por módulo | **Parcial** | Hay estados ad-hoc; falta `ErrorState`, `PermissionState`, `OfflineBanner`, `SyncStatus` |
| `prefers-reduced-motion` en producto | **Implementado** | Regla global `*` en `globals.css`; bloque aparte para `.mk-*` |
| Tokens móviles en `src/theme/tokens.ts` | **Pendiente** | Hoy `apps/mobile/src/lib/theme.ts` con paleta legacy |
| Auditoría de contraste y foco | **Pendiente** | Sin medición con herramienta todavía |

El avance de la migración se registra en [`PROJECT_STATUS.md`](PROJECT_STATUS.md);
este documento describe el destino, no el presente.

**Nota de implementación (2026-11-18):** las utilidades de tipografía
(`.text-h1`, `.text-body`, `.text-label`, etc.) se definen en `@layer utilities`
y `tailwind-merge` las interpreta como clases de color. Al combinarlas con
`cn()` junto a un `text-<color>`, se pierde una de las dos. Usar template
literals o concatenación simple para esos casos, o aplicar el color en un
elemento padre.

---

## 13. Referencias

- Hallazgos y plan de corrección: [`DESIGN_AUDIT.md`](DESIGN_AUDIT.md)
- Marca y nombres: [`BRAND.md`](BRAND.md)
- Deuda de usabilidad: [`UX_IMPROVEMENTS.md`](UX_IMPROVEMENTS.md)
- Decisiones de marca: ADR-015 (obsoleta) y ADR-016 en
  [`DECISIONS.md`](DECISIONS.md)
- Implementación web: `apps/web/src/app/globals.css` y
  `apps/web/src/components/ui/`
- Implementación móvil actual: `apps/mobile/src/lib/theme.ts`

## 14. Marketing v4 — Boska y sello (2026-11-22)

- **Familias:** `--font-boska` (self-hosted) se expone como `--font-mk-display`
  y se usa solo en titulares editoriales de la landing. El cuerpo, la UI y las
  etiquetas siguen en Archivo; IDs e importes en Geist Mono. La app conserva
  `--font-display: Archivo`.
- **Tokens nuevos:** `--mk-foil-copper #D9541E`, `--mk-foil-gold #E8B04A`,
  `--mk-foil-teal #2F7D4F`, `--mk-foil-pale #F0DCC4`.
- **Sello:** `.mk-foil-surface` (conic-gradient) + `.mk-foil-sheen` (una pasada
  de brillo). Es decorativo, va con `aria-hidden` y no reemplaza el estado
  textual. Con `prefers-reduced-motion` no se anima.
- **Motion de marketing:** Motion (Framer Motion) para el crossfade y progreso
  del rail, la pill de tabs y el conteo de migración. El hero usa CSS
  (`.mk-line`, `.mk-rise`, halo, sello y teléfono) para no demorar el LCP. CSS
  para `.mk-halo` y la marquesina. Sin GSAP/Lenis/Three.js en el bundle de la
  landing. Todo respeta `prefers-reduced-motion`.
- **Reglas:** Boska no se usa en párrafos, botones ni tablas; el naranja no es
  fondo de botón; el sello aparece una vez en el hero; las capturas de producto
  son reales y del tenant demo, nunca mockups dibujados.
## 15. Landing v5 — Anubi + Better Stack (2026-11-23)

- **Familias:** Bricolage Grotesque (`--font-bricolage`) para cuerpo/UI;
  Epilogue (`--font-epilogue`) para titulares; IBM Plex Mono
  (`--font-plex-mono`) para etiquetas. `mk-root` usa Bricolage; `mk-display`
  usa Epilogue; `mk-label` y `mk-mono` usan Plex Mono. Boska ya no se carga.
- **Paleta:** `--mk-paper #F7F7F5`, `--mk-ink #0F0F0F`, `--mk-slate #6B6B6B`,
  `--mk-line #DEDED8`, `--mk-signal #E4572E`, `--mk-panel #0B0C14`,
  `--mk-panel-soft #14151D`, `--mk-panel-text #EEF0F5`,
  `--mk-panel-muted #939DB8`. Sin violeta.
- **Paneles de producto:** `bg-mk-panel`, borde `white/10`, texto
  `mk-panel-text`, etiquetas `mk-panel-muted`. Son UI live construida con
  `demoOperation`, no capturas. Texto de cuerpo 14–16 px; etiquetas 12 px.
- **Hero:** `QuoteDemo` es el único objeto; un presupuesto en HTML que se
  aprueba y muestra el sello. No hay dashboard, halo, teléfono ni marquesina.
- **ProductStory:** cuatro módulos alternados; `OrdersPanel`, `SchedulePanel`,
  `QuotePanel`, `PaymentsPanel`.
- **Migración:** `glass-folder-cards` con carpeta de vidrio, canvas y archivos;
  lazy mount con `LazyGlassFolder`.
- **Motion:** entrada de hero con `mk-line`/`mk-rise`; aprobación del
  presupuesto con estado React; hover de paneles; carpeta con su motion propio.
  Sin scroll-linked, marquee, parallax ni GSAP/Lenis/Three.js.
- **Reglas:** no hay logos, testimonios ni métricas de terceros; los paneles
  declaran “Datos de ejemplo”. No usar más de un efecto por pantalla.
## 16. Landing v6 — motion, WebGL y full-bleed (2026-11-23)

- **Contenedor:** `max-w-[1600px]` y gutters `px-5 sm:px-8` en header, hero,
  producto, migración, precios, FAQ, CTA y footer. El hero no tiene `max-w-7xl`.
- **Texto:** `TextReveal` parte el titular en palabras, las enmascara con
  `overflow-hidden` y las sube con una transición CSS al entrar en viewport.
  Usa IntersectionObserver propio; si el elemento ya está en viewport, se
  muestra. Reduced motion deja el texto visible sin transición.
- **Hero:** `QuoteDemo` se auto-aprueba a los 2.6 s; el sello vive fuera del
  contenedor 3D para no clipearse y se oculta en mobile/tablet. Tilt de 4°.
- **Pinned:** cuatro pasos, panel sticky de 620 px, crossfade/scale de paneles
  con Motion y escena Three.js. Sin marquesina, progress line ni metadata
  repetida.
- **WebGL:** `operational-scene.tsx`: terreno de líneas + cuatro nodos, un solo
  contexto, DPR máx. 1.5, lazy mount, pausa fuera de viewport y reduced motion.
- **Migración:** glass folder con auto-drop; el botón `+` se dispara una vez al
  entrar, además de hover/click.
- **Figma:** variables, text styles, componente Quote Panel y frames; ver
  `FIGMA_STORYBOARD.md`.
## 17. Sistema compartido v7 (2026-11-23)

La landing deja de ser un tema aislado: sus tokens pasan a la aplicación.
El tope de 1600 px de la v6 se retira: hero y secciones usan ancho completo con
gutters de 20–32 px; el hero pasa a dos columnas desde 1280 px para no dejar el
panel fuera de vista en 1024/1124.

- **Color:** `--ds-bg` papel `#F7F7F5`, `--ds-surface` blanco, `--ds-deep`
  panel `#0B0C14`, `--ds-primary` tinta `#0F0F0F`, `--ds-secondary` y
  `--ds-teal` señal `#C2410C`, borde `#E3E1DB`. Los estados semánticos
  (success/warning/danger) se mantienen.
- **Tipografía:** `--font-sans` Bricolage, `--font-display` Epilogue y
  `--font-mono` IBM Plex Mono. Se retiran Geist y Archivo del `layout`.
- **Componentes:** `PageHeader` deja de renderizar el eyebrow; el dashboard usa
  el panel oscuro con señal naranja; el login y el portal heredan los tokens;
  el presupuesto público usa el mismo `ApprovalStamp`.
- **Motion:** `mk-stamp-in` para el sello; `mk-scroll-reveal` con
  `animation-timeline: view()` para secciones informativas; el hero y el
  producto conservan Motion/Three.js. `prefers-reduced-motion` deja todo
  visible y sin loop.
- **Mobile:** `apps/mobile/src/theme/tokens.ts` refleja la misma paleta. Las
  fuentes siguen siendo del sistema hasta que se carguen con `expo-font`.
- **Figma:** el archivo existente es v6; la v7 queda pendiente por el límite
  del MCP Starter.