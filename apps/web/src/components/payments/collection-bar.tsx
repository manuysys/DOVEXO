import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

type CollectionBarProps = {
  /** Total cobrado (pagos registrados). Decimal serializado. */
  collected: string;
  /** Pendiente de cobro. Decimal serializado. */
  pending: string;
  isLoading?: boolean;
  isError?: boolean;
};

/**
 * Barra proporcional cobrado vs pendiente. Solo usa los números para el ancho:
 * los importes mostrados salen del string original, sin redondeos.
 */
export function CollectionBar({
  collected,
  pending,
  isLoading = false,
  isError = false,
}: CollectionBarProps) {
  if (isLoading) {
    return (
      <section
        className="border-border bg-surface rounded-ds-lg border p-5 shadow-card"
        aria-busy="true"
      >
        <span className="sr-only">Cargando comparación de importes…</span>
        <Skeleton className="bg-surface-2 h-3 w-32" />
        <Skeleton className="bg-surface-2 mt-3 h-2.5 w-full rounded-full" />
        <Skeleton className="bg-surface-2 mt-3 h-8 w-full" />
      </section>
    );
  }

  if (isError) {
    return (
      <section className="border-border bg-surface rounded-ds-lg border p-5 shadow-card">
        <h2 className="text-text text-sm font-semibold">Cobrado vs pendiente</h2>
        <p className="text-danger-strong mt-2 text-sm">
          No se pudo cargar la comparación de importes.
        </p>
      </section>
    );
  }

  const collectedValue = Math.max(0, Number(collected));
  const pendingValue = Math.max(0, Number(pending));
  const total = collectedValue + pendingValue;

  if (!Number.isFinite(total) || total <= 0) {
    return (
      <section className="border-border bg-surface rounded-ds-lg border p-5 shadow-card">
        <h2 className="text-text text-sm font-semibold">Cobrado vs pendiente</h2>
        <p className="text-text-2 mt-2 text-sm">
          Todavía no hay importes aprobados ni cobrados para comparar.
        </p>
      </section>
    );
  }

  const collectedShare = Math.min(100, Math.max(0, Math.round((collectedValue / total) * 100)));
  const pendingShare = 100 - collectedShare;

  return (
    <section
      aria-labelledby="collection-bar-title"
      className="border-border bg-surface rounded-ds-lg border p-5 shadow-card"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="collection-bar-title" className="text-text text-sm font-semibold">
          Cobrado vs pendiente
        </h2>
        <p className="text-text-2 numeric text-xs">{collectedShare}% cobrado</p>
      </div>

      <div
        role="img"
        aria-label={`Cobrado ${formatCurrency(collected)} sobre un total de ${formatCurrency(
          String(collectedValue + pendingValue),
        )}`}
        className="bg-surface-2 mt-3 flex h-2.5 overflow-hidden rounded-full"
      >
        <span className="bg-success h-full" style={{ width: `${collectedShare}%` }} />
        <span className="bg-warning h-full" style={{ width: `${pendingShare}%` }} />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-text-2 text-caption flex items-center gap-1.5">
            <span aria-hidden="true" className="bg-success h-2 w-2 rounded-full" />
            Cobrado
          </dt>
          <dd className="text-text numeric mt-0.5 font-semibold">{formatCurrency(collected)}</dd>
        </div>
        <div>
          <dt className="text-text-2 text-caption flex items-center gap-1.5">
            <span aria-hidden="true" className="bg-warning h-2 w-2 rounded-full" />
            Pendiente
          </dt>
          <dd className="text-text numeric mt-0.5 font-semibold">{formatCurrency(pending)}</dd>
        </div>
      </dl>
      <p className="text-text-2 mt-3 text-xs">
        Cobrado suma pagos registrados. Pendiente es lo aprobado que todavía no se cobró.
      </p>
    </section>
  );
}
