import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingBlock } from "@/components/ui/spinner";
import { CrmView } from "@/components/crm/crm-view";

export default function CrmPage() {
  return (
    <>
      <PageHeader
        title="CRM"
        description="Pipeline comercial por estado, notas, seguimientos, historial y lista de no contacto. Cada empresa tiene una oportunidad por producto."
      />
      <Suspense fallback={<LoadingBlock label="Cargando CRM…" />}>
        <CrmView />
      </Suspense>
    </>
  );
}
