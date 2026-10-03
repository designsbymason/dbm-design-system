import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// A story that exists only to run an interaction or measurement check is kept out of the sidebar and the Docs page with
// `tags: ["!dev"]`. Storybook's indexer reads `tags` only from a literal property of the story object, so the tag has to
// be written out on the story itself: a spread (`...shared`) that carries it is invisible to the indexer and the story
// stays visible (found on Toolbar, 2026-10-03). Every story named "… — interaction test" is checked for it.
// (The tests run from the package's own folder.)
const root = join(process.cwd(), "src");

function storiesFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return storiesFiles(path);
    return entry.endsWith(".stories.tsx") ? [path] : [];
  });
}

const offenders: string[] = [];
let checked = 0;
for (const file of storiesFiles(root)) {
  const blocks = readFileSync(file, "utf8").split(/\nexport const /).slice(1);
  for (const block of blocks) {
    if (!/name:\s*"[^"]*interaction test"/.test(block)) continue;
    checked += 1;
    if (!/tags:\s*\[[^\]]*"!dev"[^\]]*\]/.test(block)) offenders.push(`${file.replace(root, "src")} › ${block.slice(0, block.indexOf(":"))}`);
  }
}

describe("hidden interaction-test stories", () => {
  it("finds the stories it is meant to check", () => {
    expect(checked).toBeGreaterThan(10);
  });

  it("carries a literal !dev tag on every one", () => {
    expect(offenders, "add `tags: [\"!dev\"]` directly on each story (not through a spread)").toEqual([]);
  });
});
