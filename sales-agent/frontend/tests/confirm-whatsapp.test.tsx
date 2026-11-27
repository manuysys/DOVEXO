import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmWhatsAppForm } from "@/components/whatsapp/confirm-whatsapp-form";
import { useCreateCompanyContact } from "@/hooks/use-companies";
import { ApiError } from "@/lib/api/client";

vi.mock("@/hooks/use-companies", () => ({
  useCreateCompanyContact: vi.fn(),
}));

let mutateMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  mutateMock = vi.fn(
    (
      _input: unknown,
      options?: { onSuccess?: (value: unknown) => void },
    ) => {
      options?.onSuccess?.({
        id: "9",
        contact_type: "whatsapp",
        value: "+542374629339",
        label: "Confirmado manualmente",
        is_primary: true,
        verification_status: "verified",
        do_not_contact: false,
      });
    },
  );
  vi.mocked(useCreateCompanyContact).mockReturnValue({
    mutate: mutateMock,
    isPending: false,
    isError: false,
    error: null,
  } as unknown as ReturnType<typeof useCreateCompanyContact>);
});

describe("ConfirmWhatsAppForm", () => {
  it("prellena el teléfono de la empresa y lo guarda como contacto verificado", async () => {
    render(
      <ConfirmWhatsAppForm companyId="10" defaultPhone="+542374629339" />,
    );

    expect(screen.getByLabelText("Teléfono con WhatsApp")).toHaveValue(
      "+542374629339",
    );
    expect(
      screen.getByText(/Verificá vos mismo que el número tenga WhatsApp/),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Confirmar WhatsApp" }),
    );

    expect(mutateMock).toHaveBeenCalledWith(
      {
        contact_type: "whatsapp",
        value: "+542374629339",
        label: "Confirmado manualmente",
        is_primary: true,
        verification_status: "verified",
      },
      expect.anything(),
    );
    expect(
      await screen.findByText(/WhatsApp confirmado\. La empresa y la conversación/),
    ).toBeInTheDocument();
  });

  it("muestra el 409 del backend como error legible", () => {
    vi.mocked(useCreateCompanyContact).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: new ApiError("Ese contacto ya existe para la empresa.", 409, {
        detail: "Ese contacto ya existe para la empresa.",
      }),
    } as unknown as ReturnType<typeof useCreateCompanyContact>);

    render(<ConfirmWhatsAppForm companyId="10" defaultPhone="+542374629339" />);

    expect(
      screen.getByText(/Ese contacto ya existe para la empresa/),
    ).toBeInTheDocument();
  });

  it("no envía el formulario sin teléfono", async () => {
    render(<ConfirmWhatsAppForm companyId="10" />);

    await userEvent.click(
      screen.getByRole("button", { name: "Confirmar WhatsApp" }),
    );

    expect(mutateMock).not.toHaveBeenCalled();
  });
});
