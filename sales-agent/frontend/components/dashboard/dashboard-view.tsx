"use client";

import Link from "next/link";
import type {
  Campaign,
  DashboardJob,
  DashboardMetrics,
  Product,
} from "@/lib/api/types";
import { CampaignStatusBadge } from "@/components/campaigns/status-badge";
import { MetricCard } from "./metric-card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonStyles } from "@/components/ui/button";
import { formatDateTime, joinList, pluralize } from "@/lib/utils";

type LoadStatus = "loading" | "error" | "ready";

const METRIC_ITEMS: Array<{
  key: keyof DashboardMetrics;
  label: string;
  hint?: string;
}> = [
  { key: "companies_total", label: "Empresas totales" },
  { key: "companies_new", label: "Empresas nuevas" },
  { key: "companies_enriched", label: "Empresas investigadas" },
  { key: "leads_pending", label: "Leads por revisar" },
  { key: "contacts_published", label: "Contactos publicados" },
  { key: "whatsapp_published", label: "WhatsApp publicados" },
  { key: "leads_approved", label: "Leads aprobados" },
  { key: "companies_contacted", label: "Empresas contactadas" },
  { key: "responses", label: "Respuestas" },
  { key: "meetings", label: "Reuniones" },
];

export interface DashboardViewProps {
  metrics: DashboardMetrics;
  metricsStatus: LoadStatus;
  metricsError?: string | null;
  onRetryMetrics?: () => void;
  jobs: DashboardJob[];
  jobsStatus: LoadStatus;
  jobsError?: string | null;
  onRetryJobs?: () => void;
  products: Product[];
  campaigns: Campaign[];
  listsStatus: LoadStatus;
  listsError?: string | null;
  onRetryLists?: () => void;
  filterSlot?: React.ReactNode;
}

