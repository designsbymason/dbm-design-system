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

export const ExplicitPlacement: Story = {
  name: "colStart + colSpan (explicit placement)",
  render: () => (
    <Grid columns={4} gap={4}>
      <GridItem colStart={2} colSpan={2} style={cellStyle}>
        starts at column 2, spans 2
      </GridItem>
    </Grid>
  ),
};

export const RowAndColSpan: Story = {
  name: "rowSpan + colSpan",
  render: () => (
    <Grid columns={3} gap={4} style={{ height: "12rem" }}>
      <GridItem rowSpan={2} style={cellStyle}>
        rowSpan=2
      </GridItem>
      <GridItem style={cellStyle}>1x1</GridItem>
      <GridItem style={cellStyle}>1x1</GridItem>
      <GridItem style={cellStyle}>1x1</GridItem>
      <GridItem style={cellStyle}>1x1</GridItem>
    </Grid>
  ),
};
