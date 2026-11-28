import type {
  Activity,
  Campaign,
  CampaignSearchRunRef,
  CampaignStartResult,
  CampaignStatus,
  Company,
  CompanyContact,
  CompanyEnrichBatchResult,
  CompanyEnrichEvidence,
  CompanyEnrichJob,
  CompanyEnrichJobRef,
  CompanyEnrichJobResult,
  CompanyEnrichJobStatus,
  CompanyEnrichResult,
  CompanyEnrichStatus,
  CompanyFact,
  CompanyFactType,
  CompanyPage,
  CompanySource,
  DashboardJob,
  DashboardMetrics,
  ImportBatch,
  ImportConfirmResult,
  ImportPreview,
  ImportPreviewRow,
  ImportRowError,
  Lead,
  LeadEvaluation,
  LeadPage,
  LeadScoreItem,
  LeadScoreResult,
  LeadStatus,
  MessageStatus,
  OutreachMessage,
  Product,
  ProvinceOption,
  SearchRun,
  SearchRunStatus,
  Sector,
  SectorRef,
  SimulatedInbound,
  Suppression,
  User,
  WhatsAppMessage,
  WhatsAppStatus,
  WhatsAppThread,
  WhatsAppThreadDetail,
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
    search_runs_total: readNumber(record, [
      "search_runs_total",
      "searchRunsTotal",
    ]),
    search_runs_pending: readNumber(record, [
      "search_runs_pending",
      "searchRunsPending",
    ]),
    search_runs_running: readNumber(record, [
      "search_runs_running",
      "searchRunsRunning",
    ]),
    search_runs_completed: readNumber(record, [
      "search_runs_completed",
      "searchRunsCompleted",
    ]),
    search_runs_failed: readNumber(record, [
      "search_runs_failed",
      "searchRunsFailed",
    ]),
    search_runs_cancelled: readNumber(record, [
      "search_runs_cancelled",
      "searchRunsCancelled",
    ]),
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
      "companies",
    ]),
    companies_new: read(["companies_new", "new_companies", "discovered"]),
    companies_enriched: read([
      "companies_enriched",
      "enriched_companies",
      "researched_companies",
      "companies_researched",
      "investigated_companies",
      "investigated",
    ]),
    leads_total: read([
      "leads_total",
      "total_leads",
      "leads",
      "opportunities",
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
    leads_total: 0,
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

export function normalizeProvince(payload: unknown): ProvinceOption {
  const record = extractObject(payload, ["province", "data"]);
  const code = readString(record, ["code", "iso_code", "isoCode", "id"]);
  const name = readString(record, ["name", "label", "province"]);
  return { code, name: name || code };
}

/** `GET /meta/provinces` devuelve `[{ code, name }]`. */
export function normalizeProvinces(payload: unknown): ProvinceOption[] {
  return extractItems(payload, ["provinces"])
    .map(normalizeProvince)
    .filter((province) => province.code.length > 0);
}

/** Acepta listas de strings o de objetos `{ slug, name }`. */
export function normalizeSectorRefs(payload: unknown): SectorRef[] {
  const items = Array.isArray(payload) ? payload : [];
  const refs: SectorRef[] = [];
  for (const item of items) {
    if (typeof item === "string") {
      const value = item.trim();
      if (value.length > 0) refs.push({ slug: value, name: value });
      continue;
    }
    if (isRecord(item)) {
      const slug = readString(item, ["slug", "sector_slug", "sectorSlug"]);
      const name = readString(item, ["name", "sector_name", "sectorName"]);
      const label = name || slug;
      if (label.length > 0) refs.push({ slug: slug || label, name: label });
    }
  }
  return refs;
}

/** Palabras clave: arreglo o texto separado por líneas, comas o punto y coma. */
function readTextList(
  record: Record<string, unknown>,
  keys: string[],
): string[] {
  const value = pick(record, keys);
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (typeof item === "number") return String(item);
        return "";
      })
      .filter((item) => item.length > 0);
  }
  if (typeof value === "string") {
    return value
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return [];
}

function readErrorList(
  record: Record<string, unknown>,
  keys: string[],
): string[] {
  const value = pick(record, keys);
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (typeof item === "number") return String(item);
      if (isRecord(item)) {
        return readString(item, ["message", "detail", "error", "msg"]);
      }
      return "";
    })
    .filter((item) => item.length > 0);
}

const SEARCH_RUN_STATUSES: SearchRunStatus[] = [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
];

export function normalizeSearchRunStatus(value: string): SearchRunStatus {
  const normalized = value.trim().toLowerCase();
  const found = SEARCH_RUN_STATUSES.find((status) => status === normalized);
  return found ?? "unknown";
}

