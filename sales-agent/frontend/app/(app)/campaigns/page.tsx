"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { buttonStyles } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingBlock } from "@/components/ui/spinner";
import { CampaignTable } from "@/components/campaigns/campaign-table";
import { useCampaigns } from "@/hooks/use-campaigns";
import { getErrorMessage } from "@/lib/errors";

export default function CampaignsPage() {
  const campaignsQuery = useCampaigns();

  return (
    <>
      <PageHeader
        title="Campañas"
        description="Una campaña combina producto, provincias, rubros, fuentes y límite de resultados. La ejecución por campaña completa se habilita en la Fase 2B; las búsquedas por provincia ya funcionan en Buscar empresas."
        actions={
          <Link
            href="/campaigns/new"
            className={buttonStyles({ variant: "primary", size: "md" })}
          >
            Nueva campaña
          </Link>
        }
      />

      {campaignsQuery.isPending ? (
        <LoadingBlock label="Cargando campañas…" />
      ) : campaignsQuery.isError ? (
        <Alert variant="danger" title="No se pudieron cargar las campañas">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{getErrorMessage(campaignsQuery.error)}</span>
            <button
              type="button"
              onClick={() => void campaignsQuery.refetch()}
              className="text-xs font-semibold underline"
            >
              Reintentar
            </button>
          </div>
        </Alert>
      ) : campaignsQuery.data.length === 0 ? (
        <EmptyState
          title="No hay campañas todavía"
          description="El backend precarga «DOVEXO - Argentina - Prospección inicial» al ejecutar el seed. Si no aparece, revisá las migraciones o creá una campaña."
          action={
            <Link
              href="/campaigns/new"
              className={buttonStyles({ variant: "primary", size: "sm" })}
            >
              Crear campaña
            </Link>
          }
        />
      ) : (
        <CampaignTable campaigns={campaignsQuery.data} />
      )}
    </>
  );
}
