import type { CSSProperties } from "react";

/* Clases compartidas de la landing. Contraste AA sobre cada fondo. */

export const focusLight =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mk-signal";
export const focusDark =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mk-paper";
export const focusOnTeal =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export const ctaPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-mk-ink px-5 py-3 text-sm font-semibold text-mk-paper transition-colors hover:bg-mk-ink-hover disabled:opacity-60";
export const ctaGhostDark =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-mk-paper/30 px-5 py-3 text-sm font-semibold text-mk-paper transition-colors hover:border-mk-paper hover:bg-white/10";
export const ctaInk =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-mk-ink px-5 py-3 text-sm font-semibold text-mk-paper transition-colors hover:bg-mk-ink-hover";
export const ctaOutlineInk =
  "inline-flex items-center justify-center rounded-lg border border-mk-ink px-5 py-3 text-sm font-semibold text-mk-ink transition-colors hover:bg-mk-ink hover:text-mk-paper";

/** Retraso de la entrada CSS (`.mk-rise`), en milisegundos. */
export function delayStyle(ms: number): CSSProperties {
  return { "--mk-delay": `${ms}ms` } as CSSProperties;
}
