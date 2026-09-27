import { appendFileSync } from "node:fs";
import { it } from "vitest";
import { parseHighlightLines } from "./highlightLines";
const OUT = "/private/tmp/claude-501/-Users-mason-Documents-Projects-dbm-design-system/c1685dfb-bd12-43db-9276-6279a6f240c4/scratchpad/hl-times.txt";
const fams: Array<[string, (n: number) => string[]]> = [
  ["number, blanks, x", (n) => [`9${" ".repeat(n)}x`]],
  ["number, tabs, x", (n) => [`9${"\t".repeat(n)}x`]],
  ["number, blanks, dash, blanks, x", (n) => [`9${" ".repeat(n)}-${" ".repeat(n)}x`]],
  ["blanks only", (n) => [" ".repeat(n)]],
  ["blanks, number, x", (n) => [`${" ".repeat(n)}9x`]],
  ["dashes", (n) => ["-".repeat(n)]],
  ["number and dashes", (n) => [`1${"-".repeat(n)}`]],
  ["digits", (n) => ["9".repeat(n)]],
  ["alternating", (n) => [`1${" -".repeat(n / 2)}x`]],
  ["many entries", (n) => Array.from({ length: n / 4 }, () => " 3 - 9 ")],
];
for (const [name, make] of fams) {
  it(name, () => {
    const row = [6000, 24000].map((n) => { const s = make(n); const t = performance.now(); parseHighlightLines(s); return (performance.now() - t).toFixed(1); });
    appendFileSync(OUT, `${name}: ${row.join("ms  ")}ms\n`);
  }, 15000);
}
