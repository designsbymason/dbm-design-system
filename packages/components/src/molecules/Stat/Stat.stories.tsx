import { CurrencyDollarIcon, TicketIcon, UsersIcon } from "@dbm-design-system/icons";
import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import type { CSSProperties } from "react";
import { useState } from "react";
import { Button } from "../../atoms/Button";
import { Text } from "../../atoms/Text";
import { Card } from "../Card";
import { Stat } from "./Stat";
import { statPlaygroundSnippet, statSnippets } from "./Stat.snippets";
import type { StatOrientation, StatSize, StatTone, StatVariant } from "./Stat.types";

// `Stat`'s own root props get hand-written argTypes here (this meta has no
// `component`, so docgen doesn't supply them) — mirroring `EmptyState`'s and
// `Card`'s own approach. `Stat.Icon`/`Label`/`Value`/`Trend`/`Description` each
// get their own Properties table via a hidden docs-only stories file
// (guidelines/adr/0013), where their argTypes are auto-resolved from real docgen.
interface PlaygroundArgs {
  variant: StatVariant;
  tone: StatTone;
  size: StatSize;
  orientation: StatOrientation;
  trend: boolean;
  announce: boolean;
  role: string;
  "aria-label": string;
  "aria-labelledby": string;
  "aria-describedby": string;
  id: string;
  className: string;
  style: CSSProperties;
  "data-testid": string;
}

const allVariants: StatVariant[] = ["ghost", "outlined", "filled"];
const allTones: StatTone[] = ["neutral", "brand", "info", "success", "warning", "danger"];
const allSizes: StatSize[] = ["xs", "sm", "md", "lg", "xl"];

const gridStyle = (columns: number): CSSProperties => ({
  display: "grid",
  gap: "var(--dbm-space-4)",
  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
});

const demoContainerStyle = { maxWidth: "48rem", marginInline: "auto" } as const;
const labelledColumn: CSSProperties = { display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" };

// Every fixed-render story below ignores the Playground's own `args`, so each one
// suppresses every root-prop control it doesn't consume (a story-level `argTypes`
// entry merges over the meta-level one per key) — otherwise the Controls panel
// would show live-looking controls that silently do nothing.
const noControls: Record<keyof PlaygroundArgs, { control: false }> = {
  variant: { control: false },
  tone: { control: false },
  size: { control: false },
  orientation: { control: false },
  trend: { control: false },
  announce: { control: false },
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
  title: "Molecules/Data Display/Stat",
  parameters: { layout: "padded" },
  argTypes: {
    variant: {
      control: "select",
      options: ["ghost", "outlined", "filled"],
      description:
        "The surface treatment: ghost (no border or fill — for a container that already draws a boundary, such as a Card), outlined (a solid border, a self-contained stat card), or filled (a subtle neutral fill).",
      table: { defaultValue: { summary: "'ghost'" } },
    },
    tone: {
      control: "select",
      options: ["neutral", "brand", "info", "success", "warning", "danger"],
      description:
        "A colour accent for Stat.Icon's badge. neutral (the default) is uncoloured; brand follows the active Purple/Emerald theme; success, warning, danger, and info are fixed status colours. Decorative reinforcement only. Unrelated to Stat.Trend's own colour, which comes from whether the change is an improvement, not from this.",
      table: { defaultValue: { summary: "'neutral'" } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description:
        "Padding, spacing, and the size of the icon badge and text. xs and sm suit a dense dashboard grid; lg and xl suit a stat that is a card's main content.",
      table: { defaultValue: { summary: "'md'" } },
    },
    orientation: {
      control: "radio",
      options: ["vertical", "horizontal"],
      description: "Whether Stat.Icon sits above the label and value (the default) or beside them.",
      table: { defaultValue: { summary: "'vertical'" } },
    },
    trend: {
      control: "boolean",
      description: "Storybook only — not a Stat prop. Shows a demo Stat.Trend inside Stat.Value.",
      table: { disable: true },
    },
    announce: {
      control: "boolean",
      description:
        "Announces the value (and trend) to screen readers whenever their text changes after this stat is already on the page. The very first value shown is never announced. Nothing changes visually.",
      table: { defaultValue: { summary: "false" } },
    },
    role: {
      control: false,
      description:
        "The ARIA role. Unset by default: a stat is static content and adds no role. Use announce, rather than a role here, for a value that changes after mount.",
    },
    "aria-label": {
      control: false,
      description: "An accessible name for the stat, for when it acts as a labelled region.",
    },
    "aria-labelledby": {
      control: false,
      description: "The id of an element that names this stat (e.g. its own Stat.Label).",
    },
    "aria-describedby": {
      control: false,
      description: "The id of an element that describes this stat (e.g. its own Stat.Description).",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this stat, or when a test or router needs a stable anchor.",
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
    orientation: "vertical",
    trend: true,
    announce: false,
  },
  render: (args) => (
    <div style={demoContainerStyle}>
      <Stat variant={args.variant} tone={args.tone} size={args.size} orientation={args.orientation} announce={args.announce}>
        <Stat.Icon icon={UsersIcon} />
        <Stat.Label>Active users</Stat.Label>
        <Stat.Value>
          12,480
          {args.trend && <Stat.Trend value={4.2} />}
        </Stat.Value>
        <Stat.Description>vs. last month</Stat.Description>
      </Stat>
    </div>
  ),
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  // The snippet is built from the live controls — only the props that differ from
  // their defaults, around a small real stat — instead of the story's own source,
  // which a reader can't paste.
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext<PlaygroundArgs>) => statPlaygroundSnippet(context.args),
      },
    },
  },
};

