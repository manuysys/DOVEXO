"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  MinusCircle,
  Plus,
  ShieldAlert,
  Workflow,
  X,
} from "lucide-react";
import { useState } from "react";

import { AutomationExecutions } from "@/components/automations/automation-executions";
import { AutomationRuleCard } from "@/components/automations/automation-rule-card";
import { AutomationRuleForm } from "@/components/automations/automation-rule-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import {
  api,
  errorMessage,
  type AutomationExecution,
  type AutomationRule,
} from "@/lib/api";
import { buildAutomationRuleInput, type AutomationFormValues } from "@/lib/automations";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const MANAGE_ROLES = ["owner", "admin"];

type RuleFilter = "all" | "active" | "inactive";

const RULE_FILTERS: { value: RuleFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "active", label: "Activas" },
  { value: "inactive", label: "Inactivas" },
];

export default function AutomationsPage() {
  const { activeTenantId, tenants } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AutomationRule | null>(null);
  const [ruleFilter, setRuleFilter] = useState<RuleFilter>("all");
  const activeTenant = tenants.find((tenant) => tenant.id === activeTenantId);
  const canManage = MANAGE_ROLES.includes(activeTenant?.role ?? "");

  const rulesQuery = useQuery({
    queryKey: ["automations", activeTenantId],
    queryFn: () => api.automations.list(activeTenantId ?? ""),
    enabled: Boolean(activeTenantId) && canManage,
  });

  const executionsQuery = useQuery({
    queryKey: ["automation-executions", activeTenantId],
    queryFn: () => api.automations.executions(activeTenantId ?? "", 50),
    enabled: Boolean(activeTenantId) && canManage,
  });

  function invalidateAutomations() {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: ["automations"] }),
      queryClient.invalidateQueries({ queryKey: ["automation-executions"] }),
    ]);
  }

  const createMutation = useMutation({
    mutationFn: (values: AutomationFormValues) =>
      api.automations.create(activeTenantId ?? "", buildAutomationRuleInput(values)),
    onSuccess: () => {
      void invalidateAutomations();
      setShowForm(false);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (ruleId: string) => api.automations.toggle(activeTenantId ?? "", ruleId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["automations"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (ruleId: string) => api.automations.remove(activeTenantId ?? "", ruleId),
    onSuccess: () => {
      setPendingDelete(null);
      void invalidateAutomations();
    },
  });

  if (!activeTenantId) {
    return (
      <EmptyState
        icon={Workflow}
        title="No hay una empresa activa"
        description="Cerrá sesión y volvé a ingresar para gestionar las automatizaciones."
      />
    );
  }

  if (!canManage) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Sin permiso para gestionar automatizaciones"
        description="Solo owner y administración pueden crear, activar o eliminar reglas. Pedile acceso a un administrador de la empresa."
      />
    );
  }

  const rules = rulesQuery.data ?? [];
  const executions = executionsQuery.data ?? [];
  const ruleNames = new Map(rules.map((rule) => [rule.id, rule.name]));

  const activeCount = rules.filter((rule) => rule.active).length;
  const successCount = executions.filter((execution) => execution.status === "success").length;
  const failedCount = executions.filter((execution) => execution.status === "failed").length;
  const skippedCount = executions.filter((execution) => execution.status === "skipped").length;

  const visibleRules =
    ruleFilter === "all"
      ? rules
      : rules.filter((rule) => (ruleFilter === "active" ? rule.active : !rule.active));

  const orderedExecutions = [...executions].sort(
    (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  );

  const executionsByRule = new Map<string, AutomationExecution[]>();
  const failedByRule = new Map<string, number>();
  for (const execution of orderedExecutions) {
    const list = executionsByRule.get(execution.rule_id) ?? [];
    if (list.length < 5) list.push(execution);
    executionsByRule.set(execution.rule_id, list);

    if (execution.status === "failed") {
      failedByRule.set(execution.rule_id, (failedByRule.get(execution.rule_id) ?? 0) + 1);
    }
  }

  const actionError = toggleMutation.error ?? deleteMutation.error;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Automatizaciones"
        title="Reglas que trabajan por vos"
        description="Cada regla escucha un evento del negocio, evalúa sus condiciones y ejecuta una acción. Revisá qué está activo y qué falló."
        actions={
          <Button
            onClick={() => {
              setShowForm((value) => !value);
              createMutation.reset();
            }}
          >
            {showForm ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Plus className="h-4 w-4" aria-hidden="true" />
            )}
            {showForm ? "Cancelar" : "Nueva regla"}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Reglas activas"
          value={rulesQuery.isLoading ? "…" : activeCount}
          hint={`${rules.length} en total`}
          icon={Workflow}
          tone="teal"
        />
        <StatCard
          label="Ejecuciones exitosas"
          value={executionsQuery.isLoading ? "…" : successCount}
          hint="Últimas 50"
          icon={CheckCircle2}
          tone="default"
        />
        <StatCard
          label="Ejecuciones con error"
          value={executionsQuery.isLoading ? "…" : failedCount}
          hint={failedCount > 0 ? "Revisá el historial" : "Sin errores recientes"}
          icon={AlertTriangle}
          tone={failedCount > 0 ? "danger" : "default"}
        />
        <StatCard
          label="Omitidas"
          value={executionsQuery.isLoading ? "…" : skippedCount}
          hint="Acción no disponible"
          icon={MinusCircle}
          tone="amber"
        />
      </div>

      {showForm && (
        <AutomationRuleForm
          pending={createMutation.isPending}
          error={createMutation.error}
          onCancel={() => {
            setShowForm(false);
            createMutation.reset();
          }}
          onSubmit={(values) => createMutation.mutate(values)}
        />
      )}

      {actionError && (
        <p
          role="alert"
          className="bg-danger-soft text-danger-strong rounded-ds-md px-4 py-3 text-sm"
        >
          {errorMessage(actionError, "No se pudo completar la acción")}
        </p>
      )}

      <section aria-labelledby="rules-title" className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="rules-title" className="text-h3 text-text">
              Reglas
            </h2>
            <p className="text-text-2 mt-1 text-sm">
              {activeCount} activa{activeCount === 1 ? "" : "s"} de {rules.length}. Las reglas
              inactivas no se ejecutan.
            </p>
          </div>

          {rules.length > 0 && (
            <div
              role="group"
              aria-label="Filtrar reglas por estado"
              className="flex flex-wrap gap-2"
            >
              {RULE_FILTERS.map((option) => {
                const count =
                  option.value === "all"
                    ? rules.length
                    : rules.filter((rule) =>
                        option.value === "active" ? rule.active : !rule.active,
                      ).length;
                const active = ruleFilter === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setRuleFilter(option.value)}
                    className={cn(
                      "focus-visible:ring-primary rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-surface text-text-2 hover:bg-surface-2",
                    )}
                  >
                    {option.label} <span className="numeric">({count})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {rulesQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-44 w-full" />
          </div>
        ) : rulesQuery.isError ? (
          <div className="border-border bg-surface rounded-ds-lg border p-5">
            <p role="alert" className="text-danger text-sm">
              {errorMessage(rulesQuery.error, "No se pudieron cargar las reglas.")}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => void rulesQuery.refetch()}
            >
              Reintentar
            </Button>
          </div>
        ) : rules.length === 0 ? (
          <EmptyState
            icon={Workflow}
            title="Todavía no hay reglas"
            description="Creá una regla para avisar automáticamente cuando se apruebe un presupuesto, cambie una orden o se registre un pago."
            action={
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Nueva regla
              </Button>
            }
          />
        ) : visibleRules.length === 0 ? (
          <p className="text-text-2 text-sm">
            No hay reglas {ruleFilter === "active" ? "activas" : "inactivas"} en este momento.
          </p>
        ) : (
          <ul className="space-y-3">
            {visibleRules.map((rule) => (
              <li key={rule.id}>
                <AutomationRuleCard
                  rule={rule}
                  recentExecutions={executionsByRule.get(rule.id) ?? []}
                  failedCount={failedByRule.get(rule.id) ?? 0}
                  togglePending={
                    toggleMutation.isPending && toggleMutation.variables === rule.id
                  }
                  deletePending={
                    deleteMutation.isPending &&
                    pendingDelete !== null &&
                    pendingDelete.id === rule.id
                  }
                  onToggle={() => toggleMutation.mutate(rule.id)}
                  onDelete={() => {
                    deleteMutation.reset();
                    setPendingDelete(rule);
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <AutomationExecutions
        executions={executions}
        ruleNames={ruleNames}
        loading={executionsQuery.isLoading}
        error={executionsQuery.error}
        onRetry={() => void executionsQuery.refetch()}
      />

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar regla</DialogTitle>
            <DialogDescription>
              Se va a eliminar{" "}
              <span className="text-text font-semibold">{pendingDelete?.name ?? "la regla"}</span>.
              El historial de ejecuciones se conserva. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          {deleteMutation.error && (
            <p
              role="alert"
              className="bg-danger-soft text-danger-strong mt-4 rounded-lg px-3 py-2 text-sm"
            >
              {errorMessage(deleteMutation.error, "No se pudo eliminar la regla.")}
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (pendingDelete) deleteMutation.mutate(pendingDelete.id);
              }}
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar regla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
