import {
  CheckCircleIcon,
  InfoIcon,
  MagnifyingGlassIcon,
  RocketLaunchIcon,
  TrayIcon,
  WarningCircleIcon,
  WarningIcon,
} from "@dbm-design-system/icons";
import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import type { CSSProperties } from "react";
import { Button } from "../../atoms/Button";
import { Heading } from "../../atoms/Heading";
import { Text } from "../../atoms/Text";
import { Card } from "../Card";
import { Table } from "../Table";
import { EmptyState } from "./EmptyState";
import { emptyStatePlaygroundSnippet, emptyStateSnippets } from "./EmptyState.snippets";
import type {
  EmptyStateAlign,
  EmptyStateSize,
  EmptyStateTone,
  EmptyStateVariant,
} from "./EmptyState.types";

// `EmptyState`'s own root props get hand-written argTypes here (this meta has no
// `component`, so docgen doesn't supply them) — mirroring `Card`'s and `Table`'s
// own approach. `EmptyState.Icon`/`Title`/`Description`/`Actions` each get their
// own Properties table via a hidden docs-only stories file (guidelines/adr/0013),
// where their argTypes are auto-resolved from real docgen.
interface PlaygroundArgs {
  variant: EmptyStateVariant;
  tone: EmptyStateTone;
  size: EmptyStateSize;
  align: EmptyStateAlign;
  actions: boolean;
  role: string;
  "aria-label": string;
  "aria-labelledby": string;
  "aria-describedby": string;
  id: string;
  className: string;
  style: CSSProperties;
  "data-testid": string;
}

const allVariants: EmptyStateVariant[] = ["ghost", "outlined", "dashed", "filled"];
const allSizes: EmptyStateSize[] = ["xs", "sm", "md", "lg", "xl"];

// A story-layout wrapper — a plain CSS grid, not the `Grid` molecule, so these
// demos don't depend on `Grid`'s own API.
const gridStyle = (columns: number): CSSProperties => ({
  display: "grid",
  gap: "var(--dbm-space-4)",
  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
});

