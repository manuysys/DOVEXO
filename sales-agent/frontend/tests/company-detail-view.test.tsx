import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CompanyDetailView } from "@/components/prospects/company-detail-view";
import { useCompany, useCreateCompanyContact } from "@/hooks/use-companies";
import { useCreateLead, useLeads, useScoreLead, useUpdateLead } from "@/hooks/use-leads";
import { useProducts } from "@/hooks/use-products";
import { useLeadActivities } from "@/hooks/use-activities";
import { useLeadMessages } from "@/hooks/use-messages";
import { useWhatsAppStatus } from "@/hooks/use-whatsapp";
import { makeCompany, makeProduct } from "./utils";

vi.mock("@/hooks/use-companies", () => ({
  useCompany: vi.fn(),
  useCreateCompanyContact: vi.fn(),
}));

vi.mock("@/hooks/use-leads", () => ({
  useLeads: vi.fn(),
  useCreateLead: vi.fn(),
  useScoreLead: vi.fn(),
  useUpdateLead: vi.fn(),
}));

vi.mock("@/hooks/use-products", () => ({ useProducts: vi.fn() }));

vi.mock("@/hooks/use-activities", () => ({
  useLeadActivities: vi.fn(),
  useCreateLeadActivity: vi.fn(),
}));

vi.mock("@/hooks/use-messages", () => ({
  useLeadMessages: vi.fn(),
  useGenerateMessage: vi.fn(),
  useUpdateMessage: vi.fn(),
  useApproveMessage: vi.fn(),
  useSendMessage: vi.fn(),
  useMarkMessageSent: vi.fn(),
}));

vi.mock("@/hooks/use-whatsapp", () => ({ useWhatsAppStatus: vi.fn() }));

function mockCompanyQuery(value: unknown) {
  vi.mocked(useCompany).mockReturnValue(
    value as unknown as ReturnType<typeof useCompany>,
  );
}

beforeEach(() => {
  vi.mocked(useCreateCompanyContact).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  } as unknown as ReturnType<typeof useCreateCompanyContact>);
  vi.mocked(useLeads).mockReturnValue({
    data: { items: [], total: 0, limit: 50, offset: 0 },
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useLeads>);
  vi.mocked(useCreateLead).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useCreateLead>);
  vi.mocked(useScoreLead).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useScoreLead>);
  vi.mocked(useUpdateLead).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    isSuccess: false,
  } as unknown as ReturnType<typeof useUpdateLead>);
  vi.mocked(useProducts).mockReturnValue({
    data: [makeProduct()],
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useProducts>);
  vi.mocked(useLeadActivities).mockReturnValue({
    data: [],
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useLeadActivities>);
  vi.mocked(useLeadMessages).mockReturnValue({
    data: [],
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useLeadMessages>);
  vi.mocked(useWhatsAppStatus).mockReturnValue({
    data: {
      configured: false,
      mode: "console",
      sender_phone: null,
      founder_phone_set: false,
    },
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useWhatsAppStatus>);
});

describe("CompanyDetailView", () => {
  it("muestra datos, contactos enlazados, fuentes y la oportunidad comercial", () => {
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
    expect(
      screen.getByRole("link", { name: /openstreetmap.org/ }),
    ).toHaveAttribute("href", "https://www.openstreetmap.org/node/1");
    expect(screen.getAllByText("OpenStreetMap")).toHaveLength(3);
    expect(screen.getByText("Procedencia")).toBeInTheDocument();

    // Oportunidad: sin lead se ofrece crearla para DOVEXO.
    expect(
      screen.getByRole("heading", { name: "Oportunidad comercial" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/todavía no tiene una oportunidad comercial/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Crear oportunidad · DOVEXO/ }),
    ).toBeInTheDocument();
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
