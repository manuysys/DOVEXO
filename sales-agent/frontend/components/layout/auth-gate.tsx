"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-auth";
import { isUnauthorized } from "@/lib/api/client";
import { AppShell } from "./app-shell";
import { FullPageLoading } from "@/components/ui/spinner";
import { FullPageError } from "@/components/ui/spinner";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: user, isPending, isError, error, refetch, isRefetching } =
    useCurrentUser();
  const unauthorized = isUnauthorized(error);

  useEffect(() => {
    if (unauthorized) router.replace("/login");
  }, [unauthorized, router]);

  if (isPending || unauthorized) {
    return <FullPageLoading label="Verificando sesión…" />;
  }

  if (isError || !user || !user.email) {
    const message =
      error instanceof Error
        ? error.message
        : "La API no devolvió los datos del usuario.";
    return (
      <FullPageError
        message={message}
        onRetry={() => {
          if (!isRefetching) void refetch();
        }}
      />
    );
  }

  return <AppShell user={user}>{children}</AppShell>;
}
