import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api";
import {
  EXPORT_FALLBACK_MESSAGE,
  EXPORT_FORBIDDEN_MESSAGE,
  EXPORT_KINDS,
  canExportData,
  exportErrorMessage,
  exportPath,
  fallbackExportFilename,
  filenameFromContentDisposition,
} from "@/lib/export-utils";

describe("canExportData", () => {
  it("allows owner, admin and dispatcher only", () => {
    expect(canExportData("owner")).toBe(true);
    expect(canExportData("admin")).toBe(true);
    expect(canExportData("dispatcher")).toBe(true);
    expect(canExportData("technician")).toBe(false);
    expect(canExportData("viewer")).toBe(false);
    expect(canExportData("")).toBe(false);
    expect(canExportData(null)).toBe(false);
    expect(canExportData(undefined)).toBe(false);
  });
});

describe("exportPath", () => {
  it("maps each kind to the backend export route", () => {
    expect(EXPORT_KINDS.map(exportPath)).toEqual([
      "/api/v1/exports/customers.csv",
      "/api/v1/exports/orders.csv",
      "/api/v1/exports/quotes.csv",
      "/api/v1/exports/payments.csv",
    ]);
  });
});

describe("filenameFromContentDisposition", () => {
  it("reads a quoted filename", () => {
    expect(filenameFromContentDisposition('attachment; filename="clientes-2026-11-27.csv"')).toBe(
      "clientes-2026-11-27.csv",
    );
  });

  it("reads an unquoted filename", () => {
    expect(filenameFromContentDisposition("attachment; filename=pagos.csv")).toBe("pagos.csv");
  });

  it("prefers filename* with UTF-8 encoding", () => {
    expect(
      filenameFromContentDisposition(
        "attachment; filename=\"fallback.csv\"; filename*=UTF-8''presupuestos%202026.csv",
      ),
    ).toBe("presupuestos_2026.csv");
  });

  it("drops directories so the browser never receives a path", () => {
    expect(filenameFromContentDisposition('attachment; filename="../../secreto.csv"')).toBe(
      "secreto.csv",
    );
    expect(filenameFromContentDisposition('attachment; filename="C:\\temp\\x.csv"')).toBe("x.csv");
  });

  it("rejects names that are not CSV", () => {
    expect(filenameFromContentDisposition('attachment; filename="datos.exe"')).toBeNull();
    expect(filenameFromContentDisposition('attachment; filename="datos.csv.exe"')).toBeNull();
  });

  it("returns null when the header is missing or unusable", () => {
    expect(filenameFromContentDisposition(null)).toBeNull();
    expect(filenameFromContentDisposition("attachment")).toBeNull();
    expect(filenameFromContentDisposition("attachment; filename*=UTF-8''%E0%A4%A")).toBeNull();
  });
});

describe("fallbackExportFilename", () => {
  it("uses the Argentina civil date, not the UTC date", () => {
    // 02:30 UTC del 27 es 23:30 del 26 en Buenos Aires (UTC-3).
    expect(fallbackExportFilename("customers", new Date("2026-11-27T02:30:00Z"))).toBe(
      "dovexo-customers-2026-11-26.csv",
    );
  });

  it("names each kind", () => {
    expect(fallbackExportFilename("payments", new Date("2026-11-27T15:00:00Z"))).toBe(
      "dovexo-payments-2026-11-27.csv",
    );
  });
});

describe("exportErrorMessage", () => {
  it("explains a 403 without showing backend internals", () => {
    expect(exportErrorMessage(new ApiError(403, "Permisos insuficientes"))).toBe(
      EXPORT_FORBIDDEN_MESSAGE,
    );
  });

  it("keeps the session message for 401", () => {
    expect(exportErrorMessage(new ApiError(401, ""))).toBe("Tu sesión venció. Volvé a ingresar.");
  });

  it("uses the generic message for a 500 without inventing data", () => {
    expect(exportErrorMessage(new ApiError(500, ""))).toBe(EXPORT_FALLBACK_MESSAGE);
    expect(exportErrorMessage(new ApiError(500, "Traceback interno"))).toBe(
      EXPORT_FALLBACK_MESSAGE,
    );
  });

  it("shows a client error detail from the backend", () => {
    expect(exportErrorMessage(new ApiError(400, "Empresa no válida"))).toBe("Empresa no válida");
  });

  it("explains network failures", () => {
    expect(exportErrorMessage(new TypeError("Failed to fetch"))).toContain("conectar");
  });

  it("falls back for unknown errors", () => {
    expect(exportErrorMessage(new Error("boom"))).toBe(EXPORT_FALLBACK_MESSAGE);
  });
});
