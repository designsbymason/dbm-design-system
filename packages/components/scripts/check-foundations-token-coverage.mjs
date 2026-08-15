#!/usr/bin/env node
/**
 * Coverage tripwire for Foundations/Color's "Semantic tokens" section
 * (src/foundations/Color.mdx) — the one Foundations page whose token list
 * is hand-curated rather than self-updating.
 *
 * Every other primitive-token Foundations page (Radius, Spacing, Shadows,
 * Motion, IconSizes) renders its scale by iterating `primitives.*` directly
 * at render time (see e.g. `.storybook/blocks/foundations/RadiusScale.tsx`)
 * — a new step in one of those primitive scales shows up on its doc page
 * for free, nothing to check. Color's *semantic* tokens (`bg.*`/`text.*`/
 * `border.*`/`icon.*`) can't work that way: each entry pairs a token name
 * with a hand-written one-line `usage` description (what the token is
 * *for*), which isn't something a script can author — see
 * `SemanticSwatchGrid`'s `{ token, usage }` shape. So instead of trying to
 * auto-generate that prose, this script enforces that nobody forgets to
 * add it: fails if a semantic token exists in the built `@dbm-design-
 * system/tokens` package but isn't referenced anywhere in Color.mdx (or
 * vice versa — a token documented here that no longer exists, e.g. after a
 * rename). Added 2026-08-16, after `border.danger-subtle` and its three
 * siblings shipped without a Color.mdx entry and had to be caught by hand.
 *
 * Run after `pnpm --filter @dbm-design-system/tokens build`, not as part
 * of it — this only reads the already-built `dist/` output.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { emeraldDark, emeraldLight, purpleDark, purpleLight } from "@dbm-design-system/tokens";

/* eslint-disable no-console -- this CLI script's whole job is printing a
   human-readable coverage report; console.log is the intended output here,
   not debug residue left behind by mistake. */

const PACKAGE_ROOT = fileURLToPath(new URL("..", import.meta.url));
const COLOR_MDX_PATH = new URL("../src/foundations/Color.mdx", import.meta.url);
const COLOR_MDX_RELATIVE = "src/foundations/Color.mdx";

const THEMES = { purpleLight, purpleDark, emeraldLight, emeraldDark };
const SEMANTIC_CATEGORIES = ["bg", "text", "border", "icon"];

/**
 * Every `category.field` semantic token across all four brand/mode
 * themes, unioned rather than read from just one — a token present in
 * only 3 of the 4 themes is itself a real bug (every semantic token must
 * resolve in every brand/mode combination), and unioning surfaces it here
 * too instead of silently using whichever theme happened to be picked as
 * the source of truth.
 */
function collectPackageTokens() {
  const tokens = new Set();
  for (const theme of Object.values(THEMES)) {
    for (const category of SEMANTIC_CATEGORIES) {
      for (const field of Object.keys(theme[category] ?? {})) {
        tokens.add(`${category}.${field}`);
      }
    }
  }
  return tokens;
}

/** Every `token: "..."` string literal referenced anywhere in Color.mdx. */
function collectDocumentedTokens() {
  const source = readFileSync(COLOR_MDX_PATH, "utf8");
  const tokens = new Set();
  for (const match of source.matchAll(/token:\s*"([\w.-]+)"/g)) {
    tokens.add(match[1]);
  }
  return tokens;
}

function main() {
  const packageTokens = collectPackageTokens();
  const documentedTokens = collectDocumentedTokens();

  const missing = [...packageTokens].filter((t) => !documentedTokens.has(t)).sort();
  const stale = [...documentedTokens].filter((t) => !packageTokens.has(t)).sort();

  console.log(
    `Checked ${packageTokens.size} semantic tokens against ${COLOR_MDX_RELATIVE} ` +
      `(${documentedTokens.size} documented).`,
  );

  if (missing.length === 0 && stale.length === 0) {
    console.log("\nFoundations/Color is in sync with the token package.");
    return;
  }

  if (missing.length > 0) {
    console.error(`\n${missing.length} semantic token(s) exist but aren't documented in ${COLOR_MDX_RELATIVE}:`);
    for (const token of missing) console.error(`  - ${token}`);
    console.error(
      "\nAdd each to the matching `<SemanticSwatchGrid tokens={[...]} />` block " +
        "(Background/Text/Border/Icon section) with a one-line `usage` description.",
    );
  }

  if (stale.length > 0) {
    console.error(`\n${stale.length} token(s) are documented in ${COLOR_MDX_RELATIVE} but don't exist in the package:`);
    for (const token of stale) console.error(`  - ${token}`);
    console.error(
      "\nRemove the stale entry, or fix the name if this was a rename — " +
        `check packages/tokens/src/semantic/*.json from ${PACKAGE_ROOT}.`,
    );
  }

  process.exit(1);
}

main();
