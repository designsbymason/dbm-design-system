import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toolbar } from "./Toolbar";

// Docs-only (guidelines/adr/0013) — `Toolbar.Group`'s own props get their own Properties table on Toolbar.mdx.
const meta: Meta<typeof Toolbar.Group> = {
  title: "Molecules/Inputs/Toolbar/Group",
  component: Toolbar.Group,
  tags: ["!dev"],
  argTypes: {
    children: { control: false, description: "The items in the group." },
    attached: {
      control: "boolean",
      description:
        "Fuses the group's buttons into one segmented control: square corners where they meet, one separator between them, no gap (it renders a ButtonGroup), with every item still in the toolbar's arrow-key order. Off, the items sit apart by the bar's own gap.",
      table: { defaultValue: { summary: "false" } },
    },
    "aria-label": {
      control: "text",
      description:
        "Names the group for assistive tech (\"Text style\"). Required unless aria-labelledby points at a visible label: a group with no name is just a set of items.",
    },
    "aria-labelledby": { control: false, description: "The id of an already-visible element that names the group, in place of aria-label." },
    id: { control: false, description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description: "Test identifier for automated testing. Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: { "aria-label": "Text style", attached: false },
};

export default meta;

type Story = StoryObj<typeof Toolbar.Group>;

export const Default: Story = {
  render: ({ children: _children, ...args }) => (
    <Toolbar aria-label="Document" surface="outlined" variant="secondary">
      <Toolbar.Group {...args}>
        <Toolbar.Button>Copy</Toolbar.Button>
        <Toolbar.Button>Paste</Toolbar.Button>
      </Toolbar.Group>
    </Toolbar>
  ),
};
