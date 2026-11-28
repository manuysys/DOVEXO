import type { CompanyFact, CompanyFactType } from "@/lib/api/types";

/** Título visible de cada tipo de dato extraído del sitio. */
export const FACT_TYPE_LABELS: Record<CompanyFactType, string> = {
  service: "Servicios",
  activity: "Actividades",
  locality: "Localidades",
  coverage: "Cobertura",
  contact_page: "Páginas de contacto",
  description: "Descripción del sitio",
  unknown: "Otros datos",
};

/** Orden estable de los grupos en la ficha. */
const FACT_TYPE_ORDER: CompanyFactType[] = [
  "service",
  "activity",
  "locality",
  "coverage",
  "contact_page",
  "description",
  "unknown",
];

export interface CompanyFactGroup {
  type: CompanyFactType;
  title: string;
  facts: CompanyFact[];
}

/**
 * Agrupa los datos extraídos por tipo, en orden fijo y sin incluir grupos
 * vacíos. Los facts sin valor se ignoran: no se muestra una fila vacía como
 * si fuera información encontrada.
 */
export function groupCompanyFacts(
  facts: readonly CompanyFact[],
): CompanyFactGroup[] {
  const grouped = new Map<CompanyFactType, CompanyFact[]>();
  for (const fact of facts) {
    if (fact.value.trim().length === 0) continue;
    const list = grouped.get(fact.fact_type) ?? [];
    list.push(fact);
    grouped.set(fact.fact_type, list);
  }
  return FACT_TYPE_ORDER.filter((type) => grouped.has(type)).map((type) => ({
    type,
    title: FACT_TYPE_LABELS[type],
    facts: grouped.get(type) ?? [],
  }));
}

/**
 * Formatea la confianza informada por el backend. Acepta 0-1 (convención de
 * la API) y, por tolerancia, valores ya expresados en porcentaje.
 */
export function formatConfidence(confidence: number | null): string | null {
  if (confidence === null || !Number.isFinite(confidence)) return null;
  const percent = confidence <= 1 ? confidence * 100 : confidence;
  const clamped = Math.min(Math.max(percent, 0), 100);
  return `${Math.round(clamped)}%`;
}
