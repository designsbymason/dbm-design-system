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
    alignedTerms: {
      description: "Sizes every term to the width of the widest one, so every details value starts at the same position.",
      table: { defaultValue: { summary: "true" } },
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
    alignedTerms: true,
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

export const AlignedTerms: Story = {
  name: "Aligned vs. per-item term widths",
  parameters: { docs: { source: { code: descriptionListSnippets.alignedTerms } } },
  argTypes: { alignedTerms: { control: false } },
  render: (args) => (
    <div style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      <DescriptionList {...args} alignedTerms>
        <DescriptionList.Item>
          <DescriptionList.Term>Customer</DescriptionList.Term>
          <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
        </DescriptionList.Item>
        <DescriptionList.Item>
          <DescriptionList.Term>Shipping address</DescriptionList.Term>
          <DescriptionList.Details>4140 Parker Rd, Allentown, New Mexico 31134</DescriptionList.Details>
        </DescriptionList.Item>
        <DescriptionList.Item>
          <DescriptionList.Term>Status</DescriptionList.Term>
          <DescriptionList.Details>Paid</DescriptionList.Details>
        </DescriptionList.Item>
      </DescriptionList>
      <DescriptionList {...args} alignedTerms={false}>
        <DescriptionList.Item>
          <DescriptionList.Term>Customer</DescriptionList.Term>
          <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
        </DescriptionList.Item>
        <DescriptionList.Item>
          <DescriptionList.Term>Shipping address</DescriptionList.Term>
          <DescriptionList.Details>4140 Parker Rd, Allentown, New Mexico 31134</DescriptionList.Details>
        </DescriptionList.Item>
        <DescriptionList.Item>
          <DescriptionList.Term>Status</DescriptionList.Term>
          <DescriptionList.Details>Paid</DescriptionList.Details>
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
      {/* alignedTerms={false}: this story is specifically about the flex-wrap
        degrade, which only applies once alignment's fixed 2-column grid is
        opted out of (alignedTerms's own default is true). */}
      <div data-testid="narrow" style={{ inlineSize: "8rem" }}>
        <DescriptionList alignedTerms={false}>
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

// alignedTerms's own real-browser checks — real term-width alignment (a
// layout computation jsdom can't evaluate) and confirming `display: contents`
// doesn't drop anything from the accessibility tree. Hidden (`!dev`).
export const AlignedTermsChecks: Story = {
  tags: ["!dev"],
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      <div data-testid="aligned" style={{ inlineSize: "24rem" }}>
        <DescriptionList alignedTerms>
          <DescriptionList.Item>
            <DescriptionList.Term>ID</DescriptionList.Term>
            <DescriptionList.Details>1024</DescriptionList.Details>
          </DescriptionList.Item>
          <DescriptionList.Item>
            <DescriptionList.Term>Shipping address</DescriptionList.Term>
            <DescriptionList.Details>4140 Parker Rd</DescriptionList.Details>
          </DescriptionList.Item>
        </DescriptionList>
      </div>
      <div data-testid="not-aligned" style={{ inlineSize: "24rem" }}>
        <DescriptionList alignedTerms={false}>
          <DescriptionList.Item>
            <DescriptionList.Term>ID</DescriptionList.Term>
            <DescriptionList.Details>1024</DescriptionList.Details>
          </DescriptionList.Item>
          <DescriptionList.Item>
            <DescriptionList.Term>Shipping address</DescriptionList.Term>
            <DescriptionList.Details>4140 Parker Rd</DescriptionList.Details>
          </DescriptionList.Item>
        </DescriptionList>
      </div>
      {/* A wide container with only short terms — the exact shape that
        exposed the "Maximize Tracks" bug: a plain percentage growth limit
        grows toward it using the container's free space even when no term
        needs it, unlike fit-content(). */}
      <div data-testid="wide-short-terms" style={{ inlineSize: "48rem" }}>
        <DescriptionList alignedTerms>
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
    </div>
  ),
  play: async ({ canvasElement }) => {
    const aligned = canvasElement.querySelector('[data-testid="aligned"]') as HTMLElement;
    const shortTerm = within(aligned).getByText("ID");
    const longTerm = within(aligned).getByText("Shipping address");
    const shortDetails = within(aligned).getByText("1024");
    const longDetails = within(aligned).getByText("4140 Parker Rd");

    // Both terms occupy the same-width shared grid column …
    await expect(shortTerm.getBoundingClientRect().width).toBeCloseTo(
      longTerm.getBoundingClientRect().width,
      0,
    );
    // … so both details values start at the same inline position.
    await expect(shortDetails.getBoundingClientRect().left).toBeCloseTo(
      longDetails.getBoundingClientRect().left,
      0,
    );

    // Regression guard: the term's own box must reach exactly where the
    // details' box begins — zero true gap between them (the visual space
    // between the *text* lives inside the term's own trailing padding, not
    // a grid column-gap; see `.alignedTerms`'s own CSS comment for why a
    // real gap breaks the divider into two segments). Found live twice: a
    // leftover flex-mode `max-inline-size: 40%` first shrank the term to a
    // fraction of its track (a ~90px gap), and even once that was fixed a
    // real `column-gap` still left a ~16px gap the divider border couldn't
    // cross — both are why this asserts an exact match, not just "small".
    await expect(shortDetails.getBoundingClientRect().left).toBeCloseTo(
      shortTerm.getBoundingClientRect().right,
      0,
    );

    // Regression guard: the term column must hug its widest term's own
    // content, not balloon toward the grid's own free space — a plain
    // percentage (`minmax(auto, 40%)`) is a definite growth *limit* CSS
    // Grid's "Maximize Tracks" step actively grows into using the
    // container's free space regardless of whether content needs it
    // (`fit-content(40%)` is the fix: it caps growth without reaching for
    // it). Found live, user-reported: three short terms ("Customer",
    // "Email", "Status") in a 768px-wide list still measured a term column
    // near 40% of the container (~300px) before this fix. 200px is a
    // generous ceiling for "Customer" (the widest of the three) plus its
    // own padding at this story's font size, and a small fraction of the
    // 768px container's own 40% (~307px) — this fails loudly if the column
    // ever again tracks the container's width instead of its content.
    const wideShortTerms = canvasElement.querySelector('[data-testid="wide-short-terms"]') as HTMLElement;
    const wideCustomerTerm = within(wideShortTerms).getByText("Customer");
    await expect(wideCustomerTerm.getBoundingClientRect().width).toBeLessThan(200);

    // The opt-out renders the original per-item behavior: the short term's
    // own box is genuinely narrower than the long one's (each hugs its own
    // content), so the two details values start at different positions.
    const notAligned = canvasElement.querySelector('[data-testid="not-aligned"]') as HTMLElement;
    const shortTermOptOut = within(notAligned).getByText("ID");
    const longTermOptOut = within(notAligned).getByText("Shipping address");
    await expect(shortTermOptOut.getBoundingClientRect().width).toBeLessThan(
      longTermOptOut.getBoundingClientRect().width,
    );

    // `display: contents` on Item must not drop the term/details from the
    // accessibility tree — both still resolve to a real accessible role.
    await expect(shortTerm.closest("dt")).not.toBeNull();
    await expect(shortDetails.closest("dd")).not.toBeNull();
  },
};
