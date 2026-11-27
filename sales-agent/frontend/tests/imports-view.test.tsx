import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImportsView } from "@/components/imports/imports-view";
import { confirmImport, listImports, previewImport } from "@/lib/api/imports";
import { useSectors } from "@/hooks/use-dashboard";
import {
  makeImportBatch,
  makeImportPreview,
  makeSector,
  renderWithProviders,
} from "./utils";

vi.mock("@/lib/api/imports", () => ({
  previewImport: vi.fn(),
  confirmImport: vi.fn(),
  listImports: vi.fn(),
  getImport: vi.fn(),
}));

vi.mock("@/hooks/use-dashboard", () => ({ useSectors: vi.fn() }));

beforeEach(() => {
  vi.mocked(useSectors).mockReturnValue({
    data: [makeSector()],
    isError: false,
  } as unknown as ReturnType<typeof useSectors>);
});

function csvFile(): File {
  return new File(
    [
      "nombre,web,provincia\nEmpresa de prueba,https://empresa-de-prueba.com.ar,Córdoba\nSin localidad,,",
    ],
    "empresas.csv",
    { type: "text/csv" },
  );
}

describe("ImportsView", () => {
  it("previsualiza el CSV y confirma la importación", async () => {
    vi.mocked(listImports).mockResolvedValue([]);
    vi.mocked(previewImport).mockResolvedValue(makeImportPreview());
    vi.mocked(confirmImport).mockResolvedValue({
      batch_id: "3",
      created: 1,
      skipped: 1,
      errors: [],
    });

    renderWithProviders(<ImportsView />);

    expect(
      await screen.findByText("Todavía no hay importaciones"),
    ).toBeInTheDocument();

    await userEvent.upload(
      screen.getByLabelText(/Archivo CSV/),
      csvFile(),
    );
    expect(
      await screen.findByText(/Archivo seleccionado:/),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Previsualizar" }),
    );

    await waitFor(() => {
      expect(previewImport).toHaveBeenCalledTimes(1);
    });

    // Tabla de previsualización con las filas que devolvió la API.
    expect(await screen.findByText("Válidas")).toBeInTheDocument();
    expect(screen.getByText("Empresa de prueba")).toBeInTheDocument();
    expect(screen.getByText("Falta la provincia")).toBeInTheDocument();

    const confirmButton = screen.getByRole("button", {
      name: "Confirmar importación",
    });
    expect(confirmButton).toBeEnabled();
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(confirmImport).toHaveBeenCalledWith("3");
    });
    expect(
      await screen.findByText("Importación confirmada"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Se crearon 1 empresa y se omitieron 1 fila/),
    ).toBeInTheDocument();
  });

  it("no permite confirmar cuando no hay filas válidas", async () => {
    vi.mocked(listImports).mockResolvedValue([]);
    vi.mocked(previewImport).mockResolvedValue(
      makeImportPreview({
        valid_rows: 0,
        invalid_rows: 2,
        preview: [
          {
            row_number: 2,
            name: "Sin datos",
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
      }),
    );

    renderWithProviders(<ImportsView />);
    await userEvent.upload(
      screen.getByLabelText(/Archivo CSV/),
      csvFile(),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Previsualizar" }),
    );

    const confirmButton = await screen.findByRole("button", {
      name: "Confirmar importación",
    });
    expect(confirmButton).toBeDisabled();
    expect(
      screen.getByText(/No hay filas válidas para importar/),
    ).toBeInTheDocument();
  });

  it("muestra el historial de importaciones con su informe", async () => {
    vi.mocked(listImports).mockResolvedValue([
      makeImportBatch({ report_url: "/api/v1/imports/3/report" }),
    ]);

    renderWithProviders(<ImportsView />);

    expect(await screen.findByText("empresas.csv")).toBeInTheDocument();
    expect(screen.getByText("Confirmada")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Descargar" })).toHaveAttribute(
      "href",
      "http://localhost:8001/api/v1/imports/3/report",
    );
  });

  it("rechaza archivos que no son CSV antes de subirlos", async () => {
    vi.mocked(listImports).mockResolvedValue([]);
    // `applyAccept: false` permite probar la validación propia del formulario.
    const user = userEvent.setup({ applyAccept: false });

    renderWithProviders(<ImportsView />);

    await user.upload(
      screen.getByLabelText(/Archivo CSV/),
      new File(["x"], "empresas.txt", { type: "text/plain" }),
    );

    expect(
      await screen.findByText("El archivo debe ser .csv."),
    ).toBeInTheDocument();
    expect(previewImport).not.toHaveBeenCalled();
  });
});
