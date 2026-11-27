import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/client";
import { readDuplicateCompany } from "@/features/prospects/duplicate";

describe("readDuplicateCompany", () => {
  it("lee el 409 del alta manual con duplicate_of y company_name", () => {
    const error = new ApiError("Ya existe una empresa con esos datos.", 409, {
      detail: "Ya existe una empresa con esos datos.",
      duplicate_of: 12,
      reason: "domain",
      company_name: "Empresa de prueba",
    });

    expect(readDuplicateCompany(error)).toEqual({
      id: "12",
      name: "Empresa de prueba",
      message: "Ya existe una empresa con esos datos.",
    });
  });

  it("acepta duplicate_of anidado dentro de detail", () => {
    const error = new ApiError("Conflicto", 409, {
      detail: {
        message: "Duplicado exacto por nombre y localidad.",
        duplicate_of: { id: 5, name: "Otra empresa" },
      },
    });

    expect(readDuplicateCompany(error)).toEqual({
      id: "5",
      name: "Otra empresa",
      message: "Duplicado exacto por nombre y localidad.",
    });
  });

  it("devuelve null para errores que no son 409", () => {
    expect(readDuplicateCompany(new ApiError("Fallo", 500))).toBeNull();
    expect(readDuplicateCompany(new Error("otro"))).toBeNull();
  });
});
