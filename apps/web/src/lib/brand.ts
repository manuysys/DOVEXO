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
    "Recibí solicitudes, asigná técnicos, enviá presupuestos y registrá pagos. Controlá saldos pendientes y mantené cada cobro asociado a su orden.",
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
    /** Usuarios de oficina (owner/admin/dispatcher/viewer). Incluye al dueño. */
    users: number;
    /** Técnicos: cuentan aparte y no ocupan cupo de oficina. */
    technicians: number;
    ordersPerMonth: number;
  };
};

/**
 * `limits.users` son usuarios de oficina (incluye al dueño); no incluye técnicos.
 * Los técnicos tienen su propia cuenta y se cuentan en `technicians`.
 */
export const plans: Plan[] = [
  {
    code: "starter",
    name: "Starter",
    priceArs: 19_900,
    tagline:
      "Para el técnico independiente que quiere ordenar sus trabajos y dejar las planillas.",
    limits: { users: 1, technicians: 1, ordersPerMonth: 100 },
  },
  {
    code: "professional",
    name: "Professional",
    priceArs: 39_900,
    tagline:
      "Para la empresa con oficina y equipo en la calle que coordina varias visitas.",
    limits: { users: 3, technicians: 5, ordersPerMonth: 1_000 },
  },
  {
    code: "business",
    name: "Business",
    priceArs: 64_900,
    tagline: "Para operaciones grandes con más técnicos y más volumen.",
    limits: { users: 5, technicians: 20, ordersPerMonth: 10_000 },
  },
];
