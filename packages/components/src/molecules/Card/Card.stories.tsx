import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import type { CSSProperties, ReactNode } from "react";
import { AspectRatio } from "../../atoms/AspectRatio";
import { Badge } from "../../atoms/Badge";
import { Button } from "../../atoms/Button";
import { Heading } from "../../atoms/Heading";
import { Text } from "../../atoms/Text";
import { Table } from "../Table";
import { Card } from "./Card";
import type { CardFooterAlign, CardProps, CardSize, CardTone, CardVariant } from "./Card.types";

// `Card`'s own root props get hand-written argTypes here (this meta has no
// `component`, so docgen doesn't supply them) — mirroring `Accordion`'s and
// `Table`'s own approach. `Card.Media`/`Header`/`Body`/`Footer` each get their
// own Properties table via a hidden docs-only stories file (guidelines/adr/0013),
// where their argTypes are auto-resolved from real docgen.
interface PlaygroundArgs {
  variant: CardVariant;
  tone: CardTone;
  size: CardSize;
  interactive: boolean;
  asChild: boolean;
  "aria-label": string;
  "aria-labelledby": string;
  "aria-describedby": string;
  id: string;
  className: string;
  style: CSSProperties;
  "data-testid": string;
}

const allTones: CardTone[] = ["neutral", "brand", "info", "success", "warning", "danger"];
const allVariants: CardVariant[] = ["outlined", "elevated", "filled", "ghost"];
const allSizes: CardSize[] = ["xs", "sm", "md", "lg", "xl"];

// A story-layout wrapper — a plain CSS grid, not the `Grid` molecule, so these
// demos don't depend on `Grid`'s own API.
const gridStyle = (columns: number): CSSProperties => ({
  display: "grid",
  gap: "var(--dbm-space-4)",
  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
});

const demoContainerStyle = { maxWidth: "48rem", marginInline: "auto" } as const;

// The standard demo content: a header with a title and a status badge, a body,
// and a footer of two actions.
const DemoSections = ({ title = "Team plan", body = "Up to 10 members and unlimited projects.", footer = true }: {
  title?: string;
  body?: ReactNode;
  footer?: boolean;
}) => (
  <>
    <Card.Header>
      <Heading level={3} size="md">
        {title}
      </Heading>
      <Badge tone="success" size="sm">
        Active
      </Badge>
    </Card.Header>
    <Card.Body>
      <Text size="sm" color="secondary">
        {body}
      </Text>
    </Card.Body>
    {footer && (
      <Card.Footer>
        <Button variant="tertiary" size="sm">
          Cancel
        </Button>
        <Button size="sm">Manage</Button>
      </Card.Footer>
    )}
  </>
);

const DemoCard = ({ children, ...props }: Partial<CardProps>) => (
  <Card {...props}>{children ?? <DemoSections />}</Card>
);

// Every fixed-render story below ignores the Playground's own `args`, so each
// one suppresses every root-prop control it doesn't consume (a story-level
// `argTypes` entry merges over the meta-level one per key) — otherwise the
// Controls panel would show live-looking toggles that silently do nothing.
const noControls: Record<keyof PlaygroundArgs, { control: false }> = {
  variant: { control: false },
  tone: { control: false },
  size: { control: false },
  interactive: { control: false },
  asChild: { control: false },
  "aria-label": { control: false },
  "aria-labelledby": { control: false },
  "aria-describedby": { control: false },
  id: { control: false },
  className: { control: false },
  style: { control: false },
  "data-testid": { control: false },
};

