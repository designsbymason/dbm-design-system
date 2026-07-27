import type { Meta, StoryObj } from "@storybook/react-vite";
import { FieldLabel } from "./FieldLabel";

const meta: Meta<typeof FieldLabel> = {
  title: "Atoms/Inputs/FieldLabel",
  component: FieldLabel,
  parameters: { layout: "padded" },
  argTypes: {
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
  },
  args: {
    htmlFor: "email",
    children: "Email address",
  },
};

export default meta;

type Story = StoryObj<typeof FieldLabel>;

export const Default: Story = {};

export const Required: Story = {
  args: { required: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const AllSizes: Story = {
  name: "All sizes",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <FieldLabel key={size} htmlFor={`field-${size}`} size={size}>
          Size {size}
        </FieldLabel>
      ))}
    </div>
  ),
};
