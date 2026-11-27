import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProspectsView } from "@/components/prospects/prospects-view";
import {
  exportCompaniesCsv,
  listCompanies,
  updateCompany,
} from "@/lib/api/companies";
import { downloadBlob } from "@/lib/download";
import { useLeads } from "@/hooks/use-leads";
import { useSectors } from "@/hooks/use-dashboard";
import { useProvinces } from "@/hooks/use-provinces";
import { useSearchRuns } from "@/hooks/use-search-runs";
import { makeCompany, makeSector, renderWithProviders } from "./utils";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/prospects",
  useSearchParams: () =>
    new URLSearchParams("discovery_status=possible_duplicate"),
}));

vi.mock("@/lib/api/companies", () => ({
  listCompanies: vi.fn(),
  getCompany: vi.fn(),
  createCompany: vi.fn(),
  updateCompany: vi.fn(),
  exportCompaniesCsv: vi.fn(),
}));

vi.mock("@/lib/download", () => ({ downloadBlob: vi.fn() }));

vi.mock("@/hooks/use-provinces", () => ({ useProvinces: vi.fn() }));
vi.mock("@/hooks/use-dashboard", () => ({ useSectors: vi.fn() }));
vi.mock("@/hooks/use-search-runs", () => ({ useSearchRuns: vi.fn() }));
vi.mock("@/hooks/use-leads", () => ({ useLeads: vi.fn() }));

function mockMeta() {
  vi.mocked(useLeads).mockReturnValue({
    data: { items: [], total: 0, limit: 100, offset: 0 },
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useLeads>);
  vi.mocked(useProvinces).mockReturnValue({
    data: [{ code: "AR-S", name: "Santa Fe" }],
    isError: false,
  } as unknown as ReturnType<typeof useProvinces>);
  vi.mocked(useSectors).mockReturnValue({
    data: [makeSector()],
    isError: false,
  } as unknown as ReturnType<typeof useSectors>);
  vi.mocked(useSearchRuns).mockReturnValue({
    data: [],
    isError: false,
  } as unknown as ReturnType<typeof useSearchRuns>);
}

function companyPage(status: string) {
  return {
    items: [makeCompany({ id: "10", discovery_status: status })],
    total: 1,
    limit: 25,
    offset: 0,
  };
}

describe("ProspectsView · duplicados y exportación", () => {
  it("filtra posibles duplicados y los marca como 'no es duplicado'", async () => {
    mockMeta();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(listCompanies).mockResolvedValue(
      companyPage("possible_duplicate"),
    );
    vi.mocked(updateCompany).mockResolvedValue(
      makeCompany({ id: "10", discovery_status: "discovered" }),
    );

    renderWithProviders(<ProspectsView />);

    const noDuplicateButton = await screen.findByRole("button", {
      name: "No es duplicado",
    });
    const table = screen.getByRole("table");
    expect(within(table).getByText("Posible duplicado")).toBeInTheDocument();
    expect(listCompanies).toHaveBeenCalledWith(
      expect.objectContaining({ discovery_status: "possible_duplicate" }),
    );

    await userEvent.click(noDuplicateButton);

    await waitFor(() => {
      expect(updateCompany).toHaveBeenCalledWith("10", {
        discovery_status: "discovered",
      });
    });
    expect(confirmSpy).toHaveBeenCalledWith(
      expect.stringContaining("no es un duplicado"),
    );
    confirmSpy.mockRestore();
  });

  it("descarta una empresa solo después de confirmar", async () => {
    mockMeta();
    const confirmSpy = vi
      .spyOn(window, "confirm")
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    vi.mocked(listCompanies).mockResolvedValue(companyPage("discovered"));
    vi.mocked(updateCompany).mockResolvedValue(
      makeCompany({ id: "10", discovery_status: "rejected" }),
    );

    renderWithProviders(<ProspectsView />);
    const discard = await screen.findByRole("button", { name: "Descartar" });

    await userEvent.click(discard);
    expect(updateCompany).not.toHaveBeenCalled();

    await userEvent.click(discard);
    await waitFor(() => {
      expect(updateCompany).toHaveBeenCalledWith("10", {
        discovery_status: "rejected",
      });
    });
    confirmSpy.mockRestore();
  });

  it("exporta el CSV con los filtros activos", async () => {
    mockMeta();
    vi.mocked(listCompanies).mockResolvedValue(
      companyPage("possible_duplicate"),
    );
    vi.mocked(exportCompaniesCsv).mockResolvedValue({
      blob: new Blob(["nombre\nEmpresa"], { type: "text/csv" }),
      filename: "empresas-2026-11-27.csv",
    });

    renderWithProviders(<ProspectsView />);
    await screen.findByText("Posible duplicado");

    await userEvent.click(screen.getByRole("button", { name: "Exportar CSV" }));

    await waitFor(() => {
      expect(exportCompaniesCsv).toHaveBeenCalledTimes(1);
    });
    const filters = vi.mocked(exportCompaniesCsv).mock.calls[0]?.[0];
    expect(filters).toMatchObject({
      discovery_status: "possible_duplicate",
    });
    expect(filters?.limit).toBeUndefined();
    expect(filters?.offset).toBeUndefined();
    expect(downloadBlob).toHaveBeenCalledWith(
      expect.any(Blob),
      "empresas-2026-11-27.csv",
    );
  });
});
