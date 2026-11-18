import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Redirect, useRouter } from "expo-router";
import { RefreshControl, StyleSheet, Text, View } from "react-native";

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
import {
  formatCurrency,
  formatDateTime,
  formatTime,
  greeting,
  isFuture,
  relativeDayLabel,
  todayLabel,
} from "@/src/lib/format";
import { appointmentStatusMeta, paymentStatusMeta, workOrderStatusMeta } from "@/src/lib/status";
import type { PortalSession } from "@/src/lib/types";
import { colors, spacing, typography } from "@/src/theme/tokens";

const activeStatuses = new Set(["new", "scheduled", "in_progress", "waiting"]);

export default function CustomerHomeScreen() {
  const { customerSession } = useAuth();
  if (!customerSession) return <Redirect href="/customer" />;
  return <CustomerHome session={customerSession} />;
}

function CustomerHome({ session }: { session: PortalSession }) {
  const router = useRouter();

  const summary = useQuery({
    queryKey: ["portal-summary", session.tenantSlug],
    queryFn: () => api.portalSummary(session),
  });
  const orders = useQuery({
    queryKey: ["portal-orders", session.tenantSlug],
    queryFn: () => api.portalOrders(session),
  });
  const quotes = useQuery({
    queryKey: ["portal-quotes", session.tenantSlug],
    queryFn: () => api.portalQuotes(session),
  });
  const appointments = useQuery({
    queryKey: ["portal-appointments", session.tenantSlug],
    queryFn: () => api.portalAppointments(session),
  });
  const payments = useQuery({
    queryKey: ["portal-payments", session.tenantSlug],
    queryFn: () => api.portalPayments(session),
  });

  const loading = summary.isLoading || orders.isLoading || quotes.isLoading;
  const hasError = summary.isError || orders.isError;
  const refreshing =
    summary.isRefetching ||
    orders.isRefetching ||
    quotes.isRefetching ||
    payments.isRefetching;

  const orderList = orders.data ?? [];
  const activeOrder = orderList.find((order) => activeStatuses.has(order.operational_status)) ?? null;
  const pendingQuotes = (quotes.data ?? []).filter((quote) => quote.status === "sent");
  const nextAppointment =
    (appointments.data ?? [])
      .filter((appointment) => appointment.status === "scheduled" && isFuture(appointment.starts_at))
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0] ?? null;
  const recentOrders = [...orderList]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  const paymentList = payments.data ?? [];
  const lastPayment = [...paymentList].sort(
    (a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime(),
  )[0];
  const registeredTotal = paymentList
    .filter((payment) => payment.status === "registered")
    .reduce((total, payment) => {
      const amount = Number(payment.amount);
      return Number.isFinite(amount) ? total + amount : total;
    }, 0);

  const firstName = session.customer.name.split(" ")[0] ?? session.customer.name;

  const refreshAll = () => {
    void summary.refetch();
    void orders.refetch();
    void quotes.refetch();
    void appointments.refetch();
    void payments.refetch();
  };

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refreshAll}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <ScreenHeader
        eyebrow="Cliente"
        title={`${greeting()}, ${firstName}`}
        subtitle={`${session.tenant.name} · ${todayLabel()}`}
      />

      <Button
        title="Pedir un servicio"
        icon="add"
        onPress={() => router.push("/customer/request")}
      />

      {loading ? <SkeletonList count={2} /> : null}

      {hasError ? (
        <ErrorState
          message="No pudimos cargar tu información. Revisá la conexión e intentá de nuevo."
          onRetry={refreshAll}
        />
      ) : null}

      {!loading && !hasError ? (
        <>
          {activeOrder ? (
            <Card>
              <View style={styles.cardTop}>
                <SectionTitle>Tu trabajo</SectionTitle>
                <Badge
                  label={workOrderStatusMeta(activeOrder.operational_status).label}
                  tone={workOrderStatusMeta(activeOrder.operational_status).tone}
                  icon={workOrderStatusMeta(activeOrder.operational_status).icon}
                />
              </View>
              <Text style={styles.title}>{activeOrder.title}</Text>
              <Text style={styles.code}>{activeOrder.code}</Text>
              <Muted>
                {activeOrder.scheduled_at
                  ? `Programado para ${formatDateTime(activeOrder.scheduled_at)}`
                  : "Todavía sin fecha programada"}
              </Muted>
              <Button
                title="Ver detalle del trabajo"
                variant="outline"
                icon="arrow-forward"
                onPress={() =>
                  router.push({
                    pathname: "/customer/order/[id]",
                    params: { id: activeOrder.id },
                  })
                }
              />
            </Card>
          ) : (
            <Card>
              <EmptyState
                icon="checkmark-done-circle-outline"
                title="No tenés trabajos en curso"
                description="Cuando pidas un servicio, vas a poder seguir el estado desde acá."
              />
            </Card>
          )}

          {nextAppointment ? (
            <Card>
              <View style={styles.cardTop}>
                <SectionTitle>Próxima visita</SectionTitle>
                <Badge
                  label={appointmentStatusMeta(nextAppointment.status).label}
                  tone={appointmentStatusMeta(nextAppointment.status).tone}
                />
              </View>
              <View style={styles.appointmentRow}>
                <View style={styles.dateBadge}>
                  <Text style={styles.dateDay}>
                    {new Date(nextAppointment.starts_at).toLocaleDateString("es-AR", {
                      day: "2-digit",
                    })}
                  </Text>
                  <Text style={styles.dateMonth}>
                    {new Date(nextAppointment.starts_at)
                      .toLocaleDateString("es-AR", { month: "short" })
                      .replace(".", "")}
                  </Text>
                </View>
                <View style={styles.appointmentText}>
                  <Text style={styles.title}>
                    {relativeDayLabel(nextAppointment.starts_at)} ·{" "}
                    {formatTime(nextAppointment.starts_at)}
                  </Text>
                  <Muted>
                    {nextAppointment.order_title ?? "Visita técnica"}
                    {nextAppointment.technician_name
                      ? ` · ${nextAppointment.technician_name}`
                      : ""}
                  </Muted>
                </View>
              </View>
            </Card>
          ) : null}

          {pendingQuotes.length > 0 ? (
            <Card>
              <View style={styles.cardTop}>
                <SectionTitle>Presupuestos para responder</SectionTitle>
                <Badge label={`${pendingQuotes.length}`} tone="warning" />
              </View>
              {pendingQuotes.slice(0, 2).map((quote) => (
                <ListRow
                  key={quote.id}
                  icon="document-text-outline"
                  title={quote.number}
                  subtitle={formatCurrency(quote.total)}
                  meta={
                    quote.valid_until
                      ? `Válido hasta ${new Date(quote.valid_until).toLocaleDateString("es-AR")}`
                      : undefined
                  }
                  right={<Badge label="Pendiente" tone="warning" />}
                />
              ))}
              <Button
                title="Revisar presupuestos"
                variant="outline"
                icon="receipt-outline"
                onPress={() => router.navigate("/customer/quotes")}
              />
            </Card>
          ) : null}

          {paymentList.length > 0 ? (
            <Card>
              <View style={styles.cardTop}>
                <SectionTitle>Pagos</SectionTitle>
                {lastPayment ? (
                  <Badge
                    label={paymentStatusMeta(lastPayment.status).label}
                    tone={paymentStatusMeta(lastPayment.status).tone}
                  />
                ) : null}
              </View>
              <Text style={styles.total}>{formatCurrency(registeredTotal)}</Text>
              <Muted>
                {lastPayment
                  ? `Último pago: ${formatCurrency(lastPayment.amount)} · ${formatDateTime(lastPayment.paid_at)}`
                  : "Todavía no hay pagos registrados."}
              </Muted>
              <Button
                title="Ver pagos"
                variant="outline"
                icon="card-outline"
                onPress={() =>
                  router.navigate({
                    pathname: "/customer/services",
                    params: { tab: "payments" },
                  })
                }
              />
            </Card>
          ) : null}

          {summary.data && summary.data.open_requests > 0 ? (
            <Card>
              <View style={styles.infoRow}>
                <Ionicons name="mail-unread-outline" size={18} color={colors.primary} />
                <Muted>
                  Tenés {summary.data.open_requests} solicitud
                  {summary.data.open_requests === 1 ? "" : "es"} en revisión por la empresa.
                </Muted>
              </View>
              <Button
                title="Ver mis solicitudes"
                variant="ghost"
                size="sm"
                onPress={() => router.navigate("/customer/services")}
              />
            </Card>
          ) : null}

          <View style={styles.section}>
            <SectionTitle>Historial reciente</SectionTitle>
            {recentOrders.length === 0 ? (
              <Card>
                <Muted>Cuando tengas trabajos, aparecen acá.</Muted>
              </Card>
            ) : (
              <Card>
                {recentOrders.map((order, index) => (
                  <ListRow
                    key={order.id}
                    title={order.title}
                    subtitle={order.code}
                    meta={formatDateTime(order.created_at)}
                    right={
                      <Badge
                        label={workOrderStatusMeta(order.operational_status).label}
                        tone={workOrderStatusMeta(order.operational_status).tone}
                      />
                    }
                    onPress={() =>
                      router.push({
                        pathname: "/customer/order/[id]",
                        params: { id: order.id },
                      })
                    }
                    last={index === recentOrders.length - 1}
                  />
                ))}
              </Card>
            )}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[2],
  },
  title: { ...typography.bodyStrong, color: colors.text, flex: 1 },
  code: { ...typography.mono, color: colors.text2 },
  appointmentRow: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  dateBadge: {
    width: 56,
    paddingVertical: spacing[2],
    borderRadius: spacing[3],
    backgroundColor: colors.primarySoft,
    alignItems: "center",
  },
  dateDay: { ...typography.title, color: colors.primaryDark },
  dateMonth: { ...typography.caption, color: colors.primaryDark },
  appointmentText: { flex: 1, gap: 2 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  section: { gap: spacing[2] },
  total: { ...typography.title, color: colors.text },
});