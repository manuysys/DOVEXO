/** Comparación tolerante de teléfonos publicados y números de WhatsApp. */
export function phoneDigits(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

export function samePhone(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  const a = phoneDigits(left);
  const b = phoneDigits(right);
  if (a.length === 0 || b.length === 0) return false;
  const size = Math.min(a.length, b.length, 10);
  return a.slice(-size) === b.slice(-size);
}

export function whatsappLink(phone: string, text?: string): string {
  const digits = phoneDigits(phone);
  const base = `https://wa.me/${digits}`;
  if (!text || text.trim().length === 0) return base;
  return `${base}?text=${encodeURIComponent(text.trim())}`;
}
