import { act, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef, useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Affix } from "./Affix";

// `rootBounds` is deliberately NOT part of this fixture type — the
// component itself no longer reads it (see `Affix.tsx`'s own comment:
// a real, previously-shipped bug where it was reported in a different
// coordinate frame than `boundingClientRect` whenever this renders
// inside a nested iframe, e.g. Storybook's own preview iframe). Instead
// it computes the reference edge locally (`window.innerHeight` for the
// default viewport root — jsdom's own default is `768` here, unmocked
// deliberately so this stays a real, un-special-cased read of whatever
// the test environment actually reports).
type FakeEntry = Pick<IntersectionObserverEntry, "isIntersecting"> & {
  boundingClientRect: Pick<DOMRectReadOnly, "top" | "bottom" | "left" | "right">;
};
type ObserverCallback = (entries: FakeEntry[]) => void;
type ObserverOptions = { root?: Element | Document | null; threshold?: number };

// A sentinel that has scrolled above the top edge (0, for the default
// viewport root) — the real "stuck" case for `edge="start"` on the
// vertical axis.
const scrolledPastTop: FakeEntry = {
  isIntersecting: false,
  boundingClientRect: { top: -10, bottom: -9, left: 0, right: 0 },
};
// A sentinel still visible within the viewport — the "unstuck" case.
const withinView: FakeEntry = {
  isIntersecting: true,
  boundingClientRect: { top: 100, bottom: 101, left: 0, right: 0 },
};
// A sentinel that simply hasn't been scrolled to yet (mounted below the
// fold) — not intersecting, but must NOT be reported as stuck.
const belowFoldNotYetScrolled: FakeEntry = {
  isIntersecting: false,
  boundingClientRect: { top: 4000, bottom: 4001, left: 0, right: 0 },
};
// A sentinel that has scrolled below jsdom's default 768px viewport
// height — the real "stuck" case for `edge="end"` on the vertical axis.
const scrolledPastBottom: FakeEntry = {
  isIntersecting: false,
  boundingClientRect: { top: 769, bottom: 770, left: 0, right: 0 },
};
// A sentinel that has scrolled past jsdom's default 1024px viewport
// width — the real "stuck" case for `edge="end"` on the horizontal axis
// (LTR: the physical right edge).
const scrolledPastRight: FakeEntry = {
  isIntersecting: false,
  boundingClientRect: { top: 0, bottom: 0, left: 1025, right: 1026 },
};
// A sentinel that has scrolled past the left edge (0) — the real "stuck"
// case for `edge="start"` on the horizontal axis (LTR: the physical left
// edge).
const scrolledPastLeft: FakeEntry = {
  isIntersecting: false,
  boundingClientRect: { top: 0, bottom: 0, left: -10, right: -9 },
};

let latestCallback: ObserverCallback | undefined;
let latestOptions: ObserverOptions | undefined;

class FakeIntersectionObserver {
  constructor(callback: ObserverCallback, options?: ObserverOptions) {
    latestCallback = callback;
    latestOptions = options;
  }

  observe() {}

  unobserve() {}

  disconnect() {}

  takeRecords() {
    return [];
  }
}

