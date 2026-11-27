import type {
  Campaign,
  CampaignStatus,
  DashboardJob,
  DashboardMetrics,
  Product,
  Sector,
  User,
} from "./types";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pick(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key];
    }
  }
  return undefined;
}

export function readString(
  record: Record<string, unknown>,
  keys: string[],
  fallback = "",
): string {
  const value = pick(record, keys);
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

export function readNullableString(
  record: Record<string, unknown>,
  keys: string[],
): string | null {
  const value = pick(record, keys);
  if (typeof value === "string") return value;
  return null;
}

export function readNumber(
  record: Record<string, unknown>,
  keys: string[],
  fallback = 0,
): number {
  const value = pick(record, keys);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function readBoolean(
  record: Record<string, unknown>,
  keys: string[],
  fallback = false,
): boolean {
  const value = pick(record, keys);
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }
  if (typeof value === "number") return value !== 0;
  return fallback;
}

export function readStringArray(
  record: Record<string, unknown>,
  keys: string[],
): string[] {
  const value = pick(record, keys);
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (typeof item === "number") return String(item);
      return "";
    })
    .filter((item) => item.length > 0);
}

export function readRecord(
  record: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> {
  const value = pick(record, keys);
  return isRecord(value) ? value : {};
}

function readId(record: Record<string, unknown>): string {
  const value = pick(record, ["id", "uuid", "_id"]);
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

/**
 * Las listas pueden llegar como arreglo directo o envueltas en
 * `{ items }`, `{ data }`, `{ results }` o con el nombre de la entidad.
 */
export function extractItems(
  payload: unknown,
  keys: string[] = ["items", "results", "data"],
): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];
  for (const key of [...keys, "items", "results", "data"]) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

/** Los objetos individuales pueden llegar envueltos en `{ product: ... }`. */
export function extractObject(
  payload: unknown,
  keys: string[] = [],
): Record<string, unknown> {
  if (!isRecord(payload)) return {};
  for (const key of keys) {
    const value = payload[key];
    if (isRecord(value)) return value;
  }
  return payload;
}

export function normalizeUser(payload: unknown): User {
  const record = extractObject(payload, ["user", "data", "profile"]);
  const email = readString(record, ["email"]);
  return {
    id: readId(record),
    email,
    name: readNullableString(record, ["name", "full_name", "fullName"]),
    role: readNullableString(record, ["role"]),
  };
}

export function normalizeProduct(payload: unknown): Product {
  const record = extractObject(payload, ["product", "data"]);
  return {
    id: readId(record),
    name: readString(record, ["name"]),
    slug: readString(record, ["slug"]),
    description: readString(record, ["description"]),
    value_proposition: readString(record, [
      "value_proposition",
      "valueProposition",
    ]),
    target_profile: readString(record, ["target_profile", "targetProfile"]),
    pain_points: readStringArray(record, ["pain_points", "painPoints"]),
    target_sectors: readStringArray(record, ["target_sectors", "targetSectors"]),
    keywords: readStringArray(record, ["keywords"]),
    scoring_config: readRecord(record, ["scoring_config", "scoringConfig"]),
    messaging_config: readRecord(record, [
      "messaging_config",
      "messagingConfig",
    ]),
    is_active: readBoolean(record, ["is_active", "isActive"], true),
    created_at: readNullableString(record, ["created_at", "createdAt"]),
    updated_at: readNullableString(record, ["updated_at", "updatedAt"]),
  };
}

export function normalizeProducts(payload: unknown): Product[] {
  return extractItems(payload, ["products"]).map(normalizeProduct);
}

const CAMPAIGN_STATUSES: CampaignStatus[] = [
  "draft",
  "active",
  "paused",
  "cancelled",
  "completed",
];

export function normalizeCampaignStatus(value: string): CampaignStatus {
  const normalized = value.trim().toLowerCase();
  const found = CAMPAIGN_STATUSES.find((status) => status === normalized);
  return found ?? "unknown";
}

export function normalizeCampaign(payload: unknown): Campaign {
  const record = extractObject(payload, ["campaign", "data"]);
  const product = isRecord(record.product) ? record.product : null;
  const rawStatus = readString(record, ["status"], "draft");
  return {
    id: readId(record),
    product_id:
      readNullableString(record, ["product_id", "productId"]) ??
      (product ? readId(product) : null),
    product_name:
      readNullableString(record, ["product_name", "productName"]) ??
      (product ? readString(product, ["name"]) : null),
    name: readString(record, ["name"]),
    description: readString(record, ["description"]),
    country: readString(record, ["country"], "AR"),
    province_filters: readStringArray(record, [
      "province_filters",
      "provinceFilters",
      "provinces",
    ]),
    locality_filters: readStringArray(record, [
      "locality_filters",
      "localityFilters",
      "localities",
    ]),
    sector_filters: readStringArray(record, [
      "sector_filters",
      "sectorFilters",
      "sectors",
    ]),
    search_config: readRecord(record, ["search_config", "searchConfig"]),
    status: normalizeCampaignStatus(rawStatus),
    raw_status: rawStatus,
    created_at: readNullableString(record, ["created_at", "createdAt"]),
    updated_at: readNullableString(record, ["updated_at", "updatedAt"]),
  };
}

export function normalizeCampaigns(payload: unknown): Campaign[] {
  return extractItems(payload, ["campaigns"]).map(normalizeCampaign);
}

export function normalizeMetrics(payload: unknown): DashboardMetrics {
  const root = extractObject(payload, ["metrics", "data"]);
  const companies = isRecord(root.companies) ? root.companies : {};
  const leads = isRecord(root.leads) ? root.leads : {};
  const crm = isRecord(root.crm) ? root.crm : {};

  const read = (keys: string[]): number => {
    for (const source of [root, companies, leads, crm]) {
      const value = readNumber(source, keys, Number.NaN);
      if (!Number.isNaN(value)) return value;
    }
    return 0;
  };

  return {
    companies_total: read([
      "companies_total",
      "total_companies",
      "companies_count",
    ]),
    companies_new: read(["companies_new", "new_companies", "discovered"]),
    companies_enriched: read([
      "companies_enriched",
      "enriched_companies",
      "researched_companies",
      "companies_researched",
    ]),
    leads_pending: read(["leads_pending", "pending_leads", "leads_to_review"]),
    contacts_published: read([
      "contacts_published",
      "published_contacts",
      "contacts",
    ]),
    whatsapp_published: read([
      "whatsapp_published",
      "published_whatsapp",
      "whatsapp",
    ]),
    leads_approved: read(["leads_approved", "approved_leads"]),
    companies_contacted: read([
      "companies_contacted",
      "contacted_companies",
      "contacted",
    ]),
    responses: read(["responses", "replies"]),
    meetings: read(["meetings", "meetings_scheduled"]),
  };
}

export function emptyMetrics(): DashboardMetrics {
  return {
    companies_total: 0,
    companies_new: 0,
    companies_enriched: 0,
    leads_pending: 0,
    contacts_published: 0,
    whatsapp_published: 0,
    leads_approved: 0,
    companies_contacted: 0,
    responses: 0,
    meetings: 0,
  };
}

export function normalizeJob(payload: unknown): DashboardJob {
  const record = isRecord(payload) ? payload : {};
  return {
    id: readId(record),
    type: readString(record, ["type", "job_type", "kind", "name"], "tarea"),
    status: readString(record, ["status", "state"], "unknown"),
    created_at: readNullableString(record, ["created_at", "createdAt"]),
  };
}

export function normalizeJobs(payload: unknown): DashboardJob[] {
  return extractItems(payload, ["jobs"]).map(normalizeJob);
}

export function normalizeSector(payload: unknown): Sector {
  const record = extractObject(payload, ["sector", "data"]);
  return {
    id: readId(record),
    slug: readString(record, ["slug"]),
    name: readString(record, ["name"]),
    is_active: readBoolean(record, ["is_active", "isActive"], true),
  };
}

export function normalizeSectors(payload: unknown): Sector[] {
  return extractItems(payload, ["sectors"]).map(normalizeSector);
}
