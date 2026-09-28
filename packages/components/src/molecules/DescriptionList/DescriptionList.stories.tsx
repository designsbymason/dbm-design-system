import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Card } from "../Card";
import { Heading } from "../../atoms/Heading";
import { DescriptionList } from "./DescriptionList";
import { descriptionListPlaygroundSnippet, descriptionListSnippets } from "./DescriptionList.snippets";

// Matches Table's/Card's own established "constrain the demo width"
// convention — an unbounded description list stretched across the full
// padded canvas doesn't read like a realistic details panel.
const demoContainerStyle = {
  maxWidth: "28rem",
  marginInline: "auto",
} as const;

const meta: Meta<typeof DescriptionList> = {
  title: "Molecules/Data Display/DescriptionList",
  component: DescriptionList,
  parameters: { layout: "padded" },
  // Ordered to match DescriptionListProps' own declaration order (children,
  // variant, size, orientation, columns, id/className/style/data-testid,
  // aria-*) — same sequencing principle as every other component's stories
  // file (07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    children: {
      control: false,
      description: "One or more DescriptionList.Item elements.",
    },
    variant: {
      control: "select",
      options: ["bordered", "ghost"],
      description: "The list's own visual treatment.",
      table: { defaultValue: { summary: "bordered" } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Padding and typography for every item, term, and details.",
      table: { defaultValue: { summary: "md" } },
    },
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
      description: "How every item's term and details relate to one another.",
      table: { defaultValue: { summary: "horizontal" } },
    },
    columns: {
      control: "number",
      description: "Lays items out in a grid of this many columns.",
      table: { defaultValue: { summary: "1" } },
    },
    id: { control: false, description: "Standard DOM id, applied to the <dl>." },
    className: { control: false, description: "Additional CSS classes for the <dl>." },
    style: { control: false, description: "Inline styles for the <dl>." },
    "data-testid": { control: false, description: "Test identifier for automated testing." },
    "aria-label": { control: "text", description: "An accessible name for the list." },
    "aria-labelledby": { control: false, description: "The id of an element that names this list." },
    "aria-describedby": { control: false, description: "The id of an element that describes this list." },
  },
  // Every controllable prop gets an explicit value here, matching its real
  // component default — see guidelines/07-storybook-and-documentation-
  // standards.md §5.
  args: {
    variant: "bordered",
    size: "md",
    orientation: "horizontal",
    columns: 1,
  },
  render: (args) => (
    <div style={demoContainerStyle}>
      <DescriptionList {...args}>
        <DescriptionList.Item>
          <DescriptionList.Term>Customer</DescriptionList.Term>
          <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
        </DescriptionList.Item>
        <DescriptionList.Item>
          <DescriptionList.Term>Email</DescriptionList.Term>
          <DescriptionList.Details>jane.cooper@example.com</DescriptionList.Details>
        </DescriptionList.Item>
        <DescriptionList.Item>
          <DescriptionList.Term>Status</DescriptionList.Term>
          <DescriptionList.Details>Paid</DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>
    </div>
  ),
};

export default meta;

type Story = StoryObj<typeof DescriptionList>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => descriptionListPlaygroundSnippet(context.args),
      },
    },
  },
};

export const Variants: Story = {
  name: "Bordered vs. ghost",
  parameters: { docs: { source: { code: descriptionListSnippets.variants } } },
  argTypes: { variant: { control: false } },
  render: (args) => (
    <div style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      <DescriptionList {...args} variant="bordered">
        <DescriptionList.Item>
          <DescriptionList.Term>Customer</DescriptionList.Term>
          <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
        </DescriptionList.Item>
        <DescriptionList.Item>
          <DescriptionList.Term>Status</DescriptionList.Term>
          <DescriptionList.Details>Paid</DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>
      <DescriptionList {...args} variant="ghost">
        <DescriptionList.Item>
          <DescriptionList.Term>Customer</DescriptionList.Term>
          <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
        </DescriptionList.Item>
        <DescriptionList.Item>
          <DescriptionList.Term>Status</DescriptionList.Term>
          <DescriptionList.Details>Paid</DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>
    </div>
  ),
};

export const Orientation: Story = {
  name: "Horizontal vs. vertical orientation",
  parameters: { docs: { source: { code: descriptionListSnippets.orientation } } },
  argTypes: { orientation: { control: false } },
  render: (args) => (
    <div style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      <DescriptionList {...args} orientation="horizontal">
        <DescriptionList.Item>
          <DescriptionList.Term>Customer</DescriptionList.Term>
          <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
        </DescriptionList.Item>
        <DescriptionList.Item>
          <DescriptionList.Term>Shipping address</DescriptionList.Term>
          <DescriptionList.Details>4140 Parker Rd, Allentown, New Mexico 31134</DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>
      <DescriptionList {...args} orientation="vertical">
        <DescriptionList.Item>
          <DescriptionList.Term>Customer</DescriptionList.Term>
          <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
        </DescriptionList.Item>
        <DescriptionList.Item>
          <DescriptionList.Term>Shipping address</DescriptionList.Term>
          <DescriptionList.Details>4140 Parker Rd, Allentown, New Mexico 31134</DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>
    </div>
  ),
};

export const Sizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: descriptionListSnippets.sizes } } },
  argTypes: { size: { control: false } },
  render: (args) => (
    <div style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <DescriptionList {...args} key={size} size={size}>
          <DescriptionList.Item>
            <DescriptionList.Term>Customer</DescriptionList.Term>
            <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
          </DescriptionList.Item>
        </DescriptionList>
      ))}
    </div>
  ),
};

