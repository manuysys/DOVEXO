"use client";

import { useState } from "react";
import { useCurrentUser } from "@/hooks/use-auth";
import { useEnrichCompany } from "@/hooks/use-companies";
import { canEnrichCompanies } from "@/features/prospects/permissions";
import type { Company, CompanyEnrichResult } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/errors";
import { pluralize } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

function externalHref(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

/**
 * Resumen honesto de lo que devolvió la investigación. No se agregan datos
 * propios: si el backend no agregó nada, la UI dice que no agregó nada.
 */
function EnrichSummary({ result }: { result: CompanyEnrichResult }) {
  const added = result.contacts_added + result.facts_added + result.sources_added;

  if (result.status === "no_website") {
    return (
      <Alert variant="warning" title="La empresa no tiene un sitio web">
        No se investigó nada y no se agregaron contactos, datos ni fuentes.
        Cargá el sitio en la ficha para poder investigarlo.
      </Alert>
    );
  }

  if (result.status === "unsafe") {
    return (
      <Alert variant="danger" title="El sitio no es seguro para investigar">
        {result.error ??
          "La URL apunta a una dirección no permitida (red interna o protocolo inseguro). No se descargó el sitio ni se agregaron datos."}
      </Alert>
    );
  }

  if (result.status === "fetch_error") {
    return (
      <Alert variant="danger" title="No se pudo leer el sitio web">
        {result.error ??
          "La descarga del sitio falló. Revisá la URL o intentá de nuevo más tarde. No se agregaron datos."}
      </Alert>
    );
  }

  if (result.status !== "ok") {
    return (
      <Alert variant="warning" title="Resultado de la investigación sin estado conocido">
        {result.error ??
          "La API respondió con un formato inesperado. Revisá los datos de la ficha antes de usarlos."}
      </Alert>
    );
  }

  const fieldsUpdated =
    result.fields_updated.length > 0 ? (
      <p className="mt-1 text-xs">
        Campos actualizados en la ficha: {result.fields_updated.join(", ")}.
      </p>
    ) : null;

  if (added === 0 && result.fields_updated.length > 0) {
    return (
      <Alert variant="success" title="Ficha actualizada">
        <p>
          No se agregaron contactos, datos ni fuentes nuevas, pero se
          actualizaron datos de la empresa con la información del sitio.
        </p>
        {fieldsUpdated}
      </Alert>
    );
  }

  if (added === 0) {
    return (
      <Alert variant="warning" title="Sin datos nuevos">
        No se agregaron contactos, datos ni fuentes nuevas: la información del
        sitio ya estaba registrada. Revisá la evidencia antes de contactar.
      </Alert>
    );
  }

  return (
    <Alert variant="success" title="Investigación completada">
      <p>
        Se agregaron{" "}
        {pluralize(result.contacts_added, "contacto", "contactos")},{" "}
        {pluralize(result.facts_added, "dato", "datos")} y{" "}
        {pluralize(result.sources_added, "fuente", "fuentes")}; revisá la
        evidencia.
      </p>
      {fieldsUpdated}
      <p className="mt-1 text-xs">
        Los contactos nuevos aparecen en “Canales de contacto” con su estado de
        verificación y su origen. Los datos extraídos quedan en “Datos extraídos
        del sitio”. Un WhatsApp publicado no confirma que la cuenta exista: hay
        que verificarlo a mano.
      </p>
    </Alert>
  );
}

function EnrichEvidence({ result }: { result: CompanyEnrichResult }) {
  if (result.evidence.length === 0) return null;

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted">
        Evidencia devuelta por la investigación
      </p>
      <ul className="divide-y divide-line">
        {result.evidence.map((item, index) => (
          <li
            key={`${item.source_url}-${index}`}
            className="space-y-0.5 py-1.5 first:pt-0 last:pb-0"
          >
            {item.title ? (
              <p className="text-xs font-medium text-ink">{item.title}</p>
            ) : null}
            {item.source_url ? (
              <a
                href={externalHref(item.source_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs break-all text-accent hover:underline"
              >
                {item.source_url}
              </a>
            ) : null}
            {item.excerpt ? (
              <p className="text-xs leading-relaxed text-muted">
                {item.excerpt}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Acción de investigación del sitio web de la empresa. Solo aparece para
 * admin/owner y solo si hay una URL cargada; el resultado se muestra tal como
 * lo devuelve el backend, sin completar contactos ni fuentes por cuenta propia.
 */
export function CompanyEnrichmentPanel({ company }: { company: Company }) {
  const currentUser = useCurrentUser();
  const enrich = useEnrichCompany(company.id);
  const [result, setResult] = useState<CompanyEnrichResult | null>(null);

  // Mientras no sepamos el rol no se muestra la acción, para no ofrecer un
  // botón que el backend va a rechazar con 403.
  if (currentUser.isPending) return null;

  if (!canEnrichCompanies(currentUser.data?.role)) {
    return (
      <p className="text-sm text-muted">
        Solo un administrador o propietario puede investigar el sitio web de la
        empresa.
      </p>
    );
  }

  const website = company.website?.trim() ?? "";
  const noWebsite = website.length === 0 || result?.status === "no_website";

  const run = () => {
    setResult(null);
    enrich.mutate(undefined, {
      onSuccess: (value) => setResult(value),
    });
  };

  return (
    <div className="space-y-2">
      {noWebsite ? (
        <>
          {result?.status === "no_website" ? (
            <EnrichSummary result={result} />
          ) : null}
          <p className="text-xs leading-relaxed text-muted">
            {website.length === 0
              ? "La ficha no tiene sitio web, así que no hay nada que investigar. Cargá la URL para habilitar la investigación."
              : "La investigación no encontró un sitio web utilizable. No se muestra la acción para no repetir una descarga que no aporta datos."}
          </p>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={run}
              disabled={enrich.isPending}
              aria-busy={enrich.isPending}
            >
              {enrich.isPending ? (
                <>
                  <Spinner label="Investigando el sitio" />
                  Investigando…
                </>
              ) : company.last_enriched_at ? (
                "Reenriquecer"
              ) : (
                "Investigar sitio web"
              )}
            </Button>
            <span className="text-xs text-muted">
              {enrich.isPending
                ? "Leyendo el sitio de la empresa. Puede tardar unos segundos."
                : "Descarga la página pública y registra fuentes, contactos publicados y evidencia."}
            </span>
          </div>

          {enrich.error ? (
            <Alert variant="danger" title="No se pudo investigar el sitio">
              {getErrorMessage(enrich.error)}
            </Alert>
          ) : null}

          {result ? (
            <>
              <EnrichSummary result={result} />
              <EnrichEvidence result={result} />
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
