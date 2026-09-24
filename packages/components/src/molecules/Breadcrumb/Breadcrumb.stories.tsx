import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import type { CSSProperties } from "react";
import { HouseIcon, KeyboardIcon } from "@dbm-design-system/icons";
import { Text } from "../../atoms/Text";
import { Breadcrumb } from "./Breadcrumb";
import { breadcrumbPlaygroundSnippet, breadcrumbSnippets } from "./Breadcrumb.snippets";
import type { BreadcrumbProps, BreadcrumbSeparator, BreadcrumbSize } from "./Breadcrumb.types";

// `Breadcrumb.Item`, `Breadcrumb.Link` and `Breadcrumb.Page` each get their own
// Properties table via a hidden docs-only stories file (guidelines/adr/0013),
// where their argTypes are auto-resolved from real docgen.
interface PlaygroundArgs {
  size: BreadcrumbSize;
  separator: string;
  // A text control: "" means "not set" (the trail never collapses).
  maxItems: number | "";
  itemsBeforeCollapse: number;
  itemsAfterCollapse: number;
  "aria-label": string;
  dir: "ltr" | "rtl";
  "aria-labelledby": string;
  id: string;
  className: string;
  style: CSSProperties;
  "data-testid": string;
  labels: BreadcrumbProps["labels"];
  children: BreadcrumbProps["children"];
}

const demoContainerStyle = { maxWidth: "48rem" } as const;

const trailItems = [
  ["Home", "/"],
  ["Products", "/products"],
  ["Keyboards", "/products/keyboards"],
  ["Mechanical", "/products/keyboards/mechanical"],
  ["Switches", "/products/keyboards/mechanical/switches"],
  ["Linear", "/products/keyboards/mechanical/switches/linear"],
] as const;

type DemoTrailProps = Omit<BreadcrumbProps, "children"> & { count?: number };

/** A small, real trail the gallery stories vary: links, then the current page last. */
const DemoTrail = ({ count = 4, ...props }: DemoTrailProps) => (
  <Breadcrumb {...props}>
    {trailItems.slice(0, count).map(([label, href], index) => (
      <Breadcrumb.Item key={href}>
        {index === count - 1 ? (
          <Breadcrumb.Page>{label}</Breadcrumb.Page>
        ) : (
          <Breadcrumb.Link href={href}>{label}</Breadcrumb.Link>
        )}
      </Breadcrumb.Item>
    ))}
  </Breadcrumb>
);

// A fixed-render story ignores its own args, so every control it can't honour is
// turned off (07-storybook-and-documentation-standards.md §5).
const noControls = {
  size: { control: false },
  separator: { control: false },
  maxItems: { control: false },
  itemsBeforeCollapse: { control: false },
  itemsAfterCollapse: { control: false },
  "aria-label": { control: false },
  dir: { control: false },
} as const;

const meta: Meta<PlaygroundArgs> = {
  title: "Molecules/Navigation/Breadcrumb",
  parameters: { layout: "padded" },
  argTypes: {
    children: {
      control: false,
      description:
        "The trail, in order from the top of the site down: one Breadcrumb.Item per level, the last holding Breadcrumb.Page.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The size of the text, icons and gaps.",
      table: { defaultValue: { summary: '"md"' } },
    },
    separator: {
      control: "select",
      options: ["chevron", "slash", "›", "•"],
      description:
        'What sits between two items: "chevron" (the default, flips under right-to-left text), "slash", or any string or element. Always hidden from assistive technology.',
      table: { defaultValue: { summary: '"chevron"' } },
    },
    maxItems: {
      control: "number",
      placeholder: "off",
      description:
        'Collapses a long trail: with more items than this, the middle is replaced by a "…" button that shows them all when used. Left out, the trail never collapses and wraps instead.',
    },
    itemsBeforeCollapse: {
      control: "number",
      description: 'How many items stay visible at the start of a collapsed trail, before the "…" button.',
      table: { defaultValue: { summary: "1" } },
    },
    itemsAfterCollapse: {
      control: "number",
      description:
        'How many items stay visible at the end of a collapsed trail, after the "…" button — always at least 1, since the last item is the current page.',
      table: { defaultValue: { summary: "2" } },
    },
    labels: {
      control: false,
      description:
        'The text the component supplies itself, each part replaceable: navigation (the nav\'s accessible name, "Breadcrumb") and expand (a function of how many items are hidden, naming the "…" button).',
    },
    "aria-label": {
      control: "text",
      description:
        "The nav's accessible name, overriding labels.navigation. Give each breadcrumb a distinct name when a page holds more than one.",
    },
    "aria-labelledby": {
      control: false,
      description: "The id of a visible element that names the nav, in place of aria-label.",
    },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description: "Text direction, a native attribute passed to the nav: mirrors the trail and flips the chevron.",
    },
    id: {
      control: false,
      description: "Standard DOM id, on the nav.",
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
    size: "md",
    separator: "chevron",
    maxItems: "",
    itemsBeforeCollapse: 1,
    itemsAfterCollapse: 2,
    "aria-label": "Breadcrumb",
    dir: "ltr",
  },
  render: (args) => {
    const maxItems = args.maxItems === "" ? undefined : Number(args.maxItems);
    const collapsing = maxItems !== undefined && maxItems > 0;
    return (
      <div style={demoContainerStyle}>
        <DemoTrail
          // Keyed by what changes the collapse, so a trail the reader expanded starts over when a control changes.
          key={`${String(collapsing)}-${String(maxItems)}-${args.itemsBeforeCollapse}-${args.itemsAfterCollapse}`}
          count={collapsing ? 6 : 4}
          size={args.size}
          separator={args.separator as BreadcrumbSeparator}
          maxItems={collapsing ? maxItems : undefined}
          itemsBeforeCollapse={args.itemsBeforeCollapse}
          itemsAfterCollapse={args.itemsAfterCollapse}
          aria-label={args["aria-label"]}
          dir={args.dir}
        />
      </div>
    );
  },
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => breadcrumbPlaygroundSnippet(context.args),
      },
    },
  },
};

