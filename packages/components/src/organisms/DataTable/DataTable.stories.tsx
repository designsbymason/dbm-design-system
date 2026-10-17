import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import type { ComponentType } from "react";
import { useState } from "react";
import { Button } from "../../atoms/Button";
import { EmptyState } from "../../molecules/EmptyState";
import { Menu } from "../Menu";
import { DataTable } from "./DataTable";
import { dataTablePlaygroundSnippet, dataTableSnippets } from "./DataTable.snippets";
import type { DataTableProps } from "./DataTable.types";
import { employeeColumns, employees, makeEmployees, RowMenu, ServerDemo, TeamDemo, type Employee } from "./DataTableStoryKit";

type Args = DataTableProps<Employee>;

const noControls = { control: false } as const;
const column = { display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)", alignItems: "stretch" } as const;

const meta: Meta<Args> = {
  title: "Organisms/Data Display/DataTable",
  component: DataTable as unknown as ComponentType<Args>,
  parameters: { layout: "padded" },
  // Data and columns first, then the behaviour (sort, selection, pages, windowing), then the look, then the text and the
  // escape-hatch props last — the same sequencing as every other component's stories file.
  argTypes: {
    columns: { ...noControls, description: "The columns, in order: an id, a header, and how to read and draw a cell. Each can be sortable." },
    data: { ...noControls, description: "The rows. For a manual table, the rows to draw now (one page, in order)." },
    children: { ...noControls, description: "DataTable.Toolbar above the table and DataTable.Pagination below it." },
    getRowId: { ...noControls, description: "Gives a row the id its selection is kept by. The default reads the row's id, then its position in data." },
    getRowLabel: { ...noControls, description: "Names a row for a screen reader (\"Select Ada Lovelace\"). Without it a row is \"Row 3\"." },
    sort: { ...noControls, description: "The ordering, as a list of { columnId, direction }. Controlled with onSortChange." },
    defaultSort: { ...noControls, description: "The ordering the table starts with." },
    onSortChange: { ...noControls, description: "Called with the ordering a person asked for. A controlled table changes only when sort does." },
    sortMode: {
      control: "radio",
      options: ["client", "manual"],
      description: "client sorts and pages data in the browser; manual draws data as given and leaves sorting and paging to you.",
      table: { defaultValue: { summary: "client" } },
    },
    selectionMode: {
      control: "radio",
      options: ["none", "single", "multiple"],
      description: "How many rows can be chosen. multiple adds a checkbox column with a header checkbox; single replaces the choice.",
      table: { defaultValue: { summary: "none" } },
    },
    selection: { ...noControls, description: "The ids of the chosen rows. Controlled with onSelectionChange." },
    defaultSelection: { ...noControls, description: "The rows chosen to begin with." },
    onSelectionChange: { ...noControls, description: "Called with the ids a person asked to have chosen." },
    isRowSelectable: { ...noControls, description: "Says a row can't be chosen: its checkbox is disabled and select all leaves it out." },
    page: { ...noControls, description: "The page, from 1. Controlled with onPageChange. Setting pageSize or adding DataTable.Pagination turns paging on." },
    defaultPage: { ...noControls, description: "The page to begin on.", table: { defaultValue: { summary: "1" } } },
    onPageChange: { ...noControls, description: "Called with the page a person asked for." },
    pageSize: { ...noControls, description: "Rows a page. Controlled with onPageSizeChange." },
    defaultPageSize: { ...noControls, description: "Rows a page to begin with.", table: { defaultValue: { summary: "10" } } },
    onPageSizeChange: { ...noControls, description: "Called with the page size a person asked for." },
    pageSizeOptions: { ...noControls, description: "The page sizes a person can choose from in DataTable.Pagination.", table: { defaultValue: { summary: "[10, 25, 50, 100]" } } },
    totalCount: { ...noControls, description: "How many rows there are in all, for a manual table that holds one page of them." },
    virtualize: {
      control: "radio",
      options: ["auto", true, false],
      description:
        "Draws only the rows in view. auto does so above 100 rows when the table isn't paged and has a maxHeight; true and false decide it.",
      table: { defaultValue: { summary: "auto" } },
    },
    loading: {
      control: "boolean",
      description: "Shows placeholder rows in place of the data while it loads.",
      table: { defaultValue: { summary: "false" } },
    },
    loadingRows: { control: "number", description: "How many placeholder rows a loading table draws.", table: { defaultValue: { summary: "5" } } },
    emptyState: { ...noControls, description: "What an empty table says: text, or an EmptyState." },
    rowActions: { ...noControls, description: "Draws a trailing column for each row's actions, usually an IconButton that opens a Menu." },
    onRowClick: { ...noControls, description: "Called when a row is pressed or Enter is pressed on it. Makes each row a tab stop; offer the action another way as well." },
    hiddenColumns: { ...noControls, description: "The ids of the columns that are not drawn. Controlled with onHiddenColumnsChange." },
    defaultHiddenColumns: { ...noControls, description: "The columns hidden to begin with." },
    onHiddenColumnsChange: { ...noControls, description: "Called with the ids a person asked to have hidden." },
    variant: {
      control: "radio",
      options: ["bordered", "ghost"],
      description: "The table's frame: bordered, or ghost for a table inside a Card.",
      table: { defaultValue: { summary: "bordered" } },
    },
    tone: {
      control: "select",
      options: ["neutral", "brand", "info", "success", "warning", "danger"],
      description: "The table's colour treatment, the same as Table's.",
      table: { defaultValue: { summary: "neutral" } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Cell padding, type and the height of a row, on the standard scale.",
      table: { defaultValue: { summary: "md" } },
    },
    striped: { control: "boolean", description: "Alternates the background of every other row.", table: { defaultValue: { summary: "false" } } },
    hoverable: { control: "boolean", description: "Highlights the row under the pointer.", table: { defaultValue: { summary: "true" } } },
    stickyHeader: { control: "boolean", description: "Pins the header row to the top of the scroll area. Needs a maxHeight.", table: { defaultValue: { summary: "false" } } },
    stickyFirstColumn: { control: "boolean", description: "Pins the first column (the checkbox column when there is one) to the start edge.", table: { defaultValue: { summary: "false" } } },
    stickyLastColumn: { control: "boolean", description: "Pins the last column (the actions column when there is one) to the end edge.", table: { defaultValue: { summary: "false" } } },
    maxHeight: { control: "text", description: "Caps the height of the scroll area (any CSS max-height), so a long body scrolls inside it." },
    labels: { ...noControls, description: "Text written for the table, replacing the English defaults one by one." },
    formatNumber: { ...noControls, description: "Writes the numbers the table displays (a count in an announcement).", table: { defaultValue: { summary: "String" } } },
    caption: { ...noControls, description: "A visible title for the table, drawn as its caption. Names the table for assistive technology." },
    "aria-label": { control: "text", description: "Names the table when there is no visible caption. Give a caption, this, or aria-labelledby." },
    "aria-labelledby": { ...noControls, description: "The id of an element that names the table." },
    "aria-describedby": { ...noControls, description: "The id of an element that describes the table." },
    id: { ...noControls, description: "Standard DOM id, applied to the table element." },
    className: { ...noControls, description: "Additional CSS classes, for the box that holds the toolbar, table and pagination." },
    style: { ...noControls, description: "Inline styles for that same box." },
    "data-testid": { ...noControls, description: "Test identifier for automated testing, on the table element." },
  },
  args: {
    columns: employeeColumns,
    data: employees.slice(0, 8),
    "aria-label": "Team",
    sortMode: "client",
    selectionMode: "none",
    virtualize: "auto",
    loading: false,
    loadingRows: 5,
    variant: "bordered",
    tone: "neutral",
    size: "md",
    striped: false,
    hoverable: true,
    stickyHeader: false,
    stickyFirstColumn: false,
    stickyLastColumn: false,
    maxHeight: "",
  },
  render: ({ maxHeight, ...args }) => <DataTable<Employee> {...args} maxHeight={maxHeight || undefined} getRowLabel={(row) => row.name} />,
};

export default meta;

type Story = StoryObj<Args>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic" as const,
        transform: (_code: string, context: StoryContext) => dataTablePlaygroundSnippet(context.args as never),
      },
    },
  },
};

