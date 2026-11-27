"use client";

import { useQuery } from "@tanstack/react-query";
import { Camera, Download, Package } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api, errorMessage } from "@/lib/api";
import { formatFileSize } from "@/lib/technician";
import { downloadBlob, formatDate } from "@/lib/utils";

type OrderMediaCardProps = {
  tenantId: string;
  orderId: string;
  enabled: boolean;
};

/**
 * Materiales y fotos cargados por el técnico. Los endpoints son exclusivos del
 * rol `technician`; para el resto de los roles se informa la limitación en vez
 * de disparar un 403.
 */
export function OrderMediaCard({ tenantId, orderId, enabled }: OrderMediaCardProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const materialsQuery = useQuery({
    queryKey: ["tech-materials", tenantId, orderId],
    queryFn: () => api.technicianWorkOrders.materials.list(tenantId, orderId),
    enabled: enabled && Boolean(tenantId && orderId),
  });

  const attachmentsQuery = useQuery({
    queryKey: ["tech-attachments", tenantId, orderId],
    queryFn: () => api.technicianWorkOrders.attachments.list(tenantId, orderId),
    enabled: enabled && Boolean(tenantId && orderId),
  });

  const materials = materialsQuery.data ?? [];
  const attachments = attachmentsQuery.data ?? [];

  async function handleDownload(attachmentId: string, filename: string) {
    setDownloadingId(attachmentId);
    setDownloadError(null);
    try {
      const blob = await api.technicianWorkOrders.attachments.download(tenantId, orderId, attachmentId);
      downloadBlob(blob, filename);
    } catch (error) {
      setDownloadError(errorMessage(error, "No se pudo descargar el archivo."));
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Materiales y fotos</CardTitle>
        <CardDescription>Registros que el técnico carga durante la visita.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!enabled ? (
          <p className="text-text-2 bg-surface-2 rounded-ds-md px-3 py-2 text-small">
            Los materiales y las fotos los registra el técnico asignado desde la app móvil. La consulta desde
            el panel todavía no está disponible para este rol.
          </p>
        ) : (
          <>
            <section aria-labelledby="order-materials-title">
              <h3 id="order-materials-title" className="text-text mb-2 flex items-center gap-1.5 text-small font-semibold">
                <Package className="text-text-2 h-4 w-4" aria-hidden="true" />
                Materiales
              </h3>
              {materialsQuery.isLoading ? (
                <p className="text-text-2 text-small" aria-busy="true">
                  Cargando materiales...
                </p>
              ) : materialsQuery.isError ? (
                <p role="alert" className="text-danger-strong text-small">
                  {errorMessage(materialsQuery.error, "No se pudieron cargar los materiales.")}
                </p>
              ) : materials.length === 0 ? (
                <p className="text-text-2 text-small">Sin materiales registrados.</p>
              ) : (
                <ul className="divide-border border-border divide-y rounded-ds-md border">
                  {materials.map((material) => (
                    <li key={material.id} className="flex items-baseline justify-between gap-3 px-3 py-2">
                      <span className="text-text min-w-0 text-small">{material.description}</span>
                      <span className="text-text-2 numeric shrink-0 text-caption">
                        {material.quantity} {material.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="order-attachments-title">
              <h3 id="order-attachments-title" className="text-text mb-2 flex items-center gap-1.5 text-small font-semibold">
                <Camera className="text-text-2 h-4 w-4" aria-hidden="true" />
                Fotos
              </h3>
              {attachmentsQuery.isLoading ? (
                <p className="text-text-2 text-small" aria-busy="true">
                  Cargando fotos...
                </p>
              ) : attachmentsQuery.isError ? (
                <p role="alert" className="text-danger-strong text-small">
                  {errorMessage(attachmentsQuery.error, "No se pudieron cargar las fotos.")}
                </p>
              ) : attachments.length === 0 ? (
                <p className="text-text-2 text-small">Sin fotos registradas.</p>
              ) : (
                <ul className="space-y-2">
                  {attachments.map((attachment) => (
                    <li
                      key={attachment.id}
                      className="border-border flex flex-wrap items-center justify-between gap-2 rounded-ds-md border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-text truncate text-small">{attachment.filename}</p>
                        <p className="text-text-2 text-caption">
                          {formatFileSize(attachment.size_bytes)} · {formatDate(attachment.created_at)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void handleDownload(attachment.id, attachment.filename)}
                        disabled={downloadingId === attachment.id}
                        aria-label={`Descargar ${attachment.filename}`}
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden="true" />
                        {downloadingId === attachment.id ? "Descargando..." : "Descargar"}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              {downloadError && (
                <p role="alert" className="text-danger-strong mt-2 text-small">
                  {downloadError}
                </p>
              )}
            </section>
          </>
        )}
      </CardContent>
    </Card>
  );
}
