import { describe, expect, it } from "vitest";
import {
  normalizeCompany,
  normalizeCompanyEnrichBatch,
  normalizeCompanyEnrichJob,
  normalizeCompanyEnrichJobs,
  normalizeCompanyEnrichment,
  normalizeEnrichJobStatus,
  normalizeEnrichStatus,
  normalizeFactType,
} from "@/lib/api/normalize";

describe("normalizeEnrichStatus", () => {
  it("acepta los cuatro estados del contrato y variantes con guion", () => {
    expect(normalizeEnrichStatus("ok")).toBe("ok");
    expect(normalizeEnrichStatus("no_website")).toBe("no_website");
    expect(normalizeEnrichStatus("no-website")).toBe("no_website");
    expect(normalizeEnrichStatus("UNSAFE")).toBe("unsafe");
    expect(normalizeEnrichStatus("fetch-error")).toBe("fetch_error");
    expect(normalizeEnrichStatus("cualquier-cosa")).toBe("unknown");
  });
});

describe("normalizeCompanyEnrichment", () => {
  it("lee la respuesta completa del endpoint", () => {
    const result = normalizeCompanyEnrichment({
      company_id: 10,
      status: "ok",
      fields_updated: ["email", "phone"],
      contacts_added: 2,
      facts_added: 3,
      sources_added: 1,
      evidence: [
        {
          source_url: "https://empresa-de-prueba.com.ar/contacto",
          title: "Contacto",
          excerpt: "Teléfono: 341 555 0000",
        },
      ],
    });

    expect(result.company_id).toBe("10");
    expect(result.status).toBe("ok");
    expect(result.fields_updated).toEqual(["email", "phone"]);
    expect(result.contacts_added).toBe(2);
    expect(result.facts_added).toBe(3);
    expect(result.sources_added).toBe(1);
    expect(result.evidence).toEqual([
      {
        source_url: "https://empresa-de-prueba.com.ar/contacto",
        title: "Contacto",
        excerpt: "Teléfono: 341 555 0000",
      },
    ]);
    expect(result.error).toBeNull();
  });

  it("tolera camelCase, conteos como texto y evidencia parcial", () => {
    const result = normalizeCompanyEnrichment({
      companyId: "11",
      status: "FETCH_ERROR",
      fieldsUpdated: "email",
      newContacts: "1",
      newSources: 0,
      error: "El sitio no respondió",
      evidence: [
        { sourceUrl: "https://empresa-de-prueba.com.ar", snippet: "Inicio" },
        {},
      ],
    });

    expect(result.company_id).toBe("11");
    expect(result.status).toBe("fetch_error");
    expect(result.contacts_added).toBe(1);
    expect(result.facts_added).toBe(0);
    expect(result.sources_added).toBe(0);
    expect(result.error).toBe("El sitio no respondió");
    // El elemento vacío se descarta; no se inventan URLs ni textos.
    expect(result.evidence).toEqual([
      {
        source_url: "https://empresa-de-prueba.com.ar",
        title: null,
        excerpt: "Inicio",
      },
    ]);
  });

  it("no inventa datos cuando la respuesta es inesperada", () => {
    const result = normalizeCompanyEnrichment(null);

    expect(result.status).toBe("unknown");
    expect(result.company_id).toBeNull();
    expect(result.contacts_added).toBe(0);
    expect(result.facts_added).toBe(0);
    expect(result.sources_added).toBe(0);
    expect(result.fields_updated).toEqual([]);
    expect(result.evidence).toEqual([]);
    expect(result.error).toBeNull();
  });

  it("conserva el estado no_website sin contactos ni fuentes", () => {
    const result = normalizeCompanyEnrichment({
      company_id: 12,
      status: "no_website",
      fields_updated: [],
      contacts_added: 0,
      sources_added: 0,
      evidence: [],
    });

    expect(result.status).toBe("no_website");
    expect(result.contacts_added).toBe(0);
    expect(result.sources_added).toBe(0);
  });
});

describe("normalizeCompany.last_enriched_at", () => {
  it("lee last_enriched_at y la variante camelCase", () => {
    const snake = normalizeCompany({
      id: 10,
      name: "Empresa de prueba",
      last_enriched_at: "2026-11-25T12:00:00Z",
    });
    const camel = normalizeCompany({
      id: 10,
      name: "Empresa de prueba",
      lastEnrichedAt: "2026-11-25T12:00:00Z",
    });

    expect(snake.last_enriched_at).toBe("2026-11-25T12:00:00Z");
    expect(camel.last_enriched_at).toBe("2026-11-25T12:00:00Z");
  });

  it("deja null cuando la empresa nunca fue investigada", () => {
    const company = normalizeCompany({
      id: 10,
      name: "Empresa de prueba",
      last_enriched_at: null,
    });

    expect(company.last_enriched_at).toBeNull();
  });
});

describe("normalizeFactType", () => {
  it("acepta los tipos del contrato y variantes en español", () => {
    expect(normalizeFactType("service")).toBe("service");
    expect(normalizeFactType("activities")).toBe("activity");
    expect(normalizeFactType("Localidades")).toBe("locality");
    expect(normalizeFactType("coverage-area")).toBe("coverage");
    expect(normalizeFactType("contact_pages")).toBe("contact_page");
    expect(normalizeFactType("descripción")).toBe("description");
    expect(normalizeFactType("otro")).toBe("unknown");
  });
});

