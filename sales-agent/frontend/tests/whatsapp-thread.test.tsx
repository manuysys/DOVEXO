import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThreadPanel } from "@/components/whatsapp/thread-panel";
import {
  useSimulateInbound,
  useWhatsAppThread,
  useWhatsAppThreads,
} from "@/hooks/use-whatsapp";
import { makeLead, makeWhatsAppMessage, makeWhatsAppThread } from "./utils";

vi.mock("@/hooks/use-whatsapp", () => ({
  useWhatsAppThreads: vi.fn(),
  useWhatsAppThread: vi.fn(),
  useSimulateInbound: vi.fn(),
  useWhatsAppStatus: vi.fn(),
}));

vi.mock("@/hooks/use-companies", () => ({
  useCreateCompanyContact: vi.fn(),
}));

describe("ThreadPanel", () => {
  it("encuentra el thread por teléfono aunque no tenga lead_id (thread 3, lead 1)", () => {
    vi.mocked(useWhatsAppThreads).mockReturnValue({
      data: [
        makeWhatsAppThread({
          id: "3",
          phone: "+542374629339",
          lead_id: null,
          name: "Empresa de prueba",
        }),
      ],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useWhatsAppThreads>);
    vi.mocked(useWhatsAppThread).mockReturnValue({
      data: {
        thread: makeWhatsAppThread({ id: "3", phone: "+542374629339" }),
        messages: [
          makeWhatsAppMessage({
            id: "301",
            thread_id: "3",
            direction: "inbound",
            text: "Hola, consulto por DOVEXO",
          }),
        ],
      },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useWhatsAppThread>);
    vi.mocked(useSimulateInbound).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useSimulateInbound>);

    render(
      <ThreadPanel
        lead={makeLead({ id: "1", company_whatsapp: "+542374629339" })}
      />,
    );

    expect(useWhatsAppThread).toHaveBeenCalledWith("3");
    expect(screen.getByText("Hola, consulto por DOVEXO")).toBeInTheDocument();
  });

  it("muestra el thread con entrantes y salientes", () => {
    vi.mocked(useWhatsAppThreads).mockReturnValue({
      data: [makeWhatsAppThread()],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useWhatsAppThreads>);
    vi.mocked(useWhatsAppThread).mockReturnValue({
      data: {
        thread: makeWhatsAppThread(),
        messages: [
          makeWhatsAppMessage(),
          makeWhatsAppMessage({
            id: "72",
            direction: "outbound",
            text: "Hola, ¿cómo estás? Soy Juan Manuel de ARVOKTA.",
          }),
        ],
      },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useWhatsAppThread>);
    vi.mocked(useSimulateInbound).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useSimulateInbound>);

    render(<ThreadPanel lead={makeLead()} />);

    expect(
      screen.getByText("Hola, quiero saber más sobre DOVEXO"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Hola, ¿cómo estás? Soy Juan Manuel de ARVOKTA."),
    ).toBeInTheDocument();
    expect(screen.getByText("Entrante")).toBeInTheDocument();
    expect(screen.getByText("Saliente")).toBeInTheDocument();
  });

  it("simula un entrante con el teléfono del lead", async () => {
    const simulateMutate = vi.fn(
      (
        _input: unknown,
        options?: { onSuccess?: (value: unknown) => void },
      ) => {
        options?.onSuccess?.({
          thread_id: "7",
          text: "Gracias por escribir, te contactamos pronto.",
        });
      },
    );
    vi.mocked(useWhatsAppThreads).mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useWhatsAppThreads>);
    vi.mocked(useWhatsAppThread).mockReturnValue({
      data: undefined,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useWhatsAppThread>);
    vi.mocked(useSimulateInbound).mockReturnValue({
      mutate: simulateMutate,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useSimulateInbound>);

    render(<ThreadPanel lead={makeLead()} />);

    expect(
      screen.getByText(/Sin conversación de WhatsApp todavía/),
    ).toBeInTheDocument();

    await userEvent.type(
      screen.getByLabelText(/^Texto recibido/),
      "Quiero una demo",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Simular entrante" }),
    );

    expect(simulateMutate).toHaveBeenCalledWith(
      {
        phone: "+5493415550000",
        text: "Quiero una demo",
        name: "Empresa de prueba",
      },
      expect.anything(),
    );
    expect(
      await screen.findByText(/Respuesta del sistema: Gracias por escribir/),
    ).toBeInTheDocument();
  });
});
