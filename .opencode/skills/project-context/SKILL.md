---
name: Project Context
description: Leer y mantener el contexto, estado y decisiones del proyecto antes de trabajar
---

# Project Context

Usar al inicio de cada sesión significativa o antes de una decisión de producto,
arquitectura o alcance.

## Lectura mínima

Primero, la empresa:

1. `AGENTS.md`
2. `docs/PROJECT_STATUS.md`
3. `docs/DECISIONS.md`

Después, el producto indicado en la tarea:

- **DOVEXO:** `products/dovexo/AGENTS.md`,
  `products/dovexo/docs/PROJECT_STATUS.md`,
  `products/dovexo/docs/DECISIONS.md` y la sección relevante de
  `products/dovexo/CONTEXTO_GUIA_PROYECTO.md`.
- **Sales Agent:** `sales-agent/AGENTS.md`,
  `sales-agent/docs/IMPLEMENTATION_STATUS.md`,
  `sales-agent/docs/SPEC.md` y `sales-agent/docs/DECISIONS.md`.

No cargues documentos completos si no hace falta; buscá la sección con `grep`.

## Reglas

- No afirmes que algo está implementado si solo está planificado.
- Si una decisión es de empresa, agregá un ADR en `docs/DECISIONS.md`; si es de
  producto, en el `docs/DECISIONS.md` del producto. Marcá el anterior como
  obsoleto si corresponde.
- Actualizá el estado de empresa en `docs/PROJECT_STATUS.md` y el del producto
  en su propio `PROJECT_STATUS.md`/`IMPLEMENTATION_STATUS.md`.
- Registrá problemas abiertos en el `KNOWN_ISSUES.md` del producto.
- Mantené coherencia entre README, arquitectura y estado de cada producto.

## Cierre de sesión

1. ¿Qué se implementó y verificó?
2. ¿Qué archivos cambiaron?
3. ¿Qué pruebas se ejecutaron y con qué resultado?
4. ¿Qué quedó pendiente?
5. ¿Cuál es el próximo paso concreto?

Escribí eso en el estado y changelog de empresa y del producto correspondiente.
