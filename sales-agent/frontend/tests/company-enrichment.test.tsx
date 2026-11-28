import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CompanyEnrichmentPanel } from "@/components/prospects/company-enrichment-panel";
import { useEnrichCompany } from "@/hooks/use-companies";
import { useCurrentUser } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/client";
import type { CompanyEnrichResult } from "@/lib/api/types";
import { makeCompany } from "./utils";

vi.mock("@/hooks/use-companies", () => ({
  useEnrichCompany: vi.fn(),
}));

vi.mock("@/hooks/use-auth", () => ({
  useCurrentUser: vi.fn(),
}));

function makeEnrichResult(
  overrides: Partial<CompanyEnrichResult> = {},
): CompanyEnrichResult {
  return {
    company_id: "10",
    status: "ok",
    raw_status: "ok",
    fields_updated: [],
    contacts_added: 0,
    facts_added: 0,
    sources_added: 0,
    evidence: [],
    error: null,
    ...overrides,
  };
}

function mockCurrentUser(role: string | null) {
  vi.mocked(useCurrentUser).mockReturnValue({
    data: role
      ? { id: "1", email: "admin@arvokta.com", name: "Admin", role }
      : { id: "1", email: "admin@arvokta.com", name: "Admin", role: null },
    isPending: false,
    isError: false,
    error: null,
  } as unknown as ReturnType<typeof useCurrentUser>);
}

function mockEnrichMutation(
  options: {
    result?: CompanyEnrichResult;
    error?: unknown;
    isPending?: boolean;
  } = {},
) {
  const mutate = vi.fn(
    (
      _variables: undefined,
      mutationOptions?: { onSuccess?: (value: CompanyEnrichResult) => void },
    ) => {
      if (options.result && !options.error) {
        mutationOptions?.onSuccess?.(options.result);
      }
    },
  );
  vi.mocked(useEnrichCompany).mockReturnValue({
    mutate,
    isPending: options.isPending ?? false,
    isError: Boolean(options.error),
    error: options.error ?? null,
  } as unknown as ReturnType<typeof useEnrichCompany>);
  return mutate;
}

beforeEach(() => {
  mockCurrentUser("admin");
  mockEnrichMutation();
});

