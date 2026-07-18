import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack } from "./Stack";

const meta: Meta<typeof Stack> = {
  title: "Atoms/Layout/Stack",
  component: Stack,
  parameters: { layout: "padded" },
  argTypes: {
    direction: { control: "radio", options: ["row", "column"] },
    align: { control: "select", options: ["start", "center", "end", "stretch", "baseline"] },
    justify: {
      control: "select",
      options: ["start", "center", "end", "between", "around", "evenly"],
    },
    gap: { control: "select", options: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32] },
  },
};

export default meta;

type Story = StoryObj<typeof Stack>;

const swatchStyle = {
  background: "var(--dbm-bg-brand)",
  borderRadius: "var(--dbm-radius-sm)",
  color: "var(--dbm-text-on-brand)",
  padding: "var(--dbm-space-3)",
};

const Swatches = () => (
  <>
    <div style={swatchStyle}>One</div>
    <div style={swatchStyle}>Two</div>
    <div style={swatchStyle}>Three</div>
  </>
);

export const ColumnDefault: Story = {
  name: "Column (default)",
  args: { gap: 4 },
  render: (args) => (
    <Stack {...args}>
      <Swatches />
    </Stack>
  ),
};

export const Row: Story = {
  args: { direction: "row", gap: 4 },
  render: (args) => (
    <Stack {...args}>
      <Swatches />
    </Stack>
  ),
};

export const AllGapSteps: Story = {
  name: "All gap steps",
  render: () => (
    <Stack gap={6}>
      {([0, 1, 2, 4, 8, 16, 32] as const).map((gap) => (
        <Stack key={gap} direction="row" gap={gap} align="center">
          <span style={{ color: "var(--dbm-text-secondary)", width: "4rem" }}>gap={gap}</span>
          <Swatches />
        </Stack>
      ))}
    </Stack>
  ),
};

export const AlignAndJustify: Story = {
  name: "Align + justify",
  render: () => (
    <Stack
      direction="row"
      gap={4}
      align="center"
      justify="between"
      style={{
        background: "var(--dbm-bg-subtle)",
        borderRadius: "var(--dbm-radius-md)",
        height: "6rem",
        padding: "var(--dbm-space-3)",
      }}
    >
      <Swatches />
    </Stack>
  ),
};

export const Wrapping: Story = {
  name: "Wrapping row at narrow widths",
  parameters: { chromatic: { viewports: [375, 768] } },
  render: () => (
    <Stack direction="row" gap={2} wrap style={{ maxWidth: "16rem" }}>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} style={swatchStyle}>
          Item {i + 1}
        </div>
      ))}
    </Stack>
  ),
};
