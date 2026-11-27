import { isApiError } from "./api/client";

export function getErrorMessage(
  error: unknown,
  fallback = "Ocurrió un error inesperado.",
): string {
  if (isApiError(error)) return error.message;
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}
