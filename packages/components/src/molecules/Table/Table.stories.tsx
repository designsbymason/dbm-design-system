import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import type { CSSProperties } from "react";
import { Badge } from "../../atoms/Badge";
import type { BadgeTone } from "../../atoms/Badge";
import { Text } from "../../atoms/Text";
import { Table } from "./Table";
import type { TableProps, TableSize, TableVariant } from "./Table.types";

// `Table`'s own root props get hand-written argTypes here (this meta has no
// `component`, so docgen doesn't supply them) — mirroring `Accordion`'s own
// approach. `Table.Header`/`Body`/`Footer`/`Row`/`HeaderCell`/`Cell`/`Caption`
// each get their own Properties table via a hidden docs-only stories file
// (guidelines/adr/0013), where their argTypes are auto-resolved from real
// docgen.
interface PlaygroundArgs {
  variant: TableVariant;
  size: TableSize;
  striped: boolean;
  hoverable: boolean;
  stickyHeader: boolean;
  maxHeight: string;
  containerClassName: string;
  id: string;
  className: string;
  style: CSSProperties;
  "data-testid": string;
  "aria-label": string;
  "aria-labelledby": string;
  "aria-describedby": string;
}

interface Invoice {
  id: string;
  customer: string;
  status: "Paid" | "Pending" | "Overdue" | "Draft";
  amount: number;
}

const invoices: Invoice[] = [
  { id: "INV-001", customer: "Acme Corp", status: "Paid", amount: 250 },
  { id: "INV-002", customer: "Globex", status: "Pending", amount: 150 },
  { id: "INV-003", customer: "Initech", status: "Overdue", amount: 350 },
  { id: "INV-004", customer: "Umbrella Ltd", status: "Paid", amount: 450 },
  { id: "INV-005", customer: "Hooli", status: "Draft", amount: 550 },
  { id: "INV-006", customer: "Stark Industries", status: "Paid", amount: 120 },
  { id: "INV-007", customer: "Wayne Enterprises", status: "Pending", amount: 980 },
  { id: "INV-008", customer: "Wonka Industries", status: "Overdue", amount: 75 },
  { id: "INV-009", customer: "Cyberdyne", status: "Paid", amount: 640 },
  { id: "INV-010", customer: "Soylent Corp", status: "Draft", amount: 310 },
  { id: "INV-011", customer: "Vandelay Imports", status: "Paid", amount: 205 },
  { id: "INV-012", customer: "Massive Dynamic", status: "Pending", amount: 890 },
];

const statusTone: Record<Invoice["status"], BadgeTone> = {
  Paid: "success",
  Pending: "warning",
  Overdue: "danger",
  Draft: "neutral",
};

const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

interface DemoTableProps extends Partial<Omit<TableProps, "children">> {
  rows?: number;
  withFooter?: boolean;
  caption?: string;
}

