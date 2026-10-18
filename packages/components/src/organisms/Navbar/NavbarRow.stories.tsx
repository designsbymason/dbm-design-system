import type { Meta, StoryObj } from "@storybook/react-vite";
import { Navbar } from "./Navbar";
import { preventNavigation } from "./NavbarStoryKit";

// Docs-only — see NavbarRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Navbar.Row> = {
  title: "Organisms/Navigation/Navbar/Row",
  component: Navbar.Row,
  tags: ["!dev"],
  argTypes: {
    children: { control: false, description: "The row's parts: Navbar.Brand, Navbar.Links, Navbar.Search, Navbar.Actions, Navbar.MenuButton." },
    variant: {
      control: "select",
      options: ["outlined", "filled", "ghost"],
      description: "How this row is drawn, in place of the bar's variant.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg"],
      description: "This row's height step, in place of the bar's size. xs suits a courtesy strip.",
    },
    contained: {
      control: "boolean",
      description: "Keeps this row's content to the page's reading width, in place of the bar's contained.",
    },
    sticky: {
      control: "boolean",
      description:
        "Whether the row sticks with the bar (when the bar is sticky). Set false for a courtesy strip that should scroll away while the rest stays. Only leading rows can scroll away; a false after a sticking row warns in development and sticks anyway.",
      table: { defaultValue: { summary: "true" } },
    },
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

type Story = StoryObj<typeof Navbar.Row>;

export const Default: Story = {
  render: (args) => (
    <Navbar onClick={preventNavigation}>
      <Navbar.Row {...args}>
        <Navbar.Brand href="#">dbM</Navbar.Brand>
      </Navbar.Row>
    </Navbar>
  ),
};
