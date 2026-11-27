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