const meta: Meta<PlaygroundArgs> = {
  title: "Molecules/Data Display/Card",
  parameters: { layout: "padded" },
  argTypes: {
    variant: {
      control: "select",
      options: ["outlined", "elevated", "filled", "ghost"],
      description:
        "The card's surface treatment: outlined (a border on the surface colour), elevated (a soft shadow instead of a border), filled (a subtle neutral fill, no border), or ghost (no surface at all — just the layout, for a card inside a container that already provides its own boundary).",
      table: { defaultValue: { summary: "'outlined'" } },
    },
    tone: {
      control: "select",
      options: ["neutral", "brand", "info", "success", "warning", "danger"],
      description:
        "A colour accent. neutral (the default) is uncoloured; every other tone gives the card a border in that colour and a subtle tint behind Card.Header. brand follows the active Purple/Emerald theme; success, warning, danger, and info are fixed status colours. A ghost card has no border, so a tone only tints its header.",
      table: { defaultValue: { summary: "'neutral'" } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Section padding, and so the card's overall density.",
      table: { defaultValue: { summary: "'md'" } },
    },
    interactive: {
      control: "boolean",
      description:
        "Styles the card as clickable as a whole — a pointer cursor and hover, focus, and pressed states. Styling only: to make the card genuinely interactive, render it as a link or button with asChild. (In the Playground, turning this on renders the card as a real link.)",
      table: { defaultValue: { summary: "false" } },
    },
    asChild: {
      control: false,
      description:
        "Renders the card's styling onto a single provided child element (via Radix Slot) instead of a <div> — the way to make the card itself a link or a button. The child holds the card's sections.",
      table: { defaultValue: { summary: "false" } },
    },
    "aria-label": {
      control: false,
      description:
        "An accessible name for the card, for when it acts as a labelled region or link and has no visible heading to name it.",
    },
    "aria-labelledby": {
      control: false,
      description: "The id of an element that names this card (e.g. its own heading).",
    },
    "aria-describedby": {
      control: false,
      description: "The id of an element that describes this card.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this card, or when a test or router needs a stable anchor.",
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
    variant: "outlined",
    tone: "neutral",
    size: "md",
    interactive: false,
  },
  render: (args) => (
    <div style={{ maxWidth: "24rem", marginInline: "auto" }}>
      {args.interactive ? (
        // `interactive` alone is styling only, so the Playground renders the
        // card as a real link when it's on — the supported way to use it.
        <Card asChild interactive variant={args.variant} tone={args.tone} size={args.size}>
          <a href="#plan" onClick={(event) => event.preventDefault()}>
            <DemoSections />
          </a>
        </Card>
      ) : (
        <Card variant={args.variant} tone={args.tone} size={args.size}>
          <DemoSections />
        </Card>
      )}
    </div>
  ),
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Drive every prop live via the Controls panel below. Turning `interactive` on renders the card as a real link. */
export const Playground: Story = {};

export const Variants: Story = {
  name: "All variants",
  argTypes: noControls,
  render: () => (
    <div style={{ ...gridStyle(2), maxWidth: "48rem", marginInline: "auto" }}>
      {allVariants.map((variant) => (
        <div key={variant} style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
          <Text size="sm" weight="semibold">
            variant=&quot;{variant}&quot;
          </Text>
          <DemoCard variant={variant} />
        </div>
      ))}
    </div>
  ),
};

export const Tones: Story = {
  name: "All tones",
  argTypes: noControls,
  render: () => (
    <div style={{ ...gridStyle(3), maxWidth: "60rem", marginInline: "auto" }}>
      {allTones.map((tone) => (
        <div key={tone} style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
          <Text size="sm" weight="semibold">
            tone=&quot;{tone}&quot;
          </Text>
          <DemoCard tone={tone} />
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  name: "All sizes",
  argTypes: noControls,
  render: () => (
    <div
      style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}
    >
      {allSizes.map((size) => (
        <div key={size} style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
          <Text size="sm" weight="semibold">
            size=&quot;{size}&quot;
          </Text>
          <DemoCard size={size} />
        </div>
      ))}
    </div>
  ),
};

export const WithMedia: Story = {
  name: "With media",
  argTypes: noControls,
  render: () => (
    // `Card.Media` runs edge to edge (the card has no padding of its own) and is
    // clipped to the rounded corners. A gradient of design tokens stands in for a
    // real image.
    <div style={{ maxWidth: "24rem", marginInline: "auto" }}>
      <Card variant="elevated">
        <Card.Media>
          <AspectRatio ratio={16 / 9}>
            <div
              style={{
                background: "linear-gradient(135deg, var(--dbm-bg-brand), var(--dbm-bg-info))",
                height: "100%",
                width: "100%",
              }}
            />
          </AspectRatio>
        </Card.Media>
        <DemoSections title="Mountain retreat" body="Three nights in a quiet valley, with guided hikes and a sauna." />
      </Card>
    </div>
  ),
};

export const InteractiveLink: Story = {
  name: "Interactive — the whole card is a link",
  argTypes: noControls,
  render: () => (
    <div style={{ maxWidth: "24rem", marginInline: "auto" }}>
      <Card asChild interactive variant="elevated">
        <a href="#team-plan" onClick={(event) => event.preventDefault()}>
          <Card.Header>
            <Heading level={3} size="md">
              Team plan
            </Heading>
            <Badge tone="success" size="sm">
              Active
            </Badge>
          </Card.Header>
          <Card.Body>
            <Text size="sm" color="secondary">
              The whole card is one link — hover it, focus it with Tab, press it.
            </Text>
          </Card.Body>
        </a>
      </Card>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: /Team plan/ });
    await userEvent.tab();
    await expect(link).toHaveFocus();
    // The focus ring is an outline drawn on the card itself.
    await expect(getComputedStyle(link).outlineStyle).toBe("solid");
    await expect(parseFloat(getComputedStyle(link).outlineWidth)).toBeGreaterThan(0);
  },
};

export const FooterAlignment: Story = {
  name: "Footer alignment",
  argTypes: noControls,
  render: () => (
    <div style={{ ...gridStyle(2), maxWidth: "48rem", marginInline: "auto" }}>
      {(["start", "center", "end", "between"] as CardFooterAlign[]).map((align) => (
        <div key={align} style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
          <Text size="sm" weight="semibold">
            align=&quot;{align}&quot;
          </Text>
          <Card>
            <Card.Body>
              <Text size="sm" color="secondary">
                Footer content is laid out along the row.
              </Text>
            </Card.Body>
            <Card.Footer align={align}>
              <Button variant="tertiary" size="sm">
                Cancel
              </Button>
              <Button size="sm">Save</Button>
            </Card.Footer>
          </Card>
        </div>
      ))}
    </div>
  ),
};

export const EqualHeight: Story = {
  name: "Equal-height cards (footers line up)",
  argTypes: noControls,
  render: () => (
    // Three cards of very different body lengths in one grid row: each stretches
    // to the row's height, and because `Card.Body` grows to fill the spare space,
    // every footer sits at the bottom.
    <div style={{ ...gridStyle(3), maxWidth: "60rem", marginInline: "auto" }} data-testid="equal-height-grid">
      <DemoCard>
        <DemoSections title="Starter" body="One project." />
      </DemoCard>
      <DemoCard>
        <DemoSections
          title="Team"
          body="Up to ten members, unlimited projects, shared workspaces, priority email support, and role-based permissions for every project."
        />
      </DemoCard>
      <DemoCard>
        <DemoSections title="Business" body="Everything in Team, plus single sign-on and audit logs." />
      </DemoCard>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const footers = [...canvasElement.querySelectorAll<HTMLElement>("[data-testid=equal-height-grid] > div > div:last-child")];
    await expect(footers.length).toBe(3);
    const bottoms = footers.map((footer) => Math.round(footer.getBoundingClientRect().bottom));
    // Every footer ends at the same y — the cards are equal height and the body
    // filled the spare room above each footer.
    await expect(new Set(bottoms).size).toBe(1);
  },
};

export const WithTable: Story = {
  name: "Composition — a ghost table inside a card",
  argTypes: noControls,
  render: () => (
    // `Table`'s `ghost` variant exists for exactly this: a table inside a
    // container that already provides the boundary.
    <div style={demoContainerStyle}>
      <Card>
        <Card.Header>
          <Heading level={3} size="md">
            Recent invoices
          </Heading>
          <Button variant="secondary" size="sm">
            View all
          </Button>
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
      </Card>
    </div>
  ),
};
