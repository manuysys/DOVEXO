import type { LeadScoreItem } from "@/lib/api/types";
import { scoreBarClass, scoreTone } from "@/features/leads/score";
import { cn } from "@/lib/utils";

function ScoreMeter({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | null;
  hint?: string;
}) {
  const hasValue = value !== null && Number.isFinite(value);
  const safeValue = hasValue ? Math.max(0, Math.min(100, value)) : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-muted">{label}</span>
        <span className="text-sm font-semibold text-ink tabular-nums">
          {hasValue ? `${Math.round(value)}/100` : "—"}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={hasValue ? Math.round(value) : undefined}
        className="mt-1 h-2 w-full overflow-hidden rounded-full bg-canvas ring-1 ring-line ring-inset"
      >
        <div
          className={cn("h-full", scoreBarClass(hasValue ? value : null))}
          style={{ width: `${safeValue}%` }}
        />
      </div>
      {hint ? <p className="mt-1 text-[11px] text-muted">{hint}</p> : null}
    </div>
  );
}

export function ScoreSummary({
  score,
  confidence,
  reasons = [],
  breakdown = [],
  evaluatedAt,
}: {
  score: number | null;
  confidence: number | null;
  reasons?: string[];
  breakdown?: LeadScoreItem[];
  evaluatedAt?: string | null;
}) {
  const unevaluated =
    (score === null || score === undefined) &&
    (confidence === null || confidence === undefined);
  const tone = scoreTone(score);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <ScoreMeter
          label="Compatibilidad comercial"
          value={score}
          hint={
            tone === "success"
              ? "Buen encaje aparente con la propuesta."
              : tone === "warning"
                ? "Encaje parcial: conviene revisar razones."
                : tone === "danger"
                  ? "Encaje bajo con el perfil del producto."
                  : undefined
          }
        />
        <ScoreMeter
          label="Confianza de la información"
          value={confidence}
          hint="Qué tan completa y verificable es la evidencia disponible."
        />
      </div>

      {unevaluated ? (
        <p className="text-xs text-muted">
          Esta oportunidad todavía no fue evaluada. Calculá el score con el
          motor determinístico del backend para ver razones y desglose.
        </p>
      ) : null}

      {reasons.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">
            Razones
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-ink">
            {reasons.map((reason, index) => (
              <li key={`${index}-${reason}`} className="flex gap-2">
                <span aria-hidden="true" className="text-muted">
                  ·
                </span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {breakdown.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">
            Desglose del score
          </h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[320px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-semibold tracking-wide text-muted uppercase">
                  <th className="py-1.5 pr-3">Factor</th>
                  <th className="py-1.5 pr-3 text-right">Puntos</th>
                  <th className="py-1.5 text-right">Máximo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {breakdown.map((item) => (
                  <tr key={item.key}>
                    <td className="py-1.5 pr-3 text-xs text-ink">
                      {item.label}
                    </td>
                    <td className="py-1.5 pr-3 text-right text-xs text-ink tabular-nums">
                      {Math.round(item.points)}
                    </td>
                    <td className="py-1.5 text-right text-xs text-muted tabular-nums">
                      {item.max_points === null
                        ? "—"
                        : Math.round(item.max_points)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {evaluatedAt ? (
        <p className="text-[11px] text-muted">
          Última evaluación registrada: {evaluatedAt}
        </p>
      ) : null}
    </div>
  );
}
