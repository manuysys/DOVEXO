import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ProspectsView } from "@/components/prospects/prospects-view";
import {
  useCompanies,
  useExportCompanies,
  useUpdateCompany,
} from "@/hooks/use-companies";
import { useSectors } from "@/hooks/use-dashboard";
import { useProvinces } from "@/hooks/use-provinces";
import { useSearchRuns } from "@/hooks/use-search-runs";
import { makeCompany, makeSector } from "./utils";

const { replaceMock } = vi.hoisted(() => ({ replaceMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/prospects",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/hooks/use-companies", () => ({
  useCompanies: vi.fn(),
  useUpdateCompany: vi.fn(),
  useExportCompanies: vi.fn(),
}));
vi.mock("@/hooks/use-provinces", () => ({ useProvinces: vi.fn() }));
vi.mock("@/hooks/use-dashboard", () => ({ useSectors: vi.fn() }));
vi.mock("@/hooks/use-search-runs", () => ({ useSearchRuns: vi.fn() }));

function mockMeta() {
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
  vi.mocked(useUpdateCompany).mockReturnValue({
    mutate: vi.fn(),
    isError: false,
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateCompany>);
  vi.mocked(useExportCompanies).mockReturnValue({
    mutate: vi.fn(),
    isError: false,
    isPending: false,
  } as unknown as ReturnType<typeof useExportCompanies>);
}

describe("ProspectsView", () => {
  it("muestra un estado vacío honesto sin empresas", () => {
    mockMeta();
    vi.mocked(useCompanies).mockReturnValue({
      data: { items: [], total: 0, limit: 25, offset: 0 },
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useCompanies>);

    render(<ProspectsView />);

    expect(
      screen.getByText("Todavía no hay empresas descubiertas"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Buscar empresas" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("table"),
    ).not.toBeInTheDocument();
  });

  it("lista empresas con enlaces, estado y paginación real", () => {
    mockMeta();
    vi.mocked(useCompanies).mockReturnValue({
      data: {
        items: [makeCompany()],
        total: 40,
        limit: 25,
        offset: 0,
      },
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useCompanies>);

    render(<ProspectsView />);

    const nameLink = screen.getByRole("link", { name: "Empresa de prueba" });
    expect(nameLink).toHaveAttribute("href", "/prospects/10");
    const table = screen.getByRole("table");
    expect(within(table).getByText("Climatización")).toBeInTheDocument();
    expect(within(table).getByText("Rosario")).toBeInTheDocument();
    // Encabezado de columna + badge de estado de la fila.
    expect(within(table).getAllByText("Descubierta")).toHaveLength(2);
    expect(
      screen.getByRole("link", { name: "empresa-de-prueba.com.ar" }),
    ).toHaveAttribute("href", "https://empresa-de-prueba.com.ar");
    expect(
      screen.getByRole("link", {
        name: "contacto@empresa-de-prueba.com.ar",
      }),
    ).toHaveAttribute("href", "mailto:contacto@empresa-de-prueba.com.ar");
    expect(screen.getByText(/Mostrando 1–1 de 40 empresas/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeEnabled();
  });
});
