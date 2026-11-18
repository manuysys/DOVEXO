/**
 * Tokens del design system DOVEXO (Fase 1).
 *
 * Fuente de verdad para web en `app/globals.css`; este archivo expone los
 * mismos valores en TypeScript para componentes, Storybook y la app móvil.
 * No duplicar valores nuevos: si cambia un token, cambia en ambos lugares.
 */

export const colors = {
  primary: "#315EFB",
  primaryDark: "#1E3A8A",
  deep: "#17243D",
  secondary: "#4778FF",
  teal: "#11A69A",
  violet: "#7459D9",
  cyan: "#4CB7D8",
  success: "#16865A",
  successSoft: "#E7F5EE",
  successStrong: "#0F5C3D",
  warning: "#D69B28",
  warningSoft: "#FBF3E2",
  warningStrong: "#7A5312",
  danger: "#D94848",
  dangerSoft: "#FDECEC",
  dangerStrong: "#8F2B2B",
  info: "#315EFB",
  infoSoft: "#EAEFFF",
  infoStrong: "#1E3A8A",
  bg: "#F5F7FA",
  surface: "#FFFFFF",
  surface2: "#F0F3F8",
  border: "#E3E8F0",
  text: "#182235",
  text2: "#667085",
} as const;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
} as const;

export const shadows = {
  sm: "0 1px 2px rgb(24 34 53 / 0.06)",
  md: "0 4px 12px -2px rgb(24 34 53 / 0.08), 0 1px 3px rgb(24 34 53 / 0.05)",
  lg: "0 16px 40px -12px rgb(24 34 53 / 0.18), 0 2px 6px rgb(24 34 53 / 0.06)",
} as const;

export const motion = {
  fast: 140,
  base: 200,
  slow: 280,
  marketing: 6000,
  ease: "cubic-bezier(0.2, 0.7, 0.2, 1)",
} as const;

export const typography = {
  display: { size: "clamp(2.75rem, 5vw, 4rem)", weight: 600, lineHeight: 1.02 },
  h1: { size: "clamp(2rem, 3vw, 2.5rem)", weight: 600, lineHeight: 1.08 },
  h2: { size: "clamp(1.625rem, 2.4vw, 2rem)", weight: 600, lineHeight: 1.12 },
  h3: { size: "clamp(1.25rem, 1.8vw, 1.5rem)", weight: 600, lineHeight: 1.2 },
  h4: { size: "1.125rem", weight: 600, lineHeight: 1.3 },
  body: { size: "0.9375rem", weight: 400, lineHeight: 1.6 },
  small: { size: "0.8125rem", weight: 400, lineHeight: 1.5 },
  caption: { size: "0.75rem", weight: 500, lineHeight: 1.4 },
  label: { size: "0.75rem", weight: 600, lineHeight: 1.2 },
} as const;

export type ColorToken = keyof typeof colors;
