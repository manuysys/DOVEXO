import { Badge } from "@/components/ui/badge";
import { quoteStatusLabel } from "@/lib/quote-status";
import { cn } from "@/lib/utils";

type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "info" | "teal";

/** Estados de ADR-008: draft → sent → approved | rejected (+ expired). */
const STATUS_VARIANT: Record<string, BadgeVariant> = {
  draft: "neutral",
  sent: "info",
  approved: "success",
  rejected: "danger",
  expired: "warning",
};

const STATUS_DOT: Record<string, string> = {
  draft: "bg-text-2",
  sent: "bg-info",
  approved: "bg-success",
  rejected: "bg-danger",
  expired: "bg-warning",
};

type QuoteStatusBadgeProps = {
  status: string;
  className?: string;
};

export function QuoteStatusBadge({ status, className }: QuoteStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? "neutral"} className={className}>
      <span
        aria-hidden="true"
        className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status] ?? "bg-text-2")}
      />
      {quoteStatusLabel(status)}
    </Badge>
  );
}
