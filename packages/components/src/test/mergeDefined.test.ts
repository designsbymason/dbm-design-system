import { mergeDefined } from "@dbm-design-system/primitives";
import { describe, expect, it } from "vitest";

describe("mergeDefined", () => {
  const defaults = { a: "one", b: (n: number) => `two ${n}`, c: "three" };

  it("returns the defaults when there are no overrides", () => {
    expect(mergeDefined(defaults)).toEqual(defaults);
    expect(mergeDefined(defaults, undefined)).toEqual(defaults);
    expect(mergeDefined(defaults, {})).toEqual(defaults);
  });

  it("lets an override replace a default", () => {
    const merged = mergeDefined(defaults, { a: "uno" });
    expect(merged.a).toBe("uno");
    expect(merged.c).toBe("three");
  });

  it("keeps a default whose override is undefined", () => {
    const merged = mergeDefined(defaults, { a: undefined, b: undefined });
    expect(merged.a).toBe("one");
    expect(merged.b(2)).toBe("two 2");
  });

  it("keeps an override that is falsy but defined", () => {
    expect(mergeDefined({ a: "one" }, { a: "" }).a).toBe("");
  });

  it("does not change its inputs", () => {
    const overrides = { a: "uno" };
    mergeDefined(defaults, overrides);
    expect(defaults.a).toBe("one");
    expect(overrides).toEqual({ a: "uno" });
  });
});
