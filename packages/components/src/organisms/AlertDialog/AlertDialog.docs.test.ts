import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The Docs page's "Design tokens used" table is written by hand, so it can drift from the stylesheets. An alert is
// drawn with its own small module plus Dialog's (it imports it), so the page lists the tokens of both. A row may
// name several tokens, separated by " / ". (The tests run from the package's own folder.)
const read = (file: string) => readFileSync(join(process.cwd(), "src/organisms", file), "utf8");
const css = `${read("AlertDialog/AlertDialog.module.css")}\n${read("Dialog/Dialog.module.css")}`;
const mdx = read("AlertDialog/AlertDialog.mdx");

const usedTokens = [...new Set([...css.matchAll(/var\(--dbm-([a-z0-9-]+)/g)].map((match) => match[1] as string))];
const listedTokens = new Set(
  [...mdx.matchAll(/<TokenRow token="([^"]+)"/g)].flatMap((match) =>
    (match[1] as string).split("/").map((token) => token.trim().replace(/\./g, "-")),
  ),
);

describe("AlertDialog's Docs page", () => {
  it("finds the tokens the stylesheets use, and the rows that list them", () => {
    expect(usedTokens.length).toBeGreaterThan(20);
    expect(listedTokens.size).toBeGreaterThan(20);
  });

  it.each(usedTokens)("lists the token %s in its design-tokens table", (token) => {
    expect(listedTokens.has(token), `add a <TokenRow token="…"> for --dbm-${token}`).toBe(true);
  });

  it("does not list a token neither stylesheet uses", () => {
    const used = new Set(usedTokens);
    expect([...listedTokens].filter((token) => !used.has(token))).toEqual([]);
  });
});
