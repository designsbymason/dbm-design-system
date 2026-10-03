import { useScrollEdges } from "@dbm-design-system/primitives";
import { act, render, screen, waitFor } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
});

// jsdom lays nothing out, so each element's rectangle is given by hand.
const rects = new Map<Element, { left: number; right: number; top: number; bottom: number }>();
const stubRects = () =>
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    const r = rects.get(this) ?? { left: 0, right: 0, top: 0, bottom: 0 };
    return { ...r, width: r.right - r.left, height: r.bottom - r.top, x: r.left, y: r.top, toJSON: () => r } as DOMRect;
  });

function Probe({
  orientation = "horizontal",
  itemSelector,
  enabled,
  tick = 0,
  trailing = false,
}: {
  orientation?: "horizontal" | "vertical";
  itemSelector?: string;
  enabled?: boolean;
  /** Only changes between renders, so a test can make the hook read again. */
  tick?: number;
  /** Adds a last child that is not a tab. */
  trailing?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { overflowStart, overflowEnd } = useScrollEdges(ref, orientation, { itemSelector, enabled });
  return (
    <div ref={ref} data-testid="list" data-start={overflowStart} data-end={overflowEnd} data-tick={tick}>
      <span data-testid="first" role="tab">
        a
      </span>
      <span data-testid="middle">b</span>
      <span data-testid="last" role="tab">
        c
      </span>
      {trailing && <span data-testid="trailing">d</span>}
    </div>
  );
}

const set = (id: string, left: number, right: number, top = 0, bottom = 20) => rects.set(screen.getByTestId(id), { left, right, top, bottom });

describe("useScrollEdges", () => {
  it("is false at both edges while everything is inside the container", () => {
    stubRects();
    rects.clear();
    const { rerender } = render(<Probe />);
    set("list", 0, 200);
    set("first", 0, 40);
    set("last", 160, 200);
    rerender(<Probe tick={1} />);
    expect(screen.getByTestId("list")).toHaveAttribute("data-start", "false");
    expect(screen.getByTestId("list")).toHaveAttribute("data-end", "false");
  });

  it("reads the end as overflowing when the last child runs past it, and the start when the first is cut off", async () => {
    stubRects();
    rects.clear();
    const { rerender } = render(<Probe />);
    set("list", 0, 200);
    set("first", 0, 40);
    set("last", 300, 360);
    rerender(<Probe tick={1} />);
    await waitFor(() => expect(screen.getByTestId("list")).toHaveAttribute("data-end", "true"));
    expect(screen.getByTestId("list")).toHaveAttribute("data-start", "false");
    set("first", -80, -40);
    set("last", 100, 140);
    act(() => {
      screen.getByTestId("list").dispatchEvent(new Event("scroll"));
    });
    await waitFor(() => expect(screen.getByTestId("list")).toHaveAttribute("data-start", "true"));
    expect(screen.getByTestId("list")).toHaveAttribute("data-end", "false");
  });

  it("ignores a one-pixel rounding difference", () => {
    stubRects();
    rects.clear();
    const { rerender } = render(<Probe />);
    set("list", 0, 200);
    set("first", -0.5, 40);
    set("last", 160, 200.5);
    rerender(<Probe tick={1} />);
    expect(screen.getByTestId("list")).toHaveAttribute("data-start", "false");
    expect(screen.getByTestId("list")).toHaveAttribute("data-end", "false");
  });

  it("uses the top and bottom for a vertical container", async () => {
    stubRects();
    rects.clear();
    const { rerender } = render(<Probe orientation="vertical" />);
    set("list", 0, 200, 0, 100);
    set("first", 0, 200, 0, 20);
    set("last", 0, 200, 90, 160);
    rerender(<Probe orientation="vertical" tick={1} />);
    await waitFor(() => expect(screen.getByTestId("list")).toHaveAttribute("data-end", "true"));
    expect(screen.getByTestId("list")).toHaveAttribute("data-start", "false");
  });

  it("measures only the items the selector names when one is given, not every child", async () => {
    stubRects();
    rects.clear();
    const { rerender } = render(<Probe itemSelector='[role="tab"]' trailing />);
    // `trailing` is the last child but not a tab, and is far out of range; only the tabs count
    set("list", 0, 200);
    set("first", 0, 40);
    set("last", 160, 200);
    set("trailing", 900, 940);
    rerender(<Probe itemSelector='[role="tab"]' trailing tick={1} />);
    expect(screen.getByTestId("list")).toHaveAttribute("data-end", "false");
    set("last", 260, 300);
    act(() => {
      screen.getByTestId("list").dispatchEvent(new Event("scroll"));
    });
    await waitFor(() => expect(screen.getByTestId("list")).toHaveAttribute("data-end", "true"));
  });

  it("without a selector, the container's own last child decides", () => {
    stubRects();
    rects.clear();
    const { rerender } = render(<Probe trailing />);
    set("list", 0, 200);
    set("first", 0, 40);
    set("last", 160, 200);
    set("trailing", 900, 940);
    rerender(<Probe trailing tick={1} />);
    expect(screen.getByTestId("list")).toHaveAttribute("data-end", "true");
  });

  it("does nothing while disabled", () => {
    stubRects();
    rects.clear();
    const { rerender } = render(<Probe enabled={false} />);
    set("list", 0, 200);
    set("first", -80, -40);
    set("last", 300, 360);
    rerender(<Probe enabled={false} tick={1} />);
    act(() => {
      screen.getByTestId("list").dispatchEvent(new Event("scroll"));
    });
    expect(screen.getByTestId("list")).toHaveAttribute("data-start", "false");
    expect(screen.getByTestId("list")).toHaveAttribute("data-end", "false");
  });
});
