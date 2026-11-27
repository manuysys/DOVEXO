"use client";

import { useRef, useState } from "react";
import {
  checkImportFile,
  countCsvDataRows,
  formatBytes,
  IMPORT_MAX_BYTES,
  IMPORT_MAX_ROWS,
} from "@/features/imports/limits";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export interface ImportUploadFormProps {
  onPreview: (file: File) => Promise<void> | void;
  isSubmitting?: boolean;
  error?: string | null;
  disabled?: boolean;
}

export function ImportUploadForm({
  onPreview,
  isSubmitting = false,
  error = null,
  disabled = false,
}: ImportUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [rowWarning, setRowWarning] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selected = event.target.files?.[0] ?? null;
    setLocalError(null);
    setRowWarning(null);
    setFile(null);
    if (!selected) return;

    const check = checkImportFile(selected);
    if (!check.ok) {
      setLocalError(check.message);
      return;
    }

    const rows = await countCsvDataRows(selected);
    if (rows !== null && rows > IMPORT_MAX_ROWS) {
      setLocalError(
        `El archivo tiene ${rows} filas de datos y el máximo es ${IMPORT_MAX_ROWS} por importación.`,
      );
      return;
    }
    if (rows === 0) {
      setLocalError("El archivo no tiene filas de datos además del encabezado.");
      return;
    }
    if (rows !== null && rows > IMPORT_MAX_ROWS / 2) {
      setRowWarning(
        `El archivo tiene ${rows} filas: cerca del máximo de ${IMPORT_MAX_ROWS}.`,
      );
    }
    setFile(selected);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setLocalError("Elegí un archivo CSV.");
      return;
    }
    try {
      await onPreview(file);
      // Permite volver a elegir el mismo archivo (el navegador no repite
      // `change` si el valor del input no cambió).
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      // El contenedor muestra el error de la API.
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {error ? (
        <Alert variant="danger" title="No se pudo previsualizar el archivo">
          {error}
        </Alert>
      ) : null}

      <Field
        label="Archivo CSV"
        htmlFor="import-file"
        hint={`Máximo ${formatBytes(IMPORT_MAX_BYTES)} y ${IMPORT_MAX_ROWS} filas de datos. UTF-8 con encabezado.`}
        error={localError ?? undefined}
      >
        <Input
          id="import-file"
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          invalid={Boolean(localError)}
          disabled={isSubmitting || disabled}
          onChange={(event) => {
            void handleChange(event);
          }}
          className="py-1.5 file:mr-3 file:rounded file:border-0 file:bg-canvas file:px-3 file:py-1 file:text-xs file:font-medium file:text-ink"
        />
      </Field>

      <div className="rounded-md border border-line bg-canvas/60 px-4 py-3 text-xs leading-relaxed text-muted">
        <p className="font-medium text-ink">Columnas reconocidas</p>
        <p className="mt-1">
          Obligatorias: <code>nombre</code> (o <code>empresa</code>) y{" "}
          <code>rubros</code> (o <code>sectors</code>), separados por punto y
          coma. Los rubros deben existir en{" "}
          <code>/meta/sectors</code>: se aceptan slug, nombre o sinónimo.
        </p>
        <p className="mt-1">
          Opcionales: <code>web</code>, <code>provincia</code>,{" "}
          <code>localidad</code>, <code>direccion</code>, <code>telefono</code>{" "}
          y <code>email</code>. Las filas con errores o duplicadas se omiten.
        </p>
      </div>

      {file ? (
        <p className="text-xs text-muted">
          Archivo seleccionado: <span className="text-ink">{file.name}</span> ·{" "}
          {formatBytes(file.size)}
        </p>
      ) : null}

      {rowWarning ? (
        <Alert variant="warning">{rowWarning}</Alert>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-xs text-muted">
          La previsualización no guarda nada: recién se crean empresas al
          confirmar.
        </p>
        <Button type="submit" disabled={isSubmitting || disabled}>
          {isSubmitting ? (
            <>
              <Spinner label="Analizando" />
              Analizando…
            </>
          ) : (
            "Previsualizar"
          )}
        </Button>
      </div>
    </form>
  );
}
