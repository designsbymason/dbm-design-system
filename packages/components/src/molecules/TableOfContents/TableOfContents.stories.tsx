import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { useId, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Button } from "../../atoms/Button";
import { TableOfContents } from "./TableOfContents";
import { tableOfContentsPlaygroundSnippet, tableOfContentsSnippets } from "./TableOfContents.snippets";
import type { TableOfContentsItem, TableOfContentsProps, TableOfContentsSize, TableOfContentsTone } from "./TableOfContents.types";

interface PlaygroundArgs {
  size: TableOfContentsSize;
  tone: TableOfContentsTone;
  showTitle: boolean;
  smoothScroll: boolean;
  scrollOffset: number;
  "aria-label": string;
  dir: "ltr" | "rtl";
  items: TableOfContentsProps["items"];
  contentRef: TableOfContentsProps["contentRef"];
  selector: string;
  activeId: string;
  defaultActiveId: string;
  onActiveIdChange: TableOfContentsProps["onActiveIdChange"];
  scrollContainerRef: TableOfContentsProps["scrollContainerRef"];
  labels: TableOfContentsProps["labels"];
  "aria-labelledby": string;
  id: string;
  className: string;
  style: CSSProperties;
  "data-testid": string;
}

const sections: Array<{ key: string; label: string; level: 1 | 2 | 3 | 4 }> = [
  { key: "overview", label: "Overview", level: 1 },
  { key: "installation", label: "Installation", level: 1 },
  { key: "requirements", label: "Requirements", level: 2 },
  { key: "setup", label: "Setup", level: 2 },
  { key: "usage", label: "Usage", level: 1 },
  { key: "options", label: "Options", level: 2 },
  { key: "accessibility", label: "Accessibility", level: 1 },
  { key: "related", label: "Related", level: 1 },
];

const filler =
  "A section of an article, long enough to take up some room. The outline beside it marks the section nearest the top of the scrolling box as it moves, and a click on an entry scrolls straight to its section.";

const boxStyle: CSSProperties = {
  blockSize: "18rem",
  flex: "1 1 18rem",
  minInlineSize: 0,
  overflow: "auto",
  border: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
  borderRadius: "var(--dbm-radius-md)",
};

/**
 * An article in a scrolling box with an outline beside it. Ids carry a prefix of their own, since every story on a
 * Docs page shares one document and an id must be unique in it.
 */
function DemoPage({
  mode = "items",
  stickyHeader = false,
  tocProps,
  prefix: forcedPrefix,
  children,
}: {
  mode?: "items" | "scan";
  stickyHeader?: boolean;
  tocProps?: Partial<TableOfContentsProps>;
  prefix?: string;
  children?: ReactNode;
}) {
  const generated = useId().replace(/:/g, "");
  const prefix = forcedPrefix ?? generated;
  const boxRef = useRef<HTMLDivElement>(null);
  const items: TableOfContentsItem[] = sections.map((section) => ({ id: `${prefix}-${section.key}`, label: section.label, level: section.level }));
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-6)", alignItems: "flex-start", maxInlineSize: "48rem" }}>
      <div style={{ flex: "0 0 12rem", minInlineSize: 0 }}>
        <TableOfContents
          {...(mode === "items" ? { items } : { contentRef: boxRef })}
          scrollContainerRef={boxRef}
          scrollOffset={stickyHeader ? 40 : 0}
          {...tocProps}
        />
        {children}
      </div>
      {/* A scrolling region is a tab stop and named, so a keyboard user can scroll it. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must be keyboard-focusable. */}
      <div ref={boxRef} tabIndex={0} role="region" aria-label="Article" style={boxStyle} data-testid="article">
        {stickyHeader && (
          <div
            style={{
              position: "sticky",
              insetBlockStart: 0,
              blockSize: "40px",
              background: "var(--dbm-bg-neutral-subtle)",
              padding: "var(--dbm-space-2) var(--dbm-space-4)",
              color: "var(--dbm-text-primary)",
            }}
          >
            Sticky header
          </div>
        )}
        <div style={{ padding: "var(--dbm-space-4)" }}>
          {sections.map((section) => {
            const Tag = section.level === 1 ? "h2" : "h3";
            return (
              <section key={section.key} style={{ marginBlockEnd: "var(--dbm-space-6)" }}>
                <Tag id={`${prefix}-${section.key}`} style={{ margin: 0, color: "var(--dbm-text-primary)", fontFamily: "var(--dbm-font-family-primary)" }}>
                  {section.label}
                </Tag>
                <p style={{ color: "var(--dbm-text-secondary)", fontFamily: "var(--dbm-font-family-primary)" }}>{filler}</p>
                <p style={{ color: "var(--dbm-text-secondary)", fontFamily: "var(--dbm-font-family-primary)" }}>{filler}</p>
              </section>
            );
          })}
          {/* Room after the last section, so every section can reach the top of the box. */}
          <div style={{ blockSize: "12rem" }} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

