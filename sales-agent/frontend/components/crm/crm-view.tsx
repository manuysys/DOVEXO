"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Lead } from "@/lib/api/types";
import {
  LEAD_STATUS_ORDER,
  leadStatusLabel,
} from "@/features/leads/status";
import { useLeads, useUpdateLead } from "@/hooks/use-leads";
import { LEADS_PAGE_LIMIT } from "@/lib/api/leads";
import { useProducts } from "@/hooks/use-products";
import { useRecentActivities } from "@/hooks/use-activities";
import { getErrorMessage } from "@/lib/errors";
import { pluralize } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LoadingBlock } from "@/components/ui/spinner";
import { ActivityList } from "@/components/activities/activity-list";
import { LeadManagementPanel } from "./lead-management-panel";
import { PipelineBoard } from "./pipeline-board";
import { SuppressionPanel } from "./suppression-panel";

export function CrmView() {
  const searchParams = useSearchParams();
  const leadParam = searchParams.get("lead") ?? "";

  const [statusFilter, setStatusFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const leadsQuery = useLeads({
    limit: LEADS_PAGE_LIMIT,
    status: statusFilter || undefined,
    product_id: productFilter || undefined,
  });
  const productsQuery = useProducts();
  const updateLead = useUpdateLead();
  const activitiesQuery = useRecentActivities(8);

  const leads = (leadsQuery.data?.items ?? []).filter((lead) => {
    if (search.trim().length === 0) return true;
    const needle = search.trim().toLowerCase();
    return (
      lead.company_name.toLowerCase().includes(needle) ||
      (lead.company_locality ?? "").toLowerCase().includes(needle) ||
      (lead.assigned_notes ?? "").toLowerCase().includes(needle)
    );
  });

  const activeId = selectedId ?? leadParam;
  const selectedLead = leads.find((lead) => lead.id === activeId) ?? null;
  const hasFilters = Boolean(statusFilter || productFilter || search);

  const changeStatus = (lead: Lead, status: string) => {
    if (status.length === 0) return;
    if (status === "do_not_contact" && !window.confirm(
      `¿Marcar "${lead.company_name || `oportunidad ${lead.id}`}" como no contactar? No se le deben enviar mensajes.`,
    )) {
      return;
    }
    setUpdatingId(lead.id);
    updateLead.mutate(
      { id: lead.id, input: { status } },
      { onSettled: () => setUpdatingId(null) },
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">
            Estado
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-9 py-1"
            >
              <option value="">Todos los estados</option>
              {LEAD_STATUS_ORDER.map((status) => (
                <option key={status} value={status}>
                  {leadStatusLabel(status)}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">
            Producto
            <Select
              value={productFilter}
              onChange={(event) => setProductFilter(event.target.value)}
              className="h-9 py-1"
              disabled={productsQuery.isError}
            >
              <option value="">Todos los productos</option>
              {(productsQuery.data ?? []).map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">
            Buscar
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Empresa, localidad o notas"
              className="h-9 py-1"
            />
          </label>
        </CardContent>
      </Card>

      {leadsQuery.data && leadsQuery.data.total > LEADS_PAGE_LIMIT ? (
        <Alert variant="info" title="Vista limitada a las primeras oportunidades">
          Mostrando {LEADS_PAGE_LIMIT} de {leadsQuery.data.total} oportunidades.
          Acotá con los filtros de estado, producto o búsqueda: esta vista todavía
          no pagina.
        </Alert>
      ) : null}

      {updateLead.isError ? (
        <Alert variant="danger" title="No se pudo actualizar la oportunidad">
          {getErrorMessage(updateLead.error)}
        </Alert>
      ) : null}

      {leadsQuery.isPending ? (
        <LoadingBlock label="Cargando pipeline…" />
      ) : leadsQuery.isError ? (
        <Alert variant="danger" title="No se pudo cargar el pipeline">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{getErrorMessage(leadsQuery.error)}</span>
            <button
              type="button"
              onClick={() => void leadsQuery.refetch()}
              className="text-xs font-semibold underline"
            >
              Reintentar
            </button>
          </div>
        </Alert>
      ) : leads.length === 0 ? (
        <EmptyState
          title={
            hasFilters
              ? "Ninguna oportunidad coincide con los filtros"
              : "Todavía no hay oportunidades"
          }
          description={
            hasFilters
              ? "Probá con otro estado, producto o sin búsqueda. Los datos salen de la base."
              : "Las oportunidades se crean desde la ficha de una empresa. Después podés puntuarlas, preparar el contacto y moverlas por el pipeline."
          }
          action={
            hasFilters ? (
              <button
                type="button"
                className={buttonStyles({ variant: "secondary", size: "sm" })}
                onClick={() => {
                  setStatusFilter("");
                  setProductFilter("");
                  setSearch("");
                }}
              >
                Limpiar filtros
              </button>
            ) : (
              <Link
                href="/prospects"
                className={buttonStyles({ variant: "primary", size: "sm" })}
              >
                Ver prospectos
              </Link>
            )
          }
        />
      ) : (
        <>
          <Card>
            <CardHeader
              title="Pipeline comercial"
              description={`${pluralize(leads.length, "oportunidad visible", "oportunidades visibles")}. Cambiá el estado con el selector de cada tarjeta: también funciona con teclado.`}
            />
            <CardContent>
              <PipelineBoard
                leads={leads}
                selectedId={activeId || null}
                updatingId={updatingId}
                onChangeStatus={changeStatus}
                onSelect={(lead) => setSelectedId(lead.id)}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {selectedLead ? (
                <LeadManagementPanel
                  lead={selectedLead}
                  onChangeStatus={changeStatus}
                  updating={updatingId === selectedLead.id}
                />
              ) : (
                <Card>
                  <CardHeader
                    title="Gestión de la oportunidad"
                    description="Elegí “Gestionar” en una tarjeta del pipeline."
                  />
                  <CardContent className="text-sm text-muted">
                    <p>
                      En el panel vas a poder guardar notas, programar el próximo
                      seguimiento y revisar el historial de actividades.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            <Card>
              <CardHeader
                title="Actividad reciente"
                description="Últimos registros de todo el equipo."
              />
              <CardContent>
                {activitiesQuery.isPending ? (
                  <p className="text-xs text-muted">Cargando actividad…</p>
                ) : activitiesQuery.isError ? (
                  <Alert variant="warning">
                    {getErrorMessage(activitiesQuery.error)}
                  </Alert>
                ) : (
                  <ActivityList
                    activities={activitiesQuery.data}
                    emptyMessage="Sin actividad reciente registrada."
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Card>
        <CardHeader
          title="Lista de no contacto"
          description="Contactos que no deben recibir mensajes (Ley 25.326 y pedidos directos)."
        />
        <CardContent>
          <SuppressionPanel />
        </CardContent>
      </Card>
    </div>
  );
}
