# Integración de componentes Originkit — estado

**Última actualización:** 2026-11-23
**Estado:** bloqueada por el límite diario de Originkit. No hay archivos de
Originkit en el repositorio; el `glass-folder-cards` integrado es un componente
local provisto por el usuario, no de Originkit.

## Qué se pidió

12 componentes:

1. `vector-wordmark`
2. `venom-button`
3. `coverflowgallery`
4. `light-bloom`
5. `ribbon-glow`
6. `gallery-tunnel`
7. `interactive-grid`
8. `blob-text-reveal`
9. `block-text-reveal`
10. `label-slide-button`
11. `usercursor`
12. `wire-terrain`

## Qué pasó

- Se corrió el CLI desde `apps/web` con `ORIGINKIT_API_KEY` como variable de
  entorno temporal. La cuenta es `manuysys@gmail.com`.
- Un intento en lote con `vector-wordmark`, `coverflowgallery` y `light-bloom`
  hizo los tres `fetch` y después cortó con:
  `Daily limit reached — you've used all 3 Originkit component fetches for today`.
- El CLI no escribió archivos: `apps/web/src/components/originkit/` no existe.
- El endpoint directo
  `GET https://mcp.originkit.dev/v1/components/vector-wordmark?channel=prompt`
  devolvió **HTTP 429**. No se reintentó para no consumir más cuota.
- La API key quedó expuesta en el chat: **rotarla** después de usarla. No está
  escrita en ningún archivo del repo.

## Cómo continuar cuando se resetee la cuota

Desde `apps/web`:

```powershell
$env:ORIGINKIT_API_KEY = "<nueva-key>"
npx originkit@latest add vector-wordmark venom-button coverflowgallery light-bloom ribbon-glow gallery-tunnel interactive-grid blob-text-reveal block-text-reveal label-slide-button usercursor wire-terrain --prompt --no-deps
```

Recomendación: hacerlo de a uno o en lotes de 3, porque el plan actual permite
3 fetches por día. Usar `--no-deps` y después instalar dependencias con `pnpm`
para no crear un `package-lock.json` de npm.

El CLI escribe en `src/components/originkit/`. No recrear ni reescribir esos
archivos; si el proyecto tiene reglas de lint que fallan, corregir solo el
límite de integración, no el componente.

## Dónde van

- **Lab:** `/labs/originkit` y `/labs/originkit/[slug]`, cada componente solo,
  full-screen dark, sin otro contenido.
- **Landing:** `Vector Wordmark`, `Venom Button`, `Coverflow Gallery` o
  `Gallery Tunnel`, `Light Bloom`, `Ribbon Glow`, `Label Slide Button`,
  `User Cursor` y `Wire Terrain`, solo si no compiten entre sí.
- **No usar los 12 juntos en la landing:** vuelve el efecto decorativo que se
  estaba corrigiendo.

## Seguridad

- La key solo descarga componentes de esta cuenta y consume el límite diario.
- No versionar `.originkit/` ni claves.
- Rotar la key desde `originkit.dev → Profile → API Keys`.
