import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack } from "../Stack";
import { Skeleton } from "./Skeleton";

const meta: Meta<typeof Skeleton> = {
  title: "Atoms/Core/Skeleton",
  component: Skeleton,
  parameters: { layout: "padded" },
  argTypes: {
    variant: { control: "select", options: ["text", "circular", "rectangular"] },
  },
};

export default meta;

type Story = StoryObj<typeof Skeleton>;

export const Text: Story = {
  args: { variant: "text", width: "12rem" },
};

export const Circular: Story = {
  args: { variant: "circular", width: 48, height: 48 },
};

export const Rectangular: Story = {
  args: { variant: "rectangular", width: "16rem", height: "8rem" },
};

export const CardPlaceholder: Story = {
  name: "Composed: card loading placeholder",
  render: () => (
    <Stack direction="row" gap={3} style={{ maxWidth: "20rem" }}>
      <Skeleton variant="circular" width={40} height={40} />
      <Stack gap={2} style={{ flex: 1 }}>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="90%" />
      </Stack>
    </Stack>
  ),
};
