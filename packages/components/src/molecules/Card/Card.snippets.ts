// The code shown under each story's "Show code" button on Card's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is
// the story object plus demo-only helpers (`DemoCard`, `gridStyle`, `.map(…)`),
// which can't be pasted anywhere. Each snippet here is the smallest real usage of
// what its story shows — only exports of the package, no demo scaffolding — and
// `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import type { CardMediaPosition, CardOrientation, CardSize, CardTone, CardVariant } from "./Card.types";

const teamSections = `  <Card.Header>
    <Heading level={3}>Team plan</Heading>
    <Badge tone="success">Active</Badge>
  </Card.Header>
  <Card.Body>Up to 10 members and unlimited projects.</Card.Body>
  <Card.Footer>
    <Button variant="tertiary">Cancel</Button>
    <Button>Manage</Button>
  </Card.Footer>`;

const retreatMedia = `  <Card.Media>
    <img src="/retreat.jpg" alt="A mountain valley at dawn" />
  </Card.Media>`;

const retreatText = `  <Card.Header>
    <Heading level={3}>Mountain retreat</Heading>
  </Card.Header>
  <Card.Body>Three nights in a quiet valley, with guided hikes and a sauna.</Card.Body>`;

const card = (attributes: string, children: string) =>
  `<Card${attributes ? ` ${attributes}` : ""}>\n${children}\n</Card>`;

export const cardSnippets = {
  variants: `{/* variant: "outlined" (default) | "elevated" | "filled" | "ghost" */}
${card('variant="elevated"', teamSections)}`,

  tones: `{/* tone: "neutral" (default) | "brand" | "info" | "success" | "warning" | "danger" */}
${card('tone="success"', teamSections)}`,

  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" — the padding inside each section */}
${card('size="sm"', teamSections)}`,

  withMedia: `{/* Card.Media runs edge to edge and is clipped to the card's rounded corners */}
${card('variant="elevated"', `${retreatMedia}\n${retreatText}`)}`,

  divided: `{/* A hairline between the header, body, and footer */}
${card("divided", teamSections)}`,

  horizontal: `{/* Card.Media beside the content; the media fills the card's full height */}
${card('orientation="horizontal" variant="elevated"', `${retreatMedia}\n${retreatText}`)}`,

  mediaPosition: `{/* At the bottom of a vertical card */}
${card('mediaPosition="end"', `${retreatMedia}\n${retreatText}`)}

{/* On the end side of a horizontal card (the right in left-to-right text) */}
${card('orientation="horizontal" mediaPosition="end"', `${retreatMedia}\n${retreatText}`)}`,

  responsiveOrientation: `{/* Stacked below 768px, media beside the content from there up */}
${card('orientation={{ base: "vertical", md: "horizontal" }} variant="elevated"', `${retreatMedia}\n${retreatText}`)}`,

  interactiveLink: `{/* The whole card is one link — asChild renders the card as your <a> */}
<Card asChild interactive variant="elevated">
  <a href="/plans/team">
    <Card.Header>
      <Heading level={3}>Team plan</Heading>
      <Badge tone="success">Active</Badge>
    </Card.Header>
    <Card.Body>Up to 10 members and unlimited projects.</Card.Body>
  </a>
</Card>`,

  disabled: `{/* An unavailable card: dimmed, not clickable, still reachable by keyboard */}
<Card asChild interactive disabled variant="elevated">
  <a href="/plans/enterprise">
    <Card.Header>
      <Heading level={3}>Enterprise (unavailable)</Heading>
    </Card.Header>
    <Card.Body>This plan isn't available in your region.</Card.Body>
  </a>
</Card>`,

  footerAlignment: `{/* align: "start" | "center" | "end" (default) | "between" */}
<Card>
  <Card.Body>Footer content is laid out along the row.</Card.Body>
  <Card.Footer align="between">
    <Button variant="tertiary">Cancel</Button>
    <Button>Save</Button>
  </Card.Footer>
</Card>`,

  equalHeight: `{/* Cards in one grid row stretch to the row's height. Card.Body grows to fill the
    spare space, so every footer sits at the bottom whatever the body's length. */}
<Grid columns={3} gap={4}>
  <Card>
    <Card.Header>
      <Heading level={3}>Starter</Heading>
    </Card.Header>
    <Card.Body>One project.</Card.Body>
    <Card.Footer>
      <Button>Choose</Button>
    </Card.Footer>
  </Card>
  <Card>
    <Card.Header>
      <Heading level={3}>Team</Heading>
    </Card.Header>
    <Card.Body>
      Up to ten members, unlimited projects, shared workspaces, priority email support, and
      role-based permissions for every project.
    </Card.Body>
    <Card.Footer>
      <Button>Choose</Button>
    </Card.Footer>
  </Card>
  <Card>
    <Card.Header>
      <Heading level={3}>Business</Heading>
    </Card.Header>
    <Card.Body>Everything in Team, plus single sign-on and audit logs.</Card.Body>
    <Card.Footer>
      <Button>Choose</Button>
    </Card.Footer>
  </Card>
</Grid>`,

  withTable: `{/* Table's ghost variant drops its own border, for a table inside a card */}
<Card>
  <Card.Header>
    <Heading level={3}>Recent invoices</Heading>
    <Button variant="secondary">View all</Button>
  </Card.Header>
  <Table variant="ghost" aria-label="Recent invoices">
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell>Invoice</Table.HeaderCell>
        <Table.HeaderCell>Status</Table.HeaderCell>
        <Table.HeaderCell numeric>Amount</Table.HeaderCell>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      <Table.Row>
        <Table.HeaderCell scope="row">INV-001</Table.HeaderCell>
        <Table.Cell>Paid</Table.Cell>
        <Table.Cell numeric>$250.00</Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.HeaderCell scope="row">INV-002</Table.HeaderCell>
        <Table.Cell>Pending</Table.Cell>
        <Table.Cell numeric>$150.00</Table.Cell>
      </Table.Row>
    </Table.Body>
  </Table>
</Card>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface CardPlaygroundSnippetArgs {
  variant?: CardVariant;
  tone?: CardTone;
  size?: CardSize;
  /** Storybook only — whether the demo shows a `Card.Media`. */
  media?: boolean;
  orientation?: CardOrientation;
  mediaPosition?: CardMediaPosition;
  divided?: boolean;
  interactive?: boolean;
  disabled?: boolean;
}

const indent = (text: string, spaces: number) =>
  text
    .split("\n")
    .map((line) => (line ? " ".repeat(spaces) + line : line))
    .join("\n");

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults, wrapped around a small real card (a `Card.Media`
 * first when the demo-media control is on). An interactive card is shown as the
 * link it has to be to mean anything.
 */
export function cardPlaygroundSnippet(args: CardPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.interactive) attributes.push("asChild", "interactive");
  if (args.interactive && args.disabled) attributes.push("disabled");
  if (args.variant && args.variant !== "outlined") attributes.push(`variant="${args.variant}"`);
  if (args.tone && args.tone !== "neutral") attributes.push(`tone="${args.tone}"`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.orientation && args.orientation !== "vertical") attributes.push(`orientation="${args.orientation}"`);
  // `start` is where the media already sits (it's first in the snippet), so it
  // only needs writing when it's `end`.
  if (args.mediaPosition === "end") attributes.push('mediaPosition="end"');
  if (args.divided) attributes.push("divided");

  const sections = args.media ? `${retreatMedia}\n${teamSections}` : teamSections;
  const children = args.interactive ? `  <a href="/plans/team">\n${indent(sections, 2)}\n  </a>` : sections;
  return card(attributes.join(" "), children);
}
