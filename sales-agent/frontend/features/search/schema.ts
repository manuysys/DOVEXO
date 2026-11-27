import { z } from "zod";
import type { SearchRunInput } from "@/lib/api/types";
import { splitTags } from "@/lib/utils";

/** Límite por defecto y máximo por corrida (SPEC §18.5). */
export const SEARCH_DEFAULT_LIMIT = 50;
export const SEARCH_MAX_LIMIT = 100;
/** El backend guarda las palabras clave como una sola cadena de hasta 200. */
export const SEARCH_MAX_KEYWORDS = 200;

export function keywordsToText(value: string): string {
  return splitTags(value).join(", ");
}

export const searchFormSchema = z.object({
  province_code: z.string().min(1, "Seleccioná una provincia."),
  sector_slugs: z.array(z.string()).min(1, "Seleccioná al menos un rubro."),
  keywords: z
    .string()
    .max(2000, "Máximo 2000 caracteres.")
    .refine(
      (value) => keywordsToText(value).length <= SEARCH_MAX_KEYWORDS,
      `Las palabras clave no pueden superar los ${SEARCH_MAX_KEYWORDS} caracteres en total.`,
    ),
  limit: z
    .number({ error: "Ingresá un número." })
    .int("Usá un número entero.")
    .min(1, "El mínimo es 1 resultado.")
    .max(
      SEARCH_MAX_LIMIT,
      `El máximo es ${SEARCH_MAX_LIMIT} resultados por corrida.`,
    ),
});

export type SearchFormValues = z.infer<typeof searchFormSchema>;

export function emptySearchValues(): SearchFormValues {
  return {
    province_code: "",
    sector_slugs: [],
    keywords: "",
    limit: SEARCH_DEFAULT_LIMIT,
  };
}

export function formValuesToSearchRunInput(
  values: SearchFormValues,
): SearchRunInput {
  const keywords = keywordsToText(values.keywords);
  return {
    province_code: values.province_code,
    sector_slugs: values.sector_slugs,
    keywords: keywords.length > 0 ? keywords : undefined,
    limit: values.limit,
  };
}
