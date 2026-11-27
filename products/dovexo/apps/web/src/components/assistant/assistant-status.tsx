import { Cpu, Gauge, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AIStatus } from "@/lib/api";
import { DETERMINISTIC_PROVIDER } from "@/lib/ai";
import { cn, formatNumber } from "@/lib/utils";
import { usagePercent } from "@/lib/usage";

type AssistantStatusProps = {
  status: AIStatus;
  blocked: boolean;
};

function providerBadge(status: AIStatus, blocked: boolean) {
  if (blocked) return { variant: "warning" as const, label: "Sin configurar" };
  if (status.provider === DETERMINISTIC_PROVIDER) {
    return { variant: "info" as const, label: "Modo local" };
  }
  if (status.available) return { variant: "success" as const, label: "Disponible" };
  return { variant: "warning" as const, label: "No disponible" };
}

export function AssistantStatusCard({ status, blocked }: AssistantStatusProps) {
  const badge = providerBadge(status, blocked);
  const percent = usagePercent(status.tokens_used, status.monthly_token_limit);
  const remaining = Math.max(0, status.monthly_token_limit - status.tokens_used);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="text-accent-teal h-4 w-4" aria-hidden="true" />
            Estado del asistente
          </CardTitle>
          <p className="text-text-2 mt-1 text-xs">Información del proveedor configurado.</p>
        </div>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <dl className="space-y-2 text-sm">
          <div className="flex items-start justify-between gap-3">
            <dt className="text-text-2 flex items-center gap-1.5 text-xs">
              <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
              Proveedor
            </dt>
            <dd className="text-text text-right font-medium break-all">{status.provider}</dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-text-2 text-xs">Modelo</dt>
            <dd className="text-text text-right font-medium break-all">{status.model || "—"}</dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-text-2 text-xs">IA externa</dt>
            <dd className="text-text text-right font-medium">
              {status.configured ? "Configurada" : "No configurada"}
            </dd>
          </div>
        </dl>

        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-text-2 flex items-center gap-1.5 text-xs">
              <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
              Tokens del mes
            </p>
            <p className="text-text numeric text-xs font-medium">
              {formatNumber(status.tokens_used, 0)} / {formatNumber(status.monthly_token_limit, 0)}
            </p>
          </div>
          <div
            role="progressbar"
            aria-label="Tokens de IA usados este mes"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent ?? 0}
            aria-valuetext={
              percent === null
                ? "Sin límite configurado"
                : `${percent}% usado, quedan ${formatNumber(remaining, 0)} tokens`
            }
            className="bg-surface-2 mt-2 h-2 w-full overflow-hidden rounded-full"
          >
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-200",
                percent !== null && percent >= 90
                  ? "bg-danger"
                  : percent !== null && percent >= 70
                    ? "bg-warning"
                    : "bg-primary",
              )}
              style={{ width: `${percent ?? 0}%` }}
            />
          </div>
          <p className="text-text-2 mt-1.5 text-xs">
            {percent === null
              ? "Sin límite mensual configurado."
              : `Quedan ${formatNumber(remaining, 0)} tokens disponibles este mes.`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
