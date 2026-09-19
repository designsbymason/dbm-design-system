import { act, render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Table } from "./Table";
import styles from "./Table.module.css";
import type { TableProps, TableSize } from "./Table.types";

const OriginalResizeObserver = globalThis.ResizeObserver;

/**
 * jsdom has no layout, so overflow is simulated: `Element`'s own size getters
 * are spied to report whatever `state` currently says, and a fake
 * `ResizeObserver` fires its callback on `observe()` (as a real one does
 * once, initially) and again whenever `trigger()` is called.
 */
function installOverflowSimulation(initiallyOverflowing: boolean) {
  const state = { overflowing: initiallyOverflowing };
  const callbacks: Array<() => void> = [];

  class FakeResizeObserver {
    private readonly callback: () => void;

    constructor(callback: () => void) {
      this.callback = callback;
      callbacks.push(callback);
    }

    observe() {
      this.callback();
    }

    unobserve() {}

    disconnect() {}
  }

  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  vi.spyOn(Element.prototype, "scrollWidth", "get").mockImplementation(() => (state.overflowing ? 500 : 100));
  vi.spyOn(Element.prototype, "clientWidth", "get").mockReturnValue(100);
  vi.spyOn(Element.prototype, "scrollHeight", "get").mockReturnValue(100);
  vi.spyOn(Element.prototype, "clientHeight", "get").mockReturnValue(100);

  return {
    setOverflowing(next: boolean) {
      state.overflowing = next;
      act(() => {
        callbacks.forEach((callback) => callback());
      });
    },
  };
}

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.stubGlobal("ResizeObserver", OriginalResizeObserver);
});

function renderTable(props: Partial<TableProps> = {}) {
  return render(
    <Table {...props}>
      <Table.Caption>Recent invoices</Table.Caption>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Invoice</Table.HeaderCell>
          <Table.HeaderCell>Status</Table.HeaderCell>
          <Table.HeaderCell align="end">Amount</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        <Table.Row>
          <Table.HeaderCell scope="row">INV-001</Table.HeaderCell>
          <Table.Cell>Paid</Table.Cell>
          <Table.Cell align="end">$250.00</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.HeaderCell scope="row">INV-002</Table.HeaderCell>
          <Table.Cell>Pending</Table.Cell>
          <Table.Cell align="end">$150.00</Table.Cell>
        </Table.Row>
      </Table.Body>
      <Table.Footer>
        <Table.Row>
          <Table.HeaderCell scope="row">Total</Table.HeaderCell>
          <Table.Cell />
          <Table.Cell align="end">$400.00</Table.Cell>
        </Table.Row>
      </Table.Footer>
    </Table>,
  );
}

