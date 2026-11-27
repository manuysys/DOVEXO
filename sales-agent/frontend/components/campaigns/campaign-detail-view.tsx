"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  useCampaign,
  useCampaignAction,
  useStartCampaign,
} from "@/hooks/use-campaigns";
import { useCampaignSearchRuns } from "@/hooks/use-search-runs";
import { useProvinces } from "@/hooks/use-provinces";
import { describeSources } from "@/features/campaigns/mapping";
import { SearchRunStatusBadge } from "@/components/search/search-run-status-badge";
import { getErrorMessage } from "@/lib/errors";
import { formatDate, formatDateTime, joinList, pluralize } from "@/lib/utils";
import { readNumber } from "@/lib/api/normalize";
import type { ProvinceOption, SearchRun } from "@/lib/api/types";
import { ARGENTINA_PROVINCE_CODES } from "@/lib/data/provinces";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingBlock } from "@/components/ui/spinner";
import { CampaignStatusBadge } from "./status-badge";

/** A partir de esta cantidad de provincias conviene avisar que tarda. */
const LONG_RUNNING_PROVINCES = 10;
const TOTAL_PROVINCES = ARGENTINA_PROVINCE_CODES.length;

function BackLink() {
  return (
    <div className="mb-4">
      <Link
        href="/campaigns"
        className="text-xs font-medium text-accent hover:underline"
      >
        ← Volver a campañas
      </Link>
    </div>
  );
}

function DetailItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm break-words text-ink">{children}</dd>
    </div>
  );
}

function provinceLabel(
  value: string,
  provinces: ReadonlyArray<ProvinceOption>,
): string {
  const match = provinces.find(
    (province) => province.code.toLowerCase() === value.trim().toLowerCase(),
  );
  return match?.name ?? value.trim();
}

