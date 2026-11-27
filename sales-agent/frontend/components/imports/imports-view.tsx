"use client";

import { useState } from "react";
import Link from "next/link";
import type { ImportConfirmResult, ImportPreview } from "@/lib/api/types";
import { useConfirmImport, useImports, usePreviewImport } from "@/hooks/use-imports";
import { useSectors } from "@/hooks/use-dashboard";
import { getErrorMessage } from "@/lib/errors";
import { pluralize } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoadingBlock } from "@/components/ui/spinner";
import { ImportHistoryEmpty, ImportHistoryTable } from "./import-history-table";
import { ImportPreviewPanel } from "./import-preview";
import { ImportUploadForm } from "./import-upload-form";

export function ImportsView() {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<ImportConfirmResult | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const importsQuery = useImports();
  const sectorsQuery = useSectors();
  const previewMutation = usePreviewImport();
  const confirmMutation = useConfirmImport();

  const handlePreview = async (file: File) => {
    setLocalError(null);
    setResult(null);
    const data = await previewMutation.mutateAsync(file);
    if (!data.batch_id && data.preview.length > 0) {
      setLocalError(
        "La API no devolvió el identificador del lote: no se puede confirmar la importación.",
      );
    }
    setPreview(data);
  };

  const handleConfirm = () => {
    if (!preview) return;
    if (!preview.batch_id) {
      setLocalError("La API no devolvió el identificador del lote.");
      return;
    }
    setLocalError(null);
    confirmMutation.mutate(preview.batch_id, {
      onSuccess: (data) => {
        setResult(data);
        setPreview(null);
      },
    });
  };

  return (
    <div className="space-y-4">
      {result ? (
        <Alert variant="success" title="Importación confirmada">
          <p>
            Se crearon {pluralize(result.created, "empresa", "empresas")} y se
            omitieron {pluralize(result.skipped, "fila", "filas")}.
          </p>
          {result.errors.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
              {result.errors.map((error, index) => (
                <li key={`${error.row_number}-${index}`}>
                  {error.row_number > 0 ? `Fila ${error.row_number}: ` : ""}
                  {error.message}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-2">
            <Link href="/prospects" className="font-semibold underline">
              Ver empresas importadas
            </Link>
          </p>
        </Alert>
      ) : null}

      <Card>
        <CardHeader
          title="Importar empresas desde CSV"
          description="Subí un archivo, revisá la previsualización y confirmá. Nada se guarda hasta confirmar."
        />
        <CardContent>
          <ImportUploadForm
            onPreview={handlePreview}
            isSubmitting={previewMutation.isPending}
            error={
              previewMutation.isError
                ? getErrorMessage(previewMutation.error)
                : null
            }
          />
        </CardContent>
      </Card>

      {preview ? (
        <ImportPreviewPanel
          preview={preview}
          sectors={sectorsQuery.data ?? []}
          onConfirm={handleConfirm}
          onDiscard={() => {
            setPreview(null);
            setLocalError(null);
          }}
          isConfirming={confirmMutation.isPending}
          confirmError={
            localError ??
            (confirmMutation.isError
              ? getErrorMessage(confirmMutation.error)
              : null)
          }
        />
      ) : null}

      <Card>
        <CardHeader
          title="Historial de importaciones"
          description="Lotes ya confirmados, con las filas creadas y omitidas informadas por el backend."
          action={
            <Button
              variant="secondary"
              size="sm"
              disabled={importsQuery.isFetching}
              onClick={() => void importsQuery.refetch()}
            >
              {importsQuery.isFetching ? "Actualizando…" : "Actualizar"}
            </Button>
          }
        />
        <CardContent>
          {importsQuery.isPending ? (
            <LoadingBlock label="Cargando importaciones…" />
          ) : importsQuery.isError ? (
            <Alert variant="danger" title="No se pudo cargar el historial">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>{getErrorMessage(importsQuery.error)}</span>
                <button
                  type="button"
                  onClick={() => void importsQuery.refetch()}
                  className="text-xs font-semibold underline"
                >
                  Reintentar
                </button>
              </div>
            </Alert>
          ) : importsQuery.data.length === 0 ? (
            <ImportHistoryEmpty
              action={
                <Link
                  href="/prospects"
                  className={buttonStyles({ variant: "secondary", size: "sm" })}
                >
                  Ver empresas
                </Link>
              }
            />
          ) : (
            <ImportHistoryTable batches={importsQuery.data} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
