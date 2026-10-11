import type { Meta, StoryObj } from "@storybook/react-vite";
import { Menu } from "./Menu";

// Docs-only (guidelines/adr/0013). This resolves the *root* component's own argTypes for the main Properties table:
// the Playground's meta also carries `Menu.Content`'s props (one render drives both), so a table built from it would
// list `size`, `side`… as root props and omit `open`.
const meta: Meta<typeof Menu> = {
  title: "Organisms/Navigation/Menu/Root",
  component: Menu,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "Menu.Trigger and Menu.Content.",
    },
    open: {
      control: "boolean",
      description: "The controlled open state. Omit (along with defaultOpen) to let the menu manage its own open state.",
    },
    defaultOpen: {
      control: "boolean",
      description: "The initial open state for uncontrolled usage — ignored once open is provided.",
      table: { defaultValue: { summary: "false" } },
    },
    onOpenChange: {
      control: false,
      description: "Called with the new open state whenever it changes: a trigger press, Escape, a press outside, or an item chosen.",
    },
    modal: {
      control: "boolean",
      description:
        "Makes the rest of the page inert and locks its scroll while the menu is open, and has a press outside only close it, as a native menu does. Set false for a menu that leaves the page usable behind it.",
      table: { defaultValue: { summary: "true" } },
    },
    dir: {
      control: "inline-radio",
      options: ["ltr", "rtl"],
      description:
        "The reading direction, passed to the menu and its submenus: it decides which side a submenu opens on and which arrow key opens and closes it. Defaulted, not read from the page.",
      table: { defaultValue: { summary: '"ltr"' } },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Menu>;

export const Default: Story = {
  render: (args) => (
    <Menu {...args}>
      <Menu.Trigger>Actions</Menu.Trigger>
      <Menu.Content>
        <Menu.Item>Edit</Menu.Item>
      </Menu.Content>
    </Menu>
  ),
};
