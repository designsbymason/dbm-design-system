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

// (Sizes are for a production build: see `define` below, and 06-engineering-standards.md.)
// Deliberately generous headroom over the real baseline measured
// 2026-08-16 (50 components; largest gzipped was Avatar at 1.88KB JS /
// 1.04KB CSS, median well under 1KB for both) — a tripwire for one
// component ballooning (an accidentally-bundled dependency, a lost
// tree-shake), not a tight limit tuned to today's exact numbers. Revisit
// the numbers themselves (not just raise them blindly) if a real,
// justified increase trips this.
const PER_COMPONENT_JS_BUDGET_KB = 10;
const PER_COMPONENT_CSS_BUDGET_KB = 5;

// A component whose bundle legitimately holds other components gets its own JS budget, with the reason beside it. Not a way
// to excuse growth: the default stands for every other component, and an override is sized to the measured number plus a
// little headroom, so it still trips if the component balloons.
//   TimeRangePicker (2026-10-03): composes two `TimePicker`s (8.0KB on their own, wheels included) and adds the shared
//   popover (`Popover`, `IconButton`, a second set of wheels), 10.58KB measured.
//   Calendar (2026-10-05): the one month grid the date pickers will be built on, so it holds what they would otherwise each
//   carry: the month, year and week grids, several months side by side, the month and year fields (it imports `Select`),
//   range and multiple-date choosing with drag, the footer, the markers, week numbers and the key. 9.01KB before the year
//   and month views and the week mode, 10.26KB measured with them (10.54KB after the final review). Sized at the user's direction
//   (2026-10-05) to about 12KB.
const JS_BUDGET_OVERRIDES_KB = { Calendar: 12, TimeRangePicker: 12 };

// Words only an opt-in extra's code contains, and the component whose bundle must not contain them: `CodeBlock`
// ships Python, Go and Java as separate exports an app registers (ADR-0027). If a change makes the component
// import one, its bundle grows for every app whatever language it uses, and this says so before the byte budget
// (which it could still fit inside) does.
const MUST_NOT_CONTAIN = {
  CodeBlock: {
    nonlocal: "the Python grammar",
    fallthrough: "the Go grammar",
    strictfp: "the Java grammar",
    // A name only the development-only opt-in list holds: it must be gone from a production build.
    pgsql: "the opt-in language name list (development only)",
  },
};

/**
 * Parses `export * from "./atoms/Badge";`-style lines out of src/index.ts. A third segment
 * (`"./molecules/CodeBlock/languages"`) names a file beside the component's own `index.ts`: an optional extra a
 * consumer opts into, measured on its own so the component's number doesn't include it.
 */
function listComponentEntries() {
  const source = readFileSync(SRC_INDEX, "utf8");
  const matches = [...source.matchAll(/^export \* from "\.\/(\w+)\/(\w+)(?:\/(\w+))?";$/gm)];
  if (matches.length === 0) {
    throw new Error(`No 'export * from "./tier/Name";' lines found in ${SRC_INDEX}.`);
  }
  return matches.map(([, tier, name, extra]) => ({
    name: extra ? `${name}/${extra}` : name,
    // One name could theoretically collide across tiers (none do today,
    // atoms/molecules/organisms are disjoint) — tsup's `entry` keys must
    // be unique regardless, so this fails loudly via a duplicate-key
    // build error rather than silently overwriting one component's output
    // with another's if that ever changes.
    entryPath: join(PACKAGE_ROOT, "src", tier, name, extra ? `${extra}.ts` : "index.ts"),
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
    // Measured as an app's production build ships it: development-only code (warnings, the opt-in language
    // names behind them) is dropped there, and counting it would overstate what a consumer pays for.
    define: { "process.env.NODE_ENV": '"production"' },
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
    const jsBudgetKb = JS_BUDGET_OVERRIDES_KB[name] ?? PER_COMPONENT_JS_BUDGET_KB;
    if (jsGzipKb > jsBudgetKb) {
      failures.push(`${name}: JS ${formatKb(jsGzipKb)} exceeds per-component budget ${formatKb(jsBudgetKb)}.`);
    }
    if (cssGzipKb > PER_COMPONENT_CSS_BUDGET_KB) {
      failures.push(
        `${name}: CSS ${formatKb(cssGzipKb)} exceeds per-component budget ${formatKb(PER_COMPONENT_CSS_BUDGET_KB)}.`,
      );
    }
  }

  for (const [name, markers] of Object.entries(MUST_NOT_CONTAIN)) {
    const js = readFileSync(join(OUT_DIR, `${name}.js`), "utf8");
    for (const [marker, what] of Object.entries(markers)) {
      if (js.includes(marker)) failures.push(`${name}: its bundle contains ${what}, which should not be in it.`);
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
