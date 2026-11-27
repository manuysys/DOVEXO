"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  RotateCcw,
  ShieldAlert,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { ImportFileForm } from "@/components/imports/import-file-form";
import { ImportPreviewTable } from "@/components/imports/import-preview-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/lib/auth";
import {
  commitCustomerImport,
  downloadCustomerImportErrors,
  previewCustomerImport,
  type CustomerImportCommitResult,
  type CustomerImportPreview,
} from "@/lib/import-api";
import {
  canCommitImport,
  commitButtonLabel,
  formatCommitResult,
  hasSkippedRows,
  importErrorMessage,
} from "@/lib/import-utils";
import { MANAGEMENT_ROLES } from "@/lib/navigation";
import { cn, downloadBlob } from "@/lib/utils";

type Analysis = {
  tenantId: string;
  jobId: string;
  preview: CustomerImportPreview;
};

type Applied = {
  tenantId: string;
  jobId: string;
  result: CustomerImportCommitResult;
};

const IMPORT_STEPS = [
  { step: 1, label: "Archivo" },
  { step: 2, label: "Revisión" },
  { step: 3, label: "Aplicado" },
] as const;

/**
 * Entrada de la pantalla. Cada empresa tiene su propia sesión de importación: al cambiar de
 * tenant se desmonta el contenido, así que análisis, resultados y respuestas tardías de la
 * empresa anterior no pueden aparecer ni marcar como aplicado el preview de otra.
 */
export function CustomerImport() {
  const { activeTenantId } = useAuth();
  return <CustomerImportSession key={activeTenantId ?? "sin-empresa"} />;
}

