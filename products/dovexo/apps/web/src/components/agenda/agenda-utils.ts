import { errorMessage, type Appointment, type Customer, type Technician, type WorkOrder } from "@/lib/api";
import { argentinaDayKey, appointmentsOnDay } from "@/lib/agenda";
import { ARGENTINA_TIME_ZONE } from "@/lib/utils";

/** Vistas del calendario operativo. */
export type AgendaView = "day" | "week" | "team";

export const AGENDA_VIEWS: ReadonlyArray<{ value: AgendaView; label: string }> = [
  { value: "day", label: "Día" },
  { value: "week", label: "Semana" },
  { value: "team", label: "Equipo" },
];

/** Franja operativa de referencia: 08:00 a 19:00, hora argentina. */
export const AGENDA_WINDOW = { start: 8 * 60, end: 19 * 60 } as const;

/** Una franja libre menor a 30 minutos no se considera disponible para asignar. */
export const MIN_FREE_SLOT_MINUTES = 30;

/** Tolerancia entre `created_at` y `updated_at` antes de considerar un turno reprogramado. */
export const RESCHEDULE_TOLERANCE_MS = 60_000;

const MINUTES_PER_DAY = 24 * 60;

const timePartsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: ARGENTINA_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const weekdayShortFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  timeZone: "UTC",
});

const dayNumberFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  timeZone: "UTC",
});

const dayNumericFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  timeZone: "UTC",
});

const dayLongFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

