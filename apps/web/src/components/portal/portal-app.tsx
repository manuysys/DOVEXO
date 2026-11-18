"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { ApiError } from "@/lib/api";
import {
  clearPortalSession,
  portalApi,
  readPortalSession,
  savePortalSession,
  type PortalSession,
} from "@/lib/portal-api";

import { PortalEntry } from "./portal-entry";
import { PortalWorkspace } from "./portal-workspace";

function friendlyAccessError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return "Este enlace ya se usó o venció. Pedile a la empresa que te genere uno nuevo.";
    }
    if (error.status === 404) {
      return "No encontramos esta empresa. Revisá el enlace que recibiste.";
    }
    if (error.status === 429) {
      return "Hiciste varios intentos seguidos. Esperá un minuto y volvé a probar.";
    }
  }
  return "No pudimos validar el acceso. Revisá tu conexión e intentá de nuevo.";
}

function removeTokenFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("token")) return;
  url.searchParams.delete("token");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

export function PortalApp({ slug, initialToken }: { slug: string; initialToken: string }) {
  const [session, setSession] = useState<PortalSession | null>(null);
  const [tokenAvailable, setTokenAvailable] = useState(initialToken.length > 0);
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const stored = readPortalSession(slug);
    // La sesión vive en `sessionStorage` (solo navegador). Se lee después del
    // montaje para que el HTML del servidor y el primer render del cliente
    // coincidan; por eso la actualización de estado va dentro del efecto.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura única después de montar
    setSession(stored);
    setReady(true);
    // Si ya hay sesión en esta pestaña, el token de la URL no se usa: se quita
    // para no dejarlo en la barra de direcciones ni en el historial.
    if (stored && initialToken) {
      setTokenAvailable(false);
      removeTokenFromUrl();
    }
  }, [slug, initialToken]);

  const infoQuery = useQuery({
    queryKey: ["portal", slug, "info"],
    queryFn: () => portalApi.info(slug),
    staleTime: 5 * 60_000,
  });

  const verifyMutation = useMutation({
    mutationFn: () => portalApi.verify(slug, initialToken),
    onSuccess: (auth) => {
      const next = savePortalSession(auth, slug);
      setSession(next);
      setTokenAvailable(false);
      setAuthError(null);
      removeTokenFromUrl();
    },
    onError: (error) => setAuthError(friendlyAccessError(error)),
  });

  const demoMutation = useMutation({
    mutationFn: () => portalApi.demo(slug),
    onSuccess: (auth) => {
      const next = savePortalSession(auth, slug);
      setSession(next);
      setAuthError(null);
    },
    onError: () => {
      setAuthError("No pudimos abrir la demo. Intentá de nuevo en unos minutos.");
    },
  });

  function handleExit() {
    clearPortalSession();
    setSession(null);
    setAuthError(null);
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg px-4">
        <p role="status" className="text-small flex items-center gap-2 text-text-2">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Cargando el portal...
        </p>
      </main>
    );
  }

  if (session) {
    const companyName =
      infoQuery.data?.portal.display_name ?? infoQuery.data?.tenant.name ?? session.tenant.name;
    return <PortalWorkspace session={session} companyName={companyName} onExit={handleExit} />;
  }

  return (
    <PortalEntry
      slug={slug}
      token={tokenAvailable ? initialToken : ""}
      info={infoQuery.data}
      error={authError}
      isVerifying={verifyMutation.isPending}
      isDemoLoading={demoMutation.isPending}
      demoAvailable={Boolean(infoQuery.data?.demo_available)}
      onEnterBrowser={() => {
        setAuthError(null);
        verifyMutation.mutate();
      }}
      onOpenDemo={() => {
        setAuthError(null);
        demoMutation.mutate();
      }}
    />
  );
}
