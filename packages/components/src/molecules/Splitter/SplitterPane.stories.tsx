import type { Meta, StoryObj } from "@storybook/react-vite";
import { Splitter } from "./Splitter";

// Docs-only: exists purely to resolve `Splitter.Pane`'s own argTypes for the "Splitter.Pane properties" table on
// `Splitter.mdx` — it is a compound sub-part, not an independently browsable component (see ADR-0013), so
// `tags: ["!dev"]` keeps every story here out of the sidebar while leaving it indexed for the Docs page. The render
// wraps the pane in a real `Splitter`, which is where it gets its size.
const meta: Meta<typeof Splitter.Pane> = {
  title: "Molecules/Layout/Splitter/Pane",
  component: Splitter.Pane,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description:
        "What the pane holds — or a function of the pane's state ({ collapsed, size }), to show something else once it has collapsed to a strip (an icon where a label was).",
    },
    defaultSize: {
      control: "number",
      description:
        "The pane's starting size as a percentage, when the splitter holds its own layout and gets no defaultLayout. Panes without one share the rest equally.",
    },
    minSize: {
      control: "text",
      description: 'The smallest the pane can be: a percentage (20 or "20%") or a length in pixels ("240px").',
      table: { defaultValue: { summary: "10" } },
    },
    maxSize: {
      control: "text",
      description: 'The largest the pane can be: a percentage (60 or "60%") or a length in pixels ("480px").',
      table: { defaultValue: { summary: "100" } },
    },
    collapsible: {
      description:
        "Lets the pane collapse: pulled past halfway to its minimum it snaps shut, and Enter or a double click on a neighbouring handle toggles it.",
      table: { defaultValue: { summary: "false" } },
    },
    collapsedSize: {
      control: "text",
      description: 'The size a collapsed pane keeps — 0 makes it disappear (and hides its content from assistive tech), "48px" leaves a strip.',
      table: { defaultValue: { summary: "0" } },
    },
    collapsed: { description: "Collapses or opens the pane from outside. Pair it with onCollapsedChange." },
    defaultCollapsed: {
      description: "Whether the pane starts collapsed, when it isn't controlled.",
      table: { defaultValue: { summary: "false" } },
    },
    onCollapsedChange: { description: "Called when the pane collapses or opens, whatever caused it." },
    id: { control: false, description: "Standard DOM id; the handles next to the pane point at it with aria-controls. Generated when left out." },
    className: { control: false, description: "Additional CSS classes for the pane." },
    style: { control: false, description: "Inline styles for the pane." },
    "data-testid": { control: false, description: "Test identifier for automated testing." },
  },
  args: { collapsible: false, defaultCollapsed: false },
  render: (args) => (
    <div style={{ height: "8rem" }}>
      <Splitter>
        <Splitter.Pane {...args}>Pane</Splitter.Pane>
        <Splitter.Pane>Pane</Splitter.Pane>
      </Splitter>
    </div>
  ),
};

export default meta;

type Story = StoryObj<typeof Splitter.Pane>;

export const Default: Story = {};
