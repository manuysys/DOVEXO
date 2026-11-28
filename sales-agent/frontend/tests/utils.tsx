import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import type {
  Activity,
  Campaign,
  Company,
  CompanyEnrichJob,
  CompanyFact,
  DashboardJob,
  ImportBatch,
  ImportPreview,
  Lead,
  OutreachMessage,
  Product,
  SearchRun,
  Sector,
  WhatsAppMessage,
  WhatsAppThread,
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
    search_runs_total: 0,
    search_runs_pending: 0,
    search_runs_running: 0,
    search_runs_completed: 0,
    search_runs_failed: 0,
    search_runs_cancelled: 0,
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
        source_url: "https://empresa-de-prueba.com.ar/contacto",
        source_title: "Contacto",
        source_collected_at: "2026-11-25T12:00:00Z",
        source_confidence: 0.9,
        verified_at: null,
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
    last_enriched_at: null,
    facts: [],
    ...overrides,
  };
}

/** Fixture de dato extraído del sitio (no es un dato real). */
export function makeCompanyFact(
  overrides: Partial<CompanyFact> = {},
): CompanyFact {
  return {
    id: "1",
    fact_type: "service",
    raw_fact_type: "service",
    value: "Mantenimiento de equipos de refrigeración",
    normalized_value: "mantenimiento de equipos de refrigeración",
    source_url: "https://empresa-de-prueba.com.ar/servicios",
    source_title: "Servicios",
    evidence_excerpt: null,
    confidence: 0.8,
    collected_at: "2026-11-25T12:00:00Z",
    ...overrides,
  };
}

/** Fixture de trabajo de enriquecimiento (no es un trabajo real). */
export function makeEnrichJob(
  overrides: Partial<CompanyEnrichJob> = {},
): CompanyEnrichJob {
  return {
    id: "1",
    company_id: "10",
    company_name: "Empresa de prueba",
    status: "pending",
    raw_status: "pending",
    attempts: 0,
    max_attempts: 3,
    error_message: null,
    result: null,
    created_at: "2026-11-27T12:00:00Z",
    started_at: null,
    finished_at: null,
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

/** Fixture de previsualización de importación (no es un archivo real). */
export function makeImportPreview(
  overrides: Partial<ImportPreview> = {},
): ImportPreview {
  return {
    batch_id: "3",
    filename: "empresas.csv",
    total_rows: 2,
    valid_rows: 1,
    invalid_rows: 1,
    duplicates: 0,
    preview: [
      {
        row_number: 2,
        name: "Empresa de prueba",
        website: "https://empresa-de-prueba.com.ar",
        province: "AR-S",
        locality: "Rosario",
        phone: null,
        email: "contacto@empresa-de-prueba.com.ar",
        sectors: ["hvac"],
        status: "valid",
        errors: [],
      },
      {
        row_number: 3,
        name: "Sin localidad",
        website: null,
        province: null,
        locality: null,
        phone: null,
        email: null,
        sectors: [],
        status: "invalid",
        errors: ["Falta la provincia"],
      },
    ],
    errors: [],
    ...overrides,
  };
}

export function makeImportBatch(
  overrides: Partial<ImportBatch> = {},
): ImportBatch {
  return {
    id: "3",
    filename: "empresas.csv",
    status: "confirmed",
    total_rows: 2,
    created: 1,
    skipped: 1,
    duplicates: 0,
    imported_at: "2026-11-21T09:00:00Z",
    confirmed_at: "2026-11-21T09:01:00Z",
    errors: [],
    report_url: null,
    ...overrides,
  };
}

/** Fixture de oportunidad (lead) para pruebas de UI. */
export function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: "5",
    company_id: "10",
    company_name: "Empresa de prueba",
    company_locality: "Rosario",
    company_province: "AR-S",
    company_website: "https://empresa-de-prueba.com.ar",
    company_phone: null,
    company_email: "contacto@empresa-de-prueba.com.ar",
    company_whatsapp: "+5493415550000",
    product_id: "1",
    product_name: "DOVEXO",
    status: "pending_review",
    raw_status: "pending_review",
    score: 72,
    confidence: 64,
    reasons: ["Ofrece mantenimiento de climatización comercial."],
    breakdown: [
      { key: "sector", label: "Afinidad del rubro", points: 24, max_points: 30 },
    ],
    assigned_notes: "",
    last_activity_at: "2026-11-22T10:00:00Z",
    next_action_at: null,
    created_at: "2026-11-21T10:00:00Z",
    updated_at: "2026-11-22T10:00:00Z",
    ...overrides,
  };
}

export function makeMessage(
  overrides: Partial<OutreachMessage> = {},
): OutreachMessage {
  return {
    id: "31",
    lead_id: "5",
    channel: "whatsapp",
    message_type: "first_contact",
    status: "draft",
    raw_status: "draft",
    text: "Hola, soy Juan Manuel de ARVOKTA.",
    generated_text: "Hola, soy Juan Manuel de ARVOKTA.",
    edited_text: null,
    sent_via: null,
    simulated: false,
    created_at: "2026-11-22T10:00:00Z",
    approved_at: null,
    sent_at: null,
    ...overrides,
  };
}

export function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: "41",
    lead_id: "5",
    company_id: "10",
    company_name: "Empresa de prueba",
    activity_type: "note",
    description: "Llamada realizada.",
    occurred_at: "2026-11-22T11:00:00Z",
    next_action_at: null,
    metadata: {},
    ...overrides,
  };
}

export function makeWhatsAppThread(
  overrides: Partial<WhatsAppThread> = {},
): WhatsAppThread {
  return {
    id: "7",
    phone: "+5493415550000",
    name: "Empresa de prueba",
    lead_id: "5",
    last_message_at: "2026-11-22T12:00:00Z",
    last_message_text: "Hola, quiero saber más",
    unread: 1,
    ...overrides,
  };
}

export function makeWhatsAppMessage(
  overrides: Partial<WhatsAppMessage> = {},
): WhatsAppMessage {
  return {
    id: "71",
    thread_id: "7",
    direction: "inbound",
    text: "Hola, quiero saber más sobre DOVEXO",
    created_at: "2026-11-22T12:00:00Z",
    status: "received",
    ...overrides,
  };
}
