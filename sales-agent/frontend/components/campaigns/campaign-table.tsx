import Link from "next/link";
import type { Campaign } from "@/lib/api/types";
import { CampaignStatusBadge } from "./status-badge";
import { provinceToFormValue } from "@/features/campaigns/mapping";
import { formatDate, joinList } from "@/lib/utils";

export function CampaignTable({ campaigns }: { campaigns: Campaign[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <table className="w-full min-w-[840px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-canvas/60 text-left text-xs font-semibold tracking-wide text-muted uppercase">
            <th className="px-4 py-3">Campaña</th>
            <th className="px-4 py-3">Producto</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Provincias</th>
            <th className="px-4 py-3">Rubros</th>
            <th className="px-4 py-3">Creada</th>
            <th className="px-4 py-3 text-right">Detalle</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {campaigns.map((campaign) => (
            <tr key={campaign.id} className="align-top">
              <td className="px-4 py-3">
                <Link
                  href={`/campaigns/${campaign.id}`}
                  className="font-medium text-ink hover:text-accent"
                >
                  {campaign.name || "Campaña sin nombre"}
                </Link>
                {campaign.description ? (
                  <p className="mt-0.5 line-clamp-1 max-w-72 text-xs text-muted">
                    {campaign.description}
                  </p>
                ) : null}
              </td>
              <td className="px-4 py-3 text-xs text-muted">
                {campaign.product_name ?? "Sin producto"}
              </td>
              <td className="px-4 py-3">
                <CampaignStatusBadge
                  status={campaign.status}
                  rawStatus={campaign.raw_status}
                />
              </td>
              <td className="max-w-56 px-4 py-3 text-xs text-muted">
                {campaign.province_filters.length === 0
                  ? "Todo el país"
                  : joinList(
                      campaign.province_filters.map(provinceToFormValue),
                      2,
                    )}
              </td>
              <td className="max-w-56 px-4 py-3 text-xs text-muted">
                {joinList(campaign.sector_filters, 2)}
              </td>
              <td className="px-4 py-3 text-xs text-muted">
                {formatDate(campaign.created_at)}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/campaigns/${campaign.id}`}
                  className="text-xs font-medium text-accent hover:underline"
                >
                  Ver
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
