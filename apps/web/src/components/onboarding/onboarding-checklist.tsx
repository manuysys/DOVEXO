"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Circle, Rocket } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOnboarding } from "@/lib/onboarding-api";
import { normalizeOnboardingState, onboardingChecklist } from "@/lib/onboarding-utils";
import { cn } from "@/lib/utils";

type OnboardingChecklistProps = {
  tenantId: string;
};

/**
 * Checklist de inicio para el panel. Usa el mismo estado que el asistente (misma clave de caché).
 * Se oculta cuando la configuración está completa o si no se pudo cargar: el panel no depende de él.
 */
export function OnboardingChecklist({ tenantId }: OnboardingChecklistProps) {
  const statusQuery = useQuery({
    queryKey: ["onboarding", tenantId],
    queryFn: () => getOnboarding(tenantId),
    enabled: Boolean(tenantId),
  });

  if (!statusQuery.data || statusQuery.data.completed || statusQuery.isError) {
    return null;
  }

  const items = onboardingChecklist(normalizeOnboardingState(statusQuery.data.state));
  const doneCount = items.filter((item) => item.done).length;

  return (
    <Card className="border-primary/15 bg-primary/5">
      <CardHeader className="flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="text-primary h-4 w-4" aria-hidden="true" />
            Primeros pasos
          </CardTitle>
          <p className="text-text-2 mt-1 text-sm">
            {doneCount} de {items.length} listos. Lo que falta sale del estado real de tu empresa.
          </p>
        </div>
        <Link
          href="/onboarding"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "self-start sm:shrink-0")}
        >
          Continuar configuración
        </Link>
      </CardHeader>
      <CardContent>
        <ul className="divide-border divide-y">
          {items.map((item) => (
            <li key={item.key} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              {item.done ? (
                <CheckCircle2 className="text-success h-5 w-5 shrink-0" aria-hidden="true" />
              ) : (
                <Circle className="text-text-2 h-5 w-5 shrink-0" aria-hidden="true" />
              )}
              <span className="text-text min-w-0 flex-1 text-sm font-medium">{item.label}</span>
              {item.done ? (
                <Badge variant="success">Listo</Badge>
              ) : (
                <Link
                  href={item.href}
                  className="text-primary inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                >
                  Completar
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  <span className="sr-only">{` ${item.label}`}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
