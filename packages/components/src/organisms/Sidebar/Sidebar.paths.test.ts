import { createElement, Fragment } from "react";
import { describe, expect, it } from "vitest";
import { holdsPath, matchesPath, pathOf, rolledUpCount } from "./Sidebar.paths";

describe("pathOf", () => {
  it("reads the path of an address, without its query, hash or trailing slash", () => {
    expect(pathOf("/reports/sales")).toBe("/reports/sales");
    expect(pathOf("/reports/sales/")).toBe("/reports/sales");
    expect(pathOf("/reports/sales?tab=2#top")).toBe("/reports/sales");
    expect(pathOf("/")).toBe("/");
    expect(pathOf("//")).toBeNull();
  });

  it("has no path for an address on another site, or with only a hash or a query", () => {
    expect(pathOf("https://example.com/a")).toBeNull();
    expect(pathOf("//cdn.example.com/a")).toBeNull();
    expect(pathOf("mailto:a@example.com")).toBeNull();
    expect(pathOf("#top")).toBeNull();
    expect(pathOf("?tab=2")).toBeNull();
    expect(pathOf(undefined)).toBeNull();
  });
});

describe("matchesPath", () => {
  it("matches the same path exactly, ignoring query, hash and a trailing slash", () => {
    expect(matchesPath("/reports", "/reports")).toBe(true);
    expect(matchesPath("/reports/", "/reports?x=1")).toBe(true);
    expect(matchesPath("/reports", "/reports/sales")).toBe(false);
    expect(matchesPath("/reports/sales", "/reports")).toBe(false);
  });

  it("matches the pages below it at a segment boundary with prefix, and never the root's children", () => {
    expect(matchesPath("/reports", "/reports/sales", "prefix")).toBe(true);
    expect(matchesPath("/reports", "/reports", "prefix")).toBe(true);
    expect(matchesPath("/reports", "/reportsx", "prefix")).toBe(false);
    expect(matchesPath("/", "/reports", "prefix")).toBe(false);
    expect(matchesPath("/", "/", "prefix")).toBe(true);
  });

  it("is false with no href, no path or an address on another site", () => {
    expect(matchesPath(undefined, "/a")).toBe(false);
    expect(matchesPath("/a", undefined)).toBe(false);
    expect(matchesPath("https://example.com/a", "/a")).toBe(false);
  });
});

describe("holdsPath", () => {
  const item = (href: string, extra: object = {}) => createElement("a", { key: href, href, ...extra }, href);

  it("finds an item among nested children, through fragments", () => {
    const tree = [createElement("li", { key: "g" }, createElement(Fragment, null, item("/a"), createElement("ul", null, item("/b"))))];
    expect(holdsPath(tree, "/b")).toBe(true);
    expect(holdsPath(tree, "/c")).toBe(false);
  });

  it("follows each item's own match and current", () => {
    expect(holdsPath(item("/reports", { match: "prefix" }), "/reports/sales")).toBe(true);
    expect(holdsPath(item("/reports"), "/reports/sales")).toBe(false);
    expect(holdsPath(item("/a", { current: false }), "/a")).toBe(false);
    expect(holdsPath(createElement("div", { current: true }), "/zzz")).toBe(true);
  });

  it("holds nothing with no path", () => {
    expect(holdsPath(item("/a"), undefined)).toBe(false);
  });
});

describe("rolledUpCount", () => {
  const item = (badge?: unknown, key?: string) => createElement("li", { badge, key });
  const group = (...children: unknown[]) => createElement("section", null, ...(children as never[]));

  it("adds the numeric badges of the items written inside, through groups and fragments", () => {
    const tree = createElement(
      Fragment,
      null,
      item(3, "a"),
      group(item(4, "b"), item(undefined, "c")),
      createElement(Fragment, { key: "d" }, item(5)),
    );
    expect(rolledUpCount(tree)).toBe(12);
  });

  it("ignores badges that are not numbers, and is undefined when there is no number", () => {
    expect(rolledUpCount(item("New"))).toBeUndefined();
    expect(rolledUpCount(item())).toBeUndefined();
    expect(rolledUpCount(null)).toBeUndefined();
    expect(rolledUpCount([item(2, "a"), item("New", "b")])).toBe(2);
  });

  it("counts a zero, which the group then leaves unshown", () => {
    expect(rolledUpCount(item(0))).toBe(0);
  });
});