/**
 * Wraps an outline whose entries point at ids that aren't on the page (a static demo): a click is cancelled before the
 * outline sees it, so the browser doesn't follow `#id` and move the Storybook page.
 */
function Static({ children }: { children: ReactNode }) {
  return <div onClickCapture={(event) => event.preventDefault()}>{children}</div>;
}

// A fixed-render story ignores its own args, so every control it can't honour is turned off
// (07-storybook-and-documentation-standards.md §5).
const noControls = {
  size: { control: false },
  tone: { control: false },
  showTitle: { control: false },
  smoothScroll: { control: false },
  scrollOffset: { control: false },
  "aria-label": { control: false },
  dir: { control: false },
} as const;

const meta: Meta<PlaygroundArgs> = {
  title: "Molecules/Navigation/TableOfContents",
  parameters: { layout: "padded" },
  argTypes: {
    items: {
      control: false,
      description:
        "The entries, written out: each an object with id (the element it points at; the link goes to #id), label (its text) and level (1 to 4, indented one step each, default 1). Leave it out to read them from the page. An empty list renders nothing.",
    },
    contentRef: {
      control: false,
      description:
        "With no items, the element whose headings make the outline; left out, the whole document is searched. Headings are read in the browser, so a server-rendered page has no outline until it loads, and a heading with no id is skipped.",
    },
    selector: {
      control: false,
      description:
        "With no items, which elements are entries, as a CSS selector. An h1 to h6 is indented by how far its level is below the highest found; any other element is top level, or takes its level from data-toc-level.",
      table: { defaultValue: { summary: '"h2, h3"' } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The size of the text and spacing.",
      table: { defaultValue: { summary: '"md"' } },
    },
    tone: {
      control: "select",
      options: ["brand", "neutral"],
      description:
        "The colour of the current entry and its marker: brand (the brand theme's accent) or neutral (primary text and a strong neutral marker). Place a brand outline on a surface, not on the canvas; neutral is safe on either.",
      table: { defaultValue: { summary: '"brand"' } },
    },
    showTitle: {
      control: "boolean",
      description: "Shows the heading above the list. Hidden, the list keeps its name for screen readers.",
      table: { defaultValue: { summary: "true" } },
    },
    activeId: {
      control: false,
      description:
        "The id of the entry marked as current, controlled; pair it with onActiveIdChange. While it is set, scrolling no longer changes the marked entry on its own.",
    },
    defaultActiveId: {
      control: false,
      description:
        "The id of the entry marked as current at first, uncontrolled. Afterwards the outline follows the scroll position.",
    },
    onActiveIdChange: {
      control: false,
      description: "Called with the id (or undefined) when the current entry changes, by scrolling or by a click.",
    },
    scrollContainerRef: {
      control: false,
      description:
        "A ref to the scrolling element the headings live in; left out, the page itself. It sets what is measured and what a click scrolls.",
    },
    scrollOffset: {
      control: "number",
      description:
        "How far from the top of the scrolling area, in pixels, a heading counts as reached and a click leaves it: the height of a sticky header over the content.",
      table: { defaultValue: { summary: "0" } },
    },
    smoothScroll: {
      control: "boolean",
      description: "Scrolls smoothly on a click. It never does while the person prefers reduced motion.",
      table: { defaultValue: { summary: "true" } },
    },
    labels: {
      control: false,
      description:
        'The text the component supplies itself, each part replaceable: title (the visible heading, "On this page") and navigation (the nav\'s accessible name while the heading is hidden, "Table of contents").',
    },
    "aria-label": {
      control: "text",
      description:
        "The nav's accessible name, replacing the one from labels. Give each outline a distinct name when a page holds more than one.",
    },
    "aria-labelledby": {
      control: false,
      description: "The id of an element that names the nav, replacing the heading and labels.navigation.",
    },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description: "Text direction, a native attribute passed to the nav: the marker and indentation follow it.",
    },
    id: { control: false, description: "Standard DOM id, on the nav." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: {
    size: "md",
    tone: "brand",
    showTitle: true,
    smoothScroll: true,
    scrollOffset: 0,
    "aria-label": "",
    dir: "ltr",
  },
  render: (args) => (
    <DemoPage
      tocProps={{
        size: args.size,
        tone: args.tone,
        showTitle: args.showTitle,
        smoothScroll: args.smoothScroll,
        scrollOffset: args.scrollOffset,
        "aria-label": args["aria-label"] || undefined,
        dir: args.dir,
      }}
    />
  ),
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => tableOfContentsPlaygroundSnippet(context.args),
      },
    },
  },
};

