/**
 * Cliente del portal público del cliente.
 *
 * El portal usa un enlace de un solo uso (`?token=`) que se canjea por un JWT de
 * portal de vida corta. Ese JWT se guarda en `sessionStorage` (no en cookies ni
 * en `localStorage`) para que la sesión termine al cerrar la pestaña.
 *
 * No comparte el token de acceso del panel: el backend firma ambos con claves y
 * audiencias distintas.
 */
import { ApiError } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const SESSION_STORAGE_KEY = "dovexo.portal.session";

export type PortalTenant = {
  id: string;
  name: string;
  slug: string;
};

export type PortalSettings = {
  display_name: string | null;
  logo_url: string | null;
  primary_color: string | null;
  support_email: string | null;
  support_phone: string | null;
  welcome_message: string | null;
};

export type PortalPublicInfo = {
  tenant: PortalTenant;
  portal: PortalSettings;
  demo_available: boolean;
};

export type PortalCustomer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
};

export type PortalAuth = {
  access_token: string;
  token_type: string;
  expires_in: number;
  customer: PortalCustomer;
  tenant: PortalTenant;
};

export type PortalNextAppointment = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
};

export type PortalSummary = {
  open_requests: number;
  open_orders: number;
  pending_quotes: number;
  next_appointment: PortalNextAppointment | null;
};

export type PortalServiceRequest = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  requested_at: string;
  created_at: string;
};

export type PortalOrder = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  operational_status: string;
  commercial_status: string;
  payment_status: string;
  scheduled_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
};

export type PortalAppointment = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  notes: string | null;
};

export type PortalQuoteItem = {
  description: string;
  quantity: string;
  unit_price: string;
  discount_rate: string;
  tax_rate: string;
  line_total: string;
};

export type PortalQuote = {
  id: string;
  number: string;
  status: string;
  currency: string;
  subtotal: string;
  discount_total: string;
  tax_total: string;
  total: string;
  valid_until: string | null;
  sent_at: string | null;
  items: PortalQuoteItem[];
};

export type PortalPayment = {
  id: string;
  amount: string;
  currency: string;
  method: string;
  status: string;
  paid_at: string;
};

export type PortalRequestInput = {
  title: string;
  description?: string;
  priority: "low" | "normal" | "high" | "urgent";
};

export type PortalSession = {
  slug: string;
  token: string;
  expiresAt: number;
  customer: PortalCustomer;
  tenant: PortalTenant;
};

function detailFrom(body: unknown, fallback: string): string {
  if (typeof body === "object" && body !== null && "detail" in body) {
    const { detail } = body;
    if (typeof detail === "string") return detail;
  }
  return fallback;
}

type PortalRequestOptions = {
  token?: string;
  method?: "GET" | "POST";
  body?: unknown;
};

async function portalRequest<T>(path: string, options: PortalRequestOptions = {}): Promise<T> {
  const headers = new Headers({ Accept: "application/json" });
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    credentials: "omit",
    cache: "no-store",
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, detailFrom(body, "No pudimos completar la operación."));
  }
  return body as T;
}

function basePath(slug: string) {
  return `/api/v1/portal/${encodeURIComponent(slug)}`;
}

/** Endpoints del portal. Todos los datos quedan acotados al cliente autenticado. */
export const portalApi = {
  info: (slug: string) => portalRequest<PortalPublicInfo>(basePath(slug)),
  verify: (slug: string, token: string) =>
    portalRequest<PortalAuth>(`${basePath(slug)}/auth/verify`, {
      method: "POST",
      body: { token },
    }),
  demo: (slug: string) =>
    portalRequest<PortalAuth>(`${basePath(slug)}/auth/demo`, {
      method: "POST",
      body: {},
    }),
  summary: (slug: string, token: string) =>
    portalRequest<PortalSummary>(`${basePath(slug)}/summary`, { token }),
  requests: (slug: string, token: string) =>
    portalRequest<PortalServiceRequest[]>(`${basePath(slug)}/requests`, { token }),
  createRequest: (slug: string, token: string, input: PortalRequestInput) =>
    portalRequest<PortalServiceRequest>(`${basePath(slug)}/requests`, {
      token,
      method: "POST",
      body: input,
    }),
  orders: (slug: string, token: string) =>
    portalRequest<PortalOrder[]>(`${basePath(slug)}/orders`, { token }),
  quotes: (slug: string, token: string) =>
    portalRequest<PortalQuote[]>(`${basePath(slug)}/quotes`, { token }),
  approveQuote: (slug: string, token: string, quoteId: string) =>
    portalRequest<PortalQuote>(`${basePath(slug)}/quotes/${quoteId}/approve`, {
      token,
      method: "POST",
      body: {},
    }),
  rejectQuote: (slug: string, token: string, quoteId: string) =>
    portalRequest<PortalQuote>(`${basePath(slug)}/quotes/${quoteId}/reject`, {
      token,
      method: "POST",
      body: {},
    }),
  appointments: (slug: string, token: string) =>
    portalRequest<PortalAppointment[]>(`${basePath(slug)}/appointments`, { token }),
  payments: (slug: string, token: string) =>
    portalRequest<PortalPayment[]>(`${basePath(slug)}/payments`, { token }),
};

function isPortalSession(value: unknown): value is PortalSession {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.slug === "string" &&
    typeof candidate.token === "string" &&
    typeof candidate.expiresAt === "number" &&
    typeof candidate.customer === "object" &&
    candidate.customer !== null &&
    typeof candidate.tenant === "object" &&
    candidate.tenant !== null
  );
}

/** Lee la sesión del portal de la pestaña actual. Devuelve `null` si no sirve. */
export function readPortalSession(slug: string): PortalSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isPortalSession(parsed) || parsed.slug !== slug) return null;
    if (parsed.expiresAt <= Date.now()) {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Guarda la sesión del portal. Si el almacenamiento está bloqueado, sigue en memoria. */
export function savePortalSession(auth: PortalAuth, slug: string): PortalSession {
  const session: PortalSession = {
    slug,
    token: auth.access_token,
    expiresAt: Date.now() + Math.max(0, auth.expires_in) * 1000,
    customer: auth.customer,
    tenant: auth.tenant,
  };
  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Almacenamiento deshabilitado: la sesión vive solo en memoria.
  }
  return session;
}

export function clearPortalSession() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Sin almacenamiento no hay nada que limpiar.
  }
}
