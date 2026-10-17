// Demo code shared by DataTable's stories and its hidden real-browser checks: a table of employees, its columns, a
// generator for a long one, and the toolbar, row menu and server-style paging an app would write around the table.
// Docs-only (a stories-support module, not shipped, ADR-0013's way of sharing code between two stories files); the
// "Show code" snippets are written by hand in `DataTable.snippets.ts`.
import { DotsThreeIcon, PencilSimpleIcon, TrashIcon } from "@dbm-design-system/icons";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "../../atoms/Badge";
import { Button } from "../../atoms/Button";
import { IconButton } from "../../atoms/IconButton";
import { SearchInput } from "../../molecules/SearchInput";
import { Select } from "../../molecules/Select";
import { ToggleGroup } from "../../molecules/ToggleGroup";
import { Spacer } from "../../atoms/Spacer";
import { TableToolbar } from "../../molecules/TableToolbar";
import { Toolbar } from "../../molecules/Toolbar";
import { Menu } from "../Menu";
import { DescriptionList } from "../../molecules/DescriptionList";
import { DataTable } from "./DataTable";
import type { DataTableColumn, DataTableProps, DataTableSort } from "./DataTable.types";

const demoColumn = { display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)", alignItems: "flex-start" } as const;

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: "Design" | "Engineering" | "Sales" | "Support";
  salary: number;
  started: string;
  status: "Active" | "On leave";
}

const firstNames = ["Ada", "Bo", "Cy", "Di", "Eli", "Fay", "Gus", "Hana", "Ivo", "Jo", "Kai", "Lee"];
const lastNames = ["Lovelace", "Okafor", "Nguyen", "Silva", "Kowalski", "Haddad", "Ito", "Moreau"];
const roles = ["Designer", "Engineer", "Account lead", "Support analyst", "Researcher", "Manager"];
const departments: Employee["department"][] = ["Design", "Engineering", "Sales", "Support"];

/** `count` employees, the same every time, so a story and its checks agree. */
export function makeEmployees(count: number): Employee[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `e${index + 1}`,
    name: `${firstNames[index % firstNames.length]} ${lastNames[(index * 3) % lastNames.length]} ${index + 1}`,
    role: roles[(index * 5) % roles.length] as string,
    department: departments[(index * 7) % departments.length] as Employee["department"],
    salary: 52000 + ((index * 7919) % 61000),
    started: `20${String(10 + (index % 14)).padStart(2, "0")}-${String(1 + (index % 12)).padStart(2, "0")}-${String(1 + ((index * 3) % 28)).padStart(2, "0")}`,
    status: index % 7 === 3 ? "On leave" : "Active",
  }));
}

export const employees: Employee[] = makeEmployees(24);

