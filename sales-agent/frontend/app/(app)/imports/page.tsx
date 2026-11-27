import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export default function ImportsPage() {
  return (
    <PhasePlaceholder
      title="Importaciones"
      phase={2}
      summary="La importación de CSV con previsualización, mapeo de columnas y detección de duplicados llega junto con el descubrimiento."
      planned={[
        "Subida de archivo CSV y previsualización de filas.",
        "Mapeo de columnas a los campos de empresa y contacto.",
        "Validación, normalización y detección de duplicados.",
        "Informe de importación por lote.",
      ]}
    />
  );
}