describe("Table", () => {
  describe("structure and semantics", () => {
    it("renders a real table with caption, row groups, rows, and header/data cells", () => {
      renderTable();
      const table = screen.getByRole("table", { name: "Recent invoices" });
      expect(table.tagName).toBe("TABLE");
      expect(within(table).getByText("Recent invoices").tagName).toBe("CAPTION");
      expect(within(table).getAllByRole("rowgroup")).toHaveLength(3);
      expect(within(table).getAllByRole("row")).toHaveLength(4);
      expect(within(table).getAllByRole("columnheader")).toHaveLength(3);
      expect(within(table).getAllByRole("rowheader")).toHaveLength(3);
      expect(within(table).getAllByRole("cell").length).toBeGreaterThan(0);
    });

    it("renders each sub-part as the native element its name suggests", () => {
      renderTable();
      const table = screen.getByRole("table");
      expect(table.querySelector(":scope > thead")).not.toBeNull();
      expect(table.querySelector(":scope > tbody")).not.toBeNull();
      expect(table.querySelector(":scope > tfoot")).not.toBeNull();
      expect(table.querySelector("thead > tr > th")).not.toBeNull();
      expect(table.querySelector("tbody > tr > td")).not.toBeNull();
    });

    it("gives Table.HeaderCell scope=col by default", () => {
      renderTable();
      screen.getAllByRole("columnheader").forEach((header) => {
        expect(header).toHaveAttribute("scope", "col");
      });
    });

    it("lets Table.HeaderCell override scope, e.g. for row headers", () => {
      renderTable();
      screen.getAllByRole("rowheader").forEach((header) => {
        expect(header).toHaveAttribute("scope", "row");
      });
    });

    it("passes native table-cell attributes such as colSpan straight through", () => {
      render(
        <Table aria-label="Spanning">
          <Table.Body>
            <Table.Row>
              <Table.Cell colSpan={3} data-testid="spanning">
                Spans three columns
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>,
      );
      expect(screen.getByTestId("spanning")).toHaveAttribute("colspan", "3");
    });

    it("wraps the table in a scroll container", () => {
      renderTable();
      const table = screen.getByRole("table");
      const container = table.parentElement;
      expect(container?.tagName).toBe("DIV");
      expect(container).toHaveClass(styles.container ?? "");
    });
  });

  describe("header row vs. row headers", () => {
    it("applies the column-header row's own class to the <thead> only, never to a body row header", () => {
      renderTable();
      const [header, body, footer] = screen.getAllByRole("rowgroup");
      expect(header).toHaveClass(styles.header ?? "");
      expect(body).not.toHaveClass(styles.header ?? "");
      expect(footer).not.toHaveClass(styles.header ?? "");
    });

    it("gives every header cell — column or row — the same headerCell class", () => {
      renderTable();
      screen.getAllByRole("columnheader").forEach((cell) => expect(cell).toHaveClass(styles.headerCell ?? ""));
      screen.getAllByRole("rowheader").forEach((cell) => expect(cell).toHaveClass(styles.headerCell ?? ""));
    });
  });

  describe("variant", () => {
    it("defaults to the bordered variant", () => {
      renderTable();
      const container = screen.getByRole("table").parentElement;
      expect(container).toHaveClass(styles.containerBordered ?? "");
      expect(container).not.toHaveClass(styles.containerGhost ?? "");
    });

    it("applies the ghost variant's own class, removing the outer border", () => {
      renderTable({ variant: "ghost" });
      const container = screen.getByRole("table").parentElement;
      expect(container).toHaveClass(styles.containerGhost ?? "");
      expect(container).not.toHaveClass(styles.containerBordered ?? "");
    });
  });

  describe("size", () => {
    const classForSize: Record<TableSize, string | undefined> = {
      xs: styles.sizeXs,
      sm: styles.sizeSm,
      md: styles.sizeMd,
      lg: styles.sizeLg,
      xl: styles.sizeXl,
    };

    it("defaults to md", () => {
      renderTable();
      expect(screen.getByText("Paid")).toHaveClass(classForSize.md ?? "");
      expect(screen.getByText("Invoice")).toHaveClass(classForSize.md ?? "");
    });

    it.each(["xs", "sm", "md", "lg", "xl"] as const)("applies size=%s to both data and header cells", (size) => {
      renderTable({ size });
      expect(screen.getByText("Paid")).toHaveClass(classForSize[size] ?? "");
      expect(screen.getByText("Invoice")).toHaveClass(classForSize[size] ?? "");
      expect(screen.getByText("INV-001")).toHaveClass(classForSize[size] ?? "");
    });
  });

  describe("striped, hoverable, and stickyHeader", () => {
    it("adds no striping, hover, or sticky behavior by default", () => {
      renderTable();
      const body = screen.getAllByRole("rowgroup")[1];
      const header = screen.getAllByRole("rowgroup")[0];
      expect(body).not.toHaveClass(styles.bodyStriped ?? "");
      expect(body).not.toHaveClass(styles.bodyHoverable ?? "");
      expect(header).not.toHaveClass(styles.headerSticky ?? "");
    });

    it("applies striping to the body only", () => {
      renderTable({ striped: true });
      const [header, body, footer] = screen.getAllByRole("rowgroup");
      expect(body).toHaveClass(styles.bodyStriped ?? "");
      expect(header).not.toHaveClass(styles.bodyStriped ?? "");
      expect(footer).not.toHaveClass(styles.bodyStriped ?? "");
    });

    it("applies hover highlighting to the body only", () => {
      renderTable({ hoverable: true });
      const [header, body] = screen.getAllByRole("rowgroup");
      expect(body).toHaveClass(styles.bodyHoverable ?? "");
      expect(header).not.toHaveClass(styles.bodyHoverable ?? "");
    });

    it("pins the header when stickyHeader is set", () => {
      renderTable({ stickyHeader: true, maxHeight: "10rem" });
      const [header, body] = screen.getAllByRole("rowgroup");
      expect(header).toHaveClass(styles.headerSticky ?? "");
      expect(body).not.toHaveClass(styles.headerSticky ?? "");
    });

    it("caps the scroll container's height via maxHeight", () => {
      renderTable({ maxHeight: "12rem" });
      expect(screen.getByRole("table").parentElement).toHaveStyle({ maxBlockSize: "12rem" });
    });

    it("sets no height cap by default", () => {
      renderTable();
      expect(screen.getByRole("table").parentElement?.style.maxBlockSize).toBe("");
    });
  });

  describe("tone", () => {
    const tintedTones = ["brand", "info", "success", "warning", "danger"] as const;
    const toneClassFor: Record<(typeof tintedTones)[number], string | undefined> = {
      brand: styles.toneBrand,
      info: styles.toneInfo,
      success: styles.toneSuccess,
      warning: styles.toneWarning,
      danger: styles.toneDanger,
    };
    const allToneClasses = Object.values(toneClassFor).map((name) => name ?? "");

    it("defaults to neutral — no tinted or tone classes anywhere", () => {
      renderTable({ striped: true, hoverable: true });
      const [header, body] = screen.getAllByRole("rowgroup");
      const caption = screen.getByText("Recent invoices");
      expect(header).not.toHaveClass(styles.headerTinted ?? "");
      expect(caption).not.toHaveClass(styles.captionTinted ?? "");
      expect(body).toHaveClass(styles.bodyStriped ?? "");
      expect(body).toHaveClass(styles.bodyHoverable ?? "");
      expect(body).not.toHaveClass(styles.bodyStripedTinted ?? "");
      expect(body).not.toHaveClass(styles.bodyHoverableTinted ?? "");
      [header, body, caption].forEach((element) => {
        allToneClasses.forEach((toneClass) => expect(element).not.toHaveClass(toneClass));
      });
    });

    it("treats an explicit tone=neutral exactly like the default", () => {
      renderTable({ tone: "neutral", striped: true });
      const [header, body] = screen.getAllByRole("rowgroup");
      expect(header).not.toHaveClass(styles.headerTinted ?? "");
      expect(body).toHaveClass(styles.bodyStriped ?? "");
    });

    describe.each(tintedTones)("tone=%s", (tone) => {
      const toneClass = toneClassFor[tone] ?? "";

      it("tints the header, and only the header row group", () => {
        renderTable({ tone });
        const [header, body, footer] = screen.getAllByRole("rowgroup");
        expect(header).toHaveClass(styles.headerTinted ?? "", toneClass);
        expect(body).not.toHaveClass(styles.headerTinted ?? "");
        expect(footer).not.toHaveClass(styles.headerTinted ?? "");
      });

      it("tints the caption in the same tone", () => {
        renderTable({ tone });
        expect(screen.getByText("Recent invoices")).toHaveClass(styles.captionTinted ?? "", toneClass);
      });

      it("swaps the neutral stripe and hover classes for the tinted ones, in this tone", () => {
        renderTable({ tone, striped: true, hoverable: true });
        const body = screen.getAllByRole("rowgroup")[1];
        expect(body).toHaveClass(styles.bodyStripedTinted ?? "", styles.bodyHoverableTinted ?? "", toneClass);
        expect(body).not.toHaveClass(styles.bodyStriped ?? "");
        expect(body).not.toHaveClass(styles.bodyHoverable ?? "");
      });

      it("carries only its own tone class, never another tone's", () => {
        renderTable({ tone, striped: true });
        const [header, body] = screen.getAllByRole("rowgroup");
        const caption = screen.getByText("Recent invoices");
        [header, body, caption].forEach((element) => {
          allToneClasses
            .filter((other) => other !== toneClass)
            .forEach((otherClass) => expect(element).not.toHaveClass(otherClass));
        });
      });

      it("adds no stripe/hover classes when striped/hoverable are off", () => {
        renderTable({ tone });
        const body = screen.getAllByRole("rowgroup")[1];
        expect(body).not.toHaveClass(styles.bodyStripedTinted ?? "");
        expect(body).not.toHaveClass(styles.bodyHoverableTinted ?? "");
      });

      it("composes with stickyHeader — a pinned toned header carries both classes", () => {
        renderTable({ tone, stickyHeader: true, maxHeight: "10rem" });
        expect(screen.getAllByRole("rowgroup")[0]).toHaveClass(styles.headerTinted ?? "", styles.headerSticky ?? "");
      });

      it("has no jest-axe violations with striped, hoverable, and a sticky header", async () => {
        const { container } = renderTable({
          tone,
          striped: true,
          hoverable: true,
          stickyHeader: true,
          maxHeight: "10rem",
        });
        expect(await axe(container)).toHaveNoViolations();
      });
    });

    it("leaves cell sizing and row headers untouched by any tone", () => {
      renderTable({ tone: "success", size: "lg" });
      expect(screen.getByText("Paid")).toHaveClass(styles.sizeLg ?? "");
      expect(screen.getByText("INV-001")).toHaveClass(styles.headerCell ?? "");
    });

    it("doesn't leak an outer toned table's tone into a neutral table nested in a cell", () => {
      render(
        <Table tone="danger" striped aria-label="Outer">
          <Table.Header data-testid="outer-header">
            <Table.Row>
              <Table.HeaderCell>Outer</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell>
                <Table aria-label="Inner" striped>
                  <Table.Header data-testid="inner-header">
                    <Table.Row>
                      <Table.HeaderCell>Inner</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body data-testid="inner-body">
                    <Table.Row>
                      <Table.Cell>x</Table.Cell>
                    </Table.Row>
                  </Table.Body>
                </Table>
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>,
      );
      expect(screen.getByTestId("outer-header")).toHaveClass(styles.headerTinted ?? "", styles.toneDanger ?? "");
      expect(screen.getByTestId("inner-header")).not.toHaveClass(styles.headerTinted ?? "");
      expect(screen.getByTestId("inner-header")).not.toHaveClass(styles.toneDanger ?? "");
      expect(screen.getByTestId("inner-body")).toHaveClass(styles.bodyStriped ?? "");
      expect(screen.getByTestId("inner-body")).not.toHaveClass(styles.bodyStripedTinted ?? "");
    });
  });

  describe("align", () => {
    it("applies center and end alignment classes, and none for the start default", () => {
      render(
        <Table aria-label="Alignment">
          <Table.Body>
            <Table.Row>
              <Table.Cell data-testid="start">start</Table.Cell>
              <Table.Cell align="center" data-testid="center">
                center
              </Table.Cell>
              <Table.Cell align="end" data-testid="end">
                end
              </Table.Cell>
              <Table.HeaderCell align="end" data-testid="header-end">
                end
              </Table.HeaderCell>
            </Table.Row>
          </Table.Body>
        </Table>,
      );
      expect(screen.getByTestId("start")).not.toHaveClass(styles.alignCenter ?? "", styles.alignEnd ?? "");
      expect(screen.getByTestId("center")).toHaveClass(styles.alignCenter ?? "");
      expect(screen.getByTestId("end")).toHaveClass(styles.alignEnd ?? "");
      expect(screen.getByTestId("header-end")).toHaveClass(styles.alignEnd ?? "");
    });

    it("doesn't leak Table.Cell's typed align into a native `align` attribute", () => {
      render(
        <Table aria-label="Alignment">
          <Table.Body>
            <Table.Row>
              <Table.Cell align="end" data-testid="end">
                end
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>,
      );
      expect(screen.getByTestId("end")).not.toHaveAttribute("align");
    });
  });

  describe("native passthrough, ref forwarding, and the escape-hatch props", () => {
    it("applies id, className, style, data-testid, and aria-* to the <table> itself", () => {
      renderTable({
        id: "invoices",
        className: "extra",
        style: { color: "rgb(1, 2, 3)" },
        "data-testid": "the-table",
        "aria-describedby": "context",
      });
      const table = screen.getByTestId("the-table");
      expect(table.tagName).toBe("TABLE");
      expect(table).toHaveAttribute("id", "invoices");
      expect(table).toHaveClass("extra");
      expect(table).toHaveStyle({ color: "rgb(1, 2, 3)" });
      expect(table).toHaveAttribute("aria-describedby", "context");
    });

    it("applies containerClassName to the scroll container, not the table", () => {
      renderTable({ containerClassName: "frame" });
      const table = screen.getByRole("table");
      expect(table.parentElement).toHaveClass("frame");
      expect(table).not.toHaveClass("frame");
    });

    it("passes other native <table> attributes through", () => {
      renderTable({ onClick: vi.fn(), title: "Invoices" });
      expect(screen.getByRole("table")).toHaveAttribute("title", "Invoices");
    });

    it("forwards refs to the right element for every part", () => {
      const tableRef = createRef<HTMLTableElement>();
      const headerRef = createRef<HTMLTableSectionElement>();
      const bodyRef = createRef<HTMLTableSectionElement>();
      const footerRef = createRef<HTMLTableSectionElement>();
      const rowRef = createRef<HTMLTableRowElement>();
      const headerCellRef = createRef<HTMLTableCellElement>();
      const cellRef = createRef<HTMLTableCellElement>();
      const captionRef = createRef<HTMLTableCaptionElement>();
      render(
        <Table ref={tableRef}>
          <Table.Caption ref={captionRef}>Caption</Table.Caption>
          <Table.Header ref={headerRef}>
            <Table.Row ref={rowRef}>
              <Table.HeaderCell ref={headerCellRef}>Head</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body ref={bodyRef}>
            <Table.Row>
              <Table.Cell ref={cellRef}>Cell</Table.Cell>
            </Table.Row>
          </Table.Body>
          <Table.Footer ref={footerRef}>
            <Table.Row>
              <Table.Cell>Foot</Table.Cell>
            </Table.Row>
          </Table.Footer>
        </Table>,
      );
      expect(tableRef.current?.tagName).toBe("TABLE");
      expect(captionRef.current?.tagName).toBe("CAPTION");
      expect(headerRef.current?.tagName).toBe("THEAD");
      expect(bodyRef.current?.tagName).toBe("TBODY");
      expect(footerRef.current?.tagName).toBe("TFOOT");
      expect(rowRef.current?.tagName).toBe("TR");
      expect(headerCellRef.current?.tagName).toBe("TH");
      expect(cellRef.current?.tagName).toBe("TD");
    });

    it("passes id, className, style, and data-testid through on every sub-part", () => {
      render(
        <Table aria-label="Passthrough">
          <Table.Caption id="cap" className="c-cap" style={{ opacity: 0.9 }} data-testid="cap">
            Caption
          </Table.Caption>
          <Table.Header id="hd" className="c-hd" style={{ opacity: 0.9 }} data-testid="hd">
            <Table.Row id="hr" className="c-hr" style={{ opacity: 0.9 }} data-testid="hr">
              <Table.HeaderCell id="th" className="c-th" style={{ opacity: 0.9 }} data-testid="th">
                Head
              </Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body id="bd" className="c-bd" style={{ opacity: 0.9 }} data-testid="bd">
            <Table.Row>
              <Table.Cell id="td" className="c-td" style={{ opacity: 0.9 }} data-testid="td">
                Cell
              </Table.Cell>
            </Table.Row>
          </Table.Body>
          <Table.Footer id="ft" className="c-ft" style={{ opacity: 0.9 }} data-testid="ft">
            <Table.Row>
              <Table.Cell>Foot</Table.Cell>
            </Table.Row>
          </Table.Footer>
        </Table>,
      );
      (["cap", "hd", "hr", "th", "bd", "td", "ft"] as const).forEach((key) => {
        const element = screen.getByTestId(key);
        expect(element).toHaveAttribute("id", key);
        expect(element).toHaveClass(`c-${key}`);
        expect(element).toHaveStyle({ opacity: "0.9" });
      });
    });

    it("renders no consumer-visible id on a caption unless one is given, but always has one internally", () => {
      renderTable();
      expect(screen.getByText("Recent invoices").id).not.toBe("");
    });

    it("respects a consumer-supplied caption id over the generated one", () => {
      render(
        <Table>
          <Table.Caption id="my-caption">Caption</Table.Caption>
        </Table>,
      );
      expect(screen.getByText("Caption")).toHaveAttribute("id", "my-caption");
    });
  });

  describe("nesting", () => {
    it("doesn't leak an outer table's size/striped/hoverable/stickyHeader into a table nested in a cell", () => {
      render(
        <Table size="xl" striped hoverable aria-label="Outer">
          <Table.Body>
            <Table.Row>
              <Table.Cell>
                <Table aria-label="Inner">
                  <Table.Body data-testid="inner-body">
                    <Table.Row>
                      <Table.Cell data-testid="inner-cell">inner</Table.Cell>
                    </Table.Row>
                  </Table.Body>
                </Table>
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>,
      );
      expect(screen.getByTestId("inner-cell")).toHaveClass(styles.sizeMd ?? "");
      expect(screen.getByTestId("inner-cell")).not.toHaveClass(styles.sizeXl ?? "");
      expect(screen.getByTestId("inner-body")).not.toHaveClass(styles.bodyStriped ?? "");
      expect(screen.getByTestId("inner-body")).not.toHaveClass(styles.bodyHoverable ?? "");
    });
  });

  describe("scroll region (overflow-aware keyboard access)", () => {
    it("is not focusable and has no region role while the table fits", () => {
      installOverflowSimulation(false);
      renderTable();
      const container = screen.getByRole("table").parentElement;
      expect(container).not.toHaveAttribute("tabindex");
      expect(container).not.toHaveAttribute("role");
    });

    it("becomes a focusable region named after the caption while the table overflows", () => {
      installOverflowSimulation(true);
      renderTable();
      const region = screen.getByRole("region", { name: "Recent invoices" });
      expect(region).toBe(screen.getByRole("table").parentElement);
      expect(region).toHaveAttribute("tabindex", "0");
    });

    it("names the region after aria-label when one is given", () => {
      installOverflowSimulation(true);
      render(
        <Table aria-label="Quarterly revenue">
          <Table.Body>
            <Table.Row>
              <Table.Cell>x</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>,
      );
      expect(screen.getByRole("region", { name: "Quarterly revenue" })).toHaveAttribute("tabindex", "0");
    });

    it("names the region after aria-labelledby when one is given", () => {
      installOverflowSimulation(true);
      render(
        <>
          <h2 id="heading">Team roster</h2>
          <Table aria-labelledby="heading">
            <Table.Body>
              <Table.Row>
                <Table.Cell>x</Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>
        </>,
      );
      expect(screen.getByRole("region", { name: "Team roster" })).toHaveAttribute("tabindex", "0");
    });

    it("prefers aria-label over the caption when both exist", () => {
      installOverflowSimulation(true);
      renderTable({ "aria-label": "Explicit name" });
      expect(screen.getByRole("region", { name: "Explicit name" })).toBeInTheDocument();
    });

    it("is still keyboard-focusable, but not announced as a region, when there is no name to give it", () => {
      installOverflowSimulation(true);
      render(
        <Table>
          <Table.Body>
            <Table.Row>
              <Table.Cell>x</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>,
      );
      const container = screen.getByRole("table").parentElement;
      expect(container).toHaveAttribute("tabindex", "0");
      expect(container).not.toHaveAttribute("role");
    });

    it("doesn't mistake a nested table's caption for the outer table's own", () => {
      installOverflowSimulation(true);
      render(
        <Table>
          <Table.Body>
            <Table.Row>
              <Table.Cell>
                <Table>
                  <Table.Caption>Inner caption</Table.Caption>
                  <Table.Body>
                    <Table.Row>
                      <Table.Cell>x</Table.Cell>
                    </Table.Row>
                  </Table.Body>
                </Table>
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>,
      );
      // The simulation reports every container as overflowing, so the inner
      // table's own container legitimately becomes a region named after its
      // own caption — what matters is the *outer* container, which has no
      // caption of its own, must not adopt the inner one.
      const [outerTable] = screen.getAllByRole("table");
      const outerContainer = outerTable?.parentElement;
      expect(outerContainer).toHaveAttribute("tabindex", "0");
      expect(outerContainer).not.toHaveAttribute("role");
      expect(outerContainer).not.toHaveAttribute("aria-labelledby");
    });

    it("gains and loses focusability as the overflow state changes", () => {
      const simulation = installOverflowSimulation(false);
      renderTable();
      const container = screen.getByRole("table").parentElement;
      expect(container).not.toHaveAttribute("tabindex");

      simulation.setOverflowing(true);
      expect(container).toHaveAttribute("tabindex", "0");
      expect(container).toHaveAttribute("role", "region");

      simulation.setOverflowing(false);
      expect(container).not.toHaveAttribute("tabindex");
      expect(container).not.toHaveAttribute("role");
    });

    it("is already correct on the first commit, before any ResizeObserver callback has fired", () => {
      // Overflow is real, but the (default no-op) ResizeObserver never calls
      // back — so this only passes if the region is measured synchronously on
      // mount rather than learned one async tick later. An automated
      // accessibility check that runs the instant a story renders would
      // otherwise catch a scrollable, unfocusable container.
      vi.spyOn(Element.prototype, "scrollWidth", "get").mockReturnValue(500);
      vi.spyOn(Element.prototype, "clientWidth", "get").mockReturnValue(100);
      renderTable();
      const container = screen.getByRole("table").parentElement;
      expect(container).toHaveAttribute("tabindex", "0");
      expect(container).toHaveAttribute("role", "region");
    });

    it("never crashes where ResizeObserver doesn't exist, just never reports overflow", () => {
      vi.stubGlobal("ResizeObserver", undefined);
      renderTable();
      expect(screen.getByRole("table").parentElement).not.toHaveAttribute("tabindex");
    });
  });

  describe("stickyFirstColumn", () => {
    it("pins no first column by default", () => {
      renderTable();
      screen.getAllByRole("rowgroup").forEach((group) => {
        expect(group).not.toHaveClass(styles.firstColumnSticky ?? "");
      });
    });

    it("marks the header, body, and footer row groups when set", () => {
      renderTable({ stickyFirstColumn: true });
      screen.getAllByRole("rowgroup").forEach((group) => {
        expect(group).toHaveClass(styles.firstColumnSticky ?? "");
      });
    });

    it("leaves the caption alone", () => {
      renderTable({ stickyFirstColumn: true });
      expect(screen.getByText("Recent invoices")).not.toHaveClass(styles.firstColumnSticky ?? "");
    });

    it("composes with stickyHeader — the header group carries both classes", () => {
      renderTable({ stickyFirstColumn: true, stickyHeader: true, maxHeight: "10rem" });
      expect(screen.getAllByRole("rowgroup")[0]).toHaveClass(
        styles.firstColumnSticky ?? "",
        styles.headerSticky ?? "",
      );
    });

    it("composes with a tone and striped/hoverable rows", () => {
      renderTable({ stickyFirstColumn: true, tone: "success", striped: true, hoverable: true });
      const [header, body] = screen.getAllByRole("rowgroup");
      expect(header).toHaveClass(styles.firstColumnSticky ?? "", styles.headerTinted ?? "", styles.toneSuccess ?? "");
      expect(body).toHaveClass(
        styles.firstColumnSticky ?? "",
        styles.bodyStripedTinted ?? "",
        styles.bodyHoverableTinted ?? "",
      );
    });

    it("doesn't leak into a table nested in a cell", () => {
      render(
        <Table stickyFirstColumn aria-label="Outer">
          <Table.Body>
            <Table.Row>
              <Table.Cell>
                <Table aria-label="Inner">
                  <Table.Body data-testid="inner-body">
                    <Table.Row>
                      <Table.Cell>x</Table.Cell>
                    </Table.Row>
                  </Table.Body>
                </Table>
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>,
      );
      expect(screen.getByTestId("inner-body")).not.toHaveClass(styles.firstColumnSticky ?? "");
    });

    it("has no jest-axe violations", async () => {
      const { container } = renderTable({ stickyFirstColumn: true, stickyHeader: true, maxHeight: "10rem" });
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe("stickyLastColumn", () => {
    it("pins no last column by default", () => {
      renderTable();
      screen.getAllByRole("rowgroup").forEach((group) => {
        expect(group).not.toHaveClass(styles.lastColumnSticky ?? "");
      });
    });

    it("marks the header, body, and footer row groups when set — and only the last column, not the first", () => {
      renderTable({ stickyLastColumn: true });
      screen.getAllByRole("rowgroup").forEach((group) => {
        expect(group).toHaveClass(styles.lastColumnSticky ?? "");
        expect(group).not.toHaveClass(styles.firstColumnSticky ?? "");
      });
    });

    it("leaves the caption alone", () => {
      renderTable({ stickyLastColumn: true });
      expect(screen.getByText("Recent invoices")).not.toHaveClass(styles.lastColumnSticky ?? "");
    });

    it("can be combined with stickyFirstColumn — each row group carries both", () => {
      renderTable({ stickyFirstColumn: true, stickyLastColumn: true });
      screen.getAllByRole("rowgroup").forEach((group) => {
        expect(group).toHaveClass(styles.firstColumnSticky ?? "", styles.lastColumnSticky ?? "");
      });
    });

    it("composes with stickyHeader — the header group carries both classes", () => {
      renderTable({ stickyLastColumn: true, stickyHeader: true, maxHeight: "10rem" });
      expect(screen.getAllByRole("rowgroup")[0]).toHaveClass(
        styles.lastColumnSticky ?? "",
        styles.headerSticky ?? "",
      );
    });

    it("composes with a tone and striped/hoverable rows", () => {
      renderTable({ stickyLastColumn: true, tone: "danger", striped: true, hoverable: true });
      const [header, body] = screen.getAllByRole("rowgroup");
      expect(header).toHaveClass(styles.lastColumnSticky ?? "", styles.headerTinted ?? "", styles.toneDanger ?? "");
      expect(body).toHaveClass(
        styles.lastColumnSticky ?? "",
        styles.bodyStripedTinted ?? "",
        styles.bodyHoverableTinted ?? "",
      );
    });

    it("doesn't leak into a table nested in a cell", () => {
      render(
        <Table stickyLastColumn aria-label="Outer">
          <Table.Body>
            <Table.Row>
              <Table.Cell>
                <Table aria-label="Inner">
                  <Table.Body data-testid="inner-body">
                    <Table.Row>
                      <Table.Cell>x</Table.Cell>
                    </Table.Row>
                  </Table.Body>
                </Table>
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>,
      );
      expect(screen.getByTestId("inner-body")).not.toHaveClass(styles.lastColumnSticky ?? "");
    });

    it("also applies to loading skeleton rows and the empty state's row group", () => {
      render(
        <Table stickyLastColumn aria-label="States">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>One</Table.HeaderCell>
              <Table.HeaderCell>Two</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body data-testid="loading-body" loading />
          <Table.Body data-testid="empty-body">
            <Table.Empty>Nothing</Table.Empty>
          </Table.Body>
        </Table>,
      );
      expect(screen.getByTestId("loading-body")).toHaveClass(styles.lastColumnSticky ?? "");
      expect(screen.getByTestId("empty-body")).toHaveClass(styles.lastColumnSticky ?? "");
    });

    it("has no jest-axe violations with both columns and the header pinned", async () => {
      const { container } = renderTable({
        stickyFirstColumn: true,
        stickyLastColumn: true,
        stickyHeader: true,
        maxHeight: "10rem",
      });
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe("numeric", () => {
    const renderCells = (cellProps: object, headerProps: object = {}) =>
      render(
        <Table aria-label="Numbers">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell data-testid="head" {...headerProps}>
                Amount
              </Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell data-testid="cell" {...cellProps}>
                1,234.50
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>,
      );

    it("is off by default: start-aligned, proportional figures", () => {
      renderCells({});
      expect(screen.getByTestId("cell")).not.toHaveClass(styles.numeric ?? "", styles.alignEnd ?? "");
    });

    it("end-aligns and sets tabular figures on a numeric cell", () => {
      renderCells({ numeric: true });
      expect(screen.getByTestId("cell")).toHaveClass(styles.numeric ?? "", styles.alignEnd ?? "");
    });

    it("does the same on a numeric header cell", () => {
      renderCells({}, { numeric: true });
      expect(screen.getByTestId("head")).toHaveClass(styles.numeric ?? "", styles.alignEnd ?? "");
    });

    it("lets an explicit align win over the end-alignment numeric implies, while keeping tabular figures", () => {
      renderCells({ numeric: true, align: "center" });
      const cell = screen.getByTestId("cell");
      expect(cell).toHaveClass(styles.numeric ?? "", styles.alignCenter ?? "");
      expect(cell).not.toHaveClass(styles.alignEnd ?? "");
    });

    it("treats an explicit align=start as a real override of numeric's end-alignment", () => {
      renderCells({ numeric: true, align: "start" });
      expect(screen.getByTestId("cell")).not.toHaveClass(styles.alignEnd ?? "");
      expect(screen.getByTestId("cell")).toHaveClass(styles.numeric ?? "");
    });

    it("doesn't render a native align attribute", () => {
      renderCells({ numeric: true });
      expect(screen.getByTestId("cell")).not.toHaveAttribute("align");
      expect(screen.getByTestId("cell")).not.toHaveAttribute("numeric");
    });
  });

  describe("loading", () => {
    const renderLoading = (bodyProps: object = {}, tableProps: object = {}) =>
      render(
        <Table aria-label="Loading example" {...tableProps}>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>One</Table.HeaderCell>
              <Table.HeaderCell>Two</Table.HeaderCell>
              <Table.HeaderCell>Three</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body data-testid="body" {...bodyProps}>
            <Table.Row>
              <Table.Cell>real row</Table.Cell>
              <Table.Cell>real row</Table.Cell>
              <Table.Cell>real row</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>,
      );

    it("shows the real rows, not skeletons, when not loading", () => {
      renderLoading();
      expect(screen.getAllByText("real row")).toHaveLength(3);
      expect(screen.getByTestId("body").querySelectorAll("tr")).toHaveLength(1);
      expect(screen.getByTestId("body")).not.toHaveAttribute("aria-busy");
    });

    it("replaces the rows with three skeleton rows by default, one cell per column", () => {
      renderLoading({ loading: true });
      const rows = screen.getByTestId("body").querySelectorAll("tr");
      expect(rows).toHaveLength(3);
      rows.forEach((row) => expect(row.querySelectorAll("td")).toHaveLength(3));
      expect(screen.queryByText("real row")).toBeNull();
    });

    it("honours loadingRows", () => {
      renderLoading({ loading: true, loadingRows: 5 });
      expect(screen.getByTestId("body").querySelectorAll("tr")).toHaveLength(5);
    });

    it("marks the body busy while loading", () => {
      renderLoading({ loading: true });
      expect(screen.getByTestId("body")).toHaveAttribute("aria-busy", "true");
    });

    it("keeps a consumer's own aria-busy when not loading", () => {
      renderLoading({ "aria-busy": false });
      expect(screen.getByTestId("body")).toHaveAttribute("aria-busy", "false");
    });

    it("announces a visually hidden 'Loading' once, in the first cell", () => {
      renderLoading({ loading: true });
      expect(screen.getAllByText("Loading")).toHaveLength(1);
      expect(screen.getByTestId("body").querySelector("td")).toContainElement(screen.getByText("Loading"));
    });

    it("announces a custom loadingLabel instead", () => {
      renderLoading({ loading: true, loadingLabel: "Chargement" });
      expect(screen.getByText("Chargement")).toBeInTheDocument();
      expect(screen.queryByText("Loading")).toBeNull();
    });

    it("renders decorative, aria-hidden skeletons", () => {
      renderLoading({ loading: true });
      const skeletons = screen.getByTestId("body").querySelectorAll('[aria-hidden="true"]');
      expect(skeletons).toHaveLength(9);
    });

    it("marks the rows as status rows so hover highlighting skips them", () => {
      renderLoading({ loading: true, hoverable: true });
      screen
        .getByTestId("body")
        .querySelectorAll("tr")
        .forEach((row) => expect(row).toHaveClass(styles.statusRow ?? ""));
    });

    it("counts a grouped header's columns correctly (colSpan and rowSpan cells)", () => {
      render(
        <Table aria-label="Grouped">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell rowSpan={2}>Month</Table.HeaderCell>
              <Table.HeaderCell colSpan={2}>Free</Table.HeaderCell>
              <Table.HeaderCell colSpan={2}>Pro</Table.HeaderCell>
            </Table.Row>
            <Table.Row>
              <Table.HeaderCell>New</Table.HeaderCell>
              <Table.HeaderCell>Churned</Table.HeaderCell>
              <Table.HeaderCell>New</Table.HeaderCell>
              <Table.HeaderCell>Churned</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body data-testid="body" loading loadingRows={1} />
        </Table>,
      );
      expect(screen.getByTestId("body").querySelectorAll("td")).toHaveLength(5);
    });

    it("falls back to a single column when there is no header to read", () => {
      render(
        <Table aria-label="No header">
          <Table.Body data-testid="body" loading loadingRows={2} />
        </Table>,
      );
      expect(screen.getByTestId("body").querySelectorAll("tr")).toHaveLength(2);
      screen
        .getByTestId("body")
        .querySelectorAll("tr")
        .forEach((row) => expect(row.querySelectorAll("td")).toHaveLength(1));
    });

    it("reads each table's own column count when tables are nested", () => {
      render(
        <Table aria-label="Outer">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Only</Table.HeaderCell>
              <Table.HeaderCell>Two</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell colSpan={2}>
                <Table aria-label="Inner">
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>A</Table.HeaderCell>
                      <Table.HeaderCell>B</Table.HeaderCell>
                      <Table.HeaderCell>C</Table.HeaderCell>
                      <Table.HeaderCell>D</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body data-testid="inner-body" loading loadingRows={1} />
                </Table>
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>,
      );
      expect(screen.getByTestId("inner-body").querySelectorAll("td")).toHaveLength(4);
    });

    it("has no jest-axe violations while loading", async () => {
      const { container } = renderLoading({ loading: true });
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe("Table.Empty", () => {
    const renderEmpty = (emptyProps: object = {}, tableProps: object = {}) =>
      render(
        <Table aria-label="Empty example" {...tableProps}>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>One</Table.HeaderCell>
              <Table.HeaderCell>Two</Table.HeaderCell>
              <Table.HeaderCell>Three</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Empty data-testid="empty" {...emptyProps}>
              No invoices yet
            </Table.Empty>
          </Table.Body>
        </Table>,
      );

    it("renders its message in a single cell spanning every column", () => {
      renderEmpty();
      const cell = screen.getByTestId("empty");
      expect(cell.tagName).toBe("TD");
      expect(cell).toHaveAttribute("colspan", "3");
      expect(cell).toHaveTextContent("No invoices yet");
      expect(cell.parentElement?.tagName).toBe("TR");
    });

    it("lets colSpan override the inferred column count", () => {
      renderEmpty({ colSpan: 2 });
      expect(screen.getByTestId("empty")).toHaveAttribute("colspan", "2");
    });

    it("falls back to one column when there's no header row to read", () => {
      render(
        <Table aria-label="No header">
          <Table.Body>
            <Table.Empty data-testid="empty">Nothing here</Table.Empty>
          </Table.Body>
        </Table>,
      );
      expect(screen.getByTestId("empty")).toHaveAttribute("colspan", "1");
    });

    it("marks its row so hover highlighting and the pinned column skip it", () => {
      renderEmpty();
      const row = screen.getByTestId("empty").parentElement;
      expect(row).toHaveClass(styles.statusRow ?? "", styles.emptyRow ?? "");
    });

    it("is sized by the table's own size", () => {
      renderEmpty({}, { size: "lg" });
      expect(screen.getByTestId("empty")).toHaveClass(styles.sizeLg ?? "", styles.emptyCell ?? "");
    });

    it("forwards its ref to the <td> and passes id/className/style/data-testid through", () => {
      const ref = createRef<HTMLTableCellElement>();
      render(
        <Table aria-label="Ref">
          <Table.Body>
            <Table.Empty ref={ref} id="e" className="c-e" style={{ opacity: 0.9 }} data-testid="e">
              Nothing
            </Table.Empty>
          </Table.Body>
        </Table>,
      );
      expect(ref.current?.tagName).toBe("TD");
      const cell = screen.getByTestId("e");
      expect(cell).toHaveAttribute("id", "e");
      expect(cell).toHaveClass("c-e");
      expect(cell).toHaveStyle({ opacity: "0.9" });
    });

    it("passes other native <td> attributes through", () => {
      renderEmpty({ title: "No data" });
      expect(screen.getByTestId("empty")).toHaveAttribute("title", "No data");
    });

    it("has no jest-axe violations", async () => {
      const { container } = renderEmpty();
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe("dev-mode warnings", () => {
    it("warns once when stickyHeader is set with no way to constrain height", () => {
      const { rerender } = renderTable({ stickyHeader: true });
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("stickyHeader"));
      rerender(
        <Table stickyHeader>
          <Table.Body>
            <Table.Row>
              <Table.Cell>x</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>,
      );
      expect(console.warn).toHaveBeenCalledTimes(1);
    });

    it("doesn't warn when maxHeight constrains the height", () => {
      renderTable({ stickyHeader: true, maxHeight: "10rem" });
      expect(console.warn).not.toHaveBeenCalled();
    });

    it("doesn't warn when containerClassName is constraining the height itself", () => {
      renderTable({ stickyHeader: true, containerClassName: "my-frame" });
      expect(console.warn).not.toHaveBeenCalled();
    });

    it("doesn't warn without stickyHeader", () => {
      renderTable();
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe("accessibility (jest-axe)", () => {
    it("has no violations in the default state", async () => {
      const { container } = renderTable();
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no violations striped, hoverable, sticky, ghost, and small", async () => {
      const { container } = renderTable({
        striped: true,
        hoverable: true,
        stickyHeader: true,
        maxHeight: "10rem",
        variant: "ghost",
        size: "sm",
      });
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no violations while the scroll region is focusable and named", async () => {
      installOverflowSimulation(true);
      const { container } = renderTable();
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no violations while the scroll region is focusable but unnamed", async () => {
      installOverflowSimulation(true);
      const { container } = render(
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Name</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell>Ada</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
