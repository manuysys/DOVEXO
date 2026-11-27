import { describe, expect, it } from "vitest";
import {
  campaignToFormValues,
  emptyCampaignValues,
  formValuesToCampaignInput,
  provinceToCode,
  provinceToFormValue,
} from "@/features/campaigns/mapping";
import { makeCampaign } from "./utils";

describe("provincias de campaña", () => {
  it("convierte nombres y alias al código ISO del backend", () => {
    expect(provinceToCode("Córdoba")).toBe("AR-X");
    expect(provinceToCode("córdoba")).toBe("AR-X");
    expect(provinceToCode("CABA")).toBe("AR-C");
    expect(provinceToCode("Ciudad Autónoma de Buenos Aires")).toBe("AR-C");
    expect(provinceToCode("Tierra del Fuego")).toBe("AR-V");
    expect(provinceToCode("AR-S")).toBe("AR-S");
    expect(provinceToCode("")).toBe("");
  });

  it("vuelve al nombre que usa el formulario, incluso con datos viejos", () => {
    expect(provinceToFormValue("AR-X")).toBe("Córdoba");
    expect(provinceToFormValue("AR-C")).toBe("CABA");
    expect(provinceToFormValue("Córdoba")).toBe("Córdoba");
  });

  it("envía códigos, límite y fuentes al crear la campaña", () => {
    const values = {
      ...emptyCampaignValues("1"),
      name: "Campaña Córdoba",
      provinces: ["Córdoba", "CABA"],
      selected_sectors: ["hvac"],
      manual_sectors: "Refrigeración industrial",
      max_results: 80,
      sources: ["osm" as const],
    };

    const input = formValuesToCampaignInput(values);

    expect(input.province_filters).toEqual(["AR-X", "AR-C"]);
    expect(input.sector_filters).toEqual(["hvac", "refrigeracion-industrial"]);
    expect(input.search_config).toMatchObject({
      limit: 80,
      max_results: 80,
      sources: ["osm"],
    });
  });

  it("carga en el formulario los códigos guardados", () => {
    const values = campaignToFormValues(
      makeCampaign({ province_filters: ["AR-X", "AR-S"] }),
    );

    expect(values.provinces).toEqual(["Córdoba", "Santa Fe"]);
    expect(values.max_results).toBe(100);
  });
});
