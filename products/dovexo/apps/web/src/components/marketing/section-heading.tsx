import { cn } from "@/lib/utils";

import { TextReveal } from "./text-reveal";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  text?: string;
  tone?: "light" | "dark" | "teal";
  titleId?: string;
  className?: string;
};

const eyebrowTone = {
  light: "text-mk-signal-strong",
  dark: "text-mk-teal",
  teal: "text-white",
} as const;

const titleTone = {
  light: "text-mk-ink",
  dark: "text-white",
  teal: "text-white",
} as const;

const textTone = {
  light: "text-mk-ink/70",
  dark: "text-white/70",
  teal: "text-white/80",
} as const;

/**
 * Encabezado de sección: etiqueta con filete, título display y texto opcional.
 * Las tres variantes mantienen contraste AA sobre su fondo (claro, deep y color).
 *
 * Las clases de tipografía se concatenan con template literal a propósito:
 * tailwind-merge no conoce `text-h1`/`text-body` y las trataría como color.
 */
export function SectionHeading({
  eyebrow,
  title,
  text,
  tone = "light",
  titleId,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", className)}>
      {eyebrow ? (
        <p className={`text-label inline-flex items-center gap-3 ${eyebrowTone[tone]}`}>
          <span aria-hidden="true" className="h-px w-6 bg-current" />
          {eyebrow}
        </p>
      ) : null}
      <TextReveal
        as="h2"
        id={titleId}
        text={title}
        className={`mk-display text-[clamp(2.5rem,4.6vw,3.75rem)] leading-[1.02] font-medium tracking-[-0.035em] text-balance ${titleTone[tone]}`}
      />
      {text && <p className={`text-body mt-5 max-w-xl text-pretty ${textTone[tone]}`}>{text}</p>}
    </div>
  );
}
