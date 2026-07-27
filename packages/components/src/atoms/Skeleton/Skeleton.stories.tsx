import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack } from "../Stack";
import { Skeleton } from "./Skeleton";

const meta: Meta<typeof Skeleton> = {
  title: "Atoms/Data Display/Skeleton",
  component: Skeleton,
  parameters: { layout: "padded" },
  argTypes: {
    variant: {
      control: "select",
      options: ["text", "circular", "rectangular"],
    },
    animation: { control: "select", options: ["pulse", "wave", "none"] },
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

export const DefaultSizes: Story = {
  name: "Default sizes (no width/height passed)",
  render: () => (
    // Column-direction flex so the rectangular skeleton stretches to fill
    // the container width by default (cross-axis stretch) — demonstrates
    // the same "full width, token-driven height" default it gets in a
    // normal block-level layout, without a flex *row*'s shrink-to-fit
    // sizing hiding it.
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        maxWidth: "16rem",
      }}
    >
      <Skeleton variant="circular" />
      <Skeleton variant="rectangular" />
    </div>
  ),
};

export const WaveAnimation: Story = {
  name: "Wave animation",
  args: {
    variant: "rectangular",
    width: "16rem",
    height: "8rem",
    animation: "wave",
  },
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