export function normalizeSearchRun(payload: unknown): SearchRun {
  const record = extractObject(payload, ["search_run", "searchRun", "data"]);
  const config = readRecord(record, ["search_config", "searchConfig"]);
  const campaign = isRecord(record.campaign) ? record.campaign : {};
  const rawStatus = readString(record, ["status", "state"], "pending");

  // El backend actual guarda el alcance en `search_config` y en los campos
  // `location`/`sector`; se aceptan además las claves planas del contrato.
  const provinceCode =
    readString(record, ["province_code", "provinceCode", "province"]) ||
    readString(config, ["province_code", "provinceCode", "province"]);

  const directSectors = readStringArray(record, [
    "sector_slugs",
    "sectorSlugs",
    "sectors",
  ]);
  const configSectors = readStringArray(config, [
    "sector_slugs",
    "sectorSlugs",
    "sectors",
  ]);
  const sectorSlugs =
    directSectors.length > 0
      ? directSectors
      : configSectors.length > 0
        ? configSectors
        : readTextList(record, ["sector", "sector_name", "sectorName"]);

  const directKeywords = readTextList(record, ["keywords"]);
  const keywords =
    directKeywords.length > 0
      ? directKeywords
      : readTextList(config, ["keywords"]);

  return {
    id: readId(record),
    campaign_id:
      readNullableString(record, ["campaign_id", "campaignId"]) ??
      (isRecord(record.campaign) ? readId(campaign) || null : null),
    provider: readString(record, ["provider"], "osm"),
    province_code: provinceCode,
    province_name: readNullableString(record, [
      "province_name",
      "provinceName",
      "location",
    ]),
    sector_slugs: sectorSlugs,
    keywords,
    limit: readNumber(record, ["limit", "max_results", "maxResults"], 0),
    status: normalizeSearchRunStatus(rawStatus),
    raw_status: rawStatus,
    records_found: readNumber(record, ["records_found", "recordsFound"]),
    new_companies: readNumber(record, ["new_companies", "newCompanies"]),
    duplicates: readNumber(record, ["duplicates", "duplicated"]),
    errors: readErrorList(record, ["errors", "error_messages"]),
    created_at: readNullableString(record, ["created_at", "createdAt"]),
    started_at: readNullableString(record, ["started_at", "startedAt"]),
    finished_at: readNullableString(record, ["finished_at", "finishedAt"]),
  };
}

export function normalizeSearchRuns(payload: unknown): SearchRun[] {
  return extractItems(payload, ["search_runs", "searchRuns", "runs"]).map(
    normalizeSearchRun,
  );
}

export function normalizeContact(payload: unknown): CompanyContact {
  const record = extractObject(payload, ["contact", "data"]);
  return {
    id: readId(record),
    contact_type: readString(
      record,
      ["contact_type", "contactType", "type", "channel"],
      "other",
    ),
    value: readString(record, [
      "value",
      "normalized_value",
      "normalizedValue",
      "original_value",
      "originalValue",
    ]),
    label: readNullableString(record, ["label", "name"]),
    is_primary: readBoolean(record, ["is_primary", "isPrimary"]),
    verification_status: readString(
      record,
      ["verification_status", "verificationStatus", "status"],
      "unverified",
    ),
    do_not_contact: readBoolean(record, ["do_not_contact", "doNotContact"]),
    source_url: readNullableString(record, [
      "source_url",
      "sourceUrl",
      "source",
    ]),
    source_title: readNullableString(record, ["source_title", "sourceTitle"]),
    source_collected_at: readNullableString(record, [
      "source_collected_at",
      "sourceCollectedAt",
      "collected_at",
      "collectedAt",
    ]),
    source_confidence: readOptionalNumber(record, [
      "source_confidence",
      "sourceConfidence",
      "confidence",
    ]),
    verified_at: readNullableString(record, ["verified_at", "verifiedAt"]),
  };
}

export function normalizeContacts(payload: unknown): CompanyContact[] {
  return extractItems(payload, ["contacts", "items"]).map(normalizeContact);
}

export function normalizeSource(payload: unknown): CompanySource {
  const record = extractObject(payload, ["source", "data"]);
  const confidence = readNumber(record, ["confidence"], Number.NaN);
  return {
    id: readId(record),
    source_type: readString(record, ["source_type", "sourceType", "type"], "osm"),
    source_url: readString(record, ["source_url", "sourceUrl", "url"]),
    title: readNullableString(record, ["title", "name"]),
    evidence_excerpt: readNullableString(record, [
      "evidence_excerpt",
      "evidenceExcerpt",
      "excerpt",
    ]),
    collected_at: readNullableString(record, ["collected_at", "collectedAt"]),
    confidence: Number.isNaN(confidence) ? null : confidence,
  };
}

export function normalizeSources(payload: unknown): CompanySource[] {
  return extractItems(payload, ["sources", "items"]).map(normalizeSource);
}

const FACT_TYPE_ALIASES: Record<string, CompanyFactType> = {
  service: "service",
  services: "service",
  servicio: "service",
  servicios: "service",
  activity: "activity",
  activities: "activity",
  actividad: "activity",
  actividades: "activity",
  locality: "locality",
  localities: "locality",
  localidad: "locality",
  localidades: "locality",
  coverage: "coverage",
  coverage_area: "coverage",
  area: "coverage",
  cobertura: "coverage",
  contact_page: "contact_page",
  contact_pages: "contact_page",
  contact: "contact_page",
  pagina_de_contacto: "contact_page",
  description: "description",
  descripcion: "description",
  about: "description",
};

/** `service`, `activity`, etc. Tolera variantes en inglés, español y plural. */
export function normalizeFactType(value: string): CompanyFactType {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return FACT_TYPE_ALIASES[normalized] ?? "unknown";
}

/**
 * Dato extraído del sitio (`GET /companies/{id}` → `facts`).
 * Un fact sin valor se descarta: no se muestra una fila vacía como si fuera
 * información encontrada.
 */
export function normalizeFact(payload: unknown): CompanyFact | null {
  if (!isRecord(payload)) return null;
  const value = readString(payload, ["value", "text", "fact_value", "factValue"]);
  if (value.trim().length === 0) return null;
  const rawType = readString(
    payload,
    ["fact_type", "factType", "type", "kind"],
    "unknown",
  );
  return {
    id: readId(payload),
    fact_type: normalizeFactType(rawType),
    raw_fact_type: rawType,
    value,
    normalized_value: readNullableString(payload, [
      "normalized_value",
      "normalizedValue",
    ]),
    source_url: readNullableString(payload, [
      "source_url",
      "sourceUrl",
      "url",
    ]),
    source_title: readNullableString(payload, ["source_title", "sourceTitle"]),
    evidence_excerpt: readNullableString(payload, [
      "evidence_excerpt",
      "evidenceExcerpt",
      "excerpt",
    ]),
    confidence: readOptionalNumber(payload, ["confidence"]),
    collected_at: readNullableString(payload, [
      "collected_at",
      "collectedAt",
      "created_at",
      "createdAt",
    ]),
  };
}

