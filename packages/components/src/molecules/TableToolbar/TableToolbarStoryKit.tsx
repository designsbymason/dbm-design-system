// Demo code shared by TableToolbar's stories and its hidden real-browser checks: a small set of orders, filtering that works,
// and the bar composed the way an app would compose it. Docs-only (a stories-support module, not shipped, ADR-0013's way of
// sharing code between two stories files); the "Show code" snippets are written by hand in `TableToolbar.snippets.ts`.
import { DownloadSimpleIcon, FunnelSimpleIcon, TrashIcon } from "@dbm-design-system/icons";
import { useMemo, useState } from "react";
import { Badge } from "../../atoms/Badge";
import { Checkbox } from "../../atoms/Checkbox";
import { Radio } from "../../atoms/Radio";
import { Spacer } from "../../atoms/Spacer";
import { CheckboxGroup } from "../CheckboxGroup";
import { RadioGroup } from "../RadioGroup";
import { SearchInput } from "../SearchInput";
import { Table } from "../Table";
import { Toolbar } from "../Toolbar";
import { TableToolbar } from "./TableToolbar";
import type { TableToolbarProps } from "./TableToolbar.types";

export interface Order {
  id: string;
  customer: string;
  status: "Open" | "Shipped" | "Delayed";
  owner: "Jane" | "Marcus" | "Priya";
  total: string;
}

export const orders: Order[] = [
  { id: "#1042", customer: "Acme Corp", status: "Open", owner: "Jane", total: "$250.00" },
  { id: "#1043", customer: "Globex", status: "Shipped", owner: "Marcus", total: "$150.00" },
  { id: "#1044", customer: "Initech", status: "Delayed", owner: "Priya", total: "$350.00" },
  { id: "#1045", customer: "Umbrella", status: "Open", owner: "Marcus", total: "$90.00" },
  { id: "#1046", customer: "Hooli", status: "Shipped", owner: "Jane", total: "$410.00" },
  { id: "#1047", customer: "Soylent", status: "Open", owner: "Priya", total: "$75.00" },
  { id: "#1048", customer: "Stark Industries", status: "Delayed", owner: "Jane", total: "$1,200.00" },
  { id: "#1049", customer: "Wayne Enterprises", status: "Shipped", owner: "Priya", total: "$640.00" },
];

const statuses = ["Open", "Shipped", "Delayed"] as const;
const owners = ["Jane", "Marcus", "Priya"] as const;

