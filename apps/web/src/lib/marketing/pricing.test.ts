import { describe, expect, it } from "vitest";

import { plans } from "@/lib/brand";

import { formatCount, formatPlanPrice, planLimitItems } from "./pricing";

describe("formatPlanPrice", () => {
  it("formats ARS without decimals", () => {
    const formatted = formatPlanPrice(19_900);
    expect(formatted).toContain("19.900");
    expect(formatted).not.toContain(",00");
  });

  it("formats the three plans from the centralized table", () => {
    expect(formatPlanPrice(19_900)).toContain("19.900");
    expect(formatPlanPrice(39_900)).toContain("39.900");
    expect(formatPlanPrice(64_900)).toContain("64.900");
  });

  it("keeps brand plans aligned with the public price list", () => {
    const prices = plans.map((plan) => [plan.code, plan.priceArs] as const);
    expect(prices).toEqual([
      ["starter", 19_900],
      ["professional", 39_900],
      ["business", 64_900],
    ]);
  });
});

describe("formatCount", () => {
  it("uses es-AR thousands separators", () => {
    expect(formatCount(50_000)).toBe("50.000");
  });
});

describe("planLimitItems", () => {
  it("uses singular for a single user or technician", () => {
    const starter = plans.find((plan) => plan.code === "starter");
    expect(starter).toBeDefined();
    if (!starter) return;
    const items = planLimitItems(starter);
    expect(items[0]).toBe("1 usuario");
    expect(items[1]).toBe("1 técnico");
    expect(items[2]).toBe("100 órdenes por mes");
  });

  it("uses plural for larger plans", () => {
    const professional = plans.find((plan) => plan.code === "professional");
    expect(professional).toBeDefined();
    if (!professional) return;
    const items = planLimitItems(professional);
    expect(items[0]).toBe("3 usuarios");
    expect(items[1]).toBe("5 técnicos");
    expect(items[2]).toBe("1.000 órdenes por mes");
  });

  it("describes the business plan limits", () => {
    const business = plans.find((plan) => plan.code === "business");
    expect(business).toBeDefined();
    if (!business) return;
    const items = planLimitItems(business);
    expect(items[0]).toBe("5 usuarios");
    expect(items[1]).toBe("20 técnicos");
    expect(items[2]).toBe("10.000 órdenes por mes");
  });
});