const demoContainerStyle = { maxWidth: "48rem", marginInline: "auto" } as const;
const labelledColumn: CSSProperties = { display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" };

// A small illustration drawn from design tokens, standing in for a real image
// file, so the "With an illustration" story needs no asset.
const DemoIllustration = () => (
  <svg width="160" height="120" viewBox="0 0 160 120" aria-hidden="true">
    <rect x="20" y="30" width="120" height="76" rx="12" fill="var(--dbm-bg-neutral-subtle)" stroke="var(--dbm-border-neutral)" strokeWidth="2" />
    <path d="M20 62h34l8 14h36l8-14h34" fill="none" stroke="var(--dbm-border-neutral)" strokeWidth="2" strokeLinejoin="round" />
    <circle cx="124" cy="28" r="14" fill="var(--dbm-bg-brand-subtle)" stroke="var(--dbm-border-brand)" strokeWidth="2" />
  </svg>
);

// Every fixed-render story below ignores the Playground's own `args`, so each one
// suppresses every root-prop control it doesn't consume (a story-level `argTypes`
// entry merges over the meta-level one per key) — otherwise the Controls panel
// would show live-looking controls that silently do nothing.
const noControls: Record<keyof PlaygroundArgs, { control: false }> = {
  variant: { control: false },
  tone: { control: false },
  size: { control: false },
  align: { control: false },
  actions: { control: false },
  role: { control: false },
  "aria-label": { control: false },
  "aria-labelledby": { control: false },
  "aria-describedby": { control: false },
  id: { control: false },
  className: { control: false },
  style: { control: false },
  "data-testid": { control: false },
};

const meta: Meta<PlaygroundArgs> = {
  title: "Molecules/Data Display/EmptyState",
  parameters: { layout: "padded" },
  argTypes: {
    variant: {
      control: "select",
      options: ["ghost", "outlined", "dashed", "filled"],
      description:
        "The surface treatment: ghost (no border or fill — for a page, or inside a container that already draws a boundary), outlined (a solid border), dashed (a dashed border — the classic 'nothing here yet' placeholder), or filled (a subtle neutral fill).",
      table: { defaultValue: { summary: "'ghost'" } },
    },
    tone: {
      control: "select",
      options: ["neutral", "brand", "info", "success", "warning", "danger"],
      description:
        "A colour accent for the icon badge. neutral (the default) is uncoloured; brand follows the active Purple/Emerald theme; success, warning, danger, and info are fixed status colours. Decorative reinforcement only — put the meaning in the title and description.",
      table: { defaultValue: { summary: "'neutral'" } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description:
        "Padding, spacing, and the size of the icon and text. xs and sm suit a table cell or a narrow panel; lg and xl suit an empty state that is the main content of a page.",
      table: { defaultValue: { summary: "'md'" } },
    },
    align: {
      control: "radio",
      options: ["center", "start"],
      description:
        "Whether the content is centred (the usual look) or flush with the inline start edge — the left in left-to-right text, the right in right-to-left — with the text aligned the same way.",
      table: { defaultValue: { summary: "'center'" } },
    },
    actions: {
      control: "boolean",
      description:
        "Storybook only — not an EmptyState prop. Shows a demo EmptyState.Actions row (a primary and a secondary button).",
      table: { disable: true },
    },
    role: {
      control: false,
      description:
        "The ARIA role. Unset by default: an empty state is static content and adds no role. When it appears in response to something the user did — a search or filter that returns nothing — pass role=\"status\" so a screen reader announces it.",
    },
    "aria-label": {
      control: false,
      description:
        "An accessible name for the empty state, for when it acts as a labelled region and has no visible title to name it.",
    },
    "aria-labelledby": {
      control: false,
      description: "The id of an element that names this empty state (e.g. its own title).",
    },
    "aria-describedby": {
      control: false,
      description: "The id of an element that describes this empty state.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this empty state, or when a test or router needs a stable anchor.",
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
    variant: "ghost",
    tone: "neutral",
    size: "md",
    align: "center",
    actions: true,
  },
  render: (args) => (
    <div style={demoContainerStyle}>
      <EmptyState variant={args.variant} tone={args.tone} size={args.size} align={args.align}>
        <EmptyState.Icon icon={TrayIcon} />
        <EmptyState.Title>No invoices yet</EmptyState.Title>
        <EmptyState.Description>Invoices you create will show up here.</EmptyState.Description>
        {args.actions && (
          <EmptyState.Actions>
            <Button size={args.size === "xs" ? "xs" : "sm"}>Create invoice</Button>
            <Button size={args.size === "xs" ? "xs" : "sm"} variant="tertiary">
              Import
            </Button>
          </EmptyState.Actions>
        )}
      </EmptyState>
    </div>
  ),
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  // The snippet is built from the live controls — only the props that differ from
  // their defaults, around a small real empty state — instead of the story's own
  // source, which a reader can't paste.
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext<PlaygroundArgs>) => emptyStatePlaygroundSnippet(context.args),
      },
    },
  },
};

export const Variants: Story = {
  name: "All variants",
  argTypes: noControls,
  parameters: { docs: { source: { code: emptyStateSnippets.variants } } },
  render: () => (
    <div style={{ ...gridStyle(2), maxWidth: "60rem", marginInline: "auto" }}>
      {allVariants.map((variant) => (
        <div key={variant} style={labelledColumn}>
          <Text size="sm" weight="semibold">
            variant=&quot;{variant}&quot;
          </Text>
          <EmptyState variant={variant} size="sm">
            <EmptyState.Icon icon={TrayIcon} />
            <EmptyState.Title>No invoices yet</EmptyState.Title>
            <EmptyState.Description>Invoices you create will show up here.</EmptyState.Description>
            <EmptyState.Actions>
              <Button size="sm">Create invoice</Button>
            </EmptyState.Actions>
          </EmptyState>
        </div>
      ))}
    </div>
  ),
};

