import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { RefreshControl, StyleSheet, Text, View } from "react-native";

import { SyncStatusBanner, SyncStatusPill } from "@/src/components/sync-status";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  ListRow,
  Muted,
  Screen,
  ScreenHeader,
  SectionTitle,
  SkeletonList,
} from "@/src/components/ui";
import { api } from "@/src/lib/api";
import { useAuth } from "@/src/lib/auth";
import { formatTime, greeting, isToday, relativeDayLabel, todayLabel } from "@/src/lib/format";
import { workOrderStatusMeta } from "@/src/lib/status";
import { orderAddress } from "@/src/lib/work-orders";
import type { TechWorkOrder } from "@/src/lib/types";
import { colors, spacing, typography } from "@/src/theme/tokens";

const openStatuses = new Set(["scheduled", "in_progress", "waiting", "new"]);

function byScheduledAt(a: TechWorkOrder, b: TechWorkOrder) {
  return new Date(a.scheduled_at ?? 0).getTime() - new Date(b.scheduled_at ?? 0).getTime();
}


export default function TechHomeScreen() {
  const { techSession } = useAuth();
  const router = useRouter();
  const tenantId = techSession?.tenantId ?? "";
  const tenant = techSession?.tenants.find((item) => item.id === techSession.tenantId);

  const query = useQuery({
    queryKey: ["tech-jobs", tenantId, ""],
    queryFn: () => api.techWorkOrders(tenantId),
    enabled: Boolean(tenantId),
  });

  const orders = query.data?.items ?? [];
  const inProgress = orders.filter(
    (order) => order.operational_status === "in_progress" || order.operational_status === "waiting",
  );
  const upcoming = orders
    .filter(
      (order) =>
        order.scheduled_at !== null &&
        new Date(order.scheduled_at).getTime() >= Date.now() &&
        order.operational_status !== "finished" &&
        order.operational_status !== "cancelled",
    )
    .sort(byScheduledAt);

  const nextJob = inProgress[0] ?? upcoming[0] ?? null;
  const todayJobs = orders
    .filter((order) => order.scheduled_at !== null && isToday(order.scheduled_at))
    .sort(byScheduledAt);
  const pendingJobs = orders.filter((order) => openStatuses.has(order.operational_status)).length;

  const openJob = (order: TechWorkOrder) =>
    router.push({ pathname: "/tech/job/[id]", params: { id: order.id } });

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching}
          onRefresh={() => void query.refetch()}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <ScreenHeader
        eyebrow="Técnico"
        title={greeting()}
        subtitle={`${todayLabel()}${tenant ? ` · ${tenant.name}` : ""}`}
        right={<SyncStatusPill />}
      />

      <SyncStatusBanner />

      {query.isLoading ? <SkeletonList count={3} /> : null}

      {query.isError ? (
        <ErrorState
          message="No pudimos cargar tus trabajos. Revisá la conexión e intentá de nuevo."
          onRetry={() => void query.refetch()}
        />
      ) : null}

      {!query.isLoading && !query.isError ? (
        <>
          {nextJob ? (
            <NextJobCard order={nextJob} onOpen={() => openJob(nextJob)} />
          ) : (
            <Card>
              <EmptyState
                icon="checkmark-done-circle-outline"
                title="No tenés trabajos para ahora"
                description="Cuando tu empresa te asigne una orden, aparece acá con la dirección y el horario."
                action={
                  <Button
                    title="Ver todos los trabajos"
                    variant="outline"
                    icon="list-outline"
                    onPress={() => router.navigate("/tech/jobs")}
                  />
                }
              />
            </Card>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <SectionTitle>Hoy</SectionTitle>
              <Text style={styles.sectionMeta}>
                {todayJobs.length === 0
                  ? "Sin visitas"
                  : `${todayJobs.length} visita${todayJobs.length === 1 ? "" : "s"}`}
              </Text>
            </View>
            {todayJobs.length === 0 ? (
              <Card>
                <Muted>No tenés visitas agendadas para hoy.</Muted>
                <Button
                  title="Ver agenda"
                  variant="ghost"
                  size="sm"
                  icon="calendar-outline"
                  onPress={() => router.navigate("/tech/agenda")}
                />
              </Card>
            ) : (
              <Card>
                {todayJobs.map((order, index) => {
                  const meta = workOrderStatusMeta(order.operational_status);
                  return (
                    <ListRow
                      key={order.id}
                      title={order.title}
                      subtitle={order.customer_name ?? "Cliente"}
                      meta={`${formatTime(order.scheduled_at)} · ${order.code}`}
                      right={<Badge label={meta.label} tone={meta.tone} />}
                      onPress={() => openJob(order)}
                      last={index === todayJobs.length - 1}
                    />
                  );
                })}
              </Card>
            )}
          </View>

          <Card>
            <SectionTitle>Pendientes</SectionTitle>
            <View style={styles.pendingRow}>
              <Text style={styles.pendingNumber}>{pendingJobs}</Text>
              <Muted>
                {pendingJobs === 1
                  ? "trabajo asignado sin cerrar"
                  : "trabajos asignados sin cerrar"}
              </Muted>
            </View>
            <View style={styles.actions}>
              <Button
                title="Trabajos"
                variant="outline"
                icon="construct-outline"
                onPress={() => router.navigate("/tech/jobs")}
                style={styles.action}
              />
              <Button
                title="Agenda"
                variant="outline"
                icon="calendar-outline"
                onPress={() => router.navigate("/tech/agenda")}
                style={styles.action}
              />
            </View>
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function NextJobCard({ order, onOpen }: { order: TechWorkOrder; onOpen: () => void }) {
  const meta = workOrderStatusMeta(order.operational_status);
  const address = orderAddress(order);
  const when = order.scheduled_at
    ? `${relativeDayLabel(order.scheduled_at)} · ${formatTime(order.scheduled_at)}`
    : "Sin programar";

  return (
    <Card style={styles.nextCard}>
      <View style={styles.cardTop}>
        <Text style={styles.overline}>Próximo trabajo</Text>
        <Badge label={meta.label} tone={meta.tone} icon={meta.icon} />
      </View>
      <Text style={styles.jobTitle}>{order.title}</Text>
      <Text style={styles.customer}>{order.customer_name ?? "Cliente"}</Text>
      <View style={styles.metaRow}>
        <Ionicons name="time-outline" size={16} color={colors.text2} />
        <Text style={styles.metaText}>{when}</Text>
      </View>
      <View style={styles.metaRow}>
        <Ionicons name="location-outline" size={16} color={colors.text2} />
        <Text style={styles.metaText} numberOfLines={2}>
          {address || "Sin dirección cargada"}
        </Text>
      </View>
      <Button title="Abrir trabajo" icon="arrow-forward" onPress={onOpen} />
    </Card>
  );
}

const styles = StyleSheet.create({
  nextCard: { borderColor: colors.primary, borderWidth: 1 },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[2],
  },
  overline: { ...typography.overline, color: colors.primary },
  jobTitle: { ...typography.title, color: colors.text },
  customer: { ...typography.bodyStrong, color: colors.text },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  metaText: { ...typography.label, fontWeight: "400", color: colors.text2, flex: 1 },
  section: { gap: spacing[2] },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionMeta: { ...typography.caption, color: colors.text2 },
  pendingRow: { flexDirection: "row", alignItems: "baseline", gap: spacing[2] },
  pendingNumber: { ...typography.display, color: colors.text },
  actions: { flexDirection: "row", gap: spacing[2] },
  action: { flex: 1 },
});