export const Sizes: Story = {
  name: "All sizes",
  argTypes: noControls,
  parameters: { docs: { source: { code: breadcrumbSnippets.sizes } } },
  render: () => (
    <div style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-5)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <div key={size}>
          <Text size="sm" weight="semibold" style={{ marginBlockEnd: "var(--dbm-space-1)" }}>
            size=&quot;{size}&quot;
          </Text>
          <DemoTrail size={size} aria-label={`Breadcrumb (${size})`} />
        </div>
      ))}
    </div>
  ),
};

export const Separators: Story = {
  name: "Separators",
  argTypes: noControls,
  parameters: { docs: { source: { code: breadcrumbSnippets.separators } } },
  render: () => (
    <div style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }}>
      {(
        [
          ["chevron", "chevron"],
          ["slash", "slash"],
          ["›", "›"],
          ["•", "•"],
        ] as const
      ).map(([label, separator]) => (
        <div key={label}>
          <Text size="sm" weight="semibold" style={{ marginBlockEnd: "var(--dbm-space-1)" }}>
            separator=&quot;{label}&quot;
          </Text>
          <DemoTrail separator={separator} aria-label={`Breadcrumb (${label})`} />
        </div>
      ))}
    </div>
  ),
};

export const WithIcons: Story = {
  name: "With icons",
  argTypes: noControls,
  parameters: { docs: { source: { code: breadcrumbSnippets.icons } } },
  render: () => (
    <div style={demoContainerStyle}>
      <Breadcrumb>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/" icon={HouseIcon}>
            Home
          </Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/products">Products</Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/products/keyboards">Keyboards</Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Breadcrumb.Page icon={KeyboardIcon}>Mechanical</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb>
    </div>
  ),
};

export const Collapsed: Story = {
  name: "Collapsed with maxItems",
  argTypes: noControls,
  parameters: { docs: { source: { code: breadcrumbSnippets.collapsed } } },
  render: () => (
    <div style={demoContainerStyle}>
      <DemoTrail count={6} maxItems={4} />
    </div>
  ),
};

export const CollapseWindow: Story = {
  name: "Choosing what stays visible",
  argTypes: noControls,
  parameters: { docs: { source: { code: breadcrumbSnippets.collapseWindow } } },
  render: () => (
    <div style={demoContainerStyle}>
      <DemoTrail count={6} maxItems={4} itemsBeforeCollapse={2} itemsAfterCollapse={1} />
    </div>
  ),
};

export const AsRouterLink: Story = {
  name: "With a router's link (asChild)",
  argTypes: noControls,
  parameters: { docs: { source: { code: breadcrumbSnippets.router } } },
  render: () => (
    <div style={demoContainerStyle}>
      <Breadcrumb>
        <Breadcrumb.Item>
          <Breadcrumb.Link asChild href="/">
            {/* Stands in for a router's own link component. */}
            <a href="/" onClick={(event) => event.preventDefault()}>
              Home
            </a>
          </Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Breadcrumb.Page>Products</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb>
    </div>
  ),
};

export const DisabledLink: Story = {
  name: "A disabled link",
  argTypes: noControls,
  parameters: { docs: { source: { code: breadcrumbSnippets.disabledLink } } },
  render: () => (
    <div style={demoContainerStyle}>
      <Breadcrumb>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/">Home</Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/archive" disabled>
            Archive
          </Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Breadcrumb.Page>Issue 42</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb>
    </div>
  ),
};

export const ExternalLink: Story = {
  name: "An external link",
  argTypes: noControls,
  parameters: { docs: { source: { code: breadcrumbSnippets.externalLink } } },
  render: () => (
    <div style={demoContainerStyle}>
      <Breadcrumb>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="https://example.com/docs">Docs</Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Breadcrumb.Page>Getting started</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb>
    </div>
  ),
};

