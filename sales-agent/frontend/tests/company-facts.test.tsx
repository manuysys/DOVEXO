import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { CompanyFactsList } from "@/components/prospects/company-facts-section";
import {
  formatConfidence,
  groupCompanyFacts,
} from "@/features/prospects/facts";
import { makeCompanyFact } from "./utils";

describe("groupCompanyFacts", () => {
  it("agrupa por tipo en orden fijo y descarta valores vacíos", () => {
    const groups = groupCompanyFacts([
      makeCompanyFact({ id: "1", fact_type: "coverage", value: "Rosario" }),
      makeCompanyFact({ id: "2", fact_type: "service", value: "Instalación" }),
      makeCompanyFact({ id: "3", fact_type: "service", value: "   " }),
      makeCompanyFact({ id: "4", fact_type: "activity", value: "Mantenimiento" }),
      makeCompanyFact({ id: "5", fact_type: "service", value: "Reparación" }),
    ]);

    expect(groups.map((group) => group.title)).toEqual([
      "Servicios",
      "Actividades",
      "Cobertura",
    ]);
    expect(groups[0]?.facts.map((fact) => fact.value)).toEqual([
      "Instalación",
      "Reparación",
    ]);
  });

  it("no devuelve grupos vacíos", () => {
    expect(groupCompanyFacts([])).toEqual([]);
  });
});

describe("formatConfidence", () => {
  it("convierte 0-1 a porcentaje y tolera valores ya en porcentaje", () => {
    expect(formatConfidence(0.82)).toBe("82%");
    expect(formatConfidence(82)).toBe("82%");
    expect(formatConfidence(0)).toBe("0%");
    expect(formatConfidence(null)).toBeNull();
  });
});

describe("CompanyFactsList", () => {
  it("muestra los datos agrupados con valor, confianza, fecha y origen", () => {
    render(
      <CompanyFactsList
        facts={[
          makeCompanyFact({
            id: "1",
            fact_type: "service",
            value: "Instalación de aires acondicionados",
            confidence: 0.82,
            source_url: "https://empresa-de-prueba.com.ar/servicios",
            source_title: "Servicios",
          }),
          makeCompanyFact({
            id: "2",
            fact_type: "service",
            value: "Mantenimiento preventivo",
            confidence: null,
            source_url: null,
            source_title: null,
            evidence_excerpt: "Mantenimiento preventivo para empresas.",
          }),
          makeCompanyFact({
            id: "3",
            fact_type: "locality",
            value: "Rosario",
          }),
          makeCompanyFact({
            id: "4",
            fact_type: "contact_page",
            value: "Formulario de contacto",
          }),
        ]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Servicios" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Localidades" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Páginas de contacto" }),
    ).toBeInTheDocument();

    const services = screen
      .getByRole("heading", { name: "Servicios" })
      .closest("div");
    expect(services).not.toBeNull();
    const serviceList = within(services as HTMLElement);
    expect(
      serviceList.getByText("Instalación de aires acondicionados"),
    ).toBeInTheDocument();
    expect(serviceList.getByText("82%")).toBeInTheDocument();
    expect(
      serviceList.getByRole("link", {
        name: "https://empresa-de-prueba.com.ar/servicios",
      }),
    ).toHaveAttribute("href", "https://empresa-de-prueba.com.ar/servicios");
    expect(serviceList.getByText("Servicios", { selector: "p" })).toBeInTheDocument();
    expect(
      serviceList.getByText("Mantenimiento preventivo"),
    ).toBeInTheDocument();
    expect(serviceList.getByText("Sin URL de origen")).toBeInTheDocument();
    expect(
      serviceList.getByText(/Mantenimiento preventivo para empresas/),
    ).toBeInTheDocument();
  });

  it("no muestra nada cuando no hay datos extraídos", () => {
    const { container } = render(<CompanyFactsList facts={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
