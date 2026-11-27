import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchForm } from "@/components/search/search-form";
import { emptySearchValues } from "@/features/search/schema";
import { makeSector } from "./utils";

const PROVINCES = [
  { code: "AR-X", name: "Córdoba" },
  { code: "AR-S", name: "Santa Fe" },
];

describe("SearchForm", () => {
  it("exige provincia y al menos un rubro", async () => {
    const onSubmit = vi.fn();
    render(
      <SearchForm
        provinces={PROVINCES}
        sectors={[makeSector()]}
        defaultValues={emptySearchValues()}
        onSubmit={onSubmit}
        submitLabel="Iniciar búsqueda"
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Iniciar búsqueda" }),
    );

    expect(
      await screen.findByText("Seleccioná una provincia."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Seleccioná al menos un rubro."),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("envía provincia, rubros, palabras clave y límite", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <SearchForm
        provinces={PROVINCES}
        sectors={[makeSector()]}
        defaultValues={emptySearchValues()}
        onSubmit={onSubmit}
        submitLabel="Iniciar búsqueda"
      />,
    );

    await userEvent.selectOptions(screen.getByLabelText(/^Provincia/), "AR-X");
    await userEvent.click(screen.getByLabelText("Climatización"));
    await userEvent.type(
      screen.getByLabelText(/^Palabras clave/),
      "service, split",
    );
    const limit = screen.getByLabelText(/^Límite de resultados/);
    await userEvent.clear(limit);
    await userEvent.type(limit, "80");

    await userEvent.click(
      screen.getByRole("button", { name: "Iniciar búsqueda" }),
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    const values = onSubmit.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(values.province_code).toBe("AR-X");
    expect(values.sector_slugs).toEqual(["climatizacion"]);
    expect(values.keywords).toBe("service, split");
    expect(values.limit).toBe(80);
  });

  it("rechaza un límite mayor al máximo permitido", async () => {
    const onSubmit = vi.fn();
    render(
      <SearchForm
        provinces={PROVINCES}
        sectors={[makeSector()]}
        defaultValues={emptySearchValues()}
        onSubmit={onSubmit}
        submitLabel="Iniciar búsqueda"
      />,
    );

    await userEvent.selectOptions(screen.getByLabelText(/^Provincia/), "AR-X");
    await userEvent.click(screen.getByLabelText("Climatización"));
    const limit = screen.getByLabelText(/^Límite de resultados/);
    await userEvent.clear(limit);
    await userEvent.type(limit, "500");

    await userEvent.click(
      screen.getByRole("button", { name: "Iniciar búsqueda" }),
    );

    expect(
      await screen.findByText("El máximo es 100 resultados por corrida."),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("bloquea la búsqueda si los rubros no se pudieron cargar", async () => {
    const onSubmit = vi.fn();
    render(
      <SearchForm
        provinces={PROVINCES}
        sectors={[]}
        sectorsUnavailable
        defaultValues={emptySearchValues()}
        onSubmit={onSubmit}
        submitLabel="Iniciar búsqueda"
      />,
    );

    expect(
      screen.getByText(/No se pueden cargar los rubros|No se pudieron cargar los rubros/),
    ).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText(/^Provincia/), "AR-S");
    await userEvent.type(
      screen.getByLabelText(/^Palabras clave/),
      "cámaras frigoríficas",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Iniciar búsqueda" }),
    );

    expect(
      await screen.findByText("Seleccioná al menos un rubro."),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
