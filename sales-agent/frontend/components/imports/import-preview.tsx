"use client";

import type {
  ImportPreview,
  ImportPreviewRow,
  Sector,
} from "@/lib/api/types";
import {
  importRowStatusLabel,
  importRowStatusVariant,
} from "@/features/imports/limits";
import { sectorNames } from "@/features/search/labels";
import { pluralize } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

function CountBlock({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "danger" | "warning";
}) {
  const valueClass =
    tone === "success"
      ? "text-success-strong"
      : tone === "danger"
        ? "text-danger-strong"
        : tone === "warning"
          ? "text-warning-strong"
          : "text-ink";
  return (
    <div className="rounded-md border border-line bg-canvas/60 px-4 py-3">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

function rowValue(value: string | null): string {
  return value && value.trim().length > 0 ? value : "—";
}

function PreviewRow({
  row,
  sectors,
}: {
  row: ImportPreviewRow;
  sectors: Sector[];
}) {
  return (
    <tr className="align-top">
      <td className="px-3 py-2 text-xs text-muted tabular-nums">
        {row.row_number || "—"}
      </td>
      <td className="max-w-56 px-3 py-2 text-xs font-medium text-ink">
        {rowValue(row.name)}
      </td>
      <td className="px-3 py-2 text-xs text-muted">
        {rowValue(row.province)}
      </td>
      <td className="px-3 py-2 text-xs text-muted">
        {rowValue(row.locality)}
      </td>
      <td className="max-w-44 px-3 py-2 text-xs break-all text-muted">
        {rowValue(row.website)}
      </td>
      <td className="max-w-44 px-3 py-2 text-xs break-all text-muted">
        {rowValue(row.email ?? row.phone)}
      </td>
      <td className="max-w-44 px-3 py-2 text-xs text-muted">
        {row.sectors.length > 0
          ? sectorNames(row.sectors, sectors).join(", ")
          : "—"}
      </td>
      <td className="px-3 py-2">
        <Badge variant={importRowStatusVariant(row.status)}>
          {importRowStatusLabel(row.status)}
        </Badge>
      </td>
      <td className="max-w-56 px-3 py-2 text-xs text-danger-strong">
        {row.errors.length > 0 ? row.errors.join(" · ") : "—"}
      </td>
    </tr>
  );
}

export interface ImportPreviewPanelProps {
  preview: ImportPreview;
  sectors?: Sector[];
  onConfirm: () => void;
  onDiscard: () => void;
  isConfirming?: boolean;
  confirmError?: string | null;
}

export function ImportPreviewPanel({
  preview,
  sectors = [],
  onConfirm,
  onDiscard,
  isConfirming = false,
  confirmError = null,
}: ImportPreviewPanelProps) {
  const canConfirm = preview.valid_rows > 0;
  const omitted = preview.invalid_rows + preview.duplicates;

  return (
    <Card>
      <CardHeader
        title={`Previsualización${preview.filename ? ` · ${preview.filename}` : ""}`}
        description="Revisá las filas antes de confirmar. Solo se crean las válidas; las que tienen errores o ya existen se omiten."
        action={
          <Button variant="ghost" size="sm" onClick={onDiscard}>
            Descartar
          </Button>
        }
      />
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-4">
          <CountBlock label="Filas totales" value={preview.total_rows} />
          <CountBlock
            label="Válidas"
            value={preview.valid_rows}
            tone="success"
          />
          <CountBlock
            label="Con errores"
            value={preview.invalid_rows}
            tone="danger"
          />
          <CountBlock
            label="Duplicadas"
            value={preview.duplicates}
            tone="warning"
          />
        </div>

        {confirmError ? (
          <Alert variant="danger" title="No se pudo confirmar la importación">
            {confirmError}
          </Alert>
        ) : null}

        {preview.invalid_rows > 0 || preview.duplicates > 0 ? (
          <Alert variant="warning">
            Se van a omitir {pluralize(omitted, "fila", "filas")} (con errores o
            duplicadas). Podés corregir el CSV y volver a subirlo.
          </Alert>
        ) : null}

        {preview.errors.length > 0 ? (
          <div>
            <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">
              Errores del archivo
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-danger-strong">
              {preview.errors.map((error, index) => (
                <li key={`${error.row_number}-${index}`}>
                  {error.row_number > 0 ? `Fila ${error.row_number}: ` : ""}
                  {error.message}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {preview.preview.length === 0 ? (
          <p className="rounded-md border border-dashed border-line bg-canvas/60 px-4 py-6 text-center text-sm text-muted">
            El archivo no devolvió filas para previsualizar.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-line">
            <table className="w-full min-w-[980px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line bg-canvas/60 text-left text-xs font-semibold tracking-wide text-muted uppercase">
                  <th className="px-3 py-2">Fila</th>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Provincia</th>
                  <th className="px-3 py-2">Localidad</th>
                  <th className="px-3 py-2">Web</th>
                  <th className="px-3 py-2">Contacto</th>
                  <th className="px-3 py-2">Rubros</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Errores</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {preview.preview.map((row, index) => (
                  <PreviewRow
                    key={`${row.row_number}-${row.name}-${index}`}
                    row={row}
                    sectors={sectors}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <p className="text-xs text-muted">
            {canConfirm
              ? `Se van a crear ${pluralize(preview.valid_rows, "empresa", "empresas")} al confirmar.`
              : "No hay filas válidas para importar: corregí el archivo."}
          </p>
          <Button
            type="button"
            disabled={!canConfirm || isConfirming}
            onClick={onConfirm}
          >
            {isConfirming ? (
              <>
                <Spinner label="Importando" />
                Importando…
              </>
            ) : (
              "Confirmar importación"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
