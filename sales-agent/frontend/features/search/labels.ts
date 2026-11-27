import type { Sector } from "@/lib/api/types";

/**
 * Traduce slugs de rubro a nombres legibles usando `/meta/sectors`.
 * Si el slug no está en el catálogo se muestra tal como lo informó la API.
 */
export function sectorNames(slugs: string[], sectors: Sector[]): string[] {
  const bySlug = new Map(
    sectors.map((sector) => [sector.slug, sector.name || sector.slug]),
  );
  return slugs.map((slug) => bySlug.get(slug) ?? slug);
}
