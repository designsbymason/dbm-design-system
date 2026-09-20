// The code shown under each story's "Show code" button on Pagination's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is the story object plus
// demo-only helpers, and the Playground's generated snippet would spell out every default and freeze the
// controlled page. A snippet can't hold state, so where a page is controlled the state is named in a
// comment above the JSX (`{/* const [page, setPage] = useState(1); */}`). Each snippet here is the smallest
// real usage of what its story shows — only exports of the package, no demo scaffolding — and
// `storySnippets.test.ts` checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import type { PaginationAlign, PaginationCompact, PaginationSize, PaginationVariant } from "./Pagination.types";

export const paginationSnippets = {
  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" */}
<Pagination pageCount={20} defaultValue={5} size="lg" />`,

  windows: `{/* The row keeps the same number of slots wherever you are, so the controls stay put as you
    move through the pages: at the start, in the middle (here), and at the end. */}
<Pagination pageCount={20} defaultValue={10} />`,

  siblings: `{/* siblingCount: pages either side of the current one. boundaryCount: pages always shown at each end. */}
<Pagination pageCount={40} defaultValue={20} siblingCount={2} boundaryCount={2} />`,

  firstLast: `{/* showFirstLast adds buttons that jump straight to the first and the last page */}
<Pagination pageCount={20} defaultValue={10} showFirstLast />`,

  links: `{/* With getPageHref every control is a real link, so a page can be opened in a new tab or followed
    without JavaScript. Name each pagination on a page separately. */}
<Pagination
  pageCount={20}
  defaultValue={3}
  getPageHref={(page) => \`/results?page=\${page}\`}
  aria-label="Search results"
/>

{/* For client-side routing, cancel the browser's navigation and hand the page to your router.
    navigate is your router's function. */}
<Pagination
  pageCount={20}
  value={3}
  getPageHref={(page) => \`/results?page=\${page}\`}
  onValueChange={(page, event) => {
    event.preventDefault();
    navigate(\`/results?page=\${page}\`);
  }}
  aria-label="Search results"
/>`,

  disabled: `{/* disabled makes every control unavailable — while the next page loads, say. They stay focusable. */}
<Pagination pageCount={20} defaultValue={5} disabled />`,

  align: `{/* align: "start" | "center" (default) | "end" — end is the usual place under a table */}
<Pagination pageCount={10} defaultValue={3} align="end" />`,

  compact: `{/* compact: "auto" (default) | "container" | "always" | "never". "always" collapses the numbers to a
    summary at every width, for a narrow place such as a sidebar. */}
<Pagination pageCount={20} defaultValue={7} compact="always" />`,

  variants: `{/* variant: "ghost" (default) | "outlined" | "filled". The current page is always the filled brand colour;
    this is the treatment of every other control. */}
<Pagination pageCount={20} defaultValue={5} variant="outlined" />`,

  rounded: `{/* rounded makes every page number and arrow a circle — a pill for a page number too wide for a square.
    The "Go to page" field and its button keep their own corners. */}
<Pagination pageCount={20} defaultValue={5} rounded />

<Pagination pageCount={5000} defaultValue={1234} rounded showJump />`,

  locale: `{/* formatNumber writes each page number the way a language or region does — here Arabic-Indic digits, and
    digit grouping, through the browser's own Intl. The default "Page 5" and "Page 5 of 20" text uses it too, so
    a button's name always contains the number it shows. */}
<Pagination pageCount={20} defaultValue={5} formatNumber={new Intl.NumberFormat("ar-EG").format} />

<Pagination pageCount={5000} defaultValue={1234} formatNumber={new Intl.NumberFormat("de-DE").format} />

{/* If you write your own page and summary labels, they are given the plain numbers, so write them with the same
    function. */}
<Pagination
  pageCount={20}
  defaultValue={5}
  formatNumber={new Intl.NumberFormat("ar-EG").format}
  labels={{
    navigation: "التنقل بين الصفحات",
    previous: "الصفحة السابقة",
    next: "الصفحة التالية",
    page: (page) => \`الصفحة \${new Intl.NumberFormat("ar-EG").format(page)}\`,
    summary: (page, pageCount) =>
      \`الصفحة \${new Intl.NumberFormat("ar-EG").format(page)} من \${new Intl.NumberFormat("ar-EG").format(pageCount)}\`,
  }}
/>`,

  jump: `{/* showJump adds a "Go to page" field and button, for a list long enough that stepping is slow.
    A number outside the range goes to the nearest page; an empty field does nothing. */}
<Pagination pageCount={500} defaultValue={42} showJump />`,

  container: `{/* compact="container" decides by the width the component is *given*, not the screen's: the numbers
    while they fit, the "Page 7 of 20" summary when they don't. It fills the space available to it. */}
<div style={{ width: "18rem" }}>
  <Pagination pageCount={20} defaultValue={7} compact="container" />
</div>`,

  announce: `{/* By default a page change is announced to screen readers — "Page 6 of 20" — through a visually
    hidden status region. Nothing changes visually. */}
<Pagination pageCount={20} value={page} onValueChange={setPage} />

{/* Turn it off if your own content region already announces the change */}
<Pagination pageCount={20} value={page} onValueChange={setPage} announce={false} />`,

  onAPhone: `{/* The default, compact="auto": below the sm breakpoint (640px) the numbers collapse to a
    "Page 7 of 20" summary between the buttons; from sm up the numbers are back. The jump field stays,
    on a line of its own, as the way to reach a page the summary hides. */}
<Pagination pageCount={20} defaultValue={7} showFirstLast />

{/* With a three-digit page count the summary is wider; use the jump field rather than first and last */}
<Pagination pageCount={200} defaultValue={7} showJump />`,

  tableFooter: `{/* const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState("5");
    const pageCount = Math.ceil(invoices.length / Number(pageSize));
    const first = (page - 1) * Number(pageSize);
    const visible = invoices.slice(first, first + Number(pageSize)); */}
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

<Text size="sm" color="secondary">
  Showing {first + 1}–{first + visible.length} of {invoices.length}
</Text>

{/* Changing the page size goes back to page 1, since the old page may no longer exist */}
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
<Pagination pageCount={pageCount} value={page} onValueChange={setPage} size="sm" aria-label="Invoices" />`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface PaginationPlaygroundSnippetArgs {
  pageCount?: number;
  value?: number;
  siblingCount?: number;
  boundaryCount?: number;
  showFirstLast?: boolean;
  size?: PaginationSize;
  compact?: PaginationCompact;
  variant?: PaginationVariant;
  rounded?: boolean;
  showJump?: boolean;
  announce?: boolean;
  align?: PaginationAlign;
  disabled?: boolean;
}

/**
 * The Playground's snippet, built from its current controls: the page count and the controlled page
 * (with its state named in a comment), plus only the props that differ from their defaults.
 */
export function paginationPlaygroundSnippet(args: PaginationPlaygroundSnippetArgs): string {
  const attributes = [`pageCount={${args.pageCount ?? 20}}`, "value={page}", "onValueChange={setPage}"];
  if (args.siblingCount !== undefined && args.siblingCount !== 1) attributes.push(`siblingCount={${args.siblingCount}}`);
  if (args.boundaryCount !== undefined && args.boundaryCount !== 1) attributes.push(`boundaryCount={${args.boundaryCount}}`);
  if (args.showFirstLast) attributes.push("showFirstLast");
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.compact && args.compact !== "auto") attributes.push(`compact="${args.compact}"`);
  if (args.variant && args.variant !== "ghost") attributes.push(`variant="${args.variant}"`);
  if (args.rounded) attributes.push("rounded");
  if (args.showJump) attributes.push("showJump");
  if (args.announce === false) attributes.push("announce={false}");
  if (args.align && args.align !== "center") attributes.push(`align="${args.align}"`);
  if (args.disabled) attributes.push("disabled");
  return `{/* const [page, setPage] = useState(${args.value ?? 1}); */}\n<Pagination ${attributes.join(" ")} />`;
}
