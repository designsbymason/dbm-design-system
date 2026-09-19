import ts from "typescript";
import { describe, expect, it } from "vitest";
import * as library from "./index";
import { accordionPlaygroundSnippet } from "./molecules/Accordion/Accordion.snippets";
import { cardPlaygroundSnippet } from "./molecules/Card/Card.snippets";
import { gridPlaygroundSnippet } from "./molecules/Grid/Grid.snippets";
import { listPlaygroundSnippet } from "./molecules/List/List.snippets";
import { popoverPlaygroundSnippet } from "./molecules/Popover/Popover.snippets";
import { tablePlaygroundSnippet } from "./molecules/Table/Table.snippets";

// Guards the code shown under "Show code" on Docs pages
// (`07-storybook-and-documentation-standards.md` §4.2). A story's own source is
// the story object plus demo-only helpers, which nobody can paste anywhere, so a
// component's stories point `parameters.docs.source.code` at hand-written
// snippets in a `*.snippets.ts` file next to them. Every such file is picked up
// here automatically: a snippet must be valid TSX, use only components the
// package really exports (and only sub-parts that really exist), and carry no
// demo scaffolding or internal references. Prop names and values aren't checked
// here — the snippets are typechecked against the real components when they're
// written or changed.

const banned: Array<[RegExp, string]> = [
  [/\bDemo\w*/, "a demo-only helper component"],
  [/\bWideTable\b/, "a demo-only helper component"],
  [/\bnoControls\b|\bargTypes\b|\brender:/, "story-object scaffolding"],
  [/\bgridStyle\b|\bdemoContainerStyle\b|\ballTones\b|\ballVariants\b|\ballSizes\b|\bwideRows\b/, "a stories-file constant"],
  [/\.map\(/, "a loop — write the elements out"],
  [/preventDefault|data-testid|onActivate/, "test or demo wiring"],
  [/guidelines\/|\.md\b|\bADR-\d/, "a reference to an internal document"],
];

function problemsIn(code: string): string[] {
  const problems: string[] = [];
  if (!code.trim()) return ["is empty"];

  for (const [pattern, what] of banned) {
    const match = code.match(pattern);
    if (match) problems.push(`contains ${what} ("${match[0]}")`);
  }

  // A snippet is one or more JSX elements (and comments), so wrap it in a
  // fragment to parse it as an expression.
  const wrapped = `const snippet = (<>\n${code}\n</>);`;
  const transpiled = ts.transpileModule(wrapped, {
    fileName: "snippet.tsx",
    reportDiagnostics: true,
    compilerOptions: { jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ESNext },
  });
  for (const diagnostic of transpiled.diagnostics ?? []) {
    problems.push(`is not valid TSX: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`);
  }

  const exported = library as unknown as Record<string, Record<string, unknown> | undefined>;
  const source = ts.createSourceFile("snippet.tsx", wrapped, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const visit = (node: ts.Node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(source);
      const [root, ...path] = tag.split(".");
      // Lower-case tags are plain HTML elements; everything else must be real.
      if (root && /^[A-Z]/.test(root)) {
        let target: unknown = exported[root];
        if (target === undefined) problems.push(`uses <${tag}>, which the package doesn't export`);
        else {
          for (const member of path) {
            target = (target as Record<string, unknown> | undefined)?.[member];
            if (target === undefined) problems.push(`uses <${tag}>, which doesn't exist`);
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);

  return problems;
}

// Vite replaces `import.meta.glob` at build time; this repo's tsconfig doesn't load
// Vite's own client types, so declare the one overload used here.
declare global {
  interface ImportMeta {
    glob<T = unknown>(pattern: string, options: { eager: true }): Record<string, T>;
  }
}

// Every `*.snippets.ts` file's exported records of named snippets.
const snippetModules = import.meta.glob<Record<string, unknown>>("./**/*.snippets.ts", { eager: true });

const namedSnippets: Array<[string, string]> = [];
for (const [file, module] of Object.entries(snippetModules)) {
  for (const [exportName, value] of Object.entries(module)) {
    if (typeof value !== "object" || value === null) continue;
    for (const [key, code] of Object.entries(value)) {
      if (typeof code === "string") namedSnippets.push([`${file} › ${exportName}.${key}`, code]);
    }
  }
}

describe("story snippets", () => {
  it("finds the snippet files", () => {
    expect(Object.keys(snippetModules).length).toBeGreaterThanOrEqual(6);
    expect(namedSnippets.length).toBeGreaterThan(60);
  });

  it.each(namedSnippets)("%s is a real, pasteable snippet", (_name, code) => {
    expect(problemsIn(code)).toEqual([]);
  });

  describe("the checker itself", () => {
    it("rejects a demo helper, a loop, and an internal reference", () => {
      expect(problemsIn("<DemoCard />").length).toBeGreaterThan(0);
      expect(problemsIn("{items.map((item) => <Card key={item}>x</Card>)}").length).toBeGreaterThan(0);
      expect(problemsIn("{/* see guidelines/04-component-inventory.md */}\n<Card>x</Card>").length).toBeGreaterThan(0);
    });

    it("rejects a component or sub-part that doesn't exist", () => {
      expect(problemsIn("<NotAComponent />")).toEqual(["uses <NotAComponent>, which the package doesn't export"]);
      expect(problemsIn("<Card><Card.Sidebar /></Card>")).toEqual(["uses <Card.Sidebar>, which doesn't exist"]);
    });

    it("rejects invalid TSX", () => {
      expect(problemsIn("<Card>").length).toBeGreaterThan(0);
    });

    it("accepts a comment followed by real markup", () => {
      expect(problemsIn('{/* a note */}\n<Card variant="elevated"><Card.Body>x</Card.Body></Card>')).toEqual([]);
    });
  });
});

describe("Playground snippets, built from the live controls", () => {
  const cardArgs = [
    {},
    { variant: "elevated", tone: "success", size: "lg", divided: true },
    { media: true, orientation: "horizontal", mediaPosition: "end" },
    { media: true, mediaPosition: "start" },
    { interactive: true, disabled: true, media: true, variant: "filled" },
    { disabled: true }, // `disabled` means nothing without `interactive`, so it isn't written
  ] as const;

  it.each(cardArgs)("Card %j is a real snippet", (args) => {
    expect(problemsIn(cardPlaygroundSnippet(args))).toEqual([]);
  });

  it("Card writes only what differs from the defaults", () => {
    expect(cardPlaygroundSnippet({ variant: "outlined", tone: "neutral", size: "md", orientation: "vertical" })).toMatch(
      /^<Card>\n/,
    );
    expect(cardPlaygroundSnippet({ variant: "elevated", divided: true })).toMatch(/^<Card variant="elevated" divided>\n/);
    expect(cardPlaygroundSnippet({ disabled: true })).toMatch(/^<Card>\n/);
  });

  it("Card shows an interactive card as the link it has to be", () => {
    const snippet = cardPlaygroundSnippet({ interactive: true, media: true });
    expect(snippet).toMatch(/^<Card asChild interactive>\n {2}<a href=/);
    expect(snippet).toContain("<Card.Media>");
  });

  it("Card puts the media first, and only writes mediaPosition for `end`", () => {
    expect(cardPlaygroundSnippet({ media: true, mediaPosition: "start" })).not.toContain("mediaPosition");
    expect(cardPlaygroundSnippet({ media: true, mediaPosition: "end" })).toContain('mediaPosition="end"');
    expect(cardPlaygroundSnippet({ media: false })).not.toContain("Card.Media");
  });

  const tableArgs = [
    {},
    { variant: "ghost", tone: "brand", size: "sm", striped: true, hoverable: true },
    { stickyHeader: true, maxHeight: "12rem" },
    { stickyFirstColumn: true, stickyLastColumn: true },
  ] as const;

  it.each(tableArgs)("Table %j is a real snippet", (args) => {
    expect(problemsIn(tablePlaygroundSnippet(args))).toEqual([]);
  });

  it("Table writes only what differs from the defaults", () => {
    expect(tablePlaygroundSnippet({ variant: "bordered", tone: "neutral", size: "md", maxHeight: "" })).toMatch(
      /^<Table aria-label="Recent invoices">\n/,
    );
    expect(tablePlaygroundSnippet({ striped: true, maxHeight: "16rem" })).toMatch(
      /^<Table striped maxHeight="16rem" aria-label="Recent invoices">\n/,
    );
  });
});

describe("Playground snippets for Accordion, Popover, Grid and List", () => {
  const accordionArgs = [
    {},
    { type: "single", collapsible: false, defaultValue: "returns", variant: "ghost", size: "lg" },
    { type: "multiple", defaultValue: "shipping", disabled: true, orientation: "horizontal", headingLevel: 4 },
    { type: "multiple", defaultValue: "" },
  ] as const;

  it.each(accordionArgs)("Accordion %j is a real snippet", (args) => {
    expect(problemsIn(accordionPlaygroundSnippet(args))).toEqual([]);
  });

  it("Accordion writes only what differs from the defaults", () => {
    expect(
      accordionPlaygroundSnippet({ type: "single", variant: "bordered", size: "md", collapsible: true, headingLevel: 3 }),
    ).toMatch(/^<Accordion>\n/);
    expect(accordionPlaygroundSnippet({ type: "single", defaultValue: "shipping", size: "sm" })).toMatch(
      /^<Accordion defaultValue="shipping" size="sm">\n/,
    );
    // Under `type="multiple"` the single control value becomes a one-element array.
    expect(accordionPlaygroundSnippet({ type: "multiple", defaultValue: "shipping" })).toMatch(
      /^<Accordion type="multiple" defaultValue=\{\["shipping"\]\}>\n/,
    );
  });

  const popoverArgs = [
    {},
    { defaultOpen: true, modal: true, side: "top", align: "start", sideOffset: 12, alignOffset: 4 },
    { avoidCollisions: false, collisionPadding: 16, hideWhenDetached: true, hideArrow: true, showCloseButton: true },
  ] as const;

  it.each(popoverArgs)("Popover %j is a real snippet", (args) => {
    expect(problemsIn(popoverPlaygroundSnippet(args))).toEqual([]);
  });

  it("Popover writes only what differs from the defaults", () => {
    const plain = popoverPlaygroundSnippet({ side: "bottom", align: "center", sideOffset: 8, alignOffset: 0, avoidCollisions: true, collisionPadding: 8 });
    expect(plain).toMatch(/^<Popover>\n/);
    expect(plain).toContain('<Popover.Content aria-label="Example popover">');
    expect(popoverPlaygroundSnippet({ hideArrow: true })).toContain('<Popover.Content hideArrow aria-label="Example popover">');
    expect(popoverPlaygroundSnippet({ modal: true, defaultOpen: true })).toMatch(/^<Popover defaultOpen modal>\n/);
  });

  const gridArgs = [
    {},
    { columns: 3, gap: 4, autoFlow: "row", autoRows: "", justifyItems: "start", alignItems: "center", alignContent: "start" },
    { columns: 12, minChildWidth: "8rem", autoRows: "5rem", autoColumns: "1fr", justifyContent: "between", autoFlow: "row dense" },
  ] as const;

  it.each(gridArgs)("Grid %j is a real snippet", (args) => {
    expect(problemsIn(gridPlaygroundSnippet(args))).toEqual([]);
  });

  it("Grid writes only what differs from the defaults, and always the 6rem row height the Playground shows", () => {
    expect(gridPlaygroundSnippet({ columns: 12, gap: 0, autoFlow: "row" })).toMatch(/^<Grid autoRows="6rem">\n/);
    expect(gridPlaygroundSnippet({ columns: 3, gap: 4 })).toMatch(/^<Grid columns=\{3\} gap=\{4\} autoRows="6rem">\n/);
  });

  const listArgs = [
    {},
    { as: "ol", marker: "decimal", spacing: 2, start: "" },
    { as: "ol", start: "5", reversed: true, type: "A", spacing: 6 },
    { as: "ul", marker: "none" },
    // `start`, `reversed`, and `type` only mean something on an <ol>.
    { as: "ul", marker: "disc", start: "5", reversed: true, type: "A" },
  ] as const;

  it.each(listArgs)("List %j is a real snippet", (args) => {
    expect(problemsIn(listPlaygroundSnippet(args))).toEqual([]);
  });

  it("List writes only what differs from the defaults, and the ol-only props only on an ol", () => {
    expect(listPlaygroundSnippet({ as: "ul", marker: "disc", spacing: 2 })).toMatch(/^<List>\n/);
    expect(listPlaygroundSnippet({ as: "ol", marker: "decimal" })).toMatch(/^<List as="ol">\n/);
    expect(listPlaygroundSnippet({ as: "ol", start: "5", reversed: true, type: "A" })).toMatch(
      /^<List as="ol" start=\{5\} reversed type="A">\n/,
    );
    expect(listPlaygroundSnippet({ as: "ul", start: "5", reversed: true, type: "A" })).toMatch(/^<List>\n/);
  });
});
