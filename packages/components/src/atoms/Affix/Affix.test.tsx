import { act, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Affix } from "./Affix";

type ObserverCallback = (entries: Pick<IntersectionObserverEntry, "isIntersecting">[]) => void;

let latestCallback: ObserverCallback | undefined;

class FakeIntersectionObserver {
  constructor(callback: ObserverCallback) {
    latestCallback = callback;
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

  it("applies the offset for the given side as a token-driven value", () => {
    render(
      <Affix side="top" offset={4}>
        Header content
      </Affix>,
    );
    expect(screen.getByText("Header content")).toHaveStyle({
      top: "var(--dbm-space-4)",
    });
  });

  it("applies the offset to bottom when side is bottom", () => {
    render(
      <Affix side="bottom" offset={6}>
        Filter bar
      </Affix>,
    );
    expect(screen.getByText("Filter bar")).toHaveStyle({
      bottom: "var(--dbm-space-6)",
    });
  });

  it("is not marked as stuck initially", () => {
    render(<Affix>Header content</Affix>);
    expect(screen.getByText("Header content")).not.toHaveAttribute(
      "data-stuck",
    );
  });

  it("sets data-stuck and calls onStickyChange when the sentinel leaves view", () => {
    const onStickyChange = vi.fn();
    render(<Affix onStickyChange={onStickyChange}>Header content</Affix>);

    act(() => {
      latestCallback?.([{ isIntersecting: false }]);
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
      latestCallback?.([{ isIntersecting: false }]);
    });
    act(() => {
      latestCallback?.([{ isIntersecting: true }]);
    });

    expect(screen.getByText("Header content")).not.toHaveAttribute(
      "data-stuck",
    );
    expect(onStickyChange).toHaveBeenLastCalledWith(false);
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

  it("has no accessibility violations", async () => {
    const { container } = render(<Affix>Header content</Affix>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
