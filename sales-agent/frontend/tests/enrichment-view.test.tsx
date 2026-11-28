import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EnrichmentView } from "@/components/enrichment/enrichment-view";
import { useCompanies } from "@/hooks/use-companies";
import {
  useEnrichCompanies,
  useEnrichJobs,
} from "@/hooks/use-enrichment";
import { useCurrentUser } from "@/hooks/use-auth";
import { useProvinces } from "@/hooks/use-provinces";
import { useSectors } from "@/hooks/use-dashboard";
import { ApiError } from "@/lib/api/client";
import type { CompanyEnrichBatchResult } from "@/lib/api/types";
import {
  makeCompany,
  makeEnrichJob,
  makeSector,
} from "./utils";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/enrichment",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/hooks/use-companies", () => ({ useCompanies: vi.fn() }));
vi.mock("@/hooks/use-enrichment", () => ({
  useEnrichCompanies: vi.fn(),
  useEnrichJobs: vi.fn(),
}));
vi.mock("@/hooks/use-auth", () => ({ useCurrentUser: vi.fn() }));
vi.mock("@/hooks/use-provinces", () => ({ useProvinces: vi.fn() }));
vi.mock("@/hooks/use-dashboard", () => ({ useSectors: vi.fn() }));

function mockCurrentUser(role: string | null = "admin") {
  vi.mocked(useCurrentUser).mockReturnValue({
    data: {
      id: "1",
      email: "admin@arvokta.com",
      name: "Admin",
      role,
    },
    isPending: false,
    isError: false,
    error: null,
  } as unknown as ReturnType<typeof useCurrentUser>);
}

function mockCompanies(items = [makeCompany()], total = items.length) {
  vi.mocked(useCompanies).mockReturnValue({
    data: { items, total, limit: 50, offset: 0 },
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useCompanies>);
}

function mockJobs(
  options: {
    jobs?: ReturnType<typeof makeEnrichJob>[];
    isPending?: boolean;
    error?: unknown;
  } = {},
) {
  const refetch = vi.fn();
  vi.mocked(useEnrichJobs).mockReturnValue({
    data: options.jobs ?? [],
    isPending: options.isPending ?? false,
    isError: Boolean(options.error),
    error: options.error ?? null,
    isFetching: false,
    refetch,
  } as unknown as ReturnType<typeof useEnrichJobs>);
  return refetch;
}

function mockBatch(
  result: CompanyEnrichBatchResult = {
    queued: 1,
    skipped: 0,
    jobs: [{ id: "9", company_id: "10", status: "pending", raw_status: "pending" }],
    candidates: 1,
  },
) {
  const mutate = vi.fn(
    (
      _ids: string[],
      options?: {
        onSuccess?: (value: CompanyEnrichBatchResult) => void;
      },
    ) => {
      options?.onSuccess?.(result);
    },
  );
  vi.mocked(useEnrichCompanies).mockReturnValue({
    mutate,
    isPending: false,
    isError: false,
    error: null,
  } as unknown as ReturnType<typeof useEnrichCompanies>);
  return mutate;
}

beforeEach(() => {
  mockCurrentUser("admin");
  mockCompanies();
  mockJobs();
  mockBatch();
  vi.mocked(useProvinces).mockReturnValue({
    data: [{ code: "AR-S", name: "Santa Fe" }],
    isError: false,
  } as unknown as ReturnType<typeof useProvinces>);
  vi.mocked(useSectors).mockReturnValue({
    data: [makeSector()],
    isError: false,
  } as unknown as ReturnType<typeof useSectors>);
});

describe("EnrichmentView · empresas", () => {
  it("lista solo empresas con sitio web y muestra la página vacía sin inventar datos", () => {
    mockCompanies([], 0);

    render(<EnrichmentView />);

    expect(useCompanies).toHaveBeenCalledWith(
      expect.objectContaining({ has_website: true, limit: 50 }),
    );
    expect(
      screen.getByText("Todavía no hay empresas con sitio web"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(
      screen.getByText(/Todavía no hay trabajos de enriquecimiento en la cola/),
    ).toBeInTheDocument();
  });

  it("muestra las empresas con su estado de investigación y enlace a la ficha", () => {
    mockCompanies([
      makeCompany({ id: "10", last_enriched_at: null }),
      makeCompany({
        id: "20",
        name: "Empresa investigada",
        last_enriched_at: "2026-11-25T12:00:00Z",
      }),
    ]);

    render(<EnrichmentView />);

    const table = screen.getByRole("table");
    expect(within(table).getByText("Sin investigar")).toBeInTheDocument();
    const detailLinks = within(table).getAllByRole("link", {
      name: "Ver ficha",
    });
    expect(detailLinks[0]).toHaveAttribute(
      "href",
      "/prospects/10#investigacion",
    );
    expect(
      screen.getByRole("link", { name: "Empresa investigada" }),
    ).toHaveAttribute("href", "/prospects/20");
  });

  it("selecciona empresas y encola el lote mostrando queued/skipped reales", async () => {
    const mutate = mockBatch({
      queued: 2,
      skipped: 1,
      jobs: [],
      candidates: 3,
    });
    mockCompanies(
      [
        makeCompany({ id: "10" }),
        makeCompany({ id: "20", name: "Segunda empresa" }),
      ],
      3,
    );

    render(<EnrichmentView />);

    await userEvent.click(
      screen.getByRole("checkbox", { name: "Seleccionar Empresa de prueba" }),
    );
    await userEvent.click(
      screen.getByRole("checkbox", { name: "Seleccionar Segunda empresa" }),
    );
    expect(screen.getByText(/2 de 2 seleccionadas/)).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Enriquecer seleccionadas" }),
    );

    expect(mutate).toHaveBeenCalledWith(["10", "20"], expect.anything());
    expect(await screen.findByText(/2 empresas encoladas/)).toBeInTheDocument();
    expect(screen.getByText(/1 omitida/)).toBeInTheDocument();
    expect(screen.getByText(/Candidatas evaluadas: 3/)).toBeInTheDocument();
  });

  it("selecciona como máximo 50 empresas por lote", async () => {
    const companyList = Array.from({ length: 60 }, (_, index) =>
      makeCompany({
        id: String(index + 1),
        name: `Empresa ${index + 1}`,
      }),
    );
    const mutate = mockBatch();
    mockCompanies(companyList, 60);

    render(<EnrichmentView />);

    await userEvent.click(
      screen.getByRole("checkbox", {
        name: "Seleccionar todas las empresas de esta página",
      }),
    );

    expect(screen.getByText(/50 de 60 seleccionadas/)).toBeInTheDocument();
    expect(
      screen.getByText(/Llegaste al máximo de 50 empresas por lote/),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Enriquecer seleccionadas" }),
    );

    expect(mutate).toHaveBeenCalledTimes(1);
    const ids = mutate.mock.calls[0]?.[0];
    expect(ids).toHaveLength(50);
    expect(ids?.[0]).toBe("1");
    expect(ids?.[49]).toBe("50");
  });

  it("explica el error del backend al encolar", () => {
    vi.mocked(useEnrichCompanies).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: new ApiError("Se pueden enriquecer hasta 50 empresas.", 422),
    } as unknown as ReturnType<typeof useEnrichCompanies>);

    render(<EnrichmentView />);

    expect(
      screen.getByText("No se pudo encolar el lote"),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Se pueden enriquecer hasta 50 empresas.").length,
    ).toBeGreaterThan(0);
  });
});