export const Columns: Story = {
  name: "Multi-column layout, with a spanning item",
  parameters: { docs: { source: { code: descriptionListSnippets.columns } } },
  argTypes: { columns: { control: false } },
  render: (args) => (
    <div style={{ maxWidth: "40rem", marginInline: "auto" }}>
      <DescriptionList {...args} columns={{ base: 1, md: 3 }}>
        <DescriptionList.Item>
          <DescriptionList.Term>Customer</DescriptionList.Term>
          <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
        </DescriptionList.Item>
        <DescriptionList.Item>
          <DescriptionList.Term>Status</DescriptionList.Term>
          <DescriptionList.Details>Paid</DescriptionList.Details>
        </DescriptionList.Item>
        <DescriptionList.Item>
          <DescriptionList.Term>Total</DescriptionList.Term>
          <DescriptionList.Details numeric>$1,234.00</DescriptionList.Details>
        </DescriptionList.Item>
        <DescriptionList.Item span={3}>
          <DescriptionList.Term>Notes</DescriptionList.Term>
          <DescriptionList.Details>Leave the package with the front desk.</DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>
    </div>
  ),
};

export const InACard: Story = {
  name: "Embedded in a Card (ghost variant)",
  parameters: { docs: { source: { code: descriptionListSnippets.inCard } } },
  argTypes: {
    variant: { control: false },
    size: { control: false },
    orientation: { control: false },
    columns: { control: false },
  },
  render: () => (
    <div style={demoContainerStyle}>
      <Card>
        <Card.Header>
          <Heading level={3} size="lg">
            Order #1024
          </Heading>
        </Card.Header>
        <Card.Body>
          <DescriptionList variant="ghost">
            <DescriptionList.Item>
              <DescriptionList.Term>Customer</DescriptionList.Term>
              <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
            </DescriptionList.Item>
            <DescriptionList.Item>
              <DescriptionList.Term>Status</DescriptionList.Term>
              <DescriptionList.Details>Paid</DescriptionList.Details>
            </DescriptionList.Item>
          </DescriptionList>
        </Card.Body>
      </Card>
    </div>
  ),
};

// Real-browser-only checks — what jsdom can't evaluate (real grid layout, a
// container-width-driven flex-wrap). Hidden from the sidebar/Docs page
// (`!dev`); still runs as a test via @storybook/addon-vitest's Chromium
// project. See 06-engineering-standards.md §9's "What jsdom can't evaluate"
// checklist item.
export const ResponsiveLayoutChecks: Story = {
  tags: ["!dev"],
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      <div data-testid="wide" style={{ inlineSize: "32rem" }}>
        <DescriptionList>
          <DescriptionList.Item>
            <DescriptionList.Term>Customer</DescriptionList.Term>
            <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
          </DescriptionList.Item>
        </DescriptionList>
      </div>
      <div data-testid="narrow" style={{ inlineSize: "8rem" }}>
        <DescriptionList>
          <DescriptionList.Item>
            <DescriptionList.Term>Shipping address</DescriptionList.Term>
            <DescriptionList.Details>4140 Parker Rd, Allentown</DescriptionList.Details>
          </DescriptionList.Item>
        </DescriptionList>
      </div>
      <div data-testid="three-col" style={{ inlineSize: "36rem" }}>
        <DescriptionList columns={3}>
          <DescriptionList.Item>
            <DescriptionList.Term>A</DescriptionList.Term>
            <DescriptionList.Details>1</DescriptionList.Details>
          </DescriptionList.Item>
          <DescriptionList.Item>
            <DescriptionList.Term>B</DescriptionList.Term>
            <DescriptionList.Details>2</DescriptionList.Details>
          </DescriptionList.Item>
          <DescriptionList.Item>
            <DescriptionList.Term>C</DescriptionList.Term>
            <DescriptionList.Details>3</DescriptionList.Details>
          </DescriptionList.Item>
        </DescriptionList>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // A wide item lays term and details on the same row (horizontal, the
    // default) — their boxes overlap vertically.
    const wideTerm = canvas.getByText("Customer");
    const wideDetails = canvas.getByText("Jane Cooper");
    const wideTermBox = wideTerm.getBoundingClientRect();
    const wideDetailsBox = wideDetails.getBoundingClientRect();
    await expect(wideTermBox.top).toBeLessThan(wideDetailsBox.bottom);
    await expect(wideDetailsBox.top).toBeLessThan(wideTermBox.bottom);

    // A narrow item can't fit both side by side — the details wraps onto
    // its own line below the term, with no responsive prop configured at
    // all (purely a consequence of the item's own container width).
    const narrowTerm = canvas.getByText("Shipping address");
    const narrowDetails = canvas.getByText("4140 Parker Rd, Allentown");
    const narrowTermBox = narrowTerm.getBoundingClientRect();
    const narrowDetailsBox = narrowDetails.getBoundingClientRect();
    await expect(narrowDetailsBox.top).toBeGreaterThanOrEqual(narrowTermBox.bottom);

    // columns={3} really renders three grid tracks.
    const threeColList = canvasElement.querySelector('[data-testid="three-col"] dl') as HTMLElement;
    const trackCount = getComputedStyle(threeColList).gridTemplateColumns.trim().split(/\s+/).length;
    await expect(trackCount).toBe(3);
  },
};
