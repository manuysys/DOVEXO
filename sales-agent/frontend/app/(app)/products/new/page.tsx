"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ProductForm } from "@/components/products/product-form";
import {
  emptyProductValues,
  formValuesToProductInput,
} from "@/features/products/mapping";
import { useCreateProduct } from "@/hooks/use-products";
import { getErrorMessage } from "@/lib/errors";

export default function NewProductPage() {
  const router = useRouter();
  const createProduct = useCreateProduct();

  return (
    <>
      <PageHeader
        title="Nuevo producto"
        description="Configurá la propuesta comercial. El motor es multiproducto: DOVEXO es solo la primera configuración precargada."
      />
      <ProductForm
        defaultValues={emptyProductValues}
        submitLabel="Crear producto"
        isSubmitting={createProduct.isPending}
        formError={
          createProduct.isError ? getErrorMessage(createProduct.error) : null
        }
        onSubmit={async (values) => {
          await createProduct.mutateAsync(formValuesToProductInput(values));
          router.push("/products");
        }}
      />
    </>
  );
}
