/**
 * Formato de fechas y moneda.
 *
 * Regla del producto: se guarda en UTC y se presenta en `es-AR` con la zona
 * horaria de Argentina, sin importar la configuración del dispositivo.
 */

const TIME_ZONE = "America/Argentina/Buenos_Aires";

const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: TIME_ZONE,
});

const weekdayDateFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: TIME_ZONE,
});

const longDateFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: TIME_ZONE,
});

const timeFormatter = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: TIME_ZONE,
});

const hourFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  hour12: false,
  timeZone: TIME_ZONE,
});

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  const date = toDate(value);
  return date ? dateTimeFormatter.format(date) : "Sin fecha";
}

export function formatDate(value: string | Date | null | undefined): string {
  const date = toDate(value);
  return date ? dateFormatter.format(date) : "Sin fecha";
}

export function formatWeekdayDate(value: string | Date | null | undefined): string {
  const date = toDate(value);
  return date ? capitalize(weekdayDateFormatter.format(date)) : "Sin fecha";
}

export function formatLongDate(value: string | Date | null | undefined): string {
  const date = toDate(value);
  return date ? capitalize(longDateFormatter.format(date)) : "Sin fecha";
}

export function formatTime(value: string | Date | null | undefined): string {
  const date = toDate(value);
  return date ? timeFormatter.format(date) : "--:--";
}

export function formatCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "-";
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return "-";
  return currencyFormatter.format(amount);
}

export function formatQuantity(value: string | number): string {
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return String(value);
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(amount);
}

/** Clave `YYYY-MM-DD` en horario argentino, para agrupar por día. */
export function dayKey(value: string | Date): string {
  const date = toDate(value);
  return date ? dayKeyFormatter.format(date) : "";
}

/** "Hoy", "Mañana" o "lun 24 nov". */
export function relativeDayLabel(value: string | Date): string {
  const date = toDate(value);
  if (!date) return "Sin fecha";
  const key = dayKey(date);
  if (key === dayKey(new Date())) return "Hoy";
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (key === dayKey(tomorrow)) return "Mañana";
  return formatWeekdayDate(date);
}

export function isToday(value: string | Date): boolean {
  return dayKey(value) === dayKey(new Date());
}

export function isFuture(value: string | Date): boolean {
  const date = toDate(value);
  return date ? date.getTime() >= Date.now() : false;
}

/** "Buen día" / "Buenas tardes" / "Buenas noches" según la hora argentina. */
export function greeting(value: Date = new Date()): string {
  const hour = Number(hourFormatter.format(value));
  if (hour < 12) return "Buen día";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

export function todayLabel(): string {
  return capitalize(
    new Intl.DateTimeFormat("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: TIME_ZONE,
    }).format(new Date()),
  );
}