export const Variants: Story = {
  name: "All variants",
  argTypes: noControls,
  parameters: { docs: { source: { code: statSnippets.variants } } },
  render: () => (
    <div style={{ ...gridStyle(3), maxWidth: "60rem", marginInline: "auto" }}>
      {allVariants.map((variant) => (
        <div key={variant} style={labelledColumn}>
          <Text size="sm" weight="semibold">
            variant=&quot;{variant}&quot;
          </Text>
          <Stat variant={variant} size="sm">
            <Stat.Icon icon={UsersIcon} />
            <Stat.Label>Active users</Stat.Label>
            <Stat.Value>
              12,480
              <Stat.Trend value={4.2} />
            </Stat.Value>
          </Stat>
        </div>
      ))}
    </div>
  ),
};

export const Tones: Story = {
  name: "All tones",
  argTypes: noControls,
  parameters: { docs: { source: { code: statSnippets.tones } } },
  render: () => (
    <div style={{ ...gridStyle(3), maxWidth: "60rem", marginInline: "auto" }}>
      {allTones.map((tone) => (
        <div key={tone} style={labelledColumn}>
          <Text size="sm" weight="semibold">
            tone=&quot;{tone}&quot;
          </Text>
          <Stat variant="outlined" tone={tone} size="sm">
            <Stat.Icon icon={UsersIcon} />
            <Stat.Label>Active users</Stat.Label>
            <Stat.Value>12,480</Stat.Value>
          </Stat>
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  name: "All sizes",
  argTypes: noControls,
  parameters: { docs: { source: { code: statSnippets.sizes } } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)", maxWidth: "40rem" }}>
      {allSizes.map((size) => (
        <div key={size} style={labelledColumn}>
          <Text size="sm" weight="semibold">
            size=&quot;{size}&quot;
          </Text>
          <Stat variant="outlined" size={size}>
            <Stat.Icon icon={UsersIcon} />
            <Stat.Label>Active users</Stat.Label>
            <Stat.Value>
              12,480
              <Stat.Trend value={4.2} />
            </Stat.Value>
          </Stat>
        </div>
      ))}
    </div>
  ),
};

export const Orientation: Story = {
  name: "Orientation",
  argTypes: noControls,
  parameters: { docs: { source: { code: statSnippets.orientation } } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)", maxWidth: "28rem" }}>
      <div style={labelledColumn}>
        <Text size="sm" weight="semibold">
          orientation=&quot;vertical&quot; (default)
        </Text>
        <Stat variant="outlined">
          <Stat.Icon icon={UsersIcon} />
          <Stat.Label>Active users</Stat.Label>
          <Stat.Value>
            12,480
            <Stat.Trend value={4.2} />
          </Stat.Value>
          <Stat.Description>vs. last month</Stat.Description>
        </Stat>
      </div>
      <div style={labelledColumn}>
        <Text size="sm" weight="semibold">
          orientation=&quot;horizontal&quot;
        </Text>
        <Stat variant="outlined" orientation="horizontal">
          <Stat.Icon icon={UsersIcon} />
          <Stat.Label>Active users</Stat.Label>
          <Stat.Value>
            12,480
            <Stat.Trend value={4.2} />
          </Stat.Value>
          <Stat.Description>vs. last month</Stat.Description>
        </Stat>
      </div>
    </div>
  ),
};

export const TrendDirections: Story = {
  name: "Trend — increase, decrease, and no change",
  argTypes: noControls,
  parameters: { docs: { source: { code: statSnippets.trendIncrease } } },
  render: () => (
    <div style={{ ...gridStyle(3), maxWidth: "48rem" }}>
      <Stat variant="outlined" size="sm">
        <Stat.Label>Active users</Stat.Label>
        <Stat.Value>
          12,480
          <Stat.Trend value={4.2} />
        </Stat.Value>
      </Stat>
      <Stat variant="outlined" size="sm">
        <Stat.Label>Churned users</Stat.Label>
        <Stat.Value>
          1,204
          <Stat.Trend value={-2.1} />
        </Stat.Value>
      </Stat>
      <Stat variant="outlined" size="sm">
        <Stat.Label>Sessions</Stat.Label>
        <Stat.Value>
          842
          <Stat.Trend value={0} />
        </Stat.Value>
      </Stat>
    </div>
  ),
};

export const TrendGoodDirection: Story = {
  name: "Trend — goodDirection for a metric where less is better",
  argTypes: noControls,
  parameters: { docs: { source: { code: statSnippets.trendGoodDirection } } },
  render: () => (
    <div style={{ ...gridStyle(2), maxWidth: "32rem" }}>
      <Stat variant="outlined" tone="danger" size="sm">
        <Stat.Icon icon={TicketIcon} />
        <Stat.Label>Open tickets</Stat.Label>
        <Stat.Value>
          58
          <Stat.Trend value={-12} goodDirection="decrease" />
        </Stat.Value>
      </Stat>
      <Stat variant="outlined" tone="danger" size="sm">
        <Stat.Icon icon={TicketIcon} />
        <Stat.Label>Open tickets</Stat.Label>
        <Stat.Value>
          74
          <Stat.Trend value={12} goodDirection="decrease" />
        </Stat.Value>
      </Stat>
    </div>
  ),
};

export const PartsOptional: Story = {
  name: "Every part is optional",
  argTypes: noControls,
  parameters: { docs: { source: { code: statSnippets.partsOptional } } },
  render: () => (
    <div style={{ ...gridStyle(2), maxWidth: "32rem" }}>
      <Stat variant="outlined" size="sm">
        <Stat.Label>Open tickets</Stat.Label>
        <Stat.Value>58</Stat.Value>
      </Stat>
      <Stat variant="outlined" size="sm">
        <Stat.Icon icon={UsersIcon} />
        <Stat.Value>12,480</Stat.Value>
      </Stat>
    </div>
  ),
};

export const InACard: Story = {
  name: "Inside a Card",
  argTypes: noControls,
  parameters: { docs: { source: { code: statSnippets.inCard } } },
  render: () => (
    <div style={{ maxWidth: "20rem" }}>
      <Card variant="outlined">
        <Card.Body>
          <Stat>
            <Stat.Icon icon={UsersIcon} />
            <Stat.Label>Active users</Stat.Label>
            <Stat.Value>
              12,480
              <Stat.Trend value={4.2} />
            </Stat.Value>
            <Stat.Description>vs. last month</Stat.Description>
          </Stat>
        </Card.Body>
      </Card>
    </div>
  ),
};

export const Grid: Story = {
  name: "Several, side by side",
  argTypes: noControls,
  parameters: { docs: { source: { code: statSnippets.grid } } },
  render: () => (
    <div style={{ ...gridStyle(3), maxWidth: "48rem" }}>
      <Stat variant="outlined" size="sm">
        <Stat.Icon icon={UsersIcon} />
        <Stat.Label>Active users</Stat.Label>
        <Stat.Value>
          12,480
          <Stat.Trend value={4.2} />
        </Stat.Value>
      </Stat>
      <Stat variant="outlined" tone="success" size="sm">
        <Stat.Icon icon={CurrencyDollarIcon} />
        <Stat.Label>Revenue</Stat.Label>
        <Stat.Value>
          $84.2K
          <Stat.Trend value={1.8} />
        </Stat.Value>
      </Stat>
      <Stat variant="outlined" tone="danger" size="sm">
        <Stat.Icon icon={TicketIcon} />
        <Stat.Label>Open tickets</Stat.Label>
        <Stat.Value>
          58
          <Stat.Trend value={-12} goodDirection="decrease" />
        </Stat.Value>
      </Stat>
    </div>
  ),
};

export const LiveUpdate: Story = {
  name: "A value that updates in place (announce)",
  argTypes: noControls,
  parameters: { docs: { source: { code: statSnippets.announce } } },
  render: function LiveUpdateStory() {
    const [count, setCount] = useState(12480);
    const [change, setChange] = useState(4.2);
    return (
      <div style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }}>
        <Stat announce data-testid="stat">
          <Stat.Icon icon={UsersIcon} />
          <Stat.Label>Active users</Stat.Label>
          <Stat.Value>
            {count.toLocaleString("en-US")}
            <Stat.Trend value={change} />
          </Stat.Value>
        </Stat>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setCount((current) => current + 236);
            setChange(1.9);
          }}
        >
          Simulate an update
        </Button>
      </div>
    );
  },
};

// --- Hidden interaction tests -------------------------------------------------
// Each one carries assertions that change state or need real timers, so it lives
// in a twin hidden from the sidebar and the Docs page (`!dev`) but still runs as
// a test — a visible story must not end somewhere different from where it
// started (07-storybook-and-documentation-standards.md §5).

export const LiveUpdateInteraction: Story = {
  ...LiveUpdate,
  name: "Live update — the first value is never announced, a later change is",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole("status");
    // Real time: `useAnnouncement`'s own fill/clear delay.
    await new Promise((resolve) => setTimeout(resolve, 150));
    // The first value was never announced.
    await expect(region).toHaveTextContent("");
    await userEvent.click(canvas.getByRole("button", { name: "Simulate an update" }));
    await waitFor(() => expect(region).toHaveTextContent(/Increased by \+1\.9/));
  },
};