function CustomerImportSession() {
  const { activeTenantId, tenants } = useAuth();
  const queryClient = useQueryClient();
  const tenantId = activeTenantId ?? "";
  const role = tenants.find((tenant) => tenant.id === activeTenantId)?.role ?? "";
  const canImport = MANAGEMENT_ROLES.includes(role);

  const [formKey, setFormKey] = useState(0);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [applied, setApplied] = useState<Applied | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  /** Se incrementa al analizar o resetear: las respuestas de sesiones anteriores se descartan. */
  const sessionRef = useRef(0);
  /** Sesión en la que hay un commit en vuelo. Mientras exista, no se analiza ni se resetea. */
  const commitSessionRef = useRef<number | null>(null);

  // Solo se muestran datos de la empresa activa y del job vigente.
  const currentAnalysis = analysis?.tenantId === tenantId ? analysis : null;
  const currentApplied =
    applied !== null &&
    currentAnalysis !== null &&
    applied.tenantId === tenantId &&
    applied.jobId === currentAnalysis.jobId
      ? applied
      : null;
  const preview = currentAnalysis?.preview ?? null;
  const summary = preview?.summary ?? null;
  const isApplied = currentApplied !== null;

  function clearResults() {
    setAnalysis(null);
    setApplied(null);
    setPreviewError(null);
    setCommitError(null);
    setDownloadError(null);
    setDownloading(false);
  }

  async function analyze(file: File) {
    if (commitSessionRef.current !== null) {
      return;
    }
    const session = ++sessionRef.current;
    const requestTenant = tenantId;
    clearResults();
    setAnalyzing(true);
    try {
      const data = await previewCustomerImport(requestTenant, file);
      if (sessionRef.current !== session) return;
      setAnalysis({ tenantId: requestTenant, jobId: data.job_id, preview: data });
    } catch (error) {
      if (sessionRef.current !== session) return;
      setPreviewError(importErrorMessage(error, "preview"));
    } finally {
      if (sessionRef.current === session) setAnalyzing(false);
    }
  }

  async function commit(target: Analysis) {
    if (commitSessionRef.current !== null || isApplied) {
      return;
    }
    const session = sessionRef.current;
    commitSessionRef.current = session;
    setCommitting(true);
    setCommitError(null);
    try {
      const result = await commitCustomerImport(target.tenantId, target.jobId);
      // Solo se afirma la importación con la respuesta del backend para este job.
      setApplied({ tenantId: target.tenantId, jobId: target.jobId, result });
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Importación aplicada");
    } catch (error) {
      setCommitError(importErrorMessage(error, "commit"));
    } finally {
      commitSessionRef.current = null;
      setCommitting(false);
    }
  }

  async function download(target: Analysis) {
    const session = sessionRef.current;
    setDownloading(true);
    setDownloadError(null);
    try {
      const blob = await downloadCustomerImportErrors(target.tenantId, target.jobId);
      if (sessionRef.current !== session) return;
      downloadBlob(blob, `errores-importacion-${target.jobId}.csv`);
    } catch (error) {
      if (sessionRef.current !== session) return;
      setDownloadError(importErrorMessage(error, "errors"));
    } finally {
      if (sessionRef.current === session) setDownloading(false);
    }
  }

  function resetImport() {
    if (commitSessionRef.current !== null) {
      return;
    }
    sessionRef.current += 1;
    clearResults();
    setAnalyzing(false);
    setFormKey((value) => value + 1);
  }

  if (!activeTenantId) {
    return (
      <Card className="p-8 text-sm text-text-2">
        No hay una empresa activa. Cerrá sesión y volvé a ingresar.
      </Card>
    );
  }

  if (!canImport) {
    return (
      <Card className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
        <span className="bg-warning-soft text-warning-strong flex h-11 w-11 shrink-0 items-center justify-center rounded-ds-lg">
          <ShieldAlert className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-text text-sm font-semibold">
            No tenés permisos para importar clientes
          </p>
          <p className="text-text-2 mt-1 text-sm">
            Solo owner, administradores y coordinadores pueden importar clientes.
          </p>
        </div>
      </Card>
    );
  }

  const showEmptyFile = summary !== null && summary.total === 0;
  const currentStep = isApplied ? 3 : currentAnalysis ? 2 : 1;
  const skippedRows = summary ? summary.invalid + summary.duplicates : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Clientes"
        title="Importar clientes"
        description="Subí un archivo CSV o Excel con tu cartera. Revisamos cada fila antes de crear nada."
      />

      <ImportProgress current={currentStep} />

      <Card>
        <CardHeader className="border-border border-b">
          <CardTitle className="flex items-center gap-2">
            <span className="bg-surface-2 text-text-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold">
              1
            </span>
            Elegí el archivo
          </CardTitle>
          <p className="text-text-2 text-sm">
            Las filas con errores o duplicadas se omiten. Los duplicados son clientes con el mismo
            email o teléfono que ya existen, o repetidos dentro del archivo.
          </p>
        </CardHeader>
        <CardContent className="pt-5">
          <ImportFileForm
            key={formKey}
            pending={analyzing || committing}
            serverError={previewError}
            onAnalyze={(file) => void analyze(file)}
          />
          {analyzing && (
            <p role="status" className="text-text-2 mt-4 flex items-center gap-2 text-sm">
              <Loader2 className="text-primary h-4 w-4 animate-spin" aria-hidden="true" />
              Analizando el archivo. Todavía no se creó ningún cliente.
            </p>
          )}
        </CardContent>
      </Card>

      {analyzing && <ImportAnalysisSkeleton />}

      {currentAnalysis && summary && preview && (
        <Card>
          <CardHeader className="border-border border-b">
            <CardTitle className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                  isApplied ? "bg-success-soft text-success-strong" : "bg-surface-2 text-text-2",
                )}
              >
                {isApplied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : "2"}
              </span>
              Revisá el resumen
            </CardTitle>
            <p className="text-text-2 text-sm">
              {isApplied
                ? "La importación ya se aplicó. No se vuelve a crear ningún cliente."
                : "Todavía no se creó ningún cliente. Confirmá para aplicar las filas válidas."}
            </p>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            {showEmptyFile ? (
              <EmptyState
                icon={Users}
                title="El archivo no tiene filas para importar"
                description="Revisá que tenga encabezados y al menos una fila con nombre."
              />
            ) : (
              <ImportPreviewTable preview={preview} />
            )}

            {currentApplied && (
              <div
                role="status"
                className="bg-success-soft text-success-strong flex items-start gap-3 rounded-ds-md px-4 py-3 text-sm"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold">Importación aplicada</p>
                  <p>{formatCommitResult(currentApplied.result)}</p>
                  <Link
                    href="/customers"
                    className="text-success-strong mt-1 inline-flex font-semibold underline underline-offset-4"
                  >
                    Ver clientes
                  </Link>
                </div>
              </div>
            )}

            {!showEmptyFile && !isApplied && summary.valid === 0 && (
              <p className="bg-warning-soft text-warning-strong rounded-ds-md px-4 py-3 text-sm">
                No hay filas válidas para importar. Corregí el archivo y volvé a analizarlo.
              </p>
            )}

            {!isApplied && summary.valid > 0 && skippedRows > 0 && (
              <p className="text-text-2 text-sm">
                Se van a omitir{" "}
                <span className="numeric text-text font-semibold">{skippedRows}</span>{" "}
                {skippedRows === 1 ? "fila" : "filas"} con errores o duplicadas. Podés descargar el
                detalle antes de confirmar.
              </p>
            )}

            {commitError && (
              <div
                role="alert"
                className="bg-danger-soft text-danger-strong rounded-ds-md px-4 py-3 text-sm"
              >
                <p>{commitError}</p>
                {!isApplied && (
                  <p className="mt-1 text-xs">
                    Podés volver a intentar: aplicar la misma importación no duplica clientes.
                  </p>
                )}
              </div>
            )}

            {downloadError && (
              <p
                role="alert"
                className="bg-danger-soft text-danger-strong rounded-ds-md px-4 py-3 text-sm"
              >
                {downloadError}
              </p>
            )}

            <div className="border-border flex flex-col gap-2 border-t pt-4 sm:flex-row sm:flex-wrap sm:justify-end">
              {hasSkippedRows(summary) && (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  disabled={downloading}
                  onClick={() => void download(currentAnalysis)}
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  {downloading ? "Descargando..." : "Descargar errores (CSV)"}
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                disabled={committing}
                onClick={resetImport}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Analizar otro archivo
              </Button>
              {!isApplied && (
                <Button
                  className="w-full sm:w-auto"
                  disabled={!canCommitImport(summary, { committing, applied: isApplied })}
                  onClick={() => void commit(currentAnalysis)}
                >
                  {committing ? "Importando..." : commitButtonLabel(summary.valid)}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ImportProgress({ current }: { current: number }) {
  return (
    <nav aria-label="Pasos de la importación">
      <ol className="grid grid-cols-3 gap-2">
        {IMPORT_STEPS.map((item) => {
          const done = item.step < current;
          const active = item.step === current;
          return (
            <li
              key={item.step}
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex min-w-0 items-center gap-2 rounded-ds-md border px-3 py-2",
                active && "border-primary/40 bg-primary/5",
                done && "border-success/30 bg-success-soft",
                !active && !done && "border-border bg-surface",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  done && "bg-success-soft text-success-strong",
                  active && "bg-primary text-white",
                  !active && !done && "bg-surface-2 text-text",
                )}
                aria-hidden="true"
              >
                {done ? <Check className="h-3.5 w-3.5" /> : item.step}
              </span>
              <span className="min-w-0">
                <span className="text-text-2 block text-[11px] uppercase">Paso {item.step}</span>
                <span className="text-text block truncate text-xs font-semibold sm:text-sm">
                  {item.label}
                </span>
              </span>
              {done && <span className="sr-only">(completado)</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function ImportAnalysisSkeleton() {
  return (
    <div
      role="status"
      aria-label="Analizando el archivo"
      className="border-border bg-surface rounded-ds-lg border p-5"
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="border-border rounded-ds-md border px-4 py-3">
            <div className="bg-surface-2 h-3 w-16 animate-pulse rounded" />
            <div className="bg-surface-2 mt-2 h-6 w-10 animate-pulse rounded" />
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm text-text-2">
        <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
        Revisando filas y duplicados...
      </div>
    </div>
  );
}
