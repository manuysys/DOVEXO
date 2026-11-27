import { describe, expect, it } from "vitest";

import {
  agendaErrorMessage,
  appointmentDurationMinutes,
  appointmentMinutes,
  customerLocation,
  detectAgendaConflicts,
  findOverlappingAppointment,
  formatDuration,
  formatDayLong,
  formatMinutesAsTime,
  formatWeekRange,
  minutesOfDay,
  startOfWeek,
  technicianDayLoad,
  toAgendaCustomers,
  weekDaysFor,
} from "@/components/agenda/agenda-utils";
import { ApiError, type Appointment, type Customer, type Technician, type WorkOrder } from "@/lib/api";

/** 12:00Z = 09:00 en Buenos Aires (UTC-3, sin horario de verano). */
const DAY = "2026-11-18";

function makeAppointment(input: {
  id: string;
  startsAt: string;
  endsAt: string;
  technicianId?: string;
  orderId?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}): Appointment {
  return {
    id: input.id,
    tenant_id: "tenant",
    work_order_id: input.orderId ?? "order",
    technician_id: input.technicianId ?? "tech-1",
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    status: input.status ?? "scheduled",
    notes: null,
    created_at: input.createdAt ?? input.startsAt,
    updated_at: input.updatedAt ?? input.createdAt ?? input.startsAt,
  };
}

function makeTechnician(id: string, fullName: string): Technician {
  return { id, full_name: fullName, email: `${id}@example.com` };
}

function makeOrder(input: {
  id: string;
  code: string;
  scheduledAt: string | null;
  assignedUserId?: string | null;
  status?: string;
}): WorkOrder {
  return {
    id: input.id,
    tenant_id: "tenant",
    customer_id: "customer-1",
    service_request_id: null,
    code: input.code,
    title: "Service de aire",
    description: null,
    priority: "normal",
    commercial_status: "pending",
    operational_status: input.status ?? "scheduled",
    payment_status: "pending",
    assigned_user_id: input.assignedUserId ?? null,
    scheduled_at: input.scheduledAt,
    started_at: null,
    finished_at: null,
    created_at: "2026-11-01T12:00:00Z",
    updated_at: "2026-11-01T12:00:00Z",
  };
}

const technicians: Technician[] = [
  makeTechnician("tech-1", "Juan Pérez"),
  makeTechnician("tech-2", "María López"),
];

describe("minutesOfDay", () => {
  it("convierte un instante a minutos en hora argentina", () => {
    expect(minutesOfDay("2026-11-18T12:30:00Z")).toBe(9 * 60 + 30);
    expect(minutesOfDay("2026-11-18T03:00:00Z")).toBe(0);
  });

  it("formatea minutos como HH:MM", () => {
    expect(formatMinutesAsTime(570)).toBe("09:30");
    expect(formatMinutesAsTime(0)).toBe("00:00");
    expect(formatMinutesAsTime(1439)).toBe("23:59");
  });
});

describe("appointmentMinutes", () => {
  it("devuelve inicio y fin en minutos del día", () => {
    const appointment = makeAppointment({
      id: "a1",
      startsAt: "2026-11-18T12:00:00Z",
      endsAt: "2026-11-18T13:30:00Z",
    });
    expect(appointmentMinutes(appointment)).toEqual({ start: 540, end: 630 });
    expect(appointmentDurationMinutes(appointment)).toBe(90);
  });

  it("recorta a fin de día cuando el turno cruza medianoche", () => {
    const appointment = makeAppointment({
      id: "a2",
      startsAt: "2026-11-18T23:30:00Z",
      endsAt: "2026-11-19T03:30:00Z",
    });
    expect(appointmentMinutes(appointment)).toEqual({ start: 20 * 60 + 30, end: 24 * 60 });
  });
});

describe("formatDuration", () => {
  it("describe horas y minutos en español", () => {
    expect(formatDuration(0)).toBe("0 min");
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(90)).toBe("1 h 30 min");
    expect(formatDuration(120)).toBe("2 h");
  });
});

