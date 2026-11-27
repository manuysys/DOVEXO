"use client";

import { useRouter } from "next/navigation";
import { LoadingBlock } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { ProductForm } from "@/components/products/product-form";
import {
  formValuesToProductInput,
  productToFormValues,
} from "@/features/products/mapping";
import { useProduct, useUpdateProduct } from "@/hooks/use-products";
import { getErrorMessage } from "@/lib/errors";

export function EditProductView({ id }: { id: string }) {
  const router = useRouter();
  const productQuery = useProduct(id);
  const updateProduct = useUpdateProduct(id);

  return (
    <>
      <PageHeader
        title="Editar producto"
        description="Los cambios afectan campañas nuevas, scoring y mensajes futuros."
      />

      {productQuery.isPending ? (
        <LoadingBlock label="Cargando producto…" />
      ) : productQuery.isError ? (
        <Alert variant="danger" title="No se pudo cargar el producto">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{getErrorMessage(productQuery.error)}</span>
            <button
              type="button"
              onClick={() => void productQuery.refetch()}
              className="text-xs font-semibold underline"
            >
              Reintentar
            </button>
          </div>
        </Alert>
      ) : (
        <ProductForm
          defaultValues={productToFormValues(productQuery.data)}
          submitLabel="Guardar cambios"
          isSubmitting={updateProduct.isPending}
          formError={
            updateProduct.isError ? getErrorMessage(updateProduct.error) : null
          }
          onSubmit={async (values) => {
            await updateProduct.mutateAsync(formValuesToProductInput(values));
            router.push("/products");
          }}
        />
      )}
    </>
  );
}
