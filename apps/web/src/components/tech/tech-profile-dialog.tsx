"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { initials, ROLE_LABELS } from "@/components/tech/tech-format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TechProfileDialog({ open, onOpenChange }: Props) {
  const { user, tenants, activeTenantId, setActiveTenant, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const activeTenant = tenants.find((tenant) => tenant.id === activeTenantId);
  const roleLabel = activeTenant?.role
    ? (ROLE_LABELS[activeTenant.role] ?? activeTenant.role)
    : "Sin rol";

  async function handleLogout() {
    onOpenChange(false);
    await logout();
    router.replace("/login");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border bg-surface p-5 text-text">
        <DialogHeader>
          <DialogTitle className="text-text">Mi perfil</DialogTitle>
          <DialogDescription className="text-text-2">
            Cuenta y empresa activa en este dispositivo.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-small flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
            {initials(user.full_name)}
          </span>
          <div className="min-w-0">
            <p className="text-small truncate font-semibold text-text">{user.full_name}</p>
            <p className="text-caption truncate text-text-2">{user.email}</p>
          </div>
        </div>

        <dl className="text-small mt-4 space-y-2 rounded-ds-md bg-surface-2 p-3">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-text-2">Empresa</dt>
            <dd className="truncate font-medium text-text">
              {activeTenant?.name ?? "Sin empresa"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-text-2">Rol</dt>
            <dd className="font-medium text-text">{roleLabel}</dd>
          </div>
        </dl>

        {tenants.length > 1 && (
          <div className="mt-4">
            <label htmlFor="tech-profile-tenant" className="text-label text-text-2">
              Empresa activa
            </label>
            <select
              id="tech-profile-tenant"
              value={activeTenantId ?? ""}
              onChange={(event) => setActiveTenant(event.target.value)}
              className="text-small mt-2 min-h-11 w-full rounded-ds-md border border-border bg-surface px-3 text-text focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
            >
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <Button
          variant="outline"
          size="lg"
          className="mt-5 w-full"
          onClick={() => void handleLogout()}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Cerrar sesión
        </Button>
      </DialogContent>
    </Dialog>
  );
}
