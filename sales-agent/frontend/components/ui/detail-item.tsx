import type { ReactNode } from "react";

/** Par etiqueta/valor para fichas y resúmenes. */
export function DetailItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm break-words text-ink">{children}</dd>
    </div>
  );
}
