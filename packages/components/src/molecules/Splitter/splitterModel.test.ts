import { describe, expect, it } from "vitest";
import {
  type PaneConstraints,
  adaptLayout,
  initialLayout,
  isCollapsed,
  normalizeLayout,
  pairRange,
  rescaleForContainer,
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

describe("adaptLayout", () => {
  const three = [pane(), pane(), pane()];

  it("keeps the panes that are still there at their size, and shares out what a removed one freed", () => {
    // A 20 / B 30 / C 50; B goes: A and C keep their proportions and fill the whole.
    const layout = adaptLayout([20, 30, 50], ["a", "b", "c"], ["a", "c"], [undefined, undefined], [pane(), pane()]);
    expect(layout[0]).toBeCloseTo((20 / 70) * 100, 4);
    expect(layout[1]).toBeCloseTo((50 / 70) * 100, 4);
  });

  it("gives a new pane its own default and scales the others to make room", () => {
    const layout = adaptLayout([40, 60], ["a", "b"], ["a", "b", "c"], [undefined, undefined, 20], three);
    expect(layout[2]).toBeCloseTo(20 / 1.2, 4);
    expect(total(layout)).toBeCloseTo(100, 6);
    expect(layout[0]! / layout[1]!).toBeCloseTo(40 / 60, 4);
  });

  it("makes room for a new pane that has no default, at least its minimum", () => {
    const layout = adaptLayout([50, 50], ["a", "b"], ["a", "b", "c"], [undefined, undefined, undefined], three);
    expect(layout[2]).toBeGreaterThanOrEqual(10 - 1e-6);
    expect(total(layout)).toBeCloseTo(100, 6);
  });

  it("keeps a collapsed pane collapsed, rather than lifting it to its minimum", () => {
    const cs = [pane({ min: 10, collapsible: true }), pane(), pane()];
    const layout = adaptLayout([0, 40, 60], ["a", "b", "c"], ["a", "b"], [undefined, undefined], cs.slice(0, 2));
    expect(layout[0]).toBe(0);
    expect(layout[1]).toBeCloseTo(100, 6);
  });

  it("follows a pane to its new place", () => {
    const layout = adaptLayout([20, 30, 50], ["a", "b", "c"], ["c", "a", "b"], [undefined, undefined, undefined], three);
    expect(layout).toEqual([50, 20, 30]);
  });
});

describe("rescaleForContainer", () => {
  const cs = [pane({ min: 0 }), pane({ min: 0 }), pane({ min: 0 })];

  it("keeps a fixed pane's length and lets the others share the rest, when the container shrinks", () => {
    // 1000px: [20, 40, 40] -> 500px: the 200px pane is now 40%; the others share the other 60% as they were.
    const layout = rescaleForContainer([20, 40, 40], cs, [true, false, false], 1000 / 500);
    expect(layout[0]).toBeCloseTo(40, 4);
    expect(layout[1]).toBeCloseTo(30, 4);
    expect(layout[2]).toBeCloseTo(30, 4);
  });

  it("and when it grows", () => {
    const layout = rescaleForContainer([40, 30, 30], cs, [true, false, false], 500 / 1000);
    expect(layout[0]).toBeCloseTo(20, 4);
    expect(total(layout)).toBeCloseTo(100, 6);
    expect(layout[1]! / layout[2]!).toBeCloseTo(1, 4);
  });

  it("keeps the proportions among the flexible panes", () => {
    const layout = rescaleForContainer([20, 20, 60], cs, [true, false, false], 2);
    expect(layout[1]! / layout[2]!).toBeCloseTo(20 / 60, 4);
  });

  it("holds a fixed pane inside its own limits", () => {
    const limited = [pane({ min: 0, max: 30 }), pane({ min: 0 })];
    expect(rescaleForContainer([20, 80], limited, [true, false], 3)[0]).toBe(30);
  });

  it("holds a collapsed pane at its collapsed size, fixed or not", () => {
    const cc = [pane({ min: 10, collapsible: true, collapsed: 5 }), pane({ min: 0 })];
    expect(rescaleForContainer([5, 95], cc, [false, false], 2)[0]).toBe(5);
  });

  it("scales everything proportionally when the fixed panes alone fill the container", () => {
    const layout = rescaleForContainer([60, 40], [pane({ min: 0 }), pane({ min: 0 })], [true, true], 3);
    expect(total(layout)).toBeCloseTo(100, 6);
  });

  it("changes nothing when no pane is fixed and the ratio is 1", () => {
    expect(rescaleForContainer([30, 70], [pane(), pane()], [false, false], 1)).toEqual([30, 70]);
  });
});
