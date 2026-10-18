import type { Meta, StoryObj } from "@storybook/react-vite";
import { Navbar } from "./Navbar";
import { preventNavigation } from "./NavbarStoryKit";

// Docs-only — see NavbarRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Navbar.MenuButton> = {
  title: "Organisms/Navigation/Navbar/MenuButton",
  component: Navbar.MenuButton,
  tags: ["!dev"],
  argTypes: {
    icon: { control: false, description: "The icon, a component reference. Defaults to a three-line menu icon." },
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary", "ghost", "destructive"],
      description: "The button's look, in place of the quiet one it has by default: any IconButton variant, so it can match the icon buttons beside it.",
      table: { defaultValue: { summary: '"ghost"' } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The button's size, in place of its row's: the same scale as IconButton.",
    },
    "aria-label": { control: "text", description: "The button's accessible name. Defaults to labels.menu (\"Menu\")." },
    id: { control: "text", description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
};

export default meta;

type Story = StoryObj<typeof Navbar.MenuButton>;

export const Default: Story = {
  render: (args) => (
    <Navbar onClick={preventNavigation}>
      <Navbar.Links>
        <Navbar.Link href="#a">Products</Navbar.Link>
      </Navbar.Links>
      <Navbar.MenuButton {...args} />
    </Navbar>
  ),
};
