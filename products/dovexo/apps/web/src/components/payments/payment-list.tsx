"use client";

import { PaymentStatusBadge } from "@/components/payments/payment-status-badge";
import { Button } from "@/components/ui/button";
import type { Payment } from "@/lib/api";
import { paymentMethodLabel } from "@/lib/payment-status";
import { formatCurrency, formatDate } from "@/lib/utils";

type PaymentListProps = {
  payments: Payment[];
  orderCode: (workOrderId: string) => string;
  onVoid: (payment: Payment) => void;
  /** Id del pago que se está anulando, para mostrar el estado del botón. */
  voidingId: string | null;
};

export function PaymentList({ payments, orderCode, onVoid, voidingId }: PaymentListProps) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <caption className="sr-only">Pagos registrados en la empresa</caption>
          <thead>
            <tr className="border-border text-text-2 border-b text-[11px] font-semibold tracking-wide uppercase">
              <th scope="col" className="px-4 py-3">
                Fecha
              </th>
              <th scope="col" className="px-4 py-3">
                Orden
              </th>
              <th scope="col" className="px-4 py-3">
                Método
              </th>
              <th scope="col" className="px-4 py-3">
                Referencia
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Importe
              </th>
              <th scope="col" className="px-4 py-3">
                Estado
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {payments.map((payment) => {
              const isVoiding = voidingId === payment.id;
              return (
                <tr
                  key={payment.id}
                  className={
                    payment.status === "voided"
                      ? "bg-surface-2/40 text-text-2"
                      : "hover:bg-surface-2/60 transition-colors"
                  }
                >
                  <td className="text-text-2 numeric px-4 py-3 text-xs">
                    {formatDate(payment.paid_at)}
                  </td>
                  <td className="text-text-2 px-4 py-3 font-mono text-xs">
                    {orderCode(payment.work_order_id)}
                  </td>
                  <td className="text-text-2 px-4 py-3 text-sm">
                    {paymentMethodLabel(payment.method)}
                  </td>
                  <td className="text-text-2 max-w-[180px] truncate px-4 py-3 text-sm">
                    {payment.reference ?? "—"}
                  </td>
                  <td
                    className={`numeric px-4 py-3 text-right text-sm font-semibold ${
                      payment.status === "voided"
                        ? "text-text-2 line-through decoration-1"
                        : "text-text"
                    }`}
                  >
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <PaymentStatusBadge status={payment.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {payment.status === "registered" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onVoid(payment)}
                        disabled={isVoiding}
                        aria-label={`Anular pago de ${formatCurrency(payment.amount)} del ${formatDate(
                          payment.paid_at,
                        )}`}
                        className="border-danger/30 text-danger-strong hover:bg-danger-soft"
                      >
                        {isVoiding ? "Anulando…" : "Anular"}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="divide-border divide-y md:hidden">
        {payments.map((payment) => {
          const isVoiding = voidingId === payment.id;
          return (
            <li key={payment.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-text-2 font-mono text-[11px] font-semibold">
                    {orderCode(payment.work_order_id)}
                  </p>
                  <p className="text-text-2 mt-0.5 text-xs">
                    {paymentMethodLabel(payment.method)}
                    {payment.reference ? ` · ${payment.reference}` : ""}
                  </p>
                </div>
                <PaymentStatusBadge status={payment.status} className="shrink-0" />
              </div>
              <div className="mt-2 flex items-end justify-between gap-3">
                <p className="text-text-2 numeric text-xs">{formatDate(payment.paid_at)}</p>
                <p
                  className={`numeric font-display text-lg font-semibold tracking-tight ${
                    payment.status === "voided"
                      ? "text-text-2 line-through decoration-1"
                      : "text-text"
                  }`}
                >
                  {formatCurrency(payment.amount)}
                </p>
              </div>
              {payment.status === "registered" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onVoid(payment)}
                  disabled={isVoiding}
                  aria-label={`Anular pago de ${formatCurrency(payment.amount)} del ${formatDate(
                    payment.paid_at,
                  )}`}
                  className="border-danger/30 text-danger-strong hover:bg-danger-soft mt-2 w-full justify-center"
                >
                  {isVoiding ? "Anulando…" : "Anular pago"}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
