import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingBlock } from "@/components/ui/spinner";
import { SearchHistoryView } from "@/components/search/search-history-view";

export default function SearchHistoryPage() {
  return (
    <>
      <PageHeader
        title="Historial de búsquedas"
        description="Cada corrida de descubrimiento con su estado, alcance y conteos reales informados por el backend. Podés filtrar por campaña."
      />
      <Suspense fallback={<LoadingBlock label="Cargando historial…" />}>
        <SearchHistoryView />
      </Suspense>
    </>
  );
}
