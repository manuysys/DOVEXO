const FALLBACK_API_URL = "http://localhost:8001";

/** URL base de la API, sin el prefijo `/api/v1`. */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? FALLBACK_API_URL
).replace(/\/+$/, "");

export const API_PREFIX = "/api/v1";

export class ApiError extends Error {
  readonly status: number;
  readonly detail: unknown;

  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isUnauthorized(error: unknown): boolean {
  return isApiError(error) && error.status === 401;
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function describeError(status: number, body: unknown): string {
  if (typeof body === "string" && body.trim().length > 0) return body;

  if (typeof body === "object" && body !== null) {
    const record = body as Record<string, unknown>;
    if (typeof record.detail === "string") return record.detail;
    if (typeof record.message === "string") return record.message;
    if (Array.isArray(record.detail)) {
      const messages = record.detail
        .map((item) => {
          if (typeof item === "string") return item;
          if (typeof item === "object" && item !== null) {
            const entry = item as Record<string, unknown>;
            if (typeof entry.msg === "string") return entry.msg;
          }
          return "";
        })
        .filter((item) => item.length > 0);
      if (messages.length > 0) return messages.join(" ");
    }
  }

  switch (status) {
    case 400:
      return "La solicitud no es válida.";
    case 401:
      return "Email o contraseña incorrectos, o la sesión expiró.";
    case 403:
      return "No tenés permisos para realizar esta acción.";
    case 404:
      return "El recurso solicitado no existe.";
    case 409:
      return "Ya existe un registro con esos datos.";
    case 422:
      return "Revisá los datos ingresados: hay campos inválidos.";
    case 429:
      return "Demasiados intentos. Esperá unos minutos.";
    case 500:
    case 502:
    case 503:
      return "La API devolvió un error interno. Revisá los logs del backend.";
    default:
      return `La API respondió con un error (${status}).`;
  }
}

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * Cliente HTTP centralizado. La autenticación viaja en una cookie HttpOnly,
 * por eso todas las llamadas usan `credentials: "include"`.
 */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = "GET", body, signal } = options;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
      method,
      headers,
      credentials: "include",
      cache: "no-store",
      signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new ApiError(
      `No se pudo conectar con la API en ${API_BASE_URL}. Verificá que el backend esté iniciado.`,
      0,
    );
  }

  const payload = await readBody(response);

  if (!response.ok) {
    throw new ApiError(
      describeError(response.status, payload),
      response.status,
      payload,
    );
  }

  return payload as T;
}
