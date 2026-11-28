/**
 * Estados de verificación de un contacto. `published` solo indica que el dato
 * estaba publicado en el sitio: no prueba que el canal esté activo ni que la
 * cuenta de WhatsApp exista. `verified` requiere una confirmación humana.
 */
export const CONTACT_VERIFICATION_LABELS: Record<string, string> = {
  unverified: "Sin verificar",
  pending: "Pendiente de verificación",
  published: "Publicado",
  verified: "Verificado manualmente",
  invalid: "Inválido",
};

export function contactVerificationLabel(status: string): string {
  return CONTACT_VERIFICATION_LABELS[status] ?? status;
}

export function isVerifiedContact(status: string): boolean {
  return status.trim().toLowerCase() === "verified";
}

/**
 * Un canal publicado (o sin verificar) no se presenta como cuenta real.
 */
export function isUnverifiedChannel(status: string): boolean {
  const normalized = status.trim().toLowerCase();
  return normalized !== "verified";
}
