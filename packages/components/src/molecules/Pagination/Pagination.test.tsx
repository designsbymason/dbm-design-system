import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
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
    ];
    it.each(cases)("has no violations for %s", async (_name, props) => {
      const { container } = renderPagination(props);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
