import { describe, expect, it } from "vitest";
import {
  ENRICH_JOBS_POLL_MS,
  enrichJobStatusLabel,
  enrichmentJobPollInterval,
  enrichmentJobsPollInterval,
  isActiveEnrichJobStatus,
} from "@/features/prospects/enrichment";
import { canEnrichCompanies } from "@/features/prospects/permissions";
import { makeEnrichJob } from "./utils";

describe("isActiveEnrichJobStatus", () => {
  it("solo pending y running mantienen el polling activo", () => {
    expect(isActiveEnrichJobStatus("pending")).toBe(true);
    expect(isActiveEnrichJobStatus("running")).toBe(true);
    expect(isActiveEnrichJobStatus("completed")).toBe(false);
    expect(isActiveEnrichJobStatus("failed")).toBe(false);
    expect(isActiveEnrichJobStatus("unknown")).toBe(false);
  });
});

describe("enrichmentJobsPollInterval", () => {
  it("consulta cada 5 s solo mientras hay trabajos activos", () => {
    expect(
      enrichmentJobsPollInterval([
        makeEnrichJob({ status: "pending" }),
        makeEnrichJob({ id: "2", status: "completed" }),
      ]),
    ).toBe(ENRICH_JOBS_POLL_MS);
    expect(ENRICH_JOBS_POLL_MS).toBe(5_000);
  });

  it("deja de consultar cuando la cola está vacía o terminada", () => {
    expect(enrichmentJobsPollInterval(undefined)).toBe(false);
    expect(enrichmentJobsPollInterval([])).toBe(false);
    expect(
      enrichmentJobsPollInterval([
        makeEnrichJob({ status: "completed" }),
        makeEnrichJob({ id: "2", status: "failed" }),
      ]),
    ).toBe(false);
  });
});

describe("enrichmentJobPollInterval", () => {
  it("consulta el detalle hasta que el trabajo termina", () => {
    expect(enrichmentJobPollInterval(makeEnrichJob({ status: "running" }))).toBe(
      ENRICH_JOBS_POLL_MS,
    );
    expect(
      enrichmentJobPollInterval(makeEnrichJob({ status: "failed" })),
    ).toBe(false);
    expect(enrichmentJobPollInterval(undefined)).toBe(false);
  });
});

describe("enrichJobStatusLabel", () => {
  it("traduce los estados y conserva el estado crudo desconocido", () => {
    expect(enrichJobStatusLabel("pending", "queued")).toBe("En cola");
    expect(enrichJobStatusLabel("running", "running")).toBe("En ejecución");
    expect(enrichJobStatusLabel("completed", "ok")).toBe("Completado");
    expect(enrichJobStatusLabel("failed", "failed")).toBe("Falló");
    expect(enrichJobStatusLabel("unknown", "paused")).toBe("paused");
    expect(enrichJobStatusLabel("unknown", "")).toBe("Sin estado");
  });
});

describe("canEnrichCompanies", () => {
  it("solo habilita admin y owner", () => {
    expect(canEnrichCompanies("admin")).toBe(true);
    expect(canEnrichCompanies("OWNER")).toBe(true);
    expect(canEnrichCompanies("viewer")).toBe(false);
    expect(canEnrichCompanies("")).toBe(false);
    expect(canEnrichCompanies(null)).toBe(false);
    expect(canEnrichCompanies(undefined)).toBe(false);
  });
});
