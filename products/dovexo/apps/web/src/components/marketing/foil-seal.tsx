import { cn } from "@/lib/utils";

type FoilSealProps = {
  label: string;
  detail?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "size-20 text-[9px]",
  md: "size-28 text-[10px]",
  lg: "size-36 text-[11px]",
} as const;

/**
 * Sello de hojalata: una superficie iridiscente, un borde dentado y una sola
 * pasada de brillo. Es decorativo; el estado real se lee en la tarjeta que lo
 * acompaña.
 */
export function FoilSeal({ label, detail, className, size = "md" }: FoilSealProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "mk-foil-surface mk-foil-sheen relative grid shrink-0 place-items-center rounded-full p-[3px] shadow-[0_10px_30px_-16px_var(--mk-foil-shadow)]",
        sizes[size],
        className,
      )}
    >
      <div className="grid size-full place-items-center rounded-full border-[1.5px] border-dashed border-mk-ink/35 bg-mk-paper/95 px-2 text-center">
        <span className="mk-label leading-none font-bold text-mk-signal-strong">{label}</span>
        {detail && (
          <span className="mt-1 font-mono text-[9px] leading-none tracking-[-0.02em] text-mk-ink/70">
            {detail}
          </span>
        )}
      </div>
    </div>
  );
}