describe("EnrichmentView · cola de trabajos", () => {
  it("muestra el estado de carga de la cola", () => {
    mockJobs({ isPending: true });

    render(<EnrichmentView />);

    expect(
      screen.getByText("Cargando trabajos de enriquecimiento…"),
    ).toBeInTheDocument();
  });

  it("muestra el error de la cola y permite reintentar la carga", async () => {
    const refetch = mockJobs({
      error: new ApiError("La API devolvió un error interno.", 502),
    });

    render(<EnrichmentView />);

    expect(screen.getByText("No se pudo cargar la cola")).toBeInTheDocument();
    expect(
      screen.getByText("La API devolvió un error interno."),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Reintentar carga" }),
    );
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("muestra pending, running, completed y failed con intentos y resultado", () => {
    mockJobs({
      jobs: [
        makeEnrichJob({ id: "1", company_id: "10", status: "pending" }),
        makeEnrichJob({
          id: "2",
          company_id: "11",
          company_name: "Empresa activa",
          status: "running",
          attempts: 1,
        }),
        makeEnrichJob({
          id: "3",
          company_id: "12",
          company_name: "Completada",
          status: "completed",
          attempts: 1,
          finished_at: "2026-11-27T12:01:00Z",
          result: {
            status: "ok",
            raw_status: "ok",
            fields_updated: [],
            contacts_added: 2,
            facts_added: 3,
            sources_added: 1,
            evidence: [],
            error: null,
          },
        }),
        makeEnrichJob({
          id: "4",
          company_id: "13",
          company_name: "Fallida",
          status: "failed",
          attempts: 3,
          max_attempts: 3,
          error_message: "El sitio no respondió",
        }),
      ],
    });

    render(<EnrichmentView />);

    expect(screen.getByText("En cola")).toBeInTheDocument();
    expect(screen.getByText("En ejecución")).toBeInTheDocument();
    expect(screen.getByText("Completado")).toBeInTheDocument();
    expect(screen.getByText("Falló")).toBeInTheDocument();
    expect(screen.getAllByText("1/3")).toHaveLength(2);
    expect(screen.getByText("3/3")).toBeInTheDocument();
    expect(
      screen.getByText("2 contactos · 3 datos · 1 fuente"),
    ).toBeInTheDocument();
    expect(screen.getByText("El sitio no respondió")).toBeInTheDocument();
    // Hay trabajos activos: se informa el refresco automático.
    expect(screen.getByText("Actualizando…")).toBeInTheDocument();
  });

  it("reintenta un trabajo fallido reencolando la empresa", async () => {
    const mutate = mockBatch();
    mockJobs({
      jobs: [
        makeEnrichJob({
          id: "4",
          company_id: "13",
          company_name: "Fallida",
          status: "failed",
          attempts: 3,
          max_attempts: 3,
          error_message: "El sitio no respondió",
        }),
      ],
    });

    render(<EnrichmentView />);

    await userEvent.click(
      screen.getByRole("button", {
        name: "Reintentar enriquecimiento de Fallida",
      }),
    );

    expect(mutate).toHaveBeenCalledWith(["13"], expect.anything());
  });
});

describe("EnrichmentView · permisos", () => {
  it("oculta selección y acciones a un rol sin permiso", () => {
    mockCurrentUser("viewer");

    render(<EnrichmentView />);

    expect(
      screen.getByText("Acciones restringidas"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Enriquecer seleccionadas" }),
    ).not.toBeInTheDocument();
    // La lista sigue visible en modo lectura.
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("no muestra reintento de trabajos a un rol sin permiso", () => {
    mockCurrentUser("viewer");
    mockJobs({
      jobs: [
        makeEnrichJob({
          id: "4",
          company_id: "13",
          company_name: "Fallida",
          status: "failed",
          error_message: "El sitio no respondió",
        }),
      ],
    });

    render(<EnrichmentView />);

    expect(
      screen.queryByRole("button", { name: /Reintentar enriquecimiento/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Falló")).toBeInTheDocument();
  });
});
