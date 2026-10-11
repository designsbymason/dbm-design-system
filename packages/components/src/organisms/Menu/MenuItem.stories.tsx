import type { Meta, StoryObj } from "@storybook/react-vite";
import { Menu } from "./Menu";

// Docs-only — see MenuRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Menu.Item> = {
  title: "Organisms/Navigation/Menu/Item",
  component: Menu.Item,
  tags: ["!dev"],
  argTypes: {
    asChild: {
      control: "boolean",
      description:
        "Renders as the single child element (Radix Slot), which receives the item's role, keyboard handling and styles — how a link or a router Link becomes a menu item. In this mode the item draws none of its own content, so icon and shortcut are not rendered; put them inside the child.",
      table: { defaultValue: { summary: "false" } },
    },
    tone: {
      control: "inline-radio",
      options: ["neutral", "danger"],
      description: 'The meaning of the item; "danger" is for one that destroys or discards something.',
      table: { defaultValue: { summary: '"neutral"' } },
    },
    children: {
      control: "text",
      description: "The item's label. Typeahead matches the start of its text.",
    },
    icon: {
      control: false,
      description: "A leading icon, as a component reference (icon={CopyIcon}), drawn in icon.* colours. Decorative: the label carries the meaning.",
    },
    shortcut: {
      control: "text",
      description:
        "A shortcut hint shown at the item's end (\"⌘C\"). It displays the shortcut and does not bind it: wire the key yourself, and pass aria-keyshortcuts on the item if it should be announced.",
    },
    disabled: {
      control: "boolean",
      description: "A disabled item is dimmed, skipped by the arrow keys and typeahead, and can't be chosen.",
      table: { defaultValue: { summary: "false" } },
    },
    onSelect: {
      control: false,
      description:
        "Called when the item is chosen, by a click, Enter or Space. Call event.preventDefault() to keep the menu open after it.",
    },
    textValue: {
      control: "text",
      description: "The text typeahead matches, when it isn't the item's own text.",
    },
    id: {
      control: "text",
      description: "Standard DOM id.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization.",
    },
    style: {
      control: false,
      description: "Inline styles, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: {
    children: "Duplicate",
  },
};

export default meta;

type Story = StoryObj<typeof Menu.Item>;

export const Default: Story = {
  render: (args) => (
    <Menu defaultOpen>
      <Menu.Trigger>Actions</Menu.Trigger>
      <Menu.Content>
        <Menu.Item {...args} />
      </Menu.Content>
    </Menu>
  ),
};
