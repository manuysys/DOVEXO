import { cn, formatDate } from "@/lib/utils";
import type { TechnicianWorkOrder } from "@/lib/api";

type Props = {
  order: TechnicianWorkOrder;
};

type TimelineEvent = {
  label: string;
  at: string;
  tone: string;
};

export function TechOrderTimeline({ order }: Props) {
  const events: TimelineEvent[] = [
    { label: "Trabajo creado", at: order.created_at, tone: "bg-primary" },
  ];
  if (order.started_at) {
    events.push({ label: "Trabajo iniciado", at: order.started_at, tone: "bg-warning" });
  }
  if (order.finished_at) {
    events.push({ label: "Trabajo finalizado", at: order.finished_at, tone: "bg-success" });
  }
  if (order.updated_at && !events.some((event) => event.at === order.updated_at)) {
    events.push({ label: "Última actualización", at: order.updated_at, tone: "bg-text-2" });
  }
  events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  return (
    <section
      aria-labelledby="tech-history-title"
      className="rounded-ds-lg border border-border bg-surface p-4 shadow-card"
    >
      <h2 id="tech-history-title" className="text-h4 text-text">
        Historial
      </h2>
      <ol className="mt-3">
        {events.map((event, index) => {
          const isLast = index === events.length - 1;
          return (
            <li key={`${event.label}-${event.at}`} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", event.tone)}
                  aria-hidden="true"
                />
                {!isLast && <span className="w-px flex-1 bg-border" aria-hidden="true" />}
              </div>
              <div className={cn("min-w-0", !isLast && "pb-4")}>
                <p className="text-small font-medium text-text">{event.label}</p>
                <time dateTime={event.at} className="text-caption text-text-2">
                  {formatDate(event.at)}
                </time>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