export const Sorting: Story = {
  parameters: { docs: { source: { code: dataTableSnippets.sorting } } },
  argTypes: { data: noControls, columns: noControls },
  render: (args) => (
    <DataTable<Employee>
      {...args}
      maxHeight={args.maxHeight || undefined}
      columns={employeeColumns}
      data={employees.slice(0, 8)}
      defaultSort={[{ columnId: "salary", direction: "descending" }]}
    />
  ),
};

export const Selection: Story = {
  parameters: { docs: { source: { code: dataTableSnippets.selection } } },
  args: { selectionMode: "multiple" },
  render: ({ maxHeight, ...args }) => (
    <DataTable<Employee>
      {...args}
      maxHeight={maxHeight || undefined}
      data={employees.slice(0, 8)}
      getRowLabel={(row) => row.name}
      isRowSelectable={(row) => row.status !== "On leave"}
    />
  ),
};

export const Pagination: Story = {
  parameters: { docs: { source: { code: dataTableSnippets.pagination } } },
  render: ({ maxHeight, ...args }) => (
    <DataTable<Employee> {...args} maxHeight={maxHeight || undefined} defaultPageSize={10} pageSizeOptions={[5, 10, 25]}>
      <DataTable.Pagination />
    </DataTable>
  ),
};

export const WithToolbar: Story = {
  name: "With a toolbar and paging",
  parameters: { docs: { source: { code: dataTableSnippets.withToolbar } } },
  args: { selectionMode: "multiple" },
  render: ({ maxHeight, ...args }) => <TeamDemo {...args} maxHeight={maxHeight || undefined} />,
};

