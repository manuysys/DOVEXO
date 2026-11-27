import { cn, formatDateOnly } from "@/lib/utils";

const CIVIL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ARGENTINA_TZ = "America/Argentina/Buenos_Aires";
const DAY_MS = 24 * 60 * 60 * 1000;

/** Estados en los que el vencimiento todavía importa para el negocio. */
const PENDING_STATUSES = new Set(["draft", "sent"]);

/**
 * Días calendario entre hoy (zona argentina) y la fecha de vencimiento.
 * `0` es hoy, negativo es vencido. Devuelve `null` si la fecha no es válida.
 */
export function daysUntilDate(validUntil: string, today: Date = new Date()): number | null {
  const iso = CIVIL_DATE_PATTERN.test(validUntil) ? validUntil : validUntil.slice(0, 10);
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return null;

  // Fecha civil de hoy en Argentina (YYYY-MM-DD) para no comparar con UTC.
  const todayIso = new Intl.DateTimeFormat("en-CA", {
    timeZone: ARGENTINA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(today);
  const [todayYear, todayMonth, todayDay] = todayIso.split("-").map(Number);

  const target = Date.UTC(year, month - 1, day);
  const current = Date.UTC(todayYear, todayMonth - 1, todayDay);
  return Math.round((target - current) / DAY_MS);
}

type ExpiryTone = "neutral" | "warning" | "danger";

export type ExpiryState = {
  label: string;
  tone: ExpiryTone;
  /** Días restantes; negativo si ya venció. `null` sin fecha o fecha inválida. */
  days: number | null;
};

export function quoteExpiryState(validUntil: string | null, status: string): ExpiryState {
  if (!validUntil) {
    return { label: "Sin vencimiento", tone: "neutral", days: null };
  }

  const days = daysUntilDate(validUntil);
  if (days === null) {
    return { label: "Sin vencimiento", tone: "neutral", days: null };
  }

  const isPending = PENDING_STATUSES.has(status);

  if (days < 0) {
    const overdue = Math.abs(days);
    return {
      label: `Venció hace ${overdue} ${overdue === 1 ? "día" : "días"}`,
      tone: isPending ? "danger" : "neutral",
      days,
    };
  }

  if (days === 0) {
    return { label: "Vence hoy", tone: isPending ? "warning" : "neutral", days };
  }

  if (days <= 7) {
    return {
      label: `Vence en ${days} ${days === 1 ? "día" : "días"}`,
      tone: isPending ? "warning" : "neutral",
      days,
    };
  }

  return { label: `Vence el ${formatDateOnly(validUntil)}`, tone: "neutral", days };
}

const TONE_CLASS: Record<ExpiryTone, string> = {
  neutral: "text-text-2",
  warning: "text-warning-strong",
  danger: "text-danger-strong",
};

type QuoteExpiryProps = {
  validUntil: string | null;
  status: string;
  className?: string;
};

/** Vencimiento legible con tono según urgencia. Solo avisa si el presupuesto sigue abierto. */
export function QuoteExpiry({ validUntil, status, className }: QuoteExpiryProps) {
  const expiry = quoteExpiryState(validUntil, status);
  return (
    <span className={cn("text-caption", TONE_CLASS[expiry.tone], className)}>{expiry.label}</span>
  );
}
