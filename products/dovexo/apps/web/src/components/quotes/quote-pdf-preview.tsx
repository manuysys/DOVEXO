"use client";

import { FileText, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/api";

type QuotePdfPreviewProps = {
  tenantId: string;
  quoteId: string;
  number: string;
};

type PreviewState = { url: string } | { error: string } | null;

/**
 * Vista previa del PDF real. El endpoint exige Authorization, así que se pide
 * como blob y se muestra con un object URL; se libera al desmontar.
 */
export function QuotePdfPreview({ tenantId, quoteId, number }: QuotePdfPreviewProps) {
  const [state, setState] = useState<PreviewState>(null);
  const [loading, setLoading] = useState(false);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
      }
    };
  }, []);

  async function loadPreview() {
    setLoading(true);
    try {
      const blob = await api.quotes.pdf(tenantId, quoteId);
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
      }
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      setState({ url });
    } catch (error) {
      setState({ error: errorMessage(error, "No se pudo generar el PDF") });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      aria-labelledby="quote-pdf-title"
      className="border-border bg-surface rounded-ds-lg border p-5 shadow-card"
    >
      <h2 id="quote-pdf-title" className="text-text flex items-center gap-2 text-sm font-semibold">
        <FileText className="text-text-2 h-4 w-4" aria-hidden="true" />
        Vista previa del PDF
      </h2>

      {state && "url" in state ? (
        <iframe
          src={state.url}
          title={`Vista previa del presupuesto ${number}`}
          className="border-border rounded-ds-md mt-3 h-[480px] w-full border bg-white"
        />
      ) : state && "error" in state ? (
        <div role="alert" className="mt-3">
          <p className="text-danger-strong text-sm font-medium">{state.error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => void loadPreview()}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </Button>
        </div>
      ) : (
        <div className="border-border bg-surface-2 rounded-ds-md mt-3 flex flex-col items-center justify-center gap-2 border border-dashed px-4 py-10 text-center">
          {loading ? (
            <>
              <Loader2 className="text-text-2 h-5 w-5 animate-spin" aria-hidden="true" />
              <p className="text-text-2 text-sm" aria-live="polite">
                Generando vista previa…
              </p>
            </>
          ) : (
            <>
              <p className="text-text-2 text-sm">
                Cargá la vista previa para revisar el documento antes de enviarlo.
              </p>
              <Button variant="outline" size="sm" onClick={() => void loadPreview()}>
                <FileText className="h-4 w-4" aria-hidden="true" />
                Cargar vista previa
              </Button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
