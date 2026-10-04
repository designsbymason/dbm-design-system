import { FunnelIcon } from "@dbm-design-system/icons";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import buttonStyles from "../../atoms/Button/Button.module.css";
import { Spacer } from "../../atoms/Spacer";
import { SearchInput } from "../SearchInput";
import { Toolbar } from "../Toolbar";
import { TableToolbar } from "./TableToolbar";
import styles from "./TableToolbar.module.css";

afterEach(() => {
  vi.restoreAllMocks();
});

// jsdom's own `:focus-visible` depends on which tests ran before it, so a test that needs keyboard focus says so.
const originalMatches = Element.prototype.matches;
const keyboardFocus = () =>
  vi.spyOn(Element.prototype, "matches").mockImplementation(function (this: Element, selector: string) {
    return selector === ":focus-visible" ? true : originalMatches.call(this, selector);
  });

describe("TableToolbar", () => {
  it("is a named group, not a toolbar", () => {
    render(
      <TableToolbar aria-label="Orders tools">
        <TableToolbar.Row>row</TableToolbar.Row>
      </TableToolbar>,
    );
    expect(screen.getByRole("group", { name: "Orders tools" })).toBeInTheDocument();
    expect(screen.queryByRole("toolbar")).toBeNull();
  });

  it("can be named by a visible label", () => {
    render(
      <>
        <span id="label">Orders</span>
        <TableToolbar aria-labelledby="label" />
      </>,
    );
    expect(screen.getByRole("group", { name: "Orders" })).toBeInTheDocument();
  });

  it("warns once in development with no accessible name", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(<TableToolbar />);
    rerender(<TableToolbar />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("no accessible name"));
    warn.mockClear();
    render(<TableToolbar aria-label="Named" />);
    expect(warn).not.toHaveBeenCalled();
  });

  it("forwards its ref and passes className, style, id and data-testid through", () => {
    const ref = createRef<HTMLDivElement>();
    render(<TableToolbar ref={ref} aria-label="x" className="extra" style={{ color: "red" }} id="bar" data-testid="bar" />);
    const bar = screen.getByTestId("bar");
    expect(ref.current).toBe(bar);
    expect(bar).toHaveClass("extra");
    expect(bar).toHaveAttribute("id", "bar");
    expect(bar.style.color).toBe("red");
  });

  it("does not let props replace its role", () => {
    render(<TableToolbar aria-label="x" {...({ role: "region" } as object)} />);
    expect(screen.getByRole("group", { name: "x" })).toBeInTheDocument();
  });

  it("lays out a row and a search slot", () => {
    render(
      <TableToolbar aria-label="x">
        <TableToolbar.Row data-testid="row">
          <TableToolbar.Search data-testid="search">
            <SearchInput aria-label="Search orders" />
          </TableToolbar.Search>
        </TableToolbar.Row>
      </TableToolbar>,
    );
    expect(screen.getByTestId("row")).toHaveClass(styles.row!);
    expect(screen.getByTestId("search")).toHaveClass(styles.search!);
    expect(within(screen.getByTestId("search")).getByRole("searchbox", { name: "Search orders" })).toBeInTheDocument();
  });

  describe("Filter", () => {
    it("is a button named for the filter, opening a named panel of the controls you put in it", async () => {
      const user = userEvent.setup();
      render(
        <TableToolbar aria-label="x">
          <TableToolbar.Filter label="Status">
            <label>
              <input type="checkbox" /> Open
            </label>
          </TableToolbar.Filter>
        </TableToolbar>,
      );
      const trigger = screen.getByRole("button", { name: "Status" });
      expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      await user.click(trigger);
      const panel = await screen.findByRole("dialog", { name: "Status filter" });
      expect(within(panel).getByRole("checkbox", { name: "Open" })).toBeInTheDocument();
      expect(trigger).toHaveAttribute("aria-expanded", "true");
    });

    it("shows how many are applied, says so in its name with the visible word still inside it, and offers Clear", async () => {
      const user = userEvent.setup();
      const onClear = vi.fn();
      render(
        <TableToolbar aria-label="x">
          <TableToolbar.Filter label="Status" count={2} onClear={onClear}>
            panel
          </TableToolbar.Filter>
        </TableToolbar>,
      );
      const trigger = screen.getByRole("button", { name: "Status, 2 active" });
      expect(trigger).toHaveTextContent("Status2");
      expect(trigger).toHaveAttribute("data-active");
      await user.click(trigger);
      await user.click(await screen.findByRole("button", { name: "Clear" }));
      expect(onClear).toHaveBeenCalledTimes(1);
    });

    it("has no count, no Clear and no active state at zero, and Clear only with onClear", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <TableToolbar aria-label="x">
          <TableToolbar.Filter label="Status" onClear={() => {}}>
            panel
          </TableToolbar.Filter>
        </TableToolbar>,
      );
      const trigger = screen.getByRole("button", { name: "Status" });
      expect(trigger).not.toHaveAttribute("data-active");
      await user.click(trigger);
      await screen.findByRole("dialog");
      expect(screen.queryByRole("button", { name: "Clear" })).toBeNull();
      await user.keyboard("{Escape}");
      rerender(
        <TableToolbar aria-label="x">
          <TableToolbar.Filter label="Status" count={3}>
            panel
          </TableToolbar.Filter>
        </TableToolbar>,
      );
      await user.click(screen.getByRole("button", { name: "Status, 3 active" }));
      await screen.findByRole("dialog");
      expect(screen.queryByRole("button", { name: "Clear" })).toBeNull();
    });

    it("treats a negative or non-numeric count as none", () => {
      render(
        <TableToolbar aria-label="x">
          <TableToolbar.Filter label="A" count={-2}>
            x
          </TableToolbar.Filter>
          <TableToolbar.Filter label="B" count={Number.NaN}>
            x
          </TableToolbar.Filter>
        </TableToolbar>,
      );
      expect(screen.getByRole("button", { name: "A" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "B" })).toBeInTheDocument();
    });

    it("replaces its words per key, keeping the others when one is undefined, and writes numbers with formatNumber", async () => {
      const user = userEvent.setup();
      render(
        <TableToolbar aria-label="x">
          <TableToolbar.Filter
            label="Statut"
            count={3}
            onClear={() => {}}
            labels={{ clear: "Effacer", activeCount: undefined, panel: (l) => `Filtre ${l}` }}
            formatNumber={(n) => `#${n}`}
          >
            x
          </TableToolbar.Filter>
        </TableToolbar>,
      );
      const trigger = screen.getByRole("button", { name: "Statut, #3 active" });
      await user.click(trigger);
      expect(await screen.findByRole("dialog", { name: "Filtre Statut" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Effacer" })).toBeInTheDocument();
    });

    it("is secondary and bar-sized on its own, and takes a Toolbar's variant and size inside one", () => {
      const { unmount } = render(
        <TableToolbar aria-label="x" size="lg">
          <TableToolbar.Filter label="Alone">x</TableToolbar.Filter>
        </TableToolbar>,
      );
      expect(screen.getByRole("button", { name: "Alone" })).toHaveClass(buttonStyles.variantSecondary!, buttonStyles.sizeLg!);
      unmount();
      render(
        <Toolbar aria-label="Filters" variant="tertiary" size="sm">
          <Toolbar.Item>
            <TableToolbar.Filter label="Inside">x</TableToolbar.Filter>
          </Toolbar.Item>
        </Toolbar>,
      );
      expect(screen.getByRole("button", { name: "Inside" })).toHaveClass(buttonStyles.variantTertiary!, buttonStyles.sizeSm!);
    });

    it("takes its own variant and size over both", () => {
      render(
        <Toolbar aria-label="Filters" variant="tertiary" size="sm">
          <Toolbar.Item>
            <TableToolbar.Filter label="Own" variant="primary" size="xl">
              x
            </TableToolbar.Filter>
          </Toolbar.Item>
        </Toolbar>,
      );
      expect(screen.getByRole("button", { name: "Own" })).toHaveClass(buttonStyles.variantPrimary!, buttonStyles.sizeXl!);
    });

    it("is in a Toolbar's arrow-key order through Toolbar.Item, opens with Enter and returns focus on Escape", async () => {
      const user = userEvent.setup();
      render(
        <Toolbar aria-label="Filters">
          <Toolbar.Button>First</Toolbar.Button>
          <Toolbar.Item>
            <TableToolbar.Filter label="Status">panel text</TableToolbar.Filter>
          </Toolbar.Item>
          <Toolbar.Button>Last</Toolbar.Button>
        </Toolbar>,
      );
      await user.tab();
      await user.keyboard("{ArrowRight}");
      const trigger = screen.getByRole("button", { name: "Status" });
      expect(trigger).toHaveFocus();
      await user.keyboard("{Enter}");
      expect(await screen.findByText("panel text")).toBeInTheDocument();
      await user.keyboard("{Escape}");
      expect(trigger).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Last" })).toHaveFocus();
    });

    it("can be controlled, reporting open changes", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(
        <TableToolbar aria-label="x">
          <TableToolbar.Filter label="Status" open={false} onOpenChange={onOpenChange}>
            x
          </TableToolbar.Filter>
        </TableToolbar>,
      );
      await user.click(screen.getByRole("button", { name: "Status" }));
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("draws an icon, forwards its ref and passes native props to the button", () => {
      const ref = createRef<HTMLButtonElement>();
      render(
        <TableToolbar aria-label="x">
          <TableToolbar.Filter ref={ref} label="Status" icon={FunnelIcon} data-testid="filter" disabled>
            x
          </TableToolbar.Filter>
        </TableToolbar>,
      );
      const trigger = screen.getByTestId("filter");
      expect(ref.current).toBe(trigger);
      expect(trigger).toBeDisabled();
      expect(trigger.querySelectorAll("svg").length).toBe(2);
    });

    it("warns once in development when it has no label", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(
        <TableToolbar aria-label="x">
          <TableToolbar.Filter label="">x</TableToolbar.Filter>
        </TableToolbar>,
      );
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("no `label`"));
    });
  });

  describe("ActiveFilters", () => {
    const items = [
      { id: "open", label: "Open", group: "Status" },
      { id: "jane", label: "Jane Doe", group: "Owner" },
      { id: "late", label: "Overdue" },
    ];

    it("lists each applied filter as a removable chip named for what it removes, in a list", () => {
      render(<TableToolbar.ActiveFilters items={items} />);
      const list = screen.getByRole("list", { name: "Applied filters" });
      expect(within(list).getAllByRole("listitem")).toHaveLength(3);
      expect(screen.getByRole("button", { name: "Remove filter: Status: Open" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Remove filter: Overdue" })).toBeInTheDocument();
      expect(within(list).getByText("Owner: Jane Doe")).toBeInTheDocument();
    });

    it("calls onRemove with the chip's id, and onClearAll from Clear all", async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      const onClearAll = vi.fn();
      render(<TableToolbar.ActiveFilters items={items} onRemove={onRemove} onClearAll={onClearAll} />);
      await user.click(screen.getByRole("button", { name: "Remove filter: Status: Open" }));
      expect(onRemove).toHaveBeenCalledWith("open");
      await user.click(screen.getByRole("button", { name: "Clear all" }));
      expect(onClearAll).toHaveBeenCalledTimes(1);
    });

    it("offers Clear all only with more than one filter and an onClearAll", () => {
      const { rerender } = render(<TableToolbar.ActiveFilters items={items.slice(0, 1)} onClearAll={() => {}} />);
      expect(screen.queryByRole("button", { name: "Clear all" })).toBeNull();
      rerender(<TableToolbar.ActiveFilters items={items} />);
      expect(screen.queryByRole("button", { name: "Clear all" })).toBeNull();
      rerender(<TableToolbar.ActiveFilters items={items} onClearAll={() => {}} />);
      expect(screen.getByRole("button", { name: "Clear all" })).toBeInTheDocument();
    });

    it("draws nothing while there are none, but keeps its live region in the page", () => {
      render(<TableToolbar.ActiveFilters items={[]} data-testid="af" />);
      expect(screen.getByTestId("af")).toHaveAttribute("hidden");
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("treats a missing or non-array items as none, and warns once about the latter", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { rerender } = render(<TableToolbar.ActiveFilters data-testid="af" />);
      expect(screen.getByTestId("af")).toHaveAttribute("hidden");
      expect(warn).not.toHaveBeenCalled();
      rerender(<TableToolbar.ActiveFilters data-testid="af" items={"oops" as unknown as never[]} />);
      rerender(<TableToolbar.ActiveFilters data-testid="af" items={"oops" as unknown as never[]} />);
      expect(screen.getByTestId("af")).toHaveAttribute("hidden");
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it("announces a change in how many are applied, but not the first count, and says none when they are cleared", async () => {
      const { rerender } = render(<TableToolbar.ActiveFilters items={items.slice(0, 1)} />);
      expect(screen.getByRole("status")).toHaveTextContent("");
      rerender(<TableToolbar.ActiveFilters items={items} />);
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("3 filters applied"));
      rerender(<TableToolbar.ActiveFilters items={items.slice(0, 1)} />);
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("1 filter applied"));
      rerender(<TableToolbar.ActiveFilters items={[]} />);
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("No filters applied"));
    });

    it("announces nothing with announce off, and has no region", () => {
      render(<TableToolbar.ActiveFilters items={items} announce={false} />);
      expect(screen.queryByRole("status")).toBeNull();
    });

    it("replaces its words per key and writes counts with formatNumber", async () => {
      const { rerender } = render(
        <TableToolbar.ActiveFilters items={items.slice(0, 1)} labels={{ list: "Filtres", remove: (l) => `Retirer ${l}`, clearAll: undefined }} formatNumber={(n) => `#${n}`} />,
      );
      expect(screen.getByRole("list", { name: "Filtres" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Retirer Status: Open" })).toBeInTheDocument();
      rerender(<TableToolbar.ActiveFilters items={items} labels={{ list: "Filtres" }} formatNumber={(n) => `#${n}`} onClearAll={() => {}} />);
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("#3 filters applied"));
      expect(screen.getByRole("button", { name: "Clear all" })).toBeInTheDocument();
    });

    it("moves keyboard focus to the chip now in the removed one's place, then to the last, then out", async () => {
      keyboardFocus();
      const user = userEvent.setup();
      const Harness = () => {
        const [list, setList] = useState(items);
        return (
          <TableToolbar aria-label="x">
            <TableToolbar.Row>
              <button>before</button>
              <TableToolbar.ActiveFilters items={list} onRemove={(id) => setList((l) => l.filter((i) => i.id !== id))} />
            </TableToolbar.Row>
          </TableToolbar>
        );
      };
      render(<Harness />);
      const remove = (name: string) => screen.getByRole("button", { name: `Remove filter: ${name}` });
      remove("Status: Open").focus();
      await user.keyboard("{Enter}");
      expect(remove("Owner: Jane Doe")).toHaveFocus();
      await user.keyboard("{Enter}");
      expect(remove("Overdue")).toHaveFocus();
      await user.keyboard("{Enter}");
      // none left: out of the (now hidden) part, to the nearest control before it
      expect(screen.getByRole("button", { name: "before" })).toHaveFocus();
    });

    it("does not move focus after a removal by mouse", async () => {
      const user = userEvent.setup();
      const Harness = () => {
        const [list, setList] = useState(items);
        return (
          <TableToolbar aria-label="x">
            <button>before</button>
            <TableToolbar.ActiveFilters items={list} onRemove={(id) => setList((l) => l.filter((i) => i.id !== id))} />
          </TableToolbar>
        );
      };
      render(<Harness />);
      await user.click(screen.getByRole("button", { name: "Remove filter: Status: Open" }));
      expect(screen.getByRole("button", { name: "Remove filter: Owner: Jane Doe" })).not.toHaveFocus();
    });

    it("takes a tone and a size from the bar unless it sets its own", () => {
      render(
        <TableToolbar aria-label="x" size="lg">
          <TableToolbar.ActiveFilters items={items.slice(0, 1)} tone="brand" />
        </TableToolbar>,
      );
      expect(screen.getByText("Status: Open").closest("span")).toBeInTheDocument();
    });
  });

  describe("Summary", () => {
    it("reads results, one result and no results", () => {
      const { rerender } = render(<TableToolbar.Summary count={128} />);
      expect(screen.getByText("128 results")).toBeInTheDocument();
      rerender(<TableToolbar.Summary count={1} />);
      expect(screen.getByText("1 result")).toBeInTheDocument();
      rerender(<TableToolbar.Summary count={0} />);
      expect(screen.getByText("No results")).toBeInTheDocument();
    });

    it("says 'N of total' once filtered, and only when the total is larger", () => {
      const { rerender } = render(<TableToolbar.Summary count={12} total={128} />);
      expect(screen.getByText("12 of 128 results")).toBeInTheDocument();
      rerender(<TableToolbar.Summary count={128} total={128} />);
      expect(screen.getByText("128 results")).toBeInTheDocument();
    });

    it("shows nothing for an unknown count, and the first count to arrive is not announced", async () => {
      const { rerender } = render(<TableToolbar.Summary count={undefined} data-testid="s" />);
      expect(screen.queryByTestId("s")).toBeNull();
      expect(screen.getByRole("status")).toHaveTextContent("");
      rerender(<TableToolbar.Summary count={128} data-testid="s" />);
      expect(screen.getByTestId("s")).toHaveTextContent("128 results");
      await new Promise((resolve) => setTimeout(resolve, 250));
      expect(screen.getByRole("status")).toHaveTextContent("");
    });

    it("announces a change in the count, but not an unchanged one", async () => {
      const { rerender } = render(<TableToolbar.Summary count={128} />);
      rerender(<TableToolbar.Summary count={128} />);
      await new Promise((resolve) => setTimeout(resolve, 250));
      expect(screen.getByRole("status")).toHaveTextContent("");
      rerender(<TableToolbar.Summary count={12} total={128} />);
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("12 of 128 results"));
    });

    it("forgets the last count while unknown, so the next is a first appearance again", async () => {
      const { rerender } = render(<TableToolbar.Summary count={5} />);
      rerender(<TableToolbar.Summary count={undefined} />);
      rerender(<TableToolbar.Summary count={9} />);
      await new Promise((resolve) => setTimeout(resolve, 250));
      expect(screen.getByRole("status")).toHaveTextContent("");
    });

    it("has no region with announce off", () => {
      render(<TableToolbar.Summary count={3} announce={false} />);
      expect(screen.queryByRole("status")).toBeNull();
    });

    it("replaces its words per key and writes numbers with formatNumber", () => {
      render(
        <TableToolbar.Summary count={12} total={1024} labels={{ resultsOf: (c, t) => `${c}/${t}`, results: undefined }} formatNumber={(n) => `#${n}`} />,
      );
      expect(screen.getByText("12/1024")).toBeInTheDocument();
    });

    it("treats a negative, infinite or NaN count as unknown", () => {
      render(
        <>
          <TableToolbar.Summary count={-1} data-testid="a" announce={false} />
          <TableToolbar.Summary count={Number.NaN} data-testid="b" announce={false} />
          <TableToolbar.Summary count={Number.POSITIVE_INFINITY} data-testid="c" announce={false} />
        </>,
      );
      for (const id of ["a", "b", "c"]) expect(screen.queryByTestId(id)).toBeNull();
    });
  });

  describe("Selection", () => {
    it("shows the count and the bulk actions, in a named group", () => {
      render(
        <TableToolbar.Selection count={3}>
          <button>Archive</button>
        </TableToolbar.Selection>,
      );
      const group = screen.getByRole("group", { name: "Selected rows" });
      expect(group).toHaveTextContent("3 selected");
      expect(within(group).getByRole("button", { name: "Archive" })).toBeInTheDocument();
      expect(group).not.toHaveAttribute("hidden");
    });

    it("is hidden at zero, but keeps its live region in the page", () => {
      render(<TableToolbar.Selection count={0} data-testid="sel" />);
      expect(screen.getByTestId("sel")).toHaveAttribute("hidden");
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("treats a negative, NaN or missing count as none", () => {
      render(
        <>
          <TableToolbar.Selection count={-4} data-testid="a" />
          <TableToolbar.Selection count={Number.NaN} data-testid="b" />
          <TableToolbar.Selection count={undefined as unknown as number} data-testid="c" />
        </>,
      );
      for (const id of ["a", "b", "c"]) expect(screen.getByTestId(id)).toHaveAttribute("hidden");
    });

    it("clears the selection from its button, only when there is an onClear", async () => {
      const user = userEvent.setup();
      const onClear = vi.fn();
      const { rerender } = render(<TableToolbar.Selection count={2} />);
      expect(screen.queryByRole("button", { name: "Clear selection" })).toBeNull();
      rerender(<TableToolbar.Selection count={2} onClear={onClear} />);
      await user.click(screen.getByRole("button", { name: "Clear selection" }));
      expect(onClear).toHaveBeenCalledTimes(1);
    });

    it("offers Select all N only while fewer are selected than there are, and with an onSelectAll", async () => {
      const user = userEvent.setup();
      const onSelectAll = vi.fn();
      const { rerender } = render(<TableToolbar.Selection count={2} totalCount={50} />);
      expect(screen.queryByRole("button", { name: /Select all/ })).toBeNull();
      rerender(<TableToolbar.Selection count={2} totalCount={50} onSelectAll={onSelectAll} />);
      await user.click(screen.getByRole("button", { name: "Select all 50" }));
      expect(onSelectAll).toHaveBeenCalledTimes(1);
      rerender(<TableToolbar.Selection count={50} totalCount={50} onSelectAll={onSelectAll} />);
      expect(screen.queryByRole("button", { name: /Select all/ })).toBeNull();
    });

    it("announces a change in the selection, and its being emptied, but not the first count", async () => {
      const { rerender } = render(<TableToolbar.Selection count={1} />);
      expect(screen.getByRole("status")).toHaveTextContent("");
      rerender(<TableToolbar.Selection count={3} />);
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("3 selected"));
      rerender(<TableToolbar.Selection count={0} />);
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Selection cleared"));
    });

    it("has no region with announce off", () => {
      render(<TableToolbar.Selection count={2} announce={false} />);
      expect(screen.queryByRole("status")).toBeNull();
    });

    it("replaces its words per key and writes counts with formatNumber", async () => {
      const { rerender } = render(
        <TableToolbar.Selection
          count={3}
          totalCount={50}
          onClear={() => {}}
          onSelectAll={() => {}}
          labels={{ group: "Lignes", selected: (n) => `${n} choisies`, clear: undefined, selectAll: (t) => `Tout ${t}` }}
          formatNumber={(n) => `#${n}`}
        />,
      );
      const group = screen.getByRole("group", { name: "Lignes" });
      expect(group).toHaveTextContent("3 choisies");
      expect(within(group).getByRole("button", { name: "Tout 50" })).toBeInTheDocument();
      expect(within(group).getByRole("button", { name: "Clear selection" })).toBeInTheDocument();
      rerender(<TableToolbar.Selection count={3} formatNumber={(n) => `#${n}`} />);
      expect(screen.getByRole("group", { name: "Selected rows" })).toHaveTextContent("#3 selected");
    });

    it("moves keyboard focus to the nearest control before the row when the selection empties with focus inside it", async () => {
      keyboardFocus();
      const user = userEvent.setup();
      const Harness = () => {
        const [count, setCount] = useState(2);
        return (
          <TableToolbar aria-label="x">
            <button>before</button>
            <TableToolbar.Selection count={count} onClear={() => setCount(0)} />
            <button>after</button>
          </TableToolbar>
        );
      };
      render(<Harness />);
      screen.getByRole("button", { name: "Clear selection" }).focus();
      await user.keyboard("{Enter}");
      expect(screen.getByRole("button", { name: "before" })).toHaveFocus();
    });

    it("falls to the next control after it when there is none before, and leaves a mouse press alone", async () => {
      keyboardFocus();
      const user = userEvent.setup();
      const Harness = () => {
        const [count, setCount] = useState(2);
        return (
          <TableToolbar aria-label="x">
            <TableToolbar.Selection count={count} onClear={() => setCount(0)} />
            <button>after</button>
          </TableToolbar>
        );
      };
      render(<Harness />);
      screen.getByRole("button", { name: "Clear selection" }).focus();
      await user.keyboard("{Enter}");
      expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
    });

    it("passes className, style, data-testid and a ref to the row", () => {
      const ref = createRef<HTMLDivElement>();
      render(<TableToolbar.Selection ref={ref} count={1} className="extra" style={{ color: "red" }} data-testid="sel" />);
      const row = screen.getByTestId("sel");
      expect(ref.current).toBe(row);
      expect(row).toHaveClass("extra");
      expect(row.style.color).toBe("red");
    });

    it("does not let props replace its role", () => {
      render(<TableToolbar.Selection count={1} {...({ role: "region" } as object)} />);
      expect(screen.getByRole("group", { name: "Selected rows" })).toBeInTheDocument();
    });
  });

  describe("the whole bar", () => {
    const Bar = ({ selected = 0 }: { selected?: number }) => (
      <TableToolbar aria-label="Orders table tools">
        <TableToolbar.Row>
          <TableToolbar.Search>
            <SearchInput aria-label="Search orders" />
          </TableToolbar.Search>
          <Toolbar aria-label="Filters" variant="secondary">
            <Toolbar.Item>
              <TableToolbar.Filter label="Status" count={2} onClear={() => {}}>
                x
              </TableToolbar.Filter>
            </Toolbar.Item>
            <Toolbar.Item>
              <TableToolbar.Filter label="Owner">x</TableToolbar.Filter>
            </Toolbar.Item>
          </Toolbar>
          <Spacer />
          <Toolbar aria-label="Actions" variant="secondary">
            <Toolbar.Button>Export</Toolbar.Button>
          </Toolbar>
        </TableToolbar.Row>
        <TableToolbar.Row>
          <TableToolbar.ActiveFilters
            items={[
              { id: "a", label: "Open", group: "Status" },
              { id: "b", label: "Jane", group: "Owner" },
            ]}
            onRemove={() => {}}
            onClearAll={() => {}}
          />
          <TableToolbar.Summary count={12} total={128} />
        </TableToolbar.Row>
        <TableToolbar.Selection count={selected} totalCount={12} onClear={() => {}} onSelectAll={() => {}}>
          <Toolbar aria-label="Bulk actions" variant="secondary">
            <Toolbar.Button>Archive</Toolbar.Button>
          </Toolbar>
        </TableToolbar.Selection>
      </TableToolbar>
    );

    it("tabs through the search field, each toolbar once, then the chips, in reading order", async () => {
      const user = userEvent.setup();
      render(<Bar selected={0} />);
      await user.tab();
      expect(screen.getByRole("searchbox", { name: "Search orders" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "Status, 2 active" })).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Owner" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "Export" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "Remove filter: Status: Open" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "Remove filter: Owner: Jane" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "Clear all" })).toHaveFocus();
    });

    it("keeps the search field's own arrow keys, since it is not inside a toolbar", async () => {
      const user = userEvent.setup();
      render(<Bar />);
      const search = screen.getByRole("searchbox", { name: "Search orders" });
      await user.click(search);
      await user.keyboard("abc{ArrowLeft}{ArrowLeft}X");
      expect(search).toHaveValue("aXbc");
      expect(search).toHaveFocus();
    });

    it("shows the selection row when rows are selected, with its own toolbar of bulk actions", async () => {
      const { rerender } = render(<Bar selected={0} />);
      expect(document.querySelector('[aria-label="Selected rows"]')).toHaveAttribute("hidden");
      rerender(<Bar selected={4} />);
      const group = screen.getByRole("group", { name: "Selected rows" });
      expect(within(group).getByRole("toolbar", { name: "Bulk actions" })).toBeInTheDocument();
      expect(within(group).getByRole("button", { name: "Select all 12" })).toBeInTheDocument();
    });

    it("has no axe violations, with the selection row showing and with it hidden", async () => {
      const { container, rerender } = render(<Bar selected={0} />);
      expect(await axe(container)).toHaveNoViolations();
      rerender(<Bar selected={3} />);
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no axe violations with a filter panel open", async () => {
      const user = userEvent.setup();
      const { container } = render(<Bar />);
      await user.click(screen.getByRole("button", { name: "Status, 2 active" }));
      await screen.findByRole("dialog");
      expect(await axe(container)).toHaveNoViolations();
    });

    it("survives StrictMode", async () => {
      const user = userEvent.setup();
      render(
        <StrictMode>
          <Bar selected={2} />
        </StrictMode>,
      );
      await user.tab();
      expect(screen.getByRole("searchbox", { name: "Search orders" })).toHaveFocus();
      act(() => {});
      expect(screen.getByRole("group", { name: "Selected rows" })).toHaveTextContent("2 selected");
    });
  });
});
