// The code shown under each story's "Show code" button on Table's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is
// the story object plus demo-only helpers (`DemoTable`, `WideTable`, `.map(…)`),
// which can't be pasted anywhere. Each snippet here is the smallest real usage of
// what its story shows — only exports of the package, no demo scaffolding — and
// `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import type { TableSize, TableTone, TableVariant } from "./Table.types";

const invoiceRows = [
  { id: "INV-001", customer: "Acme Corp", tone: "success", status: "Paid", amount: "$250.00" },
  { id: "INV-002", customer: "Globex", tone: "warning", status: "Pending", amount: "$150.00" },
  { id: "INV-003", customer: "Initech", tone: "danger", status: "Overdue", amount: "$350.00" },
] as const;

interface InvoiceTableOptions {
  /** Extra attributes on `<Table>`, e.g. `striped hoverable`. */
  attributes?: string;
  /** A visible `Table.Caption` (which also names the table) instead of an `aria-label`. */
  caption?: string;
  footer?: boolean;
}

// A small invoices table — header, three rows, an optional total — used by every
// snippet whose story is about a `<Table>` prop rather than its markup.
function invoiceTable({ attributes = "", caption, footer = true }: InvoiceTableOptions = {}): string {
  const open = ["<Table", attributes, caption ? "" : 'aria-label="Recent invoices"']
    .filter(Boolean)
    .join(" ")
    .concat(">");
  const rows = invoiceRows
    .map(
      (row) => `    <Table.Row>
      <Table.HeaderCell scope="row">${row.id}</Table.HeaderCell>
      <Table.Cell>${row.customer}</Table.Cell>
      <Table.Cell>
        <Badge tone="${row.tone}" size="sm">${row.status}</Badge>
      </Table.Cell>
      <Table.Cell numeric>${row.amount}</Table.Cell>
    </Table.Row>`,
    )
    .join("\n");
  return `${open}
${caption ? `  <Table.Caption>${caption}</Table.Caption>\n` : ""}  <Table.Header>
    <Table.Row>
      <Table.HeaderCell>Invoice</Table.HeaderCell>
      <Table.HeaderCell>Customer</Table.HeaderCell>
      <Table.HeaderCell>Status</Table.HeaderCell>
      <Table.HeaderCell numeric>Amount</Table.HeaderCell>
    </Table.Row>
  </Table.Header>
  <Table.Body>
${rows}
  </Table.Body>${
    footer
      ? `
  <Table.Footer>
    <Table.Row>
      <Table.HeaderCell scope="row" colSpan={3}>Total</Table.HeaderCell>
      <Table.Cell numeric>$750.00</Table.Cell>
    </Table.Row>
  </Table.Footer>`
      : ""
  }
</Table>`;
}

// A table wider than the space it's given — the sticky-column stories need
// something to scroll sideways.
function wideTable(attributes: string): string {
  return `<Table ${attributes} aria-label="Wide invoices">
  <Table.Header>
    <Table.Row>
      <Table.HeaderCell>Invoice</Table.HeaderCell>
      <Table.HeaderCell>Customer</Table.HeaderCell>
      <Table.HeaderCell>Email</Table.HeaderCell>
      <Table.HeaderCell>Plan</Table.HeaderCell>
      <Table.HeaderCell>Renewal</Table.HeaderCell>
      <Table.HeaderCell numeric>Amount</Table.HeaderCell>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    <Table.Row>
      <Table.HeaderCell scope="row">INV-001</Table.HeaderCell>
      <Table.Cell>Acme Corp</Table.Cell>
      <Table.Cell>billing@acme.example</Table.Cell>
      <Table.Cell>Enterprise annual</Table.Cell>
      <Table.Cell>Jan 15, 2027</Table.Cell>
      <Table.Cell numeric>$2,500.00</Table.Cell>
    </Table.Row>
    <Table.Row>
      <Table.HeaderCell scope="row">INV-002</Table.HeaderCell>
      <Table.Cell>Globex</Table.Cell>
      <Table.Cell>accounts@globex.example</Table.Cell>
      <Table.Cell>Team monthly</Table.Cell>
      <Table.Cell>Oct 2, 2026</Table.Cell>
      <Table.Cell numeric>$150.00</Table.Cell>
    </Table.Row>
  </Table.Body>
</Table>`;
}

