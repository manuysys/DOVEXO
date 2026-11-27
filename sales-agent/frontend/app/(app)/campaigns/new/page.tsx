"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { buttonStyles } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingBlock } from "@/components/ui/spinner";
import { CampaignForm } from "@/components/campaigns/campaign-form";
import {
  emptyCampaignValues,
  formValuesToCampaignInput,
} from "@/features/campaigns/mapping";
import { useCreateCampaign } from "@/hooks/use-campaigns";
import { useSectors } from "@/hooks/use-dashboard";
import { useProducts } from "@/hooks/use-products";
import { getErrorMessage } from "@/lib/errors";

export default function NewCampaignPage() {
  const router = useRouter();
  const productsQuery = useProducts();
  const sectorsQuery = useSectors();
  const createCampaign = useCreateCampaign();

  return (
    <>
      <PageHeader
        title="Nueva campaña"
        description="Definí el alcance de la prospección. La campaña queda configurada y el descubrimiento real de empresas se ejecuta en la Fase 2."
      />

      {productsQuery.isPending ? (
        <LoadingBlock label="Cargando productos…" />
      ) : productsQuery.isError ? (
        <Alert variant="danger" title="No se pudieron cargar los productos">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{getErrorMessage(productsQuery.error)}</span>
            <button
              type="button"
              onClick={() => void productsQuery.refetch()}
              className="text-xs font-semibold underline"
            >
              Reintentar
            </button>
          </div>
        </Alert>
      ) : productsQuery.data.length === 0 ? (
        <EmptyState
          title="Primero necesitás un producto"
          description="Una campaña siempre pertenece a un producto. Creá uno o revisá el seed del backend."
          action={
            <Link
              href="/products/new"
              className={buttonStyles({ variant: "primary", size: "sm" })}
            >
              Crear producto
            </Link>
          }
        />
      ) : (
        <CampaignForm
          products={productsQuery.data}
          sectors={sectorsQuery.data ?? []}
          sectorsUnavailable={sectorsQuery.isError}
          defaultValues={emptyCampaignValues(productsQuery.data[0]?.id ?? "")}
          submitLabel="Crear campaña"
          isSubmitting={createCampaign.isPending}
          formError={
            createCampaign.isError ? getErrorMessage(createCampaign.error) : null
          }
          onSubmit={async (values) => {
            await createCampaign.mutateAsync(formValuesToCampaignInput(values));
            router.push("/campaigns");
          }}
        />
      )}
    </>
  );
}
