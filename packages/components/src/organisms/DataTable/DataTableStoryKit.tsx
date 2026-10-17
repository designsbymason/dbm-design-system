// Demo code shared by DataTable's stories and its hidden real-browser checks: a table of employees, its columns, a
// generator for a long one, and the toolbar, row menu and server-style paging an app would write around the table.
// Docs-only (a stories-support module, not shipped, ADR-0013's way of sharing code between two stories files); the
// "Show code" snippets are written by hand in `DataTable.snippets.ts`.
import { DotsThreeIcon, PencilSimpleIcon, TrashIcon } from "@dbm-design-system/icons";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "../../atoms/Badge";
import { IconButton } from "../../atoms/IconButton";
import { SearchInput } from "../../molecules/SearchInput";
import { Spacer } from "../../atoms/Spacer";
import { TableToolbar } from "../../molecules/TableToolbar";
import { Toolbar } from "../../molecules/Toolbar";
import { Menu } from "../Menu";
import { DataTable } from "./DataTable";
import type { DataTableColumn, DataTableProps, DataTableSort } from "./DataTable.types";

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
