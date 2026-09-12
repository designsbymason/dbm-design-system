import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ListItem } from "../../atoms/ListItem";
import { List } from "./List";

describe("List", () => {
  it("renders a <ul> by default", () => {
    render(
      <List data-testid="list">
        <ListItem>Item</ListItem>
      </List>,
    );
    expect(screen.getByTestId("list").tagName).toBe("UL");
  });

  it('renders an <ol> when as="ol"', () => {
    render(
      <List as="ol" data-testid="list">
        <ListItem>Item</ListItem>
      </List>,
    );
    expect(screen.getByTestId("list").tagName).toBe("OL");
  });

  it("defaults marker to disc for ul and decimal for ol", () => {
    const { rerender } = render(<List data-testid="list" />);
    expect(screen.getByTestId("list")).toHaveStyle({ listStyleType: "disc" });

    rerender(<List as="ol" data-testid="list" />);
    expect(screen.getByTestId("list")).toHaveStyle({
      listStyleType: "decimal",
    });
  });

  it("allows overriding the marker", () => {
    render(<List marker="none" data-testid="list" />);
    expect(screen.getByTestId("list")).toHaveStyle({ listStyleType: "none" });
  });

  it("applies spacing as a token-driven CSS variable", () => {
    render(<List spacing={4} data-testid="list" />);
    expect(screen.getByTestId("list")).toHaveStyle({
      "--list-gap-base": "var(--dbm-space-4)",
    });
  });

  it("sets a responsive spacing as per-breakpoint CSS variables", () => {
    render(<List spacing={{ base: 1, lg: 6 }} data-testid="list" />);
    const el = screen.getByTestId("list");
    expect(el.style.getPropertyValue("--list-gap-base")).toBe(
      "var(--dbm-space-1)",
    );
    expect(el.style.getPropertyValue("--list-gap-lg")).toBe(
      "var(--dbm-space-6)",
    );
  });

  it("does not add role=list when a marker is present", () => {
    render(<List data-testid="list" />);
    expect(screen.getByTestId("list")).not.toHaveAttribute("role");
  });

  it('adds role="list" when marker="none" (Safari/VoiceOver list-role fix)', () => {
    render(<List marker="none" data-testid="list" />);
    expect(screen.getByTestId("list")).toHaveAttribute("role", "list");
  });

  it("renders as ol with ol-specific native props (start, reversed)", () => {
    render(
      <List as="ol" start={5} reversed data-testid="list">
        <ListItem>Item</ListItem>
      </List>,
    );
    const el = screen.getByTestId("list");
    expect(el.tagName).toBe("OL");
    expect(el).toHaveAttribute("start", "5");
    expect(el).toHaveAttribute("reversed");
  });

  describe("type prop", () => {
    // Found live 2026-09-13: the native `type` HTML attribute reached the
    // DOM correctly, but CSS `list-style-type` (set by the default
    // `markerDecimal` class) always overrode it — `type` had zero visible
    // effect until translated into its own CSS `list-style-type`
    // equivalent instead of relying on the native attribute alone.
    it("translates type into the matching CSS list-style-type, not the native attribute alone", () => {
      render(
        <List as="ol" type="A" data-testid="list">
          <ListItem>Item</ListItem>
        </List>,
      );
      const el = screen.getByTestId("list");
      expect(el).toHaveAttribute("type", "A");
      expect(el).toHaveStyle({ listStyleType: "upper-alpha" });
    });

    it("maps every ListOrderedType to its CSS list-style-type equivalent", () => {
      const cases: Array<[string, string]> = [
        ["1", "decimal"],
        ["a", "lower-alpha"],
        ["A", "upper-alpha"],
        ["i", "lower-roman"],
        ["I", "upper-roman"],
      ];
      for (const [type, expected] of cases) {
        const { unmount } = render(
          <List as="ol" type={type as never} data-testid="list" />,
        );
        expect(screen.getByTestId("list")).toHaveStyle({
          listStyleType: expected,
        });
        unmount();
      }
    });

    it('has no effect on the default ul (no as="ol")', () => {
      render(<List type="A" data-testid="list" />);
      const el = screen.getByTestId("list");
      expect(el).not.toHaveStyle({ listStyleType: "upper-alpha" });
    });

    it('has no effect alongside an explicit marker="disc" override', () => {
      render(<List as="ol" marker="disc" type="A" data-testid="list" />);
      const el = screen.getByTestId("list");
      expect(el).not.toHaveStyle({ listStyleType: "upper-alpha" });
    });
  });

  it("forwards ref to the underlying list element", () => {
    const ref = createRef<HTMLUListElement>();
    render(<List ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLUListElement);
  });

  it("forwards ref to the element rendered via `as`, not just the default ul", () => {
    const ref = createRef<HTMLOListElement>();
    render(<List as="ol" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLOListElement);
  });

  it("forwards className and native props", () => {
    render(<List className="custom" data-testid="list" />);
    expect(screen.getByTestId("list")).toHaveClass("custom");
  });

  it("forwards id and style", () => {
    render(<List data-testid="list" id="my-list" style={{ opacity: 0.5 }} />);
    const el = screen.getByTestId("list");
    expect(el).toHaveAttribute("id", "my-list");
    expect(el).toHaveStyle({ opacity: "0.5" });
  });

  it("never lets a same-named consumer prop override the computed role attribute", () => {
    // `role` is a genuinely valid native prop here (inherited from `ul`'s
    // own `HTMLAttributes`, no type error to guard against) — this is
    // exactly the real-world case the props-spread-ordering fix protects
    // against: a consumer passing their own `role` must not silently win
    // over List's own `role="list"` Safari/VoiceOver fix.
    render(<List marker="none" role="menu" data-testid="list" />);
    expect(screen.getByTestId("list")).toHaveAttribute("role", "list");
  });

  describe("ol-only prop warning", () => {
    // `vi.spyOn(console, "warn")` returns the *same* spy across calls once
    // `console.warn` is already spied, so its `.mock.calls` accumulates
    // across tests unless explicitly restored — this project has no global
    // `restoreMocks`/`clearMocks` config, so each test scoped to this spy
    // needs its own clean slate (found while writing this describe block:
    // without this, the two "does not warn" tests below saw call counts
    // left over from the "warns when..." tests run before them).
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('warns when start is passed without as="ol"', () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(<List start={5} />);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('as="ol"'));
    });

    it('warns when reversed is passed without as="ol"', () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(<List reversed />);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('as="ol"'));
    });

    it('warns when type is passed without as="ol"', () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(<List type="a" />);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('as="ol"'));
    });

    it("does not warn when start/reversed/type are used with as=\"ol\"", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(<List as="ol" start={5} reversed type="a" />);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("does not warn when no ol-only props are passed", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(<List />);
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  it("has no accessibility violations (default ul/disc)", async () => {
    const { container } = render(
      <List>
        <ListItem>One</ListItem>
        <ListItem>Two</ListItem>
      </List>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations with as="ol"', async () => {
    const { container } = render(
      <List as="ol">
        <ListItem>One</ListItem>
        <ListItem>Two</ListItem>
      </List>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations with marker="none" (the role="list" fix)', async () => {
    const { container } = render(
      <List marker="none">
        <ListItem>One</ListItem>
        <ListItem>Two</ListItem>
      </List>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations with interactive ListItem rows", async () => {
    const { container } = render(
      <List marker="none">
        <ListItem interactive selected onClick={() => {}}>
          Current page
        </ListItem>
        <ListItem interactive onClick={() => {}}>
          Other page
        </ListItem>
        <ListItem interactive disabled onClick={() => {}}>
          Unavailable page
        </ListItem>
      </List>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
