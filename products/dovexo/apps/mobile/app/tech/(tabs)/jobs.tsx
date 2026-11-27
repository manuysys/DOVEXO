import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { SyncStatusBanner } from "@/src/components/sync-status";
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Muted,
  Screen,
  ScreenHeader,
  SkeletonCard,
} from "@/src/components/ui";
import { api } from "@/src/lib/api";
import { useAuth } from "@/src/lib/auth";
import { formatTime, relativeDayLabel } from "@/src/lib/format";
import { workOrderFilters, workOrderStatusMeta } from "@/src/lib/status";
import type { TechWorkOrder } from "@/src/lib/types";
import { orderAddress } from "@/src/lib/work-orders";
import { colors, spacing, typography } from "@/src/theme/tokens";

export default function TechJobsScreen() {
  const { techSession } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState("");
  const tenantId = techSession?.tenantId ?? "";

  const query = useQuery({
    queryKey: ["tech-jobs", tenantId, filter],
    queryFn: () => api.techWorkOrders(tenantId, filter || undefined),
    enabled: Boolean(tenantId),
  });

  const orders = query.data?.items ?? [];

  const openJob = (order: TechWorkOrder) =>
    router.push({ pathname: "/tech/job/[id]", params: { id: order.id } });

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.top}>
        <ScreenHeader
          eyebrow="Trabajos"
          title="Mis trabajos"
          subtitle="Tocá una orden para ver el detalle, cargar materiales o sumar fotos."
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {workOrderFilters.map((item) => (
            <Chip
              key={item.value || "all"}
              label={item.label}
              selected={filter === item.value}
              onPress={() => setFilter(item.value)}
            />
          ))}
        </ScrollView>
        <SyncStatusBanner />
      </View>

      {query.isLoading ? (
        <View style={styles.list}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : null}

      {query.isError ? (
        <View style={styles.list}>
          <ErrorState
            message="No pudimos cargar tus trabajos. Revisá la conexión e intentá de nuevo."
            onRetry={() => void query.refetch()}
          />
        </View>
      ) : null}

      {!query.isLoading && !query.isError ? (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => void query.refetch()}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <Card>
              <EmptyState
                icon="construct-outline"
                title={
                  filter
                    ? "No hay trabajos en este estado"
                    : "Todavía no tenés trabajos asignados"
                }
                description={
                  filter
                    ? "Probá con otro filtro para ver el resto de tus órdenes."
                    : "Cuando tu empresa te asigne una orden, aparece en esta lista."
                }
                action={
                  filter ? (
                    <Button
                      title="Ver todas"
                      variant="outline"
                      onPress={() => setFilter("")}
                    />
                  ) : undefined
                }
              />
            </Card>
          }
          renderItem={({ item }) => <JobCard order={item} onOpen={() => openJob(item)} />}
        />
      ) : null}
    </Screen>
  );
}

function JobCard({ order, onOpen }: { order: TechWorkOrder; onOpen: () => void }) {
  const meta = workOrderStatusMeta(order.operational_status);
  const address = orderAddress(order);
  const when = order.scheduled_at
    ? `${relativeDayLabel(order.scheduled_at)} · ${formatTime(order.scheduled_at)}`
    : "Sin programar";

  return (
    <Card onPress={onOpen} accessibilityLabel={`Abrir ${order.title}`}>
      <View style={styles.cardTop}>
        <Badge label={meta.label} tone={meta.tone} icon={meta.icon} />
        <Text style={styles.code}>{order.code}</Text>
      </View>
      <Text style={styles.jobTitle} numberOfLines={2}>
        {order.title}
      </Text>
      <Muted>{order.customer_name ?? "Cliente"}</Muted>
      <View style={styles.metaRow}>
        <Ionicons name="time-outline" size={15} color={colors.text2} />
        <Text style={styles.metaText}>{when}</Text>
      </View>
      {address ? (
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={15} color={colors.text2} />
          <Text style={styles.metaText} numberOfLines={1}>
            {address}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: spacing[4], paddingTop: spacing[4], gap: spacing[3] },
  filters: { gap: spacing[2], paddingVertical: spacing[1] },
  list: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[10],
    gap: spacing[3],
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[2],
  },
  code: { ...typography.mono, color: colors.text2 },
  jobTitle: { ...typography.bodyStrong, color: colors.text },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  metaText: { ...typography.caption, color: colors.text2, flex: 1 },
});