import { Check, FileClock, KeyRound, Link2, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { SectionHeading } from "./section-heading";

type Pillar = {
  icon: LucideIcon;
  title: string;
  text: string;
  evidence: string;
};

/*
 * Solo características comprobables del producto. Sin logos de clientes, sin
 * certificaciones y sin métricas que no existan. La evidencia describe el
 * comportamiento real del backend.
 */
const pillars: Pillar[] = [
  {
    icon: ShieldCheck,
    title: "Datos aislados por empresa",
    text: "Cada empresa opera en su propio espacio: los datos de una no se mezclan con los de otra.",
    evidence: "El backend valida la pertenencia en cada operación.",
  },
  {
    icon: KeyRound,
    title: "Accesos controlados",
    text: "Los permisos se definen por rol: administración, coordinación, técnicos y consulta. El backend autoriza, no la pantalla.",
    evidence: "Contraseñas con Argon2id y sesiones con cookies HttpOnly.",
  },
  {
    icon: Link2,
    title: "Links de presupuesto seguros",
    text: "Cada presupuesto se comparte con un token aleatorio. Se puede revocar y la aprobación tiene límite de intentos.",
    evidence: "Quien tiene el link puede verlo: compartilo solo con el cliente.",
  },
  {
    icon: FileClock,
    title: "Historial que no se reescribe",
    text: "Los cambios de estado de una orden y las acciones importantes quedan registrados con actor y fecha.",
    evidence: "Auditoría de transiciones, presupuestos y pagos.",
  },
];

const checks = [
  "Tokens de acceso de corta duración",
  "Aprobaciones públicas con rate limit",
  "Acceso al portal revocable",
  "Eventos de orden con actor y timestamp",
];

export function TrustStrip() {
  return (
    <section
      aria-labelledby="trust-title"
      className="border-b border-border bg-surface py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Confianza"
              title="La operación de cada empresa queda separada."
              text="La seguridad no es una etiqueta en la landing: es cómo se guardan los datos, cómo se autoriza cada acción y qué queda registrado."
              titleId="trust-title"
            />

            <ul className="mt-8 space-y-2.5">
              {checks.map((item) => (
                <li key={item} className="flex gap-2.5 text-small text-text">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>

            <p className="text-caption mt-6 max-w-sm text-text-2">
              Todavía no hay certificaciones externas. La política de privacidad está en revisión
              legal y la región de alojamiento y los plazos de backup aún no están definidos.
            </p>
          </div>

          <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {pillars.map((pillar) => (
              <li key={pillar.title} className="border-t border-border pt-5">
                <span className="grid size-9 place-items-center rounded-ds-sm bg-info-soft text-primary">
                  <pillar.icon className="size-4" aria-hidden="true" />
                </span>
                <h3 className="text-h4 mt-4 text-text">{pillar.title}</h3>
                <p className="text-small mt-2 text-text-2">{pillar.text}</p>
                <p className="text-caption mt-3 text-text-2">{pillar.evidence}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
