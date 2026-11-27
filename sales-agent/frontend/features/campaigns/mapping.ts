import type { Campaign, CampaignInput } from "@/lib/api/types";
import { arrayToLines, slugify, splitTags } from "@/lib/utils";
import {
  campaignSources,
  type CampaignFormValues,
  type CampaignSource,
} from "./schema";
import { readNumber, readStringArray } from "@/lib/api/normalize";
import {
  ARGENTINA_PROVINCES,
  ARGENTINA_PROVINCE_CODES,
} from "@/lib/data/provinces";

/** Índice nombre/slug → código ISO que exige el backend (`AR-X`). */
const CODE_BY_SLUG = new Map<string, string>();
for (const province of ARGENTINA_PROVINCE_CODES) {
  CODE_BY_SLUG.set(slugify(province.name), province.code);
  CODE_BY_SLUG.set(slugify(province.code), province.code);
}
for (const name of ARGENTINA_PROVINCES) {
  const code = CODE_BY_SLUG.get(slugify(name));
  if (code) CODE_BY_SLUG.set(slugify(name), code);
}
// La lista local del formulario usa nombres cortos ("CABA", "Tierra del
// Fuego") que no coinciden con el nombre oficial del catálogo del backend.
const LOCAL_ALIASES: Record<string, string> = {
  caba: "AR-C",
  "tierra-del-fuego": "AR-V",
};
for (const [slug, code] of Object.entries(LOCAL_ALIASES)) {
  CODE_BY_SLUG.set(slug, code);
}

/** Convierte el valor de un checkbox de provincia al código ISO de la API. */
export function provinceToCode(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "";
  const upper = trimmed.toUpperCase();
  if (/^AR-[A-Z]$/.test(upper)) return upper;
  return CODE_BY_SLUG.get(slugify(trimmed)) ?? trimmed;
}

/**
 * Nombre que usa el formulario para una provincia guardada. Acepta códigos o
 * nombres para que las campañas creadas antes del contrato de códigos sigan
 * editándose sin cambios.
 */
export function provinceToFormValue(value: string): string {
  const code = provinceToCode(value);
  const fromCodes = ARGENTINA_PROVINCE_CODES.find(
    (province) => province.code === code,
  );
  if (!fromCodes) return value.trim();
  const local = ARGENTINA_PROVINCES.find((name) => {
    const slug = slugify(name);
    return (
      slug === slugify(fromCodes.name) || (slug === "caba" && code === "AR-C")
    );
  });
  return local ?? fromCodes.name;
}

export function emptyCampaignValues(productId = ""): CampaignFormValues {
  return {
    product_id: productId,
    name: "",
    description: "",
    country: "Argentina",
    provinces: [],
    localities: "",
    selected_sectors: [],
    manual_sectors: "",
    max_results: 100,
    sources: ["osm"],
    status: "draft",
  };
}

function isCampaignSource(value: string): value is CampaignSource {
  return campaignSources.some((source) => source === value);
}

export function campaignToFormValues(campaign: Campaign): CampaignFormValues {
  const sources = readStringArray(campaign.search_config, [
    "sources",
    "providers",
  ]).filter(isCampaignSource);

  return {
    product_id: campaign.product_id ?? "",
    name: campaign.name,
    description: campaign.description,
    country: campaign.country || "Argentina",
    provinces: campaign.province_filters.map(provinceToFormValue),
    localities: arrayToLines(campaign.locality_filters),
    selected_sectors: campaign.sector_filters,
    manual_sectors: "",
    max_results: readNumber(
      campaign.search_config,
      ["max_results", "limit"],
      100,
    ),
    sources: sources.length > 0 ? sources : ["osm"],
    status: campaign.status === "active" ? "active" : "draft",
  };
}

/**
 * `search_config` viaja con `limit`, `max_results`, `keywords` y `sources`:
 * el inicio de campaña usa `limit` y `keywords`, y esta pantalla conserva
 * `max_results` por compatibilidad.
 */
export function formValuesToCampaignInput(
  values: CampaignFormValues,
): CampaignInput {
  const manual = splitTags(values.manual_sectors).map(slugify);
  const sectorFilters = Array.from(
    new Set([...values.selected_sectors, ...manual]),
  );
  const provinces = Array.from(
    new Set(values.provinces.map(provinceToCode).filter((code) => code.length > 0)),
  );

  return {
    product_id: values.product_id,
    name: values.name.trim(),
    description: values.description.trim(),
    country: values.country.trim() || "Argentina",
    province_filters: provinces,
    locality_filters: splitTags(values.localities),
    sector_filters: sectorFilters,
    search_config: {
      limit: values.max_results,
      max_results: values.max_results,
      sources: values.sources,
    },
    status: values.status,
  };
}

export function describeSources(config: Record<string, unknown>): string {
  const sources = readStringArray(config, ["sources", "providers"]);
  return sources.length > 0 ? sources.join(", ") : "Sin fuentes configuradas";
}