export function DashboardView({
  metrics,
  metricsStatus,
  metricsError,
  onRetryMetrics,
  jobs,
  jobsStatus,
  jobsError,
  onRetryJobs,
  products,
  campaigns,
  listsStatus,
  listsError,
  onRetryLists,
  filterSlot,
}: DashboardViewProps) {
  const noCompanies =
    metrics.companies_total === 0 && metrics.leads_pending === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">Métricas</h2>
          <p className="text-xs text-muted">
            Datos reales de la base. Si no hay información, se muestra cero.
          </p>
        </div>
        {filterSlot}
      </div>

      {metricsStatus === "error" ? (
        <Alert variant="danger" title="No se pudieron cargar las métricas">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{metricsError ?? "Intentá nuevamente."}</span>
            {onRetryMetrics ? (
              <button
                type="button"
                onClick={onRetryMetrics}
                className="text-xs font-semibold underline"
              >
                Reintentar
              </button>
            ) : null}
          </div>
        </Alert>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {METRIC_ITEMS.map((item) => (
            <MetricCard
              key={item.key}
              label={item.label}
              value={metricsStatus === "loading" ? 0 : metrics[item.key]}
              className={metricsStatus === "loading" ? "animate-pulse" : ""}
            />
          ))}
        </div>
      )}

      {metricsStatus === "ready" && noCompanies ? (
        <EmptyState
          title="Todavía no hay empresas ni prospectos"
          description="El descubrimiento de empresas (OpenStreetMap, CSV y alta manual) se habilita en la Fase 2. Hasta entonces el dashboard muestra cero: no se cargan datos de ejemplo."
          action={
            <Link
              href="/campaigns"
              className={buttonStyles({ variant: "secondary", size: "sm" })}
            >
              Ver campañas
            </Link>
          }
        />
      ) : null}

      {listsStatus === "error" ? (
        <Alert variant="danger" title="No se pudieron cargar productos y campañas">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{listsError ?? "Intentá nuevamente."}</span>
            {onRetryLists ? (
              <button
                type="button"
                onClick={onRetryLists}
                className="text-xs font-semibold underline"
              >
                Reintentar
              </button>
            ) : null}
          </div>
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Productos"
            description={
              listsStatus === "loading"
                ? "Cargando…"
                : pluralize(products.length, "producto configurado", "productos configurados")
            }
            action={
              <Link
                href="/products"
                className="text-xs font-medium text-accent hover:underline"
              >
                Ver todos
              </Link>
            }
          />
          <CardContent>
            {products.length === 0 ? (
              <EmptyState
                title="No hay productos configurados"
                description="Creá un producto para definir propuesta de valor, sectores y scoring."
              />
            ) : (
              <ul className="divide-y divide-line">
                {products.slice(0, 5).map((product) => (
                  <li
                    key={product.id}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/products/${product.id}/edit`}
                        className="truncate text-sm font-medium text-ink hover:text-accent"
                      >
                        {product.name || "Producto sin nombre"}
                      </Link>
                      <p className="truncate text-xs text-muted">
                        /{product.slug || "—"}
                      </p>
                    </div>
                    <Badge variant={product.is_active ? "success" : "neutral"}>
                      {product.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Campañas"
            description={
              listsStatus === "loading"
                ? "Cargando…"
                : pluralize(campaigns.length, "campaña", "campañas")
            }
            action={
              <Link
                href="/campaigns"
                className="text-xs font-medium text-accent hover:underline"
              >
                Ver todas
              </Link>
            }
          />
          <CardContent>
            {campaigns.length === 0 ? (
              <EmptyState
                title="No hay campañas"
                description="Una campaña define producto, provincias y rubros a relevar."
              />
            ) : (
              <ul className="divide-y divide-line">
                {campaigns.slice(0, 5).map((campaign) => (
                  <li
                    key={campaign.id}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/campaigns/${campaign.id}`}
                        className="truncate text-sm font-medium text-ink hover:text-accent"
                      >
                        {campaign.name || "Campaña sin nombre"}
                      </Link>
                      <p className="truncate text-xs text-muted">
                        {campaign.product_name ?? "Sin producto"} ·{" "}
                        {joinList(campaign.province_filters, 2)}
                      </p>
                    </div>
                    <CampaignStatusBadge
                      status={campaign.status}
                      rawStatus={campaign.raw_status}
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Tareas en ejecución"
          description="Jobs del worker persistente (búsquedas, enriquecimiento, scoring)."
          action={
            jobsStatus === "error" && onRetryJobs ? (
              <button
                type="button"
                onClick={onRetryJobs}
                className="text-xs font-semibold text-accent hover:underline"
              >
                Reintentar
              </button>
            ) : null
          }
        />
        <CardContent>
          {jobsStatus === "loading" ? (
            <p className="text-xs text-muted">Cargando tareas…</p>
          ) : jobsStatus === "error" ? (
            <p className="text-xs text-danger">
              {jobsError ?? "No se pudo consultar el estado de las tareas."}
            </p>
          ) : jobs.length === 0 ? (
            <p className="text-xs text-muted">
              Sin tareas en ejecución. El worker se inicia aparte y las
              búsquedas automáticas se habilitan en la Fase 2.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {jobs.slice(0, 8).map((job) => (
                <li
                  key={job.id || `${job.type}-${job.created_at ?? ""}`}
                  className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm first:pt-0 last:pb-0"
                >
                  <span className="font-medium text-ink">{job.type}</span>
                  <span className="flex items-center gap-3 text-xs text-muted">
                    <Badge variant={jobBadgeVariant(job.status)}>
                      {job.status}
                    </Badge>
                    {formatDateTime(job.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted">
        {pluralize(products.length, "producto", "productos")} y{" "}
        {pluralize(campaigns.length, "campaña", "campañas")} configurados. Los
        contadores de empresas y prospectos permanecen en cero hasta que exista
        descubrimiento en la Fase 2.
      </p>
    </div>
  );
}

function jobBadgeVariant(
  status: string,
): "success" | "warning" | "danger" | "neutral" {
  switch (status.toLowerCase()) {
    case "completed":
    case "done":
    case "success":
      return "success";
    case "running":
    case "pending":
    case "queued":
      return "warning";
    case "failed":
    case "error":
      return "danger";
    default:
      return "neutral";
  }
}

