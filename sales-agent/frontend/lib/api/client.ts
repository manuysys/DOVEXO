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

/** URL completa de un endpoint de la API, útil para enlaces de descarga. */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${API_PREFIX}${path}`;
}

/**
 * Resuelve un enlace devuelto por la API: acepta URL absoluta, ruta con
 * prefijo `/api/v1` o ruta relativa al prefijo.
 */
export function apiHref(pathOrUrl: string): string {
  const value = pathOrUrl.trim();
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith(`${API_PREFIX}/`)) return `${API_BASE_URL}${value}`;
  return apiUrl(value.startsWith("/") ? value : `/${value}`);
}

async function send(
  path: string,
  init: RequestInit,
): Promise<Response> {
  try {
    return await fetch(apiUrl(path), {
      credentials: "include",
      cache: "no-store",
      ...init,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new ApiError(
      `No se pudo conectar con la API en ${API_BASE_URL}. Verificá que el backend esté iniciado.`,
      0,
    );
  }
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

  const response = await send(path, {
    method,
    headers,
    signal,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

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

/**
 * Envío `multipart/form-data` (importación CSV). No se fija
 * `Content-Type`: el navegador agrega el boundary.
 */
export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options: { signal?: AbortSignal } = {},
): Promise<T> {
  const response = await send(path, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: formData,
    signal: options.signal,
  });

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

/**
 * Descarga de archivos (exportación CSV). Devuelve la respuesta completa para
 * leer `content-disposition`; si la API falla, lanza `ApiError` con el detalle.
 */
export async function apiRequestFile(
  path: string,
  options: { signal?: AbortSignal } = {},
): Promise<Response> {
  const response = await send(path, {
    method: "GET",
    headers: { Accept: "text/csv, application/json" },
    signal: options.signal,
  });

  if (!response.ok) {
    const payload = await readBody(response);
    throw new ApiError(
      describeError(response.status, payload),
      response.status,
      payload,
    );
  }

  return response;
}
