"use client";

import type { WhatsAppStatus } from "@/lib/api/types";
import {
  isSimulatedWhatsAppMode,
  whatsappModeLabel,
} from "@/features/messages/status";
import { useWhatsAppStatus } from "@/hooks/use-whatsapp";
import { getErrorMessage } from "@/lib/errors";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

/**
 * Estado real del proveedor de WhatsApp. Si el backend está en modo consola,
 * la UI avisa que los envíos no salen a WhatsApp.
 */
export function WhatsAppStatusBanner() {
  const statusQuery = useWhatsAppStatus();

  if (statusQuery.isPending) {
    return (
      <div className="rounded-md border border-line bg-surface px-4 py-3 text-xs text-muted">
        Consultando el estado de WhatsApp…
      </div>
    );
  }

  if (statusQuery.isError || !statusQuery.data) {
    return (
      <Alert variant="warning" title="No se pudo consultar el estado de WhatsApp">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>
            {statusQuery.isError
              ? getErrorMessage(statusQuery.error)
              : "La API no devolvió el estado del proveedor."}
          </span>
          <button
            type="button"
            onClick={() => void statusQuery.refetch()}
            className="text-xs font-semibold underline"
          >
            Reintentar
          </button>
        </div>
      </Alert>
    );
  }

  const status: WhatsAppStatus = statusQuery.data;
  const simulated = !status.configured || isSimulatedWhatsAppMode(status.mode);

  return (
    <Alert variant={simulated ? "warning" : "success"}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={simulated ? "warning" : "success"}>
          {whatsappModeLabel(status.configured, status.mode)}
        </Badge>
        <span>
          {simulated
            ? "Los envíos quedan registrados en el backend y no llegan a WhatsApp. El contacto se hace manualmente."
            : "El proveedor puede entregar mensajes a WhatsApp cuando el equipo los envía."}
        </span>
      </div>
      <p className="mt-1 text-xs">
        {status.sender_phone
          ? `Número remitente: ${status.sender_phone}.`
          : "Sin número remitente configurado."}{" "}
        {status.founder_phone_set
          ? "El número del fundador está configurado como destino de prueba."
          : "El número del fundador no está configurado."}
      </p>
    </Alert>
  );
}