export function normalizeFacts(payload: unknown): CompanyFact[] {
  return extractItems(payload, ["facts", "items"])
    .map(normalizeFact)
    .filter((fact): fact is CompanyFact => fact !== null);
}

function findContactValue(
  contacts: CompanyContact[],
  types: string[],
): string | null {
  const matching = contacts.filter((contact) =>
    types.includes(contact.contact_type.toLowerCase()),
  );
  const preferred = matching.find((contact) => contact.is_primary) ?? matching[0];
  if (preferred && preferred.value.trim().length > 0) return preferred.value;
  return null;
}

export function normalizeCompany(payload: unknown): Company {
  const record = extractObject(payload, ["company", "data"]);
  const contacts = normalizeContacts(record.contacts ?? []);
  const sources = normalizeSources(record.sources ?? record.company_sources ?? []);
  const facts = normalizeFacts(record.facts ?? []);
  const rawStatus = readString(
    record,
    ["discovery_status", "discoveryStatus", "status"],
    "unknown",
  );
  const sourceCount = readNumber(
    record,
    ["source_count", "sourceCount", "sources_count"],
    Number.NaN,
  );

  return {
    id: readId(record),
    name: readString(record, ["name", "legal_name", "legalName"]),
    description: readString(record, ["description"]),
    website: readNullableString(record, ["website", "url", "domain"]),
    province: readNullableString(record, ["province", "province_name"]),
    locality: readNullableString(record, ["locality", "city", "town"]),
    address: readNullableString(record, ["address", "street"]),
    discovery_status: rawStatus.trim().toLowerCase(),
    raw_discovery_status: rawStatus,
    sectors: normalizeSectorRefs(record.sectors ?? record.company_sectors),
    contacts,
    primary_phone:
      readNullableString(record, ["primary_phone", "primaryPhone", "phone"]) ??
      findContactValue(contacts, ["phone", "whatsapp"]),
    primary_email:
      readNullableString(record, ["primary_email", "primaryEmail", "email"]) ??
      findContactValue(contacts, ["email"]),
    whatsapp:
      readNullableString(record, ["whatsapp", "whatsapp_number"]) ??
      findContactValue(contacts, ["whatsapp"]),
    source_count: Number.isNaN(sourceCount) ? sources.length : sourceCount,
    sources,
    facts,
    last_enriched_at: readNullableString(record, [
      "last_enriched_at",
      "lastEnrichedAt",
      "enriched_at",
      "enrichedAt",
    ]),
    created_at: readNullableString(record, ["created_at", "createdAt"]),
  };
}

export function normalizeCompanyPage(payload: unknown): CompanyPage {
  const record = isRecord(payload) ? payload : {};
  const items = extractItems(payload, ["items", "companies"]).map(
    normalizeCompany,
  );
  return {
    items,
    total: readNumber(record, ["total", "count"], items.length),
    limit: readNumber(record, ["limit", "page_size"], items.length),
    offset: readNumber(record, ["offset", "skip"], 0),
  };
}

const ENRICH_STATUS_ALIASES: Record<string, CompanyEnrichStatus> = {
  ok: "ok",
  success: "ok",
  enriched: "ok",
  completed: "ok",
  no_website: "no_website",
  no_website_found: "no_website",
  website_missing: "no_website",
  missing_website: "no_website",
  unsafe: "unsafe",
  unsafe_url: "unsafe",
  blocked: "unsafe",
  ssrf_blocked: "unsafe",
  fetch_error: "fetch_error",
  fetch_failed: "fetch_error",
  error: "fetch_error",
  timeout: "fetch_error",
};

/** `ok`, `no_website`, `unsafe`, `fetch_error` (tolera guiones y mayúsculas). */
export function normalizeEnrichStatus(value: string): CompanyEnrichStatus {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return ENRICH_STATUS_ALIASES[normalized] ?? "unknown";
}

function normalizeEnrichEvidence(payload: unknown): CompanyEnrichEvidence | null {
  if (!isRecord(payload)) return null;
  const sourceUrl = readString(payload, [
    "source_url",
    "sourceUrl",
    "url",
    "href",
  ]);
  const title = readNullableString(payload, ["title", "name", "label"]);
  const excerpt = readNullableString(payload, [
    "excerpt",
    "evidence_excerpt",
    "evidenceExcerpt",
    "snippet",
    "text",
  ]);
  if (
    sourceUrl.trim().length === 0 &&
    !title &&
    !excerpt
  ) {
    return null;
  }
  return { source_url: sourceUrl, title, excerpt };
}

function normalizeEnrichResultFields(
  record: Record<string, unknown>,
): CompanyEnrichJobResult {
  const rawStatus = readString(
    record,
    ["status", "result_status", "resultStatus", "outcome", "state"],
    "unknown",
  );
  const evidence = extractItems(record, ["evidence", "evidences"])
    .map(normalizeEnrichEvidence)
    .filter((item): item is CompanyEnrichEvidence => item !== null);
  return {
    status: normalizeEnrichStatus(rawStatus),
    raw_status: rawStatus,
    fields_updated: readStringArray(record, [
      "fields_updated",
      "fieldsUpdated",
      "updated_fields",
    ]),
    contacts_added: readNumber(record, [
      "contacts_added",
      "contactsAdded",
      "new_contacts",
      "newContacts",
      "contacts_new",
    ]),
    facts_added: readNumber(record, [
      "facts_added",
      "factsAdded",
      "new_facts",
      "newFacts",
      "facts_new",
    ]),
    sources_added: readNumber(record, [
      "sources_added",
      "sourcesAdded",
      "new_sources",
      "newSources",
      "sources_new",
    ]),
    evidence,
    error: readNullableString(record, ["error", "error_detail", "detail"]),
  };
}

