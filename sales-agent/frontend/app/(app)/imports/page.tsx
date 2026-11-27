"use client";

import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ImportsView } from "@/components/imports/imports-view";
import {
  IMPORT_MAX_ROWS,
  formatBytes,
  IMPORT_MAX_BYTES,
} from "@/features/imports/limits";

export default function ImportsPage() {
  return (
    <>
      <PageHeader
        title="Importaciones"
        description={`Carga masiva de empresas desde CSV. Límites: ${formatBytes(IMPORT_MAX_BYTES)} y ${IMPORT_MAX_ROWS} filas de datos por archivo.`}
        actions={
          <Link
            href="/prospects"
            className={buttonStyles({ variant: "secondary", size: "md" })}
          >
            Ver empresas
          </Link>
        }
      />
      <ImportsView />
    </>
  );
}