const monthYearFormatter = new Intl.DateTimeFormat("es-AR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** Fecha civil `YYYY-MM-DD` como `Date` a mediodía UTC (evita corrimientos de zona). */
function civilDate(day: string): Date {
  return new Date(`${day}T12:00:00Z`);
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Minutos desde las 00:00 en hora argentina. */
export function minutesOfDay(value: string | Date): number {
  const parts = timePartsFormatter.formatToParts(new Date(value));
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

export function formatMinutesAsTime(totalMinutes: number): string {
  const minutes = ((totalMinutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/** Inicio y fin del turno en minutos del día de inicio; un turno que cruza medianoche termina a las 24:00. */
export function appointmentMinutes(appointment: Appointment): { start: number; end: number } {
  const start = minutesOfDay(appointment.starts_at);
  const sameDay = argentinaDayKey(appointment.starts_at) === argentinaDayKey(appointment.ends_at);
  const rawEnd = sameDay ? minutesOfDay(appointment.ends_at) : MINUTES_PER_DAY;
  return { start, end: Math.max(rawEnd, start) };
}

export function appointmentDurationMinutes(appointment: Appointment): number {
  const { start, end } = appointmentMinutes(appointment);
  return Math.max(end - start, 0);
}

/** `1 h 30 min`, `45 min`, `2 h`. */
export function formatDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0 min";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

/** Hora `HH:mm` en formato 24 h, independiente del locale del navegador. */
export function formatAppointmentTime(value: string): string {
  return formatMinutesAsTime(minutesOfDay(value));
}

export function formatTimeRange(appointment: Appointment): string {
  return `${formatAppointmentTime(appointment.starts_at)} – ${formatAppointmentTime(appointment.ends_at)}`;
}

export function formatDayLong(day: string): string {
  return capitalize(dayLongFormatter.format(civilDate(day)).replace(",", ""));
}

/** Igual que `formatDayLong` pero en minúscula inicial, para usar dentro de una oración. */
export function formatDaySentence(day: string): string {
  const label = formatDayLong(day);
  return label.charAt(0).toLowerCase() + label.slice(1);
}

export function formatDayNumber(day: string): string {
  return dayNumberFormatter.format(civilDate(day));
}

export function formatWeekdayShort(day: string): string {
  return capitalize(weekdayShortFormatter.format(civilDate(day)).replace(".", ""));
}

/** Rango legible de una semana: `17 al 23 de noviembre de 2026`. */
export function formatWeekRange(days: readonly string[]): string {
  if (days.length === 0) return "";
  const first = days[0];
  const last = days[days.length - 1];
  const firstDate = civilDate(first);
  const lastDate = civilDate(last);
  const firstMonth = monthYearFormatter.format(firstDate);
  const lastMonth = monthYearFormatter.format(lastDate);

  if (firstMonth === lastMonth) {
    return `${dayNumericFormatter.format(firstDate)} al ${dayNumericFormatter.format(lastDate)} de ${firstMonth}`;
  }
  const firstLabel = dayLongFormatter.format(firstDate).replace(",", "");
  const lastLabel = dayLongFormatter.format(lastDate).replace(",", "");
  return `${capitalize(firstLabel)} al ${lastLabel}`;
}

/** Lunes de la semana que contiene el día indicado. */
export function startOfWeek(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  const weekday = date.getUTCDay();
  const delta = weekday === 0 ? -6 : 1 - weekday;
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

/** Los siete días `YYYY-MM-DD` de la semana que contiene `day`, de lunes a domingo. */
export function weekDaysFor(day: string): string[] {
  const monday = new Date(`${startOfWeek(day)}T00:00:00Z`);
  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(monday);
    current.setUTCDate(monday.getUTCDate() + index);
    return current.toISOString().slice(0, 10);
  });
}

/* ───────────────────────────── Clientes ───────────────────────────── */

/**
 * El backend devuelve `address`, `city` y `province` en `CustomerResponse`, pero
 * `lib/api.ts` todavía no los declara. Se leen de forma segura sin tocar el cliente
 * compartido para no duplicar el cambio con otros módulos.
 */
export type AgendaCustomer = Customer & {
  address: string | null;
  city: string | null;
  province: string | null;
};

export function toAgendaCustomers(items: readonly Customer[]): AgendaCustomer[] {
  return items.map((customer) => {
    const extra = customer as Customer &
      Partial<Pick<AgendaCustomer, "address" | "city" | "province">>;
    return {
      ...customer,
      address: extra.address ?? null,
      city: extra.city ?? null,
      province: extra.province ?? null,
    };
  });
}

/** Dirección legible del cliente o `null` si no hay datos cargados. */
export function customerLocation(customer: AgendaCustomer | undefined): string | null {
  if (!customer) return null;
  const parts = [customer.address, customer.city, customer.province]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
  return parts.length > 0 ? parts.join(", ") : null;
}

/* ───────────────────────────── Conflictos ───────────────────────────── */

export type AgendaConflictKind =
  | "overlap"
  | "unassigned"
  | "inactive_technician"
  | "rescheduled"
  | "fully_booked";

export type AgendaConflictSeverity = "danger" | "warning" | "info";

export type AgendaConflict = {
  id: string;
  kind: AgendaConflictKind;
  severity: AgendaConflictSeverity;
  /** Etiqueta corta visible, además del color y el icono. */
  label: string;
  title: string;
  description: string;
  appointmentIds: string[];
  orderIds: string[];
};

export const CONFLICT_LABELS: Record<AgendaConflictKind, string> = {
  overlap: "Superposición",
  unassigned: "Sin técnico",
  inactive_technician: "Técnico inactivo",
  rescheduled: "Reprogramada",
  fully_booked: "Agenda completa",
};

const SEVERITY_ORDER: Record<AgendaConflictSeverity, number> = {
  danger: 0,
  warning: 1,
  info: 2,
};

type TechnicianLoad = {
  count: number;
  occupiedMinutes: number;
  hasFreeSlot: boolean;
};

/** Carga del día de un técnico dentro de la franja operativa. */
export function technicianDayLoad(
  appointments: readonly Appointment[],
  technicianId: string,
): TechnicianLoad {
  const active = appointments.filter(
    (appointment) => appointment.technician_id === technicianId && appointment.status !== "cancelled",
  );
  const intervals = active
    .map((appointment) => appointmentMinutes(appointment))
    .map(({ start, end }) => ({
      start: Math.max(start, AGENDA_WINDOW.start),
      end: Math.min(end, AGENDA_WINDOW.end),
    }))
    .filter((interval) => interval.end > interval.start)
    .sort((a, b) => a.start - b.start);

  let occupiedMinutes = 0;
  let cursor = AGENDA_WINDOW.start;
  let hasFreeSlot = false;

  for (const interval of intervals) {
    if (interval.start - cursor >= MIN_FREE_SLOT_MINUTES) hasFreeSlot = true;
    const start = Math.max(cursor, interval.start);
    const end = Math.max(start, interval.end);
    occupiedMinutes += end - start;
    cursor = Math.max(cursor, end);
  }
  if (AGENDA_WINDOW.end - cursor >= MIN_FREE_SLOT_MINUTES) hasFreeSlot = true;

  return { count: active.length, occupiedMinutes, hasFreeSlot };
}

type DetectConflictsInput = {
  day: string;
  appointments: readonly Appointment[];
  orders: readonly WorkOrder[];
  technicians: readonly Technician[];
};

/**
 * Conflictos detectables con los datos disponibles en el panel: superposiciones,
 * visitas sin técnico, técnicos que ya no están activos, turnos reprogramados y
 * agendas sin franjas libres. El backend sigue siendo la autoridad final.
 */
export function detectAgendaConflicts({
  day,
  appointments,
  orders,
  technicians,
}: DetectConflictsInput): AgendaConflict[] {
  const dayAppointments = appointmentsOnDay(appointments, day).filter(
    (appointment) => appointment.status !== "cancelled",
  );
  const activeTechnicianIds = new Set(technicians.map((technician) => technician.id));
  const technicianNames = new Map(
    technicians.map((technician): [string, string] => [technician.id, technician.full_name]),
  );
  const conflicts: AgendaConflict[] = [];

  const byTechnician = new Map<string, Appointment[]>();
  for (const appointment of dayAppointments) {
    const list = byTechnician.get(appointment.technician_id) ?? [];
    list.push(appointment);
    byTechnician.set(appointment.technician_id, list);
  }

  for (const [technicianId, list] of byTechnician) {
    const sorted = [...list].sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
    let cluster: Appointment[] = [];
    let clusterEnd = 0;

    const flush = () => {
      if (cluster.length > 1) {
        const ranges = cluster.map((appointment) => formatTimeRange(appointment)).join(", ");
        conflicts.push({
          id: `overlap:${technicianId}:${cluster.map((appointment) => appointment.id).join(":")}`,
          kind: "overlap",
          severity: "danger",
          label: CONFLICT_LABELS.overlap,
          title: "Turnos superpuestos",
          description: `${technicianNames.get(technicianId) ?? "Un técnico"} tiene ${cluster.length} visitas que se superponen: ${ranges}. Reprogramá una de las dos.`,
          appointmentIds: cluster.map((appointment) => appointment.id),
          orderIds: [...new Set(cluster.map((appointment) => appointment.work_order_id))],
        });
      }
      cluster = [];
      clusterEnd = 0;
    };

    for (const appointment of sorted) {
      const start = Date.parse(appointment.starts_at);
      const end = Math.max(Date.parse(appointment.ends_at), start);
      if (cluster.length > 0 && start >= clusterEnd) flush();
      cluster.push(appointment);
      clusterEnd = Math.max(clusterEnd, end);
    }
    flush();
  }

  // Sin lista de técnicos (rol de consulta) no se puede afirmar que un turno esté inactivo.
  if (technicians.length > 0) {
    for (const appointment of dayAppointments) {
      if (activeTechnicianIds.has(appointment.technician_id)) continue;
      conflicts.push({
        id: `inactive:${appointment.id}`,
        kind: "inactive_technician",
        severity: "warning",
        label: CONFLICT_LABELS.inactive_technician,
        title: "Turno con un técnico que no está activo",
        description: `La visita de las ${formatAppointmentTime(appointment.starts_at)} está asignada a alguien que ya no figura entre los técnicos activos de la empresa. Reasignala.`,
        appointmentIds: [appointment.id],
        orderIds: [appointment.work_order_id],
      });
    }
  }

  for (const appointment of dayAppointments) {
    if (appointment.status !== "scheduled") continue;
    const created = Date.parse(appointment.created_at);
    const updated = Date.parse(appointment.updated_at);
    if (!Number.isFinite(created) || !Number.isFinite(updated)) continue;
    if (updated - created <= RESCHEDULE_TOLERANCE_MS) continue;
    conflicts.push({
      id: `rescheduled:${appointment.id}`,
      kind: "rescheduled",
      severity: "info",
      label: CONFLICT_LABELS.rescheduled,
      title: "Visita reprogramada",
      description: `La visita de las ${formatAppointmentTime(appointment.starts_at)} se modificó después de crearse (${formatDaySentence(argentinaDayKey(new Date(updated)))}). Confirmá el horario con el cliente.`,
      appointmentIds: [appointment.id],
      orderIds: [appointment.work_order_id],
    });
  }

  const scheduledOrders = orders.filter(
    (order) =>
      order.scheduled_at !== null &&
      argentinaDayKey(order.scheduled_at) === day &&
      order.operational_status !== "finished" &&
      order.operational_status !== "cancelled",
  );
  for (const order of scheduledOrders) {
    if (order.assigned_user_id) continue;
    const time = order.scheduled_at ? formatAppointmentTime(order.scheduled_at) : "";
    conflicts.push({
      id: `unassigned:${order.id}`,
      kind: "unassigned",
      severity: "warning",
      label: CONFLICT_LABELS.unassigned,
      title: "Visita sin técnico asignado",
      description: `${order.code} (${order.title}) está agendada${time ? ` a las ${time}` : ""} y no tiene técnico. Asigná un técnico o creá el turno.`,
      appointmentIds: [],
      orderIds: [order.id],
    });
  }

  for (const [technicianId, list] of byTechnician) {
    if (!activeTechnicianIds.has(technicianId)) continue;
    const load = technicianDayLoad(list, technicianId);
    if (load.count === 0 || load.hasFreeSlot) continue;
    conflicts.push({
      id: `fully-booked:${technicianId}`,
      kind: "fully_booked",
      severity: "warning",
      label: CONFLICT_LABELS.fully_booked,
      title: "Agenda completa",
      description: `${technicianNames.get(technicianId) ?? "El técnico"} no tiene franjas libres de ${MIN_FREE_SLOT_MINUTES} minutos entre las 08:00 y las 19:00.`,
      appointmentIds: list.map((appointment) => appointment.id),
      orderIds: [...new Set(list.map((appointment) => appointment.work_order_id))],
    });
  }

  return conflicts.sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.title.localeCompare(b.title),
  );
}

export function conflictsForAppointment(
  conflicts: readonly AgendaConflict[],
  appointmentId: string,
): AgendaConflict[] {
  return conflicts.filter((conflict) => conflict.appointmentIds.includes(appointmentId));
}

export function countConflictsByKind(
  conflicts: readonly AgendaConflict[],
  kind: AgendaConflictKind,
): number {
  return conflicts.filter((conflict) => conflict.kind === kind).length;
}

/* ───────────────────────────── Mensajes y validaciones ───────────────────────────── */

/** Traduce los `detail` de negocio del backend a mensajes accionables en español. */
const BACKEND_MESSAGES: Record<string, string> = {
  "Technician has a conflicting appointment":
    "Ese técnico ya tiene otra visita en ese horario. Elegí otro horario u otro técnico.",
  "Technician is not an active member of this tenant":
    "El técnico elegido no está activo en la empresa. Elegí otro técnico.",
  "Cannot schedule an appointment for a finished or cancelled work order":
    "No se puede agendar una orden finalizada o cancelada.",
  "ends_at must be after starts_at": "El fin tiene que ser posterior al inicio.",
  "Cancelled appointments cannot be edited": "Un turno cancelado no se puede reprogramar.",
  "Appointment is already cancelled": "El turno ya estaba cancelado.",
  "Appointment not found": "No encontramos el turno. Actualizá la agenda y volvé a intentar.",
  "Work order not found": "No encontramos la orden asociada al turno.",
};

export function agendaErrorMessage(error: unknown, fallback: string): string {
  const message = errorMessage(error, fallback);
  return BACKEND_MESSAGES[message] ?? message;
}

type FindOverlapInput = {
  appointments: readonly Appointment[];
  technicianId: string;
  startsAt: string;
  endsAt: string;
  excludeAppointmentId?: string;
};

/** Turno que se superpone con la ventana indicada para el mismo técnico. */
export function findOverlappingAppointment({
  appointments,
  technicianId,
  startsAt,
  endsAt,
  excludeAppointmentId,
}: FindOverlapInput): Appointment | null {
  const start = Date.parse(startsAt);
  const end = Date.parse(endsAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;

  return (
    appointments.find((appointment) => {
      if (appointment.technician_id !== technicianId) return false;
      if (appointment.status === "cancelled") return false;
      if (appointment.id === excludeAppointmentId) return false;
      return Date.parse(appointment.starts_at) < end && Date.parse(appointment.ends_at) > start;
    }) ?? null
  );
}

/** Etiqueta de variante de `Badge` para el estado del turno. */
export function appointmentStatusVariant(
  status: string,
): "success" | "danger" | "warning" | "info" | "neutral" {
  switch (status) {
    case "completed":
      return "success";
    case "cancelled":
      return "danger";
    case "no_show":
      return "warning";
    case "scheduled":
      return "info";
    default:
      return "neutral";
  }
}

/** Resumen de texto para el encabezado según la vista activa. */
export function agendaRangeLabel(view: AgendaView, day: string, days: readonly string[]): string {
  if (view === "week") return formatWeekRange(days);
  return formatDayLong(day);
}

/**
 * Cliente del turno. `api.customers.list` devuelve hasta 50 clientes; si el cliente
 * no está en esa página se muestra un texto genérico en lugar de un nombre inventado.
 */
export function customerNameFor(
  customers: readonly AgendaCustomer[],
  customerId: string | null | undefined,
): string | null {
  if (!customerId) return null;
  return customers.find((customer) => customer.id === customerId)?.name ?? null;
}
