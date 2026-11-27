import { describe, expect, it } from "vitest";
import {
  normalizeCompany,
  normalizeCompanyPage,
  normalizeProvinces,
  normalizeSearchRun,
  normalizeSearchRuns,
} from "@/lib/api/normalize";

describe("normalizeSearchRun", () => {
  it("lee la corrida envuelta en { search_run }", () => {
    const run = normalizeSearchRun({
      search_run: {
        id: 7,
        status: "running",
        provider: "osm",
        province_code: "AR-X",
        province_name: "Córdoba",
        sector_slugs: ["hvac"],
        keywords: [],
        limit: 50,
        records_found: 3,
        new_companies: 2,
        duplicates: 1,
        errors: [],
        created_at: "2026-11-20T12:00:00Z",
        started_at: "2026-11-20T12:00:05Z",
        finished_at: null,
      },
    });

    expect(run.id).toBe("7");
    expect(run.status).toBe("running");
    expect(run.province_code).toBe("AR-X");
    expect(run.sector_slugs).toEqual(["hvac"]);
    expect(run.limit).toBe(50);
    expect(run.records_found).toBe(3);
    expect(run.finished_at).toBeNull();
  });

  it("tolera variantes camelCase, keywords como texto y errores como objetos", () => {
    const run = normalizeSearchRun({
      id: "9",
      status: "FAILED",
      provinceCode: "AR-S",
      sectorSlugs: [],
      sector: "hvac",
      keywords: "calderas, split",
      maxResults: 20,
      newCompanies: 0,
      errors: [{ message: "Overpass timeout" }, "otro error"],
    });

    expect(run.status).toBe("failed");
    // Sin `sectorSlugs` cae al campo `sector` heredado de la Fase 1.
    expect(run.sector_slugs).toEqual(["hvac"]);
    expect(run.keywords).toEqual(["calderas", "split"]);
    expect(run.limit).toBe(20);
    expect(run.errors).toEqual(["Overpass timeout", "otro error"]);
  });

  it("usa un estado desconocido cuando la API devuelve algo inesperado", () => {
    const run = normalizeSearchRun({ id: 1, status: "queued?" });
    expect(run.status).toBe("unknown");
    expect(run.raw_status).toBe("queued?");
  });

  it("lee el alcance desde search_config y los campos heredados", () => {
    const run = normalizeSearchRun({
      id: 4,
      campaign_id: null,
      provider: "overpass",
      query: "Rubros: hvac",
      location: "Córdoba",
      sector: "hvac",
      status: "completed",
      records_found: 5,
      new_companies: 4,
      duplicates: 1,
      errors: [],
      search_config: {
        province_code: "AR-X",
        sector_slugs: ["hvac"],
        keywords: "split, calderas",
        limit: 80,
      },
      limit: 80,
      started_at: "2026-11-20T12:00:00Z",
      finished_at: "2026-11-20T12:01:00Z",
    });

    expect(run.province_code).toBe("AR-X");
    expect(run.province_name).toBe("Córdoba");
    expect(run.sector_slugs).toEqual(["hvac"]);
    expect(run.keywords).toEqual(["split", "calderas"]);
    expect(run.limit).toBe(80);
    expect(run.created_at).toBeNull();
    expect(run.finished_at).toBe("2026-11-20T12:01:00Z");
  });

  it("normaliza listas envueltas en { items }", () => {
    const runs = normalizeSearchRuns({
      items: [{ id: 1, status: "completed" }],
      total: 1,
    });
    expect(runs).toHaveLength(1);
    expect(runs[0]?.status).toBe("completed");
  });
});

describe("normalizeCompanyPage", () => {
  it("lee items, total y contadores de la página", () => {
    const page = normalizeCompanyPage({
      items: [
        {
          id: 3,
          name: "Empresa de prueba",
          province: "AR-S",
          locality: "Rosario",
          discovery_status: "discovered",
          sectors: [{ slug: "hvac", name: "Climatización" }],
          contacts: [
            {
              id: 1,
              contact_type: "whatsapp",
              normalized_value: "+5493415550000",
              is_primary: true,
              verification_status: "published",
            },
          ],
          source_count: 2,
          created_at: "2026-11-20T12:00:00Z",
        },
      ],
      total: 31,
      limit: 25,
      offset: 25,
    });

    expect(page.total).toBe(31);
    expect(page.limit).toBe(25);
    expect(page.offset).toBe(25);
    const company = page.items[0];
    expect(company?.name).toBe("Empresa de prueba");
    expect(company?.sectors).toEqual([
      { slug: "hvac", name: "Climatización" },
    ]);
    expect(company?.whatsapp).toBe("+5493415550000");
    expect(company?.source_count).toBe(2);
  });

  it("no inventa valores cuando la empresa llega incompleta", () => {
    const company = normalizeCompany({ id: 4, name: "Solo nombre" });
    expect(company.website).toBeNull();
    expect(company.primary_email).toBeNull();
    expect(company.primary_phone).toBeNull();
    expect(company.sectors).toEqual([]);
    expect(company.contacts).toEqual([]);
    expect(company.sources).toEqual([]);
    expect(company.source_count).toBe(0);
    expect(company.discovery_status).toBe("unknown");
  });
});

describe("normalizeProvinces", () => {
  it("lee el catálogo { code, name } de /meta/provinces", () => {
    const provinces = normalizeProvinces([
      { code: "AR-C", name: "Ciudad Autónoma de Buenos Aires" },
      { code: "AR-X", name: "Córdoba" },
    ]);

    expect(provinces).toHaveLength(2);
    expect(provinces[0]).toEqual({
      code: "AR-C",
      name: "Ciudad Autónoma de Buenos Aires",
    });
    expect(provinces[1]?.code).toBe("AR-X");
  });
});
