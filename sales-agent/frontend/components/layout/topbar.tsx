"use client";

import type { User } from "@/lib/api/types";
import { useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function Topbar({
  user,
  onOpenMenu,
}: {
  user: User;
  onOpenMenu: () => void;
}) {
  const logoutMutation = useLogout();
  const displayName =
    user.name?.trim() ||
    (user.role === "admin" ? "Administrador" : "Usuario");

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Abrir navegación"
          className="-ml-1 inline-flex size-9 items-center justify-center rounded-md text-muted hover:bg-canvas hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink lg:hidden"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
            className="size-5"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">
            ARVOKTA Sales Agent
          </p>
          <p className="hidden truncate text-xs text-muted sm:block">
            Prospección comercial interna
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="max-w-48 truncate text-xs font-medium text-ink">
            {displayName}
          </p>
          <p className="max-w-48 truncate text-[11px] text-muted">
            {user.email}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? "Saliendo…" : "Cerrar sesión"}
        </Button>
      </div>
    </header>
  );
}
