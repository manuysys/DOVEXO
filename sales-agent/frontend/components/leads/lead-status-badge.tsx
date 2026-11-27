import type { LeadStatus } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import {
  leadStatusLabel,
  leadStatusVariant,
} from "@/features/leads/status";

export function LeadStatusBadge({
  status,
  rawStatus,
}: {
  status: LeadStatus;
  rawStatus?: string;
}) {
  if (status === "unknown") {
    return (
      <Badge variant="neutral">
        {rawStatus && rawStatus.trim().length > 0 ? rawStatus : "Sin estado"}
      </Badge>
    );
  }
  return <Badge variant={leadStatusVariant(status)}>{leadStatusLabel(status)}</Badge>;
}
