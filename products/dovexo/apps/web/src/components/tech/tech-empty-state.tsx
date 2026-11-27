import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
};

export function TechEmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "rounded-ds-lg border border-dashed border-border bg-surface-2/50 text-center",
        compact ? "px-4 py-6" : "px-5 py-8",
        className,
      )}
    >
      {Icon && (
        <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-surface text-text-2">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      <p className="text-small font-semibold text-text">{title}</p>
      {description && <p className="text-small mx-auto mt-1 max-w-sm text-text-2">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
