import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { DataTable } from "./DataTable";
import { employeeColumns, employees, makeEmployees, RowMenu, TeamDemo, type Employee } from "./DataTableStoryKit";

// Real-browser checks for what jsdom can't evaluate: the height of a row against its token, a window of rows over a long
// table, the ellipsis, the size of a target, the real Tab order and a pointer on a menu inside the scrolling frame. Hidden
// from the sidebar and the Docs page, and still run as tests (07 §4.2, guidelines/adr/0013).
const meta: Meta = {
  title: "Organisms/Data Display/DataTable/Checks",
  tags: ["!dev"],
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj;

const body = within(document.body);
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** A length token such as `2.75rem` in pixels. */
function tokenPx(name: string): number {
  const root = getComputedStyle(document.documentElement);
  return Number.parseFloat(root.getPropertyValue(name)) * Number.parseFloat(root.fontSize);
}

async function realClick(element: Element) {
  const rect = element.getBoundingClientRect();
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame ? frame.width / window.innerWidth : 1;
  const x = (frame?.left ?? 0) + (rect.left + rect.width / 2) * scale;
  const y = (frame?.top ?? 0) + (rect.top + rect.height / 2) * scale;
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
}

const bodyRows = (table: HTMLElement) => [...table.querySelectorAll<HTMLElement>("tbody > tr:not([aria-hidden]):not([hidden])")];
const sizes = ["xs", "sm", "md", "lg", "xl"] as const;

export const RowHeightsMatchTheirTokensRowHeights: Story = {
  name: "Every row is exactly its token's height, at every size",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {sizes.map((size) => (
        <DataTable<Employee>
          key={size}
          aria-label={`Size ${size}`}
          columns={employeeColumns}
          data={employees.slice(0, 3)}
          size={size}
          selectionMode="multiple"
          rowActions={(row) => <RowMenu row={row} size={size} />}
        />
      ))}
    </div>
  ),
  play: async () => {
    for (const size of sizes) {
      const table = body.getByRole("table", { name: `Size ${size}` });
      const expected = tokenPx(`--dbm-data-table-row-height-${size}`);
      for (const row of bodyRows(table)) {
        await expect(Math.abs(row.getBoundingClientRect().height - expected)).toBeLessThan(1);
      }
    }
  },
};

export const LongTableDrawsAWindow: Story = {
  name: "A long table draws a window and keeps the scrollbar true",
  render: () => (
    <DataTable<Employee> aria-label="Long" columns={employeeColumns} data={makeEmployees(5000)} maxHeight="20rem" stickyHeader striped />
  ),
  play: async () => {
    const table = body.getByRole("table", { name: "Long" });
    const frame = table.parentElement as HTMLElement;
    await waitFor(() => expect(bodyRows(table).length).toBeGreaterThan(5));
    await expect(bodyRows(table).length).toBeLessThan(80);
    const rowPx = tokenPx("--dbm-data-table-row-height-md");
    // 5000 rows' worth of height in all (plus the header), though few are drawn
    await waitFor(() => expect(Math.abs(frame.scrollHeight - (5000 * rowPx + table.querySelector("thead")!.getBoundingClientRect().height))).toBeLessThan(rowPx * 2));
    frame.scrollTop = frame.scrollHeight;
    await waitFor(() => expect(within(table).getByRole("rowheader", { name: /5000$/ })).toBeInTheDocument());
    await expect(bodyRows(table).length).toBeLessThan(80);
    // after a long scroll the alternating stripes are still in step with the rows' positions
    const rows = bodyRows(table);
    const fill = (row: HTMLElement) => getComputedStyle(row).backgroundColor;
    for (let index = 1; index < rows.length; index += 1) {
      const a = Number((rows[index - 1] as HTMLElement).getAttribute("aria-rowindex"));
      const b = Number((rows[index] as HTMLElement).getAttribute("aria-rowindex"));
      await expect(b - a).toBe(1);
      await expect(fill(rows[index] as HTMLElement) === fill(rows[index - 1] as HTMLElement)).toBe(false);
    }
    // the stripe follows the row's position in the data, not the window's
    const evens = rows.filter((row) => Number(row.getAttribute("aria-rowindex")) % 2 === 0).map(fill);
    await expect(new Set(evens).size).toBe(1);
  },
};

export const LongCellsAreCutWithAnEllipsis: Story = {
  name: "A cell with a width is cut with an ellipsis instead of widening",
  render: () => (
    <DataTable<Employee>
      aria-label="Cut"
      columns={employeeColumns.map((column) => (column.id === "name" ? { ...column, width: "8rem" } : column))}
      data={[{ ...(employees[0] as Employee), name: "A very long name that cannot possibly fit in eight rem of width" }]}
    />
  ),
  play: async () => {
    const table = body.getByRole("table", { name: "Cut" });
    const cell = table.querySelector<HTMLElement>("tbody th") as HTMLElement;
    await expect(getComputedStyle(cell).textOverflow).toBe("ellipsis");
    await expect(cell.scrollWidth).toBeGreaterThan(cell.clientWidth);
    await expect(cell.getBoundingClientRect().width).toBeLessThanOrEqual(tokenPx("--dbm-space-32") + 1);
    await expect(cell.getBoundingClientRect().height).toBeCloseTo(tokenPx("--dbm-data-table-row-height-md"), 0);
  },
};

