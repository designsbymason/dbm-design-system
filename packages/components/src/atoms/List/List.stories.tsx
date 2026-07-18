import type { Meta, StoryObj } from "@storybook/react-vite";
import { ListItem } from "../ListItem";
import { List } from "./List";

const meta: Meta<typeof List> = {
  title: "Atoms/Typography/List",
  component: List,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof List>;

export const Unordered: Story = {
  render: () => (
    <List>
      <ListItem>First item</ListItem>
      <ListItem>Second item</ListItem>
      <ListItem>Third item</ListItem>
    </List>
  ),
};

export const Ordered: Story = {
  render: () => (
    <List as="ol">
      <ListItem>First step</ListItem>
      <ListItem>Second step</ListItem>
      <ListItem>Third step</ListItem>
    </List>
  ),
};

export const NoMarker: Story = {
  name: 'marker="none"',
  render: () => (
    <List marker="none">
      <ListItem>Item without a marker</ListItem>
      <ListItem>Another item</ListItem>
    </List>
  ),
};

export const CustomSpacing: Story = {
  name: "Custom spacing between items",
  render: () => (
    <List spacing={6}>
      <ListItem>First item</ListItem>
      <ListItem>Second item</ListItem>
      <ListItem>Third item</ListItem>
    </List>
  ),
};

export const NarrowViewport: Story = {
  name: "Narrow viewport (long items wrap)",
  parameters: { chromatic: { viewports: [375] } },
  render: () => (
    <List>
      <ListItem>
        A longer list item that should wrap gracefully at narrow viewport widths without
        overflowing its container.
      </ListItem>
      <ListItem>Short item</ListItem>
    </List>
  ),
};
