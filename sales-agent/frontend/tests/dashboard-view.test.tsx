import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { emptyMetrics } from "@/lib/api/normalize";
import { makeCampaign, makeJob, makeProduct } from "./utils";

describe("DashboardView", () => {
  it("muestra ceros y estados vacíos sin datos", () => {
    render(
      <DashboardView
        metrics={emptyMetrics()}
        metricsStatus="ready"
        jobs={[]}
        jobsStatus="ready"
        products={[]}
        campaigns={[]}
        listsStatus="ready"
      />,
    );

    expect(
      screen.getByText("Todavía no hay empresas ni prospectos"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(10);
    expect(screen.getByText("No hay productos configurados")).toBeInTheDocument();
    expect(screen.getByText("No hay campañas")).toBeInTheDocument();
    expect(screen.getByText(/Sin tareas en ejecución/)).toBeInTheDocument();
  });

  it("muestra métricas reales y productos configurados", () => {
    render(
      <DashboardView
        metrics={{ ...emptyMetrics(), companies_total: 12, leads_pending: 4 }}
        metricsStatus="ready"
        jobs={[makeJob()]}
        jobsStatus="ready"
        products={[makeProduct()]}
        campaigns={[makeCampaign()]}
        listsStatus="ready"
      />,
    );

    expect(
      screen.queryByText("Todavía no hay empresas ni prospectos"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("DOVEXO")).toBeInTheDocument();
    expect(screen.getByText("discovery")).toBeInTheDocument();
  });

  it("muestra el error de métricas con opción de reintentar", () => {
    render(
      <DashboardView
        metrics={emptyMetrics()}
        metricsStatus="error"
        metricsError="La API respondió con un error (500)."
        onRetryMetrics={() => undefined}
        jobs={[]}
        jobsStatus="ready"
        products={[]}
        campaigns={[]}
        listsStatus="ready"
      />,
    );

    expect(
      screen.getByText("La API respondió con un error (500)."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
  });
});
