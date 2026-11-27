/**
 * Contrato de datos del frontend contra la API FastAPI (`/api/v1`).
 *
 * El backend de la Fase 1 se construye en paralelo, por eso el cliente
 * normaliza respuestas (snake_case o camelCase, listas envueltas en `items`)
 * y completa con valores neutros lo que falte. Nunca inventa valores: un dato
 * ausente se muestra como cero, vacío o "—".
 */

export type EntityId = string;

export interface User {
  id: EntityId;
  email: string;
  name: string | null;
  role: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface Product {
  id: EntityId;
  name: string;
  slug: string;
  description: string;
  value_proposition: string;
  target_profile: string;
  pain_points: string[];
  target_sectors: string[];
  keywords: string[];
  scoring_config: Record<string, unknown>;
  messaging_config: Record<string, unknown>;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export type ProductInput = Omit<Product, "id" | "created_at" | "updated_at">;

export type CampaignStatus =
  | "draft"
  | "active"
  | "paused"
  | "cancelled"
  | "completed"
  | "unknown";

export interface Campaign {
  id: EntityId;
  product_id: EntityId | null;
  product_name: string | null;
  name: string;
  description: string;
  country: string;
  province_filters: string[];
  locality_filters: string[];
  sector_filters: string[];
  search_config: Record<string, unknown>;
  status: CampaignStatus;
  raw_status: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface CampaignInput {
  product_id: EntityId;
  name: string;
  description: string;
  country: string;
  province_filters: string[];
  locality_filters: string[];
  sector_filters: string[];
  search_config: Record<string, unknown>;
  status: "draft" | "active";
}

/**
 * Métricas del dashboard (`GET /dashboard/metrics`).
 * Si la API todavía no devuelve alguna clave, el valor queda en 0.
 */
export interface DashboardMetrics {
  companies_total: number;
  companies_new: number;
  companies_enriched: number;
  leads_pending: number;
  contacts_published: number;
  whatsapp_published: number;
  leads_approved: number;
  companies_contacted: number;
  responses: number;
  meetings: number;
}

export interface DashboardJob {
  id: EntityId;
  type: string;
  status: string;
  created_at: string | null;
}

export interface Sector {
  id: EntityId;
  slug: string;
  name: string;
  is_active: boolean;
}

/** Provincia de referencia (`GET /meta/provinces`). */
export interface ProvinceOption {
  code: string;
  name: string;
}

export type SearchRunStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "unknown";

/** Corrida de descubrimiento (`/search-runs`). */
export interface SearchRun {
  id: EntityId;
  campaign_id: EntityId | null;
  provider: string;
  /** Código ISO de la provincia (por ejemplo `AR-X`). */
  province_code: string;
  province_name: string | null;
  sector_slugs: string[];
  keywords: string[];
  limit: number;
  status: SearchRunStatus;
  raw_status: string;
  /** Registros devueltos por el proveedor. */
  records_found: number;
  new_companies: number;
  duplicates: number;
  errors: string[];
  created_at: string | null;
  started_at: string | null;
  finished_at: string | null;
}

export interface SearchRunInput {
  province_code: string;
  sector_slugs: string[];
  /** Texto libre; el backend lo guarda como una sola cadena. */
  keywords?: string;
  limit?: number;
  campaign_id?: EntityId | null;
}

export interface SearchRunFilters {
  limit?: number;
  offset?: number;
}

export interface SectorRef {
  slug: string;
  name: string;
}

/** Contacto público de una empresa (`GET /companies/{id}`). */
export interface CompanyContact {
  id: EntityId;
  contact_type: string;
  value: string;
  label: string | null;
  is_primary: boolean;
  verification_status: string;
  do_not_contact: boolean;
}

/** Fuente que respalda los datos de una empresa. */
export interface CompanySource {
  id: EntityId;
  source_type: string;
  source_url: string;
  title: string | null;
  evidence_excerpt: string | null;
  collected_at: string | null;
  confidence: number | null;
}

export interface Company {
  id: EntityId;
  name: string;
  description: string;
  website: string | null;
  province: string | null;
  locality: string | null;
  address: string | null;
  discovery_status: string;
  raw_discovery_status: string;
  sectors: SectorRef[];
  contacts: CompanyContact[];
  primary_phone: string | null;
  primary_email: string | null;
  whatsapp: string | null;
  source_count: number;
  sources: CompanySource[];
  created_at: string | null;
}

/** Respuesta paginada de `GET /companies`. */
export interface CompanyPage {
  items: Company[];
  total: number;
  limit: number;
  offset: number;
}

export interface CompanyFilters {
  search_run_id?: string;
  query?: string;
  province?: string;
  sector?: string;
  limit?: number;
  offset?: number;
}

export interface CompanyInput {
  name: string;
  website?: string;
  province?: string;
  locality?: string;
  address?: string;
  sector_slugs: string[];
  phone?: string;
  email?: string;
}
