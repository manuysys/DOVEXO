import type { SearchRunStatus } from "@/lib/api/types";
import { Badge, type BadgeVariant } from "@/components/ui/badge";

const STATUS_LABELS: Record<Exclude<SearchRunStatus, "unknown">, string> = {
  pending: "Pendiente",
  running: "En ejecución",
  completed: "Completada",
  failed: "Fallida",
  cancelled: "Cancelada",
};

const STATUS_VARIANTS: Record<
  Exclude<SearchRunStatus, "unknown">,
  BadgeVariant
> = {
  pending: "neutral",
  running: "info",
  completed: "success",
  failed: "danger",
  cancelled: "warning",
};

export function SearchRunStatusBadge({
  status,
  rawStatus,
}: {
  status: SearchRunStatus;
  rawStatus?: string;
}) {
  if (status === "unknown") {
    return (
      <Badge variant="neutral">
        {rawStatus && rawStatus.trim().length > 0 ? rawStatus : "Sin estado"}
      </Badge>
    );
  }

  return <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>;
}

export function searchRunStatusLabel(status: SearchRunStatus): string {
  return status === "unknown" ? "Sin estado" : STATUS_LABELS[status];
}
