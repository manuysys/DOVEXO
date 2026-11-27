import {
  ChevronDown,
  ChevronRight,
  CircleCheck,
  CircleSlash,
  Filter,
  Send,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type { AutomationRule } from "@/lib/api";
import { ACTION_TYPE_LABELS, EVENT_TYPE_LABELS } from "@/lib/automations";
import { cn } from "@/lib/utils";

type FlowTone = "primary" | "violet" | "teal" | "success" | "muted";

const TONE_CLASSES: Record<FlowTone, string> = {
  primary: "bg-primary/10 text-primary",
  violet: "bg-violet/10 text-violet",
  teal: "bg-accent-teal/10 text-accent-teal",
  success: "bg-success-soft text-success-strong",
  muted: "bg-surface-2 text-text-2",
};

function FlowNode({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: FlowTone;
}) {
  return (
    <div className="border-border bg-surface-2/60 flex min-w-0 flex-1 items-start gap-2.5 rounded-ds-md border p-3">
      <span
        className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", TONE_CLASSES[tone])}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-text-2 text-label">{label}</p>
        <p className="text-text mt-0.5 text-sm leading-snug font-medium">{value}</p>
      </div>
    </div>
  );
}

function Connector() {
  return (
    <div aria-hidden="true" className="flex items-center justify-center py-0.5 md:w-4 md:py-0">
      <ChevronDown className="text-text-2/50 h-4 w-4 md:hidden" />
      <ChevronRight className="text-text-2/50 hidden h-4 w-4 md:block" />
    </div>
  );
}

export function AutomationFlow({ rule }: { rule: AutomationRule }) {
  const conditionCount = rule.conditions ? Object.keys(rule.conditions).length : 0;
  const conditionsLabel =
    conditionCount === 0
      ? "Sin condiciones"
      : `${conditionCount} condición${conditionCount === 1 ? "" : "es"}`;

  return (
    <div
      role="group"
      aria-label={`Flujo de la regla ${rule.name}`}
      className="flex flex-col md:flex-row md:items-stretch"
    >
      <FlowNode
        icon={Zap}
        label="Disparador"
        value={EVENT_TYPE_LABELS[rule.event_type]}
        tone="primary"
      />
      <Connector />
      <FlowNode icon={Filter} label="Condiciones" value={conditionsLabel} tone="violet" />
      <Connector />
      <FlowNode
        icon={Send}
        label="Acción"
        value={ACTION_TYPE_LABELS[rule.action_type]}
        tone="teal"
      />
      <Connector />
      <FlowNode
        icon={rule.active ? CircleCheck : CircleSlash}
        label="Estado"
        value={rule.active ? "Activa" : "Inactiva"}
        tone={rule.active ? "success" : "muted"}
      />
    </div>
  );
}
