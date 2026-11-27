import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CampaignDetailView } from "@/components/campaigns/campaign-detail-view";
import {
  getCampaign,
  listCampaigns,
  runCampaignAction,
  startCampaign,
} from "@/lib/api/campaigns";
import { getSearchRun, listSearchRuns } from "@/lib/api/search";
import { listProvinces, listSectors } from "@/lib/api/dashboard";
import { ARGENTINA_PROVINCE_CODES } from "@/lib/data/provinces";
import { makeCampaign, makeSearchRun, renderWithProviders } from "./utils";

vi.mock("@/lib/api/campaigns", () => ({
  getCampaign: vi.fn(),
  listCampaigns: vi.fn(),
  createCampaign: vi.fn(),
  startCampaign: vi.fn(),
  runCampaignAction: vi.fn(),
}));

vi.mock("@/lib/api/search", () => ({
  listSearchRuns: vi.fn(),
  getSearchRun: vi.fn(),
  createSearchRun: vi.fn(),
  runSearchRunAction: vi.fn(),
}));

vi.mock("@/lib/api/dashboard", () => ({
  listProvinces: vi.fn(),
  listSectors: vi.fn(),
  getDashboardMetrics: vi.fn(),
  getDashboardJobs: vi.fn(),
}));

const ALL_PROVINCES = ARGENTINA_PROVINCE_CODES.map((item) => item.code);

function mockMeta() {
  vi.mocked(listProvinces).mockResolvedValue([
    { code: "AR-X", name: "Córdoba" },
    { code: "AR-S", name: "Santa Fe" },
  ]);
  vi.mocked(listSectors).mockResolvedValue([]);
  vi.mocked(listCampaigns).mockResolvedValue([]);
  vi.mocked(getSearchRun).mockResolvedValue(makeSearchRun());
  vi.mocked(runCampaignAction).mockResolvedValue(makeCampaign());
}

describe("CampaignDetailView · inicio por provincia", () => {
  it("advierte por 24 provincias e informa las búsquedas creadas", async () => {
    mockMeta();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(getCampaign).mockResolvedValue(
      makeCampaign({
        id: "1",
        status: "draft",
        raw_status: "draft",
        province_filters: ALL_PROVINCES,
      }),
    );
    vi.mocked(listSearchRuns).mockResolvedValue([
      makeSearchRun({
        id: "11",
        campaign_id: "1",
        province_code: "AR-X",
        province_name: "Córdoba",
        status: "pending",
        raw_status: "pending",
        records_found: 0,
        new_companies: 0,
        duplicates: 0,
      }),
    ]);
    vi.mocked(startCampaign).mockResolvedValue({
      campaign: makeCampaign({
        id: "1",
        status: "active",
        raw_status: "active",
        province_filters: ALL_PROVINCES,
      }),
      search_runs: [
        {
          id: "11",
          province_code: "AR-X",
          province_name: "Córdoba",
          status: "pending",
          raw_status: "pending",
        },
      ],
      total_jobs: 24,
    });

    renderWithProviders(<CampaignDetailView id="1" />);

    expect(
      await screen.findByText("Campaña de alcance amplio"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Abarca 24 provincias/),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Iniciar" }));

    await waitFor(() => {
      expect(startCampaign).toHaveBeenCalledWith("1");
    });
    expect(confirmSpy).toHaveBeenCalledWith(
      expect.stringContaining("24 provincias"),
    );
    expect(await screen.findByText("Campaña iniciada")).toBeInTheDocument();
    expect(screen.getByText(/1 búsqueda provincial/)).toBeInTheDocument();
    expect(screen.getByText(/24 jobs/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ver el historial de la campaña" }),
    ).toHaveAttribute("href", "/search-history?campaign_id=1");

    // Tabla de corridas provinciales con estado y acceso a resultados.
    expect(await screen.findByText("Córdoba")).toBeInTheDocument();
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ver empresas" }),
    ).toHaveAttribute("href", "/prospects?search_run_id=11");

    confirmSpy.mockRestore();
  });

  it("explica el alcance nacional cuando la campaña no define provincias", async () => {
    mockMeta();
    vi.mocked(getCampaign).mockResolvedValue(
      makeCampaign({
        id: "2",
        status: "draft",
        raw_status: "draft",
        province_filters: [],
      }),
    );
    vi.mocked(listSearchRuns).mockResolvedValue([]);

    renderWithProviders(<CampaignDetailView id="2" />);

    expect(await screen.findByText("Alcance nacional")).toBeInTheDocument();
    expect(
      screen.getByText(/se crean 24 búsquedas/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Todavía no se ejecutó esta campaña/),
    ).toBeInTheDocument();
  });

  it("no inicia la campaña si el usuario cancela la advertencia", async () => {
    mockMeta();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    vi.mocked(getCampaign).mockResolvedValue(
      makeCampaign({
        id: "3",
        status: "draft",
        raw_status: "draft",
        province_filters: ALL_PROVINCES,
      }),
    );
    vi.mocked(listSearchRuns).mockResolvedValue([]);

    renderWithProviders(<CampaignDetailView id="3" />);
    await screen.findByText("Campaña de alcance amplio");
    await userEvent.click(screen.getByRole("button", { name: "Iniciar" }));

    expect(startCampaign).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
