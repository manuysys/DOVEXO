"use client";

import { useLogin } from "@/hooks/use-auth";
import { isApiError } from "@/lib/api/client";
import { LoginForm } from "./login-form";

function describeLoginError(error: unknown): string {
  if (isApiError(error)) {
    if (error.status === 401) return "Email o contraseña incorrectos.";
    if (error.status === 429) {
      return "Demasiados intentos. Esperá unos minutos antes de reintentar.";
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Ocurrió un error inesperado al iniciar sesión.";
}

export function LoginView() {
  const loginMutation = useLogin();

  return (
    <LoginForm
      onSubmit={async (values) => {
        await loginMutation.mutateAsync(values).then(() => undefined);
      }}
      isSubmitting={loginMutation.isPending}
      formError={
        loginMutation.isError ? describeLoginError(loginMutation.error) : null
      }
    />
  );
}
