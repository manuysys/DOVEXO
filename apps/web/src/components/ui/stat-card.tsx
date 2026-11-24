import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "teal" | "amber" | "danger";
  className?: string;
};

const toneClasses: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "bg-surface-2 text-text-2",
  teal: "bg-accent-teal/10 text-accent-teal",
  amber: "bg-warning-soft text-warning-strong",
  danger: "bg-danger-soft text-danger-strong",
};

export function StatCard({ label, value, hint, icon: Icon, tone = "default", className }: StatCardProps) {
  return (
    <div className={cn("border-border bg-surface min-w-0 rounded-ds-lg border p-5 shadow-card", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-text-2 text-label">{label}</p>
        {Icon && (
          <span className={cn("flex h-9 w-9 items-center justify-center rounded-ds-md", toneClasses[tone])}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="text-text font-display numeric mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="text-text-2 mt-1 text-xs">{hint}</p>}
    </div>
  );
}
