import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DataTable } from "./DataTable";
import { useDataTable } from "./DataTable.context";
import type { DataTableColumn, DataTableProps, DataTableSort } from "./DataTable.types";
import { TableToolbar } from "../../molecules/TableToolbar";

afterEach(() => vi.restoreAllMocks());

// The footer's range wraps each number in a bidirectional isolate; a reader (and a test) sees through them.
const rangeText = (text: string) => (content: string) => content.replace(/[\u2068\u2069]/g, "") === text;

interface Person {
  id: string;
  name: string;
  age: number;
}

const people: Person[] = [
  { id: "p1", name: "Cy", age: 30 },
  { id: "p2", name: "Ada", age: 41 },
  { id: "p3", name: "Bo", age: 25 },
  { id: "p4", name: "Di", age: 36 },
];

const columns: DataTableColumn<Person>[] = [
  { id: "name", header: "Name", accessor: (row) => row.name, sortable: true, rowHeader: true },
  { id: "age", header: "Age", accessor: (row) => row.age, sortable: true, numeric: true },
];

function renderTable(props: Partial<DataTableProps<Person>> = {}) {
  return render(<DataTable<Person> columns={columns} data={people} aria-label="People" {...props} />);
}

/** The body rows' first cell text, in order. */
function names(): string[] {
  const body = screen.getAllByRole("rowgroup")[1] as HTMLElement;
  return within(body)
    .getAllByRole("row")
    .map((row) => within(row).getAllByRole("rowheader")[0]?.textContent ?? "");
}