/**
 * `POST /companies/{id}/enrich` devuelve el resultado de la investigación.
 * Se toleran listas envueltas y claves en camelCase; lo que falta queda en
 * cero o vacío para no inventar contactos, fuentes, facts ni evidencias.
 */
export function normalizeCompanyEnrichment(payload: unknown): CompanyEnrichResult {
  const record = isRecord(payload) ? payload : {};
  const result = normalizeEnrichResultFields(record);
  return {
    company_id: readEntityId(record, ["company_id", "companyId", "id"]),
    ...result,
  };
}

const ENRICH_JOB_STATUS_ALIASES: Record<string, CompanyEnrichJobStatus> = {
  pending: "pending",
  queued: "pending",
  waiting: "pending",
  scheduled: "pending",
  running: "running",
  processing: "running",
  in_progress: "running",
  started: "running",
  completed: "completed",
  success: "completed",
  succeeded: "completed",
  done: "completed",
  ok: "completed",
  failed: "failed",
  failure: "failed",
  error: "failed",
  cancelled: "failed",
  canceled: "failed",
};

/** Estados de la cola; `unknown` es defensa del normalizador. */
export function normalizeEnrichJobStatus(
  value: string,
): CompanyEnrichJobStatus {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return ENRICH_JOB_STATUS_ALIASES[normalized] ?? "unknown";
}

function normalizeEnrichJobResult(
  payload: unknown,
): CompanyEnrichJobResult | null {
  if (payload === null || payload === undefined) return null;
  if (typeof payload === "string") {
    const text = payload.trim();
    return text.length === 0
      ? null
      : {
          status: "unknown",
          raw_status: "",
          fields_updated: [],
          contacts_added: 0,
          facts_added: 0,
          sources_added: 0,
          evidence: [],
          error: text,
        };
  }
  if (!isRecord(payload)) return null;
  if (Object.keys(payload).length === 0) return null;
  return normalizeEnrichResultFields(payload);
}

/** Trabajo de enriquecimiento (`GET /companies/enrich/jobs`). */
export function normalizeCompanyEnrichJob(payload: unknown): CompanyEnrichJob {
  const record = extractObject(payload, ["job", "data"]);
  const rawStatus = readString(
    record,
    ["status", "state", "job_status", "jobStatus"],
    "unknown",
  );
  return {
    id: readId(record),
    company_id: readEntityId(record, ["company_id", "companyId"]),
    company_name: readNullableString(record, [
      "company_name",
      "companyName",
      "name",
    ]),
    status: normalizeEnrichJobStatus(rawStatus),
    raw_status: rawStatus,
    attempts: readNumber(record, ["attempts", "attempt"]),
    max_attempts: readNumber(record, ["max_attempts", "maxAttempts"]),
    error_message: readNullableString(record, [
      "error_message",
      "errorMessage",
      "error",
    ]),
    result: normalizeEnrichJobResult(record.result ?? record.result_data),
    created_at: readNullableString(record, ["created_at", "createdAt"]),
    started_at: readNullableString(record, ["started_at", "startedAt"]),
    finished_at: readNullableString(record, ["finished_at", "finishedAt"]),
  };
}

export function normalizeCompanyEnrichJobs(
  payload: unknown,
): CompanyEnrichJob[] {
  return extractItems(payload, ["jobs", "items"]).map(
    normalizeCompanyEnrichJob,
  );
}

function normalizeEnrichJobRef(payload: unknown): CompanyEnrichJobRef | null {
  if (!isRecord(payload)) return null;
  const id = readId(payload);
  if (id.length === 0) return null;
  const rawStatus = readString(payload, ["status", "state"], "pending");
  return {
    id,
    company_id: readEntityId(payload, ["company_id", "companyId"]),
    status: normalizeEnrichJobStatus(rawStatus),
    raw_status: rawStatus,
  };
}

function readCandidateCount(record: Record<string, unknown>): number {
  const value = pick(record, ["candidates", "candidate_count", "candidateCount"]);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (Array.isArray(value)) return value.length;
  return 0;
}

/** `POST /companies/enrich` (lote de hasta 50 empresas). */
export function normalizeCompanyEnrichBatch(
  payload: unknown,
): CompanyEnrichBatchResult {
  const record = isRecord(payload) ? payload : {};
  const jobs = extractItems(record, ["jobs", "items"])
    .map(normalizeEnrichJobRef)
    .filter((job): job is CompanyEnrichJobRef => job !== null);
  return {
    queued: readNumber(record, ["queued", "enqueued", "queued_count"]),
    skipped: readNumber(record, ["skipped", "skipped_count"]),
    jobs,
    candidates: readCandidateCount(record),
  };
}
export function normalizeCampaignSearchRunRef(
  payload: unknown,
): CampaignSearchRunRef {
  const record = isRecord(payload) ? payload : {};
  const rawStatus = readString(record, ["status", "state"], "pending");
  return {
    id: readId(record),
    province_code: readString(record, [
      "province_code",
      "provinceCode",
      "province",
    ]),
    province_name: readNullableString(record, [
      "province_name",
      "provinceName",
      "location",
    ]),
    status: normalizeSearchRunStatus(rawStatus),
    raw_status: rawStatus,
  };
}

