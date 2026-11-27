import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductForm } from "@/components/products/product-form";
import { emptyProductValues } from "@/features/products/mapping";

describe("ProductForm", () => {
  it("exige nombre y slug", async () => {
    const onSubmit = vi.fn();
    render(
      <ProductForm
        defaultValues={emptyProductValues}
        onSubmit={onSubmit}
        submitLabel="Crear producto"
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Crear producto" }),
    );

    expect(
      await screen.findByText("Ingresá un nombre de al menos 2 caracteres."),
    ).toBeInTheDocument();
    expect(screen.getByText("Ingresá un slug.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("genera el slug a partir del nombre", async () => {
    render(
      <ProductForm
        defaultValues={emptyProductValues}
        onSubmit={vi.fn()}
        submitLabel="Crear producto"
      />,
    );

    await userEvent.type(screen.getByLabelText(/^Nombre/), "DOVEXO Gestión");
    expect(screen.getByLabelText(/^Slug/)).toHaveValue("dovexo-gestion");
  });

  it("envía los campos del producto", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <ProductForm
        defaultValues={emptyProductValues}
        onSubmit={onSubmit}
        submitLabel="Crear producto"
      />,
    );

    await userEvent.type(screen.getByLabelText(/^Nombre/), "DOVEXO Campo");
    await userEvent.type(
      screen.getByLabelText(/^Sectores objetivo/),
      "Climatización, Refrigeración",
    );
    await userEvent.type(
      screen.getByLabelText(/^Palabras clave/),
      "mantenimiento\ninstalación",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Crear producto" }),
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    const values = onSubmit.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(values.name).toBe("DOVEXO Campo");
    expect(values.slug).toBe("dovexo-campo");
    expect(values.target_sectors).toBe("Climatización, Refrigeración");
    expect(values.scoring_config).toContain("{");
    expect(values.is_active).toBe(true);
  });

  it("rechaza JSON inválido en la configuración de scoring", async () => {
    const onSubmit = vi.fn();
    render(
      <ProductForm
        defaultValues={emptyProductValues}
        onSubmit={onSubmit}
        submitLabel="Crear producto"
      />,
    );

    await userEvent.type(screen.getByLabelText(/^Nombre/), "DOVEXO");
    const scoring = screen.getByLabelText(/Configuración de scoring/);
    await userEvent.clear(scoring);
    await userEvent.type(scoring, "no-es-json");
    await userEvent.click(
      screen.getByRole("button", { name: "Crear producto" }),
    );

    expect(
      await screen.findByText("Ingresá un objeto JSON válido: { }"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("muestra el error de guardado", () => {
    render(
      <ProductForm
        defaultValues={emptyProductValues}
        onSubmit={vi.fn()}
        submitLabel="Crear producto"
        formError="Ya existe un producto con ese slug."
      />,
    );

    expect(
      screen.getByText("Ya existe un producto con ese slug."),
    ).toBeInTheDocument();
  });
});
