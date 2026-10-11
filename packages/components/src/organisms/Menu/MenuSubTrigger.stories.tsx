import type { Meta, StoryObj } from "@storybook/react-vite";
import { Menu } from "./Menu";

// Docs-only — see MenuRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Menu.SubTrigger> = {
  title: "Organisms/Navigation/Menu/SubTrigger",
  component: Menu.SubTrigger,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: "text",
      description: "The item's label. Typeahead matches the start of its text.",
    },
    icon: {
      control: false,
      description: "A leading icon, as a component reference. Decorative.",
    },
    disabled: {
      control: "boolean",
      description: "A disabled submenu trigger is dimmed, skipped by the arrow keys and can't be opened.",
      table: { defaultValue: { summary: "false" } },
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
    children: "Share",
  },
};

export default meta;

type Story = StoryObj<typeof Menu.SubTrigger>;

export const Default: Story = {
  render: (args) => (
    <Menu defaultOpen modal={false}>
      <Menu.Trigger>Actions</Menu.Trigger>
      <Menu.Content>
        <Menu.Sub>
          <Menu.SubTrigger {...args} />
          <Menu.SubContent>
            <Menu.Item>Email</Menu.Item>
          </Menu.SubContent>
        </Menu.Sub>
      </Menu.Content>
    </Menu>
  ),
};
