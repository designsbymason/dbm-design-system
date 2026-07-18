import type { Meta, StoryObj } from "@storybook/react-vite";
import { Divider } from "./Divider";

const meta: Meta<typeof Divider> = {
  title: "Atoms/Layout/Divider",
  component: Divider,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof Divider>;

export const Horizontal: Story = {
  render: () => (
    <div style={{ color: "var(--dbm-text-primary)" }}>
      <p>Content above</p>
      <Divider />
      <p>Content below</p>
    </div>
  ),
};

export const HorizontalWithLabel: Story = {
  name: "Horizontal with label",
  render: () => (
    <div style={{ color: "var(--dbm-text-primary)" }}>
      <p>Sign in with email</p>
      <Divider label="OR" />
      <p>Sign in with SSO</p>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div style={{ color: "var(--dbm-text-primary)", display: "flex", height: "4rem" }}>
      <span>Left</span>
      <Divider orientation="vertical" />
      <span>Right</span>
    </div>
  ),
};

export const NarrowViewport: Story = {
  name: "Narrow viewport",
  parameters: { chromatic: { viewports: [375] } },
  render: () => (
    <div style={{ color: "var(--dbm-text-primary)", maxWidth: "300px" }}>
      <p>Content above</p>
      <Divider label="OR" />
      <p>Content below</p>
    </div>
  ),
};