/**
 * `POST /campaigns/{id}/start` devuelve `{ campaign, search_runs, total_jobs }`.
 * Se tolera también la respuesta anterior, que era la campaña sola.
 */
export function normalizeCampaignStart(payload: unknown): CampaignStartResult {
  if (!isRecord(payload)) {
    return { campaign: null, search_runs: [], total_jobs: 0 };
  }

  const nested = isRecord(payload.campaign) ? payload.campaign : null;
  const campaign = normalizeCampaign(nested ?? payload);
  const rawRuns = payload.search_runs ?? payload.searchRuns ?? payload.runs;
  const searchRuns = Array.isArray(rawRuns)
    ? rawRuns.map(normalizeCampaignSearchRunRef)
    : [];

  return {
    campaign: campaign.id ? campaign : null,
    search_runs: searchRuns,
    total_jobs: readNumber(
      payload,
      ["total_jobs", "totalJobs"],
      searchRuns.length,
    ),
  };
}

function normalizeImportRowError(payload: unknown): ImportRowError | null {
  if (typeof payload === "string") {
    const message = payload.trim();
    return message.length > 0 ? { row_number: 0, message } : null;
  }
  if (!isRecord(payload)) return null;
  const message = readString(payload, ["message", "detail", "error", "msg"]);
  if (message.trim().length === 0) return null;
  return {
    row_number: readNumber(payload, ["row_number", "rowNumber", "row", "line"]),
    message,
  };
}

function normalizeImportErrors(payload: unknown): ImportRowError[] {
  if (!Array.isArray(payload)) return [];
  return payload
    .map(normalizeImportRowError)
    .filter((error): error is ImportRowError => error !== null);
}

const VALID_ROW_STATUSES = new Set(["", "valid", "ok", "new", "ready"]);
const DUPLICATE_ROW_STATUSES = new Set([
  "duplicate",
  "duplicated",
  "possible_duplicate",
  "possible-duplicate",
]);

function normalizeImportPreviewRow(payload: unknown): ImportPreviewRow {
  const record = isRecord(payload) ? payload : {};
  const baseStatus = readString(record, ["status", "state"], "valid").toLowerCase();
  const possibleDuplicate = readBoolean(record, [
    "possible_duplicate",
    "possibleDuplicate",
  ]);
  const status =
    possibleDuplicate && VALID_ROW_STATUSES.has(baseStatus)
      ? "possible_duplicate"
      : baseStatus;
  const errors = readStringArray(record, ["errors", "messages"]);
  const message = readNullableString(record, ["message", "detail"]);

  return {
    row_number: readNumber(record, ["row_number", "rowNumber", "row", "line"]),
    name: readString(record, ["name", "company", "razon_social"]),
    website: readNullableString(record, ["website", "web", "url"]),
    province: readNullableString(record, ["province", "provincia"]),
    locality: readNullableString(record, ["locality", "localidad", "city"]),
    phone: readNullableString(record, ["phone", "telefono", "phone_number"]),
    email: readNullableString(record, ["email", "mail"]),
    sectors: readStringArray(record, ["sectors", "sector_slugs", "rubros"]),
    status,
    errors:
      errors.length > 0
        ? errors
        : message && message.trim().length > 0
          ? [message]
          : [],
  };
}

export function normalizeImportPreview(payload: unknown): ImportPreview {
  const record = isRecord(payload) ? payload : {};
  const preview = extractItems(payload, ["preview", "rows", "items"]).map(
    normalizeImportPreviewRow,
  );
  const invalidFromRows = preview.filter(
    (row) =>
      !VALID_ROW_STATUSES.has(row.status) &&
      !DUPLICATE_ROW_STATUSES.has(row.status),
  ).length;
  const duplicatesFromRows = preview.filter((row) =>
    DUPLICATE_ROW_STATUSES.has(row.status),
  ).length;

  return {
    batch_id: readId(record) || readString(record, ["batch_id", "batchId"]),
    filename: readString(record, ["filename", "file_name", "fileName"]),
    total_rows: readNumber(
      record,
      ["total_rows", "totalRows"],
      preview.length,
    ),
    valid_rows: readNumber(
      record,
      ["valid_rows", "validRows"],
      Math.max(preview.length - invalidFromRows - duplicatesFromRows, 0),
    ),
    invalid_rows: readNumber(
      record,
      ["invalid_rows", "invalidRows"],
      invalidFromRows,
    ),
    duplicates: readNumber(
      record,
      ["duplicates", "duplicated"],
      duplicatesFromRows,
    ),
    preview,
    errors: normalizeImportErrors(record.errors),
  };
}

export function normalizeImportConfirm(payload: unknown): ImportConfirmResult {
  const record = isRecord(payload) ? payload : {};
  return {
    batch_id: readId(record) || readString(record, ["batch_id", "batchId"]),
    created: readNumber(record, [
      "created",
      "created_companies",
      "imported",
      "successful_rows",
    ]),
    skipped: readNumber(record, ["skipped", "skipped_rows", "duplicates"]),
    errors: normalizeImportErrors(record.errors),
  };
}

export function normalizeImportBatch(payload: unknown): ImportBatch {
  const record = extractObject(payload, ["batch", "import", "data"]);
  const reportUrl = readNullableString(record, [
    "report_url",
    "reportUrl",
    "report",
  ]);
  return {
    id: readId(record),
    filename: readString(record, ["filename", "file_name", "fileName"]),
    status: readString(record, ["status", "state"], "unknown").toLowerCase(),
    total_rows: readNumber(record, ["total_rows", "totalRows"]),
    created: readNumber(record, [
      "created",
      "created_companies",
      "imported",
      "successful_rows",
    ]),
    skipped: readNumber(record, ["skipped", "skipped_rows"]),
    duplicates: readNumber(record, [
      "duplicates",
      "duplicated",
      "duplicate_rows",
      "duplicateRows",
    ]),
    imported_at: readNullableString(record, [
      "imported_at",
      "importedAt",
      "created_at",
      "createdAt",
    ]),
    confirmed_at: readNullableString(record, [
      "confirmed_at",
      "confirmedAt",
    ]),
    errors: normalizeImportErrors(record.errors),
    report_url: reportUrl ?? null,
  };
}

