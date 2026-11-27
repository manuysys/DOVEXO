import { Suspense } from "react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingBlock } from "@/components/ui/spinner";
import { ProspectsView } from "@/components/prospects/prospects-view";

export default function ProspectsPage() {
  return (
    <>
      <PageHeader
        title="Prospectos"
        description="Empresas descubiertas y cargadas manualmente. Los datos, contactos y fuentes salen de la base: lo que no existe se muestra vacío."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/search"
              className={buttonStyles({ variant: "secondary", size: "md" })}
            >
              Buscar empresas
            </Link>
            <Link
              href="/prospects/new"
              className={buttonStyles({ variant: "primary", size: "md" })}
            >
              Agregar empresa
            </Link>
          </div>
        }
      />

      <Suspense fallback={<LoadingBlock label="Cargando prospectos…" />}>
        <ProspectsView />
      </Suspense>
    </>
  );
}
