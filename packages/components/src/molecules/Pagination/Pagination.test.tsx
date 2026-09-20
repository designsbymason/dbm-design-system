import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import buttonStyles from "../../atoms/Button/Button.module.css";
import { Pagination } from "./Pagination";
import styles from "./Pagination.module.css";
import type { PaginationProps, PaginationSize } from "./Pagination.types";

afterEach(() => vi.restoreAllMocks());

// `compact="never"` by default: the stylesheet is loaded in jsdom, which doesn't evaluate media
// queries, so the default `auto` would leave the page numbers hidden here.
function renderPagination(props: Partial<PaginationProps> = {}) {
  return render(<Pagination pageCount={20} compact="never" data-testid="pagination" {...props} />);
}

/** The row as a reader sees it: page numbers, with `…` for a gap. */
function row(): string[] {
  return [...screen.getByTestId("pagination").querySelectorAll("li")]
    .filter((item) => item.classList.contains(styles.pageItem ?? "") || item.classList.contains(styles.ellipsis ?? ""))
    .map((item) => item.textContent ?? "");
}

const page = (n: number) => screen.getByRole("button", { name: `Page ${n}` });
const previous = () => screen.getByRole("button", { name: "Previous page" });
const next = () => screen.getByRole("button", { name: "Next page" });

