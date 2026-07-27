import type { Meta, StoryObj } from "@storybook/react-vite";
import { CloseButton } from "./CloseButton";

const meta: Meta<typeof CloseButton> = {
  title: "Atoms/Inputs/CloseButton",
  component: CloseButton,
  parameters: { layout: "padded" },
  argTypes: {
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
  },
};

export default meta;

type Story = StoryObj<typeof CloseButton>;

export const Default: Story = {};

export const AllSizes: Story = {
  name: "All sizes",
  render: () => (
    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <CloseButton key={size} size={size} aria-label={`Close (${size})`} />
      ))}
    </div>
  ),
};

export const InheritsSurroundingColor: Story = {
  name: "Inherits surrounding text color",
  render: () => (
    <div style={{ display: "flex", gap: "1.5rem" }}>
      <div style={{ color: "var(--dbm-text-on-danger)", background: "var(--dbm-bg-danger)", padding: "0.5rem", borderRadius: "var(--dbm-radius-md)" }}>
        <CloseButton />
      </div>
      <div style={{ color: "var(--dbm-text-link)" }}>
        <CloseButton />
      </div>
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
};
