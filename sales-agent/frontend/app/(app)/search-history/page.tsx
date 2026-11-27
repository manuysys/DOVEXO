import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export default function SearchHistoryPage() {
  return (
    <PhasePlaceholder
      title="Historial de búsquedas"
      phase={2}
      summary="Cada búsqueda ejecutada quedará registrada con su campaña, proveedor, fecha, estado y cantidad de resultados."
      planned={[
        "Listado de búsquedas con estado y progreso.",
        "Reintentar o cancelar una corrida.",
        "Resultados asociados y errores del proveedor.",
        "Sin búsquedas hasta que el descubrimiento esté habilitado.",
      ]}
    />
  );
}
