import { describe, expect, it } from "vitest";
import { fitCount } from "./fitCount";

describe("fitCount", () => {
  it("shows all of them when they fit without the button", () => {
    expect(fitCount([40, 40, 40], 60, 140, 8)).toBe(3);
    expect(fitCount([40, 40, 40], 60, 136, 8)).toBe(3);
  });

  it("leaves room for the button when some do not fit", () => {
    // All four need 40 × 4 + 24 = 184. Two with the button need 88 + 8 + 60 = 156; three need 196.
    expect(fitCount([40, 40, 40, 40], 60, 170, 8)).toBe(2);
    expect(fitCount([40, 40, 40, 40], 60, 120, 8)).toBe(1);
  });

  it("counts the gaps between chips and before the button", () => {
    // All four need 52. Two with the button need 20 + 4 + 4 + 20 = 48.
    expect(fitCount([10, 10, 10, 10], 20, 50, 4)).toBe(2);
    expect(fitCount([10, 10, 10, 10], 20, 47, 4)).toBe(1);
  });

  it("shows only the count when not even one chip fits beside the button, but the button fits", () => {
    expect(fitCount([100, 100], 80, 90, 8)).toBe(0);
  });

  it("keeps one chip, cut, when the button does not fit either", () => {
    expect(fitCount([100, 100], 80, 60, 8)).toBe(1);
  });

  it("has nothing to show for an empty row", () => {
    expect(fitCount([], 60, 200, 8)).toBe(0);
  });

  it("treats a chip wider than the row as the row's width", () => {
    expect(fitCount([500], 60, 200, 8)).toBe(1);
    // Beside the button it would fill the row, so only the count is shown.
    expect(fitCount([500, 20], 60, 200, 8)).toBe(0);
  });

  it("reads a row with no room at all as one chip", () => {
    expect(fitCount([30, 30, 30], 40, 0, 8)).toBe(1);
  });
});
