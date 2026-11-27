import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export default function ApprovalsPage() {
  return (
    <PhasePlaceholder
      title="Pendientes de aprobación"
      phase={4}
      summary="La bandeja de revisión humana se habilita cuando existan leads puntuados y mensajes sugeridos por el motor."
      planned={[
        "Revisión de nombre, fuente, rubro, compatibilidad y confianza.",
        "Mensaje sugerido editable con evidencias utilizadas.",
        "Aprobar, editar, descartar, marcar duplicado o no contactar.",
        "Ningún mensaje se envía automáticamente: el envío es manual.",
      ]}
    />
  );
}