describe("semanas", () => {
  it("arranca el lunes y devuelve siete días", () => {
    expect(startOfWeek(DAY)).toBe("2026-11-16");
    expect(startOfWeek("2026-11-22")).toBe("2026-11-16");
    expect(weekDaysFor(DAY)).toEqual([
      "2026-11-16",
      "2026-11-17",
      "2026-11-18",
      "2026-11-19",
      "2026-11-20",
      "2026-11-21",
      "2026-11-22",
    ]);
  });

  it("describe el rango de la semana", () => {
    const label = formatWeekRange(weekDaysFor(DAY));
    expect(label).toContain("16");
    expect(label).toContain("22");
    expect(label).toContain("noviembre");
  });
});

describe("detectAgendaConflicts", () => {
  it("detecta turnos superpuestos del mismo técnico", () => {
    const appointments = [
      makeAppointment({
        id: "a1",
        startsAt: "2026-11-18T12:00:00Z",
        endsAt: "2026-11-18T13:00:00Z",
      }),
      makeAppointment({
        id: "a2",
        startsAt: "2026-11-18T12:30:00Z",
        endsAt: "2026-11-18T13:30:00Z",
      }),
    ];

    const conflicts = detectAgendaConflicts({ day: DAY, appointments, orders: [], technicians });
    const overlap = conflicts.filter((conflict) => conflict.kind === "overlap");

    expect(overlap).toHaveLength(1);
    expect(overlap[0].severity).toBe("danger");
    expect(overlap[0].appointmentIds).toEqual(["a1", "a2"]);
    expect(overlap[0].description).toContain("Juan Pérez");
  });

  it("no marca superposición entre técnicos distintos", () => {
    const appointments = [
      makeAppointment({
        id: "a1",
        startsAt: "2026-11-18T12:00:00Z",
        endsAt: "2026-11-18T13:00:00Z",
        technicianId: "tech-1",
      }),
      makeAppointment({
        id: "a2",
        startsAt: "2026-11-18T12:00:00Z",
        endsAt: "2026-11-18T13:00:00Z",
        technicianId: "tech-2",
      }),
    ];

    const conflicts = detectAgendaConflicts({ day: DAY, appointments, orders: [], technicians });
    expect(conflicts.filter((conflict) => conflict.kind === "overlap")).toHaveLength(0);
  });

  it("ignora turnos cancelados", () => {
    const appointments = [
      makeAppointment({
        id: "a1",
        startsAt: "2026-11-18T12:00:00Z",
        endsAt: "2026-11-18T13:00:00Z",
      }),
      makeAppointment({
        id: "a2",
        startsAt: "2026-11-18T12:00:00Z",
        endsAt: "2026-11-18T13:00:00Z",
        status: "cancelled",
      }),
    ];

    const conflicts = detectAgendaConflicts({ day: DAY, appointments, orders: [], technicians });
    expect(conflicts.filter((conflict) => conflict.kind === "overlap")).toHaveLength(0);
  });

  it("marca visitas agendadas sin técnico asignado", () => {
    const orders = [
      makeOrder({ id: "order-1", code: "OT-2026-0001", scheduledAt: "2026-11-18T12:00:00Z" }),
      makeOrder({
        id: "order-2",
        code: "OT-2026-0002",
        scheduledAt: "2026-11-18T14:00:00Z",
        assignedUserId: "tech-1",
      }),
    ];

    const conflicts = detectAgendaConflicts({ day: DAY, appointments: [], orders, technicians });
    const unassigned = conflicts.filter((conflict) => conflict.kind === "unassigned");

    expect(unassigned).toHaveLength(1);
    expect(unassigned[0].orderIds).toEqual(["order-1"]);
    expect(unassigned[0].description).toContain("OT-2026-0001");
  });

  it("no marca órdenes finalizadas ni de otros días", () => {
    const orders = [
      makeOrder({
        id: "order-1",
        code: "OT-2026-0001",
        scheduledAt: "2026-11-18T12:00:00Z",
        status: "finished",
      }),
      makeOrder({ id: "order-2", code: "OT-2026-0002", scheduledAt: "2026-11-19T12:00:00Z" }),
    ];

    const conflicts = detectAgendaConflicts({ day: DAY, appointments: [], orders, technicians });
    expect(conflicts.filter((conflict) => conflict.kind === "unassigned")).toHaveLength(0);
  });

  it("detecta turnos asignados a técnicos que ya no están activos", () => {
    const appointments = [
      makeAppointment({
        id: "a1",
        startsAt: "2026-11-18T12:00:00Z",
        endsAt: "2026-11-18T13:00:00Z",
        technicianId: "tech-baja",
      }),
    ];

    const conflicts = detectAgendaConflicts({ day: DAY, appointments, orders: [], technicians });
    expect(conflicts.filter((conflict) => conflict.kind === "inactive_technician")).toHaveLength(1);
  });

  it("detecta turnos reprogramados por la diferencia entre creación y actualización", () => {
    const appointments = [
      makeAppointment({
        id: "a1",
        startsAt: "2026-11-18T12:00:00Z",
        endsAt: "2026-11-18T13:00:00Z",
        createdAt: "2026-11-10T12:00:00Z",
        updatedAt: "2026-11-16T12:00:00Z",
      }),
    ];

    const conflicts = detectAgendaConflicts({ day: DAY, appointments, orders: [], technicians });
    expect(conflicts.filter((conflict) => conflict.kind === "rescheduled")).toHaveLength(1);
  });

  it("no marca reprogramados cuando no hubo cambios posteriores", () => {
    const appointments = [
      makeAppointment({
        id: "a1",
        startsAt: "2026-11-18T12:00:00Z",
        endsAt: "2026-11-18T13:00:00Z",
        createdAt: "2026-11-10T12:00:00Z",
        updatedAt: "2026-11-10T12:00:00Z",
      }),
    ];

    const conflicts = detectAgendaConflicts({ day: DAY, appointments, orders: [], technicians });
    expect(conflicts.filter((conflict) => conflict.kind === "rescheduled")).toHaveLength(0);
  });

  it("marca agenda completa cuando no quedan franjas libres", () => {
    const appointments = [
      makeAppointment({
        id: "a1",
        startsAt: "2026-11-18T11:00:00Z",
        endsAt: "2026-11-18T16:00:00Z",
      }),
      makeAppointment({
        id: "a2",
        startsAt: "2026-11-18T16:00:00Z",
        endsAt: "2026-11-18T22:00:00Z",
      }),
    ];

    const conflicts = detectAgendaConflicts({ day: DAY, appointments, orders: [], technicians });
    expect(conflicts.filter((conflict) => conflict.kind === "fully_booked")).toHaveLength(1);
  });

  it("no marca agenda completa si queda una franja de 30 minutos", () => {
    const appointments = [
      makeAppointment({
        id: "a1",
        startsAt: "2026-11-18T11:00:00Z",
        endsAt: "2026-11-18T16:00:00Z",
      }),
    ];

    const conflicts = detectAgendaConflicts({ day: DAY, appointments, orders: [], technicians });
    expect(conflicts.filter((conflict) => conflict.kind === "fully_booked")).toHaveLength(0);
  });

  it("ordena primero los conflictos graves", () => {
    const appointments = [
      makeAppointment({
        id: "a1",
        startsAt: "2026-11-18T12:00:00Z",
        endsAt: "2026-11-18T13:00:00Z",
      }),
      makeAppointment({
        id: "a2",
        startsAt: "2026-11-18T12:30:00Z",
        endsAt: "2026-11-18T13:30:00Z",
      }),
    ];
    const orders = [makeOrder({ id: "order-1", code: "OT-2026-0001", scheduledAt: "2026-11-18T18:00:00Z" })];

    const conflicts = detectAgendaConflicts({ day: DAY, appointments, orders, technicians });
    expect(conflicts[0].severity).toBe("danger");
    expect(conflicts.at(-1)?.severity).not.toBe("danger");
  });
});

