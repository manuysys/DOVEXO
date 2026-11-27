import type {
  Campaign,
  CampaignSearchRunRef,
  CampaignStartResult,
  CampaignStatus,
  Company,
  CompanyContact,
  CompanyPage,
  CompanySource,
  DashboardJob,
  DashboardMetrics,
  ImportBatch,
  ImportConfirmResult,
  ImportPreview,
  ImportPreviewRow,
  ImportRowError,
  Product,
  ProvinceOption,
  SearchRun,
  SearchRunStatus,
  Sector,
  SectorRef,
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
