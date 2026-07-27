import type { Meta, StoryObj } from "@storybook/react-vite";
import { FieldError } from "./FieldError";

const meta: Meta<typeof FieldError> = {
  title: "Atoms/Inputs/FieldError",
  component: FieldError,
  parameters: { layout: "padded" },
  args: {
    children: "Enter a valid email address",
  },
};

export default meta;

type Story = StoryObj<typeof FieldError>;

export const Default: Story = {};

export const WithoutIcon: Story = {
  name: "Without icon",
  args: { icon: false },
};
