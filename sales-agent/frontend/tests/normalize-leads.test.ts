import { describe, expect, it } from "vitest";
import {
  normalizeActivities,
  normalizeLead,
  normalizeLeadPage,
  normalizeLeadScoreResult,
  normalizeMessage,
  normalizeSimulatedInbound,
  normalizeSuppressions,
  normalizeWhatsAppStatus,
  normalizeWhatsAppThreadDetail,
} from "@/lib/api/normalize";

describe("normalizeLead", () => {
  it("lee empresa y producto anidados con score y razones", () => {
    const lead = normalizeLead({
      lead: {
        id: 5,
        status: "pending_review",
        compatibility_score: 72,
        information_confidence: 64,
        reasons: ["Ofrece mantenimiento."],
        score_breakdown: {
          sector: { points: 24, max: 30, label: "Afinidad del rubro" },
          evidence_quality: 6,
        },
        assigned_notes: "Llamar",
        company: {
          id: 10,
          name: "Empresa de prueba",
          locality: "Rosario",
          website: "https://empresa-de-prueba.com.ar",
          primary_phone: "+5493415550000",
        },
        product: { id: 1, name: "DOVEXO" },
      },
    });

    expect(lead.id).toBe("5");
    expect(lead.company_id).toBe("10");
    expect(lead.company_name).toBe("Empresa de prueba");
    expect(lead.company_locality).toBe("Rosario");
    expect(lead.company_phone).toBe("+5493415550000");
    expect(lead.product_name).toBe("DOVEXO");
    expect(lead.status).toBe("pending_review");
    expect(lead.score).toBe(72);
    expect(lead.confidence).toBe(64);
    expect(lead.breakdown).toEqual([
      { key: "sector", label: "Afinidad del rubro", points: 24, max_points: 30 },
      {
        key: "evidence_quality",
        label: "Calidad de la evidencia comercial",
        points: 6,
        max_points: null,
      },
    ]);
  });

  it("no inventa score cuando la oportunidad no fue evaluada", () => {
    const lead = normalizeLead({ id: 7, status: "nuevo", company_id: 10 });
    expect(lead.score).toBeNull();
    expect(lead.confidence).toBeNull();
    expect(lead.status).toBe("unknown");
    expect(lead.raw_status).toBe("nuevo");
    expect(lead.breakdown).toEqual([]);
  });

  it("normaliza listas paginadas", () => {
    const page = normalizeLeadPage({
      items: [{ id: 1, status: "approved" }],
      total: 1,
      limit: 50,
      offset: 0,
    });
    expect(page.total).toBe(1);
    expect(page.items[0]?.status).toBe("approved");
  });
});

describe("normalizeLeadScoreResult", () => {
  it("acepta la evaluación envuelta con score, razones y desglose", () => {
    const result = normalizeLeadScoreResult({
      lead: { id: 5, status: "researched" },
      evaluation: {
        score: 81,
        confidence: 55,
        reasons: ["Instala equipos."],
        score_breakdown: { sector: 20 },
      },
    });

    expect(result.lead?.id).toBe("5");
    expect(result.score).toBe(81);
    expect(result.confidence).toBe(55);
    expect(result.reasons).toEqual(["Instala equipos."]);
    expect(result.breakdown[0]).toMatchObject({
      key: "sector",
      points: 20,
    });
    expect(result.evaluation?.score).toBe(81);
  });
});

describe("normalizeMessage", () => {
  it("prefiere el texto editado y detecta el modo simulado", () => {
    const message = normalizeMessage({
      id: 31,
      generated_text: "Hola",
      edited_text: "Hola, soy Juan Manuel.",
      status: "pending",
      message_type: "first_contact",
      sent_via: "console",
    });

    expect(message.text).toBe("Hola, soy Juan Manuel.");
    expect(message.status).toBe("pending_approval");
    expect(message.simulated).toBe(true);
    expect(message.message_type).toBe("first_contact");
  });
});

describe("WhatsApp", () => {
  it("normaliza estado del proveedor", () => {
    const status = normalizeWhatsAppStatus({
      configured: false,
      mode: "console",
      sender_phone: null,
      founder_phone_set: true,
    });
    expect(status.configured).toBe(false);
    expect(status.mode).toBe("console");
    expect(status.founder_phone_set).toBe(true);
  });

  it("normaliza el thread con direcciones entrantes y salientes", () => {
    const detail = normalizeWhatsAppThreadDetail({
      thread: { id: 7, phone: "+5493415550000", name: "Empresa" },
      messages: [
        { id: 71, direction: "in", text: "Hola" },
        { id: 72, direction: "outbound", body: "Buen día" },
      ],
    });

    expect(detail.thread?.id).toBe("7");
    expect(detail.messages[0]?.direction).toBe("inbound");
    expect(detail.messages[1]).toMatchObject({
      direction: "outbound",
      text: "Buen día",
    });
  });

  it("normaliza la respuesta de simulación", () => {
    const simulated = normalizeSimulatedInbound({
      thread_id: 7,
      reply: "Gracias por escribir",
    });
    expect(simulated.thread_id).toBe("7");
    expect(simulated.text).toBe("Gracias por escribir");
  });
});

describe("actividades y supresiones", () => {
  it("normaliza actividades con empresa anidada", () => {
    const activities = normalizeActivities({
      items: [
        {
          id: 1,
          activity_type: "note",
          description: "Llamada",
          occurred_at: "2026-11-22T11:00:00Z",
          next_action_at: "2026-11-23T11:00:00Z",
          company: { id: 10, name: "Empresa de prueba" },
        },
      ],
    });

    expect(activities[0]).toMatchObject({
      id: "1",
      activity_type: "note",
      company_id: "10",
      company_name: "Empresa de prueba",
      next_action_at: "2026-11-23T11:00:00Z",
    });
  });

  it("normaliza la lista de no contacto", () => {
    const suppressions = normalizeSuppressions([
      { id: 3, normalized_contact: "+5493415550000", reason: "Pidió no ser contactado" },
    ]);
    expect(suppressions[0]).toMatchObject({
      id: "3",
      value: "+5493415550000",
      reason: "Pidió no ser contactado",
    });
  });
});
