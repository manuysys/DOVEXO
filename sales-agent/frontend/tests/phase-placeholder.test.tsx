import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

describe("PhasePlaceholder", () => {
  it("declara la fase y no simula datos", () => {
    render(
      <PhasePlaceholder
        title="Importaciones"
        phase={2}
        summary="Importación de CSV en la Fase 2."
        planned={["Previsualización", "Deduplicación"]}
      />,
    );

    expect(screen.getByText("Disponible en Fase 2")).toBeInTheDocument();
    expect(
      screen.getByText(/No se muestran datos de ejemplo/),
    ).toBeInTheDocument();
    expect(screen.getByText("Previsualización")).toBeInTheDocument();
    expect(
      screen.getByText("Esta sección forma parte del alcance del producto, pero todavía no está operativa."),
    ).toBeInTheDocument();
  });
});
