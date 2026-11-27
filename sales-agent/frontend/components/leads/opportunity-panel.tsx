"use client";

import { useState } from "react";
import Link from "next/link";
import type { Company, Lead, Product } from "@/lib/api/types";
import { useCreateLead, useLeads, useScoreLead } from "@/hooks/use-leads";
import { useLeadActivities, useCreateLeadActivity } from "@/hooks/use-activities";
import { useProducts } from "@/hooks/use-products";
import { ACTIVITY_TYPES_FOR_UI, activityTypeLabel } from "@/features/activities/labels";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTime } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Button, buttonStyles } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { LoadingBlock, Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { ActivityList } from "@/components/activities/activity-list";
import { LeadMessagesSection } from "@/components/messages/message-list";
import { MessageComposer } from "@/components/messages/message-composer";
import { ScoreSummary } from "./score-card";
import { LeadStatusBadge } from "./lead-status-badge";
import { LeadNotesEditor } from "./lead-notes-editor";

/** Producto por defecto de la prospección: DOVEXO si está configurado. */
export function findDefaultProduct(products: Product[]): Product | null {
  return (
    products.find((product) => product.slug.toLowerCase() === "dovexo") ??
    products.find((product) => product.name.toLowerCase().includes("dovexo")) ??
    products.find((product) => product.is_active) ??
    products[0] ??
    null
  );
}

/** Oportunidad de la empresa para el producto por defecto (o la primera). */
function pickLead(leads: Lead[], productId: string | undefined): Lead | null {
  if (productId) {
    const match = leads.find((lead) => lead.product_id === productId);
    if (match) return match;
  }
  return leads[0] ?? null;
}

function LeadActivitiesSection({ lead }: { lead: Lead }) {
  const activitiesQuery = useLeadActivities(lead.id);
  const createActivity = useCreateLeadActivity(lead.id);
  const [activityType, setActivityType] = useState<string>("note");
  const [description, setDescription] = useState("");

  return (
    <div className="space-y-4">
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (description.trim().length === 0) return;
          createActivity.mutate(
            { activity_type: activityType, description: description.trim() },
            {
              onSuccess: () => {
                setDescription("");
                setActivityType("note");
              },
            },
          );
        }}
      >
        {createActivity.isError ? (
          <Alert variant="danger">{getErrorMessage(createActivity.error)}</Alert>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
          <Field label="Tipo" htmlFor="activity-type">
            <Select
              id="activity-type"
              value={activityType}
              onChange={(event) => setActivityType(event.target.value)}
            >
              {ACTIVITY_TYPES_FOR_UI.map((type) => (
                <option key={type} value={type}>
                  {activityTypeLabel(type)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Descripción" htmlFor="activity-description">
            <Textarea
              id="activity-description"
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Llamada realizada, respuesta recibida…"
            />
          </Field>
        </div>
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={createActivity.isPending}>
            {createActivity.isPending ? (
              <>
                <Spinner label="Registrando" />
                Registrando…
              </>
            ) : (
              "Registrar actividad"
            )}
          </Button>
        </div>
      </form>

      {activitiesQuery.isPending ? (
        <LoadingBlock label="Cargando actividades…" />
      ) : activitiesQuery.isError ? (
        <Alert variant="danger" title="No se pudieron cargar las actividades">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{getErrorMessage(activitiesQuery.error)}</span>
            <button
              type="button"
              onClick={() => void activitiesQuery.refetch()}
              className="text-xs font-semibold underline"
            >
              Reintentar
            </button>
          </div>
        </Alert>
      ) : (
        <ActivityList
          activities={activitiesQuery.data}
          emptyMessage="Sin actividades registradas para esta oportunidad."
        />
      )}
    </div>
  );
}

/**
 * Oportunidad comercial de la empresa: creación, scoring, notas, mensajes y
 * actividades reales del backend. No inventa puntajes ni mensajes.
 */
export function OpportunityPanel({ company }: { company: Company }) {
  const productsQuery = useProducts();
  const leadsQuery = useLeads({ company_id: company.id, limit: 50 });
  const createLead = useCreateLead();
  const scoreLead = useScoreLead();

  const products = productsQuery.data ?? [];
  const defaultProduct = findDefaultProduct(products);
  const leads = leadsQuery.data?.items ?? [];
  const lead = pickLead(leads, defaultProduct?.id);

  if (leadsQuery.isPending) {
    return <LoadingBlock label="Cargando oportunidad…" />;
  }

  if (leadsQuery.isError) {
    return (
      <Alert variant="danger" title="No se pudo cargar la oportunidad">
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
    );
  }

  if (!lead) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">
          Esta empresa todavía no tiene una oportunidad comercial. Se crea por
          producto: DOVEXO es el producto por defecto.
        </p>
        {products.length === 0 ? (
          <p className="text-sm text-muted">
            No hay productos configurados.{" "}
            <Link href="/products" className="text-accent hover:underline">
              Creá un producto
            </Link>{" "}
            antes de abrir una oportunidad.
          </p>
        ) : null}
        {createLead.isError ? (
          <Alert variant="danger" title="No se pudo crear la oportunidad">
            {getErrorMessage(createLead.error)}
          </Alert>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            disabled={!defaultProduct || createLead.isPending}
            onClick={() => {
              if (!defaultProduct) return;
              createLead.mutate({
                companyId: company.id,
                product_id: defaultProduct.id,
              });
            }}
          >
            {createLead.isPending ? (
              <>
                <Spinner label="Creando" />
                Creando…
              </>
            ) : (
              `Crear oportunidad${defaultProduct ? ` · ${defaultProduct.name}` : ""}`
            )}
          </Button>
          <span className="text-xs text-muted">
            Después de crearla podés calcular compatibilidad y generar mensajes.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <LeadStatusBadge status={lead.status} rawStatus={lead.raw_status} />
        <span className="text-xs text-muted">
          {lead.product_name ?? defaultProduct?.name ?? "Producto sin definir"} ·{" "}
          {lead.last_activity_at
            ? `Última actividad ${formatDateTime(lead.last_activity_at)}`
            : "Sin actividad registrada"}
        </span>
        <Link
          href={`/crm?lead=${encodeURIComponent(lead.id)}`}
          className="text-xs font-medium text-accent hover:underline"
        >
          Gestionar en CRM
        </Link>
      </div>

      {scoreLead.isError ? (
        <Alert variant="danger" title="No se pudo calcular el score">
          {getErrorMessage(scoreLead.error)}
        </Alert>
      ) : null}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">
            Evaluación comercial
          </h3>
          <Button
            size="sm"
            variant="secondary"
            disabled={scoreLead.isPending}
            onClick={() => scoreLead.mutate(lead.id)}
          >
            {scoreLead.isPending ? (
              <>
                <Spinner label="Calculando" />
                Calculando…
              </>
            ) : (
              "Calcular score"
            )}
          </Button>
        </div>
        <ScoreSummary
          score={lead.score}
          confidence={lead.confidence}
          reasons={lead.reasons}
          breakdown={lead.breakdown}
          evaluatedAt={lead.updated_at}
        />
      </div>

      <div className="border-t border-line pt-4">
        <LeadNotesEditor
          key={`${lead.id}-${lead.assigned_notes}`}
          lead={lead}
          idPrefix="company"
        />
      </div>

      <div className="border-t border-line pt-4">
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
          Generar mensaje
        </h3>
        <MessageComposer leadId={lead.id} />
      </div>

      <div className="border-t border-line pt-4">
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
          Mensajes
        </h3>
        <LeadMessagesSection lead={lead} />
      </div>

      <div className="border-t border-line pt-4">
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
          Actividades
        </h3>
        <LeadActivitiesSection lead={lead} />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <Link
          href={`/messages?lead=${encodeURIComponent(lead.id)}`}
          className={buttonStyles({ variant: "secondary", size: "sm" })}
        >
          Abrir en Mensajes
        </Link>
      </div>
    </div>
  );
}
