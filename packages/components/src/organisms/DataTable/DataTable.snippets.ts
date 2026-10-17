// The code shown under each story's "Show code" button on DataTable's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code spells out every default, fills every
// handler with a no-op, prints an icon as `{ $$typeof: Symbol(react.forward_ref) … }` and freezes state. Each snippet here
// is the smallest real usage of what its story shows — only exports of the package, no demo scaffolding — and
// `storySnippets.test.ts` checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

const columnsNote = `{/* columns: [{ id: "name", header: "Name", accessor: (row) => row.name, sortable: true, rowHeader: true }, …]
    rows: your array of rows. Each row needs an \`id\`, or pass getRowId. */}`;

export const dataTableSnippets = {
  sorting: `${columnsNote}
{/* A header button cycles ascending, descending, none. aria-sort and a live announcement say so. A press with Shift held
    adds the column to the sort instead of replacing it, and the columns show their order (multiSort, on by default).
    Controlled: sort={sort} onSortChange={setSort}. */}
<DataTable
  aria-label="Team"
  columns={columns}
  data={rows}
  defaultSort={[{ columnId: "salary", direction: "descending" }]}
/>`,

  selection: `${columnsNote}
{/* selectionMode: "multiple" adds a checkbox column and a header checkbox; "single" replaces the choice.
    The ids are kept across sorting and pages. Controlled: selection={ids} onSelectionChange={setIds}. */}
<DataTable
  aria-label="Team"
  columns={columns}
  data={rows}
  selectionMode="multiple"
  getRowLabel={(row) => row.name}
  isRowSelectable={(row) => row.status !== "On leave"}
/>`,

  pagination: `${columnsNote}
{/* DataTable.Pagination turns paging on: the page controls, "1–10 of 87" and a page size select. */}
<DataTable aria-label="Team" columns={columns} data={rows} defaultPageSize={10} pageSizeOptions={[5, 10, 25]}>
  <DataTable.Pagination />
</DataTable>`,

  withToolbar: `${columnsNote}
{/* query, setQuery and the filtered rows are the app's own state. */}
<DataTable aria-label="Team" columns={columns} data={filteredRows} selectionMode="multiple" getRowLabel={(row) => row.name}>
  <DataTable.Toolbar aria-label="Team table tools">
    <TableToolbar.Row>
      <TableToolbar.Search>
        <SearchInput aria-label="Search the team" onSearch={setQuery} />
      </TableToolbar.Search>
      <Spacer />
      <TableToolbar.Summary count={filteredRows.length} total={rows.length} />
    </TableToolbar.Row>
    <DataTable.Selection>
      <Toolbar aria-label="Bulk actions" variant="secondary">
        <Toolbar.Button leadingIcon={TrashIcon}>Delete</Toolbar.Button>
      </Toolbar>
    </DataTable.Selection>
  </DataTable.Toolbar>
  <DataTable.Pagination />
</DataTable>`,

  rowActions: `${columnsNote}
{/* DotsThreeIcon comes from @dbm-design-system/icons. rowActions draws a trailing column; the menu is your own. */}
<DataTable
  aria-label="Team"
  columns={columns}
  data={rows}
  rowActions={(row) => (
    <Menu>
      <Menu.Trigger asChild>
        <IconButton icon={DotsThreeIcon} variant="ghost" size="sm" aria-label={\`Actions for \${row.name}\`} />
      </Menu.Trigger>
      <Menu.Content align="end">
        <Menu.Item>Edit</Menu.Item>
        <Menu.Item tone="danger">Delete</Menu.Item>
      </Menu.Content>
    </Menu>
  )}
/>`,

  longTable: `${columnsNote}
{/* Above 100 rows, an unpaged table with a maxHeight draws only the rows in view; every row is one line of
    a fixed height. aria-rowcount and aria-rowindex tell a screen reader the real size. */}
<DataTable aria-label="Team" columns={columns} data={thousandsOfRows} maxHeight="24rem" stickyHeader />`,

  serverSide: `${columnsNote}
{/* sortMode="manual": the table draws data as given and asks. Answer onSortChange and onPageChange with new rows, and say
    how many there are in all with totalCount. Its "Select all 137" chooses every row of every page without listing their ids
    (allSelected / onAllSelectedChange): reset it when the filter changes, since "all" meant the rows matching the old one. */}
<DataTable
  aria-label="Team"
  columns={columns}
  data={pageOfRows}
  sortMode="manual"
  totalCount={137}
  loading={isFetching}
  selectionMode="multiple"
  sort={sort}
  onSortChange={setSort}
  page={page}
  onPageChange={setPage}
  pageSize={pageSize}
  onPageSizeChange={setPageSize}
>
  <DataTable.Toolbar aria-label="Team table tools">
    <DataTable.Selection />
  </DataTable.Toolbar>
  <DataTable.Pagination />
</DataTable>`,

  columnVisibility: `${columnsNote}
{/* DataTable.ColumnMenu is a button that opens one checkbox item per column; the last column drawn can't be turned off.
    hiddenColumns / onHiddenColumnsChange make it controlled (to keep it in the URL, say); defaultHiddenColumns is uncontrolled.
    Inside the table's children, useDataTable() reads and sets the same list for a menu of your own. */}
<DataTable aria-label="Team" columns={columns} data={rows} defaultHiddenColumns={["started"]}>
  <DataTable.Toolbar aria-label="Team table tools">
    <TableToolbar.Row>
      <Spacer />
      <DataTable.ColumnMenu />
    </TableToolbar.Row>
  </DataTable.Toolbar>
</DataTable>`,

  loadingAndEmpty: `${columnsNote}
{/* loading draws placeholder rows (and aria-busy); an empty table says emptyState, or "No results". */}
<DataTable aria-label="Team" columns={columns} data={[]} loading loadingRows={4} />
<DataTable
  aria-label="Team"
  columns={columns}
  data={[]}
  emptyState={
    <EmptyState>
      <EmptyState.Title>No one on the team yet</EmptyState.Title>
    </EmptyState>
  }
/>`,

  sizes: `${columnsNote}
{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" — the cell type size, the row height and the controls in it. */}
<DataTable aria-label="Team" columns={columns} data={rows} size="sm" />`,

  resizable: `${columnsNote}
{/* resizable puts a handle at the end of every heading: drag it, or focus it and use the arrow keys (Shift for larger steps,
    Home and End for the limits, Enter to reset). A column's width, minWidth and maxWidth are where it begins and where a drag stops;
    columnWidths / onColumnWidthsChange keep the widths (in the URL or storage, say). selectionColumnWidth and actionsColumnWidth
    size the two columns the table adds. */}
<DataTable
  aria-label="Team"
  columns={columns}
  data={rows}
  resizable
  selectionMode="multiple"
  selectionColumnWidth="4rem"
  onColumnWidthsChange={saveWidths}
/>`,

  pinnedColumns: `${columnsNote}
{/* A number pins that many data columns beside the checkbox column (and the actions column at the end), up to four at an
    edge in all: here the checkbox and the name stay put at the start, and the actions at the end, while the rest scrolls
    sideways. true pins one. */}
<DataTable aria-label="Team" columns={columns} data={rows} selectionMode="multiple" stickyFirstColumn={2} stickyLastColumn />`,

  tones: `${columnsNote}
{/* tone: "brand" (default) | "neutral" | "info" | "success" | "warning" | "danger" — the header's solid fill, and the stripe and
    hover tints, as Table's. neutral leaves the header unfilled. */}
<DataTable aria-label="Team" columns={columns} data={rows} tone="success" striped />`,

  rightToLeft: `${columnsNote}
{/* Alignment and pinning are logical, so a page with dir="rtl" mirrors the table. The page size select opens a Radix list that
    doesn't read the page's direction: give the pagination dir="rtl" too. */}
<div dir="rtl">
  <DataTable aria-label="Team" columns={columns} data={rows} selectionMode="multiple" defaultPageSize={5}>
    <DataTable.Pagination dir="rtl" />
  </DataTable>
</div>`,
};

