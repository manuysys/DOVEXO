import { Badge } from "@/components/ui/badge";
import { PRIORITY_LABELS, REQUEST_STATUS_LABELS } from "@/lib/order-status";

import { REQUEST_SOURCE_LABELS } from "./request-list-utils";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "teal";

const priorityTones: Record<string, Tone> = {
  low: "neutral",
  normal: "info",
  high: "warning",
  urgent: "danger",
};

const statusTones: Record<string, Tone> = {
  new: "info",
  triaged: "warning",
  converted: "success",
  closed: "neutral",
};

export function RequestPriorityBadge({ priority, className }: { priority: string; className?: string }) {
  return (
    <Badge variant={priorityTones[priority] ?? "neutral"} className={className}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {PRIORITY_LABELS[priority] ?? priority}
    </Badge>
  );
}

export function RequestStatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant={statusTones[status] ?? "neutral"} className={className}>
      {REQUEST_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

export function RequestSourceLabel({ source }: { source: string }) {
  return <span>{REQUEST_SOURCE_LABELS[source] ?? source}</span>;
}
