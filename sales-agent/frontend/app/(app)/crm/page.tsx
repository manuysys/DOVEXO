import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export default function CrmPage() {
  return (
    <PhasePlaceholder
      title="CRM"
      phase={5}
      summary="El pipeline comercial, las actividades y los seguimientos se implementan en la Fase 5 sobre los leads ya aprobados."
      planned={[
        "Pipeline por estado: nuevo, contactado, respondió, reunión, propuesta y cliente.",
        "Cambios de estado accesibles y con historial.",
        "Notas, próximos seguimientos y responsable.",
        "Lista de supresión y exportación.",
      ]}
    />
  );
}