const DemoTable = ({ rows = 5, withFooter = true, caption = "Recent invoices", ...tableProps }: DemoTableProps) => {
  const shown = invoices.slice(0, rows);
  const total = shown.reduce((sum, invoice) => sum + invoice.amount, 0);
  return (
    <Table {...tableProps}>
      <Table.Caption>{caption}</Table.Caption>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Invoice</Table.HeaderCell>
          <Table.HeaderCell>Customer</Table.HeaderCell>
          <Table.HeaderCell>Status</Table.HeaderCell>
          <Table.HeaderCell align="end">Amount</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {shown.map((invoice) => (
          <Table.Row key={invoice.id}>
            <Table.HeaderCell scope="row">{invoice.id}</Table.HeaderCell>
            <Table.Cell>{invoice.customer}</Table.Cell>
            <Table.Cell>
              <Badge tone={statusTone[invoice.status]} size="sm">
                {invoice.status}
              </Badge>
            </Table.Cell>
            <Table.Cell align="end">{formatCurrency(invoice.amount)}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
      {withFooter && (
        <Table.Footer>
          <Table.Row>
            <Table.HeaderCell scope="row" colSpan={3}>
              Total
            </Table.HeaderCell>
            <Table.Cell align="end">{formatCurrency(total)}</Table.Cell>
          </Table.Row>
        </Table.Footer>
      )}
    </Table>
  );
};

const demoContainerStyle = {
  maxWidth: "44rem",
  marginInline: "auto",
} as const;

// Every fixed-render story below ignores the Playground's own `args`, so each
// one suppresses every root-prop control it doesn't consume (a story-level
// `argTypes` entry merges over the meta-level one per key) — otherwise the
// Controls panel would show live-looking toggles that silently do nothing.
const noControls: Record<keyof PlaygroundArgs, { control: false }> = {
  variant: { control: false },
  size: { control: false },
  striped: { control: false },
  hoverable: { control: false },
  stickyHeader: { control: false },
  maxHeight: { control: false },
  containerClassName: { control: false },
  id: { control: false },
  className: { control: false },
  style: { control: false },
  "data-testid": { control: false },
  "aria-label": { control: false },
  "aria-labelledby": { control: false },
  "aria-describedby": { control: false },
};

const meta: Meta<PlaygroundArgs> = {
  title: "Molecules/Data Display/Table",
  parameters: { layout: "padded" },
  argTypes: {
    variant: {
      control: "select",
      options: ["bordered", "ghost"],
      description:
        "The table's own visual treatment — a self-contained bordered table, or a borderless treatment for embedding inside an already-bordered container (e.g. a Card).",
      table: { defaultValue: { summary: "'bordered'" } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Cell padding and typography for every Table.Cell and Table.HeaderCell inside the table.",
      table: { defaultValue: { summary: "'md'" } },
    },
    striped: {
      control: "boolean",
      description: "Alternates the background of every other Table.Body row, to help the eye track a row across a wide table.",
      table: { defaultValue: { summary: "false" } },
    },
    hoverable: {
      control: "boolean",
      description:
        "Highlights a Table.Body row while the pointer is over it. Purely a reading aid — the table itself stays non-interactive.",
      table: { defaultValue: { summary: "false" } },
    },
    stickyHeader: {
      control: "boolean",
      description:
        "Pins the Table.Header row to the top of the table's own scroll area while the body scrolls beneath it. Only has an effect when the table's height is constrained — set maxHeight.",
      table: { defaultValue: { summary: "false" } },
    },
    maxHeight: {
      control: "text",
      description:
        "Caps the height of the table's own scroll container (any valid CSS max-height value, e.g. 24rem), so a long body scrolls inside it instead of growing the page. Required for stickyHeader to have any effect.",
      // Cosmetic only — never becomes a real arg (see `PlaygroundControls.tsx`).
      // The Playground's own `render` maps an empty value to `undefined`,
      // matching this prop's real "no cap" default.
      placeholder: "none — e.g. 16rem",
    },
    containerClassName: {
      control: false,
      description:
        "Additional CSS classes for the table's own scroll container — the <div> wrapping the <table>. className targets the <table> element itself; use this for anything that needs to affect the scrolling frame instead.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id, applied to the <table> element. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this table.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for the <table> element itself.",
    },
    style: {
      control: false,
      description: "Inline styles for the <table> element itself, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute on the <table>; has no visual or behavioral effect.",
    },
    "aria-label": {
      control: false,
      description:
        "An accessible name for the table, for when there's no visible Table.Caption. Also names the table's own scroll region when it overflows.",
    },
    "aria-labelledby": {
      control: false,
      description:
        "The id of an element that names this table (e.g. a nearby heading), for when there's no visible Table.Caption. Also names the table's own scroll region when it overflows.",
    },
    "aria-describedby": {
      control: false,
      description: "The id of an element that describes this table (e.g. a paragraph of context above it).",
    },
  },
  args: {
    variant: "bordered",
    size: "md",
    striped: false,
    hoverable: false,
    stickyHeader: false,
    maxHeight: "",
  },
  render: (args) => (
    <div style={demoContainerStyle}>
      <DemoTable
        rows={6}
        variant={args.variant}
        size={args.size}
        striped={args.striped}
        hoverable={args.hoverable}
        stickyHeader={args.stickyHeader}
        maxHeight={args.maxHeight || undefined}
      />
    </div>
  ),
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Drive every prop live via the Controls panel below. Set `stickyHeader` together with a `maxHeight` (e.g. `12rem`) to see the header pin. */
export const Playground: Story = {};

export const Striped: Story = {
  name: "Striped rows",
  argTypes: noControls,
  render: () => (
    <div style={demoContainerStyle}>
      <DemoTable striped />
    </div>
  ),
};

export const Hoverable: Story = {
  name: "Hoverable rows",
  argTypes: noControls,
  render: () => (
    <div style={demoContainerStyle}>
      <DemoTable hoverable />
    </div>
  ),
};

export const StripedAndHoverable: Story = {
  name: "Striped and hoverable together",
  argTypes: noControls,
  render: () => (
    <div style={demoContainerStyle}>
      <DemoTable striped hoverable />
    </div>
  ),
};

export const StickyHeader: Story = {
  name: "Sticky header (scroll the body)",
  argTypes: noControls,
  render: () => (
    <div style={demoContainerStyle}>
      <DemoTable stickyHeader maxHeight="18rem" rows={12} striped />
    </div>
  ),
};

export const Ghost: Story = {
  name: "Ghost variant (borderless, for embedding in a Card)",
  argTypes: noControls,
  render: () => (
    // A real `Card` molecule isn't built yet (see 04-component-inventory.md),
    // so this fakes one — with its own title and generous padding, so the
    // wrapper's border reads as a *separate* container the ghost table sits
    // inside, not as the table's own (removed) border redrawn in the same
    // place.
    <div
      style={{
        ...demoContainerStyle,
        background: "var(--dbm-bg-surface)",
        border: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
        borderRadius: "var(--dbm-radius-lg)",
        padding: "var(--dbm-space-4)",
      }}
    >
      <Text size="md" weight="semibold" style={{ marginBlockEnd: "var(--dbm-space-3)" }}>
        Billing
      </Text>
      <DemoTable variant="ghost" caption="Recent invoices" rows={4} />
    </div>
  ),
};

export const Sizes: Story = {
  name: "All sizes",
  argTypes: noControls,
  render: () => (
    <div style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <div key={size}>
          <Text size="sm" weight="semibold" style={{ marginBlockEnd: "var(--dbm-space-2)" }}>
            size=&quot;{size}&quot;
          </Text>
          <DemoTable size={size} rows={2} withFooter={false} caption={`Invoices (${size})`} />
        </div>
      ))}
    </div>
  ),
};

export const Alignment: Story = {
  name: "Cell alignment (start, center, end)",
  argTypes: noControls,
  render: () => (
    <div style={demoContainerStyle}>
      <Table>
        <Table.Caption>Quarterly revenue</Table.Caption>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Region</Table.HeaderCell>
            <Table.HeaderCell align="center">Deals</Table.HeaderCell>
            <Table.HeaderCell align="end">Revenue</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.HeaderCell scope="row">North America</Table.HeaderCell>
            <Table.Cell align="center">128</Table.Cell>
            <Table.Cell align="end">$1,240,000.00</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.HeaderCell scope="row">Europe</Table.HeaderCell>
            <Table.Cell align="center">94</Table.Cell>
            <Table.Cell align="end">$860,500.00</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.HeaderCell scope="row">Asia Pacific</Table.HeaderCell>
            <Table.Cell align="center">61</Table.Cell>
            <Table.Cell align="end">$492,250.00</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    </div>
  ),
};

export const GroupedColumns: Story = {
  name: "Grouped columns (colSpan)",
  argTypes: noControls,
  render: () => (
    <div style={demoContainerStyle}>
      <Table>
        <Table.Caption>Signups by plan</Table.Caption>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell rowSpan={2}>Month</Table.HeaderCell>
            <Table.HeaderCell scope="colgroup" colSpan={2} align="center">
              Free
            </Table.HeaderCell>
            <Table.HeaderCell scope="colgroup" colSpan={2} align="center">
              Pro
            </Table.HeaderCell>
          </Table.Row>
          <Table.Row>
            <Table.HeaderCell align="end">New</Table.HeaderCell>
            <Table.HeaderCell align="end">Churned</Table.HeaderCell>
            <Table.HeaderCell align="end">New</Table.HeaderCell>
            <Table.HeaderCell align="end">Churned</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.HeaderCell scope="row">January</Table.HeaderCell>
            <Table.Cell align="end">1,204</Table.Cell>
            <Table.Cell align="end">210</Table.Cell>
            <Table.Cell align="end">96</Table.Cell>
            <Table.Cell align="end">8</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.HeaderCell scope="row">February</Table.HeaderCell>
            <Table.Cell align="end">1,388</Table.Cell>
            <Table.Cell align="end">199</Table.Cell>
            <Table.Cell align="end">121</Table.Cell>
            <Table.Cell align="end">11</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    </div>
  ),
};

export const NarrowScroll: Story = {
  name: "Narrow container (scrolls sideways, keyboard-reachable)",
  argTypes: noControls,
  render: () => (
    // A deliberately narrow frame — the table is wider than it, so its own
    // scroll container overflows. Tab onto it and use the arrow keys.
    <div style={{ maxWidth: "22rem", marginInline: "auto" }}>
      <Table aria-label="Wide table example">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Invoice</Table.HeaderCell>
            <Table.HeaderCell>Customer</Table.HeaderCell>
            <Table.HeaderCell>Email</Table.HeaderCell>
            <Table.HeaderCell>Plan</Table.HeaderCell>
            <Table.HeaderCell>Renewal date</Table.HeaderCell>
            <Table.HeaderCell align="end">Amount</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.HeaderCell scope="row">INV-001</Table.HeaderCell>
            <Table.Cell>Acme Corp</Table.Cell>
            <Table.Cell>billing@acme.example</Table.Cell>
            <Table.Cell>Enterprise annual</Table.Cell>
            <Table.Cell>January 15, 2027</Table.Cell>
            <Table.Cell align="end">$2,500.00</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.HeaderCell scope="row">INV-002</Table.HeaderCell>
            <Table.Cell>Globex</Table.Cell>
            <Table.Cell>accounts@globex.example</Table.Cell>
            <Table.Cell>Team monthly</Table.Cell>
            <Table.Cell>October 2, 2026</Table.Cell>
            <Table.Cell align="end">$150.00</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The container only becomes a focusable, named region once it actually
    // overflows — found asynchronously via ResizeObserver, hence `findBy`.
    const region = await canvas.findByRole("region", { name: "Wide table example" });
    await userEvent.tab();
    await expect(region).toHaveFocus();
  },
};
