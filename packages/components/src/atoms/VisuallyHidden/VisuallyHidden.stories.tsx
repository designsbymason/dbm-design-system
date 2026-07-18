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
