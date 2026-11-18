import { Badge } from "@/components/ui/badge";
import { paymentStatusLabel } from "@/lib/payment-status";

type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "info" | "teal";

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  registered: "success",
  voided: "danger",
};

type PaymentStatusBadgeProps = {
  status: string;
  className?: string;
};

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? "neutral"} className={className}>
      {paymentStatusLabel(status)}
    </Badge>
  );
}
