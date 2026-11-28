"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCompany } from "@/hooks/use-companies";
import type { Company, CompanyContact } from "@/lib/api/types";
import {
  contactVerificationLabel,
  isUnverifiedChannel,
  isVerifiedContact,
} from "@/features/prospects/contacts";
import { getErrorMessage } from "@/lib/errors";
import { formatDate, formatDateTime, pluralize } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DetailItem } from "@/components/ui/detail-item";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingBlock } from "@/components/ui/spinner";
import { CompanyStatusBadge } from "./company-status-badge";
import { CompanyEnrichmentPanel } from "./company-enrichment-panel";
import { CompanyFactsList } from "./company-facts-section";
import { OpportunityPanel } from "@/components/leads/opportunity-panel";
import { ConfirmWhatsAppForm } from "@/components/whatsapp/confirm-whatsapp-form";

const CONTACT_LABELS: Record<string, string> = {
  phone: "Teléfono",
  whatsapp: "WhatsApp",
  email: "Email",
  website_form: "Formulario web",
  social: "Red social",
  other: "Otro",
};

const SOURCE_LABELS: Record<string, string> = {
  osm: "OpenStreetMap",
  overpass: "OpenStreetMap / Overpass",
  website: "Sitio oficial",
  csv: "Importación CSV",
  manual: "Alta manual",
};

interface ContactRow {
  key: string;
  contact_type: string;
  value: string;
  label: string | null;
  is_primary: boolean;
  verification_status: string;
  do_not_contact: boolean;
  source_url: string | null;
  source_title: string | null;
  source_collected_at: string | null;
  source_confidence: number | null;
  verified_at: string | null;
}

