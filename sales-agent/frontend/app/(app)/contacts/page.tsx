import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export default function ContactsPage() {
  return (
    <PhasePlaceholder
      title="Contactos"
      phase={3}
      summary="Los contactos publicados se muestran cuando el enriquecimiento lea sitios oficiales y registre procedencia, fecha y confianza."
      planned={[
        "Contactos por empresa con tipo de canal y etiqueta.",
        "Verificación manual y estado de confianza.",
        "WhatsApp solo cuando esté publicado explícitamente como canal comercial.",
        "Lista de no contacto y correcciones.",
      ]}
    />
  );
}
