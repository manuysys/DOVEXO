import { Mail, MapPin, Phone, UserRound } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Customer } from "@/lib/api";

import { customerAddress } from "./order-meta";

type OrderCustomerCardProps = {
  customerId: string;
  customer: Customer | undefined;
  isLoading?: boolean;
};

export function OrderCustomerCard({ customerId, customer, isLoading = false }: OrderCustomerCardProps) {
  const address = customerAddress(customer);
  const phoneHref = customer?.phone ? `tel:${customer.phone.replace(/\s+/g, "")}` : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cliente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2" aria-busy="true">
            <span className="bg-surface-2 block h-4 w-2/3 animate-pulse rounded" />
            <span className="bg-surface-2 block h-3 w-1/2 animate-pulse rounded" />
            <span className="bg-surface-2 block h-3 w-3/4 animate-pulse rounded" />
          </div>
        ) : !customer ? (
          <p className="text-text-2 text-small">
            No encontramos los datos del cliente en el listado.{" "}
            <Link
              href="/customers"
              className="text-primary focus-visible:ring-primary rounded-sm font-medium underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:outline-none"
            >
              Ver clientes
            </Link>
          </p>
        ) : (
          <>
            <div className="flex items-start gap-2">
              <UserRound className="text-text-2 mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <Link
                  href={`/customers/${customerId}`}
                  className="text-text focus-visible:ring-primary rounded-sm text-small font-semibold underline-offset-2 hover:text-primary hover:underline focus-visible:ring-2 focus-visible:outline-none"
                >
                  {customer.name}
                </Link>
                <p className="text-text-2 text-caption">
                  Cliente desde {new Date(customer.created_at).getFullYear()}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Phone className="text-text-2 mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {customer.phone ? (
                <a
                  href={phoneHref ?? undefined}
                  className="text-text focus-visible:ring-primary numeric rounded-sm text-small underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:outline-none"
                >
                  {customer.phone}
                </a>
              ) : (
                <span className="text-text-2 text-small">Sin teléfono</span>
              )}
            </div>

            <div className="flex items-start gap-2">
              <Mail className="text-text-2 mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {customer.email ? (
                <a
                  href={`mailto:${customer.email}`}
                  className="text-text focus-visible:ring-primary rounded-sm text-small break-all underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:outline-none"
                >
                  {customer.email}
                </a>
              ) : (
                <span className="text-text-2 text-small">Sin email</span>
              )}
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="text-text-2 mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-text-2 text-caption">Dirección</p>
                <p className="text-text text-small">
                  {address ?? "Sin dirección cargada."}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
