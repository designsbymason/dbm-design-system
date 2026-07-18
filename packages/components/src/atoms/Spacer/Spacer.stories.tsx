import type { Meta, StoryObj } from "@storybook/react-vite";
import { Spacer } from "./Spacer";

const meta: Meta<typeof Spacer> = {
  title: "Atoms/Layout/Spacer",
  component: Spacer,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof Spacer>;

const chipStyle = {
  background: "var(--dbm-bg-brand)",
  borderRadius: "var(--dbm-radius-sm)",
  color: "var(--dbm-text-on-brand)",
  padding: "var(--dbm-space-2) var(--dbm-space-3)",
};

export const InARow: Story = {
  name: "Pushes content apart in a row",
  render: () => (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        width: "100%",
      }}
    >
      <span style={chipStyle}>Logo</span>
      <Spacer />
      <span style={chipStyle}>Nav actions</span>
    </div>
  ),
};

export const NarrowViewport: Story = {
  name: "Narrow viewport",
  parameters: { chromatic: { viewports: [375] } },
  render: () => (
    <div style={{ alignItems: "center", display: "flex", width: "100%" }}>
      <span style={chipStyle}>Logo</span>
      <Spacer />
      <span style={chipStyle}>Menu</span>
    </div>
  ),
};
