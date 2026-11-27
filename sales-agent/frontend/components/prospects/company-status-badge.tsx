import { Badge, type BadgeVariant } from "@/components/ui/badge";

/** Estados de descubrimiento que documenta el backend. */
const STATUS_LABELS: Record<string, string> = {
  discovered: "Descubierta",
  enriched: "Investigada",
  verified: "Verificada",
  manual: "Carga manual",
  duplicate: "Duplicada",
  rejected: "Descartada",
  pending: "Pendiente",
};

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  discovered: "info",
  enriched: "success",
  verified: "success",
  manual: "neutral",
  duplicate: "warning",
  rejected: "danger",
  pending: "neutral",
};

export function CompanyStatusBadge({ status }: { status: string }) {
  const key = status.trim().toLowerCase();
  const label = STATUS_LABELS[key];
  if (!label) {
    return (
      <Badge variant="neutral">
        {status.trim().length > 0 ? status : "Sin estado"}
      </Badge>
    );
  }
  return <Badge variant={STATUS_VARIANTS[key] ?? "neutral"}>{label}</Badge>;
}
