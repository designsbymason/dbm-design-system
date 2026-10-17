import { describe, expect, it } from "vitest";
import { headerState, idsBetween, setChosen } from "./DataTable.selection";

describe("headerState", () => {
  it("is true for all, indeterminate for some and false for none or for nothing to choose", () => {
    expect(headerState(new Set(["a", "b"]), ["a", "b"])).toBe(true);
    expect(headerState(new Set(["a"]), ["a", "b"])).toBe("indeterminate");
    expect(headerState(new Set(["z"]), ["a", "b"])).toBe(false);
    expect(headerState(new Set(["a"]), [])).toBe(false);
  });
});

describe("setChosen", () => {
  it("adds ids once, in the order first chosen, and removes them", () => {
    expect(setChosen(["a"], ["b", "a", "c"], true)).toEqual(["a", "b", "c"]);
    expect(setChosen(["a", "b", "c"], ["b"], false)).toEqual(["a", "c"]);
  });
});

describe("idsBetween", () => {
  const ordered = ["a", "b", "c", "d"];
  it("takes the range inclusive, either way round", () => {
    expect(idsBetween(ordered, "b", "d")).toEqual(["b", "c", "d"]);
    expect(idsBetween(ordered, "d", "b")).toEqual(["b", "c", "d"]);
  });
  it("falls back to the clicked id, or nothing, when an end is missing", () => {
    expect(idsBetween(ordered, "x", "c")).toEqual(["c"]);
    expect(idsBetween(ordered, "a", "x")).toEqual([]);
  });
});
