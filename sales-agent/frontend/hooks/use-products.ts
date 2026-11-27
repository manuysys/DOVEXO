"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProduct,
  getProduct,
  listProducts,
  setProductActive,
  updateProduct,
} from "@/lib/api/products";
import type { ProductInput } from "@/lib/api/types";

export const productKeys = {
  all: ["products"] as const,
  detail: (id: string) => ["products", id] as const,
};

export function useProducts() {
  return useQuery({ queryKey: productKeys.all, queryFn: listProducts });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => getProduct(id),
    enabled: Boolean(id),
  });
}

function useInvalidateProducts() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: productKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
    ]);
}

export function useCreateProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (input: ProductInput) => createProduct(input),
    onSuccess: invalidate,
  });
}

export function useUpdateProduct(id: string) {
  const invalidate = useInvalidateProducts();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<ProductInput>) => updateProduct(id, input),
    onSuccess: (product) => {
      queryClient.setQueryData(productKeys.detail(id), product);
      return invalidate();
    },
  });
}

export function useSetProductActive() {
  const invalidate = useInvalidateProducts();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      isActive,
    }: {
      id: string;
      isActive: boolean;
    }) => setProductActive(id, isActive),
    onSuccess: (product) => {
      queryClient.setQueryData(productKeys.detail(product.id), product);
      return invalidate();
    },
  });
}
