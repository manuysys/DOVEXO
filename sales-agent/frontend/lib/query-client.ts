import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { isApiError, isUnauthorized } from "./api/client";

function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/login") return;
  window.location.replace("/login");
}

/**
 * Un 401 en cualquier consulta o mutación significa que la cookie de sesión
 * ya no es válida: se limpia el estado y se vuelve al login.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (isUnauthorized(error)) redirectToLogin();
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        if (isUnauthorized(error)) redirectToLogin();
      },
    }),
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          if (!isApiError(error)) return failureCount < 1;
          // Error de red (status 0): un reintento. Errores HTTP: sin reintento.
          if (error.status === 0) return failureCount < 1;
          return false;
        },
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
