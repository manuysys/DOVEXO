"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { brand } from "@/lib/brand";
import { portalApi, type PortalSession } from "@/lib/portal-api";
import { cn } from "@/lib/utils";

import { isPortalQuoteExpired, shortName, type PortalTab } from "./portal-labels";
import { PortalHome } from "./portal-home";
import { PortalQuotes } from "./portal-quotes";
import {
  PortalAppointments,
  PortalOrders,
  PortalPayments,
  PortalRequests,
} from "./portal-sections";
import { PortalNotice } from "./portal-ui";

const TABS: { id: PortalTab; label: string }[] = [
  { id: "home", label: "Inicio" },
  { id: "requests", label: "Solicitudes" },
  { id: "orders", label: "Trabajos" },
  { id: "appointments", label: "Turnos" },
  { id: "quotes", label: "Presupuestos" },
  { id: "payments", label: "Pagos" },
];

export function PortalWorkspace({
  session,
  companyName,
  onExit,
}: {
  session: PortalSession;
  companyName: string;
  onExit: () => void;
}) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<PortalTab>("home");
  const { slug, token } = session;
  const sessionKey = session.expiresAt;

  const summaryQuery = useQuery({
    queryKey: ["portal", slug, sessionKey, "summary"],
    queryFn: () => portalApi.summary(slug, token),
    retry: false,
  });
  const requestsQuery = useQuery({
    queryKey: ["portal", slug, sessionKey, "requests"],
    queryFn: () => portalApi.requests(slug, token),
    retry: false,
  });
  const ordersQuery = useQuery({
    queryKey: ["portal", slug, sessionKey, "orders"],
    queryFn: () => portalApi.orders(slug, token),
    retry: false,
  });
  const quotesQuery = useQuery({
    queryKey: ["portal", slug, sessionKey, "quotes"],
    queryFn: () => portalApi.quotes(slug, token),
    retry: false,
  });
  const appointmentsQuery = useQuery({
    queryKey: ["portal", slug, sessionKey, "appointments"],
    queryFn: () => portalApi.appointments(slug, token),
    retry: false,
  });
  const paymentsQuery = useQuery({
    queryKey: ["portal", slug, sessionKey, "payments"],
    queryFn: () => portalApi.payments(slug, token),
    retry: false,
  });

  const queries = [
    summaryQuery,
    requestsQuery,
    ordersQuery,
    quotesQuery,
    appointmentsQuery,
    paymentsQuery,
  ];

  const sessionExpired = queries.some(
    (query) => query.error instanceof ApiError && query.error.status === 401,
  );
  const hasError = queries.some(
    (query) => query.isError && !(query.error instanceof ApiError && query.error.status === 401),
  );

  const quotes = quotesQuery.data ?? [];
  const pendingQuotes = quotes.filter(
    (quote) => quote.status === "sent" && !isPortalQuoteExpired(quote),
  ).length;

  const refreshQuotes = () => {
    void queryClient.invalidateQueries({ queryKey: ["portal", slug, sessionKey, "quotes"] });
    void queryClient.invalidateQueries({ queryKey: ["portal", slug, sessionKey, "summary"] });
  };

  const refreshRequests = () => {
    void queryClient.invalidateQueries({ queryKey: ["portal", slug, sessionKey, "requests"] });
    void queryClient.invalidateQueries({ queryKey: ["portal", slug, sessionKey, "summary"] });
  };

  const retryAll = () => {
    for (const query of queries) {
      void query.refetch();
    }
  };

  const isRefreshing = queries.some((query) => query.isFetching);
  const homeLoading = queries.some((query) => query.isPending);

  function selectTab(next: PortalTab) {
    setTab(next);
    window.scrollTo({ top: 0 });
  }

  if (sessionExpired) {
    return (
      <main className="min-h-screen bg-bg px-4 py-16">
        <Card className="mx-auto w-full max-w-md p-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-ds-md bg-warning-soft text-warning-strong">
            <Clock className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="text-h3 mt-4 text-text">Tu sesión venció</h1>
          <p className="text-body mt-2 text-text-2">
            Por seguridad, el acceso dura un tiempo limitado. Pedile a {companyName} un enlace nuevo
            para volver a entrar.
          </p>
          <Button className="mt-5 w-full" onClick={onExit}>
            Volver a ingresar
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="bg-deep text-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-start justify-between gap-3 px-4 py-5">
          <div className="min-w-0">
            <p className="text-caption text-white/60">Portal de {companyName}</p>
            <h1 className="text-h3 mt-0.5 truncate">Hola, {shortName(session.customer.name)}</h1>
            <p className="text-small mt-1 text-white/70">
              Tus servicios, turnos y presupuestos en un solo lugar.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={retryAll}
              disabled={isRefreshing}
              aria-label="Actualizar información"
              aria-busy={isRefreshing}
              className="inline-flex h-10 w-10 items-center justify-center rounded-ds-md border border-white/20 text-white transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#17243d] focus-visible:outline-none disabled:opacity-60"
            >
              <RefreshCw
                className={cn("h-4 w-4", isRefreshing && "animate-spin")}
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              onClick={onExit}
              className="text-small inline-flex min-h-10 items-center gap-1.5 rounded-ds-md border border-white/20 px-3 font-semibold text-white transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#17243d] focus-visible:outline-none"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Salir
            </button>
          </div>
        </div>
      </header>

      <nav
        aria-label="Secciones del portal"
        className="sticky top-0 z-20 border-b border-border bg-surface shadow-card"
      >
        <div className="mx-auto flex max-w-4xl [scrollbar-width:none] gap-1 overflow-x-auto px-3 py-2 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((item) => {
            const active = item.id === tab;
            const count = item.id === "quotes" ? pendingQuotes : 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectTab(item.id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-small flex shrink-0 items-center gap-1.5 rounded-ds-md px-3 py-2 font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                  active
                    ? "bg-primary text-white"
                    : "text-text-2 hover:bg-surface-2 hover:text-text",
                )}
              >
                {item.label}
                {count > 0 && (
                  <span
                    className={cn(
                      "numeric text-caption rounded-full px-1.5",
                      active ? "bg-white/20 text-white" : "bg-warning-soft text-warning-strong",
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="mx-auto w-full max-w-4xl px-4 py-6">
        {hasError && (
          <div className="mb-4">
            <PortalNotice tone="warning" role="alert">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>No pudimos cargar toda la información. Revisá tu conexión.</span>
                <Button size="sm" variant="outline" onClick={retryAll}>
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  Reintentar
                </Button>
              </div>
            </PortalNotice>
          </div>
        )}

        {tab === "home" && (
          <PortalHome
            summary={summaryQuery.data}
            orders={ordersQuery.data ?? []}
            quotes={quotes}
            requests={requestsQuery.data ?? []}
            appointments={appointmentsQuery.data ?? []}
            payments={paymentsQuery.data ?? []}
            loading={homeLoading}
            onNavigate={selectTab}
          />
        )}

        {tab === "requests" && (
          <PortalRequests
            session={session}
            requests={requestsQuery.data ?? []}
            loading={requestsQuery.isPending}
            onCreated={refreshRequests}
          />
        )}

        {tab === "orders" && (
          <PortalOrders orders={ordersQuery.data ?? []} loading={ordersQuery.isPending} />
        )}

        {tab === "appointments" && (
          <PortalAppointments
            appointments={appointmentsQuery.data ?? []}
            loading={appointmentsQuery.isPending}
          />
        )}

        {tab === "quotes" && (
          <PortalQuotes
            session={session}
            quotes={quotes}
            loading={quotesQuery.isPending}
            onChanged={refreshQuotes}
          />
        )}

        {tab === "payments" && (
          <PortalPayments payments={paymentsQuery.data ?? []} loading={paymentsQuery.isPending} />
        )}

        <footer className="text-caption mt-10 flex items-center justify-center gap-1.5 border-t border-border pt-4 text-text-2">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Acceso seguro de {brand.name}. No compartas este enlace.
        </footer>
      </main>
    </div>
  );
}
