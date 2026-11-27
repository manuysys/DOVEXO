import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Convierte un nombre en slug ASCII: "DOVEXO Gestión" → "dovexo-gestion". */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** Fecha local en formato es-AR. Devuelve "—" si no hay valor válido. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormatter.format(date);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

/** Lista legible en español: ["a"] → "a"; ["a","b"] → "a y b". */
export function joinList(values: string[], limit = 3): string {
  if (values.length === 0) return "—";
  const visible = values.slice(0, limit);
  const suffix = values.length > limit ? ` +${values.length - limit}` : "";
  if (visible.length === 1) return `${visible[0]}${suffix}`;
  const head = visible.slice(0, -1).join(", ");
  const tail = visible[visible.length - 1];
  return `${head} y ${tail}${suffix}`;
}

export function pluralize(
  count: number,
  singular: string,
  plural: string,
): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Divide un textarea en líneas no vacías y recorta espacios. */
export function linesToArray(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function arrayToLines(value: readonly string[]): string {
  return value.join("\n");
}

/** Acepta comas o líneas como separador (rubros, keywords). */
export function splitTags(value: string): string[] {
  return value
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}
