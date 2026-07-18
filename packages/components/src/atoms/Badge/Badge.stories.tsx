import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./Badge";

const meta: Meta<typeof Badge> = {
  title: "Atoms/Core/Badge",
  component: Badge,
  parameters: { layout: "padded" },
  argTypes: {
    tone: { control: "select", options: ["neutral", "info", "success", "warning", "danger"] },
  },
  args: {
    children: "Badge",
  },
};

export default meta;

type Story = StoryObj<typeof Badge>;

export const Default: Story = {};

export const AllTones: Story = {
  name: "All tones",
  render: () => (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      {(["neutral", "info", "success", "warning", "danger"] as const).map((tone) => (
        <Badge key={tone} tone={tone}>
          {tone}
        </Badge>
      ))}
    </div>
  ),
};

export const StatusLabels: Story = {
  name: "As status labels",
  render: () => (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <Badge tone="success">Active</Badge>
      <Badge tone="warning">Pending</Badge>
      <Badge tone="danger">Failed</Badge>
      <Badge tone="neutral">Draft</Badge>
    </div>
  ),
};
