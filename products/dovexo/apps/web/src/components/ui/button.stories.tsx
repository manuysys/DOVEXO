import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { Button } from "./button";

const meta = {
  title: "Design System/Button",
  component: Button,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { children: "Crear empresa", variant: "primary" },
};

export const Secondary: Story = {
  args: { children: "Ver agenda", variant: "secondary" },
};

export const Outline: Story = {
  args: { children: "Cancelar", variant: "outline" },
};

export const Ghost: Story = {
  args: { children: "Más opciones", variant: "ghost" },
};

export const Danger: Story = {
  args: { children: "Eliminar", variant: "danger" },
};

export const Link: Story = {
  args: { children: "Ver detalle", variant: "link" },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const Disabled: Story = {
  args: { children: "Guardando…", disabled: true },
};
