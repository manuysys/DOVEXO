import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export function PhasePlaceholder({
  title,
  phase,
  summary,
  planned,
  current,
}: {
  title: string;
  phase: 2 | 3 | 4 | 5;
  summary: string;
  planned: string[];
  current?: ReactNode;
}) {
  return (
    <>
      <PageHeader
        title={title}
        description="Esta sección forma parte del alcance del producto, pero todavía no está operativa."
      />

      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              {title} <Badge variant="info">Disponible en Fase {phase}</Badge>
            </span>
          }
          description={summary}
        />
        <CardContent className="space-y-5">
          <div>
            <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">
              Qué va a incluir
            </h3>
            <ul className="mt-2 space-y-1.5 text-sm text-ink">
              {planned.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden="true" className="text-muted">
                    ·
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-md border border-line bg-canvas/60 px-4 py-3 text-xs leading-relaxed text-muted">
            No se muestran datos de ejemplo ni resultados simulados: lo que
            todavía no existe en la base se ve vacío.
          </div>

          {current}
        </CardContent>
      </Card>
    </>
  );
}
