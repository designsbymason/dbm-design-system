// The code shown under each story's "Show code" button on DescriptionList's
// Docs page. Hand-written rather than generated from the rendered story —
// see 07-storybook-and-documentation-standards.md §4.2 and ADR-0020. Each
// snippet is the smallest real usage of what its story shows, using only
// exports of the package — `storySnippets.test.ts` checks that stays true.

export const descriptionListSnippets = {
  variants: `{/* variant: "bordered" (default, a self-contained block) | "ghost" (embeds inside a container that already has its own boundary, e.g. a Card) */}
<DescriptionList variant="bordered">
  <DescriptionList.Item>
    <DescriptionList.Term>Customer</DescriptionList.Term>
    <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
  </DescriptionList.Item>
  <DescriptionList.Item>
    <DescriptionList.Term>Status</DescriptionList.Term>
    <DescriptionList.Details>Paid</DescriptionList.Details>
  </DescriptionList.Item>
</DescriptionList>`,

  orientation: `{/* orientation: "horizontal" (default, term beside details) | "vertical" (term above details) */}
<DescriptionList orientation="horizontal">
  <DescriptionList.Item>
    <DescriptionList.Term>Customer</DescriptionList.Term>
    <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
  </DescriptionList.Item>
</DescriptionList>

<DescriptionList orientation="vertical">
  <DescriptionList.Item>
    <DescriptionList.Term>Customer</DescriptionList.Term>
    <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
  </DescriptionList.Item>
</DescriptionList>`,

  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" */}
<DescriptionList size="sm">
  <DescriptionList.Item>
    <DescriptionList.Term>Customer</DescriptionList.Term>
    <DescriptionList.Details>Jane Cooper</DescriptionList.Details>
  </DescriptionList.Item>
</DescriptionList>`,

  columns: `{/* columns lays items out in a grid, wrapping after every N — a
    responsive map (e.g. { base: 1, md: 3 }) collapses to one column on a
    narrow screen. The automatic between-item divider only shows at the
    default columns={1} — see DescriptionList's own "columns" prop doc. */}
<DescriptionList columns={{ base: 1, md: 3 }}>
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
    <DescriptionList.Details>$1,234.00</DescriptionList.Details>
  </DescriptionList.Item>
  {/* span stretches an item across more than one of the grid's columns — an
    escape hatch for a wide value, the same idea as GridItem's colSpan. */}
  <DescriptionList.Item span={3}>
    <DescriptionList.Term>Notes</DescriptionList.Term>
    <DescriptionList.Details>Leave the package with the front desk.</DescriptionList.Details>
  </DescriptionList.Item>
</DescriptionList>`,

  numeric: `{/* numeric sets tabular figures on a Details value, so a number that
    changes doesn't shift width digit by digit. */}
<DescriptionList.Item>
  <DescriptionList.Term>Total</DescriptionList.Term>
  <DescriptionList.Details numeric>$1,234.00</DescriptionList.Details>
</DescriptionList.Item>`,

  inCard: `{/* variant="ghost" removes the outer border/corners, for embedding
    inside a container that already provides its own — here, a Card. */}
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
</Card>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface DescriptionListPlaygroundSnippetArgs {
  variant?: string;
  size?: string;
  orientation?: string;
  columns?: number;
}

/**
 * The Playground's snippet, built from its current controls: only the props
 * that differ from their defaults, around a small real example.
 */
export function descriptionListPlaygroundSnippet(args: DescriptionListPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.variant && args.variant !== "bordered") attributes.push(`variant="${args.variant}"`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.orientation && args.orientation !== "horizontal") {
    attributes.push(`orientation="${args.orientation}"`);
  }
  if (args.columns && args.columns !== 1) attributes.push(`columns={${args.columns}}`);
  const opening = attributes.length > 0 ? `<DescriptionList ${attributes.join(" ")}>` : "<DescriptionList>";
  return `${opening}
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
</DescriptionList>`;
}
