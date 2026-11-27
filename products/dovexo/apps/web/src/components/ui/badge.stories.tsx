import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Badge } from "./badge";

const meta = {
  title: "Design System/Badge",
  component: Badge,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = { args: { children: "Borrador", variant: "neutral" } };
export const Success: Story = { args: { children: "Aprobado", variant: "success" } };
export const Warning: Story = { args: { children: "Por vencer", variant: "warning" } };
export const Danger: Story = { args: { children: "Vencido", variant: "danger" } };
export const Info: Story = { args: { children: "Enviado", variant: "info" } };
export const Teal: Story = { args: { children: "En ejecución", variant: "teal" } };

export const All: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="neutral">Borrador</Badge>
      <Badge variant="info">Enviado</Badge>
      <Badge variant="success">Aprobado</Badge>
      <Badge variant="warning">Por vencer</Badge>
      <Badge variant="danger">Vencido</Badge>
      <Badge variant="teal">En ejecución</Badge>
    </div>
  ),
};
