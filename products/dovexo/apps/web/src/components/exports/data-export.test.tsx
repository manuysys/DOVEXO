import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DataExport } from "@/components/exports/data-export";
import { ApiError } from "@/lib/api";
import { downloadExport } from "@/lib/export-api";
import { EXPORT_FALLBACK_MESSAGE, EXPORT_FORBIDDEN_MESSAGE } from "@/lib/export-utils";
import { downloadBlob } from "@/lib/utils";

const authState = vi.hoisted(() => ({
  activeTenantId: "tenant-1" as string | null,
  role: "owner" as string,
}));

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    activeTenantId: authState.activeTenantId,
    tenants: [
      { id: "tenant-1", name: "Servicios Demo", slug: "servicios-demo", role: authState.role },
      { id: "tenant-2", name: "Otra Empresa", slug: "otra-empresa", role: "owner" },
    ],
  }),
}));

vi.mock("@/lib/export-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/export-api")>();
  return { ...actual, downloadExport: vi.fn() };
});

vi.mock("@/lib/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/utils")>();
  return { ...actual, downloadBlob: vi.fn() };
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const csvFile = (filename: string) => ({
  blob: new Blob(["id\n1"], { type: "text/csv" }),
  filename,
});

const buttonFor = (name: string) => screen.getByRole("button", { name });

describe("DataExport", () => {
  beforeEach(() => {
    authState.activeTenantId = "tenant-1";
    authState.role = "owner";
    vi.mocked(downloadExport).mockReset();
    vi.mocked(downloadBlob).mockReset();
  });

  it("explains the scope and offers the four files", () => {
    render(<DataExport />);

    expect(screen.getByRole("heading", { name: "Exportar datos" })).toBeInTheDocument();
    expect(screen.getByText("Servicios Demo")).toBeInTheDocument();
    expect(screen.getByText(/Cada archivo contiene solo los datos de/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Clientes" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Órdenes" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Presupuestos" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pagos" })).toBeInTheDocument();
    expect(buttonFor("Descargar clientes (CSV)")).toBeEnabled();
    expect(buttonFor("Descargar órdenes (CSV)")).toBeEnabled();
    expect(buttonFor("Descargar presupuestos (CSV)")).toBeEnabled();
    expect(buttonFor("Descargar pagos (CSV)")).toBeEnabled();
    expect(downloadExport).not.toHaveBeenCalled();
  });

  it("downloads the file for the active tenant and reports the filename", async () => {
    const file = csvFile("clientes-2026-11-27.csv");
    vi.mocked(downloadExport).mockResolvedValueOnce(file);
    render(<DataExport />);

    fireEvent.click(buttonFor("Descargar clientes (CSV)"));

    await waitFor(() =>
      expect(downloadBlob).toHaveBeenCalledWith(file.blob, "clientes-2026-11-27.csv"),
    );
    expect(downloadExport).toHaveBeenCalledWith("tenant-1", "customers");
    expect(await screen.findByText("clientes-2026-11-27.csv")).toBeInTheDocument();
    expect(buttonFor("Descargar clientes (CSV)")).toBeEnabled();
  });

  it("shows loading while the file is generated and blocks a second click", async () => {
    const pending = deferred<ReturnType<typeof csvFile>>();
    vi.mocked(downloadExport).mockReturnValueOnce(pending.promise);
    render(<DataExport />);

    fireEvent.click(buttonFor("Descargar pagos (CSV)"));

    const loadingButton = await screen.findByRole("button", { name: "Descargando..." });
    expect(loadingButton).toBeDisabled();
    expect(screen.getByText(/Generando el archivo/)).toBeInTheDocument();
    fireEvent.click(loadingButton);
    expect(downloadExport).toHaveBeenCalledTimes(1);

    await act(async () => {
      pending.resolve(csvFile("pagos.csv"));
    });

    expect(await screen.findByText("pagos.csv")).toBeInTheDocument();
    expect(downloadBlob).toHaveBeenCalledTimes(1);
  });

  it("explains a 403 and does not download anything", async () => {
    vi.mocked(downloadExport).mockRejectedValueOnce(new ApiError(403, "Permisos insuficientes"));
    render(<DataExport />);

    fireEvent.click(buttonFor("Descargar presupuestos (CSV)"));

    expect(await screen.findByRole("alert")).toHaveTextContent(EXPORT_FORBIDDEN_MESSAGE);
    expect(downloadBlob).not.toHaveBeenCalled();
    expect(buttonFor("Descargar presupuestos (CSV)")).toBeEnabled();
  });

  it("shows a generic message on 500 without fabricating data, and keeps other cards usable", async () => {
    vi.mocked(downloadExport).mockRejectedValueOnce(new ApiError(500, ""));
    render(<DataExport />);

    fireEvent.click(buttonFor("Descargar órdenes (CSV)"));

    expect(await screen.findByRole("alert")).toHaveTextContent(EXPORT_FALLBACK_MESSAGE);
    expect(downloadBlob).not.toHaveBeenCalled();
    expect(buttonFor("Descargar clientes (CSV)")).toBeEnabled();
    expect(buttonFor("Descargar órdenes (CSV)")).toBeEnabled();
  });

  it.each(["viewer", "technician"])(
    "shows a no-permission state and no download buttons for %s",
    (role) => {
      authState.role = role;
      render(<DataExport />);

      expect(screen.getByText("No tenés permisos para exportar datos")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Descargar/ })).not.toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "Exportar datos" })).not.toBeInTheDocument();
    },
  );

  it.each(["owner", "admin", "dispatcher"])("offers the downloads to %s", (role) => {
    authState.role = role;
    render(<DataExport />);

    expect(buttonFor("Descargar clientes (CSV)")).toBeEnabled();
    expect(screen.queryByText("No tenés permisos para exportar datos")).not.toBeInTheDocument();
  });

  it("explains that there is no active company", () => {
    authState.activeTenantId = null;
    render(<DataExport />);

    expect(screen.getByText(/No hay una empresa activa/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Descargar/ })).not.toBeInTheDocument();
  });
});
