"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PortalNoticeTone = "info" | "warning" | "danger" | "success";

const NOTICE_CLASSES: Record<PortalNoticeTone, string> = {
  info: "bg-info-soft text-info-strong",
  warning: "bg-warning-soft text-warning-strong",
  danger: "bg-danger-soft text-danger-strong",
  success: "bg-success-soft text-success-strong",
};

export function PortalNotice({
  tone = "info",
  role,
  children,
  className,
}: {
  tone?: PortalNoticeTone;
  role?: "alert" | "status";
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={role}
      className={cn("text-small rounded-ds-md px-4 py-3", NOTICE_CLASSES[tone], className)}
    >
      {children}
    </div>
  );
}

export function PortalSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-h3 text-text">{title}</h2>
          {description && <p className="text-small mt-0.5 text-text-2">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function PortalEmpty({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-ds-lg border border-dashed border-border bg-surface px-6 py-10 text-center">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-ds-md bg-surface-2 text-text-2">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold text-text">{title}</p>
      {description && <p className="text-small mt-1 max-w-sm text-text-2">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PortalListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="rounded-ds-lg border border-border bg-surface p-5 shadow-card">
          <div className="h-3 w-24 animate-pulse rounded-ds-sm bg-surface-2" />
          <div className="mt-3 h-5 w-48 animate-pulse rounded-ds-sm bg-surface-2" />
          <div className="mt-2 h-3 w-full max-w-sm animate-pulse rounded-ds-sm bg-surface-2" />
        </div>
      ))}
    </div>
  );
}

/**
 * Etapa de un trabajo en cuatro pasos. Es solo informativa: el estado real y
 * las transiciones los decide el backend.
 */
export function PortalProgress({
  step,
  total,
  label,
}: {
  step: number;
  total: number;
  label: string;
}) {
  const safeTotal = Math.max(total, 1);
  const percent = Math.round((Math.min(step + 1, safeTotal) / safeTotal) * 100);
  return (
    <div className="space-y-1.5">
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={safeTotal}
        aria-valuenow={step + 1}
        aria-valuetext={label}
        className="h-1.5 overflow-hidden rounded-full bg-surface-2"
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-caption text-text-2">
        Etapa {step + 1} de {safeTotal} · {label}
      </p>
    </div>
  );
}
