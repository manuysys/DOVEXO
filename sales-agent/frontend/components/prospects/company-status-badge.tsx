import { Badge, type BadgeVariant } from "@/components/ui/badge";

/** Estados de descubrimiento que documenta el backend. */
const STATUS_LABELS: Record<string, string> = {
  discovered: "Descubierta",
  enriched: "Investigada",
  verified: "Verificada",
  manual: "Carga manual",
  duplicate: "Duplicada",
  possible_duplicate: "Posible duplicado",
  "possible-duplicate": "Posible duplicado",
  rejected: "Descartada",
  pending: "Pendiente",
};

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  discovered: "info",
  enriched: "success",
  verified: "success",
  manual: "neutral",
  duplicate: "warning",
  possible_duplicate: "warning",
  "possible-duplicate": "warning",
  rejected: "danger",
  pending: "neutral",
};

export function companyStatusLabel(status: string): string {
  const key = status.trim().toLowerCase();
  return STATUS_LABELS[key] ?? (status.trim().length > 0 ? status : "Sin estado");
}

export function CompanyStatusBadge({ status }: { status: string }) {
  const key = status.trim().toLowerCase();
  return (
    <Badge variant={STATUS_VARIANTS[key] ?? "neutral"}>
      {companyStatusLabel(status)}
    </Badge>
  );
}