describe("normalizeCompany · facts y contactos con fuente", () => {
  it("lee los facts extraídos con confianza, fecha y origen", () => {
    const company = normalizeCompany({
      id: 10,
      name: "Empresa de prueba",
      facts: [
        {
          id: 3,
          fact_type: "service",
          value: "Instalación de aires acondicionados",
          normalized_value: "instalación de aires acondicionados",
          source_url: "https://empresa-de-prueba.com.ar/servicios",
          source_title: "Servicios",
          evidence_excerpt: "Instalación y mantenimiento",
          confidence: 0.82,
          collected_at: "2026-11-25T12:00:00Z",
        },
        { id: 4, fact_type: "coverage", value: "" },
      ],
    });

    expect(company.facts).toHaveLength(1);
    expect(company.facts[0]).toEqual({
      id: "3",
      fact_type: "service",
      raw_fact_type: "service",
      value: "Instalación de aires acondicionados",
      normalized_value: "instalación de aires acondicionados",
      source_url: "https://empresa-de-prueba.com.ar/servicios",
      source_title: "Servicios",
      evidence_excerpt: "Instalación y mantenimiento",
      confidence: 0.82,
      collected_at: "2026-11-25T12:00:00Z",
    });
  });

  it("no inventa facts cuando la empresa no los trae", () => {
    const company = normalizeCompany({ id: 10, name: "Sin facts" });
    expect(company.facts).toEqual([]);
  });

  it("lee el origen y la verificación de cada contacto", () => {
    const company = normalizeCompany({
      id: 10,
      name: "Empresa de prueba",
      contacts: [
        {
          id: 1,
          contact_type: "whatsapp",
          value: "+5493415550000",
          verification_status: "published",
          source_url: "https://empresa-de-prueba.com.ar/contacto",
          source_title: "Contacto",
          source_collected_at: "2026-11-25T12:00:00Z",
          source_confidence: 0.7,
          verified_at: null,
        },
        {
          id: 2,
          contact_type: "whatsapp",
          value: "+5493415550001",
          verification_status: "verified",
          verified_at: "2026-11-26T10:00:00Z",
        },
      ],
    });

    expect(company.contacts[0]).toMatchObject({
      source_url: "https://empresa-de-prueba.com.ar/contacto",
      source_title: "Contacto",
      source_collected_at: "2026-11-25T12:00:00Z",
      source_confidence: 0.7,
      verified_at: null,
    });
    expect(company.contacts[1]).toMatchObject({
      verification_status: "verified",
      source_url: null,
      source_confidence: null,
      verified_at: "2026-11-26T10:00:00Z",
    });
  });
});

describe("normalizeEnrichJobStatus", () => {
  it("mapea los estados de la cola", () => {
    expect(normalizeEnrichJobStatus("queued")).toBe("pending");
    expect(normalizeEnrichJobStatus("IN_PROGRESS")).toBe("running");
    expect(normalizeEnrichJobStatus("success")).toBe("completed");
    expect(normalizeEnrichJobStatus("error")).toBe("failed");
    expect(normalizeEnrichJobStatus("raro")).toBe("unknown");
  });
});

describe("normalizeCompanyEnrichJobs", () => {
  it("lee la lista envuelta y el resultado guardado del trabajo", () => {
    const jobs = normalizeCompanyEnrichJobs({
      items: [
        {
          id: 5,
          company_id: 10,
          company_name: "Empresa de prueba",
          status: "completed",
          attempts: 1,
          max_attempts: 3,
          error_message: null,
          result: {
            status: "ok",
            contacts_added: 2,
            facts_added: 4,
            sources_added: 1,
            evidence: [],
          },
          created_at: "2026-11-27T12:00:00Z",
          started_at: "2026-11-27T12:00:05Z",
          finished_at: "2026-11-27T12:00:10Z",
        },
      ],
    });

    expect(jobs).toHaveLength(1);
    const job = jobs[0];
    expect(job?.id).toBe("5");
    expect(job?.company_id).toBe("10");
    expect(job?.company_name).toBe("Empresa de prueba");
    expect(job?.status).toBe("completed");
    expect(job?.attempts).toBe(1);
    expect(job?.max_attempts).toBe(3);
    expect(job?.result).toMatchObject({
      status: "ok",
      contacts_added: 2,
      facts_added: 4,
      sources_added: 1,
      error: null,
    });
  });

  it("deja result null y conserva el error del trabajo fallido", () => {
    const job = normalizeCompanyEnrichJob({
      id: 6,
      company_id: 11,
      status: "failed",
      attempts: 3,
      max_attempts: 3,
      error_message: "El sitio no respondió",
    });

    expect(job.status).toBe("failed");
    expect(job.result).toBeNull();
    expect(job.error_message).toBe("El sitio no respondió");
  });
});

describe("normalizeCompanyEnrichBatch", () => {
  it("lee queued, skipped, candidates y los trabajos encolados", () => {
    const result = normalizeCompanyEnrichBatch({
      queued: 2,
      skipped: 1,
      candidates: 3,
      jobs: [
        { id: 9, company_id: 10, status: "queued" },
        { id: 10, company_id: 11, status: "pending" },
      ],
    });

    expect(result.queued).toBe(2);
    expect(result.skipped).toBe(1);
    expect(result.candidates).toBe(3);
    expect(result.jobs).toHaveLength(2);
    expect(result.jobs[0]).toMatchObject({
      id: "9",
      company_id: "10",
      status: "pending",
    });
  });

  it("no inventa conteos cuando la respuesta es inesperada", () => {
    const result = normalizeCompanyEnrichBatch(null);
    expect(result).toEqual({
      queued: 0,
      skipped: 0,
      jobs: [],
      candidates: 0,
    });
  });
});
