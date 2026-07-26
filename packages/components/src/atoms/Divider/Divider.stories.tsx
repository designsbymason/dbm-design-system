import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack } from "../Stack";
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

export const VerticalWithLabel: Story = {
  name: "Vertical with label",
  render: () => (
    <div style={{ color: "var(--dbm-text-primary)", display: "flex", height: "6rem" }}>
      <span>Left</span>
      <Divider orientation="vertical" label="OR" />
      <span>Right</span>
    </div>
  ),
};

export const Dashed: Story = {
  render: () => (
    <div style={{ color: "var(--dbm-text-primary)" }}>
      <p>Content above</p>
      <Divider variant="dashed" />
      <p>Content below</p>
    </div>
  ),
};

export const ResponsiveOrientation: Story = {
  name: "Responsive orientation (horizontal on mobile, vertical from lg up)",
  parameters: { chromatic: { viewports: [375, 1024] } },
  render: () => (
    <Stack
      direction={{ base: "column", lg: "row" }}
      gap={4}
      style={{ color: "var(--dbm-text-primary)", minHeight: "6rem" }}
    >
      <span>Section A</span>
      <Divider orientation={{ base: "horizontal", lg: "vertical" }} label="OR" />
      <span>Section B</span>
    </Stack>
  ),
};
