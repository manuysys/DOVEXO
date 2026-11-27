import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";

import { ConfirmSheet } from "@/src/components/bottom-sheet";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  IconButton,
  InlineNotice,
  ListRow,
  Muted,
  Screen,
  SectionTitle,
  SkeletonList,
  type NoticeTone,
} from "@/src/components/ui";
import { api } from "@/src/lib/api";
import { useAuth } from "@/src/lib/auth";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatQuantity,
  formatTime,
} from "@/src/lib/format";
import { errorMessage } from "@/src/lib/offline";
import { appointmentStatusMeta, quoteStatusMeta, workOrderStatusMeta } from "@/src/lib/status";
import type { PortalQuote, PortalSession } from "@/src/lib/types";
import { colors, spacing, typography } from "@/src/theme/tokens";

type PendingDecision = { quote: PortalQuote; action: "approve" | "reject" } | null;

export default function CustomerOrderScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { customerSession } = useAuth();
  if (!customerSession) return <Redirect href="/customer" />;
  return <OrderDetail session={customerSession} orderId={String(params.id ?? "")} />;
}

function OrderDetail({ session, orderId }: { session: PortalSession; orderId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [decision, setDecision] = useState<PendingDecision>(null);
  const [feedback, setFeedback] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const query = useQuery({
    queryKey: ["portal-order", session.tenantSlug, orderId],
    queryFn: () => api.portalOrder(session, orderId),
    enabled: Boolean(orderId),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["portal-order"] });
    void queryClient.invalidateQueries({ queryKey: ["portal-quotes"] });
    void queryClient.invalidateQueries({ queryKey: ["portal-summary"] });
  };

  const approve = useMutation({
    mutationFn: (quoteId: string) => api.portalApproveQuote(session, quoteId),
    onSuccess: () => {
      invalidate();
      setDecision(null);
      setFeedback({ tone: "success", message: "Presupuesto aprobado. La empresa recibió tu respuesta." });
    },
    onError: (error) => {
      setDecision(null);
      setFeedback({ tone: "danger", message: errorMessage(error) });
    },
  });

  const reject = useMutation({
    mutationFn: (quoteId: string) => api.portalRejectQuote(session, quoteId),
    onSuccess: () => {
      invalidate();
      setDecision(null);
      setFeedback({ tone: "success", message: "Presupuesto rechazado. La empresa recibió tu respuesta." });
    },
    onError: (error) => {
      setDecision(null);
      setFeedback({ tone: "danger", message: errorMessage(error) });
    },
  });

  const deciding = approve.isPending || reject.isPending;

  if (query.isLoading) {
    return (
      <Screen>
        <SkeletonList count={3} />
      </Screen>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Screen>
        <ErrorState
          message="No pudimos cargar el trabajo. Revisá la conexión e intentá de nuevo."
          onRetry={() => void query.refetch()}
        />
      </Screen>
    );
  }

  const order = query.data;
  const meta = workOrderStatusMeta(order.operational_status);
  const pendingQuotes = order.quotes.filter((quote) => quote.status === "sent");

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
      <View style={styles.topBar}>
        <IconButton icon="arrow-back" onPress={() => router.back()} accessibilityLabel="Volver" />
        <Text style={styles.code}>{order.code}</Text>
      </View>

      <Card>
        <Badge label={meta.label} tone={meta.tone} icon={meta.icon} />
        <Text style={styles.title}>{order.title}</Text>
        {order.description ? <Muted>{order.description}</Muted> : null}
        <Muted>
          {order.scheduled_at
            ? `Programado: ${formatDateTime(order.scheduled_at)}`
            : "Sin fecha programada."}
        </Muted>
      </Card>

      {feedback ? <InlineNotice tone={feedback.tone} message={feedback.message} /> : null}

      <Card>
        <SectionTitle>Turnos</SectionTitle>
        {order.appointments.length === 0 ? (
          <Muted>No hay turnos agendados todavía.</Muted>
        ) : (
          order.appointments.map((appointment, index) => (
            <ListRow
              key={appointment.id}
              icon="calendar-outline"
              title={`${formatDate(appointment.starts_at)} · ${formatTime(appointment.starts_at)}`}
              subtitle={appointment.technician_name ?? "Técnico asignado"}
              right={
                <Badge
                  label={appointmentStatusMeta(appointment.status).label}
                  tone={appointmentStatusMeta(appointment.status).tone}
                />
              }
              last={index === order.appointments.length - 1}
            />
          ))
        )}
      </Card>

      <Card>
        <SectionTitle>Presupuestos</SectionTitle>
        {order.quotes.length === 0 ? (
          <Muted>No hay presupuestos para este trabajo.</Muted>
        ) : (
          order.quotes.map((quote) => {
            const quoteMeta = quoteStatusMeta(quote.status);
            return (
              <View key={quote.id} style={styles.quote}>
                <View style={styles.quoteHeader}>
                  <Text style={styles.quoteNumber}>{quote.number}</Text>
                  <Badge label={quoteMeta.label} tone={quoteMeta.tone} />
                </View>
                <Text style={styles.total}>{formatCurrency(quote.total)}</Text>
                {quote.valid_until ? (
                  <Muted>Válido hasta {formatDate(quote.valid_until)}</Muted>
                ) : null}
                {quote.items && quote.items.length > 0 ? (
                  <View style={styles.items}>
                    {quote.items.map((item, index) => (
                      <View key={`${quote.id}-${index}`} style={styles.itemRow}>
                        <Text style={styles.itemDescription} numberOfLines={2}>
                          {formatQuantity(item.quantity)} × {item.description}
                        </Text>
                        <Text style={styles.itemTotal}>{formatCurrency(item.line_total)}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                {quote.status === "sent" ? (
                  <View style={styles.actions}>
                    <Button
                      title="Aprobar"
                      icon="checkmark"
                      onPress={() => setDecision({ quote, action: "approve" })}
                      style={styles.action}
                    />
                    <Button
                      title="Rechazar"
                      variant="outline"
                      onPress={() => setDecision({ quote, action: "reject" })}
                      style={styles.action}
                    />
                  </View>
                ) : null}
              </View>
            );
          })
        )}
        {pendingQuotes.length > 0 ? (
          <Muted>
            Respondé los presupuestos pendientes para que la empresa pueda avanzar.
          </Muted>
        ) : null}
      </Card>

      <ConfirmSheet
        visible={decision !== null}
        title={decision?.action === "approve" ? "Aprobar presupuesto" : "Rechazar presupuesto"}
        message={
          decision?.action === "approve"
            ? "Al aprobar, la empresa puede avanzar con el trabajo."
            : "Si rechazás, la empresa va a contactarte para revisar la propuesta."
        }
        confirmLabel={decision?.action === "approve" ? "Aprobar" : "Rechazar"}
        destructive={decision?.action === "reject"}
        loading={deciding}
        onConfirm={() => {
          if (!decision) return;
          if (decision.action === "approve") approve.mutate(decision.quote.id);
          else reject.mutate(decision.quote.id);
        }}
        onCancel={() => setDecision(null)}
      >
        {decision ? (
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Presupuesto</Text>
              <Text style={styles.summaryValue}>{decision.quote.number}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.summaryValue}>{formatCurrency(decision.quote.total)}</Text>
            </View>
          </View>
        ) : null}
      </ConfirmSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  code: { ...typography.mono, color: colors.text2, flex: 1 },
  title: { ...typography.title, color: colors.text },
  quote: {
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  quoteHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[2],
  },
  quoteNumber: { ...typography.mono, color: colors.text2 },
  total: { ...typography.title, color: colors.text },
  items: { gap: spacing[1] },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing[2],
    paddingVertical: spacing[1],
  },
  itemDescription: { ...typography.label, fontWeight: "400", color: colors.text, flex: 1 },
  itemTotal: { ...typography.label, color: colors.text },
  actions: { flexDirection: "row", gap: spacing[2] },
  action: { flex: 1 },
  summary: { gap: spacing[2] },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing[2] },
  summaryLabel: { ...typography.label, fontWeight: "400", color: colors.text2 },
  summaryValue: { ...typography.bodyStrong, color: colors.text },
});