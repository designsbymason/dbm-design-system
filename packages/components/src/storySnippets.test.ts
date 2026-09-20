import * as icons from "@dbm-design-system/icons";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import * as library from "./index";
import { avatarPlaygroundSnippet } from "./atoms/Avatar/Avatar.snippets";
import { buttonPlaygroundSnippet } from "./atoms/Button/Button.snippets";
import { checkboxPlaygroundSnippet } from "./atoms/Checkbox/Checkbox.snippets";
import { closeButtonPlaygroundSnippet } from "./atoms/CloseButton/CloseButton.snippets";
import { fieldErrorPlaygroundSnippet } from "./atoms/FieldError/FieldError.snippets";
import { fieldHelperTextPlaygroundSnippet } from "./atoms/FieldHelperText/FieldHelperText.snippets";
import { fieldLabelPlaygroundSnippet } from "./atoms/FieldLabel/FieldLabel.snippets";
import { iconButtonPlaygroundSnippet } from "./atoms/IconButton/IconButton.snippets";
import { inputPlaygroundSnippet } from "./atoms/Input/Input.snippets";
import { radioPlaygroundSnippet } from "./atoms/Radio/Radio.snippets";
import { switchPlaygroundSnippet } from "./atoms/Switch/Switch.snippets";
import { textareaPlaygroundSnippet } from "./atoms/Textarea/Textarea.snippets";
import { blockquotePlaygroundSnippet } from "./atoms/Blockquote/Blockquote.snippets";
import { codePlaygroundSnippet } from "./atoms/Code/Code.snippets";
import { headingPlaygroundSnippet } from "./atoms/Heading/Heading.snippets";
import { highlightPlaygroundSnippet } from "./atoms/Highlight/Highlight.snippets";
import { kbdPlaygroundSnippet } from "./atoms/Kbd/Kbd.snippets";
import { linkPlaygroundSnippet } from "./atoms/Link/Link.snippets";
import { listItemPlaygroundSnippet } from "./atoms/ListItem/ListItem.snippets";
import { textPlaygroundSnippet } from "./atoms/Text/Text.snippets";
import { escapeJsxText, quote, truncateValue } from "./snippetHelpers";
import { backdropPlaygroundSnippet } from "./atoms/Backdrop/Backdrop.snippets";
import { backToTopPlaygroundSnippet } from "./atoms/BackToTop/BackToTop.snippets";
import { clientOnlyPlaygroundSnippet } from "./atoms/ClientOnly/ClientOnly.snippets";
import { collapsePlaygroundSnippet } from "./atoms/Collapse/Collapse.snippets";
import { focusTrapPlaygroundSnippet } from "./atoms/FocusTrap/FocusTrap.snippets";
import { iconPlaygroundSnippet } from "./atoms/Icon/Icon.snippets";
import { imagePlaygroundSnippet } from "./atoms/Image/Image.snippets";
import { indicatorsPlaygroundSnippet } from "./atoms/Indicators/Indicators.snippets";
import { portalPlaygroundSnippet } from "./atoms/Portal/Portal.snippets";
import { tooltipPlaygroundSnippet } from "./atoms/Tooltip/Tooltip.snippets";
import { visuallyHiddenPlaygroundSnippet } from "./atoms/VisuallyHidden/VisuallyHidden.snippets";
import { aspectRatioPlaygroundSnippet } from "./atoms/AspectRatio/AspectRatio.snippets";
import { bleedPlaygroundSnippet } from "./atoms/Bleed/Bleed.snippets";
import { boxPlaygroundSnippet } from "./atoms/Box/Box.snippets";
import { centerPlaygroundSnippet } from "./atoms/Center/Center.snippets";
import { containerPlaygroundSnippet } from "./atoms/Container/Container.snippets";
import { dividerPlaygroundSnippet } from "./atoms/Divider/Divider.snippets";
import { gridItemPlaygroundSnippet } from "./atoms/GridItem/GridItem.snippets";
import { stackPlaygroundSnippet } from "./atoms/Stack/Stack.snippets";
import { badgePlaygroundSnippet } from "./atoms/Badge/Badge.snippets";
import { progressBarPlaygroundSnippet } from "./atoms/ProgressBar/ProgressBar.snippets";
import { progressCirclePlaygroundSnippet } from "./atoms/ProgressCircle/ProgressCircle.snippets";
import { skeletonPlaygroundSnippet } from "./atoms/Skeleton/Skeleton.snippets";
import { spinnerPlaygroundSnippet } from "./atoms/Spinner/Spinner.snippets";
import { tagPlaygroundSnippet } from "./atoms/Tag/Tag.snippets";
import { accordionPlaygroundSnippet } from "./molecules/Accordion/Accordion.snippets";
import { cardPlaygroundSnippet } from "./molecules/Card/Card.snippets";
import { checkboxGroupPlaygroundSnippet } from "./molecules/CheckboxGroup/CheckboxGroup.snippets";
import { emptyStatePlaygroundSnippet } from "./molecules/EmptyState/EmptyState.snippets";
import { formFieldPlaygroundSnippet } from "./molecules/FormField/FormField.snippets";
import { gridPlaygroundSnippet } from "./molecules/Grid/Grid.snippets";
import { listPlaygroundSnippet } from "./molecules/List/List.snippets";
import { numberInputPlaygroundSnippet } from "./molecules/NumberInput/NumberInput.snippets";
import { paginationPlaygroundSnippet } from "./molecules/Pagination/Pagination.snippets";
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
  // A story cancelling its own link's navigation (`onClick={(event) => event.preventDefault()}`) is demo wiring;
  // `event.preventDefault()` inside a real handler (handing a link to a router) is genuine usage.
  [/onClick=\{\(event\) => event\.preventDefault\(\)\}|data-testid|onActivate/, "test or demo wiring"],
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

  // The components package, plus the icons package — a snippet's comment says where an
  // icon comes from (`{/* HeartIcon comes from @dbm-design-system/icons */}`).
  const exported = { ...icons, ...library } as unknown as Record<string, Record<string, unknown> | undefined>;
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
    expect(Object.keys(snippetModules).length).toBeGreaterThanOrEqual(61);
    expect(namedSnippets.length).toBeGreaterThan(280);
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

    it("rejects a story's own click-cancelling wiring but allows preventDefault in a real handler", () => {
      expect(problemsIn('<a href="#x" onClick={(event) => event.preventDefault()}>x</a>').length).toBeGreaterThan(0);
      expect(problemsIn('<Pagination pageCount={5} onValueChange={(page, event) => { event.preventDefault(); navigate(page); }} />')).toEqual([]);
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

  const paginationArgs = [
    {},
    { pageCount: 5, value: 3 },
    { pageCount: 200, value: 100, siblingCount: 2, boundaryCount: 0, showFirstLast: true },
    { size: "xl", compact: "always", align: "end", disabled: true },
    { variant: "outlined", showJump: true, announce: false, compact: "container" },
    { rounded: true, showJump: true },
  ] as const;

  it.each(paginationArgs)("Pagination %j is a real snippet", (args) => {
    expect(problemsIn(paginationPlaygroundSnippet(args))).toEqual([]);
  });

  it("Pagination writes the controlled page, and only what differs from the defaults", () => {
    expect(paginationPlaygroundSnippet({ pageCount: 20, value: 5 })).toBe(
      "{/* const [page, setPage] = useState(5); */}\n<Pagination pageCount={20} value={page} onValueChange={setPage} />",
    );
    const snippet = paginationPlaygroundSnippet({ siblingCount: 1, boundaryCount: 1, size: "md", compact: "auto", align: "center", showFirstLast: false, disabled: false });
    expect(snippet).not.toMatch(/siblingCount|boundaryCount|size=|compact=|align=|showFirstLast|disabled/);
    expect(paginationPlaygroundSnippet({ siblingCount: 0, boundaryCount: 0 })).toContain("siblingCount={0} boundaryCount={0}");
  });

  it("Pagination writes variant, showJump, and announce only when they differ from the defaults", () => {
    const snippet = paginationPlaygroundSnippet({ variant: "ghost", showJump: false, announce: true });
    expect(snippet).not.toMatch(/variant|showJump|announce/);
    expect(paginationPlaygroundSnippet({ variant: "filled" })).toContain('variant="filled"');
    expect(paginationPlaygroundSnippet({ showJump: true })).toContain(" showJump");
    expect(paginationPlaygroundSnippet({ announce: false })).toContain("announce={false}");
    expect(paginationPlaygroundSnippet({ compact: "container" })).toContain('compact="container"');
    expect(paginationPlaygroundSnippet({ rounded: true })).toContain(" rounded");
    expect(paginationPlaygroundSnippet({ rounded: false })).not.toContain("rounded");
  });

  const emptyStateArgs = [
    {},
    { variant: "dashed", tone: "danger", size: "lg", align: "start" },
    { variant: "filled", actions: false },
    { size: "xs", tone: "success", actions: true },
    { announce: true, variant: "dashed" },
    { stackOnMobile: true },
  ] as const;

  it.each(emptyStateArgs)("EmptyState %j is a real snippet", (args) => {
    expect(problemsIn(emptyStatePlaygroundSnippet(args))).toEqual([]);
  });

  it("EmptyState writes only what differs from the defaults", () => {
    expect(emptyStatePlaygroundSnippet({ variant: "ghost", tone: "neutral", size: "md", align: "center" })).toMatch(
      /\n<EmptyState>\n/,
    );
    expect(emptyStatePlaygroundSnippet({ variant: "dashed", align: "start" })).toContain(
      '<EmptyState variant="dashed" align="start">',
    );
  });

  it("EmptyState writes announce only when it is on", () => {
    expect(emptyStatePlaygroundSnippet({ announce: true })).toContain("<EmptyState announce>");
    expect(emptyStatePlaygroundSnippet({ announce: false })).not.toContain("announce");
    expect(emptyStatePlaygroundSnippet({ variant: "dashed", announce: true })).toContain(
      '<EmptyState variant="dashed" announce>',
    );
  });

  it("EmptyState writes stackOnMobile on the actions row, and only with the actions shown", () => {
    expect(emptyStatePlaygroundSnippet({ stackOnMobile: true })).toContain("<EmptyState.Actions stackOnMobile>");
    expect(emptyStatePlaygroundSnippet({ stackOnMobile: false })).toContain("<EmptyState.Actions>");
    expect(emptyStatePlaygroundSnippet({ stackOnMobile: true, actions: false })).not.toContain("stackOnMobile");
    expect(emptyStatePlaygroundSnippet({ stackOnMobile: true })).not.toMatch(/<EmptyState[^.]*stackOnMobile/);
  });

  it("EmptyState leaves out the actions row when the demo-actions control is off", () => {
    expect(emptyStatePlaygroundSnippet({ actions: false })).not.toContain("EmptyState.Actions");
    expect(emptyStatePlaygroundSnippet({ actions: true })).toContain("EmptyState.Actions");
    expect(emptyStatePlaygroundSnippet({})).toContain("EmptyState.Actions");
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

describe("Playground snippets for the eleven input and field atoms", () => {
  it.each([
    {},
    { children: "Pay", variant: "destructive", size: "lg", type: "submit", "aria-label": "Pay now", isLoading: true, loadingText: "Paying…", fullWidth: true, disabled: true },
    { children: "Export", variant: "secondary" },
    { children: "Get started", rounded: true, size: "xl" },
  ])("Button %j is a real snippet", (args) => {
    expect(problemsIn(buttonPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Button writes only what differs, and turns an icon component back into its name", async () => {
    const { WalletIcon, ArrowRightIcon } = await import("@dbm-design-system/icons");
    expect(buttonPlaygroundSnippet({ children: "Button", variant: "primary", size: "md", type: "button", leadingIcon: "None" })).toBe("<Button>Button</Button>");
    expect(buttonPlaygroundSnippet({ children: "Pay", leadingIcon: WalletIcon, trailingIcon: ArrowRightIcon })).toBe(
      "<Button leadingIcon={WalletIcon} trailingIcon={ArrowRightIcon}>Pay</Button>",
    );
    expect(buttonPlaygroundSnippet({ children: "Saving", isLoading: true })).toBe("<Button isLoading>Saving</Button>");
    expect(buttonPlaygroundSnippet({ children: "Go", rounded: true })).toBe("<Button rounded>Go</Button>");
    expect(buttonPlaygroundSnippet({ children: "Go", rounded: false })).toBe("<Button>Go</Button>");
  });

  it.each([
    {},
    { variant: "ghost", size: "xs", rounded: true, type: "submit", isLoading: true, loadingLabel: "Saving…", disabled: true, "aria-label": "Like" },
    { interactionMode: "Toggle", defaultPressed: true, variant: "ghost" },
  ])("IconButton %j is a real snippet", (args) => {
    expect(problemsIn(iconButtonPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("IconButton always writes its icon and name, and toggle as defaultPressed plus a handler", async () => {
    const { TrashIcon } = await import("@dbm-design-system/icons");
    expect(iconButtonPlaygroundSnippet({})).toBe('<IconButton icon={HeartIcon} aria-label="Favorite" />');
    expect(iconButtonPlaygroundSnippet({ icon: TrashIcon, "aria-label": "Delete" })).toBe('<IconButton icon={TrashIcon} aria-label="Delete" />');
    expect(iconButtonPlaygroundSnippet({ interactionMode: "Non-toggle", defaultPressed: true })).not.toContain("defaultPressed");
    expect(iconButtonPlaygroundSnippet({ interactionMode: "Toggle", defaultPressed: false })).toContain("defaultPressed={false} onPressedChange={handlePressedChange}");
  });

  it.each([
    {},
    { children: "Accept", size: "lg", defaultChecked: true, hasError: true, required: true, name: "terms", value: "yes", "aria-label": "Accept terms", disabled: true },
    { children: "", "aria-label": "Select row", defaultChecked: "indeterminate" },
  ])("Checkbox %j is a real snippet", (args) => {
    expect(problemsIn(checkboxPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Checkbox writes only what differs, and a label-less one as self-closing", async () => {
    const { StarIcon, XIcon } = await import("@dbm-design-system/icons");
    expect(checkboxPlaygroundSnippet({ children: "Accept", size: "md", defaultChecked: false })).toBe("<Checkbox>Accept</Checkbox>");
    expect(checkboxPlaygroundSnippet({ children: "", "aria-label": "Select row" })).toBe('<Checkbox aria-label="Select row" />');
    expect(checkboxPlaygroundSnippet({ children: "x", icon: StarIcon, indeterminateIcon: XIcon })).toBe(
      "<Checkbox icon={StarIcon} indeterminateIcon={XIcon}>x</Checkbox>",
    );
  });

  it.each([{}, { size: "xl", rounded: true, hasBackground: true, type: "reset", disabled: true, "aria-label": "Dismiss" }])(
    "CloseButton %j is a real snippet",
    (args) => {
      expect(problemsIn(closeButtonPlaygroundSnippet(args as never))).toEqual([]);
    },
  );

  it("CloseButton always writes a name, and only what differs", () => {
    expect(closeButtonPlaygroundSnippet({ size: "md", rounded: false, hasBackground: false, type: "button", "aria-label": "" })).toBe(
      '<CloseButton aria-label="Close" />',
    );
    expect(closeButtonPlaygroundSnippet({ rounded: true })).toBe('<CloseButton aria-label="Close" rounded />');
  });

  it("FieldError writes the icon as true (nothing), false, or a named component", async () => {
    const { StarIcon } = await import("@dbm-design-system/icons");
    for (const args of [{}, { icon: true }, { icon: false }, { icon: StarIcon }, { disabled: true }, { icon: "Default" }]) {
      expect(problemsIn(fieldErrorPlaygroundSnippet(args))).toEqual([]);
    }
    expect(fieldErrorPlaygroundSnippet({ children: "Bad", icon: true })).toBe("<FieldError>Bad</FieldError>");
    expect(fieldErrorPlaygroundSnippet({ children: "Bad", icon: false })).toBe("<FieldError icon={false}>Bad</FieldError>");
    expect(fieldErrorPlaygroundSnippet({ children: "Bad", icon: StarIcon, disabled: true })).toBe(
      "<FieldError icon={StarIcon} disabled>Bad</FieldError>",
    );
  });

  it("FieldHelperText writes disabled only when set", () => {
    expect(problemsIn(fieldHelperTextPlaygroundSnippet({}))).toEqual([]);
    expect(fieldHelperTextPlaygroundSnippet({ children: "Help", disabled: false })).toBe("<FieldHelperText>Help</FieldHelperText>");
    expect(fieldHelperTextPlaygroundSnippet({ children: "Help", disabled: true })).toBe("<FieldHelperText disabled>Help</FieldHelperText>");
  });

  it.each([{}, { children: "Name", htmlFor: "name", size: "lg", required: true, disabled: true }])("FieldLabel %j is a real snippet", (args) => {
    expect(problemsIn(fieldLabelPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("FieldLabel always writes htmlFor, and only what differs", () => {
    expect(fieldLabelPlaygroundSnippet({ children: "Email address", htmlFor: "email", size: "md", required: false })).toBe(
      '<FieldLabel htmlFor="email">Email address</FieldLabel>',
    );
    expect(fieldLabelPlaygroundSnippet({ htmlFor: "", required: true })).toContain('htmlFor="email" required');
  });

  it.each([
    {},
    { placeholder: "Email", size: "sm", type: "email", defaultValue: "x@y.z", hasError: true, required: true, readOnly: true, disabled: true, maxLength: 20, showCount: true, name: "email", "aria-label": "Email", suffix: "@example.com" },
  ])("Input %j is a real snippet", (args) => {
    expect(problemsIn(inputPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Input always writes a name, and only what differs", () => {
    expect(inputPlaygroundSnippet({ type: "text", size: "md", "aria-label": "" })).toBe('<Input aria-label="Text" />');
    expect(inputPlaygroundSnippet({ placeholder: "Email", hasError: true, defaultValue: "not-an-email" })).toBe(
      '<Input aria-label="Text" placeholder="Email" defaultValue="not-an-email" hasError />',
    );
  });

  it.each([
    {},
    { children: "Email", size: "lg", defaultChecked: true, hasError: true, required: true, name: "c", value: "sms", "aria-label": "SMS", disabled: true },
    { children: "", "aria-label": "Select row", value: "row" },
  ])("Radio %j is a real snippet", (args) => {
    expect(problemsIn(radioPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Radio always writes a value, and a label-less one as self-closing", () => {
    expect(radioPlaygroundSnippet({ children: "Email", value: "" })).toBe('<Radio value="email">Email</Radio>');
    expect(radioPlaygroundSnippet({ children: "", value: "row", "aria-label": "Select row" })).toBe('<Radio value="row" aria-label="Select row" />');
  });

  it.each([
    {},
    { children: "Notify", size: "xs", defaultChecked: true, loading: true, hasError: true, required: true, name: "n", value: "on", "aria-label": "Notify", disabled: true },
    { children: "", "aria-label": "Airplane mode" },
  ])("Switch %j is a real snippet", (args) => {
    expect(problemsIn(switchPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Switch writes only what differs, and thumb icons by name", async () => {
    const { MoonIcon, SunIcon } = await import("@dbm-design-system/icons");
    expect(switchPlaygroundSnippet({ children: "Email", size: "md", defaultChecked: false, loading: false })).toBe("<Switch>Email</Switch>");
    expect(switchPlaygroundSnippet({ children: "Dark mode", checkedIcon: MoonIcon, uncheckedIcon: SunIcon })).toBe(
      "<Switch checkedIcon={MoonIcon} uncheckedIcon={SunIcon}>Dark mode</Switch>",
    );
    expect(switchPlaygroundSnippet({ children: "", "aria-label": "Airplane mode" })).toBe('<Switch aria-label="Airplane mode" />');
  });

  it.each([
    {},
    { placeholder: "Add a comment…", hasError: true, size: "lg", autoResize: true, resize: "none", rows: 5, minRows: 3, maxRows: 6, defaultValue: "Hi", disabled: true, required: true, readOnly: true, maxLength: 140, showCount: true, name: "c", "aria-label": "Bio" },
  ])("Textarea %j is a real snippet", (args) => {
    expect(problemsIn(textareaPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Textarea writes only what differs (rows defaults to 3, resize to vertical)", () => {
    expect(textareaPlaygroundSnippet({ size: "md", rows: 3, resize: "vertical", autoResize: false, "aria-label": "" })).toBe('<Textarea aria-label="Comment" />');
    expect(textareaPlaygroundSnippet({ autoResize: true, rows: 5, resize: "none" })).toBe('<Textarea aria-label="Comment" autoResize rows={5} resize="none" />');
  });
});

describe("Playground snippets for the ten layout atoms", () => {
  it.each([{}, { ratio: 1 }, { ratio: 21 / 9 }, { ratio: 4 / 3 }, { ratio: 1.85, children: "Poster" }])("AspectRatio %j is a real snippet", (args) => {
    expect(problemsIn(aspectRatioPlaygroundSnippet(args))).toEqual([]);
  });

  it("AspectRatio writes the ratio as a fraction, and nothing at the default", () => {
    expect(aspectRatioPlaygroundSnippet({ ratio: 16 / 9, children: "x" })).toBe("<AspectRatio>x</AspectRatio>");
    expect(aspectRatioPlaygroundSnippet({ ratio: 1, children: "x" })).toBe("<AspectRatio ratio={1}>x</AspectRatio>");
    expect(aspectRatioPlaygroundSnippet({ ratio: 21 / 9, children: "x" })).toBe("<AspectRatio ratio={21 / 9}>x</AspectRatio>");
    expect(aspectRatioPlaygroundSnippet({ ratio: 4 / 3, children: "x" })).toBe("<AspectRatio ratio={4 / 3}>x</AspectRatio>");
    expect(aspectRatioPlaygroundSnippet({ ratio: 1.85, children: "x" })).toBe("<AspectRatio ratio={1.85}>x</AspectRatio>");
  });

  it.each([{}, { inset: 4, side: "block" }, { inset: 8, side: "all", children: "Banner" }])("Bleed %j is a real snippet", (args) => {
    expect(problemsIn(bleedPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Bleed sits in a parent whose padding matches its inset on the side it bleeds", () => {
    expect(bleedPlaygroundSnippet({ inset: 6, side: "inline", children: "x" })).toBe(
      '<div style={{ paddingInline: "var(--dbm-space-6)" }}>\n  <Bleed inset={6}>x</Bleed>\n</div>',
    );
    expect(bleedPlaygroundSnippet({ inset: 4, side: "block", children: "x" })).toContain('paddingBlock: "var(--dbm-space-4)"');
    expect(bleedPlaygroundSnippet({ inset: 4, side: "block", children: "x" })).toContain('<Bleed inset={4} side="block">');
    expect(bleedPlaygroundSnippet({ inset: 2, side: "all", children: "x" })).toContain('padding: "var(--dbm-space-2)"');
  });

  it.each([{}, { as: "section" }, { as: "button", children: "Save" }])("Box %j is a real snippet", (args) => {
    expect(problemsIn(boxPlaygroundSnippet(args))).toEqual([]);
  });

  it("Box writes the element only when it isn't a div, and escapes text that JSX would read as markup", () => {
    expect(boxPlaygroundSnippet({ as: "div", children: "x" })).toBe("<Box>x</Box>");
    expect(boxPlaygroundSnippet({ as: "section", children: "x" })).toBe('<Box as="section">x</Box>');
    // The AsSection story's own children contain `<section>` and backticks.
    expect(problemsIn(boxPlaygroundSnippet({ as: "section", children: "Rendered as a <section> element via the `as` prop." }))).toEqual([]);
    expect(boxPlaygroundSnippet({ children: "a {b}" })).toBe("<Box>a &#123;b&#125;</Box>");
  });

  it.each([{}, { as: "span", inline: true }, { as: "section", inline: false, children: "Loading" }])("Center %j is a real snippet", (args) => {
    expect(problemsIn(centerPlaygroundSnippet(args))).toEqual([]);
  });

  it("Center gives a block-level one the height it needs, and an inline one none", () => {
    expect(centerPlaygroundSnippet({ as: "div", inline: false, children: "x" })).toBe('<Center style={{ height: "12rem" }}>x</Center>');
    expect(centerPlaygroundSnippet({ as: "span", inline: true, children: "x" })).toBe('<Center as="span" inline>x</Center>');
  });

  it.each([{}, { size: "sm", as: "main", paddingInline: 8 }, { size: "full" }])("Container %j is a real snippet", (args) => {
    expect(problemsIn(containerPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Container writes only what differs (div, xl, a padding of 4)", () => {
    expect(containerPlaygroundSnippet({ as: "div", size: "xl", paddingInline: 4 })).toBe(
      "<Container>\n  <p>Page content, centered and constrained by size.</p>\n</Container>",
    );
    expect(containerPlaygroundSnippet({ as: "main", size: "md", paddingInline: 6 })).toContain('<Container as="main" size="md" paddingInline={6}>');
  });

  it.each([
    {},
    { orientation: "vertical", variant: "double", thickness: "thick", emphasis: "start", tone: "danger", label: "OR", align: "end", "aria-label": "Separator" },
    { label: "Section", align: "center" },
  ])("Divider %j is a real snippet", (args) => {
    expect(problemsIn(dividerPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Divider writes only what differs, `align` only beside a label, and a vertical one inside the flex row it needs", () => {
    expect(dividerPlaygroundSnippet({ orientation: "horizontal", variant: "solid", thickness: "thin", emphasis: "none", tone: "default", align: "end" })).toBe("<Divider />");
    expect(dividerPlaygroundSnippet({ label: "OR", align: "end" })).toBe('<Divider label="OR" align="end" />');
    const vertical = dividerPlaygroundSnippet({ orientation: "vertical", label: "OR" });
    expect(vertical).toContain('<Divider orientation="vertical" label="OR" />');
    expect(vertical).toContain('display: "flex"');
    expect(vertical).toContain('height: "6rem"');
  });

  it.each([
    {},
    { children: "Wide", colSpan: 3, rowSpan: 2, colStart: 2, rowStart: 2, order: 4 },
    { colStart: "", rowStart: "" },
    { colStart: "3", as: "li" },
  ])("GridItem %j is a real snippet", (args) => {
    expect(problemsIn(gridItemPlaygroundSnippet(args))).toEqual([]);
  });

  it("GridItem writes only what differs, reads the control's blank as unset, and puts a list item inside a list", () => {
    expect(gridItemPlaygroundSnippet({ children: "Grid cell", colSpan: 1, rowSpan: 1, colStart: "", rowStart: "", order: 1 })).toBe(
      "<Grid columns={4} gap={4}>\n  <GridItem>Grid cell</GridItem>\n</Grid>",
    );
    expect(gridItemPlaygroundSnippet({ children: "x", colSpan: 2, colStart: "3" })).toContain("<GridItem colSpan={2} colStart={3}>x</GridItem>");
    expect(gridItemPlaygroundSnippet({ children: "x", as: "li" })).toContain('<Grid as="ul"');
    expect(gridItemPlaygroundSnippet({ children: "x", as: "li" })).toContain('<GridItem as="li">x</GridItem>');
  });

  it.each([
    {},
    { direction: "row", gap: 4, align: "center", justify: "between", wrap: true },
    { as: "ul", direction: "column-reverse", gap: 8, align: "baseline", justify: "evenly" },
  ])("Stack %j is a real snippet", (args) => {
    expect(problemsIn(stackPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Stack writes only what differs (div, column, a gap of 0, stretch, start, no wrap)", () => {
    expect(stackPlaygroundSnippet({ as: "div", direction: "column", gap: 0, align: "stretch", justify: "start", wrap: false })).toBe(
      "<Stack>\n  <div>One</div>\n  <div>Two</div>\n  <div>Three</div>\n</Stack>",
    );
    expect(stackPlaygroundSnippet({ direction: "row", gap: 4, wrap: true })).toContain('<Stack direction="row" gap={4} wrap>');
  });
});

describe("Playground snippets for the eleven media, overlay and utility atoms", () => {
  it.each([
    {},
    { icon: "Heart", size: "3xl", weight: "duotone", tone: "danger", label: "Favorite", mirrored: true },
    { icon: "Nonsense", tone: "on-brand" },
  ])("Icon %j is a real snippet", (args) => {
    expect(problemsIn(iconPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Icon always writes its icon, and only what differs (md, bold, no tone, no label, not mirrored)", async () => {
    const { StarIcon } = await import("@dbm-design-system/icons");
    expect(iconPlaygroundSnippet({ icon: "Wallet", size: "md", weight: "bold", label: "", mirrored: false })).toBe("<Icon icon={WalletIcon} />");
    expect(iconPlaygroundSnippet({ icon: StarIcon, size: "lg", tone: "brand" })).toBe('<Icon icon={StarIcon} size="lg" tone="brand" />');
    expect(iconPlaygroundSnippet({ icon: "Nonsense" })).toBe("<Icon icon={WalletIcon} />");
    expect(iconPlaygroundSnippet({ icon: "ArrowRight", mirrored: true })).toBe("<Icon icon={ArrowRightIcon} mirrored />");
  });

  it("text with a quote or an ampersand becomes a `{…}` expression, so the snippet stays valid", () => {
    const tricky = iconPlaygroundSnippet({ label: 'The "best" & brightest' });
    expect(tricky).toBe('<Icon icon={WalletIcon} label={"The \\"best\\" & brightest"} />');
    expect(problemsIn(tricky)).toEqual([]);
    expect(problemsIn(imagePlaygroundSnippet({ alt: 'A "quoted" alt & more' }))).toEqual([]);
    expect(problemsIn(tooltipPlaygroundSnippet({ content: 'Say "hi" & bye' }))).toEqual([]);
  });

  it.each([
    {},
    { src: "/photo.jpg", alt: "Photo", aspectRatio: 4 / 3, width: 200, height: 150, objectFit: "contain", position: "top-left", radius: "full", loading: "eager" },
    { aspectRatio: 16 / 9, width: "50%" },
  ])("Image %j is a real snippet", (args) => {
    expect(problemsIn(imagePlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Image writes src and alt always, the ratio as a fraction, and only what differs", () => {
    expect(imagePlaygroundSnippet({ src: "/placeholder-img.png", alt: "Placeholder image", objectFit: "cover", position: "center", radius: "none", loading: "lazy" })).toBe(
      '<div style={{ width: "16rem" }}>\n  <Image src="/hero.jpg" alt="Placeholder image" />\n</div>',
    );
    expect(imagePlaygroundSnippet({ src: "/a.png", alt: "A", aspectRatio: 4 / 3, width: 200, height: "10rem" }, "20rem")).toBe(
      '<div style={{ width: "20rem" }}>\n  <Image src="/a.png" alt="A" aspectRatio={4 / 3} width={200} height="10rem" />\n</div>',
    );
    expect(imagePlaygroundSnippet({ alt: "A", aspectRatio: 1, radius: "full" })).toContain('aspectRatio={1} radius="full"');
  });

  it.each([{}, { count: 10, size: "xl", orientation: "vertical", variant: "bars", showLabel: true, "aria-label": "Gallery navigation" }])(
    "Indicators %j is a real snippet",
    (args) => {
      expect(problemsIn(indicatorsPlaygroundSnippet(args as never))).toEqual([]);
    },
  );

  it("Indicators wires its position to the reader's state and writes only what differs", () => {
    expect(indicatorsPlaygroundSnippet({ count: 5, size: "md", orientation: "horizontal", variant: "dots", showLabel: false, "aria-label": "Slide navigation" })).toBe(
      "{/* const [index, setIndex] = useState(0); — Indicators is controlled, so your component holds the position */}\n<Indicators count={5} activeIndex={index} onIndexChange={setIndex} />",
    );
    expect(indicatorsPlaygroundSnippet({ count: 3, orientation: "vertical", showLabel: true })).toContain(
      'count={3} activeIndex={index} onIndexChange={setIndex} orientation="vertical" showLabel',
    );
  });

  it.each([{}, { size: "lg", variant: "secondary", threshold: -1, label: "Top" }])("BackToTop %j is a real snippet", (args) => {
    expect(problemsIn(backToTopPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("BackToTop is just the component until a prop differs", () => {
    expect(backToTopPlaygroundSnippet({ size: "md", variant: "primary", threshold: 400, label: "Back to top" })).toBe("<BackToTop />");
    expect(backToTopPlaygroundSnippet({ threshold: -1 })).toBe("<BackToTop threshold={-1} />");
  });

  it.each([{}, { open: true, opacity: 80, blur: true, inPortal: false }])("Backdrop %j is a real snippet", (args) => {
    expect(problemsIn(backdropPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Backdrop always shows the Backdrop, wired to the reader's state", () => {
    expect(backdropPlaygroundSnippet({ open: false, opacity: 60, blur: false, inPortal: true })).toBe(
      "{/* const [isOpen, setIsOpen] = useState(false); */}\n<Backdrop open={isOpen} onClick={() => setIsOpen(false)} />",
    );
    expect(backdropPlaygroundSnippet({ opacity: 80, blur: true, inPortal: false })).toContain("opacity={80} blur inPortal={false}");
  });

  it.each([
    {},
    { children: "Body", defaultOpen: true, disabled: true, orientation: "horizontal", trigger: "Button trigger" },
    { trigger: "None (externally driven)" },
  ])("Collapse %j is a real snippet", (args) => {
    expect(problemsIn(collapsePlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Collapse turns the trigger control's option key back into a trigger (or none), and writes only what differs", () => {
    expect(collapsePlaygroundSnippet({ trigger: "Button trigger", defaultOpen: false, disabled: false, orientation: "vertical" })).toBe(
      '<Collapse trigger={<Button variant="secondary">Toggle details</Button>}>\n  <Text>Hidden content revealed on toggle.</Text>\n</Collapse>',
    );
    expect(collapsePlaygroundSnippet({ trigger: "None (externally driven)" })).not.toContain("trigger=");
    // The stories that always render a button say so, whatever the (stripped) control holds.
    expect(collapsePlaygroundSnippet({ trigger: undefined, defaultOpen: true }, true)).toContain('trigger={<Button variant="secondary">Toggle details</Button>} defaultOpen');
    expect(collapsePlaygroundSnippet({ trigger: "Button trigger", orientation: "horizontal" })).toContain('orientation="horizontal"');
  });

  it.each([
    {},
    { content: "Delete", children: "Icon-only trigger", side: "left", align: "end", delayDuration: 0, disableHoverableContent: true, hideArrow: true, defaultOpen: true, "aria-label": "Help" },
  ])("Tooltip %j is a real snippet", (args) => {
    expect(problemsIn(tooltipPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Tooltip writes only what differs, and knows its trigger from the control's option key", () => {
    expect(tooltipPlaygroundSnippet({ content: "Save your changes", children: "Button trigger", side: "top", align: "center", delayDuration: 400 })).toBe(
      '<Tooltip content="Save your changes">\n  <Button variant="secondary">Hover or focus me</Button>\n</Tooltip>',
    );
    const icon = tooltipPlaygroundSnippet({ content: "Delete item", children: "Icon-only trigger" });
    expect(icon).toContain("<IconButton icon={TrashIcon}");
    expect(icon).toContain("TrashIcon comes from @dbm-design-system/icons");
    expect(tooltipPlaygroundSnippet({ content: "Save", children: "Icon-only trigger" }, "save")).toContain("<Button>Save</Button>");
    expect(tooltipPlaygroundSnippet({ content: "x", delayDuration: 0, hideArrow: true })).toContain("delayDuration={0} hideArrow");
  });

  it.each([{}, { children: "Loading data", fallback: "Please wait" }, { fallback: "" }])("ClientOnly %j is a real snippet", (args) => {
    expect(problemsIn(clientOnlyPlaygroundSnippet(args))).toEqual([]);
  });

  it("ClientOnly writes a fallback only when there is one", () => {
    expect(clientOnlyPlaygroundSnippet({ children: "Body", fallback: "" })).toBe("<ClientOnly>\n  <Text>Body</Text>\n</ClientOnly>");
    expect(clientOnlyPlaygroundSnippet({ children: "Body", fallback: "Loading…" })).toBe(
      '<ClientOnly fallback={<Text color="secondary">Loading…</Text>}>\n  <Text>Body</Text>\n</ClientOnly>',
    );
  });

  it.each([{}, { trapped: true, loop: true, asChild: true }])("FocusTrap %j is a real snippet", (args) => {
    expect(problemsIn(focusTrapPlaygroundSnippet(args))).toEqual([]);
  });

  it("FocusTrap writes only the props that are on", () => {
    expect(focusTrapPlaygroundSnippet({ trapped: false, loop: false, asChild: false }).startsWith("<FocusTrap>\n")).toBe(true);
    expect(focusTrapPlaygroundSnippet({ trapped: true, loop: true })).toContain("<FocusTrap trapped loop>");
  });

  it.each([{}, { disablePortal: true }, { disablePortal: false, asChild: true }])("Portal %j is a real snippet", (args) => {
    expect(problemsIn(portalPlaygroundSnippet(args))).toEqual([]);
  });

  it("Portal writes only the props that are on, and says where it renders by default", () => {
    expect(portalPlaygroundSnippet({ disablePortal: true })).toBe("<Portal disablePortal>\n  <span>Portaled content</span>\n</Portal>");
    expect(portalPlaygroundSnippet({})).toContain("document.body");
  });

  it.each([{}, { children: "Skip to content", focusable: true }])("VisuallyHidden %j is a real snippet", (args) => {
    expect(problemsIn(visuallyHiddenPlaygroundSnippet(args))).toEqual([]);
  });

  it("VisuallyHidden writes the text, and `focusable` only when it's on", () => {
    expect(visuallyHiddenPlaygroundSnippet({ children: "Hidden", focusable: false })).toBe("<VisuallyHidden>Hidden</VisuallyHidden>");
    expect(visuallyHiddenPlaygroundSnippet({ children: "Hidden", focusable: true })).toBe("<VisuallyHidden focusable>Hidden</VisuallyHidden>");
  });
});

describe("Playground snippets for the eight typography atoms", () => {
  it("the shared helpers: entities in text, safe attribute quoting, and a truncate text field read as a number", () => {
    expect(escapeJsxText("a < b && {c}")).toBe("a &lt; b &amp;&amp; &#123;c&#125;");
    expect(quote("plain")).toBe('"plain"');
    expect(quote('say "hi"')).toBe('{"say \\"hi\\""}');
    expect(quote("a & b")).toBe('{"a & b"}');
    expect(truncateValue("")).toBeUndefined();
    expect(truncateValue(" ")).toBeUndefined();
    expect(truncateValue("2")).toBe(2);
    expect(truncateValue(3)).toBe(3);
    expect(truncateValue(0)).toBeUndefined();
    expect(truncateValue("nope")).toBeUndefined();
    expect(truncateValue(undefined)).toBeUndefined();
  });

  it.each([
    {},
    { children: "Quote", variant: "pull-quote", attribution: "Someone", cite: "https://example.com/x" },
    { children: "A < B & C", attribution: 'A "quoted" name' },
  ])("Blockquote %j is a real snippet", (args) => {
    expect(problemsIn(blockquotePlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Blockquote writes only what differs, and swaps the stories' own source URL for a neutral one", () => {
    expect(blockquotePlaygroundSnippet({ children: "Quote", variant: "default", attribution: undefined, cite: undefined })).toBe("<Blockquote>\n  Quote\n</Blockquote>");
    expect(blockquotePlaygroundSnippet({ children: "Q", variant: "pull-quote", attribution: "Steve Jobs", cite: "https://en.wikiquote.org/wiki/Steve_Jobs" })).toBe(
      '<Blockquote variant="pull-quote" attribution="Steve Jobs" cite="https://example.com/quotes/design">\n  Q\n</Blockquote>',
    );
    expect(blockquotePlaygroundSnippet({ children: "Q", cite: "https://example.org/mine" })).toContain('cite="https://example.org/mine"');
  });

  it.each([{}, { children: "pnpm dev" }, { children: "a < b" }])("Code %j is a real snippet", (args) => {
    expect(problemsIn(codePlaygroundSnippet(args))).toEqual([]);
  });

  it("Code writes the text as an inline Code", () => {
    expect(codePlaygroundSnippet({ children: "pnpm install" })).toBe("<Code>pnpm install</Code>");
    expect(codePlaygroundSnippet({ children: "a < b" })).toBe("<Code>a &lt; b</Code>");
  });

  it.each([{}, { children: "Esc", "aria-label": "Escape" }, { children: "⌘", "aria-label": 'The "Command" key' }])("Kbd %j is a real snippet", (args) => {
    expect(problemsIn(kbdPlaygroundSnippet(args))).toEqual([]);
  });

  it("Kbd writes an aria-label only when there is one", () => {
    expect(kbdPlaygroundSnippet({ children: "Esc", "aria-label": "" })).toBe("<Kbd>Esc</Kbd>");
    expect(kbdPlaygroundSnippet({ children: "Esc", "aria-label": "Escape" })).toBe('<Kbd aria-label="Escape">Esc</Kbd>');
  });

  it.each([
    {},
    { children: "Find design", query: "design", tone: "danger", caseSensitive: true },
    { children: "Design and agents", query: ["design", "agent"], tone: "info" },
    { children: "x", query: "" },
  ])("Highlight %j is a real snippet", (args) => {
    expect(problemsIn(highlightPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Highlight writes only what differs, a single query as a string and several as an array", () => {
    expect(highlightPlaygroundSnippet({ children: "x", tone: "warning", caseSensitive: false })).toBe("<Highlight>x</Highlight>");
    expect(highlightPlaygroundSnippet({ children: "x", query: "design" })).toBe('<Highlight query="design">x</Highlight>');
    expect(highlightPlaygroundSnippet({ children: "x", query: ["design", "agent"], tone: "info", caseSensitive: true })).toBe(
      '<Highlight query={["design", "agent"]} tone="info" caseSensitive>x</Highlight>',
    );
    expect(highlightPlaygroundSnippet({ children: "x", query: [""] })).toBe("<Highlight>x</Highlight>");
  });

  it.each([
    {},
    { href: "/docs", children: "Docs", external: false, underline: "always", disabled: false, "aria-label": "" },
    { href: "https://example.com/?a=1&b=2", children: "Out", external: false, underline: "none", disabled: true, "aria-label": 'Go to "Out"' },
  ])("Link %j is a real snippet", (args) => {
    expect(problemsIn(linkPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Link writes only what differs, and `external` only where it changes the auto-detection from the href", () => {
    expect(linkPlaygroundSnippet({ href: "/docs", children: "Documentation", external: false, underline: "always", disabled: false, "aria-label": "" })).toBe(
      '<Link href="/docs">Documentation</Link>',
    );
    expect(linkPlaygroundSnippet({ href: "/download", children: "x", external: true })).toBe('<Link href="/download" external>x</Link>');
    expect(linkPlaygroundSnippet({ href: "https://example.com", children: "x", external: true })).toBe('<Link href="https://example.com">x</Link>');
    expect(linkPlaygroundSnippet({ href: "https://example.com", children: "x", external: false })).toBe('<Link href="https://example.com" external={false}>x</Link>');
    expect(linkPlaygroundSnippet({ href: "//cdn.example.com/a", children: "x", external: false })).toContain("external={false}");
    expect(linkPlaygroundSnippet({ href: "/docs", children: "x", underline: "hover", disabled: true })).toBe('<Link href="/docs" underline="hover" disabled>x</Link>');
  });

  it.each([{}, { children: "Inbox", interactive: true, selected: true, disabled: true, "aria-label": "Inbox" }])("ListItem %j is a real snippet", (args) => {
    expect(problemsIn(listItemPlaygroundSnippet(args))).toEqual([]);
  });

  it("ListItem sits in the List it needs, and an interactive one gets the handler it needs", () => {
    expect(listItemPlaygroundSnippet({ children: "One", interactive: false, selected: false, disabled: false, "aria-label": "" })).toBe(
      "<List>\n  <ListItem>One</ListItem>\n</List>",
    );
    const interactive = listItemPlaygroundSnippet({ children: "Home", interactive: true, selected: true });
    expect(interactive).toContain("<ListItem interactive selected onClick={handleClick}>Home</ListItem>");
    expect(interactive).toContain("handleClick is yours");
  });

  it.each([
    {},
    { children: "Title", level: 1 },
    { children: "Title", level: 3, size: "xl", align: "center", weight: "medium", color: "secondary", fontFamily: "primary", wrap: "balance", trim: "both", truncate: "2", as: "div" },
  ])("Heading %j is a real snippet", (args) => {
    expect(problemsIn(headingPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Heading writes only what differs, and `size` only where it isn't the level's own default", () => {
    expect(headingPlaygroundSnippet({ children: "Design builds meaning", level: 2, size: "4xl", align: "start", weight: "bold", color: "primary", fontFamily: "secondary", wrap: "wrap", truncate: "" })).toBe(
      "<Heading>Design builds meaning</Heading>",
    );
    expect(headingPlaygroundSnippet({ children: "x", level: 3, size: "3xl" })).toBe("<Heading level={3}>x</Heading>");
    expect(headingPlaygroundSnippet({ children: "x", level: 1, size: "5xl" })).toBe("<Heading level={1}>x</Heading>");
    expect(headingPlaygroundSnippet({ children: "x", level: 2, size: "xl" })).toBe('<Heading size="xl">x</Heading>');
    expect(headingPlaygroundSnippet({ children: "x", level: 3, size: "3xl", truncate: "2", trim: "start" })).toBe('<Heading level={3} trim="start" truncate={2}>x</Heading>');
    expect(headingPlaygroundSnippet({ children: "x", as: "div", level: 3, size: "lg" })).toBe('<Heading as="div" level={3} size="lg">x</Heading>');
  });

  it.each([
    {},
    { children: "Body", size: "lg", align: "end", weight: "semibold", color: "danger", fontFamily: "secondary", wrap: "pretty", truncate: 3, as: "label" },
  ])("Text %j is a real snippet", (args) => {
    expect(problemsIn(textPlaygroundSnippet(args as never))).toEqual([]);
  });

  it("Text writes only what differs (p, base, start, regular, primary, primary, wrap)", () => {
    expect(textPlaygroundSnippet({ children: "Design builds meaning", size: "base", align: "start", weight: "regular", color: "primary", fontFamily: "primary", wrap: "wrap", truncate: "" })).toBe(
      "<Text>Design builds meaning</Text>",
    );
    expect(textPlaygroundSnippet({ children: "x", size: "lg", as: "span", truncate: "2" })).toBe('<Text as="span" size="lg" truncate={2}>x</Text>');
    expect(textPlaygroundSnippet({ children: "x", as: "p" })).toBe("<Text>x</Text>");
  });
});

describe("icon controls: Storybook's snippet transform is handed the control's option key, not the mapped component", () => {
  // For a control with a `mapping` (`{ Star: StarIcon }`), `context.args` holds `"Star"`. A builder
  // that only recognised the component silently dropped the icon (found on FieldError's "Without
  // icon" story, whose snippet came out identical to the Playground's).
  it("Button", () => {
    expect(buttonPlaygroundSnippet({ children: "Pay", leadingIcon: "Wallet", trailingIcon: "ArrowRight" })).toBe(
      "<Button leadingIcon={WalletIcon} trailingIcon={ArrowRightIcon}>Pay</Button>",
    );
    expect(buttonPlaygroundSnippet({ children: "Pay", leadingIcon: "None", trailingIcon: "Nonsense" })).toBe("<Button>Pay</Button>");
  });

  it("IconButton — and an unknown key still gives the required icon a name", () => {
    expect(iconButtonPlaygroundSnippet({ icon: "Trash", "aria-label": "Delete" })).toBe('<IconButton icon={TrashIcon} aria-label="Delete" />');
    expect(iconButtonPlaygroundSnippet({ icon: "Heart" })).toContain("icon={HeartIcon}");
    expect(iconButtonPlaygroundSnippet({ icon: "Nonsense" })).toContain("icon={HeartIcon}");
  });

  it("Checkbox", () => {
    expect(checkboxPlaygroundSnippet({ children: "x", icon: "Star", indeterminateIcon: "X" })).toBe(
      "<Checkbox icon={StarIcon} indeterminateIcon={XIcon}>x</Checkbox>",
    );
    expect(checkboxPlaygroundSnippet({ children: "x", icon: "Default", indeterminateIcon: "Default" })).toBe("<Checkbox>x</Checkbox>");
  });

  it("Switch", () => {
    expect(switchPlaygroundSnippet({ children: "Dark", checkedIcon: "Moon", uncheckedIcon: "Sun" })).toBe(
      "<Switch checkedIcon={MoonIcon} uncheckedIcon={SunIcon}>Dark</Switch>",
    );
    expect(switchPlaygroundSnippet({ children: "x", checkedIcon: "None", uncheckedIcon: "None" })).toBe("<Switch>x</Switch>");
  });

  it("FieldError — Default is nothing, Hidden is icon={false}, a name is that icon", () => {
    expect(fieldErrorPlaygroundSnippet({ children: "Bad", icon: "Default" })).toBe("<FieldError>Bad</FieldError>");
    expect(fieldErrorPlaygroundSnippet({ children: "Bad", icon: "Hidden" })).toBe("<FieldError icon={false}>Bad</FieldError>");
    expect(fieldErrorPlaygroundSnippet({ children: "Bad", icon: "Star" })).toBe("<FieldError icon={StarIcon}>Bad</FieldError>");
    expect(fieldErrorPlaygroundSnippet({ children: "Bad", icon: "Heart" })).toBe("<FieldError icon={HeartIcon}>Bad</FieldError>");
  });

  it("Tag", () => {
    expect(tagPlaygroundSnippet({ children: "Design", leadingIcon: "Tag", trailingIcon: "CheckCircle" })).toBe(
      "<Tag leadingIcon={TagIcon} trailingIcon={CheckCircleIcon}>Design</Tag>",
    );
    expect(tagPlaygroundSnippet({ children: "Design", leadingIcon: "None", trailingIcon: "None" })).toBe("<Tag>Design</Tag>");
  });
});
