import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest, ApiError, API_BASE_URL } from "@/lib/api/client";

function jsonResponse(
  status: number,
  body: unknown,
): Pick<Response, "ok" | "status" | "text"> {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (body === null ? "" : JSON.stringify(body)),
  };
}

describe("apiRequest", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("envía cookie de sesión y cuerpo JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await apiRequest("/auth/login", {
      method: "POST",
      body: { email: "admin@arvokta.com", password: "secreto" },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${API_BASE_URL}/api/v1/auth/login`);
    expect(init.credentials).toBe("include");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(
      JSON.stringify({ email: "admin@arvokta.com", password: "secreto" }),
    );
  });

  it("propaga el 401 como ApiError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(401, { detail: "Sesión inválida" })),
    );

    const promise = apiRequest("/auth/me");

    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toMatchObject({
      status: 401,
      message: "Sesión inválida",
    });
  });

  it("traduce errores de validación de FastAPI", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(422, {
          detail: [{ msg: "field required", loc: ["body", "name"] }],
        }),
      ),
    );

    await expect(apiRequest("/products", { method: "POST", body: {} })).rejects.toMatchObject(
      { status: 422, message: "field required" },
    );
  });

  it("informa cuando la API no está disponible", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(apiRequest("/products")).rejects.toMatchObject({
      status: 0,
    });
  });

  it("traduce 400, 403, 404 y 502 sin cuerpo a mensajes legibles", async () => {
    const cases: Array<[number, string]> = [
      [400, "La solicitud no es válida."],
      [403, "No tenés permisos para realizar esta acción."],
      [404, "El recurso solicitado no existe."],
      [502, "La API devolvió un error interno. Revisá los logs del backend."],
    ];

    for (const [status, message] of cases) {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(jsonResponse(status, null)),
      );

      await expect(apiRequest("/companies")).rejects.toMatchObject({
        status,
        message,
      });
    }
  });

  it("acepta respuestas 204 sin cuerpo", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(204, null)));

    await expect(apiRequest("/auth/logout", { method: "POST" })).resolves.toBeNull();
  });
});
