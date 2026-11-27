import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export default function ProspectsPage() {
  return (
    <PhasePlaceholder
      title="Prospectos"
      phase={3}
      summary="La lista de empresas investigadas con compatibilidad, confianza y canales de contacto aparece cuando el descubrimiento y el enriquecimiento estén implementados."
      planned={[
        "Tabla de empresas con rubro, localidad, provincia y sitio web.",
        "Filtros por rubro, provincia, score, confianza y contacto disponible.",
        "Paginación y exportación CSV desde el backend.",
        "Detalle con fuentes, evidencias y datos inferidos claramente marcados.",
      ]}
    />
  );
}
