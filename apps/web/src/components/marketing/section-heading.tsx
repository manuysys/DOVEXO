import { cn } from "@/lib/utils";

import { Reveal } from "./reveal";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  text?: string;
  tone?: "light" | "dark" | "teal";
  titleId?: string;
  className?: string;
};

const eyebrowTone = {
  light: "text-primary",
  dark: "text-mk-teal",
  teal: "text-white",
} as const;

const titleTone = {
  light: "text-text",
  dark: "text-white",
  teal: "text-white",
} as const;

const textTone = {
  light: "text-text-2",
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
    <Reveal className={cn("max-w-2xl", className)}>
      <p className={`text-label inline-flex items-center gap-3 ${eyebrowTone[tone]}`}>
        <span aria-hidden="true" className="h-px w-6 bg-current" />
        {eyebrow}
      </p>
      <h2 id={titleId} className={`text-h1 mt-4 text-balance ${titleTone[tone]}`}>
        {title}
      </h2>
      {text && <p className={`text-body mt-4 max-w-xl text-pretty ${textTone[tone]}`}>{text}</p>}
    </Reveal>
  );
}
