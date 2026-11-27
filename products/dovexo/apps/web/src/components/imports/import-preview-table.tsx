import { Badge } from "@/components/ui/badge";
import type { CustomerImportPreview } from "@/lib/import-api";
import {
  IMPORT_ROW_STATUS_LABELS,
  IMPORT_ROW_STATUS_VARIANTS,
  importRowName,
  importRowStatus,
} from "@/lib/import-utils";
import { cn } from "@/lib/utils";

type ImportPreviewTableProps = {
  preview: CustomerImportPreview;
};

const SUMMARY_TILES = [
  { key: "total", label: "Filas", tone: "neutral" },
  { key: "valid", label: "Válidas", tone: "success" },
  { key: "invalid", label: "Con errores", tone: "danger" },
  { key: "duplicates", label: "Duplicadas", tone: "warning" },
] as const;

const TILE_TONE_CLASSES = {
  neutral: "text-text",
  success: "text-success-strong",
  danger: "text-danger-strong",
  warning: "text-warning-strong",
} as const;

export function ImportPreviewTable({ preview }: ImportPreviewTableProps) {
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SUMMARY_TILES.map((tile) => (
          <div key={tile.key} className="border-border bg-surface rounded-ds-md border px-4 py-3">
            <dt className="text-text-2 text-xs">{tile.label}</dt>
            <dd
              className={cn(
                "numeric mt-1 font-display text-2xl font-semibold",
                TILE_TONE_CLASSES[tile.tone],
              )}
            >
              {preview.summary[tile.key]}
            </dd>
          </div>
        ))}
      </dl>

      <div className="border-border max-h-[28rem] overflow-auto rounded-ds-md border">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Vista previa de las filas del archivo</caption>
          <thead className="bg-surface-2 text-text text-label sticky top-0 z-10">
            <tr>
              <th scope="col" className="hidden px-3 py-2.5 font-semibold sm:table-cell">
                Línea
              </th>
              <th scope="col" className="px-3 py-2.5 font-semibold">
                Nombre
              </th>
              <th scope="col" className="hidden px-3 py-2.5 font-semibold sm:table-cell">
                Email
              </th>
              <th scope="col" className="hidden px-3 py-2.5 font-semibold lg:table-cell">
                Teléfono
              </th>
              <th scope="col" className="px-3 py-2.5 font-semibold">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {preview.rows.map((row) => {
              const status = importRowStatus(row);
              return (
                <tr key={row.line} className="hover:bg-surface-2/50 align-top transition-colors">
                  <td className="text-text-2 numeric hidden px-3 py-2.5 text-xs sm:table-cell">
                    {row.line}
                  </td>
                  <td className="text-text px-3 py-2.5 font-medium">
                    <span className="block">{importRowName(row)}</span>
                    <span className="text-text-2 mt-0.5 block text-xs sm:hidden">
                      {row.line}
                      {row.data.email ? ` · ${row.data.email}` : ""}
                    </span>
                  </td>
                  <td className="text-text-2 hidden max-w-[12rem] truncate px-3 py-2.5 sm:table-cell">
                    {row.data.email || "—"}
                  </td>
                  <td className="text-text-2 hidden px-3 py-2.5 lg:table-cell">
                    {row.data.phone || "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge variant={IMPORT_ROW_STATUS_VARIANTS[status]}>
                      {IMPORT_ROW_STATUS_LABELS[status]}
                    </Badge>
                    {row.errors.length > 0 && (
                      <ul className="text-danger mt-1 space-y-0.5 text-xs">
                        {row.errors.map((error, index) => (
                          <li key={`${row.line}-${index}`}>{error}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
