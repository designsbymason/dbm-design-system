import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sidebar } from "./Sidebar";
import { preventNavigation } from "./SidebarStoryKit";

// Docs-only (guidelines/adr/0013). This resolves Item's own argTypes for its Properties table on the main Docs page.
const meta: Meta<typeof Sidebar.Item> = {
  title: "Organisms/Navigation/Sidebar/Item",
  component: Sidebar.Item,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: "text",
      description:
        "The item's text. In the rail it is hidden and shown in a tooltip, and it stays the item's accessible name. With asChild, the child's own content instead (and then icon, badge and external are not drawn).",
    },
    href: { control: "text", description: "Where the item goes. Without one, the item is a button (an action). With asChild, put it on the child instead." },
    icon: {
      control: false,
      description:
        "An icon before the text, a component reference. It is all the rail shows, so give every item one; without it the rail shows the text's first character. It follows the text's colour, so it tracks hover and the current look.",
    },
    badge: {
      control: "text",
      description:
        "What to show after the text, such as a count: plain text drawn in Badge's solid brand look (subtle on a current item drawn as a brand fill), or a Badge you pass, drawn as written. It is part of the item's name. In the rail it becomes a small mark on the icon.",
    },
    external: {
      control: "boolean",
      description:
        "Marks the item as leading off the site: a new tab with rel noopener noreferrer, a trailing icon and a hidden cue. Worked out from href when left out (http(s):// or //).",
      table: { defaultValue: { summary: "from href" } },
    },
    current: {
      control: "boolean",
      description: "Marks the item as the page the reader is on: aria-current=\"page\" and the sidebar's currentVariant look. The caller decides which one it is.",
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description: "Makes the item inert: aria-disabled plus a blocked click. It stays in the tab order, as Link does.",
      table: { defaultValue: { summary: "false" } },
    },
    asChild: {
      control: "boolean",
      description: "Renders as a single provided child element (Radix Slot) instead of the built-in <a> or <button>, to use a router's link.",
      table: { defaultValue: { summary: "false" } },
    },
    "aria-label": { control: "text", description: "Names the item when its content is only an icon." },
    id: { control: "text", description: "Standard DOM id. Avoid it: the sidebar's items are on the page twice while the phone panel is open." },
    className: { control: false, description: "Additional CSS classes, on the item's element." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: { children: "Home", href: "#home", current: false, disabled: false, asChild: false },
};

export default meta;

type Story = StoryObj<typeof Sidebar.Item>;

export const Default: Story = {
  render: (args) => (
    <Sidebar collapseBelow="never" onClick={preventNavigation}>
      <Sidebar.Nav>
        <Sidebar.Item {...args} />
      </Sidebar.Nav>
    </Sidebar>
  ),
};
