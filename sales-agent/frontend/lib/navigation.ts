export interface NavItem {
  href: string;
  label: string;
  /**
   * Fase del SPEC en la que se habilita una sección todavía pendiente.
   * Ausente = la pantalla ya está operativa.
   */
  phase?: 2 | 3 | 4 | 5;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview" },
  { href: "/products", label: "Productos" },
  { href: "/campaigns", label: "Campañas" },
  { href: "/search", label: "Buscar empresas" },
  { href: "/prospects", label: "Prospectos" },
  { href: "/approvals", label: "Pendientes de aprobación" },
  { href: "/messages", label: "Mensajes" },
  { href: "/contacts", label: "Contactos", phase: 3 },
  { href: "/crm", label: "CRM" },
  { href: "/imports", label: "Importaciones" },
  { href: "/search-history", label: "Historial de búsquedas" },
  { href: "/settings", label: "Configuración" },
];

export function isActiveNavItem(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