export function normalizeImports(payload: unknown): ImportBatch[] {
  return extractItems(payload, ["imports", "batches"]).map(normalizeImportBatch);
}

const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "researched",
  "pending_review",
  "approved",
  "contacted",
  "replied",
  "interested",
  "meeting_scheduled",
  "proposal_sent",
  "customer",
  "not_interested",
  "invalid",
  "do_not_contact",
];

export function normalizeLeadStatus(value: string): LeadStatus {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const found = LEAD_STATUSES.find((status) => status === normalized);
  return found ?? "unknown";
}

function readOptionalNumber(
  record: Record<string, unknown>,
  keys: string[],
): number | null {
  const value = readNumber(record, keys, Number.NaN);
  return Number.isNaN(value) ? null : value;
}

/** Id que puede llegar como número o cadena (el backend usa enteros). */
function readEntityId(
  record: Record<string, unknown>,
  keys: string[],
): string | null {
  const value = pick(record, keys);
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  return null;
}

const BREAKDOWN_LABELS: Record<string, string> = {
  sector: "Afinidad del rubro",
  sector_affinity: "Afinidad del rubro",
  sector_fit: "Afinidad del rubro",
  field_work: "Trabajo de campo e instalaciones",
  installations: "Trabajo de campo e instalaciones",
  maintenance: "Reparaciones y mantenimiento",
  operations: "Gestión de presupuestos, visitas o servicios",
  recurring_customers: "Clientes recurrentes",
  evidence_quality: "Calidad de la evidencia comercial",
  contact_quality: "Calidad del contacto",
};

/**
 * El desglose puede llegar como objeto de números, objeto de objetos
 * (`{points, max}`) o arreglo de factores. Se normaliza a una lista.
 */
export function normalizeScoreBreakdown(payload: unknown): LeadScoreItem[] {
  if (Array.isArray(payload)) {
    return payload
      .map((item) => {
        if (!isRecord(item)) return null;
        const key = readString(item, ["key", "factor", "name", "label"]);
        const label = readString(item, ["label", "name"], key);
        const points = readNumber(item, ["points", "score", "value"], 0);
        const maxPoints = readOptionalNumber(item, [
          "max_points",
          "maxPoints",
          "max",
          "weight",
        ]);
        if (!key && !label) return null;
        return {
          key: key || label,
          label: label || key,
          points,
          max_points: maxPoints,
        };
      })
      .filter((item): item is LeadScoreItem => item !== null);
  }

  if (!isRecord(payload)) return [];

  const items: LeadScoreItem[] = [];
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      items.push({
        key,
        label: BREAKDOWN_LABELS[key] ?? key,
        points: value,
        max_points: null,
      });
      continue;
    }
    if (isRecord(value)) {
      const points = readNumber(value, ["points", "score", "value"], 0);
      const maxPoints = readOptionalNumber(value, [
        "max_points",
        "maxPoints",
        "max",
        "weight",
      ]);
      items.push({
        key,
        label: readString(value, ["label", "name"], BREAKDOWN_LABELS[key] ?? key),
        points,
        max_points: maxPoints,
      });
    }
  }
  return items;
}

export function normalizeLead(payload: unknown): Lead {
  const record = extractObject(payload, ["lead", "data"]);
  const company = isRecord(record.company) ? record.company : {};
  const product = isRecord(record.product) ? record.product : {};
  const evaluation = isRecord(record.latest_evaluation)
    ? record.latest_evaluation
    : isRecord(record.evaluation)
      ? record.evaluation
      : {};

  const rawStatus = readString(record, ["status", "state"], "new");
  const reasons = readStringArray(record, ["reasons", "score_reasons"]);
  const breakdown = normalizeScoreBreakdown(
    pick(record, ["score_breakdown", "breakdown", "breakdown_json"]) ??
      pick(evaluation, ["score_breakdown", "breakdown"]),
  );

  return {
    id: readId(record),
    company_id:
      readEntityId(record, ["company_id", "companyId"]) ?? readId(company),
    company_name:
      readNullableString(record, ["company_name", "companyName"]) ??
      readString(company, ["name"]),
    company_locality:
      readNullableString(record, ["company_locality", "locality"]) ??
      readNullableString(company, ["locality", "city"]),
    company_province:
      readNullableString(record, ["company_province", "province"]) ??
      readNullableString(company, ["province"]),
    company_website:
      readNullableString(record, ["company_website", "website"]) ??
      readNullableString(company, ["website"]),
    company_phone:
      readNullableString(record, ["company_phone", "phone"]) ??
      readNullableString(company, ["primary_phone", "phone"]),
    company_email:
      readNullableString(record, ["company_email", "email"]) ??
      readNullableString(company, ["primary_email", "email"]),
    company_whatsapp:
      readNullableString(record, ["company_whatsapp", "whatsapp"]) ??
      readNullableString(company, ["whatsapp", "primary_whatsapp"]),
    product_id:
      readEntityId(record, ["product_id", "productId"]) ??
      (isRecord(record.product) ? readId(product) : null),
    product_name:
      readNullableString(record, ["product_name", "productName"]) ??
      (isRecord(record.product) ? readString(product, ["name"]) : null),
    status: normalizeLeadStatus(rawStatus),
    raw_status: rawStatus,
    score:
      readOptionalNumber(record, [
        "compatibility_score",
        "compatibilityScore",
        "score",
      ]) ?? readOptionalNumber(evaluation, ["score", "compatibility_score"]),
    confidence:
      readOptionalNumber(record, [
        "information_confidence",
        "informationConfidence",
        "confidence",
      ]) ?? readOptionalNumber(evaluation, ["confidence"]),
    reasons:
      reasons.length > 0 ? reasons : readStringArray(evaluation, ["reasons"]),
    breakdown,
    assigned_notes: readString(record, ["assigned_notes", "assignedNotes", "notes"]),
    last_activity_at: readNullableString(record, [
      "last_activity_at",
      "lastActivityAt",
    ]),
    next_action_at: readNullableString(record, [
      "next_action_at",
      "nextActionAt",
    ]),
    created_at: readNullableString(record, ["created_at", "createdAt"]),
    updated_at: readNullableString(record, ["updated_at", "updatedAt"]),
  };
}

