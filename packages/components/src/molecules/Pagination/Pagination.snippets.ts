// The code shown under each story's "Show code" button on Pagination's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is the story object plus
// demo-only helpers, and the Playground's generated snippet would spell out every default and freeze the
// controlled page. A snippet can't hold state, so where a page is controlled the state is named in a
// comment above the JSX (`{/* const [page, setPage] = useState(1); */}`). Each snippet here is the smallest
// real usage of what its story shows — only exports of the package, no demo scaffolding — and
// `storySnippets.test.ts` checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import type { PaginationAlign, PaginationCompact, PaginationSize } from "./Pagination.types";

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

  compact: `{/* compact: "auto" (default) | "always" | "never". "always" collapses the numbers to a summary
    at every width, for a narrow place such as a sidebar. */}
<Pagination pageCount={20} defaultValue={7} compact="always" />`,

  onAPhone: `{/* The default, compact="auto": below the sm breakpoint (640px) the numbers collapse to a
    "Page 7 of 20" summary between the buttons; from sm up the numbers are back. */}
<Pagination pageCount={20} defaultValue={7} showFirstLast />`,

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
  if (args.align && args.align !== "center") attributes.push(`align="${args.align}"`);
  if (args.disabled) attributes.push("disabled");
  return `{/* const [page, setPage] = useState(${args.value ?? 1}); */}\n<Pagination ${attributes.join(" ")} />`;
}
