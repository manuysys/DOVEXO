import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CrmView } from "@/components/crm/crm-view";
import { useLeads, useUpdateLead } from "@/hooks/use-leads";
import {
  useCreateLeadActivity,
  useLeadActivities,
  useRecentActivities,
} from "@/hooks/use-activities";
import { useProducts } from "@/hooks/use-products";
import {
  useCreateSuppression,
  useDeleteSuppression,
  useSuppressions,
} from "@/hooks/use-suppressions";
import { makeActivity, makeLead } from "./utils";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/hooks/use-leads", () => ({
  useLeads: vi.fn(),
  useUpdateLead: vi.fn(),
}));

vi.mock("@/hooks/use-activities", () => ({
  useRecentActivities: vi.fn(),
  useLeadActivities: vi.fn(),
  useCreateLeadActivity: vi.fn(),
}));

vi.mock("@/hooks/use-products", () => ({ useProducts: vi.fn() }));
vi.mock("@/hooks/use-suppressions", () => ({
  useSuppressions: vi.fn(),
  useCreateSuppression: vi.fn(),
  useDeleteSuppression: vi.fn(),
}));

let updateMutate: ReturnType<typeof vi.fn>;
let createSuppressionMutate: ReturnType<typeof vi.fn>;

beforeEach(() => {
  updateMutate = vi.fn(
    (_vars: unknown, options?: { onSettled?: () => void }) => {
      options?.onSettled?.();
    },
  );
  createSuppressionMutate = vi.fn();

  vi.mocked(useUpdateLead).mockReturnValue({
    mutate: updateMutate,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useUpdateLead>);
  vi.mocked(useProducts).mockReturnValue({
    data: [],
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useProducts>);
  vi.mocked(useRecentActivities).mockReturnValue({
    data: [makeActivity()],
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useRecentActivities>);
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
  vi.mocked(useSuppressions).mockReturnValue({
    data: [],
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useSuppressions>);
  vi.mocked(useCreateSuppression).mockReturnValue({
    mutate: createSuppressionMutate,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useCreateSuppression>);
  vi.mocked(useDeleteSuppression).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useDeleteSuppression>);
});

describe("CrmView", () => {
  it("muestra el pipeline y cambia el estado con controles accesibles", async () => {
    vi.mocked(useLeads).mockReturnValue({
      data: {
        items: [
          makeLead({
            id: "5",
            company_id: "10",
            company_name: "Empresa A",
            status: "contacted",
            raw_status: "contacted",
          }),
          makeLead({
            id: "6",
            company_id: "11",
            company_name: "Empresa B",
            status: "new",
            raw_status: "new",
            score: null,
            confidence: null,
          }),
        ],
        total: 2,
        limit: 100,
        offset: 0,
      },
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useLeads>);

    render(<CrmView />);

    expect(useLeads).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 100 }),
    );
    expect(screen.getByText("Pipeline comercial")).toBeInTheDocument();
    expect(screen.getByText("Contactados")).toBeInTheDocument();
    expect(screen.getByText("Nuevos e investigados")).toBeInTheDocument();
    expect(screen.getAllByText("Empresa A").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Empresa B").length).toBeGreaterThan(0);

    await userEvent.selectOptions(
      screen.getByLabelText("Estado de Empresa B"),
      "approved",
    );

    expect(updateMutate).toHaveBeenCalledWith(
      { id: "6", input: { status: "approved" } },
      expect.anything(),
    );
  });

  it("guarda notas y registra un contacto en la lista de no contacto", async () => {
    vi.mocked(useLeads).mockReturnValue({
      data: {
        items: [
          makeLead({
            id: "5",
            company_id: "10",
            company_name: "Empresa A",
            status: "contacted",
            raw_status: "contacted",
          }),
        ],
        total: 1,
        limit: 100,
        offset: 0,
      },
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useLeads>);

    render(<CrmView />);

    await userEvent.click(screen.getByRole("button", { name: "Gestionar" }));
    const notes = await screen.findByLabelText("Notas de la oportunidad");
    await userEvent.type(notes, "Llamar el lunes");
    await userEvent.click(screen.getByRole("button", { name: "Guardar notas" }));

    expect(updateMutate).toHaveBeenCalledWith({
      id: "5",
      input: { assigned_notes: "Llamar el lunes" },
    });

    await userEvent.type(
      screen.getByLabelText(/^Teléfono o email/),
      "+5493415550000",
    );
    await userEvent.type(
      screen.getByLabelText(/^Motivo de la baja/),
      "Pidió no ser contactado",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Agregar a no contacto" }),
    );

    expect(createSuppressionMutate).toHaveBeenCalledWith(
      {
        normalized_contact: "+5493415550000",
        reason: "Pidió no ser contactado",
      },
      expect.anything(),
    );
  });

  it("aclara que la vista muestra las primeras 100 oportunidades", () => {
    vi.mocked(useLeads).mockReturnValue({
      data: {
        items: [makeLead({ id: "5", company_name: "Empresa A" })],
        total: 150,
        limit: 100,
        offset: 0,
      },
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useLeads>);

    render(<CrmView />);

    expect(
      screen.getByText(/Mostrando 100 de 150 oportunidades/),
    ).toBeInTheDocument();
  });
});
