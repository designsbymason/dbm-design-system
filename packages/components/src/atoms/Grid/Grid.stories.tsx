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

export const DefaultColumns: Story = {
  name: "Default (12 columns, no columns prop)",
  render: () => (
    <Grid gap={2}>
      <Cells count={12} />
    </Grid>
  ),
};

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

export const ResponsiveGap: Story = {
  name: "Responsive gap (tight on mobile, roomy from lg up)",
  parameters: { chromatic: { viewports: [375, 1024] } },
  render: () => (
    <Grid columns={3} gap={{ base: 1, lg: 8 }}>
      <Cells count={6} />
    </Grid>
  ),
};

export const FluidMinChildWidth: Story = {
  name: "Fluid: minChildWidth (no explicit breakpoints)",
  render: () => (
    <Grid minChildWidth="8rem" gap={4}>
      <Cells count={9} />
    </Grid>
  ),
};

export const DensePacking: Story = {
  name: 'autoFlow="row dense" (backfills gaps from mixed spans)',
  render: () => (
    <Grid columns={4} gap={4} autoFlow="row dense">
      <GridItem colSpan={2} style={cellStyle}>
        colSpan=2
      </GridItem>
      <GridItem style={cellStyle}>1x1</GridItem>
      <GridItem colSpan={2} style={cellStyle}>
        colSpan=2
      </GridItem>
      <GridItem style={cellStyle}>1x1</GridItem>
      <GridItem style={cellStyle}>1x1</GridItem>
    </Grid>
  ),
};

export const AsUnorderedList: Story = {
  name: 'Polymorphic: as="ul" (real semantic list, Grid layout behavior)',
  render: () => (
    <Grid
      as="ul"
      columns={3}
      gap={3}
      style={{ listStyle: "none", margin: 0, padding: 0 }}
    >
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i} style={cellStyle}>
          {i + 1}
        </li>
      ))}
    </Grid>
  ),
};
