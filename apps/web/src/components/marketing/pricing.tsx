import { Check } from "lucide-react";
import Link from "next/link";

import { plans, planFeatures, type Plan } from "@/lib/brand";
import { pricingCopy } from "@/lib/marketing/content";
import { formatCount, formatPlanPrice } from "@/lib/marketing/pricing";
import { cn } from "@/lib/utils";

import { SectionHeading } from "./section-heading";
import { ctaPrimary } from "./ui";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const focusPrimaryCta =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep";

const ctaSecondary =
  "inline-flex items-center justify-center gap-2 rounded-ds-md border border-border bg-surface px-5 py-3 text-sm font-semibold text-text transition-colors hover:border-primary/40 hover:bg-surface-2";

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
 * Precios con jerarquía por borde, etiqueta y columna destacada, no por tamaño.
 * La comparación de límites va en tabla y las features comunes, en un bloque
 * aparte. Nada de integraciones que todavía requieran configuración externa.
 */
export function Pricing() {
  return (
    <section id="precios" aria-labelledby="pricing-title" className="scroll-mt-16 bg-bg py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Precios"
          title="Elegí el plan para tu equipo."
          text={pricingCopy.description}
          titleId="pricing-title"
        />

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <p className="text-xs inline-flex items-center rounded-full bg-info-soft px-3 py-1 font-semibold text-info-strong">
            {pricingCopy.title}
          </p>
          <p className="text-xs inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 font-medium text-text-2">
            Prueba de 14 días: en implementación
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => {
            const recommended = plan.code === "professional";
            return (
              <article
                key={plan.code}
                className={cn(
                  "flex flex-col rounded-ds-lg border bg-surface p-6",
                  recommended
                    ? "border-primary ring-1 ring-primary/15"
                    : "border-border",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-h4 text-text">{plan.name}</h3>
                  {recommended && (
                    <span className="text-xs shrink-0 rounded-full border border-primary/25 bg-info-soft px-2.5 py-1 font-semibold text-info-strong">
                      Recomendado
                    </span>
                  )}
                </div>

                <p className="text-small mt-2 min-h-10 text-text-2">{plan.tagline}</p>

                <p className="mt-5 flex flex-wrap items-baseline gap-x-1.5">
                  <span className="numeric text-h1 text-text">{formatPlanPrice(plan.priceArs)}</span>
                  <span className="text-caption text-text-2">ARS / mes</span>
                </p>

                <ul className="mt-5 space-y-2 border-t border-border pt-5">
                  {limitRows.map((row) => (
                    <li key={row.label} className="flex items-baseline justify-between gap-3">
                      <span className="text-small text-text-2">{row.label}</span>
                      <span className="numeric text-small font-semibold text-text">
                        {row.value(plan)}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={cn(
                    "mt-7 justify-center",
                    recommended ? cn(ctaPrimary, focusPrimaryCta) : cn(ctaSecondary, focusRing),
                  )}
                >
                  Empezar con {plan.name}
                </Link>
              </article>
            );
          })}
        </div>

        <div className="mt-10 overflow-hidden rounded-ds-lg border border-border bg-surface">
          <div
            role="region"
            aria-label="Comparación de límites por plan"
            tabIndex={0}
            className={cn("overflow-x-auto", focusRing)}
          >
            <table className="w-full min-w-[38rem] border-collapse text-left">
              <caption className="sr-only">Límites de cada plan comparados</caption>
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  <th scope="col" className="text-xs px-4 py-3 font-semibold text-text-2">
                    Límite
                  </th>
                  {plans.map((plan) => (
                    <th
                      key={plan.code}
                      scope="col"
                      className={cn(
                        "text-xs px-4 py-3 font-semibold",
                        plan.code === "professional" ? "bg-info-soft text-info-strong" : "text-text",
                      )}
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {limitRows.map((row) => (
                  <tr key={row.label} className="border-b border-border last:border-0">
                    <th scope="row" className="px-4 py-3 font-medium">
                      <span className="text-small block text-text">{row.label}</span>
                      <span className="text-caption block text-text-2">{row.detail}</span>
                    </th>
                    {plans.map((plan) => (
                      <td
                        key={plan.code}
                        className={`text-small numeric px-4 py-3 text-text ${
                          plan.code === "professional" ? "bg-info-soft/50 font-semibold" : ""
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
        <p className="text-caption mt-2 text-text-2 sm:hidden">
          Desplazá la tabla para comparar los tres planes.
        </p>

        <p className="text-caption mt-4 max-w-3xl text-text-2">{pricingCopy.limitsNote}</p>

        <div className="mt-10 rounded-ds-lg border border-border bg-surface p-6 sm:p-7">
          <h3 className="text-h4 text-text">{pricingCopy.included}</h3>
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {planFeatures.map((feature) => (
              <li key={feature} className="text-small flex gap-2.5 text-text">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
