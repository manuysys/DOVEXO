import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api";
import { sessionFetch } from "@/lib/api-session";
import { downloadExport } from "@/lib/export-api";

vi.mock("@/lib/api-session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-session")>();
  return { ...actual, sessionFetch: vi.fn() };
});

const now = new Date("2026-11-27T15:00:00Z");

describe("downloadExport", () => {
  beforeEach(() => {
    vi.mocked(sessionFetch).mockReset();
  });

  it("requests the export for the active tenant and reads the filename from the header", async () => {
    vi.mocked(sessionFetch).mockResolvedValueOnce(
      new Response("id,name\n1,Ana", {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="clientes-2026-11-27.csv"',
        },
      }),
    );

    const file = await downloadExport("tenant-1", "customers", now);

    expect(sessionFetch).toHaveBeenCalledWith("/api/v1/exports/customers.csv", {
      method: "GET",
      tenantId: "tenant-1",
    });
    expect(file.filename).toBe("clientes-2026-11-27.csv");
    expect(await file.blob.text()).toBe("id,name\n1,Ana");
  });

  it("uses the fallback filename when Content-Disposition is not readable", async () => {
    vi.mocked(sessionFetch).mockResolvedValueOnce(new Response("id\n", { status: 200 }));

    const file = await downloadExport("tenant-1", "quotes", now);

    expect(file.filename).toBe("dovexo-quotes-2026-11-27.csv");
  });

  it("throws ApiError with the backend detail on 403", async () => {
    vi.mocked(sessionFetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Permisos insuficientes" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(downloadExport("tenant-1", "payments", now)).rejects.toMatchObject({
      status: 403,
      detail: "Permisos insuficientes",
    });
  });

  it("throws ApiError with an empty detail on 500 without a JSON body", async () => {
    vi.mocked(sessionFetch).mockResolvedValueOnce(new Response("oops", { status: 500 }));

    const error = await downloadExport("tenant-1", "orders", now).catch(
      (reason: unknown) => reason,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 500, detail: "" });
  });
});
