import Link from "next/link";
import { ArrowRight, FileUp, UserPlus } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FirstDataStepProps = {
  /** Cantidad de clientes del tenant. `null` mientras se consulta. */
  customersCount: number | null;
  customersError: boolean;
  pending: boolean;
  onBack: () => void;
  onFinish: (withFirstCustomer: boolean) => void;
};

export function FirstDataStep({
  customersCount,
  customersError,
  pending,
  onBack,
  onFinish,
}: FirstDataStepProps) {
  const hasCustomers = customersCount !== null && customersCount > 0;

  return (
    <div className="space-y-6">
      <p className="text-text-2 text-sm">
        Cargá tus primeros clientes para empezar el historial. Podés importar una planilla o cargar
        uno a uno.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/settings/import"
          className="border-border bg-surface hover:border-primary/40 hover:bg-primary/5 group flex flex-col gap-2 rounded-ds-md border p-4 transition-colors"
        >
          <span className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-ds-md">
            <FileUp className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="text-text text-sm font-semibold">Importar desde CSV o Excel</span>
          <span className="text-text-2 text-xs">Revisamos cada fila antes de crear clientes.</span>
          <span className="text-primary mt-1 inline-flex items-center gap-1 text-xs font-semibold">
            Importar
            <ArrowRight
              className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </Link>
        <Link
          href="/customers"
          className="border-border bg-surface hover:border-primary/40 hover:bg-primary/5 group flex flex-col gap-2 rounded-ds-md border p-4 transition-colors"
        >
          <span className="bg-accent-teal/10 text-accent-teal flex h-9 w-9 items-center justify-center rounded-ds-md">
            <UserPlus className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="text-text text-sm font-semibold">Cargar un cliente</span>
          <span className="text-text-2 text-xs">Alta manual desde la cartera de clientes.</span>
          <span className="text-primary mt-1 inline-flex items-center gap-1 text-xs font-semibold">
            Ir a clientes
            <ArrowRight
              className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </Link>
      </div>

      <div
        role="status"
        className={cn(
          "rounded-ds-md px-4 py-3 text-sm",
          customersError
            ? "bg-warning-soft text-warning-strong"
            : hasCustomers
              ? "bg-success-soft text-success-strong"
              : "bg-surface-2 text-text",
        )}
      >
        {customersError
          ? "No pudimos revisar tus clientes. Podés finalizar igual y cargarlos después."
          : customersCount === null
            ? "Revisando tus clientes..."
            : hasCustomers
              ? `Ya tenés ${customersCount} ${customersCount === 1 ? "cliente cargado" : "clientes cargados"}.`
              : "Todavía no hay clientes cargados. Podés finalizar ahora y cargarlos después."}
      </div>

      <div className="border-border flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" disabled={pending} onClick={onBack}>
          Volver
        </Button>
        {hasCustomers ? (
          <Button type="button" disabled={pending} onClick={() => onFinish(true)}>
            {pending ? "Finalizando..." : "Finalizar configuración"}
          </Button>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/customers"
              className={cn(buttonVariants({ variant: "ghost" }), "w-full sm:w-auto")}
            >
              Ir a clientes
            </Link>
            <Button
              type="button"
              variant="secondary"
              disabled={pending || (customersCount === null && !customersError)}
              onClick={() => onFinish(false)}
            >
              {pending ? "Finalizando..." : "Finalizar sin clientes"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
