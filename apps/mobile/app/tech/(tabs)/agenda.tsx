import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo } from "react";
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
import { dayKey, formatTime, relativeDayLabel } from "@/src/lib/format";
import { workOrderStatusMeta } from "@/src/lib/status";
import type { TechWorkOrder } from "@/src/lib/types";
import { colors, spacing, typography } from "@/src/theme/tokens";

type DayGroup = { key: string; label: string; items: TechWorkOrder[] };

function byScheduledAt(a: TechWorkOrder, b: TechWorkOrder) {
  return new Date(a.scheduled_at ?? 0).getTime() - new Date(b.scheduled_at ?? 0).getTime();
}

export default function TechAgendaScreen() {
  const { techSession } = useAuth();
  const router = useRouter();
  const tenantId = techSession?.tenantId ?? "";

  const query = useQuery({
    queryKey: ["tech-jobs", tenantId, ""],
    queryFn: () => api.techWorkOrders(tenantId),
    enabled: Boolean(tenantId),
  });

  const orders = query.data?.items ?? [];

  const groups = useMemo<DayGroup[]>(() => {
    const scheduled = orders
      .filter((order) => order.scheduled_at !== null && order.operational_status !== "cancelled")
      .sort(byScheduledAt);
    const map = new Map<string, TechWorkOrder[]>();
    for (const order of scheduled) {
      const key = dayKey(order.scheduled_at ?? new Date());
      const list = map.get(key) ?? [];
      list.push(order);
      map.set(key, list);
    }
    return Array.from(map.entries()).map(([key, items]) => ({
      key,
      label: items[0]?.scheduled_at ? relativeDayLabel(items[0].scheduled_at) : key,
      items,
    }));
  }, [orders]);

  const unscheduled = orders.filter(
    (order) =>
      order.scheduled_at === null &&
      order.operational_status !== "finished" &&
      order.operational_status !== "cancelled",
  );

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
        eyebrow="Agenda"
        title="Tus visitas"
        subtitle="Ordenadas por día, con horario y cliente."
        right={<SyncStatusPill />}
      />

      <SyncStatusBanner />

      {query.isLoading ? <SkeletonList count={3} /> : null}

      {query.isError ? (
        <ErrorState
          message="No pudimos cargar tu agenda. Revisá la conexión e intentá de nuevo."
          onRetry={() => void query.refetch()}
        />
      ) : null}

      {!query.isLoading && !query.isError && groups.length === 0 && unscheduled.length === 0 ? (
        <Card>
          <EmptyState
            icon="calendar-outline"
            title="No hay visitas agendadas"
            description="Cuando tu empresa programe un trabajo, aparece acá con fecha y horario."
            action={
              <Button
                title="Ver trabajos"
                variant="outline"
                icon="construct-outline"
                onPress={() => router.navigate("/tech/jobs")}
              />
            }
          />
        </Card>
      ) : null}

      {groups.map((group) => (
        <View key={group.key} style={styles.group}>
          <View style={styles.groupHeader}>
            <SectionTitle>{group.label}</SectionTitle>
            <Text style={styles.groupCount}>
              {group.items.length} visita{group.items.length === 1 ? "" : "s"}
            </Text>
          </View>
          <Card>
            {group.items.map((order, index) => {
              const meta = workOrderStatusMeta(order.operational_status);
              return (
                <ListRow
                  key={order.id}
                  title={order.title}
                  subtitle={order.customer_name ?? "Cliente"}
                  meta={`${formatTime(order.scheduled_at)} · ${order.code}`}
                  right={<Badge label={meta.label} tone={meta.tone} />}
                  onPress={() => openJob(order)}
                  last={index === group.items.length - 1}
                />
              );
            })}
          </Card>
        </View>
      ))}

      {unscheduled.length > 0 ? (
        <View style={styles.group}>
          <SectionTitle>Sin programar</SectionTitle>
          <Card>
            <View style={styles.notice}>
              <Ionicons name="information-circle-outline" size={16} color={colors.text2} />
              <Muted>Tu empresa todavía no les asignó fecha. Podés consultarlas igual.</Muted>
            </View>
            {unscheduled.map((order, index) => {
              const meta = workOrderStatusMeta(order.operational_status);
              return (
                <ListRow
                  key={order.id}
                  title={order.title}
                  subtitle={order.customer_name ?? "Cliente"}
                  meta={order.code}
                  right={<Badge label={meta.label} tone={meta.tone} />}
                  onPress={() => openJob(order)}
                  last={index === unscheduled.length - 1}
                />
              );
            })}
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing[2] },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  groupCount: { ...typography.caption, color: colors.text2 },
  notice: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
});