beforeEach(() => {
  latestCallback = undefined;
  latestOptions = undefined;
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Affix", () => {
  it("renders its children inside a sticky-positioned element", () => {
    render(<Affix>Header content</Affix>);
    expect(screen.getByText("Header content")).toHaveStyle({
      position: "sticky",
    });
  });

  it("applies the offset for the given edge as a token-driven value", () => {
    render(
      <Affix edge="start" offset={4}>
        Header content
      </Affix>,
    );
    expect(screen.getByText("Header content")).toHaveStyle({
      top: "var(--dbm-space-4)",
    });
  });

  it("applies the offset to bottom when edge is end", () => {
    render(
      <Affix edge="end" offset={6}>
        Filter bar
      </Affix>,
    );
    expect(screen.getByText("Filter bar")).toHaveStyle({
      bottom: "var(--dbm-space-6)",
    });
  });

  it("uses the logical inset-inline properties for axis=horizontal, not physical left/right", () => {
    // Physical `left`/`right` would silently stick to the wrong side
    // under `direction: rtl` — logical properties let the browser
    // resolve the correct physical side itself.
    render(
      <Affix axis="horizontal" edge="start" offset={4}>
        Lead column
      </Affix>,
    );
    expect(screen.getByText("Lead column")).toHaveStyle({
      insetInlineStart: "var(--dbm-space-4)",
    });
  });

  it("applies inset-inline-end for axis=horizontal edge=end", () => {
    render(
      <Affix axis="horizontal" edge="end" offset={6}>
        Lead column
      </Affix>,
    );
    expect(screen.getByText("Lead column")).toHaveStyle({
      insetInlineEnd: "var(--dbm-space-6)",
    });
  });

  it("is not marked as stuck initially", () => {
    render(<Affix>Header content</Affix>);
    expect(screen.getByText("Header content")).not.toHaveAttribute(
      "data-stuck",
    );
  });

  it("sets data-stuck and calls onStickyChange when the sentinel scrolls past the top edge", () => {
    const onStickyChange = vi.fn();
    render(<Affix onStickyChange={onStickyChange}>Header content</Affix>);

    act(() => {
      latestCallback?.([scrolledPastTop]);
    });

    expect(screen.getByText("Header content")).toHaveAttribute(
      "data-stuck",
      "true",
    );
    expect(onStickyChange).toHaveBeenCalledWith(true);
  });

  it("clears data-stuck and calls onStickyChange(false) when the sentinel re-enters view", () => {
    const onStickyChange = vi.fn();
    render(<Affix onStickyChange={onStickyChange}>Header content</Affix>);

    act(() => {
      latestCallback?.([scrolledPastTop]);
    });
    act(() => {
      latestCallback?.([withinView]);
    });

    expect(screen.getByText("Header content")).not.toHaveAttribute(
      "data-stuck",
    );
    expect(onStickyChange).toHaveBeenLastCalledWith(false);
  });

  it("does not report stuck when the sentinel simply hasn't been scrolled to yet (mounted below the fold)", () => {
    // Real, previously-shipped bug: `!entry.isIntersecting` alone can't
    // tell "scrolled past" from "not yet reached" — both report
    // `isIntersecting: false`. A component mounted deep in a long page
    // (e.g. stacked below other content on a Docs page) reported
    // `data-stuck="true"` from the very first render, despite never
    // having actually stuck to anything.
    const onStickyChange = vi.fn();
    render(<Affix onStickyChange={onStickyChange}>Header content</Affix>);

    act(() => {
      latestCallback?.([belowFoldNotYetScrolled]);
    });

    expect(screen.getByText("Header content")).not.toHaveAttribute(
      "data-stuck",
    );
    expect(onStickyChange).toHaveBeenCalledWith(false);
  });

  it("sets data-stuck when edge is end and the sentinel scrolls past the bottom edge", () => {
    const onStickyChange = vi.fn();
    render(
      <Affix edge="end" onStickyChange={onStickyChange}>
        Filter bar
      </Affix>,
    );

    act(() => {
      latestCallback?.([scrolledPastBottom]);
    });

    expect(screen.getByText("Filter bar")).toHaveAttribute(
      "data-stuck",
      "true",
    );
    expect(onStickyChange).toHaveBeenCalledWith(true);
  });

  it("does not report stuck for edge=end when the sentinel scrolled past the opposite (top) edge", () => {
    // The direction check must be edge-aware — a sentinel that scrolled
    // past the *top* edge is irrelevant to an `edge="end"` Affix.
    const onStickyChange = vi.fn();
    render(
      <Affix edge="end" onStickyChange={onStickyChange}>
        Filter bar
      </Affix>,
    );

    act(() => {
      latestCallback?.([scrolledPastTop]);
    });

    expect(screen.getByText("Filter bar")).not.toHaveAttribute("data-stuck");
    expect(onStickyChange).toHaveBeenCalledWith(false);
  });

  it("sets data-stuck for axis=horizontal edge=start when the sentinel scrolls past the left edge", () => {
    const onStickyChange = vi.fn();
    render(
      <Affix axis="horizontal" onStickyChange={onStickyChange}>
        Lead column
      </Affix>,
    );

    act(() => {
      latestCallback?.([scrolledPastLeft]);
    });

    expect(screen.getByText("Lead column")).toHaveAttribute(
      "data-stuck",
      "true",
    );
    expect(onStickyChange).toHaveBeenCalledWith(true);
  });

  it("sets data-stuck for axis=horizontal edge=end when the sentinel scrolls past the right edge", () => {
    const onStickyChange = vi.fn();
    render(
      <Affix axis="horizontal" edge="end" onStickyChange={onStickyChange}>
        Lead column
      </Affix>,
    );

    act(() => {
      latestCallback?.([scrolledPastRight]);
    });

    expect(screen.getByText("Lead column")).toHaveAttribute(
      "data-stuck",
      "true",
    );
    expect(onStickyChange).toHaveBeenCalledWith(true);
  });

  it("does not report stuck for axis=horizontal when the sentinel only scrolled past a vertical edge", () => {
    // Axis-awareness has to hold in both directions — a sentinel that
    // scrolled past the *top* (a vertical-axis crossing) is irrelevant
    // to a horizontal-axis Affix, same as the vertical edge-awareness
    // check above.
    const onStickyChange = vi.fn();
    render(
      <Affix axis="horizontal" onStickyChange={onStickyChange}>
        Lead column
      </Affix>,
    );

    act(() => {
      latestCallback?.([scrolledPastTop]);
    });

    expect(screen.getByText("Lead column")).not.toHaveAttribute("data-stuck");
    expect(onStickyChange).toHaveBeenCalledWith(false);
  });

  it("resolves edge=start to the physical right edge under direction: rtl", () => {
    // `insetInlineStart` (the CSS actually applied) already flips
    // correctly under RTL on its own, browser-side — this test is about
    // the *other* half: the stuck-detection math in the observer
    // callback, which works off `getBoundingClientRect()`'s always-
    // physical coordinates and has to independently resolve which
    // physical edge "start" means before comparing. Wrapping in a real
    // `direction: rtl` ancestor (inherited, not set directly on Affix)
    // matches how RTL actually reaches an element in practice.
    const onStickyChange = vi.fn();
    render(
      <div style={{ direction: "rtl" }}>
        <Affix axis="horizontal" onStickyChange={onStickyChange}>
          Lead column
        </Affix>
      </div>,
    );

    // `edge="start"` under RTL means the physical *right* edge — a
    // sentinel that scrolled past the physical *left* edge instead
    // (`scrolledPastLeft`, the correct fixture for LTR `edge="start"`)
    // must NOT be reported as stuck here.
    act(() => {
      latestCallback?.([scrolledPastLeft]);
    });
    expect(screen.getByText("Lead column")).not.toHaveAttribute("data-stuck");

    act(() => {
      latestCallback?.([scrolledPastRight]);
    });
    expect(screen.getByText("Lead column")).toHaveAttribute(
      "data-stuck",
      "true",
    );
    expect(onStickyChange).toHaveBeenLastCalledWith(true);
  });

  it("computes the stuck edge locally rather than trusting entry.rootBounds", () => {
    // Real, previously-shipped bug (found via direct user report,
    // reproduced only for `side="bottom"`, `edge="end"` after the
    // axis/edge rename): rendered inside a nested iframe (Storybook's
    // own preview iframe), the browser's *implicit* root resolves to
    // the outermost top-level viewport and reports `rootBounds` in
    // *that* frame — a real capture showed `rootBounds: { top: 0,
    // bottom: 912 }` (the actual browser tab's height) while the
    // sentinel's own document was genuinely only `572px` tall. Comparing
    // `boundingClientRect` (sentinel-local frame) against that
    // mismatched `rootBounds` silently broke the bottom-edge check —
    // `top` never showed it, since a viewport's own top is always `0`
    // in any frame, but `bottom` differs by frame. This entry is `769`
    // — genuinely past jsdom's real `768px` viewport — paired with a
    // deliberately wrong, much larger `rootBounds.bottom` a broken
    // implementation would trust instead; if `Affix` ever reads
    // `entry.rootBounds` again, this must fail.
    const onStickyChange = vi.fn();
    render(
      <Affix edge="end" onStickyChange={onStickyChange}>
        Header content
      </Affix>,
    );

    act(() => {
      latestCallback?.([
        {
          isIntersecting: false,
          boundingClientRect: { top: 769, bottom: 770, left: 0, right: 0 },
          // @ts-expect-error -- intentionally present on the raw object
          // passed through the callback to prove the component doesn't
          // read it, even though `FakeEntry` no longer declares it.
          rootBounds: { top: 0, bottom: 5000 },
        },
      ]);
    });

    expect(screen.getByText("Header content")).toHaveAttribute(
      "data-stuck",
      "true",
    );
    expect(onStickyChange).toHaveBeenCalledWith(true);
  });

  it("computes the stuck edge from scrollContainerRef's own element when provided", () => {
    // The `root.getBoundingClientRect()` path — a real DOM element in
    // the same document as the sentinel, unlike the nested-iframe
    // `rootBounds` mismatch above, but still worth covering directly
    // since it's now the *only* source for the reference edge (no
    // fallback to `entry.rootBounds` for this path either).
    const onStickyChange = vi.fn();
    function Wrapper() {
      const containerRef = useRef<HTMLDivElement>(null);
      return (
        <div ref={containerRef}>
          <Affix
            edge="end"
            scrollContainerRef={containerRef}
            onStickyChange={onStickyChange}
          >
            Filter bar
          </Affix>
        </div>
      );
    }
    render(<Wrapper />);

    const container = latestOptions?.root as HTMLDivElement;
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
      top: 0,
      bottom: 400,
      left: 0,
      right: 0,
      width: 0,
      height: 400,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    act(() => {
      latestCallback?.([
        {
          isIntersecting: false,
          boundingClientRect: { top: 401, bottom: 402, left: 0, right: 0 },
        },
      ]);
    });

    expect(screen.getByText("Filter bar")).toHaveAttribute(
      "data-stuck",
      "true",
    );
    expect(onStickyChange).toHaveBeenCalledWith(true);
  });

  it("forwards ref to the sticky element", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Affix ref={ref}>Header content</Affix>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toHaveTextContent("Header content");
  });

  it("applies className to the sticky element", () => {
    render(<Affix className="custom">Header content</Affix>);
    expect(screen.getByText("Header content")).toHaveClass("custom");
  });

  it("applies id and data-testid to the sticky element", () => {
    render(
      <Affix id="filter-bar" data-testid="affix-root">
        Header content
      </Affix>,
    );
    const el = screen.getByText("Header content");
    expect(el).toHaveAttribute("id", "filter-bar");
    expect(el).toHaveAttribute("data-testid", "affix-root");
  });

  it("never lets a same-named consumer prop override the computed data-stuck", () => {
    // `data-stuck` is a plain data-* attribute a consumer can pass — this
    // proves it can't silently win over the real computed value the same
    // way it did before {...props} was moved ahead of it in the JSX.
    render(<Affix data-stuck="not-real">Header content</Affix>);
    expect(screen.getByText("Header content")).not.toHaveAttribute(
      "data-stuck",
      "not-real",
    );
  });

  it("passes scrollContainerRef's element as the IntersectionObserver root", () => {
    function Wrapper() {
      const containerRef = useRef<HTMLDivElement>(null);
      return (
        <div ref={containerRef}>
          <Affix scrollContainerRef={containerRef}>Header content</Affix>
        </div>
      );
    }
    render(<Wrapper />);
    expect(latestOptions?.root).toBeInstanceOf(HTMLDivElement);
  });

  it("defaults the IntersectionObserver root to the viewport (null) without scrollContainerRef", () => {
    render(<Affix>Header content</Affix>);
    expect(latestOptions?.root).toBeNull();
  });

  it("warns once in development when axis is horizontal without scrollContainerRef", () => {
    // Page-level horizontal scroll is rare — almost every real
    // `axis="horizontal"` use case needs `scrollContainerRef`, unlike
    // `axis="vertical"` (see `Affix.mdx`'s own "Don't" callout). Missing
    // it silently measures stuck-state against the wrong scroll context
    // rather than failing loudly, so this warns instead.
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(
      <Affix axis="horizontal">Lead column</Affix>,
    );
    rerender(<Affix axis="horizontal">Lead column, again</Affix>);

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('axis="horizontal" without scrollContainerRef'),
    );
    consoleWarnSpy.mockRestore();
  });

  it("does not warn about axis=horizontal when scrollContainerRef is provided", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    function Wrapper() {
      const containerRef = useRef<HTMLDivElement>(null);
      return (
        <div ref={containerRef}>
          <Affix axis="horizontal" scrollContainerRef={containerRef}>
            Lead column
          </Affix>
        </div>
      );
    }
    render(<Wrapper />);

    expect(consoleWarnSpy).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it("does not warn about scrollContainerRef for the default vertical axis", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<Affix>Header content</Affix>);

    expect(consoleWarnSpy).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Affix>Header content</Affix>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe("asChild", () => {
    it("renders the slotted child's own element type instead of a wrapping div", () => {
      render(
        <Affix asChild>
          <th>Lead cell</th>
        </Affix>,
      );
      const el = screen.getByText("Lead cell");
      expect(el.tagName).toBe("TH");
    });

    it("merges data-stuck, className, and style onto the slotted element via Slot", () => {
      render(
        <Affix asChild className="custom" style={{ zIndex: 5 }}>
          <th>Lead cell</th>
        </Affix>,
      );
      const el = screen.getByText("Lead cell");
      expect(el).toHaveClass("custom");
      expect(el).toHaveStyle({ position: "sticky", zIndex: "5" });

      act(() => {
        latestCallback?.([scrolledPastTop]);
      });
      expect(el).toHaveAttribute("data-stuck", "true");
    });

    it("forwards ref to the slotted element itself, not a wrapper", () => {
      const ref = createRef<HTMLTableCellElement>();
      render(
        <Affix asChild ref={ref}>
          <th>Lead cell</th>
        </Affix>,
      );
      expect(ref.current).toBeInstanceOf(HTMLTableCellElement);
      expect(ref.current).toHaveTextContent("Lead cell");
    });

    it("renders the sentinel as the tag given by sentinelAs", () => {
      const { container } = render(
        <Affix asChild sentinelAs="th">
          <th>Lead cell</th>
        </Affix>,
      );
      // The sentinel is the first child of the fragment (edge="start"
      // default) — the slotted `<th>` is the second, matched by text.
      const sentinel = container.querySelector('[aria-hidden="true"]');
      expect(sentinel?.tagName).toBe("TH");
    });

    it("defaults the sentinel to a plain div when sentinelAs is not given", () => {
      const { container } = render(
        <Affix asChild>
          <th>Lead cell</th>
        </Affix>,
      );
      const sentinel = container.querySelector('[aria-hidden="true"]');
      expect(sentinel?.tagName).toBe("DIV");
    });

    it("has no accessibility violations when rendered with asChild onto a non-default element", () => {
      // Per this project's own checklist for polymorphic components: run
      // axe against a non-default rendering too, not just the default
      // element (`Avatar`'s `role="img"` + `as="button"` finding is the
      // precedent for why this matters).
      async function checkAxe() {
        const { container } = render(
          <table>
            <thead>
              <tr>
                <Affix asChild sentinelAs="th">
                  <th>Lead cell</th>
                </Affix>
              </tr>
            </thead>
          </table>,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      }
      return checkAxe();
    });
  });
});
