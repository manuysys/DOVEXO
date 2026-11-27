# Prototipo y tablero de la landing v3

Material de diseño de la dirección de arte **“Oficio en orden”** (2026-11-20).
No es código de producción: son dos páginas HTML autocontenidas para abrir en el
navegador y comparar antes de implementar cambios.

- `prototype.html` — héroe, sección “Una sola orden”, mobile real a 390 px y
  lámina de sistema (paleta, tipografía, sellos). Usa las capturas reales de
  `apps/web/public/product-tour/`.
- `referencias.html` — tablero con 20 capturas propias de Jobber, Housecall Pro,
  MaintainX, Linear, Attio, Stripe, Raycast, Awwwards, Website Design Awards y
  SaaSFrame, más el estado anterior de DOVEXO. Cada tarjeta indica qué se estudió.
  Las imágenes están en `docs/research/`.
- `../DECISIONS.md` (ADR-021) y `../CHANGELOG.md` registran las decisiones.

Abrir con doble clic o `file://`. El prototipo carga Archivo desde Google Fonts;
sin red usa la tipografía del sistema. No requiere servidor.
