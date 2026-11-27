import { describe, expect, it } from "vitest";
import {
  normalizeCampaignStart,
  normalizeImportBatch,
  normalizeImportConfirm,
  normalizeImportPreview,
  normalizeImports,
} from "@/lib/api/normalize";

describe("normalizeImportPreview", () => {
  it("lee el contrato del preview con conteos y errores", () => {
    const preview = normalizeImportPreview({
      batch_id: 7,
      filename: "empresas.csv",
      total_rows: 3,
      valid_rows: 1,
      invalid_rows: 1,
      duplicates: 1,
      preview: [
        {
          row_number: 2,
          name: "Empresa de prueba",
          website: "https://empresa-de-prueba.com.ar",
          province: "AR-S",
          locality: "Rosario",
          phone: "+5493415550000",
          email: null,
          sectors: ["hvac"],
          status: "valid",
          errors: [],
        },
        {
          row_number: 3,
          name: "",
          website: null,
          province: null,
          locality: null,
          phone: null,
          email: null,
          sectors: [],
          status: "invalid",
          errors: ["Falta el nombre"],
        },
      ],
      errors: [{ row_number: 3, message: "Fila inválida" }],
    });

    expect(preview.batch_id).toBe("7");
    expect(preview.total_rows).toBe(3);
    expect(preview.valid_rows).toBe(1);
    expect(preview.invalid_rows).toBe(1);
    expect(preview.duplicates).toBe(1);
    expect(preview.preview).toHaveLength(2);
    expect(preview.preview[0]?.sectors).toEqual(["hvac"]);
    expect(preview.preview[1]?.errors).toEqual(["Falta el nombre"]);
    expect(preview.errors).toEqual([{ row_number: 3, message: "Fila inválida" }]);
  });

  it("deriva los conteos desde las filas cuando faltan", () => {
    const preview = normalizeImportPreview({
      batch_id: "9",
      rows: [
        { row: 2, name: "A", status: "ok" },
        { row: 3, name: "B", status: "duplicate" },
        { row: 4, name: "C", status: "invalid", errors: ["sin provincia"] },
      ],
    });

    expect(preview.total_rows).toBe(3);
    expect(preview.valid_rows).toBe(1);
    expect(preview.duplicates).toBe(1);
    expect(preview.invalid_rows).toBe(1);
    expect(preview.preview[0]?.row_number).toBe(2);
  });

  it("no inventa filas si la API devuelve una lista vacía", () => {
    const preview = normalizeImportPreview({ batch_id: 1, preview: [] });
    expect(preview.preview).toEqual([]);
    expect(preview.batch_id).toBe("1");
  });
});

describe("normalizeImportConfirm y lotes", () => {
  it("lee el resultado de confirmación", () => {
    const result = normalizeImportConfirm({
      batch_id: 5,
      created: 12,
      skipped: 3,
      errors: ["Fila 4: sin rubro"],
    });

    expect(result.batch_id).toBe("5");
    expect(result.created).toBe(12);
    expect(result.skipped).toBe(3);
    expect(result.errors).toEqual([{ row_number: 0, message: "Fila 4: sin rubro" }]);
  });

  it("normaliza el historial de importaciones envuelto en items", () => {
    const batches = normalizeImports({
      items: [
        {
          id: 2,
          filename: "empresas.csv",
          status: "confirmed",
          total_rows: 5,
          successful_rows: 4,
          skipped_rows: 1,
          imported_at: "2026-11-21T09:00:00Z",
          report_url: "/api/v1/imports/2/report",
        },
      ],
    });

    expect(batches).toHaveLength(1);
    expect(batches[0]).toMatchObject({
      id: "2",
      filename: "empresas.csv",
      status: "confirmed",
      created: 4,
      skipped: 1,
      report_url: "/api/v1/imports/2/report",
    });
  });

  it("devuelve nulos cuando no hay informe", () => {
    const batch = normalizeImportBatch({ id: 3, filename: "x.csv" });
    expect(batch.report_url).toBeNull();
    expect(batch.status).toBe("unknown");
  });
});

describe("normalizeCampaignStart", () => {
  it("lee campaña, corridas provinciales y total de jobs", () => {
    const result = normalizeCampaignStart({
      campaign: { id: 1, name: "Campaña", status: "active" },
      search_runs: [
        { id: 11, province_code: "AR-X", status: "pending" },
        { id: 12, province_code: "AR-S", status: "pending" },
      ],
      total_jobs: 2,
    });

    expect(result.campaign?.id).toBe("1");
    expect(result.campaign?.status).toBe("active");
    expect(result.search_runs).toHaveLength(2);
    expect(result.search_runs[0]).toMatchObject({
      id: "11",
      province_code: "AR-X",
      status: "pending",
    });
    expect(result.total_jobs).toBe(2);
  });

  it("tolera la respuesta anterior, que era la campaña sola", () => {
    const result = normalizeCampaignStart({ id: 3, name: "Vieja", status: "active" });
    expect(result.campaign?.id).toBe("3");
    expect(result.search_runs).toEqual([]);
    expect(result.total_jobs).toBe(0);
  });
});