describe("technicianDayLoad", () => {
  it("suma minutos ocupados y detecta franjas libres", () => {
    const appointments = [
      makeAppointment({
        id: "a1",
        startsAt: "2026-11-18T12:00:00Z",
        endsAt: "2026-11-18T14:00:00Z",
      }),
    ];

    const load = technicianDayLoad(appointments, "tech-1");
    expect(load.count).toBe(1);
    expect(load.occupiedMinutes).toBe(120);
    expect(load.hasFreeSlot).toBe(true);
  });

  it("devuelve disponibilidad total sin turnos", () => {
    const load = technicianDayLoad([], "tech-1");
    expect(load).toEqual({ count: 0, occupiedMinutes: 0, hasFreeSlot: true });
  });
});

describe("findOverlappingAppointment", () => {
  const existing = makeAppointment({
    id: "a1",
    startsAt: "2026-11-18T12:00:00Z",
    endsAt: "2026-11-18T13:00:00Z",
  });

  it("encuentra el turno que se superpone", () => {
    const found = findOverlappingAppointment({
      appointments: [existing],
      technicianId: "tech-1",
      startsAt: "2026-11-18T12:30:00Z",
      endsAt: "2026-11-18T13:30:00Z",
    });
    expect(found?.id).toBe("a1");
  });

  it("ignora turnos cancelados, de otros técnicos y el turno excluido", () => {
    expect(
      findOverlappingAppointment({
        appointments: [{ ...existing, status: "cancelled" }],
        technicianId: "tech-1",
        startsAt: "2026-11-18T12:30:00Z",
        endsAt: "2026-11-18T13:30:00Z",
      }),
    ).toBeNull();

    expect(
      findOverlappingAppointment({
        appointments: [existing],
        technicianId: "tech-2",
        startsAt: "2026-11-18T12:30:00Z",
        endsAt: "2026-11-18T13:30:00Z",
      }),
    ).toBeNull();

    expect(
      findOverlappingAppointment({
        appointments: [existing],
        technicianId: "tech-1",
        startsAt: "2026-11-18T12:30:00Z",
        endsAt: "2026-11-18T13:30:00Z",
        excludeAppointmentId: "a1",
      }),
    ).toBeNull();
  });

  it("devuelve null con una ventana inválida", () => {
    expect(
      findOverlappingAppointment({
        appointments: [existing],
        technicianId: "tech-1",
        startsAt: "2026-11-18T13:00:00Z",
        endsAt: "2026-11-18T12:00:00Z",
      }),
    ).toBeNull();
  });
});

