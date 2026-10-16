import { useWindowedList } from "@dbm-design-system/primitives";
import { act, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

// jsdom lays nothing out, so the scrolling box's height is stated and its scroll position is set by hand.
function Box({ count, size, onList, enabled = true }: { count: number; size: (i: number) => number; onList: (list: ReturnType<typeof useWindowedList>) => void; enabled?: boolean }) {
  const list = useWindowedList({ count, getItemSize: size, enabled, overscan: 2 });
  onList(list);
  return (
    <div
      data-testid="box"
      ref={(element) => {
        if (element) Object.defineProperty(element, "clientHeight", { configurable: true, value: 100 });
        list.containerRef(element);
      }}
    />
  );
}

const fixed = (height: number) => (_index: number) => height;

describe("useWindowedList", () => {
  it("draws only the items in view plus the overscan, and leaves space for the rest", () => {
    let latest!: ReturnType<typeof useWindowedList>;
    render(<Box count={1000} size={fixed(10)} onList={(list) => (latest = list)} />);
    // 100px of 10px items is items 0-9 (and the one at the edge), plus 2 beyond.
    expect(latest.start).toBe(0);
    expect(latest.end).toBe(13);
    expect(latest.before).toBe(0);
    expect(latest.after).toBe((1000 - 13) * 10);
    expect(latest.totalSize).toBe(10000);
  });

  it("moves the window as the box scrolls", () => {
    let latest!: ReturnType<typeof useWindowedList>;
    const { getByTestId } = render(<Box count={1000} size={fixed(10)} onList={(list) => (latest = list)} />);
    const box = getByTestId("box");
    act(() => {
      box.scrollTop = 500;
      box.dispatchEvent(new Event("scroll"));
    });
    expect(latest.start).toBe(48);
    expect(latest.end).toBe(63);
    expect(latest.before).toBe(480);
    expect(latest.after + latest.before + (latest.end - latest.start) * 10).toBe(10000);
  });

  it("handles items of different heights", () => {
    let latest!: ReturnType<typeof useWindowedList>;
    const size = (index: number) => (index % 2 === 0 ? 10 : 30);
    const { getByTestId } = render(<Box count={100} size={size} onList={(list) => (latest = list)} />);
    expect(latest.totalSize).toBe(2000);
    act(() => {
      getByTestId("box").scrollTop = 400;
      getByTestId("box").dispatchEvent(new Event("scroll"));
    });
    // offset 400 is the start of item 20 (10 pairs of 40px)
    expect(latest.before).toBe(latest.start * 20);
    expect(latest.start).toBeLessThanOrEqual(20);
    expect(latest.end).toBeGreaterThan(20);
  });

  it("scrolls the least amount that brings an item fully into view", () => {
    let latest!: ReturnType<typeof useWindowedList>;
    const { getByTestId } = render(<Box count={1000} size={fixed(10)} onList={(list) => (latest = list)} />);
    const box = getByTestId("box");
    act(() => latest.scrollToIndex(5));
    expect(box.scrollTop).toBe(0);
    act(() => latest.scrollToIndex(20));
    // item 20 ends at 210, a 100px box shows 110-210
    expect(box.scrollTop).toBe(110);
    act(() => latest.scrollToIndex(2));
    expect(box.scrollTop).toBe(20);
    act(() => latest.scrollToIndex(5000));
    expect(box.scrollTop).toBe(20);
  });

  it("draws every item when disabled, and copes with an empty list", () => {
    let latest!: ReturnType<typeof useWindowedList>;
    const { rerender } = render(<Box count={50} size={fixed(10)} enabled={false} onList={(list) => (latest = list)} />);
    expect([latest.start, latest.end, latest.before, latest.after]).toEqual([0, 50, 0, 0]);
    rerender(<Box count={0} size={fixed(10)} onList={(list) => (latest = list)} />);
    expect([latest.start, latest.end, latest.totalSize]).toEqual([0, 0, 0]);
  });
});
