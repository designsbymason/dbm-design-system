#!/usr/bin/env node
/**
 * Per-component bundle-size tripwire for the published `@dbm-design-system/
 * components` package — closes the "remains open" success metric in
 * `01-vision-and-goals.md` §11 ("bundle size per component"), previously
 * tracked nowhere. Same "cheap custom script over a new dependency"
 * approach as `check-storybook-bundle-size.mjs`: this reuses `tsup`
 * (already a real devDependency, the exact bundler the real package build
 * itself uses) rather than adding a bundle-analysis package.
 *
 * What "per-component size" means here: for every top-level export in
 * `src/index.ts` (one per component folder), build a single-entry ESM
 * bundle containing *only* that component — external `react`/`react-dom`
 * (consumers already have these), minified, no code-splitting between
 * entries (each output file is fully self-contained, matching what a
 * consumer who imports *just* this one component actually pays for, the
 * same metric tools like bundlephobia/size-limit report). Gzip size is
 * what's budgeted, since that's what actually crosses the wire.
 *
 * This does NOT run as part of `pnpm build` — it builds its own isolated,
 * throwaway bundles into `dist/.bundle-size-check/` (gitignored via the
 * existing `dist/` rule) and removes that directory when done, regardless
 * of pass/fail. Run standalone (`pnpm check-component-bundle-size`) or in
 * CI after the real `pnpm build` step, for the same narrative-ordering
 * reason `check-foundations-token-coverage` sits there.
 */

import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { build } from "tsup";

/* eslint-disable no-console -- this CLI script's whole job is printing a
   human-readable size report; console.log is the intended output here,
   not debug residue left behind by mistake. */

const PACKAGE_ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC_INDEX = join(PACKAGE_ROOT, "src/index.ts");
const OUT_DIR = join(PACKAGE_ROOT, "dist/.bundle-size-check");

// Deliberately generous headroom over the real baseline measured
// 2026-08-16 (50 components; largest gzipped was Avatar at 1.88KB JS /
// 1.04KB CSS, median well under 1KB for both) — a tripwire for one
// component ballooning (an accidentally-bundled dependency, a lost
// tree-shake), not a tight limit tuned to today's exact numbers. Revisit
// the numbers themselves (not just raise them blindly) if a real,
// justified increase trips this.
const PER_COMPONENT_JS_BUDGET_KB = 10;
const PER_COMPONENT_CSS_BUDGET_KB = 5;

/** Parses `export * from "./atoms/Badge";`-style lines out of src/index.ts. */
function listComponentEntries() {
  const source = readFileSync(SRC_INDEX, "utf8");
  const matches = [...source.matchAll(/^export \* from "\.\/(\w+)\/(\w+)";$/gm)];
  if (matches.length === 0) {
    throw new Error(`No 'export * from "./tier/Name";' lines found in ${SRC_INDEX}.`);
  }
  return matches.map(([, tier, name]) => ({
    name,
    // One name could theoretically collide across tiers (none do today,
    // atoms/molecules/organisms are disjoint) — tsup's `entry` keys must
    // be unique regardless, so this fails loudly via a duplicate-key
    // build error rather than silently overwriting one component's output
    // with another's if that ever changes.
    entryPath: join(PACKAGE_ROOT, "src", tier, name, "index.ts"),
  }));
}

function toKb(bytes) {
  return bytes / 1024;
}

function formatKb(kb) {
  return `${kb.toFixed(2)}KB`;
}

async function buildAllEntries(components) {
  const entry = {};
  for (const { name, entryPath } of components) {
    if (!existsSync(entryPath)) {
      throw new Error(`${name}: expected entry file not found at ${entryPath}`);
    }
    entry[name] = entryPath;
  }

  await build({
    entry,
    format: ["esm"],
    outDir: OUT_DIR,
    dts: false,
    sourcemap: false,
    clean: true,
    minify: true,
    treeshake: true,
    splitting: false,
    external: ["react", "react-dom"],
    loader: { ".css": "local-css" },
    silent: true,
  });
}

function measure(components) {
  const results = [];
  for (const { name } of components) {
    const jsPath = join(OUT_DIR, `${name}.js`);
    const cssPath = join(OUT_DIR, `${name}.css`);
    if (!existsSync(jsPath)) {
      throw new Error(`${name}: expected build output not found at ${jsPath}`);
    }
    const jsRaw = readFileSync(jsPath);
    const jsGzipKb = toKb(gzipSync(jsRaw).byteLength);
    const cssGzipKb = existsSync(cssPath) ? toKb(gzipSync(readFileSync(cssPath)).byteLength) : 0;
    results.push({ name, jsGzipKb, cssGzipKb });
  }
  return results.sort((a, b) => b.jsGzipKb + b.cssGzipKb - (a.jsGzipKb + a.cssGzipKb));
}

async function main() {
  const components = listComponentEntries();
  console.log(`Building ${components.length} isolated per-component bundles...`);
  await buildAllEntries(components);

  const results = measure(components);

  console.log("\nPer-component gzipped size (JS + CSS), largest first:");
  for (const { name, jsGzipKb, cssGzipKb } of results) {
    console.log(
      `  ${name.padEnd(20)} JS ${formatKb(jsGzipKb).padStart(9)}   CSS ${formatKb(cssGzipKb).padStart(9)}`,
    );
  }

  const failures = [];
  for (const { name, jsGzipKb, cssGzipKb } of results) {
    if (jsGzipKb > PER_COMPONENT_JS_BUDGET_KB) {
      failures.push(
        `${name}: JS ${formatKb(jsGzipKb)} exceeds per-component budget ${formatKb(PER_COMPONENT_JS_BUDGET_KB)}.`,
      );
    }
    if (cssGzipKb > PER_COMPONENT_CSS_BUDGET_KB) {
      failures.push(
        `${name}: CSS ${formatKb(cssGzipKb)} exceeds per-component budget ${formatKb(PER_COMPONENT_CSS_BUDGET_KB)}.`,
      );
    }
  }

  rmSync(OUT_DIR, { recursive: true, force: true });

  if (failures.length > 0) {
    console.error("\nComponent bundle size budget exceeded:");
    for (const failure of failures) console.error(`  - ${failure}`);
    console.error(
      "\nIf this growth is real and justified, raise the relevant budget in " +
        "scripts/check-component-bundle-size.mjs with a note explaining why — " +
        "don't just bump the number silently.",
    );
    process.exit(1);
  }

  console.log("\nAll components within budget.");
}

main().catch((error) => {
  rmSync(OUT_DIR, { recursive: true, force: true });
  console.error(error);
  process.exit(1);
});
