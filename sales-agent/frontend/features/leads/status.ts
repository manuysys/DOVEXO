import type { BadgeVariant } from "@/components/ui/badge";
import type { LeadStatus } from "@/lib/api/types";

/** Estados del lead definidos en el SPEC §14, en orden de pipeline. */
export const LEAD_STATUS_ORDER: Array<Exclude<LeadStatus, "unknown">> = [
  "new",
  "researched",
  "pending_review",
  "approved",
  "contacted",
  "replied",
  "interested",
  "meeting_scheduled",
  "proposal_sent",
  "customer",
  "not_interested",
  "invalid",
  "do_not_contact",
];

export const LEAD_STATUS_LABELS: Record<
  Exclude<LeadStatus, "unknown">,
  string
> = {
  new: "Nuevo",
  researched: "Investigado",
  pending_review: "Pendiente de revisión",
  approved: "Aprobado",
  contacted: "Contactado",
  replied: "Respondió",
  interested: "Interesado",
  meeting_scheduled: "Reunión agendada",
  proposal_sent: "Propuesta enviada",
  customer: "Cliente",
  not_interested: "No interesado",
  invalid: "Inválido",
  do_not_contact: "No contactar",
};

const STATUS_VARIANTS: Record<
  Exclude<LeadStatus, "unknown">,
  BadgeVariant
> = {
  new: "neutral",
  researched: "info",
  pending_review: "warning",
  approved: "info",
  contacted: "info",
  replied: "success",
  interested: "success",
  meeting_scheduled: "success",
  proposal_sent: "success",
  customer: "success",
  not_interested: "neutral",
  invalid: "danger",
  do_not_contact: "danger",
};

export function leadStatusLabel(status: LeadStatus | string): string {
  const key = status.trim().toLowerCase();
  return (
    LEAD_STATUS_LABELS[key as Exclude<LeadStatus, "unknown">] ??
    (key.length > 0 ? status : "Sin estado")
  );
}

export function leadStatusVariant(status: LeadStatus | string): BadgeVariant {
  return STATUS_VARIANTS[status as Exclude<LeadStatus, "unknown">] ?? "neutral";
}

/** Estados que cuentan como "en conversación" para la bandeja de mensajes. */
export const ACTIVE_LEAD_STATUSES: LeadStatus[] = [
  "pending_review",
  "approved",
  "contacted",
  "replied",
  "interested",
  "meeting_scheduled",
  "proposal_sent",
  "customer",
];

export interface PipelineStage {
  key: string;
  label: string;
  statuses: LeadStatus[];
  description: string;
}

/** Agrupación legible del pipeline para columnas (13 estados → 8 etapas). */
export const PIPELINE_STAGES: PipelineStage[] = [
  {
    key: "inbox",
    label: "Nuevos e investigados",
    statuses: ["new", "researched"],
    description: "Sin revisar o con investigación inicial.",
  },
  {
    key: "review",
    label: "Pendientes de revisión",
    statuses: ["pending_review"],
    description: "Esperan aprobación humana.",
  },
  {
    key: "approved",
    label: "Aprobados",
    statuses: ["approved"],
    description: "Listos para preparar el contacto.",
  },
  {
    key: "contacted",
    label: "Contactados",
    statuses: ["contacted"],
    description: "Se inició el contacto manual.",
  },
  {
    key: "engaged",
    label: "Respondieron o interesados",
    statuses: ["replied", "interested"],
    description: "Hay respuesta o interés explícito.",
  },
  {
    key: "meetings",
    label: "Reunión o propuesta",
    statuses: ["meeting_scheduled", "proposal_sent"],
    description: "Reunión agendada o propuesta enviada.",
  },
  {
    key: "customer",
    label: "Clientes",
    statuses: ["customer"],
    description: "Oportunidad ganada.",
  },
  {
    key: "closed",
    label: "Cerrados sin avance",
    statuses: ["not_interested", "invalid", "do_not_contact"],
    description: "No interesado, inválido o no contactar.",
  },
];

export function leadStageKey(status: LeadStatus | string): string | null {
  const normalized = status.trim().toLowerCase();
  const stage = PIPELINE_STAGES.find((item) =>
    item.statuses.includes(normalized as LeadStatus),
  );
  return stage?.key ?? null;
}
