/**
 * Roles que pueden pedir la investigación del sitio web de una empresa.
 * El backend valida el rol igual: esto solo evita mostrar una acción que
 * terminaría en 403.
 */
const ENRICH_ROLES = new Set(["admin", "owner"]);

export function canEnrichCompanies(role: string | null | undefined): boolean {
  if (!role) return false;
  return ENRICH_ROLES.has(role.trim().toLowerCase());
}
