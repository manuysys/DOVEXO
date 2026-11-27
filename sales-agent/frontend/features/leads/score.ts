/** Utilidades de presentación del scoring (compatibilidad y confianza). */

export type ScoreTone = "success" | "warning" | "danger" | "neutral";

export function scoreTone(score: number | null | undefined): ScoreTone {
  if (score === null || score === undefined) return "neutral";
  if (score >= 70) return "success";
  if (score >= 40) return "warning";
  return "danger";
}

export function formatScore(score: number | null | undefined): string {
  return score === null || score === undefined ? "—" : String(Math.round(score));
}

/** "88/82" para tablas compactas: compatibilidad / confianza. */
export function formatScorePair(
  score: number | null | undefined,
  confidence: number | null | undefined,
): string {
  if (
    (score === null || score === undefined) &&
    (confidence === null || confidence === undefined)
  ) {
    return "—";
  }
  return `${formatScore(score)}/${formatScore(confidence)}`;
}

export function scoreBarClass(score: number | null | undefined): string {
  switch (scoreTone(score)) {
    case "success":
      return "bg-success";
    case "warning":
      return "bg-warning";
    case "danger":
      return "bg-danger";
    default:
      return "bg-line";
  }
}
