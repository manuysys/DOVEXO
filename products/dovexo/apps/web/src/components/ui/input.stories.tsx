import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Input } from "./input";

const meta = {
  title: "Design System/Input",
  component: Input,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <label className="flex w-[320px] flex-col gap-2">
      <span className="text-label text-text-2">Email</span>
      <Input type="email" placeholder="nombre@empresa.com" />
    </label>
  ),
};

export const WithValue: Story = {
  render: () => (
    <label className="flex w-[320px] flex-col gap-2">
      <span className="text-label text-text-2">Email</span>
      <Input type="email" defaultValue="demo@saasgestion.com" />
    </label>
  ),
};

export const Disabled: Story = {
  render: () => (
    <label className="flex w-[320px] flex-col gap-2">
      <span className="text-label text-text-2">Email</span>
      <Input type="email" defaultValue="demo@saasgestion.com" disabled />
    </label>
  ),
};

export const ErrorState: Story = {
  render: () => (
    <label className="flex w-[320px] flex-col gap-2">
      <span className="text-label text-text-2">Email</span>
      <Input type="email" defaultValue="no-es-un-email" aria-invalid />
      <span className="text-caption text-danger">Ingresá un email válido.</span>
    </label>
  ),
};
