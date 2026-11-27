import Link from "next/link";
import type { Activity } from "@/lib/api/types";
import { activityTypeLabel } from "@/features/activities/labels";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function ActivityList({
  activities,
  emptyMessage = "Sin actividad registrada todavía.",
}: {
  activities: Activity[];
  emptyMessage?: string;
}) {
  if (activities.length === 0) {
    return <p className="text-sm text-muted">{emptyMessage}</p>;
  }

  return (
    <ul className="divide-y divide-line">
      {activities.map((activity) => (
        <li
          key={activity.id || `${activity.activity_type}-${activity.occurred_at ?? ""}`}
          className="space-y-1 py-2 first:pt-0 last:pb-0"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral">
              {activityTypeLabel(activity.activity_type)}
            </Badge>
            {activity.company_id ? (
              <Link
                href={`/prospects/${activity.company_id}#oportunidad`}
                className="text-xs font-medium text-accent hover:underline"
              >
                {activity.company_name ?? `Empresa #${activity.company_id}`}
              </Link>
            ) : activity.company_name ? (
              <span className="text-xs font-medium text-ink">
                {activity.company_name}
              </span>
            ) : null}
            <span className="text-[11px] text-muted">
              {formatDateTime(activity.occurred_at)}
            </span>
          </div>
          {activity.description ? (
            <p className="text-sm leading-relaxed text-ink">
              {activity.description}
            </p>
          ) : null}
          {activity.next_action_at ? (
            <p className="text-[11px] text-warning-strong">
              Próximo seguimiento: {formatDateTime(activity.next_action_at)}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
