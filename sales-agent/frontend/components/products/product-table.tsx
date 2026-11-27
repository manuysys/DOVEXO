import Link from "next/link";
import type { Product } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, joinList } from "@/lib/utils";

export function ProductTable({
  products,
  onToggleActive,
  togglingId,
}: {
  products: Product[];
  onToggleActive: (product: Product) => void;
  togglingId?: string | null;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-canvas/60 text-left text-xs font-semibold tracking-wide text-muted uppercase">
            <th className="px-4 py-3">Producto</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Sectores</th>
            <th className="px-4 py-3">Keywords</th>
            <th className="px-4 py-3">Actualizado</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {products.map((product) => (
            <tr key={product.id} className="align-top">
              <td className="px-4 py-3">
                <p className="font-medium text-ink">
                  {product.name || "Producto sin nombre"}
                </p>
                <p className="text-xs text-muted">/{product.slug || "—"}</p>
              </td>
              <td className="px-4 py-3">
                <Badge variant={product.is_active ? "success" : "neutral"}>
                  {product.is_active ? "Activo" : "Inactivo"}
                </Badge>
              </td>
              <td className="max-w-56 px-4 py-3 text-xs text-muted">
                {joinList(product.target_sectors, 3)}
              </td>
              <td className="px-4 py-3 text-xs text-muted tabular-nums">
                {product.keywords.length}
              </td>
              <td className="px-4 py-3 text-xs text-muted">
                {formatDate(product.updated_at ?? product.created_at)}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/products/${product.id}/edit`}
                    className="inline-flex h-8 items-center rounded-md border border-line px-3 text-xs font-medium text-ink hover:bg-canvas"
                  >
                    Editar
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleActive(product)}
                    disabled={togglingId === product.id}
                  >
                    {product.is_active ? "Desactivar" : "Activar"}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
