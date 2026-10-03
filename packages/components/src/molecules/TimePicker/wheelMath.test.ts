import { describe, expect, it } from "vitest";
import { copiesFor, middleGlobalIndex, nearestAllowedIndex, nearestGlobalIndex, stepAllowedIndex, wrapIndex } from "./wheelMath";

describe("copiesFor", () => {
  it("is odd, at least three, and long enough to fling through", () => {
    for (const count of [1, 2, 4, 12, 24, 60, 100, 600]) {
      const copies = copiesFor(count);
      expect(copies % 2).toBe(1);
      expect(copies).toBeGreaterThanOrEqual(3);
      expect(copies * count).toBeGreaterThanOrEqual(Math.min(200, 3 * count));
    }
  });

  it("takes few copies of a long list and many of a short one", () => {
    expect(copiesFor(60)).toBe(5);
    expect(copiesFor(24)).toBe(9);
    expect(copiesFor(12)).toBe(17);
    expect(copiesFor(4)).toBe(51);
    expect(copiesFor(0)).toBe(1);
  });
});

describe("wrapIndex", () => {
  it.each([
    [0, 5, 0],
    [4, 5, 4],
    [5, 5, 0],
    [-1, 5, 4],
    [-6, 5, 4],
    [12, 5, 2],
  ])("wraps %i in %i to %i", (index, count, expected) => expect(wrapIndex(index, count)).toBe(expected));
});

describe("nearestAllowedIndex", () => {
  const f = false;
  const t = true;

  it("is the index itself when it is allowed", () => {
    expect(nearestAllowedIndex([t, t, t], 1, true)).toBe(1);
    expect(nearestAllowedIndex([t, t, t], 1, false)).toBe(1);
  });

  it("finds the nearest allowed index either side, a tie going forward", () => {
    expect(nearestAllowedIndex([t, f, f, f, t], 2, false)).toBe(4);
    expect(nearestAllowedIndex([t, f, f, t, t], 2, false)).toBe(3);
    expect(nearestAllowedIndex([t, t, f, f, f], 3, false)).toBe(1);
    expect(nearestAllowedIndex([f, f, t, f, f], 0, false)).toBe(2);
  });

  it("goes the short way round on a wheel that loops", () => {
    // From 0 the nearest allowed is 5 (one step back round), not 2 (two forward).
    expect(nearestAllowedIndex([f, f, t, f, f, t], 0, true)).toBe(5);
    expect(nearestAllowedIndex([f, f, t, f, f, t], 4, true)).toBe(5);
  });

  it("does not cross the ends of a wheel that doesn't loop", () => {
    expect(nearestAllowedIndex([t, f, f, f, f, f], 5, false)).toBe(0);
  });

  it("is undefined when nothing is allowed, or there is nothing", () => {
    expect(nearestAllowedIndex([f, f, f], 1, true)).toBeUndefined();
    expect(nearestAllowedIndex([], 0, true)).toBeUndefined();
  });
});

describe("stepAllowedIndex", () => {
  const f = false;
  const t = true;

  it("steps to the next allowed index, skipping disallowed ones", () => {
    expect(stepAllowedIndex([t, f, f, t], 0, 1, false)).toBe(3);
    expect(stepAllowedIndex([t, f, f, t], 3, -1, false)).toBe(0);
  });

  it("loops past the end on a wheel that loops", () => {
    expect(stepAllowedIndex([t, t, t], 2, 1, true)).toBe(0);
    expect(stepAllowedIndex([t, t, t], 0, -1, true)).toBe(2);
    expect(stepAllowedIndex([t, f, t], 2, 1, true)).toBe(0);
  });

  it("stops at the end of a wheel that doesn't loop", () => {
    expect(stepAllowedIndex([t, t], 1, 1, false)).toBeUndefined();
    expect(stepAllowedIndex([t, t], 0, -1, false)).toBeUndefined();
    expect(stepAllowedIndex([t, f, f], 0, 1, false)).toBeUndefined();
  });

  it("is undefined when it is the only allowed value, even on a loop", () => {
    expect(stepAllowedIndex([f, t, f], 1, 1, true)).toBeUndefined();
    expect(stepAllowedIndex([t], 0, 1, true)).toBeUndefined();
  });
});

describe("nearestGlobalIndex / middleGlobalIndex", () => {
  it("rests in the middle copy", () => {
    expect(middleGlobalIndex(0, 60, 5)).toBe(120);
    expect(middleGlobalIndex(7, 60, 5)).toBe(127);
  });

  it("picks the copy of a value nearest the row now in the middle", () => {
    // 60 values, 5 copies; the middle row is global 118 (value 58 of copy 1). Value 2's nearest copy is the next one.
    expect(nearestGlobalIndex(2, 60, 5, 118)).toBe(122);
    // And value 58 stays where it is.
    expect(nearestGlobalIndex(58, 60, 5, 118)).toBe(118);
    // A value half a wheel away goes whichever way is shorter.
    expect(nearestGlobalIndex(10, 60, 5, 130)).toBe(130);
  });

  it("stays inside the copies", () => {
    expect(nearestGlobalIndex(59, 60, 5, 0)).toBe(59);
    expect(nearestGlobalIndex(0, 60, 5, 299)).toBe(240);
  });
});
