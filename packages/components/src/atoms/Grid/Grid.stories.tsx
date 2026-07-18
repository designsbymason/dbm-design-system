import type { Meta, StoryObj } from "@storybook/react-vite";
import { GridItem } from "../GridItem";
import { Grid } from "./Grid";

const meta: Meta<typeof Grid> = {
  title: "Atoms/Layout/Grid",
  component: Grid,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof Grid>;

const cellStyle = {
  background: "var(--dbm-bg-brand-subtle)",
  borderRadius: "var(--dbm-radius-sm)",
  color: "var(--dbm-text-primary)",
  padding: "var(--dbm-space-3)",
  textAlign: "center" as const,
};

const Cells = ({ count }: { count: number }) => (
  <>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} style={cellStyle}>
        {i + 1}
      </div>
    ))}
  </>
);

export const FixedColumns: Story = {
  name: "Fixed 4 columns",
  render: () => (
    <Grid columns={4} gap={4}>
      <Cells count={8} />
    </Grid>
  ),
};

export const ResponsiveColumns: Story = {
  name: "Responsive: 1 column mobile, 2 tablet, 3 desktop",
  parameters: {
    chromatic: { viewports: [375, 768, 1280] },
  },
  render: () => (
    <Grid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
      <Cells count={6} />
    </Grid>
  ),
};

export const WithSpanningItems: Story = {
  name: "With GridItem colSpan/rowSpan",
  render: () => (
    <Grid columns={4} gap={4}>
      <GridItem colSpan={2} style={cellStyle}>
        colSpan=2
      </GridItem>
      <GridItem style={cellStyle}>1x1</GridItem>
      <GridItem style={cellStyle}>1x1</GridItem>
      <GridItem colSpan={4} style={cellStyle}>
        colSpan=4 (full width)
      </GridItem>
    </Grid>
  ),
};
