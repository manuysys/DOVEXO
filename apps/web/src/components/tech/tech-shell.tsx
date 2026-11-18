"use client";

import { Loader2, LogOut, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { TechBottomNav } from "@/components/tech/tech-bottom-nav";
import { initials, ROLE_LABELS } from "@/components/tech/tech-format";
import { TechProfileDialog } from "@/components/tech/tech-profile-dialog";
import { TechSyncBanner, TechSyncIndicator } from "@/components/tech/tech-sync-status";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

/** Shell móvil para técnicos: sin navegación lateral ni módulos financieros. */
export function TechShell({ children }: { children: ReactNode }) {
  const { user, tenants, activeTenantId, setActiveTenant, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="text-small flex min-h-dvh items-center justify-center gap-3 bg-bg text-text-2">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        Cargando sesión…
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const activeTenant = tenants.find((tenant) => tenant.id === activeTenantId);
  const technicianTenants = tenants.filter((tenant) => tenant.role === "technician");
  const isTechnician = activeTenant?.role === "technician";
  const isDetail = pathname.startsWith("/tech/orders/");

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (!isTechnician) {
    const roleLabel = activeTenant?.role
      ? (ROLE_LABELS[activeTenant.role] ?? activeTenant.role)
      : "Sin rol";

    return (
      <div className="min-h-dvh bg-bg">
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-3">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ds-md bg-primary text-sm font-bold text-white"
            >
              {brand.name.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-small truncate font-semibold text-text">{brand.name}</p>
              <p className="text-caption truncate text-text-2">Acceso de técnicos</p>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-md px-4 py-8">
          <div className="rounded-ds-xl border border-border bg-surface p-6 text-center shadow-card">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning-soft text-warning-strong">
              <ShieldAlert className="h-6 w-6" aria-hidden="true" />
            </span>
            <h1 className="text-h3 mt-4 text-text">Esta sección es para técnicos</h1>
            <p className="text-small mt-2 text-text-2">
              Ingresá con tu cuenta de técnico para ver los trabajos asignados.
            </p>

            <p className="text-small mt-4 rounded-ds-md bg-surface-2 px-3 py-2 text-text-2">
              {activeTenant ? (
                <>
                  Tu rol en <span className="font-semibold text-text">{activeTenant.name}</span> es{" "}
                  <span className="font-semibold text-text">{roleLabel}</span>.
                </>
              ) : (
                "No hay una empresa activa en tu sesión."
              )}
            </p>

            {technicianTenants.length > 0 ? (
              <div className="mt-4 text-left">
                <label htmlFor="tech-role-tenant" className="text-label text-text-2">
                  Empresas con rol de técnico
                </label>
                <select
                  id="tech-role-tenant"
                  defaultValue=""
                  onChange={(event) => {
                    if (event.target.value) setActiveTenant(event.target.value);
                  }}
                  className="mt-2 min-h-12 w-full rounded-ds-md border border-border bg-surface px-3 text-base text-text focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                >
                  <option value="" disabled>
                    Elegí una empresa
                  </option>
                  {technicianTenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
                <p className="text-caption mt-2 text-text-2">
                  Al cambiar de empresa vas directo a tus trabajos.
                </p>
              </div>
            ) : (
              <p className="text-caption mt-3 text-text-2">
                Tu cuenta no tiene rol de técnico en ninguna empresa. Pedile a la oficina que te
                invite como técnico.
              </p>
            )}

            <div className="mt-6 grid gap-2">
              <Button size="lg" className="w-full" onClick={() => void handleLogout()}>
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Cerrar sesión
              </Button>
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
              >
                Ir al panel
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg">
      <a
        href="#tech-main"
        className="focus:text-small sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-ds-md focus:bg-primary focus:px-4 focus:py-2 focus:font-semibold focus:text-white"
      >
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-2.5">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ds-md bg-primary text-sm font-bold text-white"
          >
            {brand.name.charAt(0)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-small truncate font-semibold text-text">
              {brand.name} <span className="font-normal text-text-2">· Técnico</span>
            </p>
            <p className="text-caption truncate text-text-2">
              {activeTenant?.name ?? "Sin empresa"}
            </p>
          </div>
          <TechSyncIndicator />
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            aria-label="Abrir perfil"
            aria-haspopup="dialog"
            aria-expanded={profileOpen}
            className="text-small inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 font-bold text-text transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {initials(user.full_name)}
          </button>
        </div>
      </header>

      <TechSyncBanner />

      <main
        id="tech-main"
        className={cn("mx-auto w-full max-w-xl px-4 pt-4", isDetail ? "pb-44" : "pb-28")}
      >
        {children}
      </main>

      {!isDetail && (
        <TechBottomNav onProfile={() => setProfileOpen(true)} profileOpen={profileOpen} />
      )}
      <TechProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </div>
  );
}
