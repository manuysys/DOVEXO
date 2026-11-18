"use client";

import { CheckCircle2, Clock3, Loader2, PauseCircle, PlayCircle, XCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TechnicianWorkOrder } from "@/lib/api";
import { technicianActions, type TechnicianAction } from "@/lib/technician";

type Props = {
  order: TechnicianWorkOrder;
  pending: boolean;
  error: string | null;
  onTransition: (to: TechnicianAction["to"]) => void;
};

function actionLabel(action: TechnicianAction, status: string): string {
  if (action.to === "finished") return "Finalizar trabajo";
  if (action.to === "in_progress") {
    return status === "waiting" ? "Continuar trabajo" : "Iniciar trabajo";
  }
  return "Pausar";
}

function actionAriaLabel(action: TechnicianAction, status: string): string {
  if (action.to === "waiting") return "Poner el trabajo en espera";
  return actionLabel(action, status);
}

function ActionIcon({ action, className }: { action: TechnicianAction; className?: string }) {
  if (action.to === "finished") {
    return <CheckCircle2 className={className} aria-hidden="true" />;
  }
  if (action.to === "waiting") {
    return <PauseCircle className={className} aria-hidden="true" />;
  }
  return <PlayCircle className={className} aria-hidden="true" />;
}

function IdleIcon({ status, className }: { status: string; className?: string }) {
  if (status === "finished") {
    return <CheckCircle2 className={className} aria-hidden="true" />;
  }
  if (status === "cancelled") {
    return <XCircle className={className} aria-hidden="true" />;
  }
  return <Clock3 className={className} aria-hidden="true" />;
}

function idleCopy(status: string): { title: string; description: string } {
  if (status === "finished") {
    return {
      title: "Trabajo finalizado",
      description: "No hay más acciones disponibles.",
    };
  }
  if (status === "cancelled") {
    return {
      title: "Trabajo cancelado",
      description: "No hay acciones disponibles.",
    };
  }
  if (status === "new") {
    return {
      title: "Esperando programación",
      description: "La oficina todavía no programó este trabajo.",
    };
  }
  return {
    title: "Sin acciones disponibles",
    description: "No hay cambios de estado posibles.",
  };
}

export function TechPrimaryAction({ order, pending, error, onTransition }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const actions = technicianActions(order.operational_status);
  const primary =
    actions.find((action) => action.to === "finished") ??
    actions.find((action) => action.to === "in_progress") ??
    actions.at(0);

  if (!primary) {
    const copy = idleCopy(order.operational_status);
    return (
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto w-full max-w-xl px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {error && (
            <p
              role="alert"
              className="text-small mb-2 rounded-ds-sm bg-danger-soft px-3 py-2 font-medium text-danger-strong"
            >
              {error}
            </p>
          )}
          <div className="flex items-start gap-3 rounded-ds-md bg-surface-2 px-3 py-3">
            <IdleIcon
              status={order.operational_status}
              className="mt-0.5 h-5 w-5 shrink-0 text-text-2"
            />
            <div className="min-w-0">
              <p className="text-small font-semibold text-text">{copy.title}</p>
              <p className="text-caption text-text-2">{copy.description}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const primaryAction = primary;
  const secondary = actions.filter((action) => action.to !== primaryAction.to);
  const primaryLabel = actionLabel(primaryAction, order.operational_status);

  function handlePrimary() {
    if (primaryAction.to === "finished") {
      setConfirmOpen(true);
      return;
    }
    onTransition(primaryAction.to);
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto w-full max-w-xl px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {error && (
            <p
              role="alert"
              className="text-small mb-2 rounded-ds-sm bg-danger-soft px-3 py-2 font-medium text-danger-strong"
            >
              {error}
            </p>
          )}
          <div className="flex items-center gap-2">
            {secondary.map((action) => {
              const label = actionLabel(action, order.operational_status);
              return (
                <button
                  key={action.to}
                  type="button"
                  onClick={() => onTransition(action.to)}
                  disabled={pending}
                  aria-label={actionAriaLabel(action, order.operational_status)}
                  className="text-small inline-flex min-h-12 min-w-12 shrink-0 items-center justify-center gap-2 rounded-ds-md border border-border bg-surface px-3 font-semibold text-text transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
                >
                  <ActionIcon action={action} className="h-5 w-5" />
                  <span className="hidden min-[380px]:inline">{label}</span>
                </button>
              );
            })}
            <Button
              size="lg"
              className="min-w-0 flex-1 whitespace-nowrap"
              onClick={handlePrimary}
              disabled={pending}
              aria-busy={pending}
            >
              {pending ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <ActionIcon action={primaryAction} className="h-5 w-5" />
              )}
              {pending ? "Actualizando…" : primaryLabel}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md border-border bg-surface text-text">
          <DialogHeader>
            <DialogTitle className="text-text">¿Finalizar el trabajo?</DialogTitle>
            <DialogDescription className="text-text-2">
              Después de finalizar, el trabajo queda cerrado y no se puede reabrir desde la PWA.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="lg" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="lg"
              disabled={pending}
              onClick={() => {
                setConfirmOpen(false);
                onTransition("finished");
              }}
            >
              Sí, finalizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