/** The orders, their filter state, and the filtering — what an app (or a future `DataTable`) holds. */
export function useOrders(initial: { statuses?: string[]; owner?: string; selected?: string[] } = {}) {
  const [query, setQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(initial.statuses ?? []);
  const [owner, setOwner] = useState<string>(initial.owner ?? "");
  const [selected, setSelected] = useState<string[]>(initial.selected ?? []);
  const rows = useMemo(
    () =>
      orders.filter(
        (order) =>
          (!query || `${order.id} ${order.customer}`.toLowerCase().includes(query.toLowerCase())) &&
          (selectedStatuses.length === 0 || selectedStatuses.includes(order.status)) &&
          (!owner || order.owner === owner),
      ),
    [query, selectedStatuses, owner],
  );
  const applied = [
    ...selectedStatuses.map((value) => ({ id: `status:${value}`, group: "Status", label: value })),
    ...(owner ? [{ id: `owner:${owner}`, group: "Owner", label: owner }] : []),
  ];
  const removeFilter = (id: string) => {
    if (id.startsWith("status:")) setSelectedStatuses((current) => current.filter((value) => `status:${value}` !== id));
    else setOwner("");
  };
  const clearFilters = () => {
    setSelectedStatuses([]);
    setOwner("");
  };
  // Selection only ever holds rows that are still showing.
  const visibleSelected = selected.filter((id) => rows.some((row) => row.id === id));
  return {
    rows,
    applied,
    query,
    setQuery,
    selectedStatuses,
    setSelectedStatuses,
    owner,
    setOwner,
    removeFilter,
    clearFilters,
    selected: visibleSelected,
    setSelected,
  };
}

export const StatusPanel = ({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) => (
  <CheckboxGroup aria-label="Status" value={value} onValueChange={onChange}>
    {statuses.map((status) => (
      <Checkbox key={status} value={status}>
        {status}
      </Checkbox>
    ))}
  </CheckboxGroup>
);

export const OwnerPanel = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
  <RadioGroup aria-label="Owner" value={value} onValueChange={onChange}>
    {owners.map((name) => (
      <Radio key={name} value={name}>
        {name}
      </Radio>
    ))}
  </RadioGroup>
);

/** The whole bar over a live, filterable table: search, filters, chips, count, bulk actions. */
export function OrdersDemo({ withTable = true, ...barProps }: TableToolbarProps & { withTable?: boolean }) {
  const state = useOrders({ statuses: ["Open"] });
  const allSelected = state.rows.length > 0 && state.selected.length === state.rows.length;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }}>
      <TableToolbar aria-label="Orders table tools" {...barProps}>
        <TableToolbar.Row>
          <TableToolbar.Search>
            <SearchInput aria-label="Search orders" size={barProps.size} onSearch={state.setQuery} />
          </TableToolbar.Search>
          <Toolbar aria-label="Filters" variant="secondary" size={barProps.size}>
            <Toolbar.Item>
              <TableToolbar.Filter
                label="Status"
                icon={FunnelSimpleIcon}
                count={state.selectedStatuses.length}
                onClear={() => state.setSelectedStatuses([])}
              >
                <StatusPanel value={state.selectedStatuses} onChange={state.setSelectedStatuses} />
              </TableToolbar.Filter>
            </Toolbar.Item>
            <Toolbar.Item>
              <TableToolbar.Filter label="Owner" count={state.owner ? 1 : 0} onClear={() => state.setOwner("")}>
                <OwnerPanel value={state.owner} onChange={state.setOwner} />
              </TableToolbar.Filter>
            </Toolbar.Item>
          </Toolbar>
          <Spacer />
          <Toolbar aria-label="Actions" variant="secondary" size={barProps.size}>
            <Toolbar.Button leadingIcon={DownloadSimpleIcon}>Export</Toolbar.Button>
          </Toolbar>
        </TableToolbar.Row>
        <TableToolbar.Row>
          <TableToolbar.ActiveFilters items={state.applied} onRemove={state.removeFilter} onClearAll={state.clearFilters} />
          <TableToolbar.Summary count={state.rows.length} total={orders.length} />
        </TableToolbar.Row>
        <TableToolbar.Selection
          count={state.selected.length}
          totalCount={state.rows.length}
          onClear={() => state.setSelected([])}
          onSelectAll={() => state.setSelected(state.rows.map((row) => row.id))}
        >
          <Toolbar aria-label="Bulk actions" variant="secondary" size={barProps.size}>
            <Toolbar.Button leadingIcon={DownloadSimpleIcon}>Export selected</Toolbar.Button>
            <Toolbar.Button leadingIcon={TrashIcon}>Delete</Toolbar.Button>
          </Toolbar>
        </TableToolbar.Selection>
      </TableToolbar>
      {withTable && (
        <Table aria-label="Orders" hoverable>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell scope="col">
                <Checkbox
                  aria-label="Select all orders"
                  checked={allSelected ? true : state.selected.length > 0 ? "indeterminate" : false}
                  onCheckedChange={(checked) => state.setSelected(checked === true ? state.rows.map((row) => row.id) : [])}
                />
              </Table.HeaderCell>
              <Table.HeaderCell scope="col">Order</Table.HeaderCell>
              <Table.HeaderCell scope="col">Customer</Table.HeaderCell>
              <Table.HeaderCell scope="col">Status</Table.HeaderCell>
              <Table.HeaderCell scope="col">Owner</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {state.rows.map((row) => (
              <Table.Row key={row.id}>
                <Table.Cell>
                  <Checkbox
                    aria-label={`Select order ${row.id}`}
                    checked={state.selected.includes(row.id)}
                    onCheckedChange={(checked) =>
                      state.setSelected(checked === true ? [...state.selected, row.id] : state.selected.filter((id) => id !== row.id))
                    }
                  />
                </Table.Cell>
                <Table.HeaderCell scope="row">{row.id}</Table.HeaderCell>
                <Table.Cell>{row.customer}</Table.Cell>
                <Table.Cell>
                  <Badge tone={row.status === "Open" ? "info" : row.status === "Shipped" ? "success" : "danger"} size="sm">
                    {row.status}
                  </Badge>
                </Table.Cell>
                <Table.Cell>{row.owner}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </div>
  );
}