export interface DataTablePlaygroundSnippetArgs {
  size?: string;
  variant?: string;
  tone?: string;
  striped?: boolean;
  hoverable?: boolean;
  stickyHeader?: boolean;
  selectionMode?: string;
  sortMode?: string;
  multiSort?: boolean;
  resizable?: boolean;
  selectionColumnWidth?: string;
  actionsColumnWidth?: string;
  loading?: boolean;
  maxHeight?: string;
  "aria-label"?: string;
}

/**
 * The Playground's snippet, built from its current controls: only the props that differ from their defaults, around the
 * small real example the Playground shows.
 */
export function dataTablePlaygroundSnippet(args: DataTablePlaygroundSnippetArgs): string {
  const props: string[] = [];
  const label = args["aria-label"] || "Team";
  props.push(`aria-label=${/["&\\]/.test(label) ? `{${JSON.stringify(label)}}` : `"${label}"`}`);
  props.push("columns={columns}", "data={rows}");
  if (args.variant && args.variant !== "bordered") props.push(`variant="${args.variant}"`);
  if (args.tone && args.tone !== "brand") props.push(`tone="${args.tone}"`);
  if (args.size && args.size !== "md") props.push(`size="${args.size}"`);
  if (args.striped) props.push("striped");
  if (args.hoverable === false) props.push("hoverable={false}");
  if (args.stickyHeader) props.push("stickyHeader");
  if (args.maxHeight) props.push(`maxHeight="${args.maxHeight}"`);
  if (args.selectionMode && args.selectionMode !== "none") props.push(`selectionMode="${args.selectionMode}"`);
  if (args.sortMode === "manual") props.push('sortMode="manual"');
  if (args.resizable) props.push("resizable");
  if (args.selectionColumnWidth) props.push(`selectionColumnWidth="${args.selectionColumnWidth}"`);
  if (args.actionsColumnWidth) props.push(`actionsColumnWidth="${args.actionsColumnWidth}"`);
  if (args.multiSort === false) props.push("multiSort={false}");
  if (args.loading) props.push("loading");
  return `${columnsNote}
<DataTable
${props.map((prop) => `  ${prop}`).join("\n")}
/>`;
}
