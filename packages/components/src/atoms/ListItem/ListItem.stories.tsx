import { CheckIcon, GearIcon, HouseIcon } from "@dbm-design-system/icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
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

export const CustomIconMarker: Story = {
  name: "Custom icon marker",
  render: () => (
    <List marker="none">
      <ListItem icon={CheckIcon}>Design tokens defined</ListItem>
      <ListItem icon={CheckIcon}>Core atoms shipped</ListItem>
      <ListItem icon={CheckIcon}>Molecules in progress</ListItem>
    </List>
  ),
};

export const Interactive: Story = {
  name: "Interactive (nav-menu-style list)",
  render: function InteractiveStory() {
    const [selected, setSelected] = useState("home");
    return (
      <List marker="none" as="ul">
        <ListItem
          interactive
          selected={selected === "home"}
          icon={HouseIcon}
          onClick={() => setSelected("home")}
        >
          Home
        </ListItem>
        <ListItem
          interactive
          selected={selected === "settings"}
          icon={GearIcon}
          onClick={() => setSelected("settings")}
        >
          Settings
        </ListItem>
      </List>
    );
  },
};
