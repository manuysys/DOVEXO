import { apiRequest } from "./client";
import { normalizeProduct, normalizeProducts } from "./normalize";
import type { Product, ProductInput } from "./types";

/** Payload tal como lo espera la API de la Fase 1 (campos del SPEC §15). */
function toPayload(input: Partial<ProductInput>): Record<string, unknown> {
  return { ...input };
}

export async function listProducts(): Promise<Product[]> {
  const payload = await apiRequest<unknown>("/products");
  return normalizeProducts(payload);
}

export async function getProduct(id: string): Promise<Product> {
  const payload = await apiRequest<unknown>(
    `/products/${encodeURIComponent(id)}`,
  );
  return normalizeProduct(payload);
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const payload = await apiRequest<unknown>("/products", {
    method: "POST",
    body: toPayload(input),
  });
  return normalizeProduct(payload);
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>,
): Promise<Product> {
  const payload = await apiRequest<unknown>(
    `/products/${encodeURIComponent(id)}`,
    { method: "PATCH", body: toPayload(input) },
  );
  return normalizeProduct(payload);
}

export async function setProductActive(
  id: string,
  isActive: boolean,
): Promise<Product> {
  return updateProduct(id, { is_active: isActive });
}
