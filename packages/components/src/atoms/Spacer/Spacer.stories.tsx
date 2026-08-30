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
  // `parameters.chromatic` removed (2026-08-29) — Chromatic is a paid SaaS
  // tool this project never adopted (02-tech-stack-and-structure.md picked
  // Playwright's own self-hosted visual regression instead); this
  // parameter was always inert here. See Input.stories.tsx's own review
  // finding for the full writeup.
  render: () => (
    <div style={{ alignItems: "center", display: "flex", width: "100%" }}>
      <span style={chipStyle}>Logo</span>
      <Spacer />
      <span style={chipStyle}>Menu</span>
    </div>
  ),
};