describe("CompanyEnrichmentPanel", () => {
  it("investiga el sitio y muestra el resumen real con la evidencia", async () => {
    const mutate = mockEnrichMutation({
      result: makeEnrichResult({
        contacts_added: 2,
        sources_added: 1,
        fields_updated: ["email", "phone"],
        evidence: [
          {
            source_url: "https://empresa-de-prueba.com.ar/contacto",
            title: "Contacto",
            excerpt: "Teléfono: 341 555 0000",
          },
        ],
      }),
    });

    render(<CompanyEnrichmentPanel company={makeCompany()} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Investigar sitio web" }),
    );

    expect(mutate).toHaveBeenCalledWith(undefined, expect.anything());
    expect(
      await screen.findByText(/Se agregaron 2 contactos, 0 datos y 1 fuente/),
    ).toBeInTheDocument();
    expect(screen.getByText(/revisá la evidencia/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "https://empresa-de-prueba.com.ar/contacto",
      }),
    ).toHaveAttribute(
      "href",
      "https://empresa-de-prueba.com.ar/contacto",
    );
    expect(screen.getByText("Contacto")).toBeInTheDocument();
    expect(screen.getByText("Teléfono: 341 555 0000")).toBeInTheDocument();

    // Un WhatsApp publicado no se presenta como cuenta confirmada.
    expect(
      screen.getByText(/Un WhatsApp publicado no confirma que la cuenta exista/),
    ).toBeInTheDocument();
  });

  it("muestra los datos extraídos en el resumen de la investigación", async () => {
    mockEnrichMutation({
      result: makeEnrichResult({
        contacts_added: 0,
        facts_added: 3,
        sources_added: 0,
      }),
    });

    render(<CompanyEnrichmentPanel company={makeCompany()} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Investigar sitio web" }),
    );

    expect(
      await screen.findByText(/Se agregaron 0 contactos, 3 datos y 0 fuentes/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Los datos extraídos quedan en “Datos extraídos del sitio”/),
    ).toBeInTheDocument();
  });

  it("informa cuando solo se actualizaron campos de la ficha", async () => {
    mockEnrichMutation({
      result: makeEnrichResult({
        contacts_added: 0,
        facts_added: 0,
        sources_added: 0,
        fields_updated: ["description", "locality"],
      }),
    });

    render(<CompanyEnrichmentPanel company={makeCompany()} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Investigar sitio web" }),
    );

    expect(
      await screen.findByText("Ficha actualizada"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Campos actualizados en la ficha: description, locality/),
    ).toBeInTheDocument();
  });

  it("no ofrece investigar cuando la empresa no tiene sitio web", () => {
    const mutate = mockEnrichMutation();

    render(<CompanyEnrichmentPanel company={makeCompany({ website: null })} />);

    expect(
      screen.queryByRole("button", { name: /Investigar|Reenriquecer/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/La ficha no tiene sitio web/),
    ).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("oculta el botón cuando el backend responde no_website", async () => {
    mockEnrichMutation({
      result: makeEnrichResult({ status: "no_website", raw_status: "no_website" }),
    });

    render(<CompanyEnrichmentPanel company={makeCompany()} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Investigar sitio web" }),
    );

    expect(
      await screen.findByText("La empresa no tiene un sitio web"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Investigar|Reenriquecer/ }),
    ).not.toBeInTheDocument();
  });

  it("informa el rechazo por URL insegura sin inventar datos", async () => {
    mockEnrichMutation({
      result: makeEnrichResult({
        status: "unsafe",
        raw_status: "unsafe",
        error: "La URL apunta a una red interna (127.0.0.1).",
      }),
    });

    render(<CompanyEnrichmentPanel company={makeCompany()} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Investigar sitio web" }),
    );

    expect(
      await screen.findByText("El sitio no es seguro para investigar"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("La URL apunta a una red interna (127.0.0.1)."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Se agregaron/),
    ).not.toBeInTheDocument();
  });

  it("muestra el error real cuando falla la descarga del sitio", async () => {
    mockEnrichMutation({
      result: makeEnrichResult({
        status: "fetch_error",
        raw_status: "fetch_error",
        error: "Timeout al descargar el sitio (502).",
      }),
    });

    render(<CompanyEnrichmentPanel company={makeCompany()} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Investigar sitio web" }),
    );

    expect(
      await screen.findByText("No se pudo leer el sitio web"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Timeout al descargar el sitio (502)."),
    ).toBeInTheDocument();
  });

  it("muestra el error de la API cuando el endpoint rechaza la llamada", () => {
    mockEnrichMutation({
      error: new ApiError("La API devolvió un error interno.", 502),
    });

    render(<CompanyEnrichmentPanel company={makeCompany()} />);

    expect(
      screen.getByText("No se pudo investigar el sitio"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("La API devolvió un error interno."),
    ).toBeInTheDocument();
  });

  it("avisa cuando no se agregó nada porque todo estaba duplicado", async () => {
    mockEnrichMutation({
      result: makeEnrichResult({ contacts_added: 0, sources_added: 0 }),
    });

    render(<CompanyEnrichmentPanel company={makeCompany()} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Investigar sitio web" }),
    );

    expect(
      await screen.findByText("Sin datos nuevos"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No se agregaron contactos, datos ni fuentes nuevas/),
    ).toBeInTheDocument();
  });

  it("deshabilita la acción mientras la investigación está en curso", () => {
    mockEnrichMutation({ isPending: true });

    render(<CompanyEnrichmentPanel company={makeCompany()} />);

    const button = screen.getByRole("button", { name: /Investigando/ });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("no muestra la acción a roles sin permiso", () => {
    mockCurrentUser("viewer");

    render(<CompanyEnrichmentPanel company={makeCompany()} />);

    expect(
      screen.queryByRole("button", { name: /Investigar|Reenriquecer/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Solo un administrador o propietario/),
    ).toBeInTheDocument();
  });
});
