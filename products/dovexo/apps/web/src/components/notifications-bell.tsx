"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn, formatDate } from "@/lib/utils";

const REFRESH_INTERVAL_MS = 60_000;

export function NotificationsBell() {
  const { activeTenantId } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", activeTenantId],
    queryFn: () => api.notifications.list(activeTenantId ?? ""),
    enabled: Boolean(activeTenantId),
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.notifications.markRead(activeTenantId ?? "", id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => api.notifications.markAllRead(activeTenantId ?? ""),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (!activeTenantId) {
    return null;
  }

  const unread = query.data?.unread ?? 0;
  const items = query.data?.items.slice(0, 6) ?? [];
  const label =
    unread > 0
      ? `Notificaciones: ${unread} sin leer`
      : "Notificaciones: sin notificaciones sin leer";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="border-border text-text-2 hover:bg-surface-2 bg-surface hover:text-text rounded-ds-md relative border p-2"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          {unread > 0 && (
            <span
              aria-hidden="true"
              className="bg-danger absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold text-white"
            >
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between px-3 py-2.5">
          <DropdownMenuLabel className="p-0">Notificaciones</DropdownMenuLabel>
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={unread === 0 || markAllRead.isPending}
            className="text-primary inline-flex items-center gap-1 text-xs font-semibold disabled:opacity-50"
          >
            <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Marcar todas
          </button>
        </div>
        <DropdownMenuSeparator className="bg-border h-px" />
        {query.isLoading ? (
          <p className="text-text-2 px-3 py-6 text-center text-sm">Cargando...</p>
        ) : query.isError ? (
          <p className="text-danger-strong px-3 py-6 text-center text-sm">
            No se pudieron cargar las notificaciones.
          </p>
        ) : items.length === 0 ? (
          <p className="text-text-2 px-3 py-6 text-center text-sm">No tenés notificaciones.</p>
        ) : (
          <div className="max-h-80 overflow-y-auto p-1.5">
            {items.map((notification) => {
              const isUnread = notification.read_at === null;
              return (
                <DropdownMenuItem
                  key={notification.id}
                  onSelect={() => {
                    if (isUnread) {
                      markRead.mutate(notification.id);
                    }
                    router.push("/notifications");
                  }}
                  className={cn(
                    "flex-col items-start gap-1 px-3 py-2.5",
                    isUnread && "bg-surface-2",
                  )}
                >
                  <span className="flex w-full items-center gap-2">
                    {isUnread && <span className="bg-primary h-1.5 w-1.5 rounded-full" />}
                    <span className="text-text truncate text-sm font-semibold">
                      {notification.title}
                    </span>
                  </span>
                  <span className="text-text-2 line-clamp-2 text-xs">{notification.message}</span>
                  <span className="text-text-2/70 text-[11px]">
                    {formatDate(notification.created_at)}
                  </span>
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
        <DropdownMenuSeparator className="bg-border h-px" />
        <Link
          href="/notifications"
          className="text-text hover:bg-surface-2 block rounded-b-xl px-3 py-2.5 text-center text-xs font-semibold"
        >
          Ver todas
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
