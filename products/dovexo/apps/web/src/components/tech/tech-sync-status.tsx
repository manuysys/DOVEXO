"use client";

import {
  useIsFetching,
  useIsMutating,
  useMutationState,
  useQueryClient,
} from "@tanstack/react-query";
import { AlertTriangle, Loader2, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

export type SyncState = "online" | "offline" | "updating" | "saving" | "failed";

/**
 * Fallos que el técnico ya reconoció. Vive fuera de React para que el indicador
 * del header y la barra compartan la misma decisión sin duplicar estado.
 */
const MAX_DISMISSED = 50;
let dismissedFailures: readonly string[] = [];
const dismissListeners = new Set<() => void>();

function subscribeDismissed(listener: () => void) {
  dismissListeners.add(listener);
  return () => {
    dismissListeners.delete(listener);
  };
}

function getDismissedSnapshot(): readonly string[] {
  return dismissedFailures;
}

function dismissFailureIds(ids: readonly string[]) {
  const merged = Array.from(new Set([...dismissedFailures, ...ids]));
  if (merged.length === dismissedFailures.length) return;
  dismissedFailures = merged.slice(-MAX_DISMISSED);
  for (const listener of dismissListeners) listener();
}

/**
 * Estado real de conexión del navegador. Arranca en `true` para no romper la
 * hidratación; el efecto corrige el valor en el cliente.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    function update() {
      setOnline(window.navigator.onLine);
    }
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return online;
}

/**
 * Resume el estado de sincronización de la PWA: conexión, escrituras en curso
 * (pendientes de confirmación) y escrituras que el servidor rechazó o que no
 * llegaron a enviarse.
 *
 * La PWA web no tiene outbox persistente: "pendiente" significa que la request
 * todavía está en vuelo y el servidor aún no confirmó. Por eso nunca se anuncia
 * éxito antes de la respuesta.
 */
export function useSyncStatus() {
  const online = useOnlineStatus();
  const pending = useIsMutating();
  const fetching = useIsFetching();
  const failedIds = useMutationState({
    filters: { status: "error" },
    select: (mutation) => mutation.mutationId,
  });
  const dismissed = useSyncExternalStore(
    subscribeDismissed,
    getDismissedSnapshot,
    getDismissedSnapshot,
  );

  const failedCount = failedIds.filter((id) => !dismissed.includes(String(id))).length;
  const state: SyncState = !online
    ? "offline"
    : failedCount > 0
      ? "failed"
      : pending > 0
        ? "saving"
        : fetching > 0
          ? "updating"
          : "online";

  function dismissFailures() {
    dismissFailureIds(failedIds.map(String));
  }

  return { online, pending, fetching, failedCount, state, dismissFailures };
}

export function TechSyncIndicator({ className }: { className?: string }) {
  const { state, pending, failedCount } = useSyncStatus();

  const label =
    state === "offline"
      ? "Sin conexión"
      : state === "failed"
        ? failedCount === 1
          ? "Sin guardar"
          : `${failedCount} sin guardar`
        : state === "saving"
          ? pending === 1
            ? "Guardando"
            : `Guardando ${pending}`
          : state === "updating"
            ? "Actualizando"
            : "En línea";
  const Icon =
    state === "offline"
      ? WifiOff
      : state === "failed"
        ? AlertTriangle
        : state === "saving" || state === "updating"
          ? Loader2
          : Wifi;
  const tone =
    state === "offline"
      ? "bg-warning-soft text-warning-strong"
      : state === "failed"
        ? "bg-danger-soft text-danger-strong"
        : state === "saving" || state === "updating"
          ? "bg-info-soft text-info-strong"
          : "bg-success-soft text-success-strong";
  const spinning = state === "saving" || state === "updating";

  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "text-caption inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-2.5 font-semibold",
        tone,
        className,
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", spinning && "animate-spin")} aria-hidden="true" />
      <span className="sr-only">Estado de sincronización: </span>
      <span
        className={cn(state !== "offline" && state !== "failed" && "hidden min-[380px]:inline")}
      >
        {label}
      </span>
    </span>
  );
}

/**
 * Barra discreta para offline, escrituras en curso, reconexión y fallos.
 * No anuncia éxito de sincronización: solo confirma lo que el servidor ya
 * respondió o informa lo que quedó sin confirmar.
 */
export function TechSyncBanner() {
  const { online, pending, failedCount, dismissFailures } = useSyncStatus();
  const queryClient = useQueryClient();
  const [reconnected, setReconnected] = useState(false);
  const wasOnline = useRef(online);

  useEffect(() => {
    const previous = wasOnline.current;
    wasOnline.current = online;
    if (previous || !online) return;

    setReconnected(true);
    void queryClient.invalidateQueries({ queryKey: ["tech-work-orders"] });
    void queryClient.invalidateQueries({ queryKey: ["tech-work-order"] });
    void queryClient.invalidateQueries({ queryKey: ["tech-materials"] });
    void queryClient.invalidateQueries({ queryKey: ["tech-attachments"] });
    const timeout = window.setTimeout(() => setReconnected(false), 4000);
    return () => window.clearTimeout(timeout);
  }, [online, queryClient]);

  if (!online) {
    return (
      <div
        role="status"
        className="border-b border-warning/30 bg-warning-soft px-4 py-2 text-warning-strong"
      >
        <p className="text-small mx-auto flex max-w-xl items-start gap-2 font-medium">
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Sin conexión. No se pueden guardar cambios hasta reconectar.
        </p>
      </div>
    );
  }

  if (failedCount > 0) {
    return (
      <div
        role="alert"
        className="border-b border-danger/30 bg-danger-soft px-4 py-2 text-danger-strong"
      >
        <div className="mx-auto flex max-w-xl items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="text-small min-w-0 flex-1 py-2 font-medium">
            {failedCount === 1
              ? "1 cambio no se guardó. Revisá el detalle."
              : `${failedCount} cambios no se guardaron. Revisá el detalle.`}
          </p>
          <button
            type="button"
            onClick={dismissFailures}
            className="text-caption -my-1 inline-flex min-h-11 shrink-0 items-center rounded-ds-sm px-2 font-semibold underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Ocultar
          </button>
        </div>
      </div>
    );
  }

  if (reconnected) {
    return (
      <div
        role="status"
        className="border-b border-success/30 bg-success-soft px-4 py-2 text-success-strong"
      >
        <p className="text-small mx-auto flex max-w-xl items-center gap-2 font-medium">
          <RefreshCw className="h-4 w-4 shrink-0" aria-hidden="true" />
          Conexión restablecida. Actualizando datos…
        </p>
      </div>
    );
  }

  if (pending > 0) {
    return (
      <div
        role="status"
        className="border-b border-info/20 bg-info-soft px-4 py-2 text-info-strong"
      >
        <p className="text-small mx-auto flex max-w-xl items-center gap-2 font-medium">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
          {pending === 1 ? "1 cambio pendiente" : `${pending} cambios pendientes`}. Esperá la
          confirmación del servidor.
        </p>
      </div>
    );
  }

  return null;
}
