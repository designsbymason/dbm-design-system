import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { CSSProperties } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { useArgs } from "storybook/preview-api";
import { Text } from "../../atoms/Text";
import { Select } from "../Select";
import { Table } from "../Table";
import { Pagination } from "./Pagination";
import { paginationPlaygroundSnippet, paginationSnippets } from "./Pagination.snippets";
import type { PaginationAlign, PaginationCompact, PaginationSize } from "./Pagination.types";

// `Pagination`'s own props get hand-written argTypes here (this meta has no `component`, so
// docgen doesn't supply them). The Playground is controlled: `value` is a real control, and
// choosing a page in the canvas writes it back to the control.
interface PlaygroundArgs {
  pageCount: number;
  value: number;
  defaultValue: number;
  siblingCount: number;
  boundaryCount: number;
  showFirstLast: boolean;
  size: PaginationSize;
  compact: PaginationCompact;
  align: PaginationAlign;
  disabled: boolean;
  onValueChange: unknown;
  getPageHref: unknown;
  labels: unknown;
  "aria-label": string;
  "aria-labelledby": string;
  id: string;
  className: string;
  style: CSSProperties;
  "data-testid": string;
}

const allSizes: PaginationSize[] = ["xs", "sm", "md", "lg", "xl"];

const labelledColumn: CSSProperties = { display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" };
const containerStyle = { maxWidth: "48rem", marginInline: "auto" } as const;

// Every fixed-render story below ignores the Playground's own `args`, so each one suppresses every
// control it doesn't consume (a story-level `argTypes` entry merges over the meta-level one per key).
const noControls: Record<keyof PlaygroundArgs, { control: false }> = {
  pageCount: { control: false },
  value: { control: false },
  defaultValue: { control: false },
  siblingCount: { control: false },
  boundaryCount: { control: false },
  showFirstLast: { control: false },
  size: { control: false },
  compact: { control: false },
  align: { control: false },
  disabled: { control: false },
  onValueChange: { control: false },
  getPageHref: { control: false },
  labels: { control: false },
  "aria-label": { control: false },
  "aria-labelledby": { control: false },
  id: { control: false },
  className: { control: false },
  style: { control: false },
  "data-testid": { control: false },
};

const meta: Meta<PlaygroundArgs> = {
  title: "Molecules/Data Display/Pagination",
  parameters: { layout: "padded" },
  argTypes: {
    pageCount: {
      control: { type: "number", min: 0, max: 200, step: 1 },
      description:
        "How many pages there are in total. With no pages (0) the component renders nothing, so it can sit above data that hasn't arrived yet. For a list of items, this is Math.ceil(totalItems / pageSize).",
    },
    value: {
      control: { type: "number", min: 1, step: 1 },
      description:
        "The current page, starting at 1 — controlled. Pair with onValueChange to update it, or the component will appear frozen. A value outside 1 to pageCount is clamped to it. (In the Playground, choosing a page in the canvas writes it back here.)",
    },
    defaultValue: {
      control: false,
      description:
        "The starting page for an uncontrolled component, which then tracks the page itself. Ignored once value is also provided.",
      table: { defaultValue: { summary: "1" } },
    },
    onValueChange: {
      control: false,
      description:
        "Called when the user chooses another page, with the new page number and the click event. In link mode, call event.preventDefault() to handle the navigation yourself, for example with a client-side router. Not called for the page that is already current, or for a click that asks the browser to open a link elsewhere (Ctrl, Cmd, Shift, or Alt held, or the middle button).",
    },
    siblingCount: {
      control: { type: "number", min: 0, max: 5, step: 1 },
      description:
        "How many pages to show either side of the current page. The row keeps the same number of slots (2 × boundaryCount + 2 × siblingCount + 3, gaps included) wherever you are, so the controls don't shift sideways as you move through the pages.",
      table: { defaultValue: { summary: "1" } },
    },
    boundaryCount: {
      control: { type: "number", min: 0, max: 5, step: 1 },
      description: "How many pages to always show at each end.",
      table: { defaultValue: { summary: "1" } },
    },
    showFirstLast: {
      control: "boolean",
      description:
        "Adds buttons that jump straight to the first and the last page, either side of the previous and next buttons.",
      table: { defaultValue: { summary: "false" } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The size of every control in the row.",
      table: { defaultValue: { summary: "'md'" } },
    },
    compact: {
      control: "radio",
      options: ["auto", "always", "never"],
      description:
        "Whether the page numbers collapse to a \"Page 3 of 20\" summary between the previous and next buttons: only on a phone (auto), always, or never. The Docs page is wide, so auto shows the numbers here — open the 'On a phone' story to see it collapse.",
      table: { defaultValue: { summary: "'auto'" } },
    },
    align: {
      control: "radio",
      options: ["start", "center", "end"],
      description:
        "Where the controls sit across the width: centred, or flush with the start or end edge (the left or right in left-to-right text, mirrored in right-to-left) — end-aligned is the usual place for the pagination under a table.",
      table: { defaultValue: { summary: "'center'" } },
    },
    disabled: {
      control: "boolean",
      description:
        "Disables every control — while the next page is loading, say. They stay focusable (they are aria-disabled rather than natively disabled), so keyboard focus isn't lost.",
      table: { defaultValue: { summary: "false" } },
    },
    getPageHref: {
      control: false,
      description:
        "Makes each control a real link: given a page number, returns its URL. Use it when each page has its own address — a server-rendered list, or a router — so a link can be opened in a new tab, copied, or followed without JavaScript. Without it, every control is a button.",
    },
    labels: {
      control: false,
      description:
        "The text the component supplies itself — accessible names and the compact summary. Any you leave out keep their English default. Keys: navigation, previous, next, first, last, page (a function of the page number), and summary (a function of the page and the page count).",
    },
    "aria-label": {
      control: false,
      description:
        "An accessible name for the nav landmark. Defaults to labels.navigation (\"Pagination\"). Give each one on a page its own name — \"Search results\", \"Comments\" — since a screen reader lists landmarks by name.",
    },
    "aria-labelledby": {
      control: false,
      description: "The id of an element that names this landmark; takes the place of aria-label.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this component, or when a test or router needs a stable anchor.",
    },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: {
    pageCount: 20,
    value: 5,
    siblingCount: 1,
    boundaryCount: 1,
    showFirstLast: false,
    size: "md",
    compact: "auto",
    align: "center",
    disabled: false,
  },
  render: function PlaygroundRender(args) {
    const [, updateArgs] = useArgs<PlaygroundArgs>();
    return (
      <div style={containerStyle}>
        <Pagination
          pageCount={args.pageCount}
          value={args.value}
          onValueChange={(page) => updateArgs({ value: page })}
          siblingCount={args.siblingCount}
          boundaryCount={args.boundaryCount}
          showFirstLast={args.showFirstLast}
          size={args.size}
          compact={args.compact}
          align={args.align}
          disabled={args.disabled}
        />
      </div>
    );
  },
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Drive every prop live via the Controls panel below. Choosing a page in the canvas updates `value`. */
export const Playground: Story = {
  // The snippet is built from the live controls — only the props that differ from their defaults.
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext<PlaygroundArgs>) => paginationPlaygroundSnippet(context.args),
      },
    },
  },
};

