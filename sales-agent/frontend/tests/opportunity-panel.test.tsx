import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OpportunityPanel } from "@/components/leads/opportunity-panel";
import {
  useCreateLead,
  useLeads,
  useScoreLead,
  useUpdateLead,
} from "@/hooks/use-leads";
import { useLeadActivities, useCreateLeadActivity } from "@/hooks/use-activities";
import { useLeadMessages } from "@/hooks/use-messages";
import { useGenerateMessage } from "@/hooks/use-messages";
import { useProducts } from "@/hooks/use-products";
import { useWhatsAppStatus } from "@/hooks/use-whatsapp";
import { makeCompany, makeLead, makeProduct } from "./utils";

vi.mock("@/hooks/use-leads", () => ({
  useLeads: vi.fn(),
  useCreateLead: vi.fn(),
  useScoreLead: vi.fn(),
  useUpdateLead: vi.fn(),
}));
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
vi.mock("@/hooks/use-products", () => ({ useProducts: vi.fn() }));
vi.mock("@/hooks/use-whatsapp", () => ({ useWhatsAppStatus: vi.fn() }));

let scoreMutate: ReturnType<typeof vi.fn>;
let createMutate: ReturnType<typeof vi.fn>;

beforeEach(() => {
  scoreMutate = vi.fn();
  createMutate = vi.fn();

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
  vi.mocked(useCreateLeadActivity).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useCreateLeadActivity>);
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
  vi.mocked(useScoreLead).mockReturnValue({
    mutate: scoreMutate,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useScoreLead>);
  vi.mocked(useCreateLead).mockReturnValue({
    mutate: createMutate,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useCreateLead>);
  vi.mocked(useUpdateLead).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    isSuccess: false,
  } as unknown as ReturnType<typeof useUpdateLead>);
  vi.mocked(useGenerateMessage).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useGenerateMessage>);
});

describe("OpportunityPanel", () => {
  it("ofrece crear la oportunidad de DOVEXO cuando no existe", async () => {
    vi.mocked(useLeads).mockReturnValue({
      data: { items: [], total: 0, limit: 50, offset: 0 },
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useLeads>);

    render(<OpportunityPanel company={makeCompany()} />);

    expect(
      screen.getByText(/todavía no tiene una oportunidad comercial/),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: /Crear oportunidad · DOVEXO/ }),
    );
    expect(createMutate).toHaveBeenCalledWith({
      companyId: "10",
      product_id: "1",
    });
  });

  it("muestra score, confianza, razones y desglose, y permite recalcular", async () => {
    vi.mocked(useLeads).mockReturnValue({
      data: { items: [makeLead()], total: 1, limit: 50, offset: 0 },
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useLeads>);

    render(<OpportunityPanel company={makeCompany()} />);

    expect(screen.getByText("Pendiente de revisión")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Compatibilidad comercial" })).toHaveAttribute(
      "aria-valuenow",
      "72",
    );
    expect(
      screen.getByRole("progressbar", { name: "Confianza de la información" }),
    ).toHaveAttribute("aria-valuenow", "64");
    expect(screen.getByText("72/100")).toBeInTheDocument();
    expect(screen.getByText("64/100")).toBeInTheDocument();
    expect(
      screen.getByText("Ofrece mantenimiento de climatización comercial."),
    ).toBeInTheDocument();
    expect(screen.getByText("Afinidad del rubro")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Calcular score" }));
    expect(scoreMutate).toHaveBeenCalledWith("5");

    // Generador de mensajes disponible para la oportunidad existente.
    expect(
      screen.getByRole("button", { name: "Generar mensaje" }),
    ).toBeInTheDocument();
  });
});
