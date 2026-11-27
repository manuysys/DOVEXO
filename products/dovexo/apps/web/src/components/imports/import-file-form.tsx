"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileSpreadsheet, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  IMPORT_ACCEPT_ATTRIBUTE,
  IMPORT_COLUMNS,
  IMPORT_MAX_FILE_BYTES,
  IMPORT_MAX_ROWS,
  importFileSchema,
  type ImportFileValues,
} from "@/lib/import-utils";

type ImportFileFormProps = {
  pending: boolean;
  serverError: string | null;
  onAnalyze: (file: File) => void;
};

export function ImportFileForm({ pending, serverError, onAnalyze }: ImportFileFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ImportFileValues>({
    resolver: zodResolver(importFileSchema),
    defaultValues: { file: null },
  });

  function onSubmit(values: ImportFileValues) {
    if (values.file) {
      onAnalyze(values.file);
    }
  }

  function selectFile(file: File | null) {
    setFileName(file?.name ?? null);
    setValue("file", file, { shouldValidate: true });
  }

  const fileError = errors.file?.message ?? null;
  const maxMb = IMPORT_MAX_FILE_BYTES / (1024 * 1024);
  const describedBy = fileError ? "import-file-help import-file-error" : "import-file-help";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <label htmlFor="import-file" className="text-text mb-1.5 block text-sm font-medium">
          Archivo CSV o XLSX
        </label>
        <input
          ref={inputRef}
          id="import-file"
          type="file"
          accept={IMPORT_ACCEPT_ATTRIBUTE}
          disabled={pending}
          tabIndex={-1}
          aria-invalid={fileError ? true : undefined}
          aria-describedby={describedBy}
          onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
          className="sr-only"
        />
        <div className="border-border bg-surface-2/40 flex flex-col gap-2 rounded-ds-md border border-dashed p-3 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
            aria-describedby={describedBy}
            className="bg-surface shrink-0"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            {fileName ? "Cambiar archivo" : "Elegir archivo"}
          </Button>
          <p
            className="text-text-2 min-w-0 truncate text-sm"
            title={fileName ?? "Ningún archivo seleccionado"}
          >
            {fileName ?? "Ningún archivo seleccionado"}
          </p>
        </div>
        <p id="import-file-help" className="text-text-2 mt-2 text-xs">
          Hasta {IMPORT_MAX_ROWS} filas y {maxMb} MB. Solo es obligatoria la columna{" "}
          <code className="text-text font-mono">name</code>.
        </p>
        {fileError && (
          <p id="import-file-error" role="alert" className="text-danger mt-1 text-xs">
            {fileError}
          </p>
        )}
      </div>

      <div className="bg-surface-2 rounded-ds-md px-4 py-3">
        <p className="text-text-2 text-label flex items-center gap-2">
          <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
          Columnas reconocidas
        </p>
        <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Columnas reconocidas">
          {IMPORT_COLUMNS.map((column) => (
            <li key={column}>
              <code className="border-border bg-surface text-text rounded-ds-sm border px-2 py-0.5 font-mono text-xs">
                {column}
              </code>
            </li>
          ))}
        </ul>
      </div>

      {serverError && (
        <p role="alert" className="bg-danger-soft text-danger-strong rounded-ds-md px-3 py-2 text-sm">
          {serverError}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          <Upload className="h-4 w-4" aria-hidden="true" />
          {pending ? "Analizando archivo..." : "Analizar archivo"}
        </Button>
      </div>
    </form>
  );
}
