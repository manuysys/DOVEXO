import { CheckCircle2, Info, UserPlus } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import type { OnboardingPatch, OnboardingState } from "@/lib/onboarding-api";
import { cn } from "@/lib/utils";

type TeamStepProps = {
  state: Required<OnboardingState>;
  pending: boolean;
  onSave: (patch: OnboardingPatch) => void;
  onBack: () => void;
};

/** La invitación se hace en /settings/team. Este paso solo registra la confirmación. */
export function TeamStep({ state, pending, onSave, onBack }: TeamStepProps) {
  return (
    <div className="space-y-6">
      <p className="text-text-2 text-sm">
        Invitá a quienes trabajan con vos: administradores, coordinadores o técnicos. Cada persona
        recibe un enlace para crear su acceso y se le asigna un rol. Las invitaciones se gestionan
        en la sección Equipo.
      </p>

      {state.team_invited ? (
        <p className="bg-success-soft text-success-strong flex items-start gap-2 rounded-ds-md px-4 py-3 text-sm">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Ya confirmaste que invitaste a tu equipo.
        </p>
      ) : (
        <p className="bg-surface-2 text-text flex items-start gap-2 rounded-ds-md px-4 py-3 text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Todavía no confirmaste invitaciones. Podés continuar y hacerlo más tarde desde Equipo.
        </p>
      )}

      <Link
        href="/settings/team"
        className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
      >
        <UserPlus className="h-4 w-4" aria-hidden="true" />
        Ir a Equipo
      </Link>

      <div className="border-border flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" disabled={pending} onClick={onBack}>
          Volver
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => onSave({ step: 4 })}
          >
            Continuar sin invitar
          </Button>
          <Button
            type="button"
            disabled={pending}
            onClick={() => onSave({ team_invited: true, step: 4 })}
          >
            {pending ? "Guardando..." : "Ya invité al equipo"}
          </Button>
        </div>
      </div>
    </div>
  );
}
