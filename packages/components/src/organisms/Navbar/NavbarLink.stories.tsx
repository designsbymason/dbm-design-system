import type { Meta, StoryObj } from "@storybook/react-vite";
import { Navbar } from "./Navbar";

// Docs-only — see NavbarRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Navbar.Link> = {
  title: "Organisms/Navigation/Navbar/Link",
  component: Navbar.Link,
  tags: ["!dev"],
  argTypes: {
    children: { control: "text", description: "The link's text, and an icon if it has one." },
    href: { control: "text", description: "Where the link goes. With asChild, put it on the child instead." },
    current: {
      control: "boolean",
      description: "Marks the link as the page the reader is on: aria-current=\"page\" and a tinted look. The caller decides which one it is.",
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description: "Makes the link inert: aria-disabled plus a blocked click. It stays in the tab order, as Link does.",
      table: { defaultValue: { summary: "false" } },
    },
    asChild: {
      control: "boolean",
      description: "Renders as a single provided child element (Radix Slot) instead of the built-in <a>, to use a router's link.",
      table: { defaultValue: { summary: "false" } },
    },
    "aria-label": { control: "text", description: "Names the link when its content is only an icon." },
    id: { control: "text", description: "Standard DOM id. Avoid it inside Navbar.Links, whose items can be on the page twice." },
    className: { control: false, description: "Additional CSS classes, on the link element." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: { children: "Products", href: "#products", current: false, disabled: false },
};

export default meta;

type Story = StoryObj<typeof Navbar.Link>;

export const Default: Story = {
  render: (args) => (
    <Navbar collapseBelow="never">
      <Navbar.Links>
        <Navbar.Link {...args} />
      </Navbar.Links>
    </Navbar>
  ),
};
