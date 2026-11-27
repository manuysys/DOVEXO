import Link from "next/link";
import type { ProvinceOption, SearchRun, Sector } from "@/lib/api/types";
import { sectorNames } from "@/features/search/labels";
import { formatDateTime } from "@/lib/utils";
import { SearchRunStatusBadge } from "./search-run-status-badge";

export function SearchHistoryTable({
  runs,
  provinces,
  sectors = [],
}: {
  runs: SearchRun[];
  provinces: ReadonlyArray<ProvinceOption>;
  sectors?: Sector[];
}) {
  const provinceNames = new Map(
    provinces.map((province) => [province.code, province.name]),
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <table className="w-full min-w-[960px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-canvas/60 text-left text-xs font-semibold tracking-wide text-muted uppercase">
            <th className="px-4 py-3">Búsqueda</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Provincia</th>
            <th className="px-4 py-3">Rubros</th>
            <th className="px-4 py-3 text-right">Registros</th>
            <th className="px-4 py-3 text-right">Nuevas</th>
            <th className="px-4 py-3 text-right">Duplicados</th>
            <th className="px-4 py-3">Iniciada</th>
            <th className="px-4 py-3">Finalizada</th>
            <th className="px-4 py-3 text-right">Resultados</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {runs.map((run) => {
            const provinceLabel =
              run.province_name ??
              provinceNames.get(run.province_code) ??
              run.province_code ??
              "—";
            return (
              <tr key={run.id} className="align-top">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">#{run.id || "sin id"}</p>
                  <p className="text-xs text-muted">{run.provider || "—"}</p>
                </td>
                <td className="px-4 py-3">
                  <SearchRunStatusBadge
                    status={run.status}
                    rawStatus={run.raw_status}
                  />
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  {provinceLabel || "—"}
                </td>
                <td className="max-w-56 px-4 py-3 text-xs text-muted">
                  {run.sector_slugs.length > 0
                    ? sectorNames(run.sector_slugs, sectors).join(", ")
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right text-xs text-ink tabular-nums">
                  {run.records_found}
                </td>
                <td className="px-4 py-3 text-right text-xs text-ink tabular-nums">
                  {run.new_companies}
                </td>
                <td className="px-4 py-3 text-right text-xs text-muted tabular-nums">
                  {run.duplicates}
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  {formatDateTime(run.started_at ?? run.created_at)}
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  {formatDateTime(run.finished_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/prospects?search_run_id=${encodeURIComponent(run.id)}`}
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    Ver empresas
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