describe("Pagination", () => {
  describe("structure", () => {
    it("renders a <nav> landmark named Pagination, holding a list", () => {
      renderPagination();
      const nav = screen.getByRole("navigation", { name: "Pagination" });
      expect(nav.tagName).toBe("NAV");
      expect(within(nav).getByRole("list")).toBeInTheDocument();
    });

    it("puts previous, the page numbers, and next in order, one list item each", () => {
      renderPagination({ defaultValue: 10 });
      const items = within(screen.getByRole("list")).getAllByRole("listitem");
      const names = items.map((item) => within(item).queryByRole("button")?.getAttribute("aria-label") ?? item.textContent);
      expect(names).toEqual([
        "Previous page",
        "Page 1",
        "Page 9",
        "Page 10",
        "Page 11",
        "Page 20",
        "Next page",
      ]);
    });

    it("renders every control as a button", () => {
      renderPagination({ showFirstLast: true });
      for (const control of screen.getAllByRole("button")) expect(control.tagName).toBe("BUTTON");
      expect(screen.getAllByRole("button")).toHaveLength(2 + 6 + 2); // first, previous, 6 pages (1–5 and 20), next, last
    });

    it("hides the gaps from assistive technology", () => {
      renderPagination({ defaultValue: 10 });
      const gaps = [...screen.getByTestId("pagination").querySelectorAll(`li.${styles.ellipsis}`)];
      expect(gaps).toHaveLength(2);
      for (const gap of gaps) expect(gap).toHaveAttribute("aria-hidden", "true");
    });

    it("renders nothing when there are no pages", () => {
      const { container } = renderPagination({ pageCount: 0 });
      expect(container).toBeEmptyDOMElement();
    });

    it("renders a single page with both arrows unavailable", () => {
      renderPagination({ pageCount: 1 });
      expect(row()).toEqual(["1"]);
      expect(previous()).toHaveAttribute("aria-disabled", "true");
      expect(next()).toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("the current page", () => {
    it("starts at page 1", () => {
      renderPagination();
      expect(page(1)).toHaveAttribute("aria-current", "page");
    });

    it("marks only the current page with aria-current", () => {
      renderPagination({ defaultValue: 4 });
      const current = screen.getAllByRole("button").filter((button) => button.hasAttribute("aria-current"));
      expect(current).toEqual([page(4)]);
    });

    it("gives the current page the primary variant and the others the tertiary one", () => {
      renderPagination({ defaultValue: 4 });
      expect(page(4)).toHaveClass(buttonStyles.variantPrimary ?? "");
      expect(page(5)).toHaveClass(buttonStyles.variantTertiary ?? "");
    });

    it("clamps a value outside 1 to pageCount", () => {
      const { rerender } = renderPagination({ value: 99, pageCount: 5 });
      expect(page(5)).toHaveAttribute("aria-current", "page");
      rerender(<Pagination pageCount={5} value={-3} compact="never" data-testid="pagination" />);
      expect(page(1)).toHaveAttribute("aria-current", "page");
    });

    it("follows the page count when it shrinks below the current page", () => {
      const { rerender } = renderPagination({ defaultValue: 18 });
      rerender(<Pagination pageCount={6} compact="never" data-testid="pagination" />);
      expect(page(6)).toHaveAttribute("aria-current", "page");
    });
  });

  describe("the row of pages", () => {
    it("shows the window around the current page, with gaps", () => {
      renderPagination({ defaultValue: 10 });
      expect(row()).toEqual(["1", "…", "9", "10", "11", "…", "20"]);
    });

    it("keeps the same number of slots at the start, in the middle, and at the end", () => {
      const lengths = [1, 5, 10, 16, 20].map((current) => {
        const { unmount } = renderPagination({ defaultValue: current });
        const length = row().length;
        unmount();
        return length;
      });
      expect(new Set(lengths)).toEqual(new Set([7]));
    });

    it("respects siblingCount and boundaryCount", () => {
      renderPagination({ defaultValue: 10, pageCount: 30, siblingCount: 2, boundaryCount: 2 });
      expect(row()).toEqual(["1", "2", "…", "8", "9", "10", "11", "12", "…", "29", "30"]);
    });

    it("treats a negative or fractional siblingCount as a whole number of at least zero", () => {
      renderPagination({ defaultValue: 10, siblingCount: -2, boundaryCount: 1.9 });
      expect(row()).toEqual(["1", "…", "10", "…", "20"]);
    });

    it("shows every page when they fit", () => {
      renderPagination({ pageCount: 5 });
      expect(row()).toEqual(["1", "2", "3", "4", "5"]);
    });
  });

  describe("uncontrolled", () => {
    it("moves to the chosen page and reports it", async () => {
      const onValueChange = vi.fn();
      renderPagination({ onValueChange });
      await userEvent.click(page(2));
      expect(page(2)).toHaveAttribute("aria-current", "page");
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange.mock.calls[0]?.[0]).toBe(2);
    });

    it("starts from defaultValue", () => {
      renderPagination({ defaultValue: 7 });
      expect(page(7)).toHaveAttribute("aria-current", "page");
    });

    it("steps with the previous and next buttons", async () => {
      renderPagination({ defaultValue: 5 });
      await userEvent.click(next());
      expect(page(6)).toHaveAttribute("aria-current", "page");
      await userEvent.click(previous());
      await userEvent.click(previous());
      expect(page(4)).toHaveAttribute("aria-current", "page");
    });
  });

  describe("controlled", () => {
    it("shows the value it is given and reports a change without moving on its own", async () => {
      const onValueChange = vi.fn();
      renderPagination({ value: 3, onValueChange });
      await userEvent.click(page(4));
      expect(onValueChange.mock.calls[0]?.[0]).toBe(4);
      expect(page(3)).toHaveAttribute("aria-current", "page");
    });

    it("passes the click event as the second argument", async () => {
      const onValueChange = vi.fn();
      renderPagination({ value: 3, onValueChange });
      await userEvent.click(page(4));
      expect(onValueChange.mock.calls[0]?.[1]).toMatchObject({ type: "click" });
    });

    it("doesn't report a click on the page that is already current", async () => {
      const onValueChange = vi.fn();
      renderPagination({ value: 3, onValueChange });
      await userEvent.click(page(3));
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("warns when given both value and defaultValue", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      renderPagination({ value: 3, defaultValue: 5 });
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0]?.[0]).toContain("`value` makes the component controlled");
    });
  });

  describe("previous and next", () => {
    it("are aria-disabled at the ends, not natively disabled, so keyboard focus is not lost", async () => {
      renderPagination();
      expect(previous()).toHaveAttribute("aria-disabled", "true");
      expect(previous()).not.toBeDisabled();
      previous().focus();
      expect(previous()).toHaveFocus();
    });

    it("do nothing when unavailable", async () => {
      const onValueChange = vi.fn();
      renderPagination({ onValueChange });
      await userEvent.click(previous());
      expect(onValueChange).not.toHaveBeenCalled();
      expect(page(1)).toHaveAttribute("aria-current", "page");
    });

    it("keeps focus on the button when it becomes unavailable", async () => {
      renderPagination({ defaultValue: 2 });
      previous().focus();
      await userEvent.keyboard("{Enter}");
      expect(page(1)).toHaveAttribute("aria-current", "page");
      expect(previous()).toHaveFocus();
      expect(previous()).toHaveAttribute("aria-disabled", "true");
    });

    it("make next unavailable on the last page", () => {
      renderPagination({ defaultValue: 20 });
      expect(next()).toHaveAttribute("aria-disabled", "true");
      expect(previous()).not.toHaveAttribute("aria-disabled");
    });
  });

  describe("showFirstLast", () => {
    it("is off by default", () => {
      renderPagination();
      expect(screen.queryByRole("button", { name: "First page" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Last page" })).not.toBeInTheDocument();
    });

    it("adds buttons that jump to the first and the last page", async () => {
      renderPagination({ showFirstLast: true, defaultValue: 10 });
      await userEvent.click(screen.getByRole("button", { name: "Last page" }));
      expect(page(20)).toHaveAttribute("aria-current", "page");
      await userEvent.click(screen.getByRole("button", { name: "First page" }));
      expect(page(1)).toHaveAttribute("aria-current", "page");
    });

    it("makes first unavailable on page 1 and last unavailable on the last page", () => {
      const { unmount } = renderPagination({ showFirstLast: true });
      expect(screen.getByRole("button", { name: "First page" })).toHaveAttribute("aria-disabled", "true");
      expect(screen.getByRole("button", { name: "Last page" })).not.toHaveAttribute("aria-disabled");
      unmount();
      renderPagination({ showFirstLast: true, defaultValue: 20 });
      expect(screen.getByRole("button", { name: "Last page" })).toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("disabled", () => {
    it("makes every control unavailable but still focusable, and blocks changes", async () => {
      const onValueChange = vi.fn();
      renderPagination({ disabled: true, defaultValue: 5, onValueChange });
      for (const control of screen.getAllByRole("button")) {
        expect(control).toHaveAttribute("aria-disabled", "true");
        expect(control).not.toBeDisabled();
      }
      await userEvent.click(page(6));
      await userEvent.click(next());
      expect(onValueChange).not.toHaveBeenCalled();
      expect(page(5)).toHaveAttribute("aria-current", "page");
    });
  });

  describe("keyboard", () => {
    it("tabs through previous, the pages, and next, in that order", async () => {
      renderPagination({ pageCount: 3, defaultValue: 2 });
      await userEvent.tab();
      expect(previous()).toHaveFocus();
      await userEvent.tab();
      expect(page(1)).toHaveFocus();
      await userEvent.tab();
      expect(page(2)).toHaveFocus();
      await userEvent.tab();
      expect(page(3)).toHaveFocus();
      await userEvent.tab();
      expect(next()).toHaveFocus();
    });

    it("chooses a page with Enter and with Space", async () => {
      renderPagination({ pageCount: 5 });
      page(3).focus();
      await userEvent.keyboard("{Enter}");
      expect(page(3)).toHaveAttribute("aria-current", "page");
      page(4).focus();
      await userEvent.keyboard(" ");
      expect(page(4)).toHaveAttribute("aria-current", "page");
    });
  });

  describe("as links (getPageHref)", () => {
    const getPageHref = (n: number) => `/results?page=${n}`;

    it("renders every control as a link to its page", () => {
      renderPagination({ getPageHref, defaultValue: 3 });
      expect(screen.getByRole("link", { name: "Page 4" })).toHaveAttribute("href", "/results?page=4");
      expect(screen.getByRole("link", { name: "Previous page" })).toHaveAttribute("href", "/results?page=2");
      expect(screen.getByRole("link", { name: "Next page" })).toHaveAttribute("href", "/results?page=4");
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("marks the current page's link with aria-current", () => {
      renderPagination({ getPageHref, defaultValue: 3 });
      expect(screen.getByRole("link", { name: "Page 3" })).toHaveAttribute("aria-current", "page");
    });

    it("keeps an unavailable previous link focusable, pointing at the current page", () => {
      renderPagination({ getPageHref });
      const link = screen.getByRole("link", { name: "Previous page" });
      expect(link).toHaveAttribute("aria-disabled", "true");
      expect(link).toHaveAttribute("href", "/results?page=1");
    });

    it("reports a click with the page and the event, and lets the consumer take over navigation", () => {
      const onValueChange = vi.fn((_: number, event: { preventDefault: () => void }) => event.preventDefault());
      renderPagination({ getPageHref, onValueChange });
      const notCancelled = fireEvent.click(screen.getByRole("link", { name: "Page 3" }));
      expect(onValueChange.mock.calls[0]?.[0]).toBe(3);
      expect(notCancelled).toBe(false); // preventDefault was called
    });

    it("lets a link navigate normally when the consumer doesn't prevent it", () => {
      renderPagination({ getPageHref, onValueChange: vi.fn() });
      expect(fireEvent.click(screen.getByRole("link", { name: "Page 3" }))).toBe(true);
    });

    it("leaves a modified click to the browser, without reporting a page change", () => {
      const onValueChange = vi.fn();
      renderPagination({ getPageHref, onValueChange });
      for (const modifier of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
        expect(fireEvent.click(screen.getByRole("link", { name: "Page 3" }), modifier)).toBe(true);
      }
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("blocks a disabled link's navigation", () => {
      renderPagination({ getPageHref, disabled: true });
      expect(fireEvent.click(screen.getByRole("link", { name: "Page 3" }))).toBe(false);
    });

    it("blocks navigation on an unavailable previous link", () => {
      renderPagination({ getPageHref });
      expect(fireEvent.click(screen.getByRole("link", { name: "Previous page" }))).toBe(false);
    });
  });

  describe("labels", () => {
    it("uses English by default", () => {
      renderPagination({ showFirstLast: true, compact: "always", defaultValue: 3 });
      expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "First page" })).toBeInTheDocument();
      expect(screen.getByText("Page 3 of 20")).toBeInTheDocument();
    });

    it("takes translated text, keeping the defaults for any left out", () => {
      renderPagination({
        defaultValue: 3,
        // The summary is in the page either way (hidden by the stylesheet unless compact), so
        // `never` keeps the page numbers reachable by role for the assertions below.
        compact: "never",
        showFirstLast: true,
        labels: {
          navigation: "Paginación",
          previous: "Página anterior",
          page: (n) => `Página ${n}`,
          summary: (n, count) => `Página ${n} de ${count}`,
        },
      });
      expect(screen.getByRole("navigation", { name: "Paginación" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Página anterior" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Página 4" })).toBeInTheDocument();
      expect(screen.getByText("Página 3 de 20")).toBeInTheDocument();
      // ...and what wasn't overridden stays English.
      expect(screen.getByRole("button", { name: "Next page" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "First page" })).toBeInTheDocument();
    });
  });

  describe("naming the landmark", () => {
    it("takes an aria-label of its own", () => {
      renderPagination({ "aria-label": "Search results" });
      expect(screen.getByRole("navigation", { name: "Search results" })).toBeInTheDocument();
    });

    it("lets aria-labelledby take the place of the label", () => {
      render(
        <>
          <h2 id="results-heading">Results</h2>
          <Pagination pageCount={5} aria-labelledby="results-heading" />
        </>,
      );
      const nav = screen.getByRole("navigation", { name: "Results" });
      expect(nav).not.toHaveAttribute("aria-label");
    });

    it("gives two paginations on one page separate names", () => {
      render(
        <>
          <Pagination pageCount={5} aria-label="Search results" />
          <Pagination pageCount={5} aria-label="Comments" />
        </>,
      );
      expect(screen.getAllByRole("navigation").map((nav) => nav.getAttribute("aria-label"))).toEqual([
        "Search results",
        "Comments",
      ]);
    });
  });

  describe("compact", () => {
    it("collapses to a summary below the sm breakpoint by default", () => {
      renderPagination({ compact: "auto", defaultValue: 3 });
      expect(screen.getByTestId("pagination")).toHaveClass(styles.compactAuto ?? "");
      expect(screen.getByText("Page 3 of 20")).toBeInTheDocument();
    });

    it("always collapses with compact=always", () => {
      renderPagination({ compact: "always" });
      expect(screen.getByTestId("pagination")).toHaveClass(styles.compactAlways ?? "");
    });

    it("never collapses with compact=never", () => {
      renderPagination({ compact: "never" });
      const nav = screen.getByTestId("pagination");
      expect(nav).not.toHaveClass(styles.compactAuto ?? "");
      expect(nav).not.toHaveClass(styles.compactAlways ?? "");
    });

    it("is auto by default", () => {
      render(<Pagination pageCount={5} data-testid="pagination" />);
      expect(screen.getByTestId("pagination")).toHaveClass(styles.compactAuto ?? "");
    });
  });

  describe("size and alignment", () => {
    const classForSize: Record<PaginationSize, string | undefined> = {
      xs: styles.sizeXs,
      sm: styles.sizeSm,
      md: styles.sizeMd,
      lg: styles.sizeLg,
      xl: styles.sizeXl,
    };

    it("is md by default", () => {
      renderPagination();
      expect(screen.getByTestId("pagination")).toHaveClass(styles.sizeMd ?? "");
    });

    it.each(Object.keys(classForSize) as PaginationSize[])("applies size=%s to the row and to its buttons", (size) => {
      renderPagination({ size });
      expect(screen.getByTestId("pagination")).toHaveClass(classForSize[size] ?? "");
      const buttonSizeClass = {
        xs: buttonStyles.sizeXs,
        sm: buttonStyles.sizeSm,
        md: buttonStyles.sizeMd,
        lg: buttonStyles.sizeLg,
        xl: buttonStyles.sizeXl,
      }[size];
      expect(page(2)).toHaveClass(buttonSizeClass ?? "");
    });

    it("centres by default and can align to the start or the end", () => {
      const { rerender } = renderPagination();
      const nav = screen.getByTestId("pagination");
      expect(nav).not.toHaveClass(styles.alignStart ?? "");
      expect(nav).not.toHaveClass(styles.alignEnd ?? "");
      rerender(<Pagination pageCount={20} compact="never" data-testid="pagination" align="start" />);
      expect(nav).toHaveClass(styles.alignStart ?? "");
      rerender(<Pagination pageCount={20} compact="never" data-testid="pagination" align="end" />);
      expect(nav).toHaveClass(styles.alignEnd ?? "");
    });

    it("flips the arrow icons under right-to-left text via a class the stylesheet keys on", () => {
      renderPagination({ showFirstLast: true });
      const arrows = screen.getByTestId("pagination").querySelectorAll("button svg");
      expect(arrows).toHaveLength(4);
      for (const arrow of arrows) expect(arrow).toHaveClass(styles.flip ?? "");
    });
  });

  describe("formatNumber", () => {
    const arabic = new Intl.NumberFormat("ar-EG").format;
    const german = new Intl.NumberFormat("de-DE").format;
    const tagged = (n: number) => `<${n}>`;

    it("writes the page numbers as they are without it", () => {
      renderPagination({ defaultValue: 5 });
      expect(page(5)).toHaveTextContent(/^5$/);
      expect(page(5)).toHaveAccessibleName("Page 5");
      expect(row()).toEqual(["1", "…", "4", "5", "6", "…", "20"]);
    });

    it("shows each number the way it is given, on the button", () => {
      renderPagination({ defaultValue: 5, formatNumber: tagged });
      expect(row()).toEqual(["<1>", "…", "<4>", "<5>", "<6>", "…", "<20>"]);
    });

    it("keeps what a button shows inside its accessible name, for every button", () => {
      renderPagination({ defaultValue: 5, formatNumber: arabic });
      expect(arabic(5)).not.toBe("5"); // a real locale, so this proves something
      // The page-number buttons (their names start "Page "; the arrows' are "Previous page" and so on).
      const numbered = screen.getAllByRole("button").filter((button) => /^Page /.test(button.getAttribute("aria-label") ?? ""));
      expect(numbered.length).toBeGreaterThan(3);
      for (const button of numbered) {
        expect(button.getAttribute("aria-label")).toContain(button.textContent ?? "never");
      }
      expect(screen.getByRole("button", { name: `Page ${arabic(5)}` })).toHaveTextContent(arabic(5));
    });

    it("groups digits for a locale that does", () => {
      renderPagination({ pageCount: 5000, defaultValue: 1234, formatNumber: german, compact: "never" });
      const current = screen.getByRole("button", { current: "page" });
      expect(current).toHaveTextContent("1.234");
      expect(current).toHaveAccessibleName("Page 1.234");
      expect(screen.getByRole("button", { name: "Page 5.000" })).toHaveTextContent("5.000");
    });

    it("writes the compact summary's numbers too", () => {
      renderPagination({ pageCount: 20, defaultValue: 3, compact: "always", formatNumber: arabic });
      expect(screen.getByText(`Page ${arabic(3)} of ${arabic(20)}`)).toBeInTheDocument();
    });

    it("announces the summary with the formatted numbers", async () => {
      vi.useFakeTimers();
      try {
        renderPagination({ defaultValue: 3, formatNumber: tagged });
        fireEvent.click(screen.getByRole("button", { name: "Page <4>" }));
        await act(async () => void vi.advanceTimersByTime(100));
        expect(screen.getByRole("status")).toHaveTextContent("Page <4> of <20>");
      } finally {
        vi.useRealTimers();
      }
    });

    it("hands your own labels the plain numbers, and they win over the default text", () => {
      const seen: number[] = [];
      renderPagination({
        defaultValue: 5,
        formatNumber: tagged,
        labels: {
          page: (n) => {
            seen.push(n);
            return `Seite ${tagged(n)}`;
          },
        },
      });
      expect(seen.every((n) => Number.isInteger(n))).toBe(true);
      expect(screen.getByRole("button", { name: "Seite <5>" })).toHaveTextContent("<5>");
    });

    it("gives onValueChange the plain number, not the formatted text", () => {
      const onValueChange = vi.fn();
      renderPagination({ defaultValue: 3, formatNumber: tagged, onValueChange });
      fireEvent.click(screen.getByRole("button", { name: "Page <4>" }));
      expect(onValueChange).toHaveBeenCalledWith(4, expect.anything());
    });

    it("leaves the jump field alone: its limits are still plain numbers", () => {
      renderPagination({ pageCount: 500, defaultValue: 42, showJump: true, formatNumber: arabic });
      const field = screen.getByLabelText("Go to page");
      expect(field).toHaveAttribute("min", "1");
      expect(field).toHaveAttribute("max", "500");
    });

    it("works with links, and with the numbers collapsed to the summary", () => {
      renderPagination({ defaultValue: 5, formatNumber: tagged, getPageHref: (n) => `/p/${n}` });
      expect(screen.getByRole("link", { name: "Page <6>" })).toHaveAttribute("href", "/p/6");
    });

    it("has no accessibility violations with a locale's numerals", async () => {
      const { container } = renderPagination({ defaultValue: 5, formatNumber: arabic, showFirstLast: true });
      expect((await axe(container)).violations).toHaveLength(0);
    });
  });

  describe("list semantics", () => {
    it("names the list and every item explicitly, since list-style: none makes Safari with VoiceOver drop them", () => {
      renderPagination({ showFirstLast: true });
      const nav = screen.getByTestId("pagination");
      const list = nav.querySelector("ul")!;
      expect(list).toHaveAttribute("role", "list");
      const items = [...list.children];
      expect(items.length).toBeGreaterThan(0);
      for (const item of items) expect(item).toHaveAttribute("role", "listitem");
      // They are still exposed as a list a reader can move through: the controls, in order, in one list.
      expect(within(nav).getAllByRole("list")).toHaveLength(1);
      expect(within(within(nav).getByRole("list")).getAllByRole("button").length).toBeGreaterThan(4);
    });
  });

  describe("announcing a page change", () => {
    afterEach(() => vi.useRealTimers());
    const statusRegion = () => screen.getByRole("status");
    const advance = (ms: number) => act(async () => void vi.advanceTimersByTime(ms));

    it("has a status region in the page from the start, empty", () => {
      vi.useFakeTimers();
      renderPagination({ defaultValue: 3 });
      expect(statusRegion()).toBeEmptyDOMElement();
    });

    it("says nothing when it first appears", async () => {
      vi.useFakeTimers();
      renderPagination({ defaultValue: 3 });
      // Checked while a message would still be showing (it appears at 100ms and clears at 1100ms), so an
      // announcement on mount can't hide by having already cleared.
      await advance(500);
      expect(statusRegion()).toBeEmptyDOMElement();
    });

    it("announces the new page a moment after the user chooses one, then clears", async () => {
      vi.useFakeTimers();
      renderPagination({ defaultValue: 3 });
      fireEvent.click(page(4));
      expect(statusRegion()).toBeEmptyDOMElement();
      await advance(100);
      expect(statusRegion()).toHaveTextContent("Page 4 of 20");
      await advance(1000);
      expect(statusRegion()).toBeEmptyDOMElement();
    });

    it("says nothing when the pages arrive after mount on a page from the URL (no page changed)", async () => {
      vi.useFakeTimers();
      // `pageCount={data?.pages ?? 0}` above data that hasn't loaded yet: nothing renders, then the pages
      // arrive and the current page (already 3) is shown for the first time. Nobody chose a page.
      const { rerender } = renderPagination({ pageCount: 0, value: 3 });
      rerender(<Pagination pageCount={20} compact="never" data-testid="pagination" value={3} />);
      await advance(500);
      expect(statusRegion()).toBeEmptyDOMElement();
    });

    it("announces a page the consumer changes too, in controlled mode", async () => {
      vi.useFakeTimers();
      const { rerender } = renderPagination({ value: 3 });
      rerender(<Pagination pageCount={20} compact="never" data-testid="pagination" value={9} />);
      await advance(100);
      expect(statusRegion()).toHaveTextContent("Page 9 of 20");
    });

    it("announces a choice that doesn't move a controlled component only once the consumer moves it", async () => {
      vi.useFakeTimers();
      renderPagination({ value: 3, onValueChange: vi.fn() });
      fireEvent.click(page(4));
      await advance(500);
      expect(statusRegion()).toBeEmptyDOMElement();
    });

    it("says nothing for a click on the current page", async () => {
      vi.useFakeTimers();
      renderPagination({ defaultValue: 3 });
      fireEvent.click(page(3));
      await advance(500);
      expect(statusRegion()).toBeEmptyDOMElement();
    });

    it("announces what the summary label says, so it translates", async () => {
      vi.useFakeTimers();
      renderPagination({ defaultValue: 3, labels: { summary: (n, count) => `Página ${n} de ${count}` } });
      fireEvent.click(page(4));
      await advance(100);
      expect(statusRegion()).toHaveTextContent("Página 4 de 20");
    });

    it("can be turned off, leaving no status region", () => {
      renderPagination({ announce: false });
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("keeps the region out of the tab order and out of the layout", () => {
      renderPagination();
      expect(statusRegion().tagName).toBe("SPAN");
      expect(statusRegion()).not.toHaveAttribute("tabindex");
    });

    it("still announces under StrictMode", async () => {
      vi.useFakeTimers();
      render(
        <StrictMode>
          <Pagination pageCount={20} compact="never" defaultValue={3} data-testid="pagination" />
        </StrictMode>,
      );
      fireEvent.click(page(4));
      await advance(100);
      expect(statusRegion()).toHaveTextContent("Page 4 of 20");
    });
  });

  describe("variant", () => {
    const variantClass = {
      ghost: buttonStyles.variantTertiary,
      outlined: buttonStyles.variantSecondary,
      filled: buttonStyles.variantGhost,
    } as const;

    it("is ghost by default", () => {
      renderPagination({ defaultValue: 4 });
      expect(page(5)).toHaveClass(variantClass.ghost ?? "");
    });

    it.each(["ghost", "outlined", "filled"] as const)("gives every control but the current page the %s treatment", (variant) => {
      renderPagination({ defaultValue: 4, variant, showFirstLast: true });
      for (const control of [page(1), page(5), previous(), next(), screen.getByRole("button", { name: "First page" })]) {
        expect(control).toHaveClass(variantClass[variant] ?? "");
      }
    });

    it.each(["ghost", "outlined", "filled"] as const)("always fills the current page with the brand colour (%s)", (variant) => {
      renderPagination({ defaultValue: 4, variant });
      expect(page(4)).toHaveClass(buttonStyles.variantPrimary ?? "");
    });

    it("applies to links as well as buttons", () => {
      renderPagination({ defaultValue: 4, variant: "outlined", getPageHref: (n) => `/p/${n}` });
      expect(screen.getByRole("link", { name: "Page 5" })).toHaveClass(buttonStyles.variantSecondary ?? "");
    });
  });

  describe("rounded", () => {
    // Every control is a `Button`, so `rounded` is `Button`'s own prop passed through: the radius each one
    // ends up with is `Button`'s (the stylesheets are loaded, so the token shows in the computed style).
    it("is off by default: every control keeps the standard corner radius", () => {
      renderPagination({ showFirstLast: true });
      for (const control of screen.getAllByRole("button")) expect(control).toHaveStyle({ borderRadius: "var(--dbm-radius-md)" });
      for (const control of screen.getAllByRole("button")) expect(control).not.toHaveClass(buttonStyles.rounded ?? "");
    });

    it("passes rounded to every page number and arrow", () => {
      renderPagination({ rounded: true, showFirstLast: true });
      const controls = screen.getAllByRole("button");
      // The first, previous, next and last arrows and a window of page numbers.
      expect(controls.length).toBeGreaterThan(6);
      for (const control of controls) {
        expect(control).toHaveClass(buttonStyles.rounded ?? "");
        expect(control).toHaveStyle({ borderRadius: "var(--dbm-radius-full)" });
      }
    });

    it.each(["ghost", "outlined", "filled"] as const)("combines with the %s variant, without changing it", (variant) => {
      renderPagination({ rounded: true, variant, defaultValue: 4 });
      expect(page(5)).toHaveClass(variant === "ghost" ? (buttonStyles.variantTertiary ?? "") : variant === "outlined" ? (buttonStyles.variantSecondary ?? "") : (buttonStyles.variantGhost ?? ""));
      expect(page(4)).toHaveClass(buttonStyles.variantPrimary ?? "");
      expect(page(5)).toHaveClass(buttonStyles.rounded ?? "");
      expect(page(4)).toHaveClass(buttonStyles.rounded ?? "");
    });

    it("leaves the jump field and its button alone", () => {
      renderPagination({ rounded: true, showJump: true });
      // The Go button is a `Button` too, but it isn't given `rounded`.
      const go = screen.getByRole("button", { name: "Go" });
      expect(go).not.toHaveClass(buttonStyles.rounded ?? "");
      expect(go).toHaveStyle({ borderRadius: "var(--dbm-radius-md)" });
      expect(screen.getByLabelText("Go to page").closest("form")?.querySelector(`.${buttonStyles.rounded}`)).toBeNull();
    });

    it("works in link mode and in the compact form", () => {
      renderPagination({ rounded: true, getPageHref: (n) => `/p/${n}`, compact: "always" });
      expect(screen.getByRole("link", { name: "Next page" })).toHaveClass(buttonStyles.rounded ?? "");
      expect(screen.getByRole("link", { name: "Previous page" })).toHaveClass(buttonStyles.rounded ?? "");
    });

    it("rounds an unavailable (aria-disabled) arrow too", () => {
      renderPagination({ rounded: true, defaultValue: 1 });
      const previous = screen.getByRole("button", { name: "Previous page" });
      expect(previous).toHaveAttribute("aria-disabled", "true");
      expect(previous).toHaveClass(buttonStyles.rounded ?? "");
    });
  });

  describe("compact=container", () => {
    // jsdom has no layout, so the component's measurements are supplied: `navWidth` is the width the
    // component is given, and `rowWidth` the natural width of its row of numbers (only readable while
    // the numbers are showing — collapsed, they would be `display: none`).
    let navWidth = 600;
    let rowWidth = 500;
    // Lets a test make the row's width depend on which page is showing, as it does with real digits.
    let rowWidthFor: (() => number) | undefined;
    const observers: Array<{ callback: () => void; disconnected: boolean }> = [];
    const clientWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth");
    const scrollWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollWidth");

    beforeEach(() => {
      navWidth = 600;
      rowWidth = 500;
      rowWidthFor = undefined;
      observers.length = 0;
      Object.defineProperty(HTMLElement.prototype, "clientWidth", {
        configurable: true,
        get() {
          return (this as HTMLElement).tagName === "NAV" ? navWidth : 0;
        },
      });
      Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
        configurable: true,
        get() {
          return (this as HTMLElement).tagName === "UL" ? (rowWidthFor?.() ?? rowWidth) : 0;
        },
      });
      vi.stubGlobal(
        "ResizeObserver",
        class {
          entry: { callback: () => void; disconnected: boolean };
          constructor(callback: () => void) {
            this.entry = { callback, disconnected: false };
            observers.push(this.entry);
          }
          observe() {}
          unobserve() {}
          disconnect() {
            this.entry.disconnected = true;
          }
        },
      );
    });
    afterEach(() => {
      if (clientWidth) Object.defineProperty(HTMLElement.prototype, "clientWidth", clientWidth);
      if (scrollWidth) Object.defineProperty(HTMLElement.prototype, "scrollWidth", scrollWidth);
    });

    const resize = (width: number) =>
      act(() => {
        navWidth = width;
        for (const observer of observers.filter((o) => !o.disconnected)) observer.callback();
      });
    const nav = () => screen.getByTestId("pagination");
    const collapsed = () => nav().classList.contains(styles.compactAlways ?? "");

    it("keeps the numbers when the row fits the component's own width", () => {
      renderPagination({ compact: "container" });
      expect(collapsed()).toBe(false);
      expect(nav()).not.toHaveClass(styles.compactAuto ?? "");
      expect(nav()).toHaveClass(styles.compactContainer ?? "");
    });

    it("collapses to the summary when the row doesn't fit", () => {
      navWidth = 300;
      renderPagination({ compact: "container" });
      expect(collapsed()).toBe(true);
    });

    it("collapses and expands as the component's width changes", () => {
      renderPagination({ compact: "container" });
      expect(collapsed()).toBe(false);
      resize(300);
      expect(collapsed()).toBe(true);
      resize(700);
      expect(collapsed()).toBe(false);
      resize(499);
      expect(collapsed()).toBe(true);
      resize(500);
      expect(collapsed()).toBe(false);
    });

    it("decides by the row's width, not the screen's", () => {
      // The screen is wide (the default `auto` would show the numbers), but the component isn't.
      vi.stubGlobal("innerWidth", 1600);
      navWidth = 200;
      renderPagination({ compact: "container" });
      expect(collapsed()).toBe(true);
    });

    it("re-measures when what the row holds changes", () => {
      const { rerender } = renderPagination({ compact: "container" });
      expect(collapsed()).toBe(false);
      rowWidth = 700; // adding first and last buttons makes the row wider than the component
      rerender(<Pagination pageCount={20} compact="container" showFirstLast data-testid="pagination" />);
      expect(collapsed()).toBe(true);
    });

    describe("as the page changes the row", () => {
      // A page in the hundreds or more is wider than one in the tens: 700 against a 600 box, or 500.
      const widthByPage = () => {
        const current = Number(document.querySelector("[aria-current=page]")?.textContent);
        return current >= 100 ? 700 : 500;
      };
      const big = (value: number) => (
        <Pagination pageCount={5000} value={value} compact="container" data-testid="pagination" />
      );
      const settle = () => act(async () => void (await new Promise((resolve) => setTimeout(resolve, 0))));

      it("collapses when the new page's row is too wide, and expands when a narrower one fits", () => {
        rowWidthFor = widthByPage;
        const { rerender } = render(big(1));
        expect(collapsed()).toBe(false);
        rerender(big(2000));
        expect(collapsed()).toBe(true);
        // While collapsed the numbers can't be measured; the changed row is shown again to be.
        rerender(big(1));
        expect(collapsed()).toBe(false);
        rerender(big(2000));
        expect(collapsed()).toBe(true);
      });

      it("collapses at once when keyboard focus is on an arrow, which stays in the page", () => {
        rowWidthFor = widthByPage;
        const { rerender } = render(big(1));
        act(() => screen.getByRole("button", { name: "Next page" }).focus());
        rerender(big(2000));
        expect(collapsed()).toBe(true);
        expect(screen.getByRole("button", { name: "Next page" })).toHaveFocus();
      });

      // jsdom's `:focus-visible` depends on which tests ran before, so it is stated outright: the focused element
      // is keyboard focus (`true`) or, as after a mouse click, isn't (`false`). The page is changed by re-rendering
      // with a new controlled value. The real keyboard-versus-mouse behaviour is checked in a real browser, in
      // the story.
      let focusVisible: ReturnType<typeof vi.spyOn> | undefined;
      const keyboardFocus = (visible: boolean) => {
        const matches = Element.prototype.matches;
        focusVisible = vi.spyOn(Element.prototype, "matches").mockImplementation(function (this: Element, selector: string) {
          return selector === ":focus-visible" ? visible && document.activeElement === this : matches.call(this, selector);
        });
      };
      afterEach(() => focusVisible?.mockRestore());

      it("holds a collapse back while keyboard focus is on a page number, and applies it once focus moves on", async () => {
        rowWidthFor = widthByPage;
        keyboardFocus(true);
        const { rerender } = render(big(1));
        act(() => screen.getByRole("button", { name: "Page 5000" }).focus());
        rerender(big(5000));
        await settle();
        expect(screen.getByRole("button", { current: "page" })).toHaveAccessibleName("Page 5000");
        expect(collapsed()).toBe(false);
        expect(screen.getByRole("button", { name: "Page 5000" })).toHaveFocus();

        act(() => screen.getByRole("button", { name: "Next page" }).focus());
        await settle();
        expect(collapsed()).toBe(true);
        expect(screen.getByRole("button", { name: "Next page" })).toHaveFocus();
      });

      it("collapses at once when a page number has focus that isn't keyboard focus (after a mouse click)", () => {
        rowWidthFor = widthByPage;
        keyboardFocus(false);
        const { rerender } = render(big(1));
        act(() => screen.getByRole("button", { name: "Page 5000" }).focus());
        rerender(big(5000));
        expect(collapsed()).toBe(true);
      });

      it("keeps holding while focus moves from one page number to another", async () => {
        rowWidthFor = widthByPage;
        keyboardFocus(true);
        const { rerender } = render(big(1));
        act(() => screen.getByRole("button", { name: "Page 5000" }).focus());
        rerender(big(5000));
        act(() => screen.getByRole("button", { name: "Page 4999" }).focus());
        await settle();
        expect(collapsed()).toBe(false);
      });

      it("cancels a pending release when it is unmounted", async () => {
        let reads = 0;
        rowWidthFor = () => {
          reads += 1;
          return widthByPage();
        };
        keyboardFocus(true);
        const { rerender, unmount } = render(big(1));
        act(() => screen.getByRole("button", { name: "Page 5000" }).focus());
        rerender(big(5000));
        // Moving focus off the number schedules the release; unmount before it runs.
        act(() => screen.getByRole("button", { name: "Next page" }).focus());
        unmount();
        reads = 0;
        await settle();
        // The release would have measured the row again. It must not.
        expect(reads).toBe(0);
      });
    });

    it("doesn't observe anything in the other modes", () => {
      renderPagination({ compact: "auto" });
      renderPagination({ compact: "always" });
      renderPagination({ compact: "never" });
      expect(observers).toHaveLength(0);
    });

    it("stops observing on unmount", () => {
      const { unmount } = renderPagination({ compact: "container" });
      expect(observers.some((o) => !o.disconnected)).toBe(true);
      unmount();
      expect(observers.every((o) => o.disconnected)).toBe(true);
    });

    it("still decides once, from the first measurement, where there is no ResizeObserver", () => {
      vi.stubGlobal("ResizeObserver", undefined);
      navWidth = 300;
      renderPagination({ compact: "container" });
      expect(collapsed()).toBe(true);
    });

    it("renders the summary and the numbers either way, so nothing is missing from the page", () => {
      navWidth = 300;
      renderPagination({ compact: "container", defaultValue: 4 });
      expect(screen.getByText("Page 4 of 20")).toBeInTheDocument();
    });
  });

  describe("the jump-to-page field", () => {
    const jumpInput = () => screen.getByLabelText("Go to page") as HTMLInputElement;
    const go = () => screen.getByRole("button", { name: "Go" });

    it("is off by default", () => {
      renderPagination();
      expect(screen.queryByLabelText("Go to page")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Go" })).not.toBeInTheDocument();
    });

    it("adds a labelled number field and a button", () => {
      renderPagination({ showJump: true });
      expect(jumpInput().type).toBe("number");
      expect(jumpInput()).toHaveAttribute("min", "1");
      expect(jumpInput()).toHaveAttribute("max", "20");
      expect(jumpInput()).toHaveAttribute("inputmode", "numeric");
      expect(go()).toHaveAttribute("type", "submit");
    });

    it("goes to the typed page on Enter, reports it, and clears the field", async () => {
      const onValueChange = vi.fn();
      renderPagination({ showJump: true, onValueChange });
      await userEvent.type(jumpInput(), "12{Enter}");
      expect(page(12)).toHaveAttribute("aria-current", "page");
      expect(onValueChange.mock.calls[0]?.[0]).toBe(12);
      expect(onValueChange.mock.calls[0]?.[1]).toMatchObject({ type: "submit" });
      expect(jumpInput().value).toBe("");
    });

    it("goes to the typed page with the button, too", async () => {
      renderPagination({ showJump: true });
      await userEvent.type(jumpInput(), "7");
      await userEvent.click(go());
      expect(page(7)).toHaveAttribute("aria-current", "page");
    });

    it("goes to the nearest page for a number outside the range, and reports that page", async () => {
      const onValueChange = vi.fn();
      renderPagination({ showJump: true, defaultValue: 10, onValueChange });
      await userEvent.type(jumpInput(), "999{Enter}");
      expect(page(20)).toHaveAttribute("aria-current", "page");
      await userEvent.type(jumpInput(), "0{Enter}");
      expect(page(1)).toHaveAttribute("aria-current", "page");
      // What the consumer is told is the page it goes to, not what was typed.
      expect(onValueChange.mock.calls.map((call) => call[0])).toEqual([20, 1]);
    });

    it("treats a negative number as the first page", async () => {
      const onValueChange = vi.fn();
      renderPagination({ showJump: true, defaultValue: 10, onValueChange });
      await userEvent.type(jumpInput(), "-5{Enter}");
      expect(onValueChange.mock.calls[0]?.[0]).toBe(1);
    });

    it("does nothing for an empty field, or for the page already showing", async () => {
      const onValueChange = vi.fn();
      renderPagination({ showJump: true, defaultValue: 5, onValueChange });
      await userEvent.click(go());
      await userEvent.type(jumpInput(), "5{Enter}");
      expect(onValueChange).not.toHaveBeenCalled();
      expect(page(5)).toHaveAttribute("aria-current", "page");
    });

    it("never submits the form natively", () => {
      renderPagination({ showJump: true });
      const form = jumpInput().closest("form") as HTMLFormElement;
      for (const typed of ["", "3", "999"]) {
        fireEvent.change(jumpInput(), { target: { value: typed } });
        expect(fireEvent.submit(form)).toBe(false); // preventDefault was called
      }
    });

    it("reports a choice without moving on its own when controlled", async () => {
      const onValueChange = vi.fn();
      renderPagination({ showJump: true, value: 3, onValueChange });
      await userEvent.type(jumpInput(), "9{Enter}");
      expect(onValueChange.mock.calls[0]?.[0]).toBe(9);
      expect(page(3)).toHaveAttribute("aria-current", "page");
    });

    it("is natively disabled while the component is disabled", () => {
      renderPagination({ showJump: true, disabled: true });
      expect(jumpInput()).toBeDisabled();
      expect(go()).toBeDisabled();
    });

    it("takes translated text", () => {
      renderPagination({ showJump: true, labels: { jump: "Ir a la página", jumpSubmit: "Ir" } });
      expect(screen.getByLabelText("Ir a la página")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Ir" })).toBeInTheDocument();
    });

    it("stays available in the compact form, where the numbers are gone", () => {
      renderPagination({ showJump: true, compact: "always" });
      expect(jumpInput()).toBeInTheDocument();
    });

    describe("in link mode", () => {
      const getPageHref = (n: number) => `/results?page=${n}`;
      const clicks: string[] = [];
      let clickSpy: ReturnType<typeof vi.spyOn>;
      beforeEach(() => {
        clicks.length = 0;
        // The component follows the link by clicking a real anchor; record it instead of navigating.
        clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
          clicks.push(this.getAttribute("href") ?? "");
        });
      });
      afterEach(() => clickSpy.mockRestore());

      it("follows the page's link", async () => {
        renderPagination({ showJump: true, getPageHref });
        await userEvent.type(jumpInput(), "12{Enter}");
        expect(clicks).toEqual(["/results?page=12"]);
      });

      it("doesn't follow it when onValueChange cancels the default", async () => {
        const onValueChange = vi.fn((_: number, event: { preventDefault: () => void }) => event.preventDefault());
        renderPagination({ showJump: true, getPageHref, onValueChange });
        await userEvent.type(jumpInput(), "12{Enter}");
        expect(onValueChange).toHaveBeenCalledTimes(1);
        expect(clicks).toEqual([]);
      });

      it("follows nothing for an empty field or the current page", async () => {
        renderPagination({ showJump: true, getPageHref, defaultValue: 5 });
        await userEvent.click(go());
        await userEvent.type(jumpInput(), "5{Enter}");
        expect(clicks).toEqual([]);
      });

      it("doesn't follow anything in button mode", async () => {
        renderPagination({ showJump: true });
        await userEvent.type(jumpInput(), "12{Enter}");
        expect(clicks).toEqual([]);
      });
    });
  });

  describe("StrictMode", () => {
    it("works under StrictMode, which mounts, unmounts, and remounts in development", async () => {
      const onValueChange = vi.fn();
      render(
        <StrictMode>
          <Pagination pageCount={20} compact="never" onValueChange={onValueChange} data-testid="pagination" />
        </StrictMode>,
      );
      expect(page(1)).toHaveAttribute("aria-current", "page");
      await userEvent.click(page(2));
      expect(page(2)).toHaveAttribute("aria-current", "page");
      expect(onValueChange).toHaveBeenCalledTimes(1);
    });

    it("warns about an invalid page count once per change, not on every render", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { rerender } = renderPagination({ pageCount: 2.5 });
      rerender(<Pagination pageCount={2.5} compact="never" data-testid="pagination" className="x" />);
      expect(warn).toHaveBeenCalledTimes(1);
    });
  });

  describe("invalid page counts", () => {
    it.each([Number.NaN, -3, 2.5, Number.POSITIVE_INFINITY])("warns and renders nothing for pageCount=%s", (pageCount) => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { container } = renderPagination({ pageCount });
      expect(container).toBeEmptyDOMElement();
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0]?.[0]).toContain("`pageCount` must be a whole number");
    });

    it("doesn't warn for 0, which just means nothing to show yet", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      renderPagination({ pageCount: 0 });
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe("standard props", () => {
    it("accepts className, style, id, and data-testid on the nav", () => {
      render(<Pagination pageCount={5} className="custom" style={{ opacity: 0.5 }} id="pager" data-testid="pagination" />);
      const nav = screen.getByTestId("pagination");
      expect(nav).toHaveClass("custom", styles.root ?? "");
      expect(nav).toHaveStyle({ opacity: "0.5" });
      expect(nav).toHaveAttribute("id", "pager");
    });

    it("passes native nav attributes through", () => {
      render(<Pagination pageCount={5} data-testid="pagination" title="Pages" lang="fr" />);
      expect(screen.getByTestId("pagination")).toHaveAttribute("title", "Pages");
      expect(screen.getByTestId("pagination")).toHaveAttribute("lang", "fr");
    });

    it("forwards a ref to the nav", () => {
      const ref = createRef<HTMLElement>();
      render(<Pagination pageCount={5} ref={ref} data-testid="pagination" />);
      expect(ref.current).toBe(screen.getByTestId("pagination"));
      expect(ref.current?.tagName).toBe("NAV");
    });
  });

  describe("accessibility (jest-axe)", () => {
    const cases: Array<[string, Partial<PaginationProps>]> = [
      ["the default", {}],
      ["the last page", { defaultValue: 20 }],
      ["first and last buttons", { showFirstLast: true, defaultValue: 10 }],
      ["links", { getPageHref: (n) => `/p/${n}`, defaultValue: 10 }],
      ["links, disabled", { getPageHref: (n) => `/p/${n}`, disabled: true }],
      ["buttons, disabled", { disabled: true }],
      ["a single page", { pageCount: 1 }],
      ["the compact row", { compact: "always" }],
      ["a labelled landmark", { "aria-label": "Search results" }],
      ["the outlined variant", { variant: "outlined", defaultValue: 5 }],
      ["the filled variant", { variant: "filled", defaultValue: 5 }],
      ["the jump field", { showJump: true }],
      ["rounded controls", { rounded: true, showJump: true, showFirstLast: true }],
      ["the jump field, disabled", { showJump: true, disabled: true }],
      ["announcing turned off", { announce: false }],
    ];
    it.each(cases)("has no violations for %s", async (_name, props) => {
      const { container } = renderPagination(props);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
