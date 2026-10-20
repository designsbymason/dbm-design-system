import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sidebar } from "./Sidebar";
import { preventNavigation } from "./SidebarStoryKit";

// Docs-only (guidelines/adr/0013). This resolves Section's own argTypes for its Properties table on the main Docs page.
const meta: Meta<typeof Sidebar.Section> = {
  title: "Organisms/Navigation/Sidebar/Section",
  component: Sidebar.Section,
  tags: ["!dev"],
  argTypes: {
    label: { control: "text", description: "The section's heading, drawn above its items. In the rail it is hidden and a line sets the sections apart; it still names the list." },
    children: { control: false, description: "The section's Sidebar.Items and Sidebar.Groups." },
    id: { control: "text", description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: { label: "Workspace" },
};

export default meta;

type Story = StoryObj<typeof Sidebar.Section>;

export const Default: Story = {
  render: (args) => (
    <Sidebar collapseBelow="never">
      <Sidebar.Nav>
        <Sidebar.Section {...args}>
          <Sidebar.Item href="#a" onClick={preventNavigation}>
            Home
          </Sidebar.Item>
        </Sidebar.Section>
      </Sidebar.Nav>
    </Sidebar>
  ),
};
