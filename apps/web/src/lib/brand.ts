/**
 * Identidad centralizada. DOVEXO es el nombre comercial del producto y ARVOKTA la
 * empresa titular. El dominio propio está pendiente: no se inventa aquí; la URL
 * pública actual es la del despliegue en Vercel.
 */
export const brand = {
  name: "DOVEXO",
  legalName: "ARVOKTA",
  company: "ARVOKTA",
  tagline: "Gestión para empresas de servicios técnicos.",
  description:
    "Recibí solicitudes, asigná técnicos, enviá presupuestos y cobrá. Todo en un solo lugar, desde la oficina o el celular.",
  /** URL pública vigente. Cambiar cuando el dominio propio esté confirmado. */
  appUrl: "https://saas-gestion-web.vercel.app",
  /** Dominio propio: pendiente de confirmar. No usar para enlaces ni emails. */
  domain: null,
  /** Pendiente de activación cuando ARVOKTA tenga dominio y buzón. */
  email: "hola@arvokta.com",
  colors: {
    ink: "#0F0F0F",
    teal: "#C2410C",
    amber: "#E8B04A",
    paper: "#F7F7F5",
    mist: "#DEDED8",
    slate: "#6B6B66",
  },
} as const;

export type Plan = {
  code: "starter" | "professional" | "business";
  name: string;
  priceArs: number;
  tagline: string;
  limits: {
    users: number;
    technicians: number;
    ordersPerMonth: number;
  };
};

export const plans: Plan[] = [
  {
    code: "starter",
    name: "Starter",
    priceArs: 29_900,
    tagline: "Para el técnico que trabaja solo y quiere dejar las planillas.",
    limits: { users: 1, technicians: 1, ordersPerMonth: 100 },
  },
  {
    code: "professional",
    name: "Professional",
    priceArs: 59_900,
    tagline: "Para empresas con equipo en la calle y oficina coordinando.",
    limits: { users: 5, technicians: 5, ordersPerMonth: 1_000 },
  },
  {
    code: "business",
    name: "Business",
    priceArs: 99_900,
    tagline: "Para operaciones más grandes que necesitan escala y control.",
    limits: { users: 20, technicians: 20, ordersPerMonth: 10_000 },
  },
];
