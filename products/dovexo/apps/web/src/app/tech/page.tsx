import type { Metadata } from "next";

import { TechHome } from "@/components/tech/tech-home";
import { TechShell } from "@/components/tech/tech-shell";

export const metadata: Metadata = {
  title: "Mis trabajos",
  description:
    "Trabajos asignados, agenda del día y estado de sincronización para técnicos en la calle.",
};

export default function TechOrdersPage() {
  return (
    <TechShell>
      <TechHome />
    </TechShell>
  );
}
