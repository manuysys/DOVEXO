import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border-border bg-surface/60 flex flex-col items-center justify-center rounded-ds-lg border border-dashed px-6 py-12 text-center",
        className,
      )}
    >
      {Icon && (
        <span className="bg-surface-2 text-text-2 mb-4 flex h-12 w-12 items-center justify-center rounded-ds-lg">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
      )}
      <p className="text-text text-sm font-semibold">{title}</p>
      {description && <p className="text-text-2 mt-1 max-w-sm text-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
