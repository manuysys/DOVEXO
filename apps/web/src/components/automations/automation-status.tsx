import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { AutomationExecutionStatus } from "@/lib/api";
import { EXECUTION_STATUS_LABELS } from "@/lib/automations";

const EXECUTION_VARIANTS: Record<AutomationExecutionStatus, NonNullable<BadgeProps["variant"]>> = {
  pending: "warning",
  success: "success",
  failed: "danger",
  skipped: "neutral",
};

export function ExecutionStatusBadge({ status }: { status: AutomationExecutionStatus }) {
  return <Badge variant={EXECUTION_VARIANTS[status]}>{EXECUTION_STATUS_LABELS[status]}</Badge>;
}
