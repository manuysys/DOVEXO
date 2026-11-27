"use client";

import Link from "next/link";
import { useSearchRun, useSearchRunAction } from "@/hooks/use-search-runs";
import { useSectors } from "@/hooks/use-dashboard";
import { sectorNames } from "@/features/search/labels";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTime, pluralize } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DetailItem } from "@/components/ui/detail-item";
import { LoadingBlock, Spinner } from "@/components/ui/spinner";
import { SearchRunStatusBadge } from "./search-run-status-badge";

function CountBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-line bg-canvas/60 px-4 py-3">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold text-ink tabular-nums">{value}</p>
    </div>
  );
}

/**
 * Seguimiento de una corrida de descubrimiento: consulta `GET /search-runs/{id}`
 * cada 2 s hasta que el backend la marca como terminada.
 */
export function SearchRunPanel({ runId }: { runId: string }) {
  const runQuery = useSearchRun(runId);
  const action = useSearchRunAction(runId);
  const sectorsQuery = useSectors();

  if (runQuery.isPending) {
    return <LoadingBlock label="Consultando el estado de la búsqueda…" />;
  }

  if (runQuery.isError || !runQuery.data) {
    return (
      <Alert variant="danger" title="No se pudo consultar la búsqueda">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>
            {runQuery.isError
              ? getErrorMessage(runQuery.error)
              : "La API no devolvió la corrida solicitada."}
          </span>
          <button
            type="button"
            onClick={() => void runQuery.refetch()}
            className="text-xs font-semibold underline"
          >
            Reintentar
          </button>
        </div>
      </Alert>
    );
  }

  const run = runQuery.data;
  const isActive = run.status === "pending" || run.status === "running";
  const canRetry = run.status === "failed" || run.status === "cancelled";
  const completed = run.status === "completed";

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            Búsqueda #{run.id || "sin id"}
            <SearchRunStatusBadge
              status={run.status}
              rawStatus={run.raw_status}
            />
          </span>
        }
        description={
          isActive
            ? "El backend está consultando el proveedor. Esta vista se actualiza automáticamente cada 2 segundos."
            : "Estado final informado por el backend. Los números salen de la corrida, no de una estimación."
        }
        action={
          isActive ? (
            <span className="flex items-center gap-2 text-xs text-muted">
              <Spinner label="En ejecución" />
              En ejecución
            </span>
          ) : undefined
        }
      />

      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <CountBlock label="Registros encontrados" value={run.records_found} />
          <CountBlock label="Empresas nuevas" value={run.new_companies} />
          <CountBlock label="Duplicados descartados" value={run.duplicates} />
        </div>

        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DetailItem label="Provincia">
            {run.province_name ?? run.province_code ?? "Sin provincia"}
          </DetailItem>
          <DetailItem label="Rubros">
            {run.sector_slugs.length > 0
              ? sectorNames(run.sector_slugs, sectorsQuery.data ?? []).join(", ")
              : "Sin rubros"}
          </DetailItem>
          <DetailItem label="Proveedor">{run.provider || "—"}</DetailItem>
          <DetailItem label="Límite">{run.limit || "Sin definir"}</DetailItem>
          <DetailItem label="Iniciada">{formatDateTime(run.started_at)}</DetailItem>
          <DetailItem label="Finalizada">
            {formatDateTime(run.finished_at)}
          </DetailItem>
          <DetailItem label="Palabras clave">
            {run.keywords.length > 0 ? run.keywords.join(", ") : "—"}
          </DetailItem>
        </dl>

        {run.errors.length > 0 ? (
          <Alert
            variant={run.status === "failed" ? "danger" : "warning"}
            title={pluralize(run.errors.length, "error informado", "errores informados")}
          >
            <ul className="list-disc space-y-1 pl-4">
              {run.errors.map((error, index) => (
                <li key={`${index}-${error}`}>{error}</li>
              ))}
            </ul>
          </Alert>
        ) : null}

        {completed && run.new_companies === 0 ? (
          <Alert variant="warning" title="La búsqueda terminó sin empresas nuevas">
            El proveedor no devolvió registros nuevos para estos parámetros.
            Podés ampliar el límite, cambiar los rubros o probar otra provincia.
          </Alert>
        ) : null}

        {action.isError ? (
          <Alert variant="danger">{getErrorMessage(action.error)}</Alert>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
          {completed ? (
            <Link
              href={`/prospects?search_run_id=${encodeURIComponent(run.id)}`}
              className={buttonStyles({ variant: "primary", size: "sm" })}
            >
              Ver empresas encontradas
            </Link>
          ) : null}

          {canRetry ? (
            <Button
              variant="secondary"
              size="sm"
              disabled={action.isPending}
              onClick={() => action.mutate("retry")}
            >
              Reintentar búsqueda
            </Button>
          ) : null}

          {isActive ? (
            <Button
              variant="danger"
              size="sm"
              disabled={action.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    "¿Cancelar la búsqueda en curso? Las empresas ya guardadas se conservan.",
                  )
                ) {
                  action.mutate("cancel");
                }
              }}
            >
              Cancelar búsqueda
            </Button>
          ) : null}

          <span className="text-xs text-muted">
            {isActive
              ? "Podés cerrar esta pantalla: la corrida sigue en el backend."
              : "Historial completo en Historial de búsquedas."}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
