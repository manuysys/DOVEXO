"use client";

import { AlertTriangle, Loader2, Lock, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return <div className={cn("bg-surface-2 animate-pulse rounded-md", className)} />;
}

/** Skeleton de la lista: filas en escritorio, tarjetas en mobile. */
export function CustomerListSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando clientes">
      <div className="divide-border divide-y">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 p-4">
            <Bar className="h-10 w-10 shrink-0 rounded-ds-md" />
            <div className="min-w-0 flex-1 space-y-2">
              <Bar className="h-3 w-40" />
              <Bar className="h-3 w-56 max-w-full" />
            </div>
            <Bar className="hidden h-6 w-16 shrink-0 rounded-full sm:block" />
            <Bar className="hidden h-3 w-24 shrink-0 lg:block" />
          </div>
        ))}
      </div>
      <span className="sr-only">Cargando clientes…</span>
    </div>
  );
}

export function CustomerDetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando cliente">
      <Bar className="h-3 w-28" />
      <Card className="space-y-4 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <Bar className="h-14 w-14 shrink-0 rounded-ds-lg" />
          <div className="flex-1 space-y-3">
            <Bar className="h-5 w-48" />
            <Bar className="h-3 w-32" />
            <Bar className="h-3 w-full max-w-md" />
          </div>
        </div>
        <Bar className="h-9 w-full max-w-sm rounded-ds-md" />
      </Card>
      <Bar className="h-10 w-full max-w-lg rounded-ds-md" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3 p-5">
          <Bar className="h-3 w-24" />
          <Bar className="h-8 w-20" />
          <Bar className="h-3 w-40" />
        </Card>
        <Card className="space-y-3 p-5">
          <Bar className="h-3 w-24" />
          <Bar className="h-8 w-20" />
          <Bar className="h-3 w-40" />
        </Card>
      </div>
      <span className="sr-only">Cargando cliente…</span>
    </div>
  );
}

type CustomerErrorPanelProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
  action?: ReactNode;
};

export function CustomerErrorPanel({
  title = "No pudimos cargar la información",
  message,
  onRetry,
  retrying = false,
  action,
}: CustomerErrorPanelProps) {
  return (
    <Card className="border-danger/20 bg-danger-soft/40 p-6" role="alert">
      <div className="flex items-start gap-3">
        <span className="bg-danger-soft text-danger-strong flex h-9 w-9 shrink-0 items-center justify-center rounded-ds-md">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-text text-sm font-semibold">{title}</p>
          <p className="text-text-2 mt-1 text-sm">{message}</p>
          {(onRetry || action) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry} disabled={retrying}>
                  {retrying ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  )}
                  {retrying ? "Reintentando…" : "Reintentar"}
                </Button>
              )}
              {action}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/** Aviso de solo lectura para roles sin permiso de escritura. */
export function CustomerReadOnlyNotice({ children }: { children?: ReactNode }) {
  return (
    <p className="text-text-2 flex items-start gap-2 text-xs">
      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>
        {children ?? "Solo lectura: tu rol no puede crear, editar ni archivar clientes."}
      </span>
    </p>
  );
}

/** Aviso de sección restringida (por ejemplo, datos financieros). */
export function CustomerPermissionNotice({
  title = "Sección restringida",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-warning-soft text-warning-strong rounded-ds-md flex items-start gap-2 px-4 py-3 text-sm">
      <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5">{children}</p>
      </div>
    </div>
  );
}

export function CustomerInlineLoading({ label }: { label: string }) {
  return (
    <p className="text-text-2 flex items-center gap-2 py-3 text-sm" role="status">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      {label}
    </p>
  );
}
