"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { emptyMetrics } from "@/lib/api/normalize";
import {
  useDashboardJobs,
  useDashboardMetrics,
} from "@/hooks/use-dashboard";
import { useProducts } from "@/hooks/use-products";
import { useCampaigns } from "@/hooks/use-campaigns";

export default function DashboardPage() {
  const [productId, setProductId] = useState("");
  const metricsQuery = useDashboardMetrics(productId || undefined);
  const jobsQuery = useDashboardJobs();
  const productsQuery = useProducts();
  const campaignsQuery = useCampaigns();

  const listsError =
    (productsQuery.error instanceof Error && productsQuery.error.message) ||
    (campaignsQuery.error instanceof Error && campaignsQuery.error.message) ||
    null;

  return (
    <>
      <PageHeader
        title="Overview"
        description="Estado comercial y operativo del motor de prospección. Todas las métricas salen de la API; no se completan con datos de ejemplo."
      />
      <DashboardView
        metrics={metricsQuery.data ?? emptyMetrics()}
        metricsStatus={metricsQuery.isPending ? "loading" : metricsQuery.isError ? "error" : "ready"}
        metricsError={
          metricsQuery.error instanceof Error
            ? metricsQuery.error.message
            : null
        }
        onRetryMetrics={() => void metricsQuery.refetch()}
        jobs={jobsQuery.data ?? []}
        jobsStatus={jobsQuery.isPending ? "loading" : jobsQuery.isError ? "error" : "ready"}
        jobsError={
          jobsQuery.error instanceof Error ? jobsQuery.error.message : null
        }
        onRetryJobs={() => void jobsQuery.refetch()}
        products={productsQuery.data ?? []}
        campaigns={campaignsQuery.data ?? []}
        listsStatus={
          productsQuery.isPending || campaignsQuery.isPending
            ? "loading"
            : productsQuery.isError || campaignsQuery.isError
              ? "error"
              : "ready"
        }
        listsError={listsError}
        onRetryLists={() => {
          void productsQuery.refetch();
          void campaignsQuery.refetch();
        }}
        filterSlot={
          <label className="flex items-center gap-2 text-xs text-muted">
            Producto
            <Select
              aria-label="Filtrar métricas por producto"
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
              className="h-8 w-56 py-0 text-xs"
            >
              <option value="">Todos los productos</option>
              {(productsQuery.data ?? []).map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </Select>
          </label>
        }
      />
    </>
  );
}
