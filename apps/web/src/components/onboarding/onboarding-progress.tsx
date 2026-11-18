import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { ONBOARDING_STEPS } from "@/lib/onboarding-utils";

type OnboardingProgressProps = {
  current: number;
};

export function OnboardingProgress({ current }: OnboardingProgressProps) {
  return (
    <nav aria-label="Progreso de la configuración">
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ONBOARDING_STEPS.map((item) => {
          const done = item.step < current;
          const active = item.step === current;
          return (
            <li
              key={item.step}
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex min-w-0 items-center gap-2 rounded-ds-md border px-3 py-2",
                active && "border-primary/40 bg-primary/5",
                done && "border-success/30 bg-success-soft",
                !active && !done && "border-border bg-surface",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  done && "bg-success-soft text-success-strong",
                  active && "bg-primary text-white",
                  !active && !done && "bg-surface-2 text-text",
                )}
                aria-hidden="true"
              >
                {done ? <Check className="h-3.5 w-3.5" /> : item.step}
              </span>
              <span className="min-w-0">
                <span className="text-text-2 block text-[11px] uppercase">Paso {item.step}</span>
                <span className="text-text block truncate text-xs font-semibold sm:text-sm">
                  {item.title}
                </span>
              </span>
              {done && <span className="sr-only">(completado)</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