export const RowActions: Story = {
  parameters: { docs: { source: { code: dataTableSnippets.rowActions } } },
  render: ({ maxHeight, ...args }) => (
    <div style={{ minHeight: "22rem" }}>
      <DataTable<Employee> {...args} maxHeight={maxHeight || undefined} data={employees.slice(0, 6)} rowActions={(row) => <RowMenu row={row} size={args.size} />} />
    </div>
  ),
};

export const LongTable: Story = {
  name: "A long table, drawn a window at a time",
  parameters: { docs: { source: { code: dataTableSnippets.longTable } } },
  args: { stickyHeader: true, maxHeight: "24rem", striped: true },
  render: ({ maxHeight, ...args }) => (
    <DataTable<Employee> {...args} maxHeight={maxHeight || undefined} data={makeEmployees(5000)} aria-label="Five thousand employees" />
  ),
};

export const ServerSide: Story = {
  name: "Sorting and paging on a server",
  parameters: { docs: { source: { code: dataTableSnippets.serverSide } } },
  render: ({ maxHeight, ...args }) => <ServerDemo {...args} maxHeight={maxHeight || undefined} />,
};

export const ColumnVisibility: Story = {
  parameters: { docs: { source: { code: dataTableSnippets.columnVisibility } } },
  render: function Render({ maxHeight, ...args }) {
    const [hidden, setHidden] = useState<string[]>(["started"]);
    return (
      <div style={column}>
        <div>
          <Menu>
            <Menu.Trigger asChild>
              <Button variant="secondary">Columns</Button>
            </Menu.Trigger>
            <Menu.Content>
              {employeeColumns.map((item) => (
                <Menu.CheckboxItem
                  key={item.id}
                  checked={!hidden.includes(item.id)}
                  onCheckedChange={(shown) => setHidden(shown ? hidden.filter((id) => id !== item.id) : [...hidden, item.id])}
                >
                  {item.header}
                </Menu.CheckboxItem>
              ))}
            </Menu.Content>
          </Menu>
        </div>
        <DataTable<Employee>
          {...args}
          maxHeight={maxHeight || undefined}
          data={employees.slice(0, 6)}
          hiddenColumns={hidden}
          onHiddenColumnsChange={setHidden}
        />
      </div>
    );
  },
};

export const LoadingAndEmpty: Story = {
  name: "Loading and empty",
  parameters: { docs: { source: { code: dataTableSnippets.loadingAndEmpty } } },
  argTypes: { loading: noControls, data: noControls, emptyState: noControls },
  render: ({ maxHeight, ...args }) => (
    <div style={column}>
      <DataTable<Employee> {...args} maxHeight={maxHeight || undefined} data={[]} loading loadingRows={4} aria-label="Loading team" />
      <DataTable<Employee>
        {...args}
        maxHeight={maxHeight || undefined}
        data={[]}
        loading={false}
        aria-label="Empty team"
        emptyState={
          <EmptyState size="sm">
            <EmptyState.Title>No one on the team yet</EmptyState.Title>
            <EmptyState.Description>People you add will show here.</EmptyState.Description>
          </EmptyState>
        }
      />
    </div>
  ),
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: dataTableSnippets.sizes } } },
  args: { selectionMode: "multiple" },
  argTypes: { size: noControls },
  render: ({ maxHeight, ...args }) => (
    <div style={column}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <DataTable<Employee> key={size} {...args} maxHeight={maxHeight || undefined} data={employees.slice(0, 3)} size={size} aria-label={`Team, size ${size}`} />
      ))}
    </div>
  ),
};

export const PinnedColumns: Story = {
  name: "Pinned first and last columns",
  parameters: { docs: { source: { code: dataTableSnippets.pinnedColumns } } },
  args: { selectionMode: "multiple", stickyFirstColumn: true, stickyLastColumn: true },
  render: ({ maxHeight, ...args }) => (
    <div style={{ maxWidth: "32rem" }}>
      <DataTable<Employee>
        {...args}
        maxHeight={maxHeight || undefined}
        data={employees.slice(0, 5)}
        rowActions={(row) => <RowMenu row={row} size={args.size} />}
      />
    </div>
  ),
};

export const RightToLeft: Story = {
  name: "Right to left",
  parameters: { docs: { source: { code: dataTableSnippets.rightToLeft } } },
  args: { selectionMode: "multiple" },
  render: ({ maxHeight, ...args }) => (
    <div dir="rtl">
      <DataTable<Employee> {...args} maxHeight={maxHeight || undefined} data={employees.slice(0, 5)} />
    </div>
  ),
};
