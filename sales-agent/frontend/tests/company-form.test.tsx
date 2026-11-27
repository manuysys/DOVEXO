import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CompanyForm } from "@/components/prospects/company-form";
import { emptyCompanyValues } from "@/features/prospects/schema";
import { makeSector } from "./utils";

const PROVINCES = [{ code: "AR-S", name: "Santa Fe" }];

describe("CompanyForm", () => {
  it("exige el nombre de la empresa", async () => {
    const onSubmit = vi.fn();
    render(
      <CompanyForm
        provinces={PROVINCES}
        sectors={[makeSector()]}
        defaultValues={emptyCompanyValues()}
        onSubmit={onSubmit}
        submitLabel="Guardar empresa"
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Guardar empresa" }),
    );

    expect(
      await screen.findByText("Ingresá un nombre de al menos 2 caracteres."),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("envía los datos generales, el rubro y el contacto", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <CompanyForm
        provinces={PROVINCES}
        sectors={[makeSector()]}
        defaultValues={emptyCompanyValues()}
        onSubmit={onSubmit}
        submitLabel="Guardar empresa"
      />,
    );

    await userEvent.type(screen.getByLabelText(/^Nombre/), "Empresa de prueba");
    await userEvent.type(
      screen.getByLabelText(/^Sitio web/),
      "https://empresa-de-prueba.com.ar",
    );
    await userEvent.selectOptions(screen.getByLabelText(/^Provincia/), "AR-S");
    await userEvent.type(screen.getByLabelText(/^Localidad/), "Rosario");
    await userEvent.type(screen.getByLabelText(/^Dirección/), "Calle 123");
    await userEvent.click(screen.getByLabelText("Climatización"));
    await userEvent.type(
      screen.getByLabelText(/^Teléfono/),
      "+54 341 555-0000",
    );
    await userEvent.type(
      screen.getByLabelText(/^Email/),
      "contacto@empresa-de-prueba.com.ar",
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Guardar empresa" }),
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    const values = onSubmit.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(values.name).toBe("Empresa de prueba");
    expect(values.website).toBe("https://empresa-de-prueba.com.ar");
    expect(values.province).toBe("AR-S");
    expect(values.locality).toBe("Rosario");
    expect(values.address).toBe("Calle 123");
    expect(values.sector_slugs).toEqual(["climatizacion"]);
    expect(values.phone).toBe("+54 341 555-0000");
    expect(values.email).toBe("contacto@empresa-de-prueba.com.ar");
  });

  it("rechaza un email inválido", async () => {
    const onSubmit = vi.fn();
    render(
      <CompanyForm
        provinces={PROVINCES}
        sectors={[]}
        defaultValues={emptyCompanyValues()}
        onSubmit={onSubmit}
        submitLabel="Guardar empresa"
      />,
    );

    await userEvent.type(screen.getByLabelText(/^Nombre/), "Empresa de prueba");
    await userEvent.type(screen.getByLabelText(/^Email/), "no-es-un-email");
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar empresa" }),
    );

    expect(
      await screen.findByText("Ingresá un email válido."),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("muestra el duplicado 409 con enlace a la empresa existente", () => {
    render(
      <CompanyForm
        provinces={PROVINCES}
        sectors={[]}
        defaultValues={emptyCompanyValues()}
        onSubmit={vi.fn()}
        submitLabel="Guardar empresa"
        duplicate={{
          id: "10",
          name: "Empresa de prueba",
          message: "Ya existe una empresa con el mismo dominio.",
        }}
      />,
    );

    expect(
      screen.getByText("Ya existe una empresa con esos datos"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Ya existe una empresa con el mismo dominio."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Ver la empresa existente: Empresa de prueba",
      }),
    ).toHaveAttribute("href", "/prospects/10");
  });
});
