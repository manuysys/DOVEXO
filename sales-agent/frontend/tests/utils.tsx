import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import type {
  Campaign,
  DashboardJob,
  Product,
  Sector,
} from "@/lib/api/types";

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(ui: ReactElement) {
  const queryClient = createTestQueryClient();
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return { queryClient, ...render(ui, { wrapper: Wrapper }) };
}

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "1",
    name: "DOVEXO",
    slug: "dovexo",
    description: "Gestión para empresas de servicios técnicos.",
    value_proposition: "Administrar presupuestos, visitas y servicios.",
    target_profile: "Empresas de climatización y mantenimiento.",
    pain_points: ["Presupuestos dispersos"],
    target_sectors: ["Climatización"],
    keywords: ["mantenimiento"],
    scoring_config: {},
    messaging_config: {},
    is_active: true,
    created_at: "2026-11-01T10:00:00Z",
    updated_at: "2026-11-01T10:00:00Z",
    ...overrides,
  };
}

export function makeCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: "1",
    product_id: "1",
    product_name: "DOVEXO",
    name: "DOVEXO - Argentina - Prospección inicial",
    description: "",
    country: "Argentina",
    province_filters: [],
    locality_filters: [],
    sector_filters: ["Climatización"],
    search_config: { max_results: 100, sources: ["osm"] },
    status: "draft",
    raw_status: "draft",
    created_at: "2026-11-01T10:00:00Z",
    updated_at: "2026-11-01T10:00:00Z",
    ...overrides,
  };
}

export function makeSector(overrides: Partial<Sector> = {}): Sector {
  return {
    id: "1",
    slug: "climatizacion",
    name: "Climatización",
    is_active: true,
    ...overrides,
  };
}

export function makeJob(overrides: Partial<DashboardJob> = {}): DashboardJob {
  return {
    id: "1",
    type: "discovery",
    status: "running",
    created_at: "2026-11-01T10:00:00Z",
    ...overrides,
  };
}
