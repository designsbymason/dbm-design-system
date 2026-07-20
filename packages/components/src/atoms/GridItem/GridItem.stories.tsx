import type { Meta, StoryObj } from "@storybook/react-vite";
import { Grid } from "../Grid";
import { GridItem } from "./GridItem";

const meta: Meta<typeof GridItem> = {
  title: "Atoms/Layout/GridItem",
  component: GridItem,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof GridItem>;

const cellStyle = {
  background: "var(--dbm-bg-brand-subtle)",
  borderRadius: "var(--dbm-radius-sm)",
  color: "var(--dbm-text-primary)",
  padding: "var(--dbm-space-3)",
  textAlign: "center" as const,
};

export const ColSpan: Story = {
  render: () => (
    <Grid columns={4} gap={4}>
      <GridItem colSpan={3} style={cellStyle}>
        colSpan=3
      </GridItem>
      <GridItem style={cellStyle}>1</GridItem>
    </Grid>
  ),
};

export const ExplicitColumnPlacement: Story = {
  name: "colStart + colSpan (explicit placement)",
  render: () => (
    <Grid columns={4} gap={4}>
      <GridItem colStart={2} colSpan={2} style={cellStyle}>
        starts at column 2, spans 2
      </GridItem>
    </Grid>
  ),
};

export const ExplicitRowPlacement: Story = {
  name: "rowStart + rowSpan (explicit placement)",
  render: () => (
    <Grid columns={3} gap={4} style={{ height: "12rem" }}>
      <GridItem rowStart={2} rowSpan={2} style={cellStyle}>
        starts at row 2, spans 2
      </GridItem>
      <GridItem style={cellStyle}>1x1</GridItem>
      <GridItem style={cellStyle}>1x1</GridItem>
    </Grid>
  ),
};

export const RowAndColSpanCombined: Story = {
  name: "rowSpan + colSpan on the same item",
  render: () => (
    <Grid columns={3} gap={4} style={{ height: "12rem" }}>
      <GridItem rowSpan={2} colSpan={2} style={cellStyle}>
        rowSpan=2, colSpan=2
      </GridItem>
      <GridItem style={cellStyle}>1x1</GridItem>
      <GridItem style={cellStyle}>1x1</GridItem>
      <GridItem style={cellStyle}>1x1</GridItem>
    </Grid>
  ),
};

export const ResponsiveSpan: Story = {
  name: "Responsive colSpan (full-width on mobile, half on desktop)",
  parameters: { chromatic: { viewports: [375, 1024] } },
  render: () => (
    <Grid columns={4} gap={4}>
      <GridItem colSpan={{ base: 4, md: 2 }} style={cellStyle}>
        colSpan: base=4, md=2
      </GridItem>
      <GridItem colSpan={{ base: 4, md: 2 }} style={cellStyle}>
        colSpan: base=4, md=2
      </GridItem>
    </Grid>
  ),
};

export const AsListItem: Story = {
  name: 'Polymorphic: as="li" (real semantic list item, GridItem layout behavior)',
  render: () => (
    <Grid as="ul" columns={4} gap={4} style={{ listStyle: "none", margin: 0, padding: 0 }}>
      <GridItem as="li" colSpan={2} style={cellStyle}>
        colSpan=2
      </GridItem>
      <GridItem as="li" style={cellStyle}>
        1x1
      </GridItem>
      <GridItem as="li" style={cellStyle}>
        1x1
      </GridItem>
    </Grid>
  ),
};