describe("agendaErrorMessage", () => {
  it("traduce los mensajes de conflicto del backend", () => {
    const error = new ApiError(409, "Technician has a conflicting appointment");
    expect(agendaErrorMessage(error, "Fallback")).toContain("ya tiene otra visita");
  });

  it("mantiene mensajes desconocidos y usa el fallback si no es ApiError", () => {
    expect(agendaErrorMessage(new ApiError(400, "Otro error"), "Fallback")).toBe("Otro error");
    expect(agendaErrorMessage(new Error("boom"), "Fallback")).toBe("Fallback");
  });
});

describe("clientes de la agenda", () => {
  const base: Customer = {
    id: "customer-1",
    tenant_id: "tenant",
    name: "Carlos Gomez",
    phone: null,
    email: null,
    notes: null,
    status: "active",
    created_at: "2026-11-01T12:00:00Z",
    updated_at: "2026-11-01T12:00:00Z",
  };

  it("lee dirección y ciudad del response aunque el tipo compartido no las declare", () => {
    const [customer] = toAgendaCustomers([
      { ...base, address: "Av. Siempreviva 742", city: "CABA" } as Customer,
    ]);
    expect(customer.address).toBe("Av. Siempreviva 742");
    expect(customerLocation(customer)).toBe("Av. Siempreviva 742, CABA");
  });

  it("devuelve null cuando no hay ubicación cargada", () => {
    const [customer] = toAgendaCustomers([base]);
    expect(customer.address).toBeNull();
    expect(customerLocation(customer)).toBeNull();
    expect(customerLocation(undefined)).toBeNull();
  });
});

describe("formatDayLong", () => {
  it("describe el día en español", () => {
    const label = formatDayLong(DAY).toLowerCase();
    expect(label).toContain("miércoles");
    expect(label).toContain("18");
    expect(label).toContain("noviembre");
  });
});