export const Tones: Story = {
  name: "All tones",
  argTypes: noControls,
  parameters: { docs: { source: { code: emptyStateSnippets.tones } } },
  render: () => (
    <div style={{ ...gridStyle(3), maxWidth: "60rem", marginInline: "auto" }}>
      {(
        [
          ["neutral", TrayIcon, "Nothing here yet", "Items you add will show up here."],
          ["brand", RocketLaunchIcon, "Ready to start", "Create your first project to get going."],
          ["info", InfoIcon, "Nothing scheduled", "There are no announcements right now."],
          ["success", CheckCircleIcon, "You're all caught up", "There's nothing waiting for your review."],
          ["warning", WarningIcon, "No source connected", "Connect a data source to see results."],
          ["danger", WarningCircleIcon, "Something went wrong", "The list couldn't be loaded. Try again."],
        ] as const
      ).map(([tone, icon, title, description]) => (
        <div key={tone} style={labelledColumn}>
          <Text size="sm" weight="semibold">
            tone=&quot;{tone}&quot;
          </Text>
          <EmptyState tone={tone} size="sm" variant="outlined">
            <EmptyState.Icon icon={icon} />
            <EmptyState.Title>{title}</EmptyState.Title>
            <EmptyState.Description>{description}</EmptyState.Description>
          </EmptyState>
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  name: "All sizes",
  argTypes: noControls,
  parameters: { docs: { source: { code: emptyStateSnippets.sizes } } },
  render: () => (
    <div
      style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}
      data-testid="sizes"
    >
      {allSizes.map((size) => (
        <div key={size} style={labelledColumn}>
          <Text size="sm" weight="semibold">
            size=&quot;{size}&quot;
          </Text>
          <EmptyState size={size} variant="outlined">
            <EmptyState.Icon icon={TrayIcon} />
            <EmptyState.Title>No invoices yet</EmptyState.Title>
            <EmptyState.Description>Invoices you create will show up here.</EmptyState.Description>
            <EmptyState.Actions>
              <Button size={size === "xs" ? "xs" : "sm"}>Create invoice</Button>
            </EmptyState.Actions>
          </EmptyState>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const badges = [...canvasElement.querySelectorAll<HTMLElement>("[data-testid=sizes] > div > div > div:first-child")];
    await expect(badges.length).toBe(5);
    const widths = badges.map((badge) => badge.getBoundingClientRect().width);
    // Each step's icon badge is larger than the last, and round.
    for (const [index, width] of widths.entries()) {
      if (index > 0) await expect(width).toBeGreaterThan(widths[index - 1]!);
      await expect(badges[index]!.getBoundingClientRect().height).toBeCloseTo(width, 0);
    }
  },
};

export const Alignment: Story = {
  name: "Alignment",
  argTypes: noControls,
  parameters: { docs: { source: { code: emptyStateSnippets.align } } },
  render: () => (
    <div style={{ ...gridStyle(2), maxWidth: "60rem", marginInline: "auto" }} data-testid="alignment">
      {(["center", "start"] as const).map((align) => (
        <div key={align} style={labelledColumn}>
          <Text size="sm" weight="semibold">
            align=&quot;{align}&quot;
          </Text>
          <EmptyState align={align} variant="outlined" size="sm">
            <EmptyState.Icon icon={TrayIcon} />
            <EmptyState.Title>No invoices yet</EmptyState.Title>
            <EmptyState.Description>Invoices you create will show up here.</EmptyState.Description>
            <EmptyState.Actions>
              <Button size="sm">Create invoice</Button>
            </EmptyState.Actions>
          </EmptyState>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const [centred, start] = [...canvasElement.querySelectorAll<HTMLElement>("[data-testid=alignment] > div > div:last-child")];
    const centre = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      return rect.left + rect.width / 2;
    };
    const title = (root: HTMLElement) => root.querySelector("h3") as HTMLElement;
    // Centred: the title sits on the empty state's own centre line.
    await expect(Math.abs(centre(title(centred!)) - centre(centred!))).toBeLessThan(2);
    // Start: the title begins at the start edge (inside its padding), not the centre.
    const startRect = start!.getBoundingClientRect();
    const titleRect = title(start!).getBoundingClientRect();
    await expect(titleRect.left - startRect.left).toBeLessThan(startRect.width / 4);
  },
};

export const PartsOptional: Story = {
  name: "Every part is optional",
  argTypes: noControls,
  parameters: { docs: { source: { code: emptyStateSnippets.partsOptional } } },
  render: () => (
    <div style={{ ...gridStyle(2), maxWidth: "48rem", marginInline: "auto" }}>
      <EmptyState size="sm" variant="outlined">
        <EmptyState.Title>Nothing to show</EmptyState.Title>
      </EmptyState>
      <EmptyState size="sm" variant="outlined">
        <EmptyState.Icon icon={TrayIcon} />
        <EmptyState.Title>No files</EmptyState.Title>
        <EmptyState.Description>Drag a file here to upload it.</EmptyState.Description>
      </EmptyState>
    </div>
  ),
};

export const Illustration: Story = {
  name: "With an illustration",
  argTypes: noControls,
  parameters: { docs: { source: { code: emptyStateSnippets.illustration } } },
  render: () => (
    // Anything placed among the parts is laid out in the same column, so an
    // illustration simply takes the place of `EmptyState.Icon`.
    <div style={demoContainerStyle}>
      <EmptyState size="lg">
        <DemoIllustration />
        <EmptyState.Title>Your inbox is empty</EmptyState.Title>
        <EmptyState.Description>New messages will appear here.</EmptyState.Description>
      </EmptyState>
    </div>
  ),
};

export const SearchNoResults: Story = {
  name: "Search with no results — announced as a status",
  argTypes: noControls,
  parameters: { docs: { source: { code: emptyStateSnippets.searchNoResults } } },
  render: () => (
    // `role="status"` is for an empty state that appears because of something the
    // user did: a screen reader announces it when it's inserted.
    <div style={demoContainerStyle}>
      <EmptyState role="status" variant="dashed">
        <EmptyState.Icon icon={MagnifyingGlassIcon} />
        <EmptyState.Title>No results for “fjord”</EmptyState.Title>
        <EmptyState.Description>Check the spelling, or try a broader search term.</EmptyState.Description>
        <EmptyState.Actions>
          <Button variant="secondary" size="sm">
            Clear search
          </Button>
        </EmptyState.Actions>
      </EmptyState>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const status = canvas.getByRole("status");
    // The live region carries the whole message, and the icon stays out of the
    // accessibility tree.
    await expect(status).toHaveTextContent("No results for “fjord”");
    await expect(status.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    await expect(canvas.getByRole("heading", { level: 3 })).toBeInTheDocument();
  },
};

export const InCard: Story = {
  name: "Composition — inside a card",
  argTypes: noControls,
  parameters: { docs: { source: { code: emptyStateSnippets.inCard } } },
  render: () => (
    // A ghost empty state draws no border of its own, so it doesn't double up
    // inside a container that already has one.
    <div style={{ maxWidth: "32rem", marginInline: "auto" }}>
      <Card>
        <Card.Header>
          <Heading level={3} size="md">
            Recent invoices
          </Heading>
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
      </Card>
    </div>
  ),
};

export const InTable: Story = {
  name: "Composition — inside a table",
  argTypes: noControls,
  parameters: { docs: { source: { code: emptyStateSnippets.inTable } } },
  render: () => (
    // `Table.Empty` is the message row of a table with no rows; it takes any
    // content, so a small empty state fits inside it.
    <div style={demoContainerStyle}>
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
      </Table>
    </div>
  ),
};
