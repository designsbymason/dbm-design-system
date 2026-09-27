import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stat } from "./Stat";

// Docs-only (guidelines/adr/0013) — `Stat.Label`'s own props get their own
// Properties table on Stat.mdx, separate from the umbrella table. Rendered
// inside a real `Stat` so the sub-part is shown in its real context.
const meta: Meta<typeof Stat.Label> = {
  title: "Molecules/Data Display/Stat/Label",
  component: Stat.Label,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: "text",
      description: "What the metric is — a short name (\"Total revenue\", \"Active users\").",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this label.",
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
    children: "Active users",
  },
};

export default meta;

type Story = StoryObj<typeof Stat.Label>;

export const Default: Story = {
  render: (args) => (
    <Stat>
      <Stat.Label {...args} />
      <Stat.Value>12,480</Stat.Value>
    </Stat>
  ),
};
