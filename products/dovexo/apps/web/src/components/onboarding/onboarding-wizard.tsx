"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, RefreshCw, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { CompanyStep } from "@/components/onboarding/company-step";
import { FirstDataStep } from "@/components/onboarding/first-data-step";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { ServicesStep } from "@/components/onboarding/services-step";
import { TeamStep } from "@/components/onboarding/team-step";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  completeOnboarding,
  getOnboarding,
  patchOnboarding,
  type OnboardingPatch,
  type OnboardingStatus,
} from "@/lib/onboarding-api";
import { ADMIN_ROLES } from "@/lib/navigation";
import {
  ONBOARDING_STEPS,
  ONBOARDING_STEP_COUNT,
  normalizeOnboardingState,
  onboardingErrorMessage,
} from "@/lib/onboarding-utils";

/**
 * Entrada del asistente. El contenido se monta una vez por empresa: formularios, errores y
 * mutaciones no pasan de una empresa a otra aunque cambie el tenant activo.
 */
export function OnboardingWizard() {
  const { activeTenantId } = useAuth();
  return <OnboardingSession key={activeTenantId ?? "sin-empresa"} />;
}

function onboardingKey(tenantId: string) {
  return ["onboarding", tenantId] as const;
}

function OnboardingSession() {
  const { activeTenantId, tenants } = useAuth();
  const queryClient = useQueryClient();
  const tenantId = activeTenantId ?? "";
  const activeTenant = tenants.find((tenant) => tenant.id === activeTenantId);
  const canManage = ADMIN_ROLES.includes(activeTenant?.role ?? "");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [finishError, setFinishError] = useState<string | null>(null);

  const statusQuery = useQuery({
    queryKey: onboardingKey(tenantId),
    queryFn: () => getOnboarding(tenantId),
    enabled: Boolean(tenantId) && canManage,
  });

  const state = normalizeOnboardingState(statusQuery.data?.state);
  const step = state.step;
  const onStepFour = step === ONBOARDING_STEP_COUNT;

  const customersQuery = useQuery({
    queryKey: ["customers", tenantId, ""],
    queryFn: () => api.customers.list(tenantId, ""),
    enabled: Boolean(tenantId) && canManage && onStepFour,
  });

  // Las mutaciones llevan el tenant en sus variables: la respuesta solo actualiza esa caché.
  const saveMutation = useMutation({
    mutationFn: (input: { tenantId: string; patch: OnboardingPatch }) =>
      patchOnboarding(input.tenantId, input.patch),
    onMutate: () => {
      setSaveError(null);
      setFinishError(null);
    },
    onSuccess: (status, input) => {
      queryClient.setQueryData<OnboardingStatus>(onboardingKey(input.tenantId), status);
    },
    onError: (error) =>
      setSaveError(
        onboardingErrorMessage(
          error,
          "No se pudo guardar el paso. Revisá los datos y probá de nuevo.",
        ),
      ),
  });

  const completeMutation = useMutation({
    mutationFn: (targetTenantId: string) => completeOnboarding(targetTenantId),
    onSuccess: (result, targetTenantId) => {
      if (!result.completed) return;
      // Marca completo solo la caché de la empresa que finalizó, con la confirmación del backend.
      queryClient.setQueryData<OnboardingStatus>(onboardingKey(targetTenantId), (previous) =>
        previous ? { ...previous, completed: true } : previous,
      );
      toast.success("Configuración inicial finalizada");
    },
    onError: (error) =>
      setFinishError(
        onboardingErrorMessage(error, "No se pudo finalizar la configuración. Probá de nuevo."),
      ),
  });

  const pending = saveMutation.isPending || completeMutation.isPending;
  const completed = statusQuery.data?.completed === true;

  function saveStep(patch: OnboardingPatch) {
    saveMutation.mutate({ tenantId, patch });
  }

  function finish(withFirstCustomer: boolean) {
    const patch: OnboardingPatch = withFirstCustomer
      ? { first_customer: true, step: ONBOARDING_STEP_COUNT }
      : { step: ONBOARDING_STEP_COUNT };
    // Orden obligatorio: primero se guarda el último paso; si falla, no se completa.
    saveMutation.mutate(
      { tenantId, patch },
      { onSuccess: () => completeMutation.mutate(tenantId) },
    );
  }

  if (!tenantId) {
    return (
      <Card className="p-8 text-sm text-text-2">
        No hay una empresa activa. Cerrá sesión y volvé a ingresar.
      </Card>
    );
  }

  if (!canManage) {
    return (
      <Card className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
        <span className="bg-warning-soft text-warning-strong flex h-11 w-11 shrink-0 items-center justify-center rounded-ds-lg">
          <ShieldAlert className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-text text-sm font-semibold">
            No tenés permisos para esta configuración
          </p>
          <p className="text-text-2 mt-1 text-sm">
            Solo el propietario o un administrador de {activeTenant?.name ?? "la empresa"} puede
            completar los primeros pasos.
          </p>
        </div>
      </Card>
    );
  }

  if (statusQuery.isPending) {
    return <WizardSkeleton />;
  }

  if (statusQuery.isError) {
    return (
      <Card className="space-y-4 p-6">
        <p role="alert" className="text-danger-strong text-sm">
          {onboardingErrorMessage(
            statusQuery.error,
            "No pudimos cargar tu progreso. Probá de nuevo.",
          )}
        </p>
        <Button variant="outline" onClick={() => void statusQuery.refetch()}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Reintentar
        </Button>
      </Card>
    );
  }

  if (completed) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Puesta en marcha" title="Primeros pasos" />
        <Card className="p-6 sm:p-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <span
              className="bg-success-soft text-success-strong flex h-12 w-12 shrink-0 items-center justify-center rounded-ds-lg"
              aria-hidden="true"
            >
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <div>
              <p className="text-text text-lg font-semibold">
                La configuración inicial está completa
              </p>
              <p className="text-text-2 mt-1 text-sm">
                Podés seguir ajustando la empresa, el equipo y los clientes desde sus secciones.
              </p>
            </div>
          </div>
          <div className="border-border mt-6 flex flex-col gap-2 border-t pt-5 sm:flex-row">
            <Link href="/dashboard" className={buttonVariants({ variant: "primary" })}>
              Ir al panel
            </Link>
            <Link href="/settings/import" className={buttonVariants({ variant: "outline" })}>
              Importar clientes
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const currentStep = ONBOARDING_STEPS[step - 1] ?? ONBOARDING_STEPS[0];
  const goBack = () => saveStep({ step: step - 1 });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Puesta en marcha"
        title="Primeros pasos"
        description="Configurá tu empresa en cuatro pasos. Tu avance se guarda: podés salir y retomar después."
      />

      <OnboardingProgress current={step} />

      {saveError && (
        <p role="alert" className="bg-danger-soft text-danger-strong rounded-ds-md px-4 py-3 text-sm">
          {saveError}
        </p>
      )}
      {finishError && (
        <p role="alert" className="bg-danger-soft text-danger-strong rounded-ds-md px-4 py-3 text-sm">
          {finishError}
        </p>
      )}

      <Card>
        <CardHeader className="border-border border-b">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-text-2 text-label">Paso {step} de {ONBOARDING_STEP_COUNT}</p>
            <Badge variant="neutral">Se guarda al continuar</Badge>
          </div>
          <CardTitle className="text-text font-display text-xl">{currentStep.title}</CardTitle>
          <p className="text-text-2 text-sm">{currentStep.description}</p>
        </CardHeader>
        <CardContent className="pt-5" aria-busy={pending || undefined}>
          {step === 1 && (
            <CompanyStep
              state={state}
              tenantName={activeTenant?.name ?? ""}
              pending={pending}
              onSave={saveStep}
            />
          )}
          {step === 2 && (
            <ServicesStep state={state} pending={pending} onSave={saveStep} onBack={goBack} />
          )}
          {step === 3 && (
            <TeamStep state={state} pending={pending} onSave={saveStep} onBack={goBack} />
          )}
          {step === 4 && (
            <FirstDataStep
              customersCount={customersQuery.data?.total ?? null}
              customersError={customersQuery.isError}
              pending={pending}
              onBack={goBack}
              onFinish={finish}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function WizardSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Cargando tu progreso">
      <Skeleton className="h-8 w-56" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
      <div className="border-border bg-surface rounded-ds-lg border p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-6 w-40" />
        <Skeleton className="mt-2 h-4 w-64" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    </div>
  );
}
