import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The Docs page's "Design tokens used" table is written by hand, so it can drift from the
// stylesheet — the same drift-guard pattern CodeBlock/Stat/DescriptionList established. Holds
// the two together for every token the stylesheet declares directly.
// (The tests run from the package's own folder.)
const folder = join(process.cwd(), "src/molecules/ScrollArea");
const css = readFileSync(join(folder, "ScrollArea.module.css"), "utf8");
const mdx = readFileSync(join(folder, "ScrollArea.mdx"), "utf8");

/** `--dbm-bg-neutral-subtle` -> `bg-neutral-subtle`, the way a token row writes it (dots, not dashes). */
const usedTokens = [...new Set([...css.matchAll(/var\(--dbm-([a-z0-9-]+)/g)].map((match) => match[1] as string))];
const listedTokens = new Set([...mdx.matchAll(/<TokenRow token="([^"]+)"/g)].map((match) => (match[1] as string).replace(/\./g, "-")));

describe("ScrollArea's Docs page", () => {
  it("finds the tokens the stylesheet uses, and the rows that list them", () => {
    expect(usedTokens.length).toBeGreaterThan(10);
    expect(listedTokens.size).toBeGreaterThan(10);
  });

  it.each(usedTokens)("lists the token %s in its design-tokens table", (token) => {
    expect(listedTokens.has(token), `add a <TokenRow token="…"> for --dbm-${token}`).toBe(true);
  });
});