export const Sizes: Story = {
  name: "All sizes",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableOfContentsSnippets.sizes } } },
  render: () => (
    <Static>
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-8)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <TableOfContents
          key={size}
          size={size}
          aria-label={`Outline (${size})`}
          showTitle={false}
          defaultActiveId={`${size}-b`}
          items={[
            { id: `${size}-a`, label: `size="${size}"` },
            { id: `${size}-b`, label: "Current entry" },
            { id: `${size}-c`, label: "Nested entry", level: 2 },
          ]}
        />
      ))}
    </div>
    </Static>
  ),
};

export const Tones: Story = {
  argTypes: noControls,
  parameters: { docs: { source: { code: tableOfContentsSnippets.tones } } },
  render: () => (
    <Static>
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-8)" }}>
      {(["brand", "neutral"] as const).map((tone) => (
        <TableOfContents
          key={tone}
          tone={tone}
          aria-label={`Outline (${tone})`}
          defaultActiveId={`${tone}-b`}
          items={[
            { id: `${tone}-a`, label: `tone="${tone}"` },
            { id: `${tone}-b`, label: "Current entry" },
            { id: `${tone}-c`, label: "Another entry" },
          ]}
        />
      ))}
    </div>
    </Static>
  ),
};

export const Nested: Story = {
  name: "Nested levels",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableOfContentsSnippets.nested } } },
  render: () => (
    <Static>
    <TableOfContents
      defaultActiveId="nested-setup"
      items={[
        { id: "nested-installation", label: "Installation" },
        { id: "nested-requirements", label: "Requirements", level: 2 },
        { id: "nested-setup", label: "Setup", level: 2 },
        { id: "nested-options", label: "Options", level: 3 },
        { id: "nested-usage", label: "Usage" },
      ]}
    />
    </Static>
  ),
};

export const ReadFromPage: Story = {
  name: "Read from the page",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableOfContentsSnippets.readFromPage } } },
  render: () => <DemoPage mode="scan" />,
};

export const InAScrollingBox: Story = {
  name: "In a scrolling box",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableOfContentsSnippets.scrollContainer } } },
  render: () => <DemoPage />,
};

export const StickyHeader: Story = {
  name: "Under a sticky header",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableOfContentsSnippets.stickyOffset } } },
  render: () => <DemoPage stickyHeader />,
};

export const WithoutTitle: Story = {
  name: "Without the title",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableOfContentsSnippets.withoutTitle } } },
  render: () => (
    <Static>
    <TableOfContents
      showTitle={false}
      defaultActiveId="plain-b"
      items={[
        { id: "plain-a", label: "First" },
        { id: "plain-b", label: "Second" },
      ]}
    />
    </Static>
  ),
};

export const Controlled: Story = {
  argTypes: noControls,
  parameters: { docs: { source: { code: tableOfContentsSnippets.controlled } } },
  render: function Render() {
    const [active, setActive] = useState<string | undefined>("controlled-usage");
    const ids = ["controlled-overview", "controlled-usage", "controlled-accessibility"];
    return (
      <Static>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-6)", alignItems: "flex-start" }}>
        <TableOfContents
          activeId={active}
          onActiveIdChange={setActive}
          items={[
            { id: ids[0] as string, label: "Overview" },
            { id: ids[1] as string, label: "Usage" },
            { id: ids[2] as string, label: "Accessibility" },
          ]}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)", alignItems: "flex-start" }}>
          {ids.map((id) => (
            <Button key={id} size="xs" variant="secondary" onClick={() => setActive(id)}>
              {`Mark ${id.replace("controlled-", "")}`}
            </Button>
          ))}
        </div>
      </div>
      </Static>
    );
  },
};

export const Translated: Story = {
  argTypes: noControls,
  parameters: { docs: { source: { code: tableOfContentsSnippets.translated } } },
  render: () => (
    <Static>
    <TableOfContents
      labels={{ title: "Sur cette page", navigation: "Table des matières" }}
      defaultActiveId="fr-b"
      items={[
        { id: "fr-a", label: "Présentation" },
        { id: "fr-b", label: "Utilisation" },
      ]}
    />
    </Static>
  ),
};

export const RightToLeft: Story = {
  name: "Right-to-left",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableOfContentsSnippets.rightToLeft } } },
  render: () => (
    <Static>
    <div style={{ maxInlineSize: "16rem" }}>
      <TableOfContents
        dir="rtl"
        defaultActiveId="rtl-b"
        items={[
          { id: "rtl-a", label: "نظرة عامة" },
          { id: "rtl-b", label: "الاستخدام" },
          { id: "rtl-c", label: "الخيارات", level: 2 },
        ]}
      />
    </div>
    </Static>
  ),
};

// --- Hidden real-browser checks. `!dev` is written out on each story: the indexer reads `tags` only from a literal. ---

const currentEntry = (nav: HTMLElement) => nav.querySelector('[aria-current="location"]')?.textContent ?? null;

