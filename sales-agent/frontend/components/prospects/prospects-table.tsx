import Link from "next/link";
import type { Company } from "@/lib/api/types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CompanyStatusBadge } from "./company-status-badge";

function externalHref(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function displayHost(value: string): string {
  return value.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

function phoneHref(value: string): string {
  return `tel:${value.replace(/[^\d+]/g, "")}`;
}

function whatsappHref(value: string): string {
  return `https://wa.me/${value.replace(/\D/g, "")}`;
}

export interface ProspectsTableProps {
  companies: Company[];
  /** Marca o descarta una empresa; el backend guarda el nuevo estado. */
  onStatusChange?: (
    company: Company,
    status: "discovered" | "rejected",
  ) => void;
  updatingId?: string | null;
}

function StatusActions({
  company,
  onStatusChange,
  updatingId,
}: {
  company: Company;
  onStatusChange?: ProspectsTableProps["onStatusChange"];
  updatingId?: string | null;
}) {
  if (!onStatusChange) {
    return <span className="text-xs text-muted">—</span>;
  }
  const status = company.discovery_status.trim().toLowerCase();
  const busy = updatingId === company.id;

  return (
    <div className="flex justify-end gap-1">
      {status === "possible_duplicate" ||
      status === "possible-duplicate" ||
      status === "duplicate" ? (
        <Button
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() => onStatusChange(company, "discovered")}
        >
          No es duplicado
        </Button>
      ) : null}
      {status === "rejected" ? (
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={() => onStatusChange(company, "discovered")}
        >
          Restaurar
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={() => onStatusChange(company, "rejected")}
        >
          Descartar
        </Button>
      )}
    </div>
  );
}

export function ProspectsTable({
  companies,
  onStatusChange,
  updatingId = null,
}: ProspectsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <table className="w-full min-w-[1180px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-canvas/60 text-left text-xs font-semibold tracking-wide text-muted uppercase">
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Rubro</th>
            <th className="px-4 py-3">Localidad</th>
            <th className="px-4 py-3">Provincia</th>
            <th className="px-4 py-3">Web</th>
            <th className="px-4 py-3">Contacto</th>
            <th className="px-4 py-3">WhatsApp</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Descubierta</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {companies.map((company) => (
            <tr key={company.id} className="align-top">
              <td className="max-w-72 px-4 py-3">
                <Link
                  href={`/prospects/${company.id}`}
                  className="font-medium text-ink hover:text-accent"
                >
                  {company.name || "Empresa sin nombre"}
                </Link>
                {company.description ? (
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted">
                    {company.description}
                  </p>
                ) : null}
              </td>
              <td className="max-w-48 px-4 py-3 text-xs text-muted">
                {company.sectors.length > 0
                  ? company.sectors
                      .slice(0, 2)
                      .map((sector) => sector.name)
                      .join(", ")
                  : "—"}
              </td>
              <td className="px-4 py-3 text-xs text-muted">
                {company.locality ?? "—"}
              </td>
              <td className="px-4 py-3 text-xs text-muted">
                {company.province ?? "—"}
              </td>
              <td className="max-w-48 px-4 py-3 text-xs">
                {company.website ? (
                  <a
                    href={externalHref(company.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    {displayHost(company.website)}
                  </a>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
              <td className="max-w-48 px-4 py-3 text-xs">
                {company.primary_email ? (
                  <a
                    href={`mailto:${company.primary_email}`}
                    className="text-accent hover:underline"
                  >
                    {company.primary_email}
                  </a>
                ) : company.primary_phone ? (
                  <a
                    href={phoneHref(company.primary_phone)}
                    className="text-accent hover:underline"
                  >
                    {company.primary_phone}
                  </a>
                ) : (
                  <span className="text-muted">Sin contacto</span>
                )}
              </td>
              <td className="px-4 py-3 text-xs">
                {company.whatsapp ? (
                  <a
                    href={whatsappHref(company.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Abre WhatsApp en una pestaña nueva. No se envía ningún mensaje."
                    className="text-accent hover:underline"
                  >
                    {company.whatsapp}
                  </a>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <CompanyStatusBadge status={company.discovery_status} />
              </td>
              <td className="px-4 py-3 text-xs text-muted">
                {formatDate(company.created_at)}
              </td>
              <td className="px-4 py-3">
                <StatusActions
                  company={company}
                  onStatusChange={onStatusChange}
                  updatingId={updatingId}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
