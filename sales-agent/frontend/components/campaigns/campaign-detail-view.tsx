"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCampaign, useCampaignAction } from "@/hooks/use-campaigns";
import { describeSources } from "@/features/campaigns/mapping";
import { getErrorMessage } from "@/lib/errors";
import { formatDate, formatDateTime, joinList } from "@/lib/utils";
import { readNumber } from "@/lib/api/normalize";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingBlock } from "@/components/ui/spinner";
import { CampaignStatusBadge } from "./status-badge";

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

export function CampaignDetailView({ id }: { id: string }) {
  const campaignQuery = useCampaign(id);
  const actionMutation = useCampaignAction(id);

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
  const status = campaign.status;
  const canStart =
    status !== "active" && status !== "cancelled" && status !== "completed";
  const canPause = status === "active";
  const canCancel = status !== "cancelled" && status !== "completed";

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
              disabled={!canStart || actionMutation.isPending}
              onClick={() => actionMutation.mutate("start")}
            >
              Iniciar
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
                    "¿Cancelar la campaña? La acción no se puede deshacer.",
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

      {actionMutation.isError ? (
        <Alert variant="danger" className="mb-4">
          {getErrorMessage(actionMutation.error)}
        </Alert>
      ) : null}

      {campaign.status === "active" ? (
        <Alert
          variant="info"
          title="Búsqueda pendiente de la Fase 2"
          className="mb-4"
        >
          La campaña está activa, pero el descubrimiento de empresas todavía no
          se ejecuta en esta fase. No se generaron resultados, empresas ni
          prospectos.
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
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
                {campaign.province_filters.length === 0
                  ? "Todo el país"
                  : joinList(campaign.province_filters, 24)}
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
                {readNumber(campaign.search_config, ["max_results", "limit"], 0) ||
                  "Sin definir"}
              </DetailItem>
              <DetailItem label="Creada">
                {formatDate(campaign.created_at)}
              </DetailItem>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Ejecución"
            description="Estado de la campaña y qué falta para producir resultados."
          />
          <CardContent className="space-y-3 text-sm text-muted">
            <p>
              <span className="font-medium text-ink">Fase actual:</span>{" "}
              configuración y seguimiento.
            </p>
            <p>
              El worker y las fuentes gratuitas se conectan en la Fase 2. Hasta
              entonces, iniciar la campaña solo cambia su estado.
            </p>
            <p>
              No se muestran resultados porque todavía no existen en la base.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