export const ScrollspyInteraction: Story = {
  name: "Follows the scroll and a click — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => <DemoPage prefix="spy" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole("navigation", { name: "On this page" });
    const box = canvas.getByTestId("article");
    const heading = (key: string) => canvasElement.querySelector<HTMLElement>(`#spy-${key}`) as HTMLElement;
    const topOf = (element: HTMLElement) => element.getBoundingClientRect().top - box.getBoundingClientRect().top;

    // On load, the first section is showing (a little below the top edge), so it is the one marked.
    await waitFor(() => expect(currentEntry(nav)).toBe("Overview"));

    // Scrolling the box moves the marked entry to the last heading that has reached its top.
    box.scrollTo({ top: box.scrollTop + topOf(heading("usage")), behavior: "instant" });
    await waitFor(() => expect(currentEntry(nav)).toBe("Usage"));
    box.scrollTo({ top: box.scrollTop + topOf(heading("setup")), behavior: "instant" });
    await waitFor(() => expect(currentEntry(nav)).toBe("Setup"));

    // A click scrolls to the section, leaves it at the top and marks it, with the address naming it.
    await userEvent.click(canvas.getByRole("link", { name: "Accessibility" }));
    await waitFor(() => expect(Math.abs(topOf(heading("accessibility")))).toBeLessThan(2), { timeout: 3000 });
    await waitFor(() => expect(currentEntry(nav)).toBe("Accessibility"));
    await expect(window.location.hash).toBe("#spy-accessibility");

    // The very end: the last section is the one being read even if it can't reach the top.
    box.scrollTo({ top: box.scrollHeight, behavior: "instant" });
    await waitFor(() => expect(currentEntry(nav)).toBe("Related"));
  },
};

export const KeyboardFollowInteraction: Story = {
  name: "A key press moves focus to the section — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => <DemoPage prefix="key" tocProps={{ smoothScroll: false }} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "Usage" });
    link.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(canvasElement.querySelector("#key-usage")).toHaveFocus());
    await expect(link).toHaveAttribute("aria-current", "location");
  },
};

export const SizeAndTargetInteraction: Story = {
  name: "Targets and a steady layout — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <div key={size} data-size={size}>
          <TableOfContents size={size} aria-label={size} items={[{ id: `${size}-x`, label: "First entry" }, { id: `${size}-y`, label: "A second, longer entry for its width" }]} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const size of ["xs", "sm", "md", "lg", "xl"]) {
      const nav = within(canvasElement).getByRole("navigation", { name: size });
      for (const link of within(nav).getAllByRole("link")) {
        const rect = link.getBoundingClientRect();
        await expect(rect.height, `a ${size} entry is at least 24px tall`).toBeGreaterThanOrEqual(24);
      }
    }
  },
};

export const ActiveDoesNotReflowInteraction: Story = {
  name: "The current entry does not move anything — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  // The same outline twice, in a narrow box so entries wrap, with a different entry current in each.
  render: () => (
    <div style={{ display: "flex", gap: "var(--dbm-space-6)" }}>
      {["a", "b"].map((current) => (
        <div key={current} style={{ inlineSize: "9rem" }}>
          <TableOfContents
            aria-label={`current ${current}`}
            activeId={`reflow-${current}`}
            onActiveIdChange={() => {}}
            items={[
              { id: "reflow-a", label: "A fairly long entry that wraps" },
              { id: "reflow-b", label: "Another long entry that wraps too" },
            ]}
          />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const sizes = (name: string) =>
      within(within(canvasElement).getByRole("navigation", { name })).getAllByRole("link").map((link) => {
        const { width, height } = link.getBoundingClientRect();
        return [width, height];
      });
    await expect(sizes("current b")).toEqual(sizes("current a"));
  },
};

export const RightToLeftInteraction: Story = {
  name: "Right-to-left marker on the right — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div style={{ maxInlineSize: "16rem" }}>
      <TableOfContents dir="rtl" defaultActiveId="r-a" items={[{ id: "r-a", label: "الأول" }, { id: "r-b", label: "الثاني", level: 2 }]} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByRole("navigation");
    const items = nav.querySelectorAll("li");
    const first = items[0] as HTMLElement;
    const second = items[1] as HTMLElement;
    await expect(getComputedStyle(first).borderRightWidth).not.toBe("0px");
    await expect(getComputedStyle(first).borderLeftWidth).toBe("0px");
    // The nested entry's text sits further from the marker, which is on the right.
    const firstText = (first.querySelector("a") as HTMLElement).getBoundingClientRect();
    const secondLink = second.querySelector("a") as HTMLElement;
    const range = document.createRange();
    range.selectNodeContents(secondLink);
    await expect(range.getBoundingClientRect().right).toBeLessThan(firstText.right);
  },
};
