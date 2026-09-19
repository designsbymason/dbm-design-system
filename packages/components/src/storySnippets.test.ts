import ts from "typescript";
import { describe, expect, it } from "vitest";
import * as library from "./index";
import { avatarPlaygroundSnippet } from "./atoms/Avatar/Avatar.snippets";
import { badgePlaygroundSnippet } from "./atoms/Badge/Badge.snippets";
import { progressBarPlaygroundSnippet } from "./atoms/ProgressBar/ProgressBar.snippets";
import { progressCirclePlaygroundSnippet } from "./atoms/ProgressCircle/ProgressCircle.snippets";
import { skeletonPlaygroundSnippet } from "./atoms/Skeleton/Skeleton.snippets";
import { spinnerPlaygroundSnippet } from "./atoms/Spinner/Spinner.snippets";
import { tagPlaygroundSnippet } from "./atoms/Tag/Tag.snippets";
import { accordionPlaygroundSnippet } from "./molecules/Accordion/Accordion.snippets";
import { cardPlaygroundSnippet } from "./molecules/Card/Card.snippets";
import { checkboxGroupPlaygroundSnippet } from "./molecules/CheckboxGroup/CheckboxGroup.snippets";
import { formFieldPlaygroundSnippet } from "./molecules/FormField/FormField.snippets";
import { gridPlaygroundSnippet } from "./molecules/Grid/Grid.snippets";
import { listPlaygroundSnippet } from "./molecules/List/List.snippets";
import { numberInputPlaygroundSnippet } from "./molecules/NumberInput/NumberInput.snippets";
import { passwordInputPlaygroundSnippet } from "./molecules/PasswordInput/PasswordInput.snippets";
import { popoverPlaygroundSnippet } from "./molecules/Popover/Popover.snippets";
import { radioGroupPlaygroundSnippet } from "./molecules/RadioGroup/RadioGroup.snippets";
import { searchInputPlaygroundSnippet } from "./molecules/SearchInput/SearchInput.snippets";
import { selectPlaygroundSnippet } from "./molecules/Select/Select.snippets";
import { sliderPlaygroundSnippet } from "./molecules/Slider/Slider.snippets";
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
  // A loop over a stories-file constant (`allTones.map(…)`) is caught by the constants
  // above; a `.map(` over the reader's own state is real usage and is allowed.
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
    expect(Object.keys(snippetModules).length).toBeGreaterThanOrEqual(21);
    expect(namedSnippets.length).toBeGreaterThan(130);
  });

  it.each(namedSnippets)("%s is a real, pasteable snippet", (_name, code) => {
    expect(problemsIn(code)).toEqual([]);
  });

  describe("the checker itself", () => {
    it("rejects a demo helper, a loop over a demo constant, and an internal reference", () => {
      expect(problemsIn("<DemoCard />").length).toBeGreaterThan(0);
      expect(problemsIn("{allTones.map((tone) => <Card key={tone}>x</Card>)}").length).toBeGreaterThan(0);
      expect(problemsIn("{/* see guidelines/04-component-inventory.md */}\n<Card>x</Card>").length).toBeGreaterThan(0);
    });

    it("rejects a component or sub-part that doesn't exist", () => {
      expect(problemsIn("<NotAComponent />")).toEqual(["uses <NotAComponent>, which the package doesn't export"]);
      expect(problemsIn("<Card><Card.Sidebar /></Card>")).toEqual(["uses <Card.Sidebar>, which doesn't exist"]);
    });

    it("rejects invalid TSX", () => {
      expect(problemsIn("<Card>").length).toBeGreaterThan(0);
    });

    it("allows a .map over the reader's own state", () => {
      expect(problemsIn("{filters.map((filter) => <Tag key={filter}>{filter}</Tag>)}")).toEqual([]);
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

describe("Playground snippets for the eight input molecules", () => {
  it.each([
    {},
    { "aria-label": "Interests", defaultValue: ["sports", "music"], size: "lg", orientation: "horizontal", hasError: true, disabled: true, name: "interests" },
    { defaultValue: [] },
  ])("CheckboxGroup %j is a real snippet", (args) => {
    expect(problemsIn(checkboxGroupPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("CheckboxGroup writes only what differs, and always an accessible name", () => {
    expect(checkboxGroupPlaygroundSnippet({ size: "md", orientation: "vertical", defaultValue: [], name: "" })).toMatch(
      /^<CheckboxGroup aria-label="Interests">\n/,
    );
    expect(checkboxGroupPlaygroundSnippet({ defaultValue: ["sports"], orientation: "horizontal" })).toMatch(
      /^<CheckboxGroup aria-label="Interests" defaultValue=\{\["sports"\]\} orientation="horizontal">\n/,
    );
  });

  it.each([
    {},
    { defaultValue: "email", size: "sm", orientation: "horizontal", loop: false, dir: "rtl", hasError: true, required: true, disabled: true, name: "contact" },
    { loop: true, dir: "ltr" },
  ])("RadioGroup %j is a real snippet", (args) => {
    expect(problemsIn(radioGroupPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("RadioGroup writes only what differs (loop defaults to true, dir to ltr)", () => {
    expect(radioGroupPlaygroundSnippet({ loop: true, dir: "ltr", orientation: "vertical", size: "md" })).toMatch(
      /^<RadioGroup aria-label="Contact method">\n/,
    );
    expect(radioGroupPlaygroundSnippet({ loop: false, dir: "rtl" })).toMatch(
      /^<RadioGroup aria-label="Contact method" loop=\{false\} dir="rtl">\n/,
    );
  });

  it.each([
    {},
    { label: "Full name", helperText: "As on your ID", error: "Required", required: true, disabled: true, size: "lg" },
    { helperText: 'Say "hello"' },
  ])("FormField %j is a real snippet, and always has a control in it", (args) => {
    const snippet = formFieldPlaygroundSnippet(args as never);
    expect(problemsIn(snippet)).toEqual([]);
    expect(snippet).toContain("<Input {...fieldProps}");
  });

  it.each([
    {},
    { "aria-label": "Guests", size: "xs", defaultValue: 5, min: 0, max: 10, step: 0.5, placeholder: "0", hasError: true, required: true, readOnly: true, disabled: true, name: "guests" },
    { min: undefined, max: undefined, defaultValue: 5 },
  ])("NumberInput %j is a real snippet", (args) => {
    expect(problemsIn(numberInputPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("NumberInput writes only what differs, including no bounds at all", () => {
    expect(numberInputPlaygroundSnippet({ size: "md", step: 1, "aria-label": "" })).toBe('<NumberInput aria-label="Quantity" />');
    expect(numberInputPlaygroundSnippet({ min: undefined, max: undefined, defaultValue: 5 })).toBe(
      '<NumberInput aria-label="Quantity" defaultValue={5} />',
    );
  });

  it.each([
    {},
    { "aria-label": "Password", size: "lg", placeholder: "Enter it", defaultValue: "hunter2", maxLength: 200, showCount: true, hasError: true, required: true, readOnly: true, disabled: true, name: "pw" },
  ])("PasswordInput %j is a real snippet", (args) => {
    expect(problemsIn(passwordInputPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("PasswordInput writes only what differs", () => {
    expect(passwordInputPlaygroundSnippet({ size: "md", defaultValue: "", hasError: false })).toBe('<PasswordInput aria-label="Password" />');
    expect(passwordInputPlaygroundSnippet({ hasError: true, defaultValue: "wrong" })).toBe(
      '<PasswordInput aria-label="Password" defaultValue="wrong" hasError />',
    );
  });

  it.each([
    {},
    { size: "sm", placeholder: "Search…", defaultValue: "cats", debounceMs: 0, maxLength: 200, isLoading: true, hasError: true, required: true, readOnly: true, disabled: true, name: "q" },
    { suffix: {} },
  ])("SearchInput %j is a real snippet", (args) => {
    expect(problemsIn(searchInputPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("SearchInput writes only what differs (debounceMs defaults to 300; 0 turns it off)", () => {
    expect(searchInputPlaygroundSnippet({ debounceMs: 300 })).toBe('<SearchInput aria-label="Search" />');
    expect(searchInputPlaygroundSnippet({ debounceMs: 0 })).toBe('<SearchInput aria-label="Search" debounceMs={0} />');
    expect(searchInputPlaygroundSnippet({ suffix: {} })).toContain("suffix={<Kbd");
  });

  it.each([
    {},
    { "aria-label": "Country", placeholder: "Choose", defaultValue: "primary", size: "xl", side: "top", align: "end", defaultOpen: true, dir: "rtl", hasError: true, required: true, disabled: true, name: "c", form: "f", autoComplete: "country" },
    { side: "bottom", align: "start", dir: "ltr" },
  ])("Select %j is a real snippet, with real options", (args) => {
    const snippet = selectPlaygroundSnippet(args as never);
    expect(problemsIn(snippet)).toEqual([]);
    expect(snippet).toContain("<Select.Option");
  });

  it("Select writes only what differs (side defaults to bottom, align to start)", () => {
    expect(selectPlaygroundSnippet({ side: "bottom", align: "start", size: "md" })).toMatch(/^<Select aria-label="Variant">\n/);
    expect(selectPlaygroundSnippet({ side: "right", align: "start" })).toMatch(/^<Select aria-label="Variant" side="right">\n/);
  });

  it.each([
    {},
    { size: "xs", defaultValue: 20, min: -10, max: 10, step: 5, orientation: "horizontal", inverted: true, showValue: true, showValueTooltip: true, showMinMaxLabels: true, showTicks: true, tickInterval: 25, hasError: true, disabled: true, name: "v", "aria-valuetext": "Loud" },
    { orientation: "vertical", showMinMaxLabels: true },
  ])("Slider %j is a real snippet", (args) => {
    expect(problemsIn(sliderPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Slider writes only what differs, and tickInterval only when ticks are on and it differs from step", () => {
    expect(sliderPlaygroundSnippet({ size: "md", min: 0, max: 100, step: 1, "aria-label": "" })).toBe('<Slider aria-label="Volume" />');
    expect(sliderPlaygroundSnippet({ showTicks: true, tickInterval: 10 })).toBe(
      '<Slider aria-label="Volume" showTicks tickInterval={10} />',
    );
    expect(sliderPlaygroundSnippet({ showTicks: true, tickInterval: 1, step: 1 })).toBe('<Slider aria-label="Volume" showTicks />');
    expect(sliderPlaygroundSnippet({ showTicks: false, tickInterval: 10 })).toBe('<Slider aria-label="Volume" />');
  });

  it("Slider puts a vertical slider in a container with a height", () => {
    const snippet = sliderPlaygroundSnippet({ orientation: "vertical" });
    expect(snippet).toContain('orientation="vertical"');
    expect(snippet).toContain('<div style={{ height: "12rem" }}>');
  });
});

describe("Playground snippets for the seven feedback and data-display atoms", () => {
  it.each([
    {},
    { alt: "Jane Doe", initials: "JD" },
    { as: "button", alt: "Jane Doe", initials: "JD", status: "online", disabled: true, shape: "square", size: "xl", colorful: true, name: "Jane Doe", src: "https://i.pravatar.cc/128?img=5", "aria-label": "Open profile" },
  ])("Avatar %j is a real snippet", (args) => {
    expect(problemsIn(avatarPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Avatar writes only what's set, and gives a button its handler", () => {
    expect(avatarPlaygroundSnippet({ as: "span", src: "", alt: "", initials: "", name: "", colorful: false, size: "md", shape: "circle" })).toBe("<Avatar />");
    expect(avatarPlaygroundSnippet({ alt: "Jane Doe", initials: "JD", size: "md" })).toBe('<Avatar alt="Jane Doe" initials="JD" />');
    expect(avatarPlaygroundSnippet({ as: "button", initials: "JD" })).toBe('<Avatar as="button" initials="JD" onClick={handleClick} />');
  });

  it.each([
    {},
    { children: "New", tone: "success", size: "lg", variant: "subtle", max: 9, hideZero: true, position: "bottom-left", overlap: "circular", "aria-label": "New items" },
    { children: 42, tone: "danger" },
    { dot: true, tone: "warning" },
  ])("Badge %j is a real snippet", (args) => {
    expect(problemsIn(badgePlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Badge writes only what differs, numbers as expressions, and a dot with a name", () => {
    expect(badgePlaygroundSnippet({ children: "Badge", tone: "danger", size: "md", variant: "solid", max: 99 })).toBe("<Badge>Badge</Badge>");
    expect(badgePlaygroundSnippet({ children: 4 })).toBe("<Badge>{4}</Badge>");
    expect(badgePlaygroundSnippet({ dot: true, "aria-label": "Online", tone: "success" })).toBe('<Badge dot tone="success" aria-label="Online" />');
    expect(badgePlaygroundSnippet({ dot: true })).toContain("aria-label=");
  });

  it.each([
    {},
    { variant: "circular", width: 48, height: 48 },
    { variant: "rectangular", width: "16rem", height: "var(--dbm-space-32)", animation: "wave" },
    { variant: "text", width: "", height: "", animation: "pulse" },
  ])("Skeleton %j is a real snippet", (args) => {
    expect(problemsIn(skeletonPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Skeleton writes numbers as expressions and strings as strings", () => {
    expect(skeletonPlaygroundSnippet({ variant: "text", width: "", height: "", animation: "pulse" })).toBe("<Skeleton />");
    expect(skeletonPlaygroundSnippet({ variant: "circular", width: 48, height: 48 })).toBe('<Skeleton variant="circular" width={48} height={48} />');
    expect(skeletonPlaygroundSnippet({ width: "12rem" })).toBe('<Skeleton width="12rem" />');
  });

  it.each([
    {},
    { children: "Design", tone: "info", variant: "outline", size: "sm", removable: true, removeLabel: "Delete it", disabled: true, "aria-label": "Design tag" },
    { leadingIcon: undefined, trailingIcon: undefined, removable: true, removeLabel: "Remove Design" },
  ])("Tag %j is a real snippet", (args) => {
    expect(problemsIn(tagPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Tag writes only what differs, and gives a removable tag its onRemove", () => {
    expect(tagPlaygroundSnippet({ children: "Design", tone: "neutral", variant: "subtle", size: "md", removable: false })).toBe("<Tag>Design</Tag>");
    expect(tagPlaygroundSnippet({ children: "Design", removable: true, removeLabel: "Remove Design" })).toBe(
      "<Tag removable onRemove={handleRemove}>Design</Tag>",
    );
    expect(tagPlaygroundSnippet({ children: "Design", removable: true, removeLabel: "Delete" })).toContain('removeLabel="Delete"');
  });

  it("Tag turns the icon control's component back into its name, and ignores anything else", async () => {
    const { TagIcon, StarIcon } = await import("@dbm-design-system/icons");
    expect(tagPlaygroundSnippet({ children: "Design", leadingIcon: TagIcon })).toBe("<Tag leadingIcon={TagIcon}>Design</Tag>");
    expect(tagPlaygroundSnippet({ children: "Design", trailingIcon: StarIcon })).toBe("<Tag trailingIcon={StarIcon}>Design</Tag>");
    expect(tagPlaygroundSnippet({ children: "Design", leadingIcon: "None" })).toBe("<Tag>Design</Tag>");
  });

  it.each([
    {},
    { value: 3, max: 5, size: "lg", tone: "success", label: "Uploading files", "aria-valuetext": "3 of 5 files uploaded", showValueLabel: true },
    { value: 40, indeterminate: true, label: "Loading" },
  ])("ProgressBar %j is a real snippet", (args) => {
    expect(problemsIn(progressBarPlaygroundSnippet(args as never))).toEqual([]);
  });

  it.each([
    {},
    { value: 3, max: 5, size: "lg", tone: "success", label: "Uploading files", "aria-valuetext": "3 of 5 files uploaded", showValueLabel: true },
    { value: 65, indeterminate: true, label: "Loading" },
  ])("ProgressCircle %j is a real snippet", (args) => {
    expect(problemsIn(progressCirclePlaygroundSnippet(args as never))).toEqual([]);
  });

  it("ProgressBar and ProgressCircle write indeterminate by leaving value out, and always a label", () => {
    expect(progressBarPlaygroundSnippet({ value: 40, indeterminate: true, label: "Loading" })).toBe('<ProgressBar label="Loading" />');
    expect(progressBarPlaygroundSnippet({ value: undefined, label: "Loading" })).toBe('<ProgressBar label="Loading" />');
    expect(progressBarPlaygroundSnippet({ value: 40, max: 100, size: "md", tone: "brand", label: "Uploading" })).toBe(
      '<ProgressBar label="Uploading" value={40} />',
    );
    expect(progressCirclePlaygroundSnippet({ value: 65, indeterminate: true, label: "" })).toBe('<ProgressCircle label="Progress" />');
    expect(progressCirclePlaygroundSnippet({ value: 65, showValueLabel: true, label: "Uploading" })).toBe(
      '<ProgressCircle label="Uploading" value={65} showValueLabel />',
    );
  });

  it.each([{}, { size: "lg", tone: "brand", label: "Loading" }, { tone: "secondary" }])("Spinner %j is a real snippet", (args) => {
    expect(problemsIn(spinnerPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Spinner writes only what's set — no default tone, so a tone is always written", () => {
    expect(spinnerPlaygroundSnippet({ size: "md", label: "" })).toBe("<Spinner />");
    expect(spinnerPlaygroundSnippet({ size: "md", tone: "brand", label: "" })).toBe('<Spinner tone="brand" />');
    expect(spinnerPlaygroundSnippet({ tone: "brand", label: "Loading" })).toBe('<Spinner tone="brand" label="Loading" />');
  });
});
