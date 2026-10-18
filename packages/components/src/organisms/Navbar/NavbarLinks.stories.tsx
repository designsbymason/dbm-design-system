import type { Meta, StoryObj } from "@storybook/react-vite";
import { Navbar } from "./Navbar";
import { preventNavigation } from "./NavbarStoryKit";

// Docs-only — see NavbarRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Navbar.Links> = {
  title: "Organisms/Navigation/Navbar/Links",
  component: Navbar.Links,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description:
        "Navbar.Link items. The same items are drawn in the bar and, below the collapse width, in the menu panel, so give them no id.",
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
      description:
        "Where the links sit between the brand and the actions: next to the brand, centred in the room between them, or against the actions. Follows the reading direction; no effect in the menu panel.",
      table: { defaultValue: { summary: '"start"' } },
    },
    quiet: {
      control: "boolean",
      description:
        "A quieter look for secondary links (a courtesy row): smaller text in the secondary colour. The current link is still marked.",
      table: { defaultValue: { summary: "false" } },
    },
    "aria-label": {
      control: "text",
      description: "Names the navigation landmark. Defaults to labels.navigation (\"Main\").",
    },
    "aria-labelledby": { control: "text", description: "The id of a visible element that names the navigation, in place of aria-label." },
    id: { control: "text", description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes, on the <nav> element." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
};

export default meta;

type Story = StoryObj<typeof Navbar.Links>;

export const Default: Story = {
  render: (args) => (
    <Navbar collapseBelow="never" onClick={preventNavigation}>
      <Navbar.Links {...args}>
        <Navbar.Link href="#a" current>
          Products
        </Navbar.Link>
        <Navbar.Link href="#b">Pricing</Navbar.Link>
      </Navbar.Links>
    </Navbar>
  ),
};
