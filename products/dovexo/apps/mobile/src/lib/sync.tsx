import NetInfo from "@react-native-community/netinfo";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";

import { useAuth } from "@/src/lib/auth";
import {
  flushPendingActions,
  getPendingActions,
  removeAction,
  type FlushResult,
  type PendingAction,
} from "@/src/lib/offline";

/**
 * Estado real de sincronización. La interfaz nunca muestra "listo" antes de
 * que el servidor confirme: `pending` y `failed` salen de la cola persistida.
 */
export type SyncPhase = "offline" | "syncing" | "pending" | "failed" | "synced";

type SyncContextValue = {
  online: boolean;
  phase: SyncPhase;
  syncing: boolean;
  pending: number;
  failed: number;
  lastSyncedAt: string | null;
  error: string | null;
  actions: PendingAction[];
  actionsForOrder: (orderId: string) => PendingAction[];
  pendingForOrder: (orderId: string) => number;
  failedForOrder: (orderId: string) => number;
  refresh: () => Promise<void>;
  sync: () => Promise<FlushResult | null>;
  discard: (actionId: string) => Promise<void>;
};

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const { techSession } = useAuth();
  const tenantId = techSession?.tenantId ?? null;

  const [online, setOnline] = useState(true);
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const syncingRef = useRef(false);
  const wasOfflineRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!tenantId) {
      setActions([]);
      return;
    }
    try {
      setActions(await getPendingActions(tenantId));
    } catch {
      setActions([]);
    }
  }, [tenantId]);

  const sync = useCallback(async (): Promise<FlushResult | null> => {
    if (!tenantId) return null;
    if (syncingRef.current) return null;
    if (!online) {
      setError("Sin conexión. Los cambios quedan guardados en el teléfono.");
      return null;
    }

    syncingRef.current = true;
    setSyncing(true);
    setError(null);
    try {
      const result = await flushPendingActions(tenantId);
      setActions(await getPendingActions(tenantId));
      if (result.sent > 0) setLastSyncedAt(new Date().toISOString());
      if (result.failed > 0) {
        setError(
          result.failed === 1
            ? "Un cambio no se pudo sincronizar. Revisá el detalle del trabajo."
            : `${result.failed} cambios no se pudieron sincronizar. Revisá el detalle del trabajo.`,
        );
      }
      return result;
    } catch {
      setError("No pudimos sincronizar. Vamos a reintentar cuando vuelva la conexión.");
      return null;
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [online, tenantId]);

  const discard = useCallback(
    async (actionId: string) => {
      if (!tenantId) return;
      try {
        setActions(await removeAction(tenantId, actionId));
      } catch {
        setError("No pudimos descartar el cambio.");
      }
    },
    [tenantId],
  );

  // Estado de red: `isConnected` y `isInternetReachable` pueden venir en null.
  useEffect(() => {
    const apply = (connected: boolean | null, reachable: boolean | null) => {
      setOnline(connected !== false && reachable !== false);
    };
    const unsubscribe = NetInfo.addEventListener((state) => {
      apply(state.isConnected, state.isInternetReachable);
    });
    NetInfo.fetch()
      .then((state) => apply(state.isConnected, state.isInternetReachable))
      .catch(() => undefined);
    return unsubscribe;
  }, []);

  // Cargar la cola cuando cambia el tenant o la sesión.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Al volver la conexión, intentar la cola una sola vez por transición.
  useEffect(() => {
    if (!online) {
      wasOfflineRef.current = true;
      return;
    }
    if (wasOfflineRef.current) {
      wasOfflineRef.current = false;
      void sync();
    }
  }, [online, sync]);

  // Al volver la app al frente, refrescar la cola y reintentar si hay red.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      void refresh().then(() => {
        if (online) void sync();
      });
    });
    return () => subscription.remove();
  }, [online, refresh, sync]);

  const pending = actions.filter((action) => !action.lastError).length;
  const failed = actions.filter((action) => Boolean(action.lastError)).length;

  const phase: SyncPhase = !online
    ? "offline"
    : syncing
      ? "syncing"
      : failed > 0
        ? "failed"
        : pending > 0
          ? "pending"
          : "synced";

  const value = useMemo<SyncContextValue>(
    () => ({
      online,
      phase,
      syncing,
      pending,
      failed,
      lastSyncedAt,
      error,
      actions,
      actionsForOrder: (orderId: string) => actions.filter((action) => action.orderId === orderId),
      pendingForOrder: (orderId: string) =>
        actions.filter((action) => action.orderId === orderId && !action.lastError).length,
      failedForOrder: (orderId: string) =>
        actions.filter((action) => action.orderId === orderId && Boolean(action.lastError)).length,
      refresh,
      sync,
      discard,
    }),
    [
      online,
      phase,
      syncing,
      pending,
      failed,
      lastSyncedAt,
      error,
      actions,
      refresh,
      sync,
      discard,
    ],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSync debe usarse dentro de SyncProvider");
  }
  return context;
}