import { describe, expect, it } from "vitest";
import {
  type PaneConstraints,
  initialLayout,
  isCollapsed,
  normalizeLayout,
  pairRange,
  resizePair,
  sameLayout,
  togglePane,
} from "./splitterModel";

const pane = (overrides: Partial<PaneConstraints> = {}): PaneConstraints => ({
  min: 10,
  max: 100,
  collapsible: false,
  collapsed: 0,
  ...overrides,
});
const total = (layout: number[]) => layout.reduce((a, b) => a + b, 0);

describe("normalizeLayout", () => {
  it("scales a layout that doesn't sum to 100", () => {
    expect(normalizeLayout([1, 1], [pane(), pane()])).toEqual([50, 50]);
    expect(normalizeLayout([30, 30], [pane(), pane()])).toEqual([50, 50]);
  });

  it("makes equal panes of a layout with nothing in it", () => {
    expect(normalizeLayout([0, 0, 0, 0], Array(4).fill(pane()))).toEqual([25, 25, 25, 25]);
    expect(normalizeLayout([Number.NaN, -3], [pane(), pane()])).toEqual([50, 50]);
  });

  it("keeps every pane inside its limits and the total at 100", () => {
    const layout = normalizeLayout([5, 60, 35], [pane({ min: 20 }), pane({ max: 50 }), pane()]);
    expect(layout[0]).toBeGreaterThanOrEqual(20 - 1e-6);
    expect(layout[1]).toBeLessThanOrEqual(50 + 1e-6);
    expect(total(layout)).toBeCloseTo(100, 6);
  });

  it("returns an empty layout for no panes", () => {
    expect(normalizeLayout([], [])).toEqual([]);
  });
});

describe("initialLayout", () => {
  it("uses each pane's default and shares the rest equally among the others", () => {
    expect(initialLayout([20, undefined, undefined], [pane(), pane(), pane()])).toEqual([20, 40, 40]);
  });

  it("splits equally when nothing is specified", () => {
    expect(initialLayout([undefined, undefined, undefined, undefined], Array(4).fill(pane()))).toEqual([25, 25, 25, 25]);
  });

  it("normalises defaults that don't add up", () => {
    expect(total(initialLayout([70, 70], [pane(), pane()]))).toBeCloseTo(100, 6);
  });
});

describe("resizePair", () => {
  const two = [pane({ min: 20, max: 80 }), pane({ min: 20, max: 80 })];

  it("moves the boundary and gives the difference to the neighbour", () => {
    expect(resizePair([50, 50], 0, 60, two)).toEqual([60, 40]);
  });

  it("stops at either pane's limits", () => {
    expect(resizePair([50, 50], 0, 95, two)).toEqual([80, 20]);
    expect(resizePair([50, 50], 0, 1, two)).toEqual([20, 80]);
  });

  it("stops at the neighbour's limit, not only the pane's own", () => {
    expect(resizePair([50, 50], 0, 90, [pane({ max: 100 }), pane({ min: 30 })])).toEqual([70, 30]);
  });

  it("leaves other panes alone", () => {
    const layout = resizePair([25, 25, 50], 0, 35, [pane(), pane(), pane()]);
    expect(layout).toEqual([35, 15, 50]);
  });

  it("returns the same layout for a move that changes nothing, or has no pane to move", () => {
    const layout = [50, 50];
    expect(resizePair(layout, 0, 50, two)).toBe(layout);
    expect(resizePair(layout, 1, 60, two)).toBe(layout);
  });

  it("returns the same layout when no layout can satisfy the limits", () => {
    const layout = [50, 50];
    expect(resizePair(layout, 0, 60, [pane({ min: 60 }), pane({ min: 60 })])).toBe(layout);
  });

  describe("collapsible panes", () => {
    const cs = [pane({ min: 20, collapsible: true, collapsed: 0 }), pane({ min: 20 })];

    it("snaps shut once pulled past halfway to the minimum, and holds at the minimum before that", () => {
      expect(resizePair([30, 70], 0, 12, cs)).toEqual([20, 80]);
      expect(resizePair([30, 70], 0, 9, cs)).toEqual([0, 100]);
    });

    it("snaps back open to the minimum once pulled past halfway", () => {
      expect(resizePair([0, 100], 0, 8, cs)).toEqual([0, 100]);
      expect(resizePair([0, 100], 0, 11, cs)).toEqual([20, 80]);
    });

    it("collapses the pane after the handle too", () => {
      const reversed = [pane({ min: 20 }), pane({ min: 20, collapsible: true })];
      expect(resizePair([70, 30], 0, 95, reversed)).toEqual([100, 0]);
      expect(resizePair([70, 30], 0, 75, reversed)).toEqual([75, 25]);
    });

    it("collapses to a thin strip when the collapsed size isn't zero", () => {
      const strip = [pane({ min: 20, collapsible: true, collapsed: 4 }), pane({ min: 20 })];
      expect(resizePair([30, 70], 0, 5, strip)[0]).toBe(4);
    });

    it("never collapses a pane that isn't collapsible", () => {
      expect(resizePair([30, 70], 0, 0, [pane({ min: 20 }), pane()])[0]).toBe(20);
    });

    it("does not collapse into a neighbour that can't take the space", () => {
      const capped = [pane({ min: 20, collapsible: true }), pane({ min: 20, max: 60 })];
      expect(resizePair([30, 50], 0, 0, capped)[0]).toBeGreaterThanOrEqual(20);
    });
  });
});

describe("pairRange", () => {
  it("is the span the pane before a handle can take", () => {
    expect(pairRange([50, 50], 0, [pane({ min: 20 }), pane({ min: 30 })])).toEqual({ min: 20, max: 70 });
  });

  it("reaches the collapsed size for a collapsible pane, on either side", () => {
    expect(pairRange([50, 50], 0, [pane({ collapsible: true, collapsed: 5 }), pane()]).min).toBe(5);
    expect(pairRange([50, 50], 0, [pane(), pane({ collapsible: true, collapsed: 5 })]).max).toBe(95);
  });

  it("is the whole range with no pane after it", () => {
    expect(pairRange([100], 0, [pane()])).toEqual({ min: 0, max: 100 });
  });
});

describe("togglePane", () => {
  const cs = [pane({ min: 20, collapsible: true }), pane({ min: 20 })];

  it("collapses an open pane into its neighbour", () => {
    expect(togglePane([30, 70], 0, cs, undefined)).toEqual([0, 100]);
  });

  it("opens a collapsed pane at the size it had, or at its minimum", () => {
    expect(togglePane([0, 100], 0, cs, 35)).toEqual([35, 65]);
    expect(togglePane([0, 100], 0, cs, undefined)).toEqual([20, 80]);
  });

  it("uses the neighbour before it for the last pane", () => {
    const last = [pane({ min: 20 }), pane({ min: 20, collapsible: true })];
    expect(togglePane([60, 40], 1, last, undefined)).toEqual([100, 0]);
  });

  it("is null for a pane that can't collapse, or when nothing changes", () => {
    expect(togglePane([50, 50], 1, cs, undefined)).toBeNull();
    expect(togglePane([50], 0, [pane({ collapsible: true })], undefined)).toBeNull();
  });

  it("respects the neighbour's maximum when opening", () => {
    const capped = [pane({ min: 10, collapsible: true }), pane({ min: 10, max: 60 })];
    expect(togglePane([0, 100], 0, capped, undefined)?.[1]).toBeLessThanOrEqual(60);
  });
});

describe("isCollapsed and sameLayout", () => {
  it("counts a pane at its collapsed size as collapsed, only when it can collapse", () => {
    expect(isCollapsed(0, pane({ collapsible: true }))).toBe(true);
    expect(isCollapsed(0.04, pane({ collapsible: true }))).toBe(true);
    expect(isCollapsed(5, pane({ collapsible: true }))).toBe(false);
    expect(isCollapsed(0, pane())).toBe(false);
    expect(isCollapsed(0, undefined)).toBe(false);
  });

  it("compares layouts to within a hair", () => {
    expect(sameLayout([50, 50], [50.00001, 49.99999])).toBe(true);
    expect(sameLayout([50, 50], [51, 49])).toBe(false);
    expect(sameLayout([50, 50], [100])).toBe(false);
  });
});
