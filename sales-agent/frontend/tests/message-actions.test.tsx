import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageComposer } from "@/components/messages/message-composer";
import { LeadMessagesSection } from "@/components/messages/message-list";
import {
  useApproveMessage,
  useGenerateMessage,
  useLeadMessages,
  useMarkMessageSent,
  useSendMessage,
  useUpdateMessage,
} from "@/hooks/use-messages";
import { useWhatsAppStatus } from "@/hooks/use-whatsapp";
import { makeLead, makeMessage } from "./utils";

vi.mock("@/hooks/use-messages", () => ({
  useLeadMessages: vi.fn(),
  useGenerateMessage: vi.fn(),
  useUpdateMessage: vi.fn(),
  useApproveMessage: vi.fn(),
  useSendMessage: vi.fn(),
  useMarkMessageSent: vi.fn(),
}));

vi.mock("@/hooks/use-whatsapp", () => ({ useWhatsAppStatus: vi.fn() }));

function mutation<T extends (...args: never[]) => unknown>(mutate: T) {
  return {
    mutate,
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
  } as never;
}

beforeEach(() => {
  const noop = mutation(vi.fn());
  vi.mocked(useUpdateMessage).mockReturnValue(
    noop as ReturnType<typeof useUpdateMessage>,
  );
  vi.mocked(useApproveMessage).mockReturnValue(
    noop as ReturnType<typeof useApproveMessage>,
  );
  vi.mocked(useSendMessage).mockReturnValue(
    noop as ReturnType<typeof useSendMessage>,
  );
  vi.mocked(useMarkMessageSent).mockReturnValue(
    noop as ReturnType<typeof useMarkMessageSent>,
  );
  vi.mocked(useLeadMessages).mockReturnValue({
    data: [],
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useLeadMessages>);
  vi.mocked(useWhatsAppStatus).mockReturnValue({
    data: {
      configured: false,
      mode: "console",
      sender_phone: null,
      founder_phone_set: false,
    },
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useWhatsAppStatus>);
});

describe("MessageComposer", () => {
  it("genera un borrador con el tipo elegido", async () => {
    const generateMutate = vi.fn(
      (_input: unknown, options?: { onSuccess?: (value: unknown) => void }) => {
        options?.onSuccess?.(makeMessage({ message_type: "demo_invite" }));
      },
    );
    vi.mocked(useGenerateMessage).mockReturnValue(
      mutation(generateMutate) as ReturnType<typeof useGenerateMessage>,
    );

    render(<MessageComposer leadId="5" />);

    await userEvent.selectOptions(screen.getByLabelText("Tipo de mensaje"), "demo_invite");
    await userEvent.click(screen.getByRole("button", { name: "Generar mensaje" }));

    expect(generateMutate).toHaveBeenCalledWith(
      { channel: "whatsapp", message_type: "demo_invite" },
      expect.anything(),
    );
    expect(
      await screen.findByText(/Borrador generado \(Invitación a demo\)/),
    ).toBeInTheDocument();
  });
});

describe("LeadMessagesSection", () => {
  it("aprueba un borrador y registra el envío manual solo con confirmación", async () => {
    const approveMutate = vi.fn(
      (_id: string, options?: { onSuccess?: (value: unknown) => void }) => {
        options?.onSuccess?.(makeMessage({ status: "approved" }));
      },
    );
    const markSentMutate = vi.fn(
      (_id: string, options?: { onSuccess?: (value: unknown) => void }) => {
        options?.onSuccess?.(makeMessage({ status: "sent" }));
      },
    );
    vi.mocked(useLeadMessages).mockReturnValue({
      data: [makeMessage()],
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useLeadMessages>);
    vi.mocked(useApproveMessage).mockReturnValue(
      mutation(approveMutate) as ReturnType<typeof useApproveMessage>,
    );
    vi.mocked(useMarkMessageSent).mockReturnValue(
      mutation(markSentMutate) as ReturnType<typeof useMarkMessageSent>,
    );

    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<LeadMessagesSection lead={makeLead()} />);

    await userEvent.click(screen.getByRole("button", { name: "Aprobar" }));
    expect(approveMutate).toHaveBeenCalledWith("31", expect.anything());
    expect(
      await screen.findByText(/Mensaje aprobado/),
    ).toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  it("avisa modo simulado cuando el envío no llega a WhatsApp", async () => {    const sendMutate = vi.fn(
      (_id: string, options?: { onSuccess?: (value: unknown) => void }) => {
        options?.onSuccess?.(
          makeMessage({
            status: "sent",
            simulated: true,
            sent_via: "console",
          }),
        );
      },
    );
    vi.mocked(useLeadMessages).mockReturnValue({
      data: [makeMessage({ status: "approved" })],
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useLeadMessages>);
    vi.mocked(useSendMessage).mockReturnValue(
      mutation(sendMutate) as ReturnType<typeof useSendMessage>,
    );

    render(<LeadMessagesSection lead={makeLead()} />);

    await userEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(sendMutate).toHaveBeenCalledWith("31", expect.anything());
    expect(
      await screen.findByText(/Modo simulado: el mensaje quedó registrado/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/El proveedor aceptó el envío/),
    ).not.toBeInTheDocument();
  });

  it("abre WhatsApp con el teléfono cuando no hay WhatsApp confirmado", () => {
    vi.mocked(useLeadMessages).mockReturnValue({
      data: [makeMessage({ status: "approved" })],
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useLeadMessages>);

    render(
      <LeadMessagesSection
        lead={makeLead({
          company_whatsapp: null,
          company_phone: "+542374629339",
        })}
      />,
    );

    const link = screen.getByRole("link", { name: "Abrir WhatsApp (manual)" });
    expect(link).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/542374629339"),
    );
    expect(link.getAttribute("title")).toMatch(
      /no está confirmado como WhatsApp/,
    );
  });
});
