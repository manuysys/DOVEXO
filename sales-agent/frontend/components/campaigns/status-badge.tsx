import type { CampaignStatus } from "@/lib/api/types";
import { Badge, type BadgeVariant } from "@/components/ui/badge";

const STATUS_LABELS: Record<Exclude<CampaignStatus, "unknown">, string> = {
  draft: "Borrador",
  active: "Activa",
  paused: "Pausada",
  cancelled: "Cancelada",
  completed: "Completada",
};

const STATUS_VARIANTS: Record<Exclude<CampaignStatus, "unknown">, BadgeVariant> =
  {
    draft: "neutral",
    active: "success",
    paused: "warning",
    cancelled: "danger",
    completed: "info",
  };

export function CampaignStatusBadge({
  status,
  rawStatus,
}: {
  status: CampaignStatus;
  rawStatus?: string;
}) {
  if (status === "unknown") {
    return (
      <Badge variant="neutral">
        {rawStatus && rawStatus.trim().length > 0 ? rawStatus : "Sin estado"}
      </Badge>
    );
  }

  return (
    <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>
  );
}

export function campaignStatusLabel(status: CampaignStatus): string {
  return status === "unknown" ? "Sin estado" : STATUS_LABELS[status];
}