export const Sizes: Story = {
  name: "All sizes",
  argTypes: noControls,
  parameters: { docs: { source: { code: paginationSnippets.sizes } } },
  render: () => (
    <div style={{ ...containerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }} data-testid="sizes">
      {allSizes.map((size) => (
        <div key={size} style={labelledColumn}>
          <Text size="sm" weight="semibold">
            size=&quot;{size}&quot;
          </Text>
          <Pagination pageCount={20} defaultValue={5} size={size} compact="never" align="start" aria-label={`Size ${size}`} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const rows = [...canvasElement.querySelectorAll<HTMLElement>("[data-testid=sizes] nav")];
    await expect(rows.length).toBe(5);
    const boxes = rows.map((nav) => nav.querySelector("button")!.getBoundingClientRect());
    // Every control is a square, and each size step is larger than the last.
    for (const [index, box] of boxes.entries()) {
      await expect(Math.abs(box.width - box.height)).toBeLessThan(1);
      if (index > 0) await expect(box.height).toBeGreaterThan(boxes[index - 1]!.height);
    }
  },
};

export const Windows: Story = {
  name: "Where you are in the pages",
  argTypes: noControls,
  parameters: { docs: { source: { code: paginationSnippets.windows } } },
  render: () => (
    // The same 20 pages with the current page at the start, the middle, and the end. The row keeps
    // the same number of slots throughout, so the controls stay put as you move.
    <div style={{ ...containerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }} data-testid="windows">
      {[1, 4, 5, 10, 16, 17, 20].map((page) => (
        <div key={page} style={labelledColumn}>
          <Text size="sm" weight="semibold">
            value={page}
          </Text>
          <Pagination pageCount={20} defaultValue={page} compact="never" align="start" aria-label={`Page ${page} of 20`} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const navs = [...canvasElement.querySelectorAll<HTMLElement>("[data-testid=windows] nav")];
    const expected = [
      ["1", "2", "3", "4", "5", "…", "20"],
      ["1", "2", "3", "4", "5", "…", "20"],
      ["1", "…", "4", "5", "6", "…", "20"],
      ["1", "…", "9", "10", "11", "…", "20"],
      ["1", "…", "15", "16", "17", "…", "20"],
      ["1", "…", "16", "17", "18", "19", "20"],
      ["1", "…", "16", "17", "18", "19", "20"],
    ];
    for (const [index, nav] of navs.entries()) {
      // What a reader sees: the page numbers and gaps. The arrows have no text, and the compact summary
      // ("Page 7 of 20") is hidden at this width.
      const shown = [...nav.querySelectorAll("li")]
        .map((item) => item.textContent ?? "")
        .filter((text) => text !== "" && !/^Page \d+ of \d+$/.test(text));
      await expect(shown).toEqual(expected[index]);
      // Always seven slots — the row never changes width as you move through the pages.
      await expect(shown.length).toBe(7);
    }
  },
};

export const SiblingsAndBoundaries: Story = {
  name: "Siblings and boundaries",
  argTypes: noControls,
  parameters: { docs: { source: { code: paginationSnippets.siblings } } },
  render: () => (
    <div style={{ ...containerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }}>
      {[
        { siblingCount: 0, boundaryCount: 1 },
        { siblingCount: 1, boundaryCount: 1 },
        { siblingCount: 2, boundaryCount: 1 },
        { siblingCount: 1, boundaryCount: 2 },
      ].map((counts) => (
        <div key={`${counts.siblingCount}-${counts.boundaryCount}`} style={labelledColumn}>
          <Text size="sm" weight="semibold">
            siblingCount={counts.siblingCount}, boundaryCount={counts.boundaryCount}
          </Text>
          <Pagination
            pageCount={40}
            defaultValue={20}
            {...counts}
            compact="never"
            align="start"
            aria-label={`Siblings ${counts.siblingCount}, boundaries ${counts.boundaryCount}`}
          />
        </div>
      ))}
    </div>
  ),
};

export const FirstLast: Story = {
  name: "First and last buttons",
  argTypes: noControls,
  parameters: { docs: { source: { code: paginationSnippets.firstLast } } },
  render: () => (
    <div style={containerStyle}>
      <Pagination pageCount={20} defaultValue={10} showFirstLast compact="never" aria-label="With first and last" />
    </div>
  ),
};

const onLinkChange = fn((_page: number, event: { preventDefault: () => void }) => event.preventDefault());

export const Links: Story = {
  name: "As links",
  argTypes: noControls,
  parameters: { docs: { source: { code: paginationSnippets.links } } },
  render: () => (
    // With `getPageHref` every control is a real link, so a page can be opened in a new tab or followed
    // without JavaScript. Here the demo cancels the navigation so the story stays put.
    <div style={containerStyle}>
      <Pagination
        pageCount={20}
        defaultValue={3}
        compact="never"
        getPageHref={(page) => `#/results?page=${page}`}
        onValueChange={onLinkChange}
        aria-label="Search results"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    onLinkChange.mockClear();
    // Every control is a link with its own address; the current page is marked.
    await expect(canvas.getByRole("link", { name: "Page 4" })).toHaveAttribute("href", "#/results?page=4");
    await expect(canvas.getByRole("link", { name: "Next page" })).toHaveAttribute("href", "#/results?page=4");
    await expect(canvas.getByRole("link", { name: "Page 3" })).toHaveAttribute("aria-current", "page");
    await expect(canvas.queryByRole("button")).toBeNull();
    // A click reports the page and the event.
    await userEvent.click(canvas.getByRole("link", { name: "Page 5" }));
    await expect(onLinkChange).toHaveBeenCalledTimes(1);
    await expect(onLinkChange.mock.calls[0]?.[0]).toBe(5);
    await expect(canvas.getByRole("link", { name: "Page 5" })).toHaveAttribute("aria-current", "page");
  },
};

export const Disabled: Story = {
  name: "Disabled",
  argTypes: noControls,
  parameters: { docs: { source: { code: paginationSnippets.disabled } } },
  render: () => (
    <div style={containerStyle}>
      <Pagination pageCount={20} defaultValue={5} disabled compact="never" aria-label="Disabled" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Every control is unavailable but still focusable.
    for (const control of canvas.getAllByRole("button")) {
      await expect(control).toHaveAttribute("aria-disabled", "true");
      await expect(control).not.toBeDisabled();
    }
    await userEvent.click(canvas.getByRole("button", { name: "Page 6" }));
    await expect(canvas.getByRole("button", { name: "Page 5" })).toHaveAttribute("aria-current", "page");
  },
};

export const Alignment: Story = {
  name: "Alignment",
  argTypes: noControls,
  parameters: { docs: { source: { code: paginationSnippets.align } } },
  render: () => (
    <div style={{ ...containerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }} data-testid="alignment">
      {(["start", "center", "end"] as const).map((align) => (
        <div key={align} style={labelledColumn}>
          <Text size="sm" weight="semibold">
            align=&quot;{align}&quot;
          </Text>
          <div style={{ border: "var(--dbm-border-width-1) solid var(--dbm-border-default)", borderRadius: "var(--dbm-radius-md)", padding: "var(--dbm-space-2)" }}>
            <Pagination pageCount={10} defaultValue={3} align={align} compact="never" aria-label={`Aligned to the ${align}`} />
          </div>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const boxes = [...canvasElement.querySelectorAll<HTMLElement>("[data-testid=alignment] > div > div:last-child")];
    const [start, center, end] = boxes.map((box) => {
      const list = box.querySelector("ul")!.getBoundingClientRect();
      const outer = box.getBoundingClientRect();
      return { fromStart: list.left - outer.left, fromEnd: outer.right - list.right };
    });
    // Flush with the left edge, centred, and flush with the right edge (inside the box's padding).
    await expect(start!.fromStart).toBeLessThan(12);
    await expect(Math.abs(center!.fromStart - center!.fromEnd)).toBeLessThan(2);
    await expect(end!.fromEnd).toBeLessThan(12);
  },
};

export const Compact: Story = {
  name: "Compact",
  argTypes: noControls,
  parameters: { docs: { source: { code: paginationSnippets.compact } } },
  render: () => (
    // `compact="always"` collapses the row to a summary at every width, for a narrow place like a sidebar.
    // The default, `auto`, does it only below the `sm` breakpoint — see the 'On a phone' story.
    <div style={{ maxWidth: "20rem", marginInline: "auto" }} data-testid="compact">
      <Pagination pageCount={20} defaultValue={7} compact="always" aria-label="Compact" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The summary shows, and the page numbers are out of the accessibility tree and the tab order.
    await expect(canvas.getByText("Page 7 of 20")).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "Page 8" })).toBeNull();
    // Previous and next still work.
    await userEvent.click(canvas.getByRole("button", { name: "Next page" }));
    await expect(canvas.getByText("Page 8 of 20")).toBeVisible();
  },
};

export const OnAPhone: Story = {
  name: "On a phone — collapses to a summary",
  argTypes: noControls,
  // Opened on its own, this story is shown at a phone's width (and it is in the test run); on the Docs
  // page it sits in the wide page like every other story.
  globals: { viewport: { value: "mobile1", isRotated: false } },
  parameters: { docs: { source: { code: paginationSnippets.onAPhone } } },
  render: () => (
    // With the default `compact="auto"`, below the `sm` breakpoint the numbers collapse to a "Page 7 of 20"
    // summary between previous and next, since a full row doesn't fit; from `sm` up the numbers are back.
    // Storybook's own wrapper pads every story by space.6; this cancels it and applies a phone's usual
    // 16px gutter instead, so the row gets the 288px a real 320px-wide phone gives it.
    <div data-testid="phone" style={{ marginInline: "calc(-1 * var(--dbm-space-6))", paddingInline: "var(--dbm-space-4)" }}>
      <Pagination pageCount={20} defaultValue={7} showFirstLast aria-label="On a phone" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    // The story really is at a phone's width (fails loudly if the viewport didn't apply).
    await expect(window.innerWidth).toBeLessThan(640);
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Page 7 of 20")).toBeVisible();
    // The page numbers are gone (`display: none`), and previous, next, first, and last remain.
    await expect(canvas.queryByRole("button", { name: "Page 8" })).toBeNull();
    for (const name of ["First page", "Previous page", "Next page", "Last page"]) {
      await expect(canvas.getByRole("button", { name })).toBeVisible();
    }
    // The whole row fits the screen — nothing wraps onto a second line or spills sideways.
    const nav = canvasElement.querySelector("[data-testid=phone] nav") as HTMLElement;
    await expect(nav.scrollWidth).toBeLessThanOrEqual(nav.clientWidth);
    const tops = new Set([...nav.querySelectorAll("li")].filter((li) => li.getBoundingClientRect().width > 0).map((li) => Math.round(li.getBoundingClientRect().top)));
    await expect(tops.size).toBe(1);
  },
};

const allInvoices = Array.from({ length: 47 }, (_, index) => ({
  id: `INV-${String(index + 1).padStart(3, "0")}`,
  customer: ["Acme Corp", "Globex", "Initech", "Umbrella", "Hooli"][index % 5]!,
  amount: `$${(120 + index * 13.5).toFixed(2)}`,
}));

const TableFooter = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("5");
  const size = Number(pageSize);
  const pageCount = Math.ceil(allInvoices.length / size);
  const first = (page - 1) * size;
  const visible = allInvoices.slice(first, first + size);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }}>
      <Table aria-label="Invoices">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Invoice</Table.HeaderCell>
            <Table.HeaderCell>Customer</Table.HeaderCell>
            <Table.HeaderCell numeric>Amount</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {visible.map((invoice) => (
            <Table.Row key={invoice.id}>
              <Table.HeaderCell scope="row">{invoice.id}</Table.HeaderCell>
              <Table.Cell>{invoice.customer}</Table.Cell>
              <Table.Cell numeric>{invoice.amount}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-4)", justifyContent: "space-between" }}>
        <Text size="sm" color="secondary" data-testid="range">
          Showing {first + 1}–{first + visible.length} of {allInvoices.length}
        </Text>
        <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-4)" }}>
          <div style={{ width: "9rem" }}>
            <Select
              aria-label="Rows per page"
              size="sm"
              value={pageSize}
              onValueChange={(next) => {
                setPageSize(next);
                setPage(1);
              }}
            >
              <Select.Option value="5">5 per page</Select.Option>
              <Select.Option value="10">10 per page</Select.Option>
              <Select.Option value="25">25 per page</Select.Option>
            </Select>
          </div>
          <Pagination pageCount={pageCount} value={page} onValueChange={setPage} size="sm" aria-label="Invoices" />
        </div>
      </div>
    </div>
  );
};

export const InATableFooter: Story = {
  name: "Composition — a table footer with a page size",
  argTypes: noControls,
  parameters: { docs: { source: { code: paginationSnippets.tableFooter } } },
  render: () => (
    // The classic data-table footer: a range summary, a page-size select, and the pagination. `Pagination`
    // does the page navigation; the page count and the rows shown come from the data.
    <div style={containerStyle} data-testid="footer">
      <TableFooter />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("range")).toHaveTextContent("Showing 1–5 of 47");
    await expect(canvas.getByRole("row", { name: /INV-001/ })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Page 2" }));
    await expect(canvas.getByTestId("range")).toHaveTextContent("Showing 6–10 of 47");
    await expect(canvas.getByRole("row", { name: /INV-006/ })).toBeInTheDocument();
    await expect(canvas.queryByRole("row", { name: /INV-001/ })).toBeNull();
    // The last page shows what is left.
    await userEvent.click(canvas.getByRole("button", { name: "Next page" }));
    await userEvent.click(canvas.getByRole("button", { name: "Page 10" }));
    await expect(canvas.getByTestId("range")).toHaveTextContent("Showing 46–47 of 47");
    await expect(canvas.getByRole("button", { name: "Next page" })).toHaveAttribute("aria-disabled", "true");
  },
};
