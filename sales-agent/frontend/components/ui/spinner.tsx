import { cn } from "@/lib/utils";

export function Spinner({
  className,
  label = "Cargando",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
    />
  );
}

export function LoadingBlock({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-lg border border-line bg-surface px-6 py-12 text-sm text-muted">
      <Spinner />
      <span>{label}</span>
    </div>
  );
}

export function FullPageLoading({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <LoadingBlock label={label} />
    </div>
  );
}

export function FullPageError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md rounded-lg border border-line bg-surface p-6 text-center">
        <h1 className="text-base font-semibold text-ink">
          No se pudo verificar la sesión
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{message}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 text-sm font-medium text-accent hover:underline"
          >
            Reintentar
          </button>
        ) : null}
      </div>
    </div>
  );
}
