// The code shown under each story's "Show code" button on EmptyState's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is
// the story object plus demo-only helpers (`gridStyle`, `.map(…)`, an inline
// illustration), which can't be pasted anywhere. Each snippet here is the
// smallest real usage of what its story shows — only exports of the package, no
// demo scaffolding — and `storySnippets.test.ts` checks that stays true. An icon
// is written by name, with a comment saying where it comes from, since a snippet
// carries no imports. See `07-storybook-and-documentation-standards.md` §4.2.

import type { EmptyStateAlign, EmptyStateSize, EmptyStateTone, EmptyStateVariant } from "./EmptyState.types";

const iconNote = "{/* TrayIcon comes from @dbm-design-system/icons */}";

const invoiceText = `  <EmptyState.Icon icon={TrayIcon} />
  <EmptyState.Title>No invoices yet</EmptyState.Title>
  <EmptyState.Description>Invoices you create will show up here.</EmptyState.Description>`;

const invoiceParts = `${invoiceText}
  <EmptyState.Actions>
    <Button>Create invoice</Button>
  </EmptyState.Actions>`;

// The Playground's demo shows a primary and a quieter secondary action.
const playgroundActions = `  <EmptyState.Actions>
    <Button>Create invoice</Button>
    <Button variant="tertiary">Import</Button>
  </EmptyState.Actions>`;

const emptyState = (attributes: string, children: string) =>
  `<EmptyState${attributes ? ` ${attributes}` : ""}>\n${children}\n</EmptyState>`;

export const emptyStateSnippets = {
  variants: `${iconNote}
{/* variant: "ghost" (default) | "outlined" | "dashed" | "filled" */}
${emptyState('variant="dashed"', invoiceParts)}`,

  tones: `{/* tone tints the icon badge: "neutral" (default) | "brand" | "info" | "success" | "warning" | "danger".
    CheckCircleIcon comes from @dbm-design-system/icons */}
<EmptyState tone="success">
  <EmptyState.Icon icon={CheckCircleIcon} />
  <EmptyState.Title>You're all caught up</EmptyState.Title>
  <EmptyState.Description>There's nothing waiting for your review.</EmptyState.Description>
</EmptyState>`,

  sizes: `${iconNote}
{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" — padding, spacing, and the icon and text size */}
${emptyState('size="lg"', invoiceParts)}`,

  align: `${iconNote}
{/* align: "center" (default) | "start" — start is the left in left-to-right text, the right in right-to-left */}
${emptyState('align="start" variant="outlined"', invoiceParts)}`,

  partsOptional: `{/* Every part is optional — a title alone, or an icon and a title */}
<EmptyState size="sm">
  <EmptyState.Title>Nothing to show</EmptyState.Title>
</EmptyState>

${iconNote}
<EmptyState size="sm">
  <EmptyState.Icon icon={TrayIcon} />
  <EmptyState.Title>No files</EmptyState.Title>
  <EmptyState.Description>Drag a file here to upload it.</EmptyState.Description>
</EmptyState>`,

  illustration: `{/* Anything you place among the parts is laid out in the same column —
    here an illustration in place of the icon */}
<EmptyState size="lg">
  <img src="/empty-inbox.svg" alt="" width={160} />
  <EmptyState.Title>Your inbox is empty</EmptyState.Title>
  <EmptyState.Description>New messages will appear here.</EmptyState.Description>
</EmptyState>`,

  searchNoResults: `{/* role="status" makes a screen reader announce the message when it appears in
    response to a search or a filter. MagnifyingGlassIcon comes from @dbm-design-system/icons */}
<EmptyState role="status" variant="dashed">
  <EmptyState.Icon icon={MagnifyingGlassIcon} />
  <EmptyState.Title>No results for “fjord”</EmptyState.Title>
  <EmptyState.Description>Check the spelling, or try a broader search term.</EmptyState.Description>
  <EmptyState.Actions>
    <Button variant="secondary" onClick={clearSearch}>Clear search</Button>
  </EmptyState.Actions>
</EmptyState>`,

  inCard: `{/* A ghost empty state draws no border of its own, so it doesn't double up inside a Card.
    TrayIcon comes from @dbm-design-system/icons */}
<Card>
  <Card.Header>
    <Heading level={3} size="md">Recent invoices</Heading>
  </Card.Header>
  <Card.Body>
    <EmptyState size="sm">
      <EmptyState.Icon icon={TrayIcon} />
      <EmptyState.Title level={4}>No invoices yet</EmptyState.Title>
      <EmptyState.Description>Invoices you create will show up here.</EmptyState.Description>
      <EmptyState.Actions>
        <Button size="sm">Create invoice</Button>
      </EmptyState.Actions>
    </EmptyState>
  </Card.Body>
</Card>`,

  inTable: `{/* Table.Empty is the message row of a table with no rows; an EmptyState fits inside it.
    TrayIcon comes from @dbm-design-system/icons */}
<Table aria-label="Invoices">
  <Table.Header>
    <Table.Row>
      <Table.HeaderCell>Invoice</Table.HeaderCell>
      <Table.HeaderCell>Status</Table.HeaderCell>
      <Table.HeaderCell numeric>Amount</Table.HeaderCell>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    <Table.Empty>
      <EmptyState size="sm">
        <EmptyState.Icon icon={TrayIcon} />
        <EmptyState.Title level={3}>No invoices yet</EmptyState.Title>
        <EmptyState.Description>Invoices you create will show up here.</EmptyState.Description>
      </EmptyState>
    </Table.Empty>
  </Table.Body>
</Table>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface EmptyStatePlaygroundSnippetArgs {
  variant?: EmptyStateVariant;
  tone?: EmptyStateTone;
  size?: EmptyStateSize;
  align?: EmptyStateAlign;
  /** Storybook only — whether the demo shows an `EmptyState.Actions` row. */
  actions?: boolean;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults, around a small real empty state (the actions row
 * only when the demo-actions control is on).
 */
export function emptyStatePlaygroundSnippet(args: EmptyStatePlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.variant && args.variant !== "ghost") attributes.push(`variant="${args.variant}"`);
  if (args.tone && args.tone !== "neutral") attributes.push(`tone="${args.tone}"`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.align && args.align !== "center") attributes.push(`align="${args.align}"`);

  const parts = args.actions === false ? invoiceText : `${invoiceText}\n${playgroundActions}`;
  return `${iconNote}\n${emptyState(attributes.join(" "), parts)}`;
}
