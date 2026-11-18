import { ApiError, getAccessToken } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Saldo de una orden finalizada: total aprobado menos pagos registrados. */
export type PendingBalance = {
  id: string;
  code: string;
  title: string;
  customer_name: string;
  /** Importes Decimal serializados como string. */
  total: string;
  paid: string;
  balance: string;
};

/** Subconjunto de `/api/v1/dashboard/operations` que usa la pantalla de pagos. */
export type PaymentOverview = {
  finished_with_balance: PendingBalance[];
  counts: {
    finished_with_balance: number;
  };
};

function detailOf(body: unknown, fallback: string): string {
  if (typeof body === "object" && body !== null && "detail" in body) {
    const value = (body as { detail?: unknown }).detail;
    if (typeof value === "string") return value;
  }
  return fallback;
}

export async function fetchPaymentOverview(tenantId: string): Promise<PaymentOverview> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-ID": tenantId,
  };
  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api/v1/dashboard/operations`, {
    headers,
    credentials: "include",
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      response.status,
      detailOf(body, "No se pudieron cargar los saldos pendientes"),
    );
  }
  return body as PaymentOverview;
}
