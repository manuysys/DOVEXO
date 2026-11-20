import { Check } from "lucide-react";
import Link from "next/link";

import { plans, planFeatures, type Plan } from "@/lib/brand";
import { pricingCopy } from "@/lib/marketing/content";
import { formatCount, formatPlanPrice } from "@/lib/marketing/pricing";
import { cn } from "@/lib/utils";

import { SectionHeading } from "./section-heading";
import { ctaPrimary } from "./ui";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mk-signal";

const ctaSecondary =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-mk-ink/30 bg-transparent px-5 py-3 text-sm font-semibold text-mk-ink transition-colors hover:border-mk-ink hover:bg-mk-ink/5";

type LimitRow = {
  label: string;
  detail: string;
  value: (plan: Plan) => string;
};

const limitRows: LimitRow[] = [
  {
    label: "Usuarios",
    detail: "Personas con acceso al panel",
    value: (plan) => formatCount(plan.limits.users),
  },
  {
    label: "Técnicos",
    detail: "Cuentas para trabajo en la calle",
    value: (plan) => formatCount(plan.limits.technicians),
  },
  {
    label: "Órdenes por mes",
    detail: "Trabajos creados en el período",
    value: (plan) => formatCount(plan.limits.ordersPerMonth),
  },
  {
    label: "Tokens del asistente",
    detail: "Consultas de IA por mes",
    value: (plan) => formatCount(plan.limits.aiTokens),
  },
];

/*
 * Precios con jerarquía por borde, sello y columna destacada, no por sombra.
 * La comparación de límites va en tabla y las features comunes, aparte.
 */
export function Pricing() {
  return (
    <section
      id="precios"
      aria-labelledby="pricing-title"
      className="scroll-mt-16 bg-mk-paper py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Precios"
          title="Elegí el plan para tu equipo."
          text={pricingCopy.description}
          titleId="pricing-title"
        />

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <p className="rounded-[2px] border border-mk-line px-2.5 py-1 text-[11px] font-bold tracking-[0.14em] uppercase text-mk-signal-strong">
            {pricingCopy.title}
          </p>
          <p className="rounded-[2px] border border-mk-line bg-mk-paper-2 px-2.5 py-1 text-[11px] font-medium text-mk-slate">
            Prueba de 14 días al registrarte
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => {
            const recommended = plan.code === "professional";
            return (
              <article
                key={plan.code}
                className={cn(
                  "flex flex-col rounded-md border bg-mk-paper-2 p-6",
                  recommended ? "border-mk-ink" : "border-mk-line",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-h4 text-mk-ink">{plan.name}</h3>
                  {recommended && (
                    <span className="shrink-0 -rotate-2 rounded-[2px] border-[1.5px] border-mk-signal-strong bg-mk-signal/5 px-2 py-1 text-[9px] font-bold tracking-[0.16em] uppercase text-mk-signal-strong">
                      Recomendado
                    </span>
                  )}
                </div>

                <p className="text-small mt-2 min-h-10 text-mk-slate">{plan.tagline}</p>

                <p className="mt-5 flex flex-wrap items-baseline gap-x-1.5">
                  <span className="numeric text-h1 text-mk-ink">
                    {formatPlanPrice(plan.priceArs)}
                  </span>
                  <span className="text-caption text-mk-slate">ARS / mes</span>
                </p>

                <ul className="mt-5 space-y-2 border-t border-mk-line pt-5">
                  {limitRows.map((row) => (
                    <li key={row.label} className="flex items-baseline justify-between gap-3">
                      <span className="text-small text-mk-slate">{row.label}</span>
                      <span className="numeric text-small font-semibold text-mk-ink">
                        {row.value(plan)}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={cn(
                    "mt-7 justify-center",
                    recommended ? cn(ctaPrimary, focusRing) : cn(ctaSecondary, focusRing),
                  )}
                >
                  Empezar con {plan.name}
                </Link>
              </article>
            );
          })}
        </div>

        <div className="mt-10 overflow-hidden rounded-md border border-mk-line bg-mk-paper-2">
          <div
            role="region"
            aria-label="Comparación de límites por plan"
            tabIndex={0}
            className={cn("overflow-x-auto", focusRing)}
          >
            <table className="w-full min-w-[38rem] border-collapse text-left">
              <caption className="sr-only">Límites de cada plan comparados</caption>
              <thead>
                <tr className="border-b border-mk-line bg-mk-paper">
                  <th scope="col" className="px-4 py-3 text-[11px] font-semibold text-mk-slate">
                    Límite
                  </th>
                  {plans.map((plan) => (
                    <th
                      key={plan.code}
                      scope="col"
                      className={cn(
                        "px-4 py-3 text-[11px] font-semibold",
                        plan.code === "professional"
                          ? "bg-mk-signal/5 text-mk-ink"
                          : "text-mk-ink",
                      )}
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {limitRows.map((row) => (
                  <tr key={row.label} className="border-b border-mk-line last:border-0">
                    <th scope="row" className="px-4 py-3 font-medium">
                      <span className="block text-[13px] text-mk-ink">{row.label}</span>
                      <span className="text-caption block text-mk-slate">{row.detail}</span>
                    </th>
                    {plans.map((plan) => (
                      <td
                        key={plan.code}
                        className={`text-small numeric px-4 py-3 text-mk-ink ${
                          plan.code === "professional"
                            ? "bg-mk-signal/5 font-semibold"
                            : ""
                        }`}
                      >
                        {row.value(plan)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-caption mt-2 text-mk-slate sm:hidden">
          Desplazá la tabla para comparar los tres planes.
        </p>

        <p className="text-caption mt-4 max-w-3xl text-mk-slate">{pricingCopy.limitsNote}</p>

        <div className="mt-10 rounded-md border border-mk-line bg-mk-paper-2 p-6 sm:p-7">
          <h3 className="text-h4 text-mk-ink">{pricingCopy.included}</h3>
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {planFeatures.map((feature) => (
              <li key={feature} className="text-small flex gap-2.5 text-mk-ink">
                <Check className="mt-0.5 size-4 shrink-0 text-mk-signal" aria-hidden="true" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