describe("DataTable", () => {
  describe("rendering", () => {
    it("draws a real table with the columns and rows", () => {
      renderTable();
      expect(screen.getByRole("table", { name: "People" })).toBeInTheDocument();
      expect(screen.getAllByRole("columnheader").map((header) => header.textContent)).toEqual(["Name", "Age"]);
      expect(names()).toEqual(["Cy", "Ada", "Bo", "Di"]);
    });

    it("draws a cell from its cell function, and from the accessor's value otherwise", () => {
      renderTable({
        columns: [
          { id: "name", header: "Name", accessor: (row) => row.name, cell: (row) => <strong>{row.name.toUpperCase()}</strong>, rowHeader: true },
          { id: "age", header: "Age", accessor: (row) => row.age },
        ],
      });
      expect(screen.getByText("CY").tagName).toBe("STRONG");
      expect(screen.getByText("41")).toBeInTheDocument();
    });

    it("names the table by its caption", () => {
      render(<DataTable<Person> columns={columns} data={people} caption="Team" />);
      expect(screen.getByRole("table", { name: "Team" })).toBeInTheDocument();
    });

    it("forwards the ref to the table, and id, test id and class to where they belong", () => {
      const ref = createRef<HTMLTableElement>();
      render(<DataTable<Person> columns={columns} data={people} aria-label="People" ref={ref} id="t" data-testid="dt" className="frame" style={{ margin: 1 }} />);
      expect(ref.current?.tagName).toBe("TABLE");
      expect(screen.getByTestId("dt").tagName).toBe("TABLE");
      expect(screen.getByTestId("dt")).toHaveAttribute("id", "t");
      expect(screen.getByTestId("dt").closest(".frame")).not.toBeNull();
    });

    it("shows the empty text, or the empty state it is given", () => {
      const { rerender } = renderTable({ data: [] });
      expect(screen.getByText("No results")).toBeInTheDocument();
      rerender(<DataTable<Person> columns={columns} data={[]} aria-label="People" emptyState={<p>Nobody here</p>} />);
      expect(screen.getByText("Nobody here")).toBeInTheDocument();
    });

    it("shows placeholder rows while loading, marking the body busy", () => {
      renderTable({ loading: true, loadingRows: 2 });
      const body = screen.getAllByRole("rowgroup")[1] as HTMLElement;
      expect(body).toHaveAttribute("aria-busy", "true");
      expect(within(body).getAllByRole("row")).toHaveLength(2);
    });

    it("leaves out a hidden column", () => {
      renderTable({ hiddenColumns: ["age"] });
      expect(screen.getAllByRole("columnheader").map((header) => header.textContent)).toEqual(["Name"]);
    });

    it("draws a row-actions column with a header only a screen reader reads", () => {
      renderTable({ rowActions: (row) => <button type="button">Edit {row.name}</button> });
      expect(screen.getByRole("columnheader", { name: "Actions" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Edit Cy" })).toBeInTheDocument();
    });

    it("replaces labels one at a time, keeping the default for one given as undefined", () => {
      renderTable({ data: [], labels: { empty: undefined, loading: "Fetching" } });
      expect(screen.getByText("No results")).toBeInTheDocument();
    });
  });

  describe("sorting", () => {
    it("cycles ascending, descending, none from the header button and sets aria-sort", async () => {
      const user = userEvent.setup();
      renderTable();
      const name = screen.getByRole("button", { name: "Name" });
      await user.click(name);
      expect(names()).toEqual(["Ada", "Bo", "Cy", "Di"]);
      expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute("aria-sort", "ascending");
      await user.click(name);
      expect(names()).toEqual(["Di", "Cy", "Bo", "Ada"]);
      expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute("aria-sort", "descending");
      await user.click(name);
      expect(names()).toEqual(["Cy", "Ada", "Bo", "Di"]);
      expect(screen.getByRole("columnheader", { name: "Name" })).not.toHaveAttribute("aria-sort");
    });

    it("sets only the sorted column's aria-sort", async () => {
      const user = userEvent.setup();
      renderTable();
      await user.click(screen.getByRole("button", { name: "Age" }));
      expect(screen.getByRole("columnheader", { name: "Name" })).not.toHaveAttribute("aria-sort");
      expect(screen.getByRole("columnheader", { name: "Age" })).toHaveAttribute("aria-sort", "ascending");
    });

    it("gives no button to a column that is not sortable", () => {
      renderTable({ columns: [{ id: "name", header: "Name", accessor: (row) => row.name }] });
      expect(screen.queryByRole("button", { name: "Name" })).toBeNull();
    });

    it("starts from defaultSort and reports what was asked", async () => {
      const onSortChange = vi.fn();
      const user = userEvent.setup();
      renderTable({ defaultSort: [{ columnId: "age", direction: "descending" }], onSortChange });
      expect(names()).toEqual(["Ada", "Di", "Cy", "Bo"]);
      await user.click(screen.getByRole("button", { name: "Name" }));
      expect(onSortChange).toHaveBeenCalledWith([{ columnId: "name", direction: "ascending" }]);
    });

    it("a controlled sort changes only when its prop does", async () => {
      const onSortChange = vi.fn();
      const user = userEvent.setup();
      renderTable({ sort: [], onSortChange });
      await user.click(screen.getByRole("button", { name: "Name" }));
      expect(onSortChange).toHaveBeenCalledOnce();
      expect(names()).toEqual(["Cy", "Ada", "Bo", "Di"]);
    });

    it("works wired to state", async () => {
      const user = userEvent.setup();
      function Wired() {
        const [sort, setSort] = useState<DataTableSort>([]);
        return <DataTable<Person> columns={columns} data={people} aria-label="People" sort={sort} onSortChange={setSort} />;
      }
      render(<Wired />);
      await user.click(screen.getByRole("button", { name: "Age" }));
      expect(names()).toEqual(["Bo", "Cy", "Di", "Ada"]);
    });

    it("leaves the rows alone in manual mode and only reports", async () => {
      const onSortChange = vi.fn();
      const user = userEvent.setup();
      renderTable({ sortMode: "manual", onSortChange });
      await user.click(screen.getByRole("button", { name: "Name" }));
      expect(onSortChange).toHaveBeenCalledOnce();
      expect(names()).toEqual(["Cy", "Ada", "Bo", "Di"]);
    });

    it("announces the sort, and its removal, in a live region", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderTable();
      await user.click(screen.getByRole("button", { name: "Name" }));
      await act(async () => {
        vi.advanceTimersByTime(150);
      });
      expect(screen.getByRole("status")).toHaveTextContent("Sorted by Name, ascending");
      vi.useRealTimers();
    });

    it("warns for a sortable column with nothing to sort by", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      renderTable({ columns: [{ id: "x", header: "X", sortable: true }] });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('column "x" is `sortable`'));
    });
  });

  describe("selection", () => {
    it("adds a checkbox column with a named header checkbox in multiple mode", () => {
      renderTable({ selectionMode: "multiple" });
      expect(screen.getByRole("checkbox", { name: "Select all rows" })).toBeInTheDocument();
      expect(screen.getAllByRole("checkbox")).toHaveLength(5);
      expect(screen.getByRole("checkbox", { name: "Select Row 1" })).toBeInTheDocument();
    });

    it("names a row's checkbox from getRowLabel", () => {
      renderTable({ selectionMode: "multiple", getRowLabel: (row) => row.name });
      expect(screen.getByRole("checkbox", { name: "Select Ada" })).toBeInTheDocument();
    });

    it("chooses rows, draws them selected and reports the ids", async () => {
      const onSelectionChange = vi.fn();
      const user = userEvent.setup();
      renderTable({ selectionMode: "multiple", onSelectionChange, getRowLabel: (row) => row.name });
      await user.click(screen.getByRole("checkbox", { name: "Select Ada" }));
      expect(onSelectionChange).toHaveBeenLastCalledWith(["p2"]);
      const row = screen.getByRole("checkbox", { name: "Select Ada" }).closest("tr") as HTMLElement;
      expect(row).toHaveAttribute("data-selected");
      expect(row).not.toHaveAttribute("aria-selected");
      await user.click(screen.getByRole("checkbox", { name: "Select Ada" }));
      expect(onSelectionChange).toHaveBeenLastCalledWith([]);
    });

    it("shows the header checkbox mixed for some, checked for all, and chooses or clears the page", async () => {
      const user = userEvent.setup();
      renderTable({ selectionMode: "multiple", getRowLabel: (row) => row.name });
      const all = screen.getByRole("checkbox", { name: "Select all rows" });
      await user.click(screen.getByRole("checkbox", { name: "Select Cy" }));
      expect(all).toHaveAttribute("aria-checked", "mixed");
      await user.click(all);
      expect(all).toHaveAttribute("aria-checked", "true");
      expect(screen.getAllByRole("checkbox", { checked: true })).toHaveLength(5);
      await user.click(all);
      expect(screen.queryAllByRole("checkbox", { checked: true })).toHaveLength(0);
    });

    it("chooses a range with shift", async () => {
      const onSelectionChange = vi.fn();
      const user = userEvent.setup();
      renderTable({ selectionMode: "multiple", onSelectionChange, getRowLabel: (row) => row.name });
      await user.click(screen.getByRole("checkbox", { name: "Select Cy" }));
      await user.keyboard("{Shift>}");
      await user.click(screen.getByRole("checkbox", { name: "Select Di" }));
      await user.keyboard("{/Shift}");
      expect(onSelectionChange).toHaveBeenLastCalledWith(["p1", "p2", "p3", "p4"]);
    });

    it("single mode replaces the choice and has no header checkbox", async () => {
      const user = userEvent.setup();
      renderTable({ selectionMode: "single", getRowLabel: (row) => row.name });
      expect(screen.queryByRole("checkbox", { name: "Select all rows" })).toBeNull();
      await user.click(screen.getByRole("checkbox", { name: "Select Cy" }));
      await user.click(screen.getByRole("checkbox", { name: "Select Bo" }));
      expect(screen.getAllByRole("checkbox", { checked: true })).toHaveLength(1);
      expect(screen.getByRole("checkbox", { name: "Select Bo" })).toBeChecked();
    });

    it("disables the checkbox of a row that can't be chosen and leaves it out of select all", async () => {
      const onSelectionChange = vi.fn();
      const user = userEvent.setup();
      renderTable({
        selectionMode: "multiple",
        onSelectionChange,
        isRowSelectable: (row) => row.id !== "p1",
        getRowLabel: (row) => row.name,
      });
      expect(screen.getByRole("checkbox", { name: "Select Cy" })).toBeDisabled();
      await user.click(screen.getByRole("checkbox", { name: "Select all rows" }));
      expect(onSelectionChange).toHaveBeenLastCalledWith(["p2", "p3", "p4"]);
    });

    it("a controlled selection changes only when its prop does", async () => {
      const user = userEvent.setup();
      renderTable({ selectionMode: "multiple", selection: ["p3"], getRowLabel: (row) => row.name });
      await user.click(screen.getByRole("checkbox", { name: "Select Cy" }));
      expect(screen.getByRole("checkbox", { name: "Select Cy" })).not.toBeChecked();
      expect(screen.getByRole("checkbox", { name: "Select Bo" })).toBeChecked();
    });

    it("keeps the choice when the rows are sorted", async () => {
      const user = userEvent.setup();
      renderTable({ selectionMode: "multiple", getRowLabel: (row) => row.name });
      await user.click(screen.getByRole("checkbox", { name: "Select Cy" }));
      await user.click(screen.getByRole("button", { name: "Name" }));
      expect(screen.getByRole("checkbox", { name: "Select Cy" })).toBeChecked();
    });

    it("warns for two rows with the same id", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      renderTable({ data: [people[0] as Person, { ...(people[0] as Person), name: "Twin" }] });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('two rows have the id "p1"'));
    });
  });

  describe("pages", () => {
    const many: Person[] = Array.from({ length: 25 }, (_, index) => ({ id: `r${index}`, name: `Person ${String(index + 1).padStart(2, "0")}`, age: index }));

    it("shows one page of rows, with the range, and turns the page", async () => {
      const user = userEvent.setup();
      render(
        <DataTable<Person> columns={columns} data={many} aria-label="People">
          <DataTable.Pagination compact="never" />
        </DataTable>,
      );
      expect(names()).toHaveLength(10);
      expect(names()[0]).toBe("Person 01");
      expect(screen.getByText(rangeText("1–10 of 25"))).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Next page" }));
      expect(names()[0]).toBe("Person 11");
      expect(screen.getByText(rangeText("11–20 of 25"))).toBeInTheDocument();
    });

    it("sorts the whole set before taking the page", async () => {
      const user = userEvent.setup();
      render(
        <DataTable<Person> columns={columns} data={many} aria-label="People" defaultSort={[{ columnId: "age", direction: "descending" }]}>
          <DataTable.Pagination compact="never" />
        </DataTable>,
      );
      expect(names()[0]).toBe("Person 25");
      await user.click(screen.getByRole("button", { name: "Next page" }));
      expect(names()[0]).toBe("Person 15");
    });

    it("sets aria-rowcount and each row's aria-rowindex across the whole set", async () => {
      render(
        <DataTable<Person> columns={columns} data={many} aria-label="People" defaultPage={2}>
          <DataTable.Pagination compact="never" />
        </DataTable>,
      );
      expect(screen.getByRole("table")).toHaveAttribute("aria-rowcount", "26");
      const rows = screen.getAllByRole("row");
      expect(rows[0]).toHaveAttribute("aria-rowindex", "1");
      expect(rows[1]).toHaveAttribute("aria-rowindex", "12");
    });

    it("goes back to the first page and reports when the page size changes", async () => {
      const onPageSizeChange = vi.fn();
      const user = userEvent.setup();
      render(
        <DataTable<Person> columns={columns} data={many} aria-label="People" defaultPage={2} onPageSizeChange={onPageSizeChange}>
          <DataTable.Pagination compact="never" />
        </DataTable>,
      );
      await user.click(screen.getByRole("combobox", { name: "Rows per page" }));
      await user.click(await screen.findByRole("option", { name: "25" }));
      expect(onPageSizeChange).toHaveBeenCalledWith(25);
      expect(names()).toHaveLength(25);
      expect(screen.getByText(rangeText("1–25 of 25"))).toBeInTheDocument();
    });

    it("holds a page that is past the end to the last page", () => {
      render(
        <DataTable<Person> columns={columns} data={many} aria-label="People" page={9}>
          <DataTable.Pagination compact="never" />
        </DataTable>,
      );
      expect(screen.getByText(rangeText("21–25 of 25"))).toBeInTheDocument();
    });

    it("draws data as given in manual mode and takes the count from totalCount", async () => {
      const onPageChange = vi.fn();
      const user = userEvent.setup();
      render(
        <DataTable<Person> columns={columns} data={many.slice(0, 10)} aria-label="People" sortMode="manual" totalCount={95} onPageChange={onPageChange}>
          <DataTable.Pagination compact="never" />
        </DataTable>,
      );
      expect(names()).toHaveLength(10);
      expect(screen.getByText(rangeText("1–10 of 95"))).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Next page" }));
      expect(onPageChange).toHaveBeenCalledWith(2);
    });
  });

  describe("toolbar parts", () => {
    it("draws the toolbar above the table and the pagination below it", () => {
      render(
        <DataTable<Person> columns={columns} data={people} aria-label="People">
          <DataTable.Pagination compact="never" />
          <DataTable.Toolbar aria-label="Tools">
            <TableToolbar.Row>tools</TableToolbar.Row>
          </DataTable.Toolbar>
        </DataTable>,
      );
      const toolbar = screen.getByRole("group", { name: "Tools" });
      const table = screen.getByRole("table");
      const pagination = screen.getByRole("navigation");
      expect(toolbar.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(table.compareDocumentPosition(pagination) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("DataTable.Selection counts the chosen rows and clears them", async () => {
      const user = userEvent.setup();
      render(
        <DataTable<Person> columns={columns} data={people} aria-label="People" selectionMode="multiple" getRowLabel={(row) => row.name}>
          <DataTable.Toolbar aria-label="Tools">
            <DataTable.Selection>
              <button type="button">Delete</button>
            </DataTable.Selection>
          </DataTable.Toolbar>
        </DataTable>,
      );
      await user.click(screen.getByRole("checkbox", { name: "Select Cy" }));
      expect(screen.getByText("1 selected")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Select all 4" }));
      expect(screen.getAllByRole("checkbox", { checked: true })).toHaveLength(5);
      await user.click(screen.getByRole("button", { name: "Clear selection" }));
      expect(screen.queryAllByRole("checkbox", { checked: true })).toHaveLength(0);
    });

    it("useDataTable reads and changes the table's state from inside it", async () => {
      const user = userEvent.setup();
      function HideAge() {
        const { hiddenColumns, setHiddenColumns } = useDataTable();
        return (
          <button type="button" onClick={() => setHiddenColumns([...hiddenColumns, "age"])}>
            Hide age
          </button>
        );
      }
      render(
        <DataTable<Person> columns={columns} data={people} aria-label="People">
          <HideAge />
        </DataTable>,
      );
      await user.click(screen.getByRole("button", { name: "Hide age" }));
      expect(screen.queryByRole("columnheader", { name: "Age" })).toBeNull();
    });

    it("useDataTable outside a table throws a clear error", () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      function Outside() {
        useDataTable();
        return null;
      }
      expect(() => render(<Outside />)).toThrow(/inside a DataTable/);
    });
  });

  describe("row press", () => {
    it("calls onRowClick for a press on the row and for Enter on a focused row, but not for a control inside it", async () => {
      const onRowClick = vi.fn();
      const user = userEvent.setup();
      renderTable({ onRowClick, rowActions: () => <button type="button">More</button> });
      const row = screen.getAllByRole("row")[1] as HTMLElement;
      expect(row).toHaveAttribute("tabindex", "0");
      await user.click(within(row).getAllByRole("cell")[0] as HTMLElement);
      expect(onRowClick).toHaveBeenCalledTimes(1);
      await user.click(within(row).getByRole("button", { name: "More" }));
      expect(onRowClick).toHaveBeenCalledTimes(1);
      row.focus();
      await user.keyboard("{Enter}");
      expect(onRowClick).toHaveBeenCalledTimes(2);
      expect(onRowClick.mock.calls[0]?.[0]).toBe(people[0]);
    });

    it("does not make rows tab stops without onRowClick", () => {
      renderTable();
      expect(screen.getAllByRole("row")[1]).not.toHaveAttribute("tabindex");
    });
  });

  describe("windowing", () => {
    const long: Person[] = Array.from({ length: 500 }, (_, index) => ({ id: `r${index}`, name: `P${index}`, age: index }));

    it("draws a window of rows, not all of them, when long and given a height", () => {
      renderTable({ data: long, maxHeight: "20rem" });
      const rows = screen.getAllByRole("row");
      expect(rows.length).toBeLessThan(80);
      expect(screen.getByRole("table")).toHaveAttribute("aria-rowcount", "501");
    });

    it("draws every row when it is not tall enough to window, or when told not to", () => {
      const { unmount } = renderTable({ data: long.slice(0, 60), maxHeight: "20rem" });
      expect(screen.getAllByRole("row")).toHaveLength(61);
      unmount();
      renderTable({ data: long, maxHeight: "20rem", virtualize: false });
      expect(screen.getAllByRole("row")).toHaveLength(501);
    });

    it("does not window a table with a wrapping column", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      renderTable({
        data: long,
        maxHeight: "20rem",
        virtualize: true,
        columns: [{ id: "name", header: "Name", accessor: (row) => row.name, wrap: true }],
      });
      expect(screen.getAllByRole("row")).toHaveLength(501);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`virtualize` needs rows of one height"));
    });

    it("keeps the first drawn row on an even index so stripes stay in step", () => {
      renderTable({ data: long, maxHeight: "20rem" });
      const first = screen.getAllByRole("row")[1] as HTMLElement;
      expect(Number(first.getAttribute("aria-rowindex")) % 2).toBe(0);
    });
  });

  describe("quality", () => {
    it("warns once when the table has no name", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(<DataTable<Person> columns={columns} data={people} />);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("give the table a name"));
    });

    it("lets a same-named prop not override the computed row selection mark", () => {
      renderTable({ selectionMode: "multiple", getRowLabel: (row) => row.name, selection: ["p1"] });
      const row = screen.getByRole("checkbox", { name: "Select Cy" }).closest("tr") as HTMLElement;
      expect(row).toHaveAttribute("data-selected");
    });

    it("works under StrictMode", async () => {
      const user = userEvent.setup();
      render(
        <StrictMode>
          <DataTable<Person> columns={columns} data={people} aria-label="People" selectionMode="multiple" getRowLabel={(row) => row.name}>
            <DataTable.Pagination compact="never" />
          </DataTable>
        </StrictMode>,
      );
      await user.click(screen.getByRole("checkbox", { name: "Select Cy" }));
      expect(screen.getByRole("checkbox", { name: "Select Cy" })).toBeChecked();
    });

    it("has no accessibility violations in its plain, selecting, sorted and empty states", async () => {
      const first = renderTable({ selectionMode: "multiple", getRowLabel: (row) => row.name, defaultSort: [{ columnId: "name", direction: "ascending" }] });
      expect(await axe(first.container)).toHaveNoViolations();
      first.unmount();
      const second = renderTable({ data: [] });
      expect(await axe(second.container)).toHaveNoViolations();
      second.unmount();
      const third = render(
        <DataTable<Person> columns={columns} data={people} aria-label="People" rowActions={() => <button type="button">More</button>}>
          <DataTable.Pagination compact="never" />
        </DataTable>,
      );
      expect(await axe(third.container)).toHaveNoViolations();
    });
  });
  describe("what a review asked for", () => {
    it("wraps each number of the range in a bidirectional isolate", () => {
      render(
        <DataTable<Person> columns={columns} data={people} aria-label="People" defaultPageSize={2}>
          <DataTable.Pagination compact="never" />
        </DataTable>,
      );
      expect(screen.getByText(rangeText("1–2 of 4")).textContent).toBe("\u20681\u2069–\u20682\u2069 of \u20684\u2069");
    });

    it("gives the page size select the footer's direction", () => {
      render(
        <DataTable<Person> columns={columns} data={people} aria-label="People" defaultPageSize={2}>
          <DataTable.Pagination compact="never" dir="rtl" />
        </DataTable>,
      );
      expect(screen.getByRole("combobox", { name: "Rows per page" })).toHaveAttribute("dir", "rtl");
    });

    it("keeps the select left-to-right unless told otherwise", () => {
      render(
        <DataTable<Person> columns={columns} data={people} aria-label="People" defaultPageSize={2}>
          <DataTable.Pagination compact="never" />
        </DataTable>,
      );
      expect(screen.getByRole("combobox", { name: "Rows per page" })).toHaveAttribute("dir", "ltr");
    });

    it("writes the footer's own text from labels, which get plain numbers", () => {
      render(
        <DataTable<Person> columns={columns} data={people} aria-label="People" defaultPageSize={2}>
          <DataTable.Pagination
            compact="never"
            labels={{ summary: (first, last, total) => `${first} à ${last} sur ${total}`, pageSize: "Lignes par page" }}
          />
        </DataTable>,
      );
      expect(screen.getByText("1 à 2 sur 4")).toBeInTheDocument();
      expect(screen.getByRole("combobox", { name: "Lignes par page" })).toBeInTheDocument();
    });

    it("writes the numbers of the default range through formatNumber", () => {
      render(
        <DataTable<Person> columns={columns} data={people} aria-label="People" defaultPageSize={2}>
          <DataTable.Pagination compact="never" formatNumber={(value) => `#${value}`} />
        </DataTable>,
      );
      expect(screen.getByText(rangeText("#1–#2 of #4"))).toBeInTheDocument();
    });

    it("keeps a default footer label when it is given as undefined", () => {
      render(
        <DataTable<Person> columns={columns} data={people} aria-label="People" defaultPageSize={2}>
          <DataTable.Pagination compact="never" labels={{ pageSize: undefined }} />
        </DataTable>,
      );
      expect(screen.getByRole("combobox", { name: "Rows per page" })).toBeInTheDocument();
    });

    it("does not let a same-named prop replace the page the pagination is computed from", () => {
      render(
        <DataTable<Person> columns={columns} data={people} aria-label="People" defaultPageSize={2}>
          <DataTable.Pagination compact="never" {...({ pageCount: 99, value: 9 } as object)} />
        </DataTable>,
      );
      expect(screen.getByRole("button", { name: /^Page 1/ })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /^Page 99/ })).toBeNull();
    });

    it("does not let a same-named prop replace the selection count", async () => {
      const user = userEvent.setup();
      render(
        <DataTable<Person> columns={columns} data={people} aria-label="People" selectionMode="multiple" getRowLabel={(row) => row.name}>
          <DataTable.Toolbar aria-label="Tools">
            <DataTable.Selection {...({ count: 50 } as object)} />
          </DataTable.Toolbar>
        </DataTable>,
      );
      await user.click(screen.getByRole("checkbox", { name: "Select Cy" }));
      expect(screen.getByText("1 selected")).toBeInTheDocument();
    });

    it("throws a clear error for a pagination outside a table", () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      expect(() => render(<DataTable.Pagination />)).toThrow(/inside a DataTable/);
    });

    it("keeps a table nested in a cell to its own state, toolbar and selection", async () => {
      const user = userEvent.setup();
      const inner: DataTableColumn<Person>[] = [{ id: "n", header: "Inner name", accessor: (row) => row.name, rowHeader: true }];
      render(
        <DataTable<Person>
          aria-label="Outer"
          columns={[{ id: "name", header: "Name", accessor: (row) => row.name, cell: () => (
            <DataTable<Person> aria-label="Inner" columns={inner} data={people.slice(0, 2)} selectionMode="multiple" getRowLabel={(row) => row.name}>
              <DataTable.Toolbar aria-label="Inner tools">
                <DataTable.Selection />
              </DataTable.Toolbar>
            </DataTable>
          ) }]}
          data={people.slice(0, 1)}
          selectionMode="multiple"
          getRowLabel={(row) => row.name}
        >
          <DataTable.Toolbar aria-label="Outer tools">
            <DataTable.Selection />
          </DataTable.Toolbar>
        </DataTable>,
      );
      await user.click(within(screen.getByRole("table", { name: "Inner" })).getByRole("checkbox", { name: "Select Cy" }));
      expect(within(screen.getByRole("group", { name: "Inner tools" })).getByText("1 selected")).toBeInTheDocument();
      expect(screen.getByRole("group", { name: "Outer tools" })).not.toHaveTextContent("1 selected");
    });

    it("presses a row with Space as well as Enter", async () => {
      const onRowClick = vi.fn();
      const user = userEvent.setup();
      renderTable({ onRowClick });
      (screen.getAllByRole("row")[1] as HTMLElement).focus();
      await user.keyboard(" ");
      expect(onRowClick).toHaveBeenCalledTimes(1);
    });

    it("gives a cell cut by a width its whole text as a title, and a cell without a width none", () => {
      renderTable({
        columns: [
          { id: "name", header: "Name", accessor: (row) => row.name, rowHeader: true, width: "4rem" },
          { id: "age", header: "Age", accessor: (row) => row.age },
        ],
      });
      expect(screen.getByRole("rowheader", { name: "Cy" })).toHaveAttribute("title", "Cy");
      expect(screen.getByRole("cell", { name: "30" })).not.toHaveAttribute("title");
    });

    it("passes the pinning and look props to the table", () => {
      const { container } = renderTable({ stickyFirstColumn: true, stickyLastColumn: true, tone: "success", striped: true, variant: "ghost" });
      const table = screen.getByRole("table");
      expect(table.querySelector("thead")?.className).toMatch(/firstColumnSticky/);
      expect(table.querySelector("thead")?.className).toMatch(/lastColumnSticky/);
      expect(table.querySelector("tbody")?.className).toMatch(/bodyStripedTinted/);
      expect(container.querySelector("[class*=containerGhost]")).not.toBeNull();
    });

    it("draws a brand header by default, and none with tone neutral", () => {
      const { unmount } = renderTable();
      expect(screen.getByRole("table").querySelector("thead")?.className).toMatch(/toneBrand/);
      unmount();
      renderTable({ tone: "neutral" });
      expect(screen.getByRole("table").querySelector("thead")?.className).not.toMatch(/tone[A-Z]/);
    });

    it("does not warn about a sortable column with no accessor when sorting is manual", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      renderTable({ sortMode: "manual", columns: [{ id: "x", header: "X", sortable: true }] });
      expect(warn).not.toHaveBeenCalledWith(expect.stringContaining("is `sortable`"));
    });

    it("does not sort again when only getRowId or isRowSelectable is a new function", () => {
      // `compare` runs only while sorting, unlike `accessor`, which a cell also reads to draw itself.
      const accessor = vi.fn((a: Person, b: Person) => a.name.localeCompare(b.name));
      const cols: DataTableColumn<Person>[] = [{ id: "name", header: "Name", compare: accessor, accessor: (row) => row.name, sortable: true, rowHeader: true }];
      const sorted: DataTableSort = [{ columnId: "name", direction: "ascending" }];
      const { rerender } = render(<DataTable<Person> columns={cols} data={people} aria-label="People" defaultSort={sorted} getRowId={(row) => row.id} />);
      const calls = accessor.mock.calls.length;
      rerender(<DataTable<Person> columns={cols} data={people} aria-label="People" defaultSort={sorted} getRowId={(row) => row.id} isRowSelectable={() => true} />);
      expect(accessor.mock.calls.length).toBe(calls);
    });

    it("warns once for a duplicate row id, however often it is drawn again", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const twins = [people[0] as Person, { ...(people[0] as Person), name: "Twin" }];
      const { rerender } = render(<DataTable<Person> columns={columns} data={twins} aria-label="People" getRowId={(row) => row.id} />);
      rerender(<DataTable<Person> columns={columns} data={twins} aria-label="People" getRowId={(row) => row.id} />);
      expect(warn.mock.calls.filter(([message]) => String(message).includes("two rows have the id")).length).toBe(1);
    });

    it("orders text the same whatever the browser's locale", () => {
      const original = String.prototype.localeCompare;
      const spy = vi.spyOn(String.prototype, "localeCompare").mockImplementation(function (this: string, ...args: Parameters<typeof original>) {
        return original.apply(this, args) * -1;
      });
      renderTable({ defaultSort: [{ columnId: "name", direction: "ascending" }] });
      expect(names()).toEqual(["Ada", "Bo", "Cy", "Di"]);
      spy.mockRestore();
    });
  });
});
