"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { LoadingBlock } from "@/components/ui/spinner";
import { SearchHistoryTable } from "@/components/search/search-history-table";
import { useCampaigns } from "@/hooks/use-campaigns";
import { useSectors } from "@/hooks/use-dashboard";
import { useProvinces } from "@/hooks/use-provinces";
import { useSearchRuns } from "@/hooks/use-search-runs";
import type { ProvinceOption } from "@/lib/api/types";
import { ARGENTINA_PROVINCE_CODES } from "@/lib/data/provinces";
import { getErrorMessage } from "@/lib/errors";

export function SearchHistoryView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const campaignId = searchParams.get("campaign_id") ?? "";

  const runsQuery = useSearchRuns(campaignId || undefined);
  const campaignsQuery = useCampaigns();
  const provincesQuery = useProvinces();
  const sectorsQuery = useSectors();

  const provinces: ReadonlyArray<ProvinceOption> =
    provincesQuery.data && provincesQuery.data.length > 0
      ? provincesQuery.data
      : ARGENTINA_PROVINCE_CODES;

  const selectedCampaign = (campaignsQuery.data ?? []).find(
    (campaign) => campaign.id === campaignId,
  );

  const updateCampaign = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("campaign_id", value);
    else params.delete("campaign_id");
    const queryString = params.toString();
    router.replace(
      queryString.length > 0 ? `${pathname}?${queryString}` : pathname,
      { scroll: false },
    );
  };

  return (
    <>
      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-end justify-between gap-3">
          <label className="flex w-full max-w-sm flex-col gap-1 text-xs font-medium text-muted">
            Campaña
            <Select
              value={campaignId}
              onChange={(event) => updateCampaign(event.target.value)}
              className="h-9 py-1"
              disabled={campaignsQuery.isError}
            >
              <option value="">Todas las campañas</option>
              {(campaignsQuery.data ?? []).map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </Select>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={runsQuery.isFetching}
              onClick={() => void runsQuery.refetch()}
            >
              {runsQuery.isFetching ? "Actualizando…" : "Actualizar"}
            </Button>
            <Link
              href="/search"
              className={buttonStyles({ variant: "primary", size: "sm" })}
            >
              Nueva búsqueda
            </Link>
          </div>
        </CardContent>
      </Card>

      {campaignId ? (
        <Alert variant="info" className="mb-4">
          Mostrando las búsquedas provinciales de la campaña{" "}
          <strong>{selectedCampaign?.name ?? `#${campaignId}`}</strong>.{" "}
          <Link
            href={`/campaigns/${campaignId}`}
            className="font-semibold underline"
          >
            Ver campaña
          </Link>
          {" · "}
          <button
            type="button"
            onClick={() => updateCampaign("")}
            className="font-semibold underline"
          >
            Quitar filtro
          </button>
        </Alert>
      ) : null}

      {runsQuery.isPending ? (
        <LoadingBlock label="Cargando historial…" />
      ) : runsQuery.isError ? (
        <Alert variant="danger" title="No se pudo cargar el historial">
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
      ) : runsQuery.data.length === 0 ? (
        <EmptyState
          title={
            campaignId
              ? "La campaña todavía no tiene búsquedas"
              : "Todavía no hay búsquedas ejecutadas"
          }
          description={
            campaignId
              ? "Al iniciar la campaña se crea una búsqueda por provincia. Revisá el detalle de la campaña o iniciá una búsqueda manual."
              : "Cuando inicies una búsqueda por provincia y rubro, la corrida queda registrada acá con su estado y sus conteos."
          }
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              {campaignId ? (
                <Link
                  href={`/campaigns/${campaignId}`}
                  className={buttonStyles({
                    variant: "secondary",
                    size: "sm",
                  })}
                >
                  Ver campaña
                </Link>
              ) : null}
              <Link
                href="/search"
                className={buttonStyles({ variant: "primary", size: "sm" })}
              >
                Iniciar una búsqueda
              </Link>
            </div>
          }
        />
      ) : (
        <>
          {provincesQuery.isError ? (
            <Alert variant="warning" className="mb-4">
              No se pudo consultar <code>/meta/provinces</code>: la columna
              Provincia muestra el código informado por la corrida.
            </Alert>
          ) : null}
          <SearchHistoryTable
            runs={runsQuery.data}
            provinces={provinces}
            sectors={sectorsQuery.data ?? []}
          />
        </>
      )}
    </>
  );
}