export const LongLabels: Story = {
  name: "Long labels wrap",
  argTypes: noControls,
  parameters: { docs: { source: { code: breadcrumbSnippets.longLabels } } },
  render: () => (
    <div data-testid="long-labels" style={{ maxWidth: "24rem", resize: "horizontal", overflow: "auto" }}>
      <Breadcrumb>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/">Home</Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/licensing">Enterprise software licensing and procurement</Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/licensing/volume">
            Volume agreements for education and non-profit organisations
          </Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Breadcrumb.Page>Renewal terms and conditions for the current financial year</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb>
    </div>
  ),
};

export const NamedNav: Story = {
  name: "Naming the navigation",
  argTypes: noControls,
  parameters: { docs: { source: { code: breadcrumbSnippets.namedNav } } },
  render: () => (
    <div style={demoContainerStyle}>
      <DemoTrail aria-label="Product path" />
    </div>
  ),
};

export const Translated: Story = {
  name: "Translated text",
  argTypes: noControls,
  parameters: { docs: { source: { code: breadcrumbSnippets.translated } } },
  render: () => (
    <div style={demoContainerStyle}>
      <DemoTrail
        count={6}
        maxItems={4}
        labels={{ navigation: "Fil d'Ariane", expand: (count) => `Afficher ${count} pages masquées` }}
      />
    </div>
  ),
};

export const RightToLeft: Story = {
  name: "Right-to-left",
  argTypes: noControls,
  parameters: { docs: { source: { code: breadcrumbSnippets.rightToLeft } } },
  render: () => (
    <div style={demoContainerStyle}>
      <DemoTrail dir="rtl" data-testid="rtl-trail" />
    </div>
  ),
};

// --- Real-browser tests: what jsdom can't evaluate. Hidden from the sidebar and
// the Docs page (`!dev`); each renders what it needs itself. ---

export const CollapseInteraction: Story = {
  name: "Collapsing — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div style={demoContainerStyle}>
      <DemoTrail count={6} maxItems={4} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const expand = canvas.getByRole("button", { name: "Show 3 hidden pages" });
    await userEvent.tab(); // Home
    await userEvent.tab(); // the "…" button
    await expect(expand).toHaveFocus();
    await expect(expand).toHaveStyle({ outlineStyle: "solid" });
    await userEvent.keyboard("{Enter}");
    // Focus moves to the first item it revealed instead of dropping to the top of the document.
    await waitFor(() => expect(canvas.getByRole("link", { name: "Products" })).toHaveFocus());
    await expect(canvas.getAllByRole("listitem")).toHaveLength(6);
  },
};

export const RightToLeftInteraction: Story = {
  name: "Right-to-left — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div style={demoContainerStyle}>
      <DemoTrail dir="rtl" data-testid="rtl-trail" />
      <DemoTrail data-testid="ltr-trail" aria-label="Breadcrumb (ltr)" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const first = (id: string) => {
      const nav = within(canvasElement).getByTestId(id);
      return { nav, item: within(nav).getAllByRole("listitem")[0]!, chevron: nav.querySelector("li > span svg")! };
    };
    const rtl = first("rtl-trail");
    const ltr = first("ltr-trail");
    // The first item sits at the right in right-to-left text, and at the left otherwise.
    await expect(rtl.item.getBoundingClientRect().right).toBeGreaterThan(rtl.nav.getBoundingClientRect().left + rtl.nav.getBoundingClientRect().width / 2);
    await expect(ltr.item.getBoundingClientRect().left).toBeLessThan(ltr.nav.getBoundingClientRect().left + 8);
    // The chevron is mirrored only in right-to-left text.
    await expect(getComputedStyle(rtl.chevron).transform).not.toBe("none");
    await expect(getComputedStyle(ltr.chevron).transform).toBe("none");
  },
};

export const WrapInteraction: Story = {
  name: "Wrapping — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div data-testid="narrow" style={{ width: "16rem" }}>
      <DemoTrail count={6} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByTestId("narrow");
    const nav = within(box).getByRole("navigation");
    // Wraps onto more lines rather than overflowing its container.
    await expect(nav.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
    const tops = new Set(within(box).getAllByRole("listitem").map((item) => Math.round(item.getBoundingClientRect().top)));
    await expect(tops.size).toBeGreaterThan(1);
  },
};

export const ColourInteraction: Story = {
  name: "Colours — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div style={demoContainerStyle}>
      <DemoTrail />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "Home" });
    const page = canvas.getByText("Mechanical");
    // Links are quiet by default, not the default link blue; the current page is the strongest text.
    await expect(getComputedStyle(link).color).not.toBe(getComputedStyle(page).color);
    await expect(getComputedStyle(link).textDecorationColor).toBe("rgba(0, 0, 0, 0)");
    // (The hover colour isn't asserted: Storybook's userEvent sends synthetic events, which never
    // match `:hover`.)
    await expect(getComputedStyle(link).textDecorationLine).toBe("underline");
    await expect(Number(getComputedStyle(page).fontWeight)).toBeGreaterThan(Number(getComputedStyle(link).fontWeight));
  },
};
