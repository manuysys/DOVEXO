import { CalendarCheck2, TriangleAlert, UserX, Users, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type AgendaSummaryProps = {
  appointments: number;
  conflicts: number;
  unassigned: number;
  busyTechnicians: number;
  totalTechnicians: number;
  scope: "day" | "week";
};

type SummaryItem = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone: string;
};

export function AgendaSummary({
  appointments,
  conflicts,
  unassigned,
  busyTechnicians,
  totalTechnicians,
  scope,
}: AgendaSummaryProps) {
  const items: SummaryItem[] = [
    {
      label: "Visitas",
      value: String(appointments),
      hint: scope === "week" ? "en la semana" : "en el día",
      icon: CalendarCheck2,
      tone: "bg-info-soft text-info-strong",
    },
    {
      label: "Conflictos",
      value: String(conflicts),
      hint: conflicts === 0 ? "sin pendientes" : "para revisar",
      icon: TriangleAlert,
      tone: conflicts === 0 ? "bg-success-soft text-success-strong" : "bg-warning-soft text-warning-strong",
    },
    {
      label: "Sin técnico",
      value: String(unassigned),
      hint: unassigned === 0 ? "todo asignado" : "visitas agendadas",
      icon: UserX,
      tone: unassigned === 0 ? "bg-success-soft text-success-strong" : "bg-warning-soft text-warning-strong",
    },
    {
      label: "Con agenda",
      value: `${busyTechnicians}/${totalTechnicians}`,
      hint: scope === "week" ? "con visitas esta semana" : "con visitas hoy",
      icon: Users,
      tone: "bg-surface-2 text-text-2",
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="border-border bg-surface rounded-ds-md border p-3 shadow-card"
          >
            <dt className="text-text-2 text-caption flex items-center gap-1.5 font-semibold">
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                  item.tone,
                )}
                aria-hidden="true"
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="truncate">{item.label}</span>
            </dt>
            <dd className="mt-1">
              <span className="numeric text-h3 text-text block">{item.value}</span>
              <span className="text-text-2 text-caption block">{item.hint}</span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
