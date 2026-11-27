import type { Campaign, CampaignInput } from "@/lib/api/types";
import { arrayToLines, splitTags } from "@/lib/utils";
import {
  campaignSources,
  type CampaignFormValues,
  type CampaignSource,
} from "./schema";
import { readNumber, readStringArray } from "@/lib/api/normalize";

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
    provinces: campaign.province_filters,
    localities: arrayToLines(campaign.locality_filters),
    selected_sectors: campaign.sector_filters,
    manual_sectors: "",
    max_results: readNumber(campaign.search_config, ["max_results", "limit"], 100),
    sources: sources.length > 0 ? sources : ["osm"],
    status: campaign.status === "active" ? "active" : "draft",
  };
}

/**
 * `search_config` viaja con `max_results` y `sources`: es la parte del contrato
 * que esta pantalla necesita y queda documentada para el backend.
 */
export function formValuesToCampaignInput(
  values: CampaignFormValues,
): CampaignInput {
  const manual = splitTags(values.manual_sectors);
  const sectorFilters = Array.from(
    new Set([...values.selected_sectors, ...manual]),
  );

  return {
    product_id: values.product_id,
    name: values.name.trim(),
    description: values.description.trim(),
    country: values.country.trim() || "Argentina",
    province_filters: values.provinces,
    locality_filters: splitTags(values.localities),
    sector_filters: sectorFilters,
    search_config: {
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