export function normalizeLeads(payload: unknown): Lead[] {
  return extractItems(payload, ["leads", "items"]).map(normalizeLead);
}

export function normalizeLeadPage(payload: unknown): LeadPage {
  const items = normalizeLeads(payload);
  const record = isRecord(payload) ? payload : {};
  return {
    items,
    total: readNumber(record, ["total", "count"], items.length),
    limit: readNumber(record, ["limit", "page_size"], items.length),
    offset: readNumber(record, ["offset", "skip"], 0),
  };
}

export function normalizeLeadEvaluation(payload: unknown): LeadEvaluation {
  const record = extractObject(payload, ["evaluation", "data"]);
  const score = readNumber(record, ["score", "compatibility_score"], 0);
  const confidence = readNumber(record, ["confidence"], 0);
  return {
    id: readId(record),
    lead_id:
      readEntityId(record, ["lead_id", "leadId"]) ??
      (isRecord(record.lead) ? readId(record.lead) || "" : ""),
    score,
    confidence,
    reasons: readStringArray(record, ["reasons"]),
    breakdown: normalizeScoreBreakdown(
      pick(record, ["score_breakdown", "breakdown"]),
    ),
    evaluation_method: readString(
      record,
      ["evaluation_method", "evaluationMethod", "method"],
      "deterministic",
    ),
    model_name: readNullableString(record, ["model_name", "modelName"]),
    evaluated_at: readNullableString(record, [
      "evaluated_at",
      "evaluatedAt",
      "created_at",
    ]),
  };
}

export function normalizeLeadEvaluations(payload: unknown): LeadEvaluation[] {
  return extractItems(payload, ["evaluations", "items"]).map(
    normalizeLeadEvaluation,
  );
}

export function normalizeLeadScoreResult(payload: unknown): LeadScoreResult {
  const record = isRecord(payload) ? payload : {};
  const lead = isRecord(record.lead) ? normalizeLead(record.lead) : null;
  const evaluation = isRecord(record.evaluation)
    ? normalizeLeadEvaluation(record.evaluation)
    : null;
  const source = isRecord(record.evaluation) ? record.evaluation : record;
  const score =
    readOptionalNumber(source, ["score", "compatibility_score"]) ??
    lead?.score ??
    0;
  const confidence =
    readOptionalNumber(source, ["confidence", "information_confidence"]) ??
    lead?.confidence ??
    0;
  const reasons = readStringArray(source, ["reasons"]);
  const breakdown = normalizeScoreBreakdown(
    pick(source, ["score_breakdown", "breakdown"]),
  );

  return {
    lead,
    score,
    confidence,
    reasons: reasons.length > 0 ? reasons : (lead?.reasons ?? []),
    breakdown: breakdown.length > 0 ? breakdown : (lead?.breakdown ?? []),
    evaluation,
  };
}

const MESSAGE_STATUSES: MessageStatus[] = [
  "draft",
  "pending_approval",
  "approved",
  "rejected",
  "sent",
  "replied",
  "archived",
];

export function normalizeMessageStatus(value: string): MessageStatus {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (normalized === "pending" || normalized === "pending_review") {
    return "pending_approval";
  }
  if (normalized === "manually_sent" || normalized === "marked_sent") {
    return "sent";
  }
  const found = MESSAGE_STATUSES.find((status) => status === normalized);
  return found ?? "unknown";
}

export function normalizeMessage(payload: unknown): OutreachMessage {
  const record = extractObject(payload, ["message", "data"]);
  const rawStatus = readString(record, ["status", "state"], "draft");
  const generated = readString(record, [
    "generated_text",
    "generatedText",
    "text",
    "body",
  ]);
  const edited = readNullableString(record, ["edited_text", "editedText"]);
  const sentVia = readNullableString(record, [
    "sent_via",
    "sentVia",
    "delivery",
    "provider",
  ]);
  const text = (edited ?? "").trim().length > 0 ? (edited ?? "") : generated;

  return {
    id: readId(record),
    lead_id: readEntityId(record, ["lead_id", "leadId"]),
    channel: readString(record, ["channel"], "whatsapp"),
    message_type: readString(record, [
      "message_type",
      "messageType",
      "type",
    ], "first_contact"),
    status: normalizeMessageStatus(rawStatus),
    raw_status: rawStatus,
    text,
    generated_text: generated,
    edited_text: edited,
    sent_via: sentVia,
    simulated:
      readBoolean(record, ["simulated", "is_simulated"]) ||
      (sentVia ?? "").trim().toLowerCase() === "console",
    created_at: readNullableString(record, ["created_at", "createdAt"]),
    approved_at: readNullableString(record, ["approved_at", "approvedAt"]),
    sent_at: readNullableString(record, ["sent_at", "sentAt"]),
  };
}

