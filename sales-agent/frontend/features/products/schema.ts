import { z } from "zod";

function isJsonObject(value: string): boolean {
  if (value.length === 0) return true;
  try {
    const parsed: unknown = JSON.parse(value);
    return (
      typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
    );
  } catch {
    return false;
  }
}

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Ingresá un nombre de al menos 2 caracteres.")
    .max(120, "El nombre no puede superar los 120 caracteres."),
  slug: z
    .string()
    .trim()
    .min(2, "Ingresá un slug.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "El slug solo admite minúsculas, números y guiones.",
    ),
  description: z.string().trim().max(4000, "Máximo 4000 caracteres."),
  value_proposition: z.string().trim().max(4000, "Máximo 4000 caracteres."),
  target_profile: z.string().trim().max(4000, "Máximo 4000 caracteres."),
  pain_points: z.string(),
  target_sectors: z.string(),
  keywords: z.string(),
  scoring_config: z
    .string()
    .trim()
    .refine(isJsonObject, "Ingresá un objeto JSON válido: { }"),
  messaging_config: z
    .string()
    .trim()
    .refine(isJsonObject, "Ingresá un objeto JSON válido: { }"),
  is_active: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export function parseJsonObject(value: string): Record<string, unknown> {
  const trimmed = value.trim();
  if (trimmed.length === 0) return {};
  const parsed: unknown = JSON.parse(trimmed);
  return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {};
}
