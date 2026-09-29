import { act, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScrollArea } from "./ScrollArea";
import styles from "./ScrollArea.module.css";

const OriginalResizeObserver = globalThis.ResizeObserver;

/**
 * jsdom has no layout, so overflow is simulated: `Element`'s own size
 * getters are spied to report whatever `state` currently says, and a fake
 * `ResizeObserver` fires its callback on `observe()` (as a real one does
 * once, initially) and again whenever `setOverflowing()` is called — the
 * same technique `Table`'s own test suite uses for its analogous
 * `useScrollableRegion` hook, generalized here to independent x/y axes.
 */
function installOverflowSimulation(initial: { x?: boolean; y?: boolean } = {}) {
  const state = { x: initial.x ?? false, y: initial.y ?? false };
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
  vi.spyOn(Element.prototype, "scrollWidth", "get").mockImplementation(() => (state.x ? 500 : 100));
  vi.spyOn(Element.prototype, "clientWidth", "get").mockReturnValue(100);
  vi.spyOn(Element.prototype, "scrollHeight", "get").mockImplementation(() => (state.y ? 500 : 100));
  vi.spyOn(Element.prototype, "clientHeight", "get").mockReturnValue(100);

  return {
    setOverflowing(next: { x?: boolean; y?: boolean }) {
      if (next.x !== undefined) state.x = next.x;
      if (next.y !== undefined) state.y = next.y;
      act(() => {
        callbacks.forEach((callback) => callback());
      });
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.stubGlobal("ResizeObserver", OriginalResizeObserver);
});

describe("ScrollArea", () => {
  it("renders its children", () => {
    render(<ScrollArea>Content</ScrollArea>);
    expect(screen.getByText("Content")).toBeVisible();
  });

  it("forwards ref to the outer frame, distinct from viewportRef", () => {
    installOverflowSimulation();
    const outerRef = createRef<HTMLDivElement>();
    const viewportRef = createRef<HTMLDivElement>();
    render(
      <ScrollArea ref={outerRef} viewportRef={viewportRef} data-testid="frame">
        Content
      </ScrollArea>,
    );
    expect(outerRef.current).toBe(screen.getByTestId("frame"));
    expect(viewportRef.current).not.toBeNull();
    expect(viewportRef.current).not.toBe(outerRef.current);
    expect(viewportRef.current?.contains(screen.getByText("Content"))).toBe(true);
  });

  it("applies data-testid, id, className and style to the outer frame, not the viewport", () => {
    installOverflowSimulation();
    render(
      <ScrollArea data-testid="frame" id="my-scroll-area" className="extra" style={{ background: "red" }}>
        Content
      </ScrollArea>,
    );
    const frame = screen.getByTestId("frame");
    expect(frame.id).toBe("my-scroll-area");
    expect(frame.className).toContain("extra");
    expect(frame.style.background).toBe("red");
  });

  it("applies maxHeight to the outer frame as max-block-size", () => {
    render(<ScrollArea maxHeight="20rem" data-testid="frame">Content</ScrollArea>);
    expect(screen.getByTestId("frame").style.maxBlockSize).toBe("20rem");
  });

  it("defaults to variant='bordered'", () => {
    render(<ScrollArea data-testid="frame">Content</ScrollArea>);
    expect(screen.getByTestId("frame").className).toContain(styles.bordered);
  });

  it("applies the ghost variant's class instead", () => {
    render(
      <ScrollArea variant="ghost" data-testid="frame">
        Content
      </ScrollArea>,
    );
    const frame = screen.getByTestId("frame");
    expect(frame.className).toContain(styles.ghost);
    expect(frame.className).not.toContain(styles.bordered);
  });

  // `scrollbarVisibility="always"` throughout this group: the default,
  // `"hover"`, mounts a scrollbar's DOM node only once genuinely hovered
  // (via Radix's own `Presence`) — these tests are about which orientation(s)
  // get *requested*, not about that separate fade/hover behavior, which is
  // Radix's own already-covered internal logic.
  it("renders only a vertical scrollbar by default", () => {
    const { container } = render(<ScrollArea scrollbarVisibility="always">Content</ScrollArea>);
    expect(container.querySelectorAll('[data-orientation="vertical"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-orientation="horizontal"]')).toHaveLength(0);
  });

  it("renders only a horizontal scrollbar when scrollbars='horizontal'", () => {
    const { container } = render(
      <ScrollArea scrollbars="horizontal" scrollbarVisibility="always">
        Content
      </ScrollArea>,
    );
    expect(container.querySelectorAll('[data-orientation="horizontal"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-orientation="vertical"]')).toHaveLength(0);
  });

  it("renders both scrollbars when scrollbars='both'", () => {
    const { container } = render(
      <ScrollArea scrollbars="both" scrollbarVisibility="always">
        Content
      </ScrollArea>,
    );
    expect(container.querySelectorAll('[data-orientation="vertical"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-orientation="horizontal"]')).toHaveLength(1);
  });

  it("applies the size class to every rendered scrollbar", () => {
    const { container } = render(
      <ScrollArea scrollbars="both" scrollbarVisibility="always" size="lg">
        Content
      </ScrollArea>,
    );
    const scrollbars = container.querySelectorAll(`.${styles.scrollbar}`);
    expect(scrollbars).toHaveLength(2);
    scrollbars.forEach((scrollbar) => expect(scrollbar.className).toContain(styles.sizeLg));
  });

  it("fires onScroll on the actual scrolling viewport, not the outer frame", () => {
    installOverflowSimulation({ y: true });
    const onScroll = vi.fn();
    render(
      <ScrollArea onScroll={onScroll} data-testid="frame">
        Content
      </ScrollArea>,
    );
    const frame = screen.getByTestId("frame");
    // The viewport is the frame's own first child — `data-radix-scroll-area-viewport` is Radix's
    // own internal marker, a stable way to find it without relying on this component's class names.
    const viewport = frame.querySelector("[data-radix-scroll-area-viewport]");
    expect(viewport).not.toBeNull();
    viewport?.dispatchEvent(new Event("scroll", { bubbles: false }));
    expect(onScroll).toHaveBeenCalledTimes(1);
    frame.dispatchEvent(new Event("scroll", { bubbles: false }));
    expect(onScroll).toHaveBeenCalledTimes(1);
  });

  it("is not a keyboard tab stop when content fits", () => {
    installOverflowSimulation({ y: false });
    render(<ScrollArea data-testid="frame">Content</ScrollArea>);
    const viewport = screen.getByTestId("frame").querySelector("[data-radix-scroll-area-viewport]");
    expect(viewport).not.toHaveAttribute("tabindex");
  });

  it("becomes a keyboard-reachable region once its content overflows the enabled axis", () => {
    const sim = installOverflowSimulation({ y: false });
    render(<ScrollArea data-testid="frame">Content</ScrollArea>);
    const viewport = () => screen.getByTestId("frame").querySelector("[data-radix-scroll-area-viewport]");
    expect(viewport()).not.toHaveAttribute("tabindex");
    sim.setOverflowing({ y: true });
    expect(viewport()).toHaveAttribute("tabindex", "0");
  });

  it("ignores overflow on an axis with no scrollbar offered", () => {
    installOverflowSimulation({ x: true, y: false });
    render(
      <ScrollArea scrollbars="vertical" data-testid="frame">
        Content
      </ScrollArea>,
    );
    const viewport = screen.getByTestId("frame").querySelector("[data-radix-scroll-area-viewport]");
    // Horizontal overflow exists, but only "vertical" was requested — the
    // clipped axis shouldn't make the region a tab stop.
    expect(viewport).not.toHaveAttribute("tabindex");
  });

  it("adds role='region' and the accessible name only once scrollable, from aria-label", () => {
    const sim = installOverflowSimulation({ y: false });
    render(
      <ScrollArea aria-label="Recent activity" data-testid="frame">
        Content
      </ScrollArea>,
    );
    const viewport = () => screen.getByTestId("frame").querySelector("[data-radix-scroll-area-viewport]");
    expect(viewport()).not.toHaveAttribute("role");
    sim.setOverflowing({ y: true });
    expect(viewport()).toHaveAttribute("role", "region");
    expect(viewport()).toHaveAttribute("aria-label", "Recent activity");
  });

  it("prefers aria-label over aria-labelledby when both are set", () => {
    installOverflowSimulation({ y: true });
    render(
      <>
        <span id="heading">Activity</span>
        <ScrollArea aria-label="Recent activity" aria-labelledby="heading" data-testid="frame">
          Content
        </ScrollArea>
      </>,
    );
    const viewport = screen.getByTestId("frame").querySelector("[data-radix-scroll-area-viewport]");
    expect(viewport).toHaveAttribute("aria-label", "Recent activity");
    expect(viewport).not.toHaveAttribute("aria-labelledby");
  });

  it("gives no role at all when scrollable but unnamed — an unlabeled region is just noise", () => {
    installOverflowSimulation({ y: true });
    render(<ScrollArea data-testid="frame">Content</ScrollArea>);
    const viewport = screen.getByTestId("frame").querySelector("[data-radix-scroll-area-viewport]");
    expect(viewport).toHaveAttribute("tabindex", "0");
    expect(viewport).not.toHaveAttribute("role");
  });

  it("passes dir to the underlying primitive", () => {
    installOverflowSimulation();
    render(
      <ScrollArea dir="rtl" data-testid="frame">
        Content
      </ScrollArea>,
    );
    expect(screen.getByTestId("frame")).toHaveAttribute("dir", "rtl");
  });

  it("defaults dir to ltr rather than inheriting the page's direction", () => {
    installOverflowSimulation();
    render(<ScrollArea data-testid="frame">Content</ScrollArea>);
    expect(screen.getByTestId("frame")).toHaveAttribute("dir", "ltr");
  });

  it("passes through native props (e.g. aria-hidden) to the outer frame", () => {
    installOverflowSimulation();
    render(
      <ScrollArea aria-hidden="true" data-testid="frame">
        Content
      </ScrollArea>,
    );
    expect(screen.getByTestId("frame")).toHaveAttribute("aria-hidden", "true");
  });

  it("has no accessibility violations when scrollable and labeled", async () => {
    installOverflowSimulation({ y: true });
    const { container } = render(
      <ScrollArea aria-label="Recent activity">
        <p>Line one</p>
        <p>Line two</p>
      </ScrollArea>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations when content fits (no tab stop, no role)", async () => {
    installOverflowSimulation({ y: false });
    const { container } = render(
      <ScrollArea>
        <p>Short content</p>
      </ScrollArea>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
