import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "info";

const variants: Record<BadgeVariant, string> = {
  neutral: "bg-canvas text-muted ring-line",
  success: "bg-success-soft text-success-strong ring-success/20",
  warning: "bg-warning-soft text-warning-strong ring-warning/20",
  danger: "bg-danger-soft text-danger-strong ring-danger/20",
  info: "bg-accent-soft text-accent-strong ring-accent/20",
};

export function Badge({
  children,
  variant = "neutral",
  className,
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
