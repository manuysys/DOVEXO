import { useQuery } from "@tanstack/react-query";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";

import {
  Badge,
  Button,
  Card,
  Chip,
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
import { formatCurrency, formatDateTime, formatTime, relativeDayLabel } from "@/src/lib/format";
import {
  appointmentStatusMeta,
  paymentMethods,
  paymentStatusMeta,
  requestStatusMeta,
  workOrderStatusMeta,
} from "@/src/lib/status";
import type { PortalSession } from "@/src/lib/types";
import { colors, spacing, typography } from "@/src/theme/tokens";

const TAB_VALUES = ["orders", "requests", "appointments", "payments"] as const;

type Tab = (typeof TAB_VALUES)[number];

const tabs: { value: Tab; label: string }[] = [
  { value: "orders", label: "Trabajos" },
  { value: "requests", label: "Solicitudes" },
  { value: "appointments", label: "Turnos" },
  { value: "payments", label: "Pagos" },
];

function isTab(value: string | undefined): value is Tab {
  return value !== undefined && (TAB_VALUES as readonly string[]).includes(value);
}

export default function CustomerServicesScreen() {
  const { customerSession } = useAuth();
  if (!customerSession) return <Redirect href="/customer" />;
  return <Services session={customerSession} />;
}

function Services({ session }: { session: PortalSession }) {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(isTab(params.tab) ? params.tab : "orders");

  // Permite abrir una pestaña puntual desde otra pantalla (por ejemplo, "Pagos").
  useEffect(() => {
    if (isTab(params.tab)) setTab(params.tab);
  }, [params.tab]);

  const orders = useQuery({
    queryKey: ["portal-orders", session.tenantSlug],
    queryFn: () => api.portalOrders(session),
  });
  const requests = useQuery({
    queryKey: ["portal-requests", session.tenantSlug],
    queryFn: () => api.portalRequests(session),
  });
  const appointments = useQuery({
    queryKey: ["portal-appointments", session.tenantSlug],
    queryFn: () => api.portalAppointments(session),
  });
  const payments = useQuery({
    queryKey: ["portal-payments", session.tenantSlug],
    queryFn: () => api.portalPayments(session),
  });

  const current =
    tab === "orders"
      ? orders
      : tab === "requests"
        ? requests
        : tab === "payments"
          ? payments
          : appointments;

  const paymentList = payments.data ?? [];
  const sortedPayments = [...paymentList].sort(
    (a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime(),
  );
  const registeredTotal = paymentList
    .filter((payment) => payment.status === "registered")
    .reduce((total, payment) => {
      const amount = Number(payment.amount);
      return Number.isFinite(amount) ? total + amount : total;
    }, 0);

  const refreshAll = () => {
    void orders.refetch();
    void requests.refetch();
    void appointments.refetch();
    void payments.refetch();
  };

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={
            orders.isRefetching ||
            requests.isRefetching ||
            appointments.isRefetching ||
            payments.isRefetching
          }
          onRefresh={refreshAll}
        />
      }
    >
      <ScreenHeader
        eyebrow="Servicios"
        title="Tus servicios"
        subtitle="Seguí tus pedidos, trabajos, visitas y pagos."
      />

      <Button
        title="Pedir un servicio"
        icon="add"
        onPress={() => router.push("/customer/request")}
      />

      <View style={styles.chips}>
        {tabs.map((item) => (
          <Chip
            key={item.value}
            label={item.label}
            selected={tab === item.value}
            onPress={() => setTab(item.value)}
          />
        ))}
      </View>

      {current.isLoading ? <SkeletonList count={2} /> : null}

      {current.isError ? (
        <ErrorState
          message="No pudimos cargar esta sección. Revisá la conexión e intentá de nuevo."
          onRetry={() => void current.refetch()}
        />
      ) : null}

      {!current.isLoading && !current.isError && tab === "orders" ? (
        (orders.data ?? []).length === 0 ? (
          <Card>
            <EmptyState
              icon="construct-outline"
              title="Todavía no tenés trabajos"
              description="Cuando la empresa acepte tu solicitud, el trabajo aparece acá con su estado."
              action={
                <Button
                  title="Pedir un servicio"
                  variant="outline"
                  onPress={() => router.push("/customer/request")}
                />
              }
            />
          </Card>
        ) : (
          <Card>
            <SectionTitle>Mis trabajos</SectionTitle>
            {(orders.data ?? []).map((order, index, list) => (
              <ListRow
                key={order.id}
                title={order.title}
                subtitle={order.code}
                meta={
                  order.scheduled_at
                    ? `${relativeDayLabel(order.scheduled_at)} · ${formatTime(order.scheduled_at)}`
                    : "Sin fecha programada"
                }
                right={
                  <Badge
                    label={workOrderStatusMeta(order.operational_status).label}
                    tone={workOrderStatusMeta(order.operational_status).tone}
                  />
                }
                onPress={() =>
                  router.push({ pathname: "/customer/order/[id]", params: { id: order.id } })
                }
                last={index === list.length - 1}
              />
            ))}
          </Card>
        )
      ) : null}

      {!current.isLoading && !current.isError && tab === "requests" ? (
        (requests.data ?? []).length === 0 ? (
          <Card>
            <EmptyState
              icon="mail-unread-outline"
              title="No hiciste solicitudes todavía"
              description="Contanos qué necesitás y la empresa te contacta para coordinar."
              action={
                <Button
                  title="Crear solicitud"
                  variant="outline"
                  onPress={() => router.push("/customer/request")}
                />
              }
            />
          </Card>
        ) : (
          <Card>
            <SectionTitle>Mis solicitudes</SectionTitle>
            {(requests.data ?? []).map((request, index, list) => (
              <ListRow
                key={request.id}
                title={request.title}
                subtitle={request.description ?? undefined}
                meta={formatDateTime(request.created_at)}
                right={
                  <Badge
                    label={requestStatusMeta(request.status).label}
                    tone={requestStatusMeta(request.status).tone}
                  />
                }
                last={index === list.length - 1}
              />
            ))}
          </Card>
        )
      ) : null}

      {!current.isLoading && !current.isError && tab === "appointments" ? (
        (appointments.data ?? []).length === 0 ? (
          <Card>
            <EmptyState
              icon="calendar-outline"
              title="No tenés visitas agendadas"
              description="Cuando la empresa programe una visita, vas a ver día y horario acá."
            />
          </Card>
        ) : (
          <Card>
            <SectionTitle>Mis turnos</SectionTitle>
            {[...(appointments.data ?? [])]
              .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
              .map((appointment, index, list) => (
                <ListRow
                  key={appointment.id}
                  title={`${relativeDayLabel(appointment.starts_at)} · ${formatTime(appointment.starts_at)}`}
                  subtitle={appointment.order_title ?? "Visita técnica"}
                  meta={appointment.technician_name ?? undefined}
                  right={
                    <Badge
                      label={appointmentStatusMeta(appointment.status).label}
                      tone={appointmentStatusMeta(appointment.status).tone}
                    />
                  }
                  last={index === list.length - 1}
                />
              ))}
          </Card>
        )
      ) : null}

      {!current.isLoading && !current.isError && tab === "payments" ? (
        paymentList.length === 0 ? (
          <Card>
            <EmptyState
              icon="card-outline"
              title="Todavía no hay pagos registrados"
              description="Cuando la empresa registre un pago, vas a poder consultarlo acá."
            />
          </Card>
        ) : (
          <>
            <Card>
              <SectionTitle>Total registrado</SectionTitle>
              <Text style={styles.total}>{formatCurrency(registeredTotal)}</Text>
              <Muted>No incluye pagos anulados. Si tenés dudas, consultá con la empresa.</Muted>
            </Card>
            <Card>
              <SectionTitle>Movimientos</SectionTitle>
              {sortedPayments.map((payment, index, list) => {
                const meta = paymentStatusMeta(payment.status);
                return (
                  <ListRow
                    key={payment.id}
                    icon="card-outline"
                    title={formatCurrency(payment.amount)}
                    subtitle={`${paymentMethods[payment.method] ?? payment.method} · ${formatDateTime(payment.paid_at)}`}
                    right={<Badge label={meta.label} tone={meta.tone} />}
                    last={index === list.length - 1}
                  />
                );
              })}
            </Card>
          </>
        )
      ) : null}

      <Muted>
        ¿Necesitás reprogramar? Escribile a la empresa desde el detalle del trabajo.
      </Muted>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: "row", gap: spacing[2], flexWrap: "wrap" },
  total: { ...typography.title, color: colors.text },
});