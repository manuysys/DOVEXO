import { Badge } from "@/components/ui/badge";

import { PRIORITY_TONES, STATUS_TONES, orderStatusLabel, priorityLabel } from "./order-meta";

type BadgeProps = {
  className?: string;
};

export function OrderStatusBadge({ status, className }: BadgeProps & { status: string }) {
  return (
    <Badge variant={STATUS_TONES[status] ?? "neutral"} className={className}>
      {orderStatusLabel(status)}
    </Badge>
  );
}

export function OrderPriorityBadge({
  priority,
  className,
  withDot = false,
}: BadgeProps & { priority: string; withDot?: boolean }) {
  return (
    <Badge variant={PRIORITY_TONES[priority] ?? "neutral"} className={className}>
      {withDot && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />}
      {priorityLabel(priority)}
    </Badge>
  );
}