const money = (value: number) => `$${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

export const employeeColumns: DataTableColumn<Employee>[] = [
  { id: "name", header: "Name", accessor: (row) => row.name, sortable: true, rowHeader: true, width: "14rem" },
  { id: "role", header: "Role", accessor: (row) => row.role, sortable: true },
  { id: "department", header: "Department", accessor: (row) => row.department, sortable: true },
  { id: "salary", header: "Salary", accessor: (row) => row.salary, cell: (row) => money(row.salary), sortable: true, numeric: true },
  { id: "started", header: "Started", accessor: (row) => row.started, sortable: true },
  {
    id: "status",
    header: "Status",
    accessor: (row) => row.status,
    cell: (row) => <Badge tone={row.status === "Active" ? "success" : "warning"}>{row.status}</Badge>,
  },
];

/** The detail of an open row: what the row's columns don't show. */
export function EmployeeDetail({ row }: { row: Employee }) {
  return (
    <DescriptionList size="sm" variant="ghost" columns={{ base: 1, md: 3 }}>
      <DescriptionList.Item>
        <DescriptionList.Term>Manager</DescriptionList.Term>
        <DescriptionList.Details>{row.department} lead</DescriptionList.Details>
      </DescriptionList.Item>
      <DescriptionList.Item>
        <DescriptionList.Term>Started</DescriptionList.Term>
        <DescriptionList.Details>{row.started}</DescriptionList.Details>
      </DescriptionList.Item>
      <DescriptionList.Item>
        <DescriptionList.Term>Contact</DescriptionList.Term>
        <DescriptionList.Details>{row.name.split(" ")[0]?.toLowerCase()}@example.com</DescriptionList.Details>
      </DescriptionList.Item>
    </DescriptionList>
  );
}

/** The menu at the end of a row. Its button takes the table's `size`, so it fits the fixed row height. */
export function RowMenu({ row, size = "sm" }: { row: Employee; size?: "xs" | "sm" | "md" | "lg" | "xl" }) {
  return (
    <Menu>
      <Menu.Trigger asChild>
        <IconButton icon={DotsThreeIcon} variant="ghost" size={size} aria-label={`Actions for ${row.name}`} />
      </Menu.Trigger>
      <Menu.Content align="end">
        <Menu.Item icon={PencilSimpleIcon}>Edit</Menu.Item>
        <Menu.Separator />
        <Menu.Item icon={TrashIcon} tone="danger">
          Delete
        </Menu.Item>
      </Menu.Content>
    </Menu>
  );
}

/** What an app writes: the table with search, a result count, bulk actions and paging. */
export function TeamDemo({ data: _data, columns: _columns, ...props }: Partial<DataTableProps<Employee>>) {
  const [query, setQuery] = useState("");
  const rows = useMemo(
    () => employees.filter((employee) => !query || `${employee.name} ${employee.role}`.toLowerCase().includes(query.toLowerCase())),
    [query],
  );
  return (
    <DataTable<Employee>
      columns={employeeColumns}
      data={rows}
      aria-label="Team"
      selectionMode="multiple"
      getRowLabel={(row) => row.name}
      defaultPageSize={10}
      emptyState="No one matches that search"
      {...props}
    >
      <DataTable.Toolbar aria-label="Team table tools">
        <TableToolbar.Row>
          <TableToolbar.Search>
            <SearchInput aria-label="Search the team" onSearch={setQuery} />
          </TableToolbar.Search>
          <Spacer />
          <TableToolbar.Summary count={rows.length} total={employees.length} />
        </TableToolbar.Row>
        <DataTable.Selection>
          <Toolbar aria-label="Bulk actions" variant="secondary">
            <Toolbar.Button leadingIcon={TrashIcon}>Delete</Toolbar.Button>
          </Toolbar>
        </DataTable.Selection>
      </DataTable.Toolbar>
      <DataTable.Pagination />
    </DataTable>
  );
}

const SERVER_TOTAL = 137;

/** A page of rows "fetched" after a short wait, the way a server-backed table is driven. */
export function ServerDemo({
  data: _data,
  columns: _columns,
  sortMode: _sortMode,
  loading: _loading,
  loadingRows: _loadingRows,
  totalCount: _totalCount,
  sort: _sort,
  onSortChange: _onSortChange,
  page: _page,
  onPageChange: _onPageChange,
  pageSize: _pageSize,
  onPageSizeChange: _onPageSizeChange,
  ...props
}: Partial<DataTableProps<Employee>>) {
  const [sort, setSort] = useState<DataTableSort>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const request = `${sort.map((item) => `${item.columnId}:${item.direction}`).join(",")}|${page}|${pageSize}`;
  const [loaded, setLoaded] = useState<{ request: string; rows: Employee[] }>({ request: "", rows: [] });
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const all = makeEmployees(SERVER_TOTAL);
      const key = sort[0]?.columnId as keyof Employee | undefined;
      if (key) {
        const sign = sort[0]?.direction === "descending" ? -1 : 1;
        all.sort((a, b) => (a[key] < b[key] ? -sign : a[key] > b[key] ? sign : 0));
      }
      setLoaded({ request, rows: all.slice((page - 1) * pageSize, page * pageSize) });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [request, sort, page, pageSize]);
  const rows = loaded.rows;
  const loading = loaded.request !== request;
  return (
    <DataTable<Employee>
      aria-label="Team, from a server"
      getRowLabel={(row) => row.name}
      {...props}
      columns={employeeColumns}
      data={rows}
      sortMode="manual"
      totalCount={SERVER_TOTAL}
      loading={loading}
      loadingRows={pageSize}
      sort={sort}
      onSortChange={(next) => {
        setSort(next);
        setPage(1);
      }}
      page={page}
      onPageChange={setPage}
      pageSize={pageSize}
      onPageSizeChange={setPageSize}
    >
      <DataTable.Toolbar aria-label="Team table tools">
        <DataTable.Selection>
          <Toolbar aria-label="Bulk actions" variant="secondary">
            <Toolbar.Button leadingIcon={TrashIcon}>Delete</Toolbar.Button>
          </Toolbar>
        </DataTable.Selection>
      </DataTable.Toolbar>
      <DataTable.Pagination />
    </DataTable>
  );
}

type Density = "sm" | "md" | "lg";

/** A density toggle: the app holds the size and hands it to the table, which draws its type, padding and row height from it. */
export function DensityDemo({ data: _data, columns: _columns, size: _size, ...props }: Partial<DataTableProps<Employee>>) {
  const [density, setDensity] = useState<Density>("md");
  return (
    <div style={demoColumn}>
      <ToggleGroup aria-label="Row density" size="sm" value={density} onValueChange={(next) => next && setDensity(next as Density)}>
        <ToggleGroup.Item value="sm">Compact</ToggleGroup.Item>
        <ToggleGroup.Item value="md">Comfortable</ToggleGroup.Item>
        <ToggleGroup.Item value="lg">Spacious</ToggleGroup.Item>
      </ToggleGroup>
      <div style={{ alignSelf: "stretch" }}>
        <DataTable<Employee> aria-label="Team" {...props} columns={employeeColumns} data={employees.slice(0, 6)} size={density} />
      </div>
    </div>
  );
}

interface SavedView {
  id: string;
  name: string;
  sort: DataTableSort;
  hiddenColumns: string[];
  columnWidths: Record<string, number>;
  pageSize: number;
}

const startingViews: SavedView[] = [
  { id: "default", name: "Default", sort: [], hiddenColumns: [], columnWidths: {}, pageSize: 10 },
  {
    id: "payroll",
    name: "Payroll",
    sort: [{ columnId: "salary", direction: "descending" }],
    hiddenColumns: ["started", "status"],
    columnWidths: {},
    pageSize: 5,
  },
];

/**
 * Saved views: a view is a plain object of the table's own controlled state, so saving one is copying that state and choosing one is
 * handing it back. The app decides where views live (here, in state; in an app, a server or storage).
 */
export function SavedViewsDemo({ data: _data, columns: _columns, ...props }: Partial<DataTableProps<Employee>>) {
  const [views, setViews] = useState<SavedView[]>(startingViews);
  const [viewId, setViewId] = useState("default");
  const [sort, setSort] = useState<DataTableSort>([]);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [pageSize, setPageSize] = useState(10);

  const choose = (id: string) => {
    const view = views.find((candidate) => candidate.id === id);
    if (!view) return;
    setViewId(id);
    setSort(view.sort);
    setHiddenColumns(view.hiddenColumns);
    setColumnWidths(view.columnWidths);
    setPageSize(view.pageSize);
  };
  const save = () => {
    const id = `view-${views.length + 1}`;
    setViews([...views, { id, name: `View ${views.length + 1}`, sort, hiddenColumns, columnWidths, pageSize }]);
    setViewId(id);
  };

  return (
    <div style={demoColumn}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-3)", alignItems: "center" }}>
        <Select value={viewId} onValueChange={choose} aria-label="View" size="sm">
          {views.map((view) => (
            <Select.Option key={view.id} value={view.id}>
              {view.name}
            </Select.Option>
          ))}
        </Select>
        <Button size="sm" variant="secondary" onClick={save}>
          Save current view
        </Button>
      </div>
      <div style={{ alignSelf: "stretch" }}>
        <DataTable<Employee>
          aria-label="Team"
          {...props}
          columns={employeeColumns}
          data={employees}
          resizable
          sort={sort}
          onSortChange={setSort}
          hiddenColumns={hiddenColumns}
          onHiddenColumnsChange={setHiddenColumns}
          columnWidths={columnWidths}
          onColumnWidthsChange={setColumnWidths}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        >
          <DataTable.Toolbar aria-label="Team table tools">
            <TableToolbar.Row>
              <Spacer />
              <DataTable.ColumnMenu />
            </TableToolbar.Row>
          </DataTable.Toolbar>
          <DataTable.Pagination />
        </DataTable>
      </div>
    </div>
  );
}
