import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";

const meta = {
  title: "Design System/Card",
  component: Card,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-[360px]">
      <CardHeader>
        <CardTitle>Orden WO-2026-0001</CardTitle>
        <CardDescription>Reparación de aire acondicionado · Carlos Gomez</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-text-2 text-sm">
          Diagnóstico y reparación del equipo. Turno programado para mañana a las 10:00.
        </p>
      </CardContent>
      <CardFooter>
        <span className="text-caption text-text-2">Actualizado hace 2 horas</span>
      </CardFooter>
    </Card>
  ),
};
