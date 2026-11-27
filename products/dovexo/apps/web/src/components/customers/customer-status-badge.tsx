import { Badge } from "@/components/ui/badge";

import { customerStatusLabel, customerStatusVariant } from "./customer-labels";

export function CustomerStatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant={customerStatusVariant(status)} className={className}>
      {customerStatusLabel(status)}
    </Badge>
  );
}
