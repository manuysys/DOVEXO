import type { MessageStatus } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import {
  messageStatusLabel,
  messageStatusVariant,
} from "@/features/messages/status";

export function MessageStatusBadge({
  status,
  rawStatus,
}: {
  status: MessageStatus;
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
    <Badge variant={messageStatusVariant(status)}>
      {messageStatusLabel(status)}
    </Badge>
  );
}