export const TargetsAreBigEnough: Story = {
  name: "Every control is at least 24 by 24 pixels, at every size",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {sizes.map((size) => (
        <DataTable<Employee>
          key={size}
          aria-label={`Targets ${size}`}
          columns={employeeColumns}
          data={employees.slice(0, 2)}
          size={size}
          selectionMode="multiple"
          rowActions={(row) => <RowMenu row={row} size={size} />}
        />
      ))}
    </div>
  ),
  play: async () => {
    for (const size of sizes) {
      const table = body.getByRole("table", { name: `Targets ${size}` });
      const controls = table.querySelectorAll<HTMLElement>("button");
      await expect(controls.length).toBeGreaterThan(8);
      for (const control of controls) {
        const rect = control.getBoundingClientRect();
        if (Math.min(rect.width, rect.height) >= 24) continue;
        // drawn smaller than the minimum: its hit area is extended by a pseudo-element, which getBoundingClientRect can't see,
        // so press points 11px either side of the centre (inside a 24px square) and see that the control answers
        const centreX = rect.left + rect.width / 2;
        const centreY = rect.top + rect.height / 2;
        for (const [dx, dy] of [[-11, 0], [11, 0], [0, -11], [0, 11]] as const) {
          await expect(document.elementFromPoint(centreX + dx, centreY + dy)).toBe(control);
        }
      }
    }
  },
};

export const KeyboardSortKeepsFocus: Story = {
  name: "Sorting from the keyboard leaves focus on the heading's button",
  render: () => <DataTable<Employee> aria-label="Keys" columns={employeeColumns} data={employees.slice(0, 6)} />,
  play: async () => {
    const table = body.getByRole("table", { name: "Keys" });
    const name = within(table).getByRole("button", { name: "Name" });
    name.focus();
    await userEvent.keyboard("{Enter}");
    await expect(name).toHaveFocus();
    await expect(within(table).getByRole("columnheader", { name: "Name" })).toHaveAttribute("aria-sort", "ascending");
    await userEvent.keyboard(" ");
    await expect(name).toHaveFocus();
    await expect(within(table).getByRole("columnheader", { name: "Name" })).toHaveAttribute("aria-sort", "descending");
    // the ring is drawn on the button, inside its box
    await expect(getComputedStyle(name).outlineStyle).toBe("solid");
    await expect(Number.parseFloat(getComputedStyle(name).outlineOffset)).toBeLessThan(0);
  },
};

export const TabOrderIsReadingOrder: Story = {
  name: "Tab goes through the toolbar, the header, the rows, then the footer",
  render: () => <TeamDemo size="sm" />,
  play: async () => {
    const search = body.getByRole("searchbox", { name: "Search the team" });
    search.focus();
    const seen: string[] = [];
    for (let step = 0; step < 40; step += 1) {
      await userEvent.tab();
      const active = document.activeElement as HTMLElement | null;
      if (!active || active === document.body) break;
      seen.push(active.getAttribute("aria-label") ?? active.textContent ?? "");
      if (seen.at(-1) === "Next page") break;
    }
    const at = (needle: string | RegExp) => seen.findIndex((text) => (typeof needle === "string" ? text === needle : needle.test(text)));
    await expect(at("Select all rows")).toBeGreaterThanOrEqual(0);
    await expect(at("Name")).toBeGreaterThan(at("Select all rows"));
    await expect(at(/^Select /)).toBeGreaterThanOrEqual(0);
    const firstRow = seen.findIndex((text, index) => index > at("Name") && /^Select .* 1$/.test(text));
    await expect(firstRow).toBeGreaterThan(at("Name"));
    await expect(at("Rows per page")).toBeGreaterThan(firstRow);
    await expect(at("Next page")).toBeGreaterThan(at("Rows per page"));
  },
};

export const RowMenuWorksWithARealPointer: Story = {
  name: "A row's menu opens above the table and is chosen with a real pointer",
  render: () => (
    <div style={{ minHeight: "16rem" }}>
      <DataTable<Employee>
        aria-label="Menu"
        columns={employeeColumns}
        data={employees.slice(0, 4)}
        maxHeight="12rem"
        stickyHeader
        stickyLastColumn
        rowActions={(row) => <RowMenu row={row} />}
      />
    </div>
  ),
  play: async () => {
    const trigger = body.getAllByRole("button", { name: /^Actions for/ })[0] as HTMLElement;
    await realClick(trigger);
    const menu = await body.findByRole("menu");
    const edit = within(menu).getByRole("menuitem", { name: "Edit" });
    await nextFrame();
    const rect = edit.getBoundingClientRect();
    await expect(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)?.closest("[role=menuitem]")).toBe(edit);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
  },
};

export const SelectedRowIsDrawnAndSurvivesASort: Story = {
  name: "A chosen row has its fill, and keeps it when sorted",
  render: () => <DataTable<Employee> aria-label="Chosen" columns={employeeColumns} data={employees.slice(0, 6)} selectionMode="multiple" getRowLabel={(row) => row.name} />,
  play: async () => {
    const table = body.getByRole("table", { name: "Chosen" });
    const first = within(table).getAllByRole("checkbox")[1] as HTMLElement;
    const row = first.closest("tr") as HTMLElement;
    const plain = getComputedStyle(bodyRows(table)[2] as HTMLElement).backgroundColor;
    await userEvent.click(first);
    // the row eases to its fill, so wait for it
    await waitFor(() => expect(getComputedStyle(row).backgroundColor).not.toBe(plain));
    await expect(row).toHaveAttribute("data-selected");
    await userEvent.click(within(table).getByRole("button", { name: "Salary" }));
    const still = within(table).getAllByRole("checkbox", { checked: true });
    await expect(still).toHaveLength(1);
    await expect(still[0]?.closest("tr")).toHaveAttribute("data-selected");
  },
};
