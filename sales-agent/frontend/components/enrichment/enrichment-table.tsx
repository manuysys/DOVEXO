import Link from "next/link";
import type { Company } from "@/lib/api/types";
import { formatDateTime } from "@/lib/utils";
import { CompanyStatusBadge } from "@/components/prospects/company-status-badge";

function externalHref(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function displayHost(value: string): string {
  return value.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

export interface EnrichmentTableProps {
  companies: Company[];
  selectedIds: ReadonlySet<string>;
  disabled?: boolean;
  allSelected: boolean;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
}

/**
 * Empresas con sitio web para elegir cuáles investigar. No hay acciones de
 * escritura acá: solo selección y enlace a la ficha.
 */
export function EnrichmentTable({
  companies,
  selectedIds,
  disabled = false,
  allSelected,
  onToggle,
  onToggleAll,
}: EnrichmentTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <table className="w-full min-w-[960px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-canvas/60 text-left text-xs font-semibold tracking-wide text-muted uppercase">
            <th className="w-10 px-4 py-3">
              {disabled ? (
                <span aria-hidden="true">—</span>
              ) : (
                <input
                  type="checkbox"
                  checked={allSelected}
                  disabled={companies.length === 0}
                  onChange={onToggleAll}
                  aria-label="Seleccionar todas las empresas de esta página"
                  className="h-4 w-4 rounded border-line text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed"
                />
              )}
            </th>
            <th className="px-4 py-3">Empresa</th>
            <th className="px-4 py-3">Ubicación</th>
            <th className="px-4 py-3">Rubro</th>
            <th className="px-4 py-3">Sitio web</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Última investigación</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {companies.map((company) => {
            const selected = selectedIds.has(company.id);
            return (
              <tr
                key={company.id}
                className={selected ? "bg-accent-soft/40" : undefined}
              >
                <td className="px-4 py-3">
                  {disabled ? (
                    <span aria-hidden="true" className="text-muted">
                      —
                    </span>
                  ) : (
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggle(company.id)}
                      aria-label={`Seleccionar ${company.name || "empresa sin nombre"}`}
                      className="h-4 w-4 rounded border-line text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed"
                    />
                  )}
                </td>
                <td className="max-w-72 px-4 py-3">
                  <Link
                    href={`/prospects/${company.id}`}
                    className="font-medium text-ink hover:text-accent"
                  >
                    {company.name || "Empresa sin nombre"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  {[company.locality, company.province]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </td>
                <td className="max-w-48 px-4 py-3 text-xs text-muted">
                  {company.sectors.length > 0
                    ? company.sectors
                        .slice(0, 2)
                        .map((sector) => sector.name)
                        .join(", ")
                    : "—"}
                </td>
                <td className="max-w-56 px-4 py-3 text-xs">
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
                <td className="px-4 py-3">
                  <CompanyStatusBadge status={company.discovery_status} />
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  {company.last_enriched_at
                    ? formatDateTime(company.last_enriched_at)
                    : "Sin investigar"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/prospects/${company.id}#investigacion`}
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    Ver ficha
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
