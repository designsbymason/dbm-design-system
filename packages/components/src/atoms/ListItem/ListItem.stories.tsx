import type { Meta, StoryObj } from "@storybook/react-vite";
import { List } from "../List";
import { ListItem } from "./ListItem";

const meta: Meta<typeof ListItem> = {
  title: "Atoms/Typography/ListItem",
  component: ListItem,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof ListItem>;

export const Default: Story = {
  render: () => (
    <List>
      <ListItem>A single list item, rendered within a List</ListItem>
    </List>
  ),
};
