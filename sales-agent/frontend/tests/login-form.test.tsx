import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/auth/login-form";

describe("LoginForm", () => {
  it("muestra errores de validación si se envía vacío", async () => {
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(await screen.findByText("Ingresá tu email.")).toBeInTheDocument();
    expect(screen.getByText("Ingresá tu contraseña.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("valida el formato del email", async () => {
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/Email/), "no-es-un-email");
    await userEvent.type(screen.getByLabelText(/Contraseña/), "secreto123");
    await userEvent.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(
      await screen.findByText("Ingresá un email válido."),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("envía las credenciales normalizadas", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<LoginForm onSubmit={onSubmit} />);

    await userEvent.type(
      screen.getByLabelText(/Email/),
      "  admin@arvokta.com  ",
    );
    await userEvent.type(screen.getByLabelText(/Contraseña/), "secreto123");
    await userEvent.click(screen.getByRole("button", { name: "Ingresar" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: "admin@arvokta.com",
        password: "secreto123",
      });
    });
  });

  it("muestra el error de la API sin romper el formulario", async () => {
    render(
      <LoginForm
        onSubmit={vi.fn()}
        formError="Email o contraseña incorrectos."
      />,
    );

    expect(
      screen.getByText("Email o contraseña incorrectos."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ingresar" })).toBeEnabled();
  });

  it("deshabilita el botón mientras envía", () => {
    render(<LoginForm onSubmit={vi.fn()} isSubmitting />);

    expect(screen.getByRole("button", { name: /Ingresando/ })).toBeDisabled();
  });
});
