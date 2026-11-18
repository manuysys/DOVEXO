import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { WorkOrder } from "@/lib/api";

import { OrderPriorityBadge, OrderStatusBadge } from "./order-badges";
import {
  COMMERCIAL_STATUS_TONES,
  PAYMENT_STATUS_TONES,
  commercialStatusLabel,
  paymentStatusLabel,
} from "./order-meta";

type OrderSummaryCardProps = {
  order: WorkOrder;
};

function DateRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-text-2 text-caption">{label}</dt>
      <dd className="text-text mt-0.5 text-small">
        {value ? <time dateTime={value}>{formatDate(value)}</time> : <span className="text-text-2">—</span>}
      </dd>
    </div>
  );
}

export function OrderSummaryCard({ order }: OrderSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Información general</CardTitle>
        <CardDescription>
          <span className="numeric font-mono">{order.code}</span> · creada el{" "}
          {formatDate(order.created_at)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.operational_status} />
          <OrderPriorityBadge priority={order.priority} withDot />
          <Badge variant={COMMERCIAL_STATUS_TONES[order.commercial_status] ?? "neutral"}>
            {commercialStatusLabel(order.commercial_status)}
          </Badge>
          <Badge variant={PAYMENT_STATUS_TONES[order.payment_status] ?? "neutral"}>
            {paymentStatusLabel(order.payment_status)}
          </Badge>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2">
          <DateRow label="Programada" value={order.scheduled_at} />
          <DateRow label="Iniciada" value={order.started_at} />
          <DateRow label="Finalizada" value={order.finished_at} />
          <DateRow label="Última actualización" value={order.updated_at} />
        </dl>

        <div>
          <h3 className="text-text-2 text-caption">Descripción</h3>
          {order.description ? (
            <p className="text-text bg-surface-2 rounded-ds-md mt-1 p-3 text-small whitespace-pre-line">
              {order.description}
            </p>
          ) : (
            <p className="text-text-2 mt-1 text-small">Sin descripción cargada.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
