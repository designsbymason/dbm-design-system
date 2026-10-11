import type { Meta, StoryObj } from "@storybook/react-vite";
import { Menu } from "./Menu";

// Docs-only — see MenuRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Menu.CheckboxItem> = {
  title: "Organisms/Navigation/Menu/CheckboxItem",
  component: Menu.CheckboxItem,
  tags: ["!dev"],
  argTypes: {
    checked: {
      control: false,
      description: 'Whether the item is checked (controlled), or "indeterminate" for a mixed state. Omit it, with defaultChecked, to let the item keep its own state.',
    },
    defaultChecked: {
      control: "boolean",
      description: "The initial checked state for uncontrolled usage — ignored once checked is provided.",
      table: { defaultValue: { summary: "false" } },
    },
    onCheckedChange: {
      control: false,
      description: "Called with the new checked state when the item is chosen.",
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
    children: "Show grid",
  },
};

export default meta;

type Story = StoryObj<typeof Menu.CheckboxItem>;

export const Default: Story = {
  render: (args) => (
    <Menu defaultOpen modal={false}>
      <Menu.Trigger>View</Menu.Trigger>
      <Menu.Content>
        <Menu.CheckboxItem {...args} />
      </Menu.Content>
    </Menu>
  ),
};
