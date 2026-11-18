import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Redirect } from "expo-router";
import { useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";

import { ConfirmSheet } from "@/src/components/bottom-sheet";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  InlineNotice,
  Muted,
  Screen,
  ScreenHeader,
  SectionTitle,
  SkeletonList,
  type NoticeTone,
} from "@/src/components/ui";
import { api } from "@/src/lib/api";
import { useAuth } from "@/src/lib/auth";
import { formatCurrency, formatDate, formatQuantity } from "@/src/lib/format";
import { errorMessage } from "@/src/lib/offline";
import { quoteStatusMeta } from "@/src/lib/status";
import type { PortalQuote, PortalSession } from "@/src/lib/types";
import { colors, spacing, typography } from "@/src/theme/tokens";

type PendingDecision = { quote: PortalQuote; action: "approve" | "reject" } | null;

export default function CustomerQuotesScreen() {
  const { customerSession } = useAuth();
  if (!customerSession) return <Redirect href="/customer" />;
  return <Quotes session={customerSession} />;
}

function Quotes({ session }: { session: PortalSession }) {
  const queryClient = useQueryClient();
  const [decision, setDecision] = useState<PendingDecision>(null);
  const [feedback, setFeedback] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const query = useQuery({
    queryKey: ["portal-quotes", session.tenantSlug],
    queryFn: () => api.portalQuotes(session),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["portal-quotes"] });
    void queryClient.invalidateQueries({ queryKey: ["portal-summary"] });
    void queryClient.invalidateQueries({ queryKey: ["portal-order"] });
  };

  const approve = useMutation({
    mutationFn: (id: string) => api.portalApproveQuote(session, id),
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
    mutationFn: (id: string) => api.portalRejectQuote(session, id),
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

  const quotes = [...(query.data ?? [])].sort((a, b) => {
    const pendingA = a.status === "sent" ? 0 : 1;
    const pendingB = b.status === "sent" ? 0 : 1;
    if (pendingA !== pendingB) return pendingA - pendingB;
    return new Date(b.sent_at ?? 0).getTime() - new Date(a.sent_at ?? 0).getTime();
  });
  const pendingCount = quotes.filter((quote) => quote.status === "sent").length;
  const deciding = approve.isPending || reject.isPending;

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
        eyebrow="Presupuestos"
        title="Tus presupuestos"
        subtitle="Revisá el detalle y respondé cuando quieras."
      />

      {feedback ? <InlineNotice tone={feedback.tone} message={feedback.message} /> : null}

      {pendingCount > 0 ? (
        <InlineNotice
          tone="warning"
          title={`${pendingCount} presupuesto${pendingCount === 1 ? "" : "s"} para responder`}
          message="La empresa espera tu respuesta para continuar con el trabajo."
        />
      ) : null}

      {query.isLoading ? <SkeletonList count={2} /> : null}

      {query.isError ? (
        <ErrorState
          message="No pudimos cargar tus presupuestos. Revisá la conexión e intentá de nuevo."
          onRetry={() => void query.refetch()}
        />
      ) : null}

      {!query.isLoading && !query.isError && quotes.length === 0 ? (
        <Card>
          <EmptyState
            icon="receipt-outline"
            title="No tenés presupuestos"
            description="Cuando la empresa te envíe un presupuesto, vas a poder aprobarlo o rechazarlo desde acá."
          />
        </Card>
      ) : null}

      {quotes.map((quote) => {
        const meta = quoteStatusMeta(quote.status);
        const pending = quote.status === "sent";
        return (
          <Card key={quote.id}>
            <View style={styles.cardTop}>
              <SectionTitle>{quote.number}</SectionTitle>
              <Badge label={meta.label} tone={meta.tone} icon={meta.icon} />
            </View>

            <Text style={styles.total}>{formatCurrency(quote.total)}</Text>
            {quote.valid_until ? <Muted>Válido hasta {formatDate(quote.valid_until)}</Muted> : null}

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

            {pending ? (
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
          </Card>
        );
      })}

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
            {decision.quote.valid_until ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Válido hasta</Text>
                <Text style={styles.summaryValue}>{formatDate(decision.quote.valid_until)}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </ConfirmSheet>
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
  total: { ...typography.title, color: colors.text },
  items: { gap: spacing[1] },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing[2],
    paddingVertical: spacing[1],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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