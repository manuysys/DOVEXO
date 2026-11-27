"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Download, ImageIcon, ImagePlus, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import { ApiError, api, errorMessage } from "@/lib/api";
import { formatFileSize, validateAttachmentFile } from "@/lib/technician";
import { downloadBlob, formatDate } from "@/lib/utils";

type Props = {
  tenantId: string;
  orderId: string;
};

type PendingUpload = {
  file: File;
  previewUrl: string;
};

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function uploadErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Tu sesión venció. Volvé a iniciar sesión.";
    if (error.status === 403) return "No tenés permiso para subir fotos en este trabajo.";
    if (error.status === 422) return "La imagen no es válida o supera el máximo de 5 MB.";
  }
  return errorMessage(error, "No pudimos subir la foto. Reintentá.");
}

export function TechnicianAttachments({ tenantId, orderId }: Props) {
  const queryClient = useQueryClient();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingUpload | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const attachmentsKey = ["tech-attachments", tenantId, orderId];

  const attachmentsQuery = useQuery({
    queryKey: attachmentsKey,
    queryFn: () => api.technicianWorkOrders.attachments.list(tenantId, orderId),
    enabled: Boolean(tenantId && orderId),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      api.technicianWorkOrders.attachments.upload(tenantId, orderId, file),
    onSuccess: () => {
      setPending(null);
      setSaved(true);
      void queryClient.invalidateQueries({ queryKey: attachmentsKey });
    },
  });

  useEffect(() => {
    return () => {
      if (pending) URL.revokeObjectURL(pending.previewUrl);
    };
  }, [pending]);

  function startUpload(file: File) {
    setSaved(false);
    setFileError(null);
    setDownloadError(null);
    uploadMutation.reset();
    setPending({ file, previewUrl: URL.createObjectURL(file) });
    uploadMutation.mutate(file);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateAttachmentFile(file);
    if (validationError) {
      uploadMutation.reset();
      setSaved(false);
      setFileError(validationError);
      return;
    }
    if (file.type && !ALLOWED_IMAGE_TYPES.has(file.type)) {
      uploadMutation.reset();
      setSaved(false);
      setFileError("Formato no compatible. Usá JPG, PNG o WebP.");
      return;
    }
    startUpload(file);
  }

  function handleRetry() {
    if (!pending) return;
    setSaved(false);
    setFileError(null);
    uploadMutation.reset();
    uploadMutation.mutate(pending.file);
  }

  function handleRemovePending() {
    setPending(null);
    setSaved(false);
    setFileError(null);
    uploadMutation.reset();
  }

  async function handleDownload(attachmentId: string, filename: string) {
    setDownloadError(null);
    setDownloadingId(attachmentId);
    try {
      const blob = await api.technicianWorkOrders.attachments.download(
        tenantId,
        orderId,
        attachmentId,
      );
      downloadBlob(blob, filename);
    } catch (error) {
      setDownloadError(errorMessage(error, "No pudimos descargar la foto."));
    } finally {
      setDownloadingId(null);
    }
  }

  const attachments = attachmentsQuery.data ?? [];
  const uploadError = uploadMutation.isError ? uploadErrorMessage(uploadMutation.error) : null;
  const message = fileError ?? uploadError;

  return (
    <section
      aria-labelledby="tech-photos-title"
      className="rounded-ds-lg border border-border bg-surface p-4 shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="tech-photos-title" className="text-h4 text-text">
            Fotos del trabajo
          </h2>
          <p className="text-caption mt-0.5 text-text-2">JPG, PNG o WebP hasta 5 MB.</p>
        </div>
        <span className="text-caption text-text-2">
          {attachments.length === 1 ? "1 foto" : `${attachments.length} fotos`}
        </span>
      </div>

      <div className="mt-3 flex gap-2">
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          onChange={handleFileChange}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          onChange={handleFileChange}
        />
        <Button
          variant="primary"
          size="lg"
          className="min-w-0 flex-1 px-3 whitespace-nowrap"
          onClick={() => cameraInputRef.current?.click()}
          disabled={uploadMutation.isPending}
        >
          <Camera className="h-5 w-5 shrink-0" aria-hidden="true" />
          Tomar foto
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="min-w-0 flex-1 px-3 whitespace-nowrap"
          onClick={() => galleryInputRef.current?.click()}
          disabled={uploadMutation.isPending}
        >
          <ImagePlus className="h-5 w-5 shrink-0" aria-hidden="true" />
          Galería
        </Button>
      </div>

      {message && (
        <p
          role="alert"
          className="text-small mt-3 rounded-ds-sm bg-danger-soft px-3 py-2 text-danger-strong"
        >
          {message}
        </p>
      )}

      {saved && !message && (
        <p
          role="status"
          className="text-small mt-3 rounded-ds-sm bg-success-soft px-3 py-2 text-success-strong"
        >
          Foto subida y confirmada.
        </p>
      )}

      {pending && (
        <div className="mt-3 overflow-hidden rounded-ds-md border border-border bg-surface-2">
          <div className="relative aspect-[4/3] w-full bg-surface-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pending.previewUrl}
              alt={`Vista previa de ${pending.file.name}`}
              className="h-full w-full object-cover"
            />
            {uploadMutation.isPending && (
              <div className="absolute inset-0 flex items-center justify-center bg-deep/40">
                <Loader2 className="h-8 w-8 animate-spin text-white" aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 p-3">
            <div className="min-w-0">
              <p className="text-small truncate font-medium text-text">{pending.file.name}</p>
              <p className="text-caption text-text-2">{formatFileSize(pending.file.size)}</p>
            </div>
            {!uploadMutation.isPending && (
              <div className="flex shrink-0 items-center gap-2">
                {uploadMutation.isError && (
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="text-small min-h-11 rounded-ds-sm border border-border px-3 font-semibold text-text transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    Reintentar
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleRemovePending}
                  aria-label="Quitar foto seleccionada"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-ds-sm border border-border text-text-2 transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
          {uploadMutation.isPending && (
            <div
              role="progressbar"
              aria-label="Subiendo foto"
              aria-valuetext="Subiendo"
              className="h-1 w-full overflow-hidden bg-surface"
            >
              <div className="h-full w-1/2 animate-pulse bg-primary" />
            </div>
          )}
        </div>
      )}

      <div className="mt-4">
        {attachmentsQuery.isLoading ? (
          <p className="text-small text-text-2">Cargando fotos…</p>
        ) : attachmentsQuery.isError ? (
          <div className="rounded-ds-sm bg-danger-soft px-3 py-2">
            <p role="alert" className="text-small text-danger-strong">
              No pudimos cargar las fotos.
            </p>
            <button
              type="button"
              onClick={() => void attachmentsQuery.refetch()}
              className="text-small mt-2 min-h-11 rounded-ds-sm border border-border bg-surface px-3 font-semibold text-text"
            >
              Reintentar
            </button>
          </div>
        ) : attachments.length === 0 ? (
          <div className="rounded-ds-md border border-dashed border-border bg-surface-2/40 px-3 py-3">
            <p className="text-small font-medium text-text">
              Todavía no hay fotos de este trabajo.
            </p>
            <p className="text-caption mt-0.5 text-text-2">
              Sacá una foto del equipo o del trabajo terminado para dejarlo registrado.
            </p>
          </div>
        ) : (
          <ul className="grid gap-2 min-[420px]:grid-cols-2">
            {attachments.map((attachment) => {
              const busy = downloadingId === attachment.id;
              return (
                <li
                  key={attachment.id}
                  className="flex items-center gap-2.5 rounded-ds-md border border-border bg-surface p-2.5"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ds-sm bg-surface-2 text-text-2">
                    <ImageIcon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-small truncate font-medium text-text">
                      {attachment.filename}
                    </p>
                    <p className="text-caption truncate text-text-2">
                      {formatFileSize(attachment.size_bytes)} · {formatDate(attachment.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    aria-label={`Descargar ${attachment.filename}`}
                    onClick={() => void handleDownload(attachment.id, attachment.filename)}
                    className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-ds-sm border border-border text-text-2 transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Download className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {downloadError && (
          <p
            role="alert"
            className="text-small mt-2 rounded-ds-sm bg-danger-soft px-3 py-2 text-danger-strong"
          >
            {downloadError}
          </p>
        )}
      </div>
    </section>
  );
}
