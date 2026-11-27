import Link from "next/link";
import type { ReactNode } from "react";
import type { ImportBatch } from "@/lib/api/types";
import { apiHref } from "@/lib/api/client";
import {
  importBatchStatusLabel,
  importBatchStatusVariant,
} from "@/features/imports/limits";
import { formatDateTime, pluralize } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function ImportHistoryTable({ batches }: { batches: ImportBatch[] }) {
  const hasReports = batches.some((batch) => Boolean(batch.report_url));

  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <table className="w-full min-w-[900px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-canvas/60 text-left text-xs font-semibold tracking-wide text-muted uppercase">
            <th className="px-4 py-3">Lote</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3 text-right">Filas</th>
            <th className="px-4 py-3 text-right">Creadas</th>
            <th className="px-4 py-3 text-right">Omitidas</th>
            <th className="px-4 py-3 text-right">Duplicadas</th>
            {hasReports ? <th className="px-4 py-3">Informe</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {batches.map((batch) => (
            <tr key={batch.id} className="align-top">
              <td className="max-w-64 px-4 py-3">
                <p className="font-medium text-ink">
                  {batch.filename || "Archivo sin nombre"}
                </p>
                <p className="text-xs text-muted">#{batch.id || "sin id"}</p>
                {batch.errors.length > 0 ? (
                  <p className="mt-0.5 text-xs text-danger-strong">
                    {pluralize(batch.errors.length, "error", "errores")}
                  </p>
                ) : null}
              </td>
              <td className="px-4 py-3">
                <Badge variant={importBatchStatusVariant(batch.status)}>
                  {importBatchStatusLabel(batch.status)}
                </Badge>
              </td>
              <td className="px-4 py-3 text-xs text-muted">
                {formatDateTime(batch.confirmed_at ?? batch.imported_at)}
              </td>
              <td className="px-4 py-3 text-right text-xs text-ink tabular-nums">
                {batch.total_rows}
              </td>
              <td className="px-4 py-3 text-right text-xs text-success-strong tabular-nums">
                {batch.created}
              </td>
              <td className="px-4 py-3 text-right text-xs text-muted tabular-nums">
                {batch.skipped}
              </td>
              <td className="px-4 py-3 text-right text-xs text-muted tabular-nums">
                {batch.duplicates}
              </td>
              {hasReports ? (
                <td className="px-4 py-3 text-xs">
                  {batch.report_url ? (
                    <a
                      href={apiHref(batch.report_url)}
                      className="font-medium text-accent hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Descargar
                    </a>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ImportHistoryEmpty({ action }: { action?: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-line bg-canvas/60 px-6 py-8 text-center text-sm text-muted">
      <p className="font-medium text-ink">Todavía no hay importaciones</p>
      <p className="mt-1 text-xs leading-relaxed">
        Cada lote confirmado queda registrado acá con sus filas creadas,
        omitidas y duplicadas.{" "}
        <Link href="/prospects" className="text-accent hover:underline">
          Ver empresas
        </Link>
        .
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
