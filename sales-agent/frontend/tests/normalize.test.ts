import { describe, expect, it } from "vitest";
import {
  extractItems,
  normalizeCampaign,
  normalizeMetrics,
  normalizeProduct,
} from "@/lib/api/normalize";
import { isActiveNavItem, NAV_ITEMS } from "@/lib/navigation";

describe("normalizeMetrics", () => {
  it("lee snake_case y completa en cero lo ausente", () => {
    const metrics = normalizeMetrics({
      companies_total: 10,
      companies_new: "3",
      leads_pending: 2,
    });

    expect(metrics.companies_total).toBe(10);
    expect(metrics.companies_new).toBe(3);
    expect(metrics.leads_pending).toBe(2);
    expect(metrics.meetings).toBe(0);
  });

  it("acepta métricas envueltas en { metrics } y claves alternativas", () => {
    const metrics = normalizeMetrics({
      metrics: { total_companies: 7, approved_leads: 1, responses: 0 },
    });

    expect(metrics.companies_total).toBe(7);
    expect(metrics.leads_approved).toBe(1);
    expect(metrics.responses).toBe(0);
  });
});

describe("normalizeProduct / normalizeCampaign / extractItems", () => {
  it("normaliza un producto envuelto en { product }", () => {
    const product = normalizeProduct({
      product: {
        id: 4,
        name: "DOVEXO",
        slug: "dovexo",
        pain_points: ["presupuestos"],
        target_sectors: ["climatizacion", 7],
        is_active: true,
      },
    });

    expect(product.id).toBe("4");
    expect(product.pain_points).toEqual(["presupuestos"]);
    expect(product.target_sectors).toEqual(["climatizacion", "7"]);
    expect(product.is_active).toBe(true);
    expect(product.description).toBe("");
  });

  it("normaliza campañas con producto anidado y estado desconocido", () => {
    const campaign = normalizeCampaign({
      id: "c1",
      name: "Campaña",
      status: "en-curso",
      product: { id: 2, name: "DOVEXO" },
      sector_filters: ["Climatización"],
      search_config: { max_results: 50 },
    });

    expect(campaign.product_id).toBe("2");
    expect(campaign.product_name).toBe("DOVEXO");
    expect(campaign.status).toBe("unknown");
    expect(campaign.raw_status).toBe("en-curso");
    expect(campaign.sector_filters).toEqual(["Climatización"]);
  });

  it("extrae listas de arreglos directos y de items", () => {
    expect(extractItems([1, 2])).toHaveLength(2);
    expect(extractItems({ items: [{}, {}] })).toHaveLength(2);
    expect(extractItems({ data: [] })).toHaveLength(0);
    expect(extractItems(null)).toHaveLength(0);
  });
});

describe("navegación", () => {
  it("marca la sección activa sin confundir prefijos", () => {
    expect(isActiveNavItem("/dashboard", "/dashboard")).toBe(true);
    expect(isActiveNavItem("/campaigns/3", "/campaigns")).toBe(true);
    expect(isActiveNavItem("/products-new", "/products")).toBe(false);
    expect(NAV_ITEMS.some((item) => item.href === "/settings")).toBe(true);
  });
});
