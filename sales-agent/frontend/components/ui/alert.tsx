import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AlertVariant = "info" | "success" | "warning" | "danger";

const variants: Record<AlertVariant, string> = {
  info: "border-accent/25 bg-accent-soft text-accent-strong",
  success: "border-success/25 bg-success-soft text-success-strong",
  warning: "border-warning/30 bg-warning-soft text-warning-strong",
  danger: "border-danger/25 bg-danger-soft text-danger-strong",
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
}: {
  variant?: AlertVariant;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={variant === "danger" ? "alert" : "status"}
      className={cn(
        "rounded-md border px-4 py-3 text-sm",
        variants[variant],
        className,
      )}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? (
        <div className={cn("text-sm leading-relaxed", title && "mt-1")}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
