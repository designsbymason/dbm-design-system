import type { Meta, StoryObj } from "@storybook/react-vite";
import { VisuallyHidden } from "./VisuallyHidden";

const meta: Meta<typeof VisuallyHidden> = {
  title: "Atoms/Utility/VisuallyHidden",
  component: VisuallyHidden,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof VisuallyHidden>;

export const IconOnlyButtonLabel: Story = {
  name: "Icon-only button label",
  render: () => (
    <button
      type="button"
      style={{
        background: "var(--dbm-bg-brand)",
        border: "none",
        borderRadius: "var(--dbm-radius-md)",
        color: "var(--dbm-text-on-brand)",
        padding: "var(--dbm-space-3)",
      }}
    >
      ×<VisuallyHidden>Close dialog</VisuallyHidden>
    </button>
  ),
};

export const InlineWithinText: Story = {
  name: "Inline within visible text",
  render: () => (
    <p style={{ color: "var(--dbm-text-primary)" }}>
      This paragraph has{" "}
      <VisuallyHidden>text that only a screen reader announces, </VisuallyHidden>
      extra content hidden in the middle of otherwise normal text.
    </p>
  ),
};

export const SkipLink: Story = {
  name: "focusable (skip link pattern)",
  render: () => (
    <div>
      <p style={{ color: "var(--dbm-text-primary)", marginTop: 0 }}>
        Click into this preview and press Tab — the skip link below is invisible until it
        receives keyboard focus, then reveals itself in place.
      </p>
      <VisuallyHidden asChild focusable>
        <a
          href="#storybook-root"
          style={{
            background: "var(--dbm-bg-surface)",
            border: "1px solid var(--dbm-border-focus)",
            borderRadius: "var(--dbm-radius-sm)",
            color: "var(--dbm-text-link)",
            display: "inline-block",
            padding: "var(--dbm-space-2) var(--dbm-space-3)",
          }}
        >
          Skip to main content
        </a>
      </VisuallyHidden>
    </div>
  ),
};
