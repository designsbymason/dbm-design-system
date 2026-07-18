import type { Meta, StoryObj } from "@storybook/react-vite";
import { FocusTrap } from "./FocusTrap";

const meta: Meta<typeof FocusTrap> = {
  title: "Atoms/Utility/FocusTrap",
  component: FocusTrap,
  parameters: { layout: "padded" },
  args: {
    trapped: true,
    loop: true,
  },
};

export default meta;

type Story = StoryObj<typeof FocusTrap>;

const fieldStyle = {
  border: "1px solid var(--dbm-border-default)",
  borderRadius: "var(--dbm-radius-sm)",
  display: "block",
  marginBottom: "var(--dbm-space-3)",
  padding: "var(--dbm-space-2)",
  width: "100%",
};

export const Default: Story = {
  render: (args) => (
    <FocusTrap {...args}>
      <div
        style={{
          background: "var(--dbm-bg-surface)",
          border: "1px solid var(--dbm-border-default)",
          borderRadius: "var(--dbm-radius-md)",
          color: "var(--dbm-text-primary)",
          maxWidth: "20rem",
          padding: "var(--dbm-space-4)",
        }}
      >
        <p style={{ marginTop: 0 }}>
          Tab through these fields — with <code>loop</code>, focus cycles back to the first field
          after the last, and never escapes to elements outside this box.
        </p>
        <input style={fieldStyle} placeholder="First field" />
        <input style={fieldStyle} placeholder="Second field" />
        <button type="button" style={fieldStyle}>
          Third field (button)
        </button>
      </div>
    </FocusTrap>
  ),
};
