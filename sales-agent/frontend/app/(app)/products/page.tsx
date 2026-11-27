"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { buttonStyles } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingBlock } from "@/components/ui/spinner";
import { ProductTable } from "@/components/products/product-table";
import { useProducts, useSetProductActive } from "@/hooks/use-products";
import { getErrorMessage } from "@/lib/errors";

export default function ProductsPage() {
  const productsQuery = useProducts();
  const toggleActive = useSetProductActive();

  return (
    <>
      <PageHeader
        title="Productos"
        description="Cada producto define su propuesta de valor, sectores, scoring y mensajes. DOVEXO viene precargado desde el seed del backend."
        actions={
          <Link
            href="/products/new"
            className={buttonStyles({ variant: "primary", size: "md" })}
          >
            Nuevo producto
          </Link>
        }
      />

      {productsQuery.isPending ? (
        <LoadingBlock label="Cargando productos…" />
      ) : productsQuery.isError ? (
        <Alert variant="danger" title="No se pudieron cargar los productos">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{getErrorMessage(productsQuery.error)}</span>
            <button
              type="button"
              onClick={() => void productsQuery.refetch()}
              className="text-xs font-semibold underline"
            >
              Reintentar
            </button>
          </div>
        </Alert>
      ) : productsQuery.data.length === 0 ? (
        <EmptyState
          title="No hay productos configurados"
          description="Si el seed del backend no se ejecutó, no aparece DOVEXO. Podés crear un producto manualmente o revisar las migraciones y el seed."
          action={
            <Link
              href="/products/new"
              className={buttonStyles({ variant: "primary", size: "sm" })}
            >
              Crear producto
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {toggleActive.isError ? (
            <Alert variant="danger">{getErrorMessage(toggleActive.error)}</Alert>
          ) : null}
          <ProductTable
            products={productsQuery.data}
            togglingId={
              toggleActive.isPending ? toggleActive.variables?.id : null
            }
            onToggleActive={(product) =>
              toggleActive.mutate({
                id: product.id,
                isActive: !product.is_active,
              })
            }
          />
        </div>
      )}
    </>
  );
}
