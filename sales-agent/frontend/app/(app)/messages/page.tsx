import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingBlock } from "@/components/ui/spinner";
import { MessagesView } from "@/components/messages/messages-view";

export default function MessagesPage() {
  return (
    <>
      <PageHeader
        title="Mensajes"
        description="Bandeja de oportunidades con conversación de WhatsApp y mensajes de contacto. Todo envío requiere aprobación humana y se registra manualmente."
      />
      <Suspense fallback={<LoadingBlock label="Cargando mensajes…" />}>
        <MessagesView />
      </Suspense>
    </>
  );
}
