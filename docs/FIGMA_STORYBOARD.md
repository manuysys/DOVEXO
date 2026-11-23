# Storyboard de Figma — Landing v6 (v7 pendiente)

**Archivo:** https://www.figma.com/design/DcjgOeLHZ980LjHFuPtz55
**Nombre:** DOVEXO Landing v6 — Storyboard
**Cuenta:** ARVOKTA (plan Starter)
**Última actualización:** 2026-11-23

## Qué contiene

- **Variables de color** en la colección `DOVEXO v6`: paper, ink, panel,
  panel-soft, panel-text, muted, signal y line.
- **Text styles:** Display/Hero (Epilogue ExtraBold), Display/Section,
  Display/Step, Body/Large, Body/Small, Mono/Label, Display/Number y UI/Button.
- **Componente `Quote Panel`** con la estructura del presupuesto (header,
  cliente, ítems, total y CTA). Está usado como instancia en el hero.
- **Frame `01 · Hero — 1440`:** composición de la landing con titular, copy,
  CTAs y panel.
- **Frame `02 · Producto pinned — 1440`:** momento oscuro con copy, paso activo,
  panel de agenda y nota del WebGL propio.
- **Frame `03 · Hero — 390`:** versión mobile apilada.
- **Frame `04 · Tokens + motion`:** swatches, muestra tipográfica y notas de
  motion (auto-aprobación, pinned, auto-drop, reduced motion).

Todo el contenido es editable: textos, frames, auto layout, variables y estilos.
No se usó una captura raster como entregable.

## Límite encontrado

La cuenta Starter agotó el límite de llamadas del MCP de Figma al intentar
agregar la variante `Aprobado` del `Quote Panel`. El archivo quedó guardado con
todo lo anterior. Para continuar:

- volver a abrir el archivo cuando se resetee el límite, o
- duplicar el componente y cambiar `Enviado` por `Aprobado` a mano, o
- subir de plan si se quiere iterar con el MCP sin cortes.

## Estado de la v7

La landing implementada ya es la v7, pero el archivo de Figma **no se actualizó**:
el MCP Starter agotó el rate limit antes de crear los frames nuevos. Queda
pendiente agregar, cuando se resetee la cuota:

- sello rectangular `ApprovalStamp` y variantes Enviado/Aprobado/Rechazado;
- frames de La oficina, El técnico, El cliente y Control;
- migración con preview de planilla y archivo flotante;
- dashboard, portal, PWA y mobile app;
- prototipo de auto-aprobación, pinned y auto-drop.

La implementación de referencia está en el código y en `ADR-026`; este archivo
sigue siendo el storyboard v6.

## Cómo se usa en el flujo

1. El frame y los tokens son la referencia de composición y escala.
2. La implementación vive en React/Next; no se exportan imágenes.
3. El WebGL y el pinned se prototipan en Figma y se implementan con Three.js y
   Motion.
4. Para cambios visuales, se actualiza el frame antes de tocar el código.