export const tableSnippets = {
  withCaption: `{/* A visible caption also names the table. A non-neutral tone fills it like the header. */}
${invoiceTable({ attributes: 'tone="brand"', caption: "Recent invoices", footer: false })}`,

  striped: invoiceTable({ attributes: "striped" }),

  hoverable: invoiceTable({ attributes: "hoverable" }),

  stripedAndHoverable: invoiceTable({ attributes: "striped hoverable" }),

  tones: `{/* tone: "neutral" (default) | "brand" | "info" | "success" | "warning" | "danger" */}
${invoiceTable({ attributes: 'tone="success" striped hoverable', footer: false })}`,

  stickyHeader: `{/* stickyHeader pins the header row while the body scrolls, and needs maxHeight —
    the table scrolls inside that height. */}
${invoiceTable({ attributes: 'stickyHeader maxHeight="18rem" striped' })}`,

  ghost: `{/* variant="ghost" drops the table's own border, for a table inside a container that
    already has one — here a Card. */}
<Card>
  <Card.Header>
    <Heading level={3}>Billing</Heading>
  </Card.Header>
${invoiceTable({ attributes: 'variant="ghost"' })
  .split("\n")
  .map((line) => (line ? `  ${line}` : line))
  .join("\n")}
</Card>`,

  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" — cell padding and type size */}
${invoiceTable({ attributes: 'size="sm"', footer: false })}`,

  alignment: `<Table aria-label="Quarterly revenue">
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
  </Table.Body>
</Table>`,

  groupedColumns: `<Table aria-label="Signups by plan">
  <Table.Header>
    <Table.Row>
      <Table.HeaderCell rowSpan={2}>Month</Table.HeaderCell>
      <Table.HeaderCell scope="colgroup" colSpan={2} align="center">Free</Table.HeaderCell>
      <Table.HeaderCell scope="colgroup" colSpan={2} align="center">Pro</Table.HeaderCell>
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
</Table>`,

  stickyFirstColumn: `{/* The first column stays in view while the rest scrolls sideways. It only shows when the
    table is wider than its space — give it a narrower container. */}
${wideTable('stickyFirstColumn striped hoverable tone="brand"')}`,

  stickyLastColumn: `{/* The mirror image: the last column (amounts, a total, actions) stays at the end edge. */}
${wideTable('stickyLastColumn striped hoverable tone="success"')}`,

  stickyFirstAndLastColumns: `{/* Both edges pinned, plus the header — scroll in either direction. */}
${wideTable('stickyFirstColumn stickyLastColumn stickyHeader maxHeight="13rem" striped')}`,

  stickyHeaderAndColumn: `{/* The header row and the first column both stay in view, with the corner cell above both. */}
${wideTable('stickyHeader stickyFirstColumn maxHeight="13rem" tone="info" striped')}`,

  numeric: `{/* numeric right-aligns a column and switches its digits to tabular figures, so the
    decimal points line up down the column. */}
<Table aria-label="Revenue by region">
  <Table.Header>
    <Table.Row>
      <Table.HeaderCell>Region</Table.HeaderCell>
      <Table.HeaderCell numeric>Revenue</Table.HeaderCell>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    <Table.Row>
      <Table.Cell>North America</Table.Cell>
      <Table.Cell numeric>$1,111,111.11</Table.Cell>
    </Table.Row>
    <Table.Row>
      <Table.Cell>Europe</Table.Cell>
      <Table.Cell numeric>$888,888.88</Table.Cell>
    </Table.Row>
  </Table.Body>
</Table>`,

  loading: `{/* loading renders skeleton rows in place of the body's rows */}
<Table aria-label="Recent invoices">
  <Table.Header>
    <Table.Row>
      <Table.HeaderCell>Invoice</Table.HeaderCell>
      <Table.HeaderCell>Customer</Table.HeaderCell>
      <Table.HeaderCell>Status</Table.HeaderCell>
      <Table.HeaderCell numeric>Amount</Table.HeaderCell>
    </Table.Row>
  </Table.Header>
  <Table.Body loading loadingRows={4} />
</Table>`,

  empty: `<Table aria-label="Recent invoices">
  <Table.Header>
    <Table.Row>
      <Table.HeaderCell>Invoice</Table.HeaderCell>
      <Table.HeaderCell>Customer</Table.HeaderCell>
      <Table.HeaderCell>Status</Table.HeaderCell>
      <Table.HeaderCell numeric>Amount</Table.HeaderCell>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    <Table.Empty>No invoices yet — create one to get started.</Table.Empty>
  </Table.Body>
</Table>`,

  narrowScroll: `{/* A table wider than its container scrolls inside its own frame. The frame becomes a
    keyboard-focusable, named region only while it actually overflows. */}
<div style={{ maxWidth: "22rem" }}>
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
    </Table.Body>
  </Table>
</div>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface TablePlaygroundSnippetArgs {
  variant?: TableVariant;
  tone?: TableTone;
  size?: TableSize;
  striped?: boolean;
  hoverable?: boolean;
  stickyHeader?: boolean;
  stickyFirstColumn?: boolean;
  stickyLastColumn?: boolean;
  maxHeight?: string;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults, on a small real invoices table.
 */
export function tablePlaygroundSnippet(args: TablePlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.variant && args.variant !== "bordered") attributes.push(`variant="${args.variant}"`);
  if (args.tone && args.tone !== "neutral") attributes.push(`tone="${args.tone}"`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.striped) attributes.push("striped");
  if (args.hoverable) attributes.push("hoverable");
  if (args.stickyHeader) attributes.push("stickyHeader");
  if (args.stickyFirstColumn) attributes.push("stickyFirstColumn");
  if (args.stickyLastColumn) attributes.push("stickyLastColumn");
  if (args.maxHeight) attributes.push(`maxHeight="${args.maxHeight}"`);
  return invoiceTable({ attributes: attributes.join(" ") });
}
