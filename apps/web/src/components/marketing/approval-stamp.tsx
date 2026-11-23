import { cn } from "@/lib/utils";

type ApprovalStampProps = {
  label?: string;
  detail?: string;
  className?: string;
  size?: "sm" | "md";
};

/**
 * Sello de aprobación legible: un objeto rectangular con doble borde, tinta
 * naranja y una entrada de scale/rotación. Vive dentro del panel, no flota
 * fuera de él ni se recorta con el tilt.
 */
export function ApprovalStamp({
  label = "Aprobado",
  detail,
  className,
  size = "sm",
}: ApprovalStampProps) {
  return (
    <span
      className={cn(
        "relative inline-grid -rotate-2 place-items-center rounded-[4px] border-2 border-mk-signal-strong/75 bg-mk-paper px-4 py-2 text-mk-signal-strong shadow-[0_10px_24px_-18px_rgb(15_15_15/0.7)] after:pointer-events-none after:absolute after:inset-1 after:rounded-[2px] after:border after:border-mk-signal-strong/35",
        size === "sm" ? "min-w-[120px] px-3 py-1.5" : "min-w-[178px] px-5 py-3",
        className,
      )}
      role="img"
      aria-label={detail ? `${label}, ${detail}` : label}
    >
      <span
        className={cn(
          "mk-display leading-none font-bold uppercase tracking-[0.02em]",
          size === "sm" ? "text-[16px]" : "text-[22px]",
        )}
      >
        {label}
      </span>
      {detail ? (
        <span className="mt-1 font-mono text-[12px] leading-none tracking-[0.02em] text-mk-signal-strong">
          {detail}
        </span>
      ) : null}
    </span>
  );
}
