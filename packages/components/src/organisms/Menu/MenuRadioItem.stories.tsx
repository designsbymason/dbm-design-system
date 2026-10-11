import type { Meta, StoryObj } from "@storybook/react-vite";
import { CopyIcon, PencilSimpleIcon, TrashIcon } from "@dbm-design-system/icons";
import { Menu } from "./Menu";

// Docs-only — see MenuRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
// `icon` takes a component reference, not a string name (05 §5), which the Controls panel can't drive, so a small
// curated set of real icons is mapped onto string keys, as `Button`'s icon slots do. "None" is a Playground-only
// choice that leaves the prop out.
const iconControl = {
  control: "select" as const,
  options: ["None", "Copy", "Pencil", "Trash"],
  mapping: { None: undefined, Copy: CopyIcon, Pencil: PencilSimpleIcon, Trash: TrashIcon },
  description: "A leading icon, as a component reference (icon={CopyIcon}), drawn in icon.* colours. Decorative: the label carries the meaning.",
};

const meta: Meta<typeof Menu.RadioItem> = {
  title: "Organisms/Navigation/Menu/RadioItem",
  component: Menu.RadioItem,
  tags: ["!dev"],
  argTypes: {
    value: {
      control: "text",
      description: "The value this item stands for. Required: it is what the group's value is compared with.",
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
    value: "name",
    children: "Name",
  },
};

export default meta;

type Story = StoryObj<typeof Menu.RadioItem>;

export const Default: Story = {
  // Playground-only choices: they are not values the prop takes, so they stay off the meta-level argTypes.
  argTypes: { icon: iconControl },
  render: (args) => (
    <Menu defaultOpen modal={false}>
      <Menu.Trigger>Sort</Menu.Trigger>
      <Menu.Content>
        <Menu.RadioGroup defaultValue="name" aria-label="Sort by">
          <Menu.RadioItem {...args} />
        </Menu.RadioGroup>
      </Menu.Content>
    </Menu>
  ),
};