function externalHref(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function ContactAnchor({ type, value }: { type: string; value: string }) {
  const kind = type.toLowerCase();
  if (kind === "email") {
    return (
      <a href={`mailto:${value}`} className="text-accent hover:underline">
        {value}
      </a>
    );
  }
  if (kind === "whatsapp") {
    return (
      <a
        href={`https://wa.me/${value.replace(/\D/g, "")}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Abre WhatsApp en una pestaña nueva. No se envía ningún mensaje."
        className="text-accent hover:underline"
      >
        {value}
      </a>
    );
  }
  if (kind === "phone") {
    return (
      <a
        href={`tel:${value.replace(/[^\d+]/g, "")}`}
        className="text-accent hover:underline"
      >
        {value}
      </a>
    );
  }
  if (/^https?:\/\//i.test(value)) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent hover:underline"
      >
        {value}
      </a>
    );
  }
  return <span>{value}</span>;
}

/**
 * Une los contactos guardados con los datos principales de la ficha, sin
 * duplicar valores ni inventar canales que no existen.
 */
function contactRows(company: Company): ContactRow[] {
  const rows: ContactRow[] = company.contacts.map((contact: CompanyContact) => ({
    key: contact.id || `${contact.contact_type}-${contact.value}`,
    contact_type: contact.contact_type,
    value: contact.value,
    label: contact.label,
    is_primary: contact.is_primary,
    verification_status: contact.verification_status,
    do_not_contact: contact.do_not_contact,
    source_url: contact.source_url,
    source_title: contact.source_title,
    source_collected_at: contact.source_collected_at,
    source_confidence: contact.source_confidence,
    verified_at: contact.verified_at,
  }));

  const addFromCompany = (type: string, value: string | null) => {
    if (!value || value.trim().length === 0) return;
    const exists = rows.some(
      (row) =>
        row.contact_type.toLowerCase() === type ||
        row.value.trim().toLowerCase() === value.trim().toLowerCase(),
    );
    if (exists) return;
    rows.push({
      key: `company-${type}`,
      contact_type: type,
      value,
      label: "Dato de la ficha",
      is_primary: true,
      verification_status: "unverified",
      do_not_contact: false,
      source_url: null,
      source_title: null,
      source_collected_at: null,
      source_confidence: null,
      verified_at: null,
    });
  };

  addFromCompany("phone", company.primary_phone);
  addFromCompany("email", company.primary_email);
  addFromCompany("whatsapp", company.whatsapp);

  return rows;
}

function verificationVariant(status: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized === "verified") return "success" as const;
  if (normalized === "invalid") return "danger" as const;
  if (normalized === "pending") return "warning" as const;
  if (normalized === "published") return "info" as const;
  return "neutral" as const;
}

function ContactList({ company }: { company: Company }) {
  const rows = contactRows(company);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted">
        No hay contactos guardados todavía. Podés investigar el sitio web de la
        empresa para detectar canales publicados.
      </p>
    );
  }

  const hasUnverifiedWhatsApp = rows.some(
    (row) =>
      row.contact_type.toLowerCase() === "whatsapp" &&
      isUnverifiedChannel(row.verification_status),
  );

  return (
    <>
      <ul className="divide-y divide-line">
        {rows.map((row) => (
          <li
            key={row.key}
            className="flex flex-wrap items-start justify-between gap-2 py-2 first:pt-0 last:pb-0"
          >
            <div className="min-w-0 space-y-0.5">
              <p className="text-xs font-medium text-muted">
                {CONTACT_LABELS[row.contact_type.toLowerCase()] ??
                  row.contact_type}
                {row.label ? ` · ${row.label}` : ""}
              </p>
              <p className="text-sm break-all text-ink">
                {row.do_not_contact ? (
                  <span title="Contacto en la lista de no contactar: se muestra solo como referencia.">
                    {row.value}
                  </span>
                ) : (
                  <ContactAnchor type={row.contact_type} value={row.value} />
                )}
              </p>
              {row.source_url ? (
                <p className="text-xs break-all text-muted">
                  Publicado en{" "}
                  <a
                    href={externalHref(row.source_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    {row.source_url}
                  </a>
                  {row.source_title ? ` · ${row.source_title}` : ""}
                  {row.source_collected_at
                    ? ` · ${formatDateTime(row.source_collected_at)}`
                    : ""}
                </p>
              ) : null}
              {isVerifiedContact(row.verification_status) && row.verified_at ? (
                <p className="text-xs text-muted">
                  Verificado manualmente el {formatDateTime(row.verified_at)}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-1.5">
              {row.do_not_contact ? (
                <Badge variant="danger">No contactar</Badge>
              ) : null}
              {row.is_primary ? <Badge variant="info">Principal</Badge> : null}
              <Badge variant={verificationVariant(row.verification_status)}>
                {contactVerificationLabel(row.verification_status)}
              </Badge>
            </div>
          </li>
        ))}
      </ul>
      {hasUnverifiedWhatsApp ? (
        <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-muted">
          Un WhatsApp publicado no confirma que la cuenta exista: el número está
          en la ficha, pero nadie verificó que esté activo. Confirmalo a mano
          antes de escribir.
        </p>
      ) : null}
    </>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function BackLink() {
  return (
    <div className="mb-4">
      <Link
        href="/prospects"
        className="text-xs font-medium text-accent hover:underline"
      >
        ← Volver a prospectos
      </Link>
    </div>
  );
}

export function CompanyDetailView({ id }: { id: string }) {
  const companyQuery = useCompany(id);

  if (companyQuery.isPending) {
    return (
      <>
        <BackLink />
        <LoadingBlock label="Cargando empresa…" />
      </>
    );
  }

  if (companyQuery.isError || !companyQuery.data) {
    return (
      <>
        <BackLink />
        <Alert variant="danger" title="No se pudo cargar la empresa">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              {companyQuery.isError
                ? getErrorMessage(companyQuery.error)
                : "La API no devolvió la empresa solicitada."}
            </span>
            <button
              type="button"
              onClick={() => void companyQuery.refetch()}
              className="text-xs font-semibold underline"
            >
              Reintentar
            </button>
          </div>
        </Alert>
      </>
    );
  }

  const company: Company = companyQuery.data;
  const primarySource = company.sources[0];

  return (
    <>
      <BackLink />

      <PageHeader
        title={company.name || "Empresa sin nombre"}
        description={
          company.description ||
          "Ficha de la empresa con los datos disponibles en la base."
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <CompanyStatusBadge status={company.discovery_status} />
        <span className="text-xs text-muted">
          Descubierta {formatDate(company.created_at)} ·{" "}
          {pluralize(company.source_count, "fuente", "fuentes")}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Section
            title="Información general"
            description="Datos tal como están guardados; no se completan campos faltantes."
          >
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="Sitio web">
                {company.website ? (
                  <a
                    href={externalHref(company.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    {company.website}
                  </a>
                ) : (
                  "—"
                )}
              </DetailItem>
              <DetailItem label="Provincia">{company.province ?? "—"}</DetailItem>
              <DetailItem label="Localidad">{company.locality ?? "—"}</DetailItem>
              <DetailItem label="Dirección">{company.address ?? "—"}</DetailItem>
              <DetailItem label="Estado">
                <CompanyStatusBadge status={company.discovery_status} />
              </DetailItem>
              <DetailItem label="Alta en la base">
                {formatDateTime(company.created_at)}
              </DetailItem>
            </dl>
          </Section>

          <div id="investigacion" className="scroll-mt-24">
            <Section
              title="Investigación del sitio web"
              description="Solo admin/owner. Se descarga el sitio público de la empresa y se registra la evidencia de cada dato agregado."
            >
              <CompanyEnrichmentPanel company={company} />
            </Section>
          </div>

          {company.facts.length > 0 ? (
            <Section
              title="Datos extraídos del sitio"
              description="Servicios, actividades y páginas detectadas en la última investigación. Cada dato conserva su confianza y su fuente."
            >
              <CompanyFactsList facts={company.facts} />
            </Section>
          ) : null}

          <Section
            title="Canales de contacto"
            description="Enlaces de contacto tal como fueron publicados. Abrir un enlace no envía nada."
          >
            <ContactList company={company} />
            {!company.whatsapp ? (
              <div className="mt-4 border-t border-line pt-4">
                <ConfirmWhatsAppForm
                  companyId={company.id}
                  defaultPhone={company.primary_phone ?? ""}
                />
              </div>
            ) : null}
          </Section>

          <Section
            title="Fuentes y evidencias"
            description="Cada dato debería poder rastrearse a su fuente original."
          >
            {company.sources.length === 0 ? (
              <p className="text-sm text-muted">
                No hay fuentes registradas para esta empresa.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {company.sources.map((source) => (
                  <li
                    key={source.id || source.source_url}
                    className="space-y-1 py-2 first:pt-0 last:pb-0"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="neutral">
                        {SOURCE_LABELS[source.source_type] ?? source.source_type}
                      </Badge>
                      {source.title ? (
                        <span className="text-sm font-medium text-ink">
                          {source.title}
                        </span>
                      ) : null}
                      <span className="text-xs text-muted">
                        {formatDateTime(source.collected_at)}
                      </span>
                      {source.confidence !== null ? (
                        <span className="text-xs text-muted">
                          Confianza {Math.round(source.confidence * 100)}%
                        </span>
                      ) : null}
                    </div>
                    {source.source_url ? (
                      <a
                        href={externalHref(source.source_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs break-all text-accent hover:underline"
                      >
                        {source.source_url}
                      </a>
                    ) : null}
                    {source.evidence_excerpt ? (
                      <p className="text-xs leading-relaxed text-muted">
                        {source.evidence_excerpt}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <div className="space-y-4">
          <Section
            title="Rubros"
            description="Rubros asignados a la empresa en la base."
          >
            {company.sectors.length === 0 ? (
              <p className="text-sm text-muted">Sin rubros asignados.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {company.sectors.map((sector) => (
                  <Badge key={sector.slug} variant="info">
                    {sector.name}
                  </Badge>
                ))}
              </div>
            )}
          </Section>

          <Section title="Procedencia" description="De dónde salió el registro.">
            <dl className="space-y-3">
              <DetailItem label="Origen">
                {primarySource
                  ? (SOURCE_LABELS[primarySource.source_type] ??
                    primarySource.source_type)
                  : company.discovery_status === "manual"
                    ? "Alta manual"
                    : "Sin fuente registrada"}
              </DetailItem>
              <DetailItem label="Estado de descubrimiento">
                {company.raw_discovery_status}
              </DetailItem>
              <DetailItem label="Fuentes registradas">
                {company.source_count}
              </DetailItem>
              <DetailItem label="Contactos guardados">
                {company.contacts.length}
              </DetailItem>
              <DetailItem label="Última investigación del sitio">
                {company.last_enriched_at
                  ? formatDateTime(company.last_enriched_at)
                  : "Sin investigar"}
              </DetailItem>
            </dl>
          </Section>
        </div>
      </div>

      <div id="oportunidad" className="mt-4 scroll-mt-24">
        <Card>
          <CardHeader
            title="Oportunidad comercial"
            description="Compatibilidad, confianza, mensajes y actividades reales de la base. Los mensajes requieren aprobación humana y nunca se envían solos."
            action={
              <Link
                href="/crm"
                className="text-xs font-medium text-accent hover:underline"
              >
                Ver CRM
              </Link>
            }
          />
          <CardContent>
            <OpportunityPanel company={company} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