function ProvinceRunsTable({
  runs,
  provinces,
}: {
  runs: SearchRun[];
  provinces: ReadonlyArray<ProvinceOption>;
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-line">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-canvas/60 text-left text-xs font-semibold tracking-wide text-muted uppercase">
            <th className="px-3 py-2">Provincia</th>
            <th className="px-3 py-2">Estado</th>
            <th className="px-3 py-2 text-right">Registros</th>
            <th className="px-3 py-2 text-right">Nuevas</th>
            <th className="px-3 py-2 text-right">Duplicados</th>
            <th className="px-3 py-2">Iniciada</th>
            <th className="px-3 py-2 text-right">Resultados</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {runs.map((run) => (
            <tr key={run.id} className="align-top">
              <td className="px-3 py-2 text-xs font-medium text-ink">
                {run.province_name ??
                  (run.province_code
                    ? provinceLabel(run.province_code, provinces)
                    : "—")}
              </td>
              <td className="px-3 py-2">
                <SearchRunStatusBadge
                  status={run.status}
                  rawStatus={run.raw_status}
                />
              </td>
              <td className="px-3 py-2 text-right text-xs text-ink tabular-nums">
                {run.records_found}
              </td>
              <td className="px-3 py-2 text-right text-xs text-success-strong tabular-nums">
                {run.new_companies}
              </td>
              <td className="px-3 py-2 text-right text-xs text-muted tabular-nums">
                {run.duplicates}
              </td>
              <td className="px-3 py-2 text-xs text-muted">
                {formatDateTime(run.started_at)}
              </td>
              <td className="px-3 py-2 text-right">
                <Link
                  href={`/prospects?search_run_id=${encodeURIComponent(run.id)}`}
                  className="text-xs font-medium text-accent hover:underline"
                >
                  Ver empresas
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CampaignDetailView({ id }: { id: string }) {
  const campaignQuery = useCampaign(id);
  const actionMutation = useCampaignAction(id);
  const startMutation = useStartCampaign(id);
  const runsQuery = useCampaignSearchRuns(id);
  const provincesQuery = useProvinces();

  if (campaignQuery.isPending) {
    return (
      <>
        <BackLink />
        <LoadingBlock label="Cargando campaña…" />
      </>
    );
  }

  if (campaignQuery.isError || !campaignQuery.data) {
    return (
      <>
        <BackLink />
        <Alert variant="danger" title="No se pudo cargar la campaña">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              {campaignQuery.isError
                ? getErrorMessage(campaignQuery.error)
                : "La API no devolvió la campaña solicitada."}
            </span>
            <button
              type="button"
              onClick={() => void campaignQuery.refetch()}
              className="text-xs font-semibold underline"
            >
              Reintentar
            </button>
          </div>
        </Alert>
      </>
    );
  }

  const campaign = campaignQuery.data;
  const provinces = provincesQuery.data ?? [];
  const status = campaign.status;
  const provinceCount = campaign.province_filters.length;
  const national = provinceCount === 0;
  const provincesToRun = national ? TOTAL_PROVINCES : provinceCount;
  const noSectors = campaign.sector_filters.length === 0;
  const canStart =
    status !== "active" &&
    status !== "cancelled" &&
    status !== "completed" &&
    !noSectors;
  const canPause = status === "active";
  const canCancel = status !== "cancelled" && status !== "completed";

  const runs = runsQuery.data ?? [];
  const counts =
    campaign.search_runs_total > 0
      ? {
          total: campaign.search_runs_total,
          pending: campaign.search_runs_pending,
          running: campaign.search_runs_running,
          completed: campaign.search_runs_completed,
          failed: campaign.search_runs_failed + campaign.search_runs_cancelled,
        }
      : {
          total: runs.length,
          pending: runs.filter((run) => run.status === "pending").length,
          running: runs.filter((run) => run.status === "running").length,
          completed: runs.filter((run) => run.status === "completed").length,
          failed: runs.filter(
            (run) => run.status === "failed" || run.status === "cancelled",
          ).length,
        };

  const startCampaign = () => {
    if (
      provincesToRun >= LONG_RUNNING_PROVINCES &&
      !window.confirm(
        `La campaña abarca ${provincesToRun} provincias: se va a crear una búsqueda por provincia y el worker las procesa de a una, así que puede tardar bastante. ¿Iniciar igual?`,
      )
    ) {
      return;
    }
    startMutation.mutate();
  };

  return (
    <>
      <BackLink />

      <PageHeader
        title={campaign.name || "Campaña sin nombre"}
        description={
          campaign.description ||
          "Campaña de prospección configurada para un producto de ARVOKTA."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              disabled={!canStart || startMutation.isPending}
              onClick={startCampaign}
            >
              {startMutation.isPending ? "Iniciando…" : "Iniciar"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!canPause || actionMutation.isPending}
              onClick={() => actionMutation.mutate("pause")}
            >
              Pausar
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={!canCancel || actionMutation.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    "¿Cancelar la campaña? Las búsquedas ya creadas se conservan en el historial.",
                  )
                ) {
                  actionMutation.mutate("cancel");
                }
              }}
            >
              Cancelar
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <CampaignStatusBadge
          status={campaign.status}
          rawStatus={campaign.raw_status}
        />
        <span className="text-xs text-muted">
          Actualizada {formatDateTime(campaign.updated_at)}
        </span>
      </div>

      {startMutation.isError ? (
        <Alert
          variant="danger"
          title="No se pudo iniciar la campaña"
          className="mb-4"
        >
          {getErrorMessage(startMutation.error)}
        </Alert>
      ) : null}

      {startMutation.isSuccess ? (
        <Alert variant="success" title="Campaña iniciada" className="mb-4">
          <p>
            Se crearon{" "}
            {pluralize(
              startMutation.data.search_runs.length,
              "búsqueda provincial",
              "búsquedas provinciales",
            )}{" "}
            y {pluralize(startMutation.data.total_jobs, "job", "jobs")}. La
            campaña queda activa y las corridas se procesan en el worker.
          </p>
          <p className="mt-2">
            <Link
              href={`/search-history?campaign_id=${encodeURIComponent(id)}`}
              className="font-semibold underline"
            >
              Ver el historial de la campaña
            </Link>
          </p>
        </Alert>
      ) : null}

      {actionMutation.isError ? (
        <Alert variant="danger" className="mb-4">
          {getErrorMessage(actionMutation.error)}
        </Alert>
      ) : null}

      {noSectors ? (
        <Alert
          variant="warning"
          title="La campaña no tiene rubros"
          className="mb-4"
        >
          El backend necesita al menos un rubro para buscar: editá la campaña
          antes de iniciarla.
        </Alert>
      ) : national ? (
        <Alert variant="info" title="Alcance nacional" className="mb-4">
          La campaña no define provincias: al iniciar se crean{" "}
          {pluralize(provincesToRun, "búsqueda", "búsquedas")}, una por
          provincia, y el worker las procesa de a una. Puede tardar bastante;
          seguí el progreso en el historial.
        </Alert>
      ) : provincesToRun >= LONG_RUNNING_PROVINCES ? (
        <Alert
          variant="warning"
          title="Campaña de alcance amplio"
          className="mb-4"
        >
          Abarca {pluralize(provincesToRun, "provincia", "provincias")}: se crea
          una búsqueda por provincia y el worker las procesa de a una. Puede
          tardar bastante y conviene revisar el progreso en el historial.
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader
              title="Búsquedas provinciales"
              description="Una corrida por provincia. El progreso lo informa el backend."
              action={
                <Link
                  href={`/search-history?campaign_id=${encodeURIComponent(id)}`}
                  className="text-xs font-medium text-accent hover:underline"
                >
                  Ver historial
                </Link>
              }
            />
            <CardContent>
              {runsQuery.isPending ? (
                <LoadingBlock label="Cargando búsquedas de la campaña…" />
              ) : runsQuery.isError ? (
                <Alert
                  variant="danger"
                  title="No se pudieron cargar las búsquedas"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span>{getErrorMessage(runsQuery.error)}</span>
                    <button
                      type="button"
                      onClick={() => void runsQuery.refetch()}
                      className="text-xs font-semibold underline"
                    >
                      Reintentar
                    </button>
                  </div>
                </Alert>
              ) : runs.length === 0 ? (
                <p className="rounded-md border border-dashed border-line bg-canvas/60 px-4 py-6 text-center text-sm text-muted">
                  Todavía no se ejecutó esta campaña. Al iniciarla se crea una
                  búsqueda por provincia.
                </p>
              ) : (
                <ProvinceRunsTable runs={runs} provinces={provinces} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Configuración"
              description="Parámetros guardados en la base de datos."
            />
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailItem label="Producto">
                  {campaign.product_id ? (
                    <Link
                      href={`/products/${campaign.product_id}/edit`}
                      className="text-accent hover:underline"
                    >
                      {campaign.product_name ?? "Ver producto"}
                    </Link>
                  ) : (
                    (campaign.product_name ?? "Sin producto")
                  )}
                </DetailItem>
                <DetailItem label="País">{campaign.country || "—"}</DetailItem>
                <DetailItem label="Provincias">
                  {national
                    ? `Todo el país (${TOTAL_PROVINCES} provincias)`
                    : joinList(
                        campaign.province_filters.map((value) =>
                          provinceLabel(value, provinces),
                        ),
                        24,
                      )}
                </DetailItem>
                <DetailItem label="Localidades">
                  {joinList(campaign.locality_filters, 6)}
                </DetailItem>
                <DetailItem label="Rubros">
                  {joinList(campaign.sector_filters, 12)}
                </DetailItem>
                <DetailItem label="Fuentes">
                  {describeSources(campaign.search_config)}
                </DetailItem>
                <DetailItem label="Límite de resultados">
                  {readNumber(
                    campaign.search_config,
                    ["max_results", "limit"],
                    0,
                  ) || "Sin definir"}
                </DetailItem>
                <DetailItem label="Creada">
                  {formatDate(campaign.created_at)}
                </DetailItem>
              </dl>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader
            title="Ejecución"
            description="Conteos de las corridas creadas por la campaña."
          />
          <CardContent className="space-y-3 text-sm text-muted">
            <dl className="grid grid-cols-2 gap-3">
              <DetailItem label="Búsquedas">{counts.total}</DetailItem>
              <DetailItem label="Pendientes">{counts.pending}</DetailItem>
              <DetailItem label="En ejecución">{counts.running}</DetailItem>
              <DetailItem label="Completadas">{counts.completed}</DetailItem>
              <DetailItem label="Fallidas o canceladas">
                {counts.failed}
              </DetailItem>
              <DetailItem label="Provincias a ejecutar">
                {provincesToRun}
              </DetailItem>
            </dl>
            {counts.total === 0 ? (
              <p>
                Al iniciar la campaña se crea una búsqueda por provincia y se
                encola el trabajo correspondiente.
              </p>
            ) : (
              <p>
                Las corridas pendientes se procesan en el worker. Podés seguir
                el detalle en{" "}
                <Link
                  href={`/search-history?campaign_id=${encodeURIComponent(id)}`}
                  className="text-accent hover:underline"
                >
                  Historial de búsquedas
                </Link>
                .
              </p>
            )}
            <p>
              No se muestran resultados estimados: los números salen de cada
              corrida en la base.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
