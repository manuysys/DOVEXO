import type { Metadata } from "next";

import { TechOrderDetail } from "@/components/tech/tech-order-detail";
import { TechShell } from "@/components/tech/tech-shell";

export const metadata: Metadata = {
  title: "Trabajo asignado",
  description: "Detalle del trabajo: cliente, dirección, materiales, fotos y estado.",
};

export default function TechOrderDetailPage() {
  return (
    <TechShell>
      <TechOrderDetail />
    </TechShell>
  );
}
