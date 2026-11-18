import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CalendarClock, CircleDollarSign, ClipboardList, Users } from "lucide-react";

import { StatCard } from "./stat-card";

const meta = {
  title: "Design System/StatCard",
  component: StatCard,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: "Clientes", value: "3", hint: "Ver listado", icon: Users },
};

export const Teal: Story = {
  args: { label: "Órdenes abiertas", value: "2", hint: "de 2 en total", tone: "teal", icon: ClipboardList },
};

export const Warning: Story = {
  args: { label: "Presupuestos pendientes", value: "1", hint: "de 1 en total", tone: "amber", icon: CalendarClock },
};

export const Danger: Story = {
  args: { label: "Pendiente de cobro", value: "$ 45.500", hint: "Ver pagos", tone: "danger", icon: CircleDollarSign },
};

export const Grid: Story = {
  render: () => (
    <div className="grid w-[720px] grid-cols-2 gap-4">
      <StatCard label="Clientes" value="3" hint="Ver listado" icon={Users} />
      <StatCard label="Órdenes abiertas" value="2" hint="de 2 en total" tone="teal" icon={ClipboardList} />
      <StatCard label="Presupuestos pendientes" value="1" tone="amber" icon={CalendarClock} />
      <StatCard label="Pendiente de cobro" value="$ 45.500" tone="danger" icon={CircleDollarSign} />
    </div>
  ),
};
