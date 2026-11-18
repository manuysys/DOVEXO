"use client";

import { LogIn, SearchX, ShieldAlert, WifiOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type Props = {
  error: unknown;
  onRetry?: () => void;
  /**
   * `section` (por defecto) cubre el listado del técnico; `order` ajusta el
   * mensaje de permisos cuando el trabajo puntual ya no le pertenece.
   */
  scope?: "section" | "order";
};

/**
 * Distingue permisos (403), sesión vencida (401), recurso inexistente (404)
 * y errores de red. Evita mostrar "revisá la conexión" cuando el backend
 * rechazó el rol del usuario.
 */
export function TechQueryError({ error, onRetry, scope = "section" }: Props) {
  const { logout } = useAuth();
  const router = useRouter();
  const status = error instanceof ApiError ? error.status : null;

  const isPermission = status === 403;
  const isSession = status === 401;
  const isNotFound = status === 404;
  const isOrderScope = scope === "order";

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  const Icon = isPermission ? ShieldAlert : isSession ? LogIn : isNotFound ? SearchX : WifiOff;
  const title = isPermission
    ? isOrderScope
      ? "Sin acceso a este trabajo"
      : "Esta sección es para técnicos"
    : isSession
      ? "Tu sesión venció"
      : isNotFound
        ? "Trabajo no disponible"
        : "No pudimos cargar la información";
  const description = isPermission
    ? isOrderScope
      ? "No tenés permiso para ver este trabajo. Puede que la oficina lo haya reasignado a otro técnico."
      : "Esta sección es para técnicos. Ingresá con tu cuenta de técnico."
    : isSession
      ? "Volvé a iniciar sesión para continuar."
      : isNotFound
        ? "Puede que la oficina lo haya reasignado o que ya no esté disponible."
        : "Revisá la conexión e intentá de nuevo.";
  const tone = isPermission
    ? "bg-warning-soft text-warning-strong"
    : isSession
      ? "bg-info-soft text-info-strong"
      : isNotFound
        ? "bg-surface-2 text-text-2"
        : "bg-danger-soft text-danger-strong";

  return (
    <div role="alert" className="rounded-ds-lg border border-border bg-surface p-5 shadow-card">
      <span className={cn("flex h-11 w-11 items-center justify-center rounded-full", tone)}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 className="text-h4 mt-3 text-text">{title}</h2>
      <p className="text-small mt-1 text-text-2">{description}</p>
      <div className="mt-4 grid gap-2">
        {isPermission && (
          <>
            {isOrderScope && (
              <Link
                href="/tech"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
              >
                Volver a mis trabajos
              </Link>
            )}
            <Button size="lg" className="w-full" onClick={() => void handleLogout()}>
              Cerrar sesión
            </Button>
            {!isOrderScope && (
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
              >
                Ir al panel
              </Link>
            )}
          </>
        )}
        {isSession && (
          <Button size="lg" className="w-full" onClick={() => void handleLogout()}>
            Iniciar sesión
          </Button>
        )}
        {isNotFound && (
          <Link
            href="/tech"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
          >
            Volver a mis trabajos
          </Link>
        )}
        {!isPermission && !isSession && !isNotFound && onRetry && (
          <Button size="lg" className="w-full" onClick={onRetry}>
            Reintentar
          </Button>
        )}
      </div>
    </div>
  );
}
