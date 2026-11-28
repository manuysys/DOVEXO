import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingBlock } from "@/components/ui/spinner";
import { EnrichmentView } from "@/components/enrichment/enrichment-view";

export default function EnrichmentPage() {
  return (
    <>
      <PageHeader
        title="Enriquecimiento web"
        description="Investigá el sitio público de las empresas para registrar contactos publicados, servicios y evidencia. Solo admin/owner puede iniciar trabajos; el backend valida el permiso y la URL."
      />

      <Suspense fallback={<LoadingBlock label="Cargando enriquecimiento…" />}>
        <EnrichmentView />
      </Suspense>
    </>
  );
}
