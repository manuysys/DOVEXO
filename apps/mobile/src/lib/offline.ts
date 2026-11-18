import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

import { api, ApiError } from "@/src/lib/api";

export type PendingAction =
  | {
      id: string;
      type: "note";
      orderId: string;
      notes: string;
      createdAt: string;
      attempts?: number;
      lastError?: string;
    }
  | {
      id: string;
      type: "material";
      orderId: string;
      description: string;
      quantity: string;
      unit: string;
      createdAt: string;
      attempts?: number;
      lastError?: string;
    }
  | {
      id: string;
      type: "photo";
      orderId: string;
      uri: string;
      name: string;
      mimeType: string;
      createdAt: string;
      attempts?: number;
      lastError?: string;
    };

export type FlushResult = {
  /** Acciones enviadas y confirmadas por el servidor. */
  sent: number;
  /** Acciones que siguen en la cola esperando red. */
  pending: number;
  /** Acciones rechazadas por el servidor: reintentar no las va a resolver. */
  failed: number;
};

function key(tenantId: string) {
  return `dovexo.offline.${tenantId}`;
}

export async function getPendingActions(tenantId: string): Promise<PendingAction[]> {
  const raw = await AsyncStorage.getItem(key(tenantId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as PendingAction[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function savePendingActions(tenantId: string, actions: PendingAction[]) {
  await AsyncStorage.setItem(key(tenantId), JSON.stringify(actions));
}

export async function enqueueAction(tenantId: string, action: PendingAction) {
  const actions = await getPendingActions(tenantId);
  actions.push(action);
  await savePendingActions(tenantId, actions);
}

export async function pendingCount(tenantId: string) {
  return (await getPendingActions(tenantId)).length;
}

export async function removeAction(tenantId: string, actionId: string): Promise<PendingAction[]> {
  const actions = await getPendingActions(tenantId);
  const next = actions.filter((action) => action.id !== actionId);
  await savePendingActions(tenantId, next);
  return next;
}

/**
 * Un error se puede reintentar si es de red, del servidor o de límite de
 * peticiones. Un 4xx de validación no se resuelve reintentando: se informa.
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status >= 500 || error.status === 408 || error.status === 429;
  }
  return true;
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return "No pudimos completar la operación.";
}

export function hasPermanentFailure(action: PendingAction): boolean {
  return Boolean(action.lastError);
}

async function sendAction(action: PendingAction, tenantId: string) {
  if (action.type === "note") {
    await api.techNote(tenantId, action.orderId, action.notes, action.id);
    return;
  }
  if (action.type === "material") {
    await api.techCreateMaterial(
      tenantId,
      action.orderId,
      {
        description: action.description,
        quantity: action.quantity,
        unit: action.unit,
      },
      action.id,
    );
    return;
  }
  await api.techUploadAttachment(
    tenantId,
    action.orderId,
    { uri: action.uri, name: action.name, type: action.mimeType },
    action.id,
  );
  await FileSystem.deleteAsync(action.uri, { idempotent: true }).catch(() => undefined);
}

/**
 * Intenta enviar la cola completa.
 *
 * - Error de red o 5xx: la acción queda pendiente para el próximo intento.
 * - Error 4xx: la acción queda marcada con `lastError` para que la interfaz
 *   muestre el fallo real en lugar de un éxito falso.
 * - El orden se conserva: si una acción falla por red, se corta el envío para
 *   no adelantar acciones posteriores de la misma orden.
 */
export async function flushPendingActions(tenantId: string): Promise<FlushResult> {
  const actions = await getPendingActions(tenantId);
  if (actions.length === 0) return { sent: 0, pending: 0, failed: 0 };

  const remaining: PendingAction[] = [];
  let sent = 0;
  let stopped = false;

  for (const action of actions) {
    if (stopped) {
      remaining.push(action);
      continue;
    }
    try {
      await sendAction(action, tenantId);
      sent += 1;
    } catch (error) {
      const retryable = isRetryableError(error);
      remaining.push({
        ...action,
        attempts: (action.attempts ?? 0) + 1,
        lastError: retryable ? action.lastError : errorMessage(error),
      });
      if (retryable) stopped = true;
    }
  }

  await savePendingActions(tenantId, remaining);
  return {
    sent,
    pending: remaining.filter((action) => !action.lastError).length,
    failed: remaining.filter((action) => Boolean(action.lastError)).length,
  };
}