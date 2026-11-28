import type { CompanyFact } from "@/lib/api/types";
import { formatConfidence, groupCompanyFacts } from "@/features/prospects/facts";
import { formatDateTime } from "@/lib/utils";

function externalHref(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

/**
 * Datos extraídos del sitio, agrupados por tipo. Solo se muestran los grupos
 * que tienen datos reales; cada valor conserva su confianza, su fecha y el
 * enlace a la página de origen para poder verificarlo.
 */
export function CompanyFactsList({ facts }: { facts: readonly CompanyFact[] }) {
  const groups = groupCompanyFacts(facts);
  if (groups.length === 0) return null;

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.type}>
          <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">
            {group.title}
          </h3>
          <ul className="mt-2 divide-y divide-line">
            {group.facts.map((fact, index) => {
              const confidence = formatConfidence(fact.confidence);
              return (
                <li
                  key={`${group.type}-${fact.id || index}-${fact.value}`}
                  className="space-y-1 py-2 first:pt-0 last:pb-0"
                >
                  <p className="text-sm break-words text-ink">{fact.value}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <span>
                      Confianza{" "}
                      <span className="font-medium text-ink">
                        {confidence ?? "—"}
                      </span>
                    </span>
                    <span>
                      Extraído{" "}
                      <span className="text-ink">
                        {formatDateTime(fact.collected_at)}
                      </span>
                    </span>
                    {fact.source_url ? (
                      <a
                        href={externalHref(fact.source_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-accent hover:underline"
                      >
                        {fact.source_url}
                      </a>
                    ) : (
                      <span>Sin URL de origen</span>
                    )}
                  </div>
                  {fact.source_title ? (
                    <p className="text-xs text-muted">{fact.source_title}</p>
                  ) : null}
                  {fact.evidence_excerpt ? (
                    <p className="border-l-2 border-line pl-2 text-xs leading-relaxed text-muted">
                      “{fact.evidence_excerpt}”
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
