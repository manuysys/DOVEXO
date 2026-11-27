import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { simulateInbound } from "@/lib/api/whatsapp";
import { useSimulateInbound } from "@/hooks/use-whatsapp";
import { renderWithProviders } from "./utils";

vi.mock("@/lib/api/whatsapp", () => ({
  simulateInbound: vi.fn(),
  getWhatsAppStatus: vi.fn(),
  listWhatsAppThreads: vi.fn(),
  getWhatsAppThread: vi.fn(),
}));

function Harness() {
  const simulate = useSimulateInbound();
  return (
    <button
      type="button"
      onClick={() =>
        simulate.mutate({ phone: "+542374629339", text: "Hola" })
      }
    >
      Simular
    </button>
  );
}

describe("useSimulateInbound", () => {
  it("refresca threads, mensajes y actividades después de simular", async () => {
    vi.mocked(simulateInbound).mockResolvedValue({
      thread_id: "3",
      text: null,
    });

    const { queryClient } = renderWithProviders(<Harness />);
    const spy = vi.spyOn(queryClient, "invalidateQueries");

    await userEvent.click(screen.getByRole("button", { name: "Simular" }));

    await waitFor(() => {
      expect(simulateInbound).toHaveBeenCalledWith({
        phone: "+542374629339",
        text: "Hola",
      });
    });

    const invalidated = spy.mock.calls.map((call) => call[0]?.queryKey);
    expect(invalidated).toContainEqual(["whatsapp", "threads"]);
    expect(invalidated).toContainEqual(["whatsapp"]);
    expect(invalidated).toContainEqual(["messages"]);
  });
});