export function normalizeMessages(payload: unknown): OutreachMessage[] {
  return extractItems(payload, ["messages", "items"]).map(normalizeMessage);
}

export function normalizeWhatsAppStatus(payload: unknown): WhatsAppStatus {
  const record = extractObject(payload, ["whatsapp", "status", "data"]);
  return {
    configured: readBoolean(record, ["configured", "is_configured"]),
    mode: readString(record, ["mode", "provider"], "unknown").toLowerCase(),
    sender_phone: readNullableString(record, ["sender_phone", "senderPhone"]),
    founder_phone_set: readBoolean(record, [
      "founder_phone_set",
      "founderPhoneSet",
    ]),
  };
}

export function normalizeWhatsAppThread(payload: unknown): WhatsAppThread {
  const record = extractObject(payload, ["thread", "data"]);
  const lastMessage = pick(record, ["last_message", "lastMessage"]);
  const lastText =
    typeof lastMessage === "string"
      ? lastMessage
      : isRecord(lastMessage)
        ? readString(lastMessage, ["text", "body", "content"])
        : "";

  return {
    id: readId(record),
    phone: readString(record, ["phone", "normalized_phone", "contact"]),
    name: readNullableString(record, ["name", "contact_name", "company_name"]),
    lead_id: readEntityId(record, ["lead_id", "leadId"]),
    last_message_at: readNullableString(record, [
      "last_message_at",
      "lastMessageAt",
      "updated_at",
    ]),
    last_message_text:
      readString(record, ["last_message_text", "lastMessageText", "preview"]) ||
      lastText,
    unread: readNumber(record, ["unread", "unread_count"]),
  };
}

export function normalizeWhatsAppThreads(payload: unknown): WhatsAppThread[] {
  return extractItems(payload, ["threads", "items"]).map(
    normalizeWhatsAppThread,
  );
}

export function normalizeWhatsAppMessage(payload: unknown): WhatsAppMessage {
  const record = extractObject(payload, ["message", "data"]);
  const rawDirection = readString(
    record,
    ["direction", "type", "kind"],
    "unknown",
  ).toLowerCase();
  const direction =
    rawDirection === "in" ||
    rawDirection === "inbound" ||
    rawDirection === "incoming" ||
    rawDirection === "received"
      ? "inbound"
      : rawDirection === "out" ||
          rawDirection === "outbound" ||
          rawDirection === "outgoing" ||
          rawDirection === "sent"
        ? "outbound"
        : "unknown";

  return {
    id: readId(record),
    thread_id: readEntityId(record, ["thread_id", "threadId"]),
    direction,
    text: readString(record, ["text", "body", "content"]),
    created_at: readNullableString(record, [
      "created_at",
      "createdAt",
      "sent_at",
      "occurred_at",
    ]),
    status: readNullableString(record, ["status"]),
  };
}

export function normalizeWhatsAppThreadDetail(
  payload: unknown,
): WhatsAppThreadDetail {
  const record = isRecord(payload) ? payload : {};
  const thread = isRecord(record.thread)
    ? normalizeWhatsAppThread(record.thread)
    : null;
  return {
    thread,
    messages: extractItems(record, ["messages", "items"]).map(
      normalizeWhatsAppMessage,
    ),
  };
}

export function normalizeSimulatedInbound(payload: unknown): SimulatedInbound {
  const record = isRecord(payload) ? payload : {};
  const thread = isRecord(record.thread) ? record.thread : {};
  const message = isRecord(record.message) ? record.message : {};
  return {
    thread_id:
      readEntityId(record, ["thread_id", "threadId"]) ??
      readEntityId(thread, ["id"]),
    text:
      readNullableString(message, ["text", "body"]) ??
      readNullableString(record, ["reply", "text"]),
  };
}

export function normalizeActivity(payload: unknown): Activity {
  const record = extractObject(payload, ["activity", "data"]);
  const lead = isRecord(record.lead) ? record.lead : {};
  const company = isRecord(record.company)
    ? record.company
    : isRecord(lead.company)
      ? lead.company
      : {};

  return {
    id: readId(record),
    lead_id:
      readEntityId(record, ["lead_id", "leadId"]) ??
      (readId(lead) || null),
    company_id:
      readEntityId(record, ["company_id", "companyId"]) ??
      (readId(company) || null),
    company_name:
      readNullableString(record, ["company_name", "companyName"]) ??
      (readString(company, ["name"]) || null),
    activity_type: readString(record, ["activity_type", "activityType", "type"], "note"),
    description: readString(record, ["description", "note", "text"]),
    occurred_at: readNullableString(record, [
      "occurred_at",
      "occurredAt",
      "created_at",
    ]),
    next_action_at: readNullableString(record, [
      "next_action_at",
      "nextActionAt",
    ]),
    metadata: readRecord(record, ["metadata", "metadata_json"]),
  };
}

export function normalizeActivities(payload: unknown): Activity[] {
  return extractItems(payload, ["activities", "items"]).map(normalizeActivity);
}

export function normalizeSuppression(payload: unknown): Suppression {
  const record = extractObject(payload, ["suppression", "data"]);
  return {
    id: readId(record),
    value: readString(record, [
      "normalized_contact",
      "normalizedContact",
      "value",
      "contact",
      "phone",
    ]),
    reason: readString(record, ["reason"]),
    company_id: readEntityId(record, ["company_id", "companyId"]),
    created_at: readNullableString(record, ["created_at", "createdAt"]),
  };
}

export function normalizeSuppressions(payload: unknown): Suppression[] {
  return extractItems(payload, ["suppressions", "items"]).map(
    normalizeSuppression,
  );
}
