import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CompanyDetailView } from "@/components/prospects/company-detail-view";
import { useCompany } from "@/hooks/use-companies";
import { makeCompany } from "./utils";

vi.mock("@/hooks/use-companies", () => ({ useCompany: vi.fn() }));

function mockCompanyQuery(value: unknown) {
  vi.mocked(useCompany).mockReturnValue(
    value as unknown as ReturnType<typeof useCompany>,
  );
}

describe("CompanyDetailView", () => {
  it("muestra datos, contactos enlazados, fuentes y el placeholder de Fase 4", () => {
    mockCompanyQuery({
      data: makeCompany(),
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<CompanyDetailView id="10" />);

    expect(
      screen.getByRole("heading", { name: "Empresa de prueba" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "https://empresa-de-prueba.com.ar" }),
    ).toHaveAttribute("href", "https://empresa-de-prueba.com.ar");
    expect(screen.getByText("Rosario")).toBeInTheDocument();

    // Contactos como enlaces, sin acciones de envío.
    expect(
      screen.getByRole("link", {
        name: "contacto@empresa-de-prueba.com.ar",
      }),
    ).toHaveAttribute("href", "mailto:contacto@empresa-de-prueba.com.ar");
    expect(
      screen.getByRole("link", { name: "+5493415550000" }),
    ).toHaveAttribute("href", "https://wa.me/5493415550000");

    // Fuentes / OSM y procedencia.
    expect(screen.getByRole("link", { name: /openstreetmap.org/ })).toHaveAttribute(
      "href",
      "https://www.openstreetmap.org/node/1",
    );
    expect(screen.getAllByText("OpenStreetMap")).toHaveLength(3);
    expect(screen.getByText("Procedencia")).toBeInTheDocument();

    // Sin scoring ni mensajes todavía.
    expect(
      screen.getByText(/Esta ficha todavía no calcula compatibilidad/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /generar mensaje/i }),
    ).not.toBeInTheDocument();
  });

  it("no inventa contactos ni fuentes cuando la empresa está vacía", () => {
    mockCompanyQuery({
      data: makeCompany({
        contacts: [],
        sources: [],
        sectors: [],
        source_count: 0,
        primary_email: null,
        primary_phone: null,
        whatsapp: null,
      }),
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<CompanyDetailView id="11" />);

    expect(
      screen.getByText(/No hay contactos guardados todavía/),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No hay fuentes registradas para esta empresa."),
    ).toBeInTheDocument();
    expect(screen.getByText("Sin rubros asignados.")).toBeInTheDocument();
    expect(
      screen.getByText(/Sin fuente registrada|Alta manual/),
    ).toBeInTheDocument();
  });

  it("muestra el error de la API con opción de reintentar", () => {
    mockCompanyQuery({
      data: undefined,
      isPending: false,
      isError: true,
      error: new Error("La API respondió con un error (500)."),
      refetch: vi.fn(),
    });

    render(<CompanyDetailView id="12" />);

    expect(
      screen.getByText("La API respondió con un error (500)."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reintentar" }),
    ).toBeInTheDocument();
  });
});
