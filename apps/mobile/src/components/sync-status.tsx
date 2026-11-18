import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Button, Divider, InlineNotice, ListRow, SectionTitle } from "@/src/components/ui";
import { formatDateTime } from "@/src/lib/format";
import { useSync, type SyncPhase } from "@/src/lib/sync";
import type { PendingAction } from "@/src/lib/offline";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

const phaseMeta: Record<SyncPhase, { label: string; color: string; background: string }> = {
  synced: { label: "Sincronizado", color: colors.successInk, background: colors.successSoft },
  pending: { label: "Cambios pendientes", color: colors.warningInk, background: colors.warningSoft },
  syncing: { label: "Sincronizando", color: colors.primaryDark, background: colors.primarySoft },
  failed: { label: "Sin sincronizar", color: colors.dangerInk, background: colors.dangerSoft },
  offline: { label: "Sin conexión", color: colors.warningInk, background: colors.warningSoft },
};

const actionLabels: Record<PendingAction["type"], string> = {
  note: "Nota",
  material: "Material",
  photo: "Foto",
};

export function SyncStatusPill({ showWhenSynced = false }: { showWhenSynced?: boolean }) {
  const { phase, pending, failed } = useSync();
  if (phase === "synced" && !showWhenSynced) return null;

  const meta = phaseMeta[phase];
  const label =
    phase === "pending" && pending > 0
      ? `${pending} pendiente${pending === 1 ? "" : "s"}`
      : phase === "failed" && failed > 0
        ? `${failed} con error`
        : meta.label;

  return (
    <View
      style={[styles.pill, { backgroundColor: meta.background }]}
      accessibilityLabel={`Estado de sincronización: ${label}`}
    >
      <View style={[styles.dot, { backgroundColor: meta.color }]} />
      <Text style={[styles.pillText, { color: meta.color }]}>{label}</Text>
    </View>
  );
}

/**
 * Aviso de sincronización. No muestra éxito antes de que el servidor confirme:
 * el estado "Sincronizado" solo aparece cuando la cola quedó vacía.
 */
export function SyncStatusBanner() {
  const { phase, pending, failed, error, sync, syncing } = useSync();

  if (phase === "offline") {
    return (
      <InlineNotice
        tone="warning"
        title="Sin conexión"
        message={
          pending > 0
            ? `Tenés ${pending} cambio${pending === 1 ? "" : "s"} guardado${pending === 1 ? "" : "s"} en el teléfono. Se envían solos al volver la red.`
            : "Podés seguir trabajando: los cambios se guardan en el teléfono y se envían al volver la red."
        }
      />
    );
  }

  if (phase === "syncing") {
    return (
      <InlineNotice
        tone="info"
        title="Sincronizando"
        message="Estamos enviando los cambios guardados. Esperá unos segundos."
      />
    );
  }

  if (phase === "failed") {
    return (
      <InlineNotice
        tone="danger"
        title="No se pudieron sincronizar todos los cambios"
        message={error ?? "Revisá el detalle del trabajo para ver qué pasó."}
        action={
          <Button
            title="Reintentar"
            variant="outline"
            size="sm"
            icon="refresh"
            onPress={() => void sync()}
            loading={syncing}
          />
        }
      />
    );
  }

  if (phase === "pending") {
    return (
      <InlineNotice
        tone="warning"
        title={`${pending} cambio${pending === 1 ? "" : "s"} sin sincronizar`}
        message="Están guardados en el teléfono. Envialos cuando tengas conexión."
        action={
          <Button
            title="Sincronizar ahora"
            variant="outline"
            size="sm"
            icon="cloud-upload"
            onPress={() => void sync()}
            loading={syncing}
          />
        }
      />
    );
  }

  return null;
}

export function SyncDetailsCard() {
  const { phase, pending, failed, lastSyncedAt, error, actions, sync, syncing, discard } = useSync();
  const meta = phaseMeta[phase];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <SectionTitle>Sincronización</SectionTitle>
        <View style={[styles.pill, { backgroundColor: meta.background }]}>
          <View style={[styles.dot, { backgroundColor: meta.color }]} />
          <Text style={[styles.pillText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>

      <ListRow
        icon="cloud-done-outline"
        title="Última sincronización"
        subtitle={lastSyncedAt ? formatDateTime(lastSyncedAt) : "Todavía no se sincronizó nada"}
      />
      <ListRow
        icon="hourglass-outline"
        title="Cambios pendientes"
        subtitle={
          pending === 0 ? "No hay cambios esperando" : `${pending} esperando conexión`
        }
        last
      />

      {failed > 0 ? (
        <InlineNotice
          tone="danger"
          title={`${failed} cambio${failed === 1 ? "" : "s"} con error`}
          message={error ?? "El servidor rechazó estos cambios."}
        />
      ) : null}

      {actions.length > 0 ? (
        <View style={styles.pendingList}>
          <Divider />
          {actions.map((action) => (
            <View key={action.id} style={styles.pendingRow}>
              <Ionicons
                name={action.lastError ? "alert-circle" : "time-outline"}
                size={16}
                color={action.lastError ? colors.dangerInk : colors.text2}
              />
              <View style={styles.pendingText}>
                <Text style={styles.pendingTitle}>
                  {actionLabels[action.type]} · orden {action.orderId.slice(0, 8)}
                </Text>
                <Text style={styles.pendingMeta}>
                  {action.lastError ?? `Guardado ${formatDateTime(action.createdAt)}`}
                </Text>
              </View>
              {action.lastError ? (
                <Button
                  title="Descartar"
                  variant="ghost"
                  size="sm"
                  onPress={() => void discard(action.id)}
                />
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      <Button
        title={pending + failed === 0 ? "Buscar cambios" : "Sincronizar ahora"}
        variant="outline"
        icon="sync"
        onPress={() => void sync()}
        loading={syncing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: spacing[2] + 2,
    paddingVertical: spacing[1],
  },
  dot: { width: 6, height: 6, borderRadius: radius.pill },
  pillText: { ...typography.caption, fontWeight: "700" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    gap: spacing[2],
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[2],
  },
  pendingList: { gap: spacing[2] },
  pendingRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  pendingText: { flex: 1, gap: 2 },
  pendingTitle: { ...typography.label, color: colors.text },
  pendingMeta: { ...typography.caption, color: colors.text2 },
});