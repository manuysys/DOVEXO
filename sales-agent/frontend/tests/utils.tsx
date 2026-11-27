import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import type {
  Campaign,
  Company,
  DashboardJob,
  Product,
  SearchRun,
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

/** Fixture de empresa para pruebas de UI (no son datos reales). */
export function makeCompany(overrides: Partial<Company> = {}): Company {
  return {
    id: "10",
    name: "Empresa de prueba",
    description: "Service de refrigeración.",
    website: "https://empresa-de-prueba.com.ar",
    province: "AR-S",
    locality: "Rosario",
    address: "Calle 123",
    discovery_status: "discovered",
    raw_discovery_status: "discovered",
    sectors: [{ slug: "hvac", name: "Climatización" }],
    contacts: [
      {
        id: "1",
        contact_type: "email",
        value: "contacto@empresa-de-prueba.com.ar",
        label: null,
        is_primary: true,
        verification_status: "published",
        do_not_contact: false,
      },
    ],
    primary_phone: null,
    primary_email: "contacto@empresa-de-prueba.com.ar",
    whatsapp: "+5493415550000",
    source_count: 1,
    sources: [
      {
        id: "1",
        source_type: "osm",
        source_url: "https://www.openstreetmap.org/node/1",
        title: "OpenStreetMap",
        evidence_excerpt: null,
        collected_at: "2026-11-20T12:00:00Z",
        confidence: null,
      },
    ],
    created_at: "2026-11-20T12:00:00Z",
    ...overrides,
  };
}

/** Fixture de corrida de búsqueda (no es un resultado real). */
export function makeSearchRun(overrides: Partial<SearchRun> = {}): SearchRun {
  return {
    id: "7",
    campaign_id: null,
    provider: "osm",
    province_code: "AR-X",
    province_name: "Córdoba",
    sector_slugs: ["hvac"],
    keywords: [],
    limit: 50,
    status: "completed",
    raw_status: "completed",
    records_found: 12,
    new_companies: 9,
    duplicates: 3,
    errors: [],
    created_at: "2026-11-20T12:00:00Z",
    started_at: "2026-11-20T12:00:05Z",
    finished_at: "2026-11-20T12:01:00Z",
    ...overrides,
  };
}
