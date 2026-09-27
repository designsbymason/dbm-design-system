import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The Docs page's "Design tokens used" table is written by hand, so it can drift from the stylesheet — the
// tone-aware-variants follow-up (2026-09-27) left it missing over a dozen tokens the stylesheet had grown to use.
// This holds the two together for every token the stylesheet declares directly. It can't see the size/weight
// tokens Stat.tsx sets through Icon/Text props rather than a CSS custom property (font-size, icon-size,
// font-weight) — those rows are still hand-verified against Stat.tsx's own size tables.
// (The tests run from the package's own folder.)
const folder = join(process.cwd(), "src/molecules/Stat");
const css = readFileSync(join(folder, "Stat.module.css"), "utf8");
const mdx = readFileSync(join(folder, "Stat.mdx"), "utf8");

/** `--dbm-bg-brand-subtle` -> `bg-brand-subtle`, the way a token row writes it (dots, not dashes). */
const usedTokens = [...new Set([...css.matchAll(/var\(--dbm-([a-z0-9-]+)/g)].map((match) => match[1] as string))];
const listedTokens = new Set([...mdx.matchAll(/<TokenRow token="([^"]+)"/g)].map((match) => (match[1] as string).replace(/\./g, "-")));

describe("Stat's Docs page", () => {
  it("finds the tokens the stylesheet uses, and the rows that list them", () => {
    expect(usedTokens.length).toBeGreaterThan(30);
    expect(listedTokens.size).toBeGreaterThan(30);
  });

  it.each(usedTokens)("lists the token %s in its design-tokens table", (token) => {
    expect(listedTokens.has(token), `add a <TokenRow token="…"> for --dbm-${token}`).toBe(true);
  });
});
