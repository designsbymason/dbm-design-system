import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./Badge";

const meta: Meta<typeof Badge> = {
  title: "Atoms/Data Display/Badge",
  component: Badge,
  parameters: { layout: "padded" },
  argTypes: {
    tone: {
      control: "select",
      options: ["neutral", "info", "success", "warning", "danger"],
    },
    variant: { control: "select", options: ["subtle", "solid"] },
  },
  args: {
    children: "Badge",
  },
};

export default meta;

type Story = StoryObj<typeof Badge>;

export const Default: Story = {};

export const AllTonesSubtle: Story = {
  name: "All tones (subtle)",
  render: () => (
    <div style={{ display: "flex", gap: "var(--dbm-space-2)" }}>
      {(["neutral", "info", "success", "warning", "danger"] as const).map(
        (tone) => (
          <Badge key={tone} tone={tone}>
            {tone}
          </Badge>
        ),
      )}
    </div>
  ),
};

export const AllTonesSolid: Story = {
  name: "All tones (solid)",
  render: () => (
    <div style={{ display: "flex", gap: "var(--dbm-space-2)" }}>
      {(["neutral", "info", "success", "warning", "danger"] as const).map(
        (tone) => (
          <Badge key={tone} tone={tone} variant="solid">
            {tone}
          </Badge>
        ),
      )}
    </div>
  ),
};

export const StatusLabels: Story = {
  name: "As status labels",
  render: () => (
    <div style={{ display: "flex", gap: "var(--dbm-space-2)" }}>
      <Badge tone="success">Active</Badge>
      <Badge tone="warning">Pending</Badge>
      <Badge tone="danger">Failed</Badge>
      <Badge tone="neutral">Draft</Badge>
    </div>
  ),
};

export const CountWithMax: Story = {
  name: "Count with max overflow (99+)",
  render: () => (
    <div style={{ display: "flex", gap: "var(--dbm-space-2)" }}>
      <Badge tone="danger" max={99}>
        {42}
      </Badge>
      <Badge tone="danger" max={99}>
        {100}
      </Badge>
    </div>
  ),
};

export const Dot: Story = {
  name: "Dot indicator",
  render: () => (
    <div style={{ alignItems: "center", display: "flex", gap: "var(--dbm-space-4)" }}>
      <Badge dot tone="danger" aria-label="Unread notifications" />
      <Badge dot tone="success" aria-label="Online" />
      <Badge dot tone="neutral" aria-label="Offline" />
    </div>
  ),
};

export const SolidStatusLabels: Story = {
  name: "As high-emphasis status labels (solid)",
  render: () => (
    <div style={{ display: "flex", gap: "var(--dbm-space-2)" }}>
      <Badge tone="success" variant="solid">
        Active
      </Badge>
      <Badge tone="warning" variant="solid">
        Pending
      </Badge>
      <Badge tone="danger" variant="solid">
        Failed
      </Badge>
    </div>
  ),
};
