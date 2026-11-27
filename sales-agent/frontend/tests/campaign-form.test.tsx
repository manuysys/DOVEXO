import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CampaignForm } from "@/components/campaigns/campaign-form";
import { emptyCampaignValues } from "@/features/campaigns/mapping";
import { makeProduct, makeSector } from "./utils";

describe("CampaignForm", () => {
  it("exige nombre y rubros", async () => {
    const product = makeProduct();
    render(
      <CampaignForm
        products={[product]}
        defaultValues={emptyCampaignValues(product.id)}
        onSubmit={vi.fn()}
        submitLabel="Crear campaña"
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Crear campaña" }),
    );

    expect(
      await screen.findByText("Ingresá un nombre de al menos 3 caracteres."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Seleccioná al menos un rubro o escribí uno."),
    ).toBeInTheDocument();
  });

  it("envía producto, provincia, rubros y fuentes", async () => {
    const product = makeProduct();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <CampaignForm
        products={[product]}
        sectors={[makeSector()]}
        defaultValues={emptyCampaignValues(product.id)}
        onSubmit={onSubmit}
        submitLabel="Crear campaña"
      />,
    );

    await userEvent.type(
      screen.getByLabelText(/^Nombre/),
      "Campaña Córdoba",
    );
    await userEvent.click(screen.getByLabelText("Córdoba"));
    await userEvent.click(screen.getByLabelText("Climatización"));
    await userEvent.type(
      screen.getByLabelText(/Rubros adicionales/),
      "Refrigeración",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Crear campaña" }),
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    const values = onSubmit.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(values.product_id).toBe(product.id);
    expect(values.name).toBe("Campaña Córdoba");
    expect(values.provinces).toEqual(["Córdoba"]);
    expect(values.selected_sectors).toEqual(["Climatización"]);
    expect(values.manual_sectors).toBe("Refrigeración");
    expect(values.sources).toEqual(["osm"]);
    expect(values.max_results).toBe(100);
    expect(values.status).toBe("draft");
  });

  it("permite usar rubros manuales si la API no los devuelve", async () => {
    const product = makeProduct();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <CampaignForm
        products={[product]}
        sectors={[]}
        sectorsUnavailable
        defaultValues={emptyCampaignValues(product.id)}
        onSubmit={onSubmit}
        submitLabel="Crear campaña"
      />,
    );

    expect(
      screen.getByText(/No se pudieron cargar los rubros desde la API/),
    ).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/^Nombre/), "Campaña nacional");
    await userEvent.type(
      screen.getByLabelText(/Rubros adicionales/),
      "Electricidad",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Crear campaña" }),
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    const values = onSubmit.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(values.manual_sectors).toBe("Electricidad");
    expect(values.provinces).toEqual([]);
  });

  it("bloquea el envío sin productos disponibles", () => {
    render(
      <CampaignForm
        products={[]}
        defaultValues={emptyCampaignValues()}
        onSubmit={vi.fn()}
        submitLabel="Crear campaña"
      />,
    );

    expect(
      screen.getByRole("button", { name: "Crear campaña" }),
    ).toBeDisabled();
  });
});
