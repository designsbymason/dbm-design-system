import type { Meta, StoryObj } from "@storybook/react-vite";
import { FieldHelperText } from "./FieldHelperText";

const meta: Meta<typeof FieldHelperText> = {
  title: "Atoms/Inputs/FieldHelperText",
  component: FieldHelperText,
  parameters: { layout: "padded" },
  args: {
    children: "At least 8 characters, including a number",
  },
};

export default meta;

type Story = StoryObj<typeof FieldHelperText>;

export const Default: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};
