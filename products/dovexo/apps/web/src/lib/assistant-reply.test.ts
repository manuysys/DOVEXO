import { describe, expect, it } from "vitest";

import { extractAssistantEntities, parseAssistantReply } from "@/lib/assistant-reply";

describe("parseAssistantReply", () => {
  it("convierte presupuestos pendientes en título y tabla", () => {
    const blocks = parseAssistantReply(
      "Tenés 2 presupuesto(s) pendiente(s):\n" +
        "- QT-2026-0001 | Ana Pérez | $12,500.00\n" +
        "- QT-2026-0002 | Luis Gómez | $3,000.00",
    );

    expect(blocks).toEqual([
      { kind: "heading", text: "Tenés 2 presupuesto(s) pendiente(s)" },
      {
        kind: "table",
        headers: ["Presupuesto", "Cliente", "Total"],
        rows: [
          ["QT-2026-0001", "Ana Pérez", "$12,500.00"],
          ["QT-2026-0002", "Luis Gómez", "$3,000.00"],
        ],
      },
    ]);
  });

  it("convierte el resumen del negocio en pares etiqueta/valor", () => {
    const blocks = parseAssistantReply(
      "Resumen del negocio:\n- Clientes: 12\n- Órdenes abiertas: 4\n- Saldo pendiente: $1,000.00",
    );

    expect(blocks).toEqual([
      { kind: "heading", text: "Resumen del negocio" },
      {
        kind: "facts",
        entries: [
          { label: "Clientes", value: "12" },
          { label: "Órdenes abiertas", value: "4" },
          { label: "Saldo pendiente", value: "$1,000.00" },
        ],
      },
    ]);
  });

  it("reconoce la agenda con columnas de hora y orden", () => {
    const blocks = parseAssistantReply(
      "Turnos de hoy:\n- 10:00 | OT-2026-0001 | Reparación | Ana",
    );

    expect(blocks).toEqual([
      { kind: "heading", text: "Turnos de hoy" },
      {
        kind: "table",
        headers: ["Hora", "Orden", "Trabajo", "Técnico"],
        rows: [["10:00", "OT-2026-0001", "Reparación", "Ana"]],
      },
    ]);
  });

  it("conserva una tabla Markdown explícita y descarta el separador", () => {
    const blocks = parseAssistantReply(
      "| Presupuesto | Cliente |\n| --- | --- |\n| QT-2026-0003 | Marta |",
    );

    expect(blocks).toEqual([
      {
        kind: "table",
        headers: ["Presupuesto", "Cliente"],
        rows: [["QT-2026-0003", "Marta"]],
      },
    ]);
  });

  it("mantiene las viñetas simples como lista", () => {
    const blocks = parseAssistantReply("Puedo ayudarte con:\n- Presupuestos\n- Agenda");

    expect(blocks).toEqual([
      { kind: "heading", text: "Puedo ayudarte con" },
      { kind: "list", items: ["Presupuestos", "Agenda"] },
    ]);
  });

  it("no convierte una frase con dos puntos en un hecho", () => {
    const blocks = parseAssistantReply(
      "No pude interpretar la consulta. Probá con: presupuestos pendientes o agenda de hoy.",
    );

    expect(blocks).toEqual([
      {
        kind: "paragraph",
        text: "No pude interpretar la consulta. Probá con: presupuestos pendientes o agenda de hoy.",
      },
    ]);
  });

  it("devuelve una lista vacía para texto vacío", () => {
    expect(parseAssistantReply("   \n  ")).toEqual([]);
  });
});

describe("extractAssistantEntities", () => {
  it("detecta códigos únicos de presupuesto y orden", () => {
    const entities = extractAssistantEntities(
      "QT-2026-0001 y OT-2026-0007, otra vez QT-2026-0001",
    );

    expect(entities).toEqual([
      { code: "QT-2026-0001", type: "quote" },
      { code: "OT-2026-0007", type: "order" },
    ]);
  });

  it("no inventa entidades cuando no hay códigos", () => {
    expect(extractAssistantEntities("No hay datos para mostrar.")).toEqual([]);
  });
});
