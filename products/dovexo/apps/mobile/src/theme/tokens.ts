/**
 * Tokens del design system DOVEXO para React Native.
 *
 * Espejo en TypeScript de los tokens web (`MEJORA_FRONTEND.txt`, sección 23).
 * No importar CSS: React Native no lo entiende. Los nombres de color son
 * semánticos; el sufijo `Soft` es un fondo suave y el sufijo `Ink` es la
 * variante de texto con contraste AA sobre ese fondo.
 */
import { Platform } from "react-native";

export const colors = {
  // Marca: misma identidad que la landing (ink, paper, señal naranja).
  primary: "#0F0F0F",
  primaryDark: "#000000",
  primarySoft: "#F1F1EE",
  deep: "#0B0C14",
  deepSoft: "#14151D",
  teal: "#C2410C",
  tealInk: "#9A3412",
  tealSoft: "#FBEDE7",
  violet: "#C2410C",
  cyan: "#2F7D4F",

  // Estado
  success: "#16865A",
  successInk: "#0E6B48",
  successSoft: "#E4F5EC",
  warning: "#D69B28",
  warningInk: "#8A5A0B",
  warningSoft: "#FCF2DE",
  danger: "#D94848",
  dangerInk: "#B32626",
  dangerSoft: "#FCEAEA",

  // Superficies
  bg: "#F7F7F5",
  surface: "#FFFFFF",
  surface2: "#FCFCFC",
  border: "#E3E1DB",
  borderStrong: "#C9C7BF",

  // Texto
  text: "#0F0F0F",
  text2: "#6B6B66",
  textInverse: "#FFFFFF",

  // Utilidades
  overlay: "rgba(11,12,20,0.45)",
  transparent: "transparent",
} as const;

/** Escala de 4 dp: `spacing[n]` equivale a `n * 4`. */
export const spacing = {
  0: 0,
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
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: "700", letterSpacing: -0.8 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: "700", letterSpacing: -0.4 },
  heading: { fontSize: 17, lineHeight: 23, fontWeight: "700", letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 22, fontWeight: "400" },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: "600" },
  label: { fontSize: 13, lineHeight: 18, fontWeight: "600" },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "500" },
  overline: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  mono: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    fontFamily: Platform.select({ android: "monospace", ios: "Menlo", default: "monospace" }),
  },
} as const;

/** Duraciones de motion en ms. Cortas a propósito: no retrasar acciones. */
export const motion = {
  fast: 140,
  base: 200,
  slow: 280,
} as const;

/**
 * Sombras multiplataforma: iOS usa `shadow*` y Android usa `elevation`
 * (ignora el resto), por eso conviven en el mismo objeto.
 */
export const shadows = {
  card: {
    elevation: 1,
    shadowColor: colors.deep,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  raised: {
    elevation: 3,
    shadowColor: colors.deep,
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  sheet: {
    elevation: 16,
    shadowColor: colors.deep,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -4 },
  },
} as const;

export const layout = {
  screenPadding: spacing[4],
  touchTarget: 48,
  buttonHeight: 52,
  tabBarHeight: 60,
  sheetMaxHeightRatio: 0.9,
  maxContentWidth: 560,
} as const;

export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;