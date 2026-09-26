import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { send } from "./browserProtocol";
import { Text } from "../../atoms/Text";
import { CodeBlock } from "./CodeBlock";
import { codeBlockPlaygroundSnippet, codeBlockSnippets, highlightLinesFromText } from "./CodeBlock.snippets";
import type { CodeBlockProps } from "./CodeBlock.types";

/** Demo source text for the stories; not part of the component. */
const samples = {
  tsx: `import { Button } from "@dbm-design-system/components";

export function SaveButton({ onSave }: { onSave: () => void }) {
  // Sends the form, then confirms.
  return (
    <Button variant="primary" onClick={onSave}>
      Save changes
    </Button>
  );
}`,
  ts: `export function total(items: Array<{ price: number }>): number {
  // Add up every price, ignoring anything that isn't a number.
  return items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
}`,
  json: `{
  "name": "@dbm-design-system/components",
  "version": "1.0.0",
  "private": false,
  "sideEffects": ["**/*.css"],
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18"
  },
  "scripts": { "build": "tsup", "test": "vitest run" }
}`,
  css: `@media (min-width: 640px) {
  .card {
    color: var(--dbm-text-primary); /* the default text */
    padding: 1.5rem 2rem !important;
    background: #f7faff;
  }
}`,
  html: `<!-- A labelled search field -->
<label for="q">Search</label>
<input id="q" type="search" placeholder="Search &amp; filter" disabled />`,
  bash: `# Install, then run the tests
$ pnpm add @dbm-design-system/components
if [ -f "$HOME/.npmrc" ]; then echo "found ${"$"}{HOME}"; fi`,
  diff: `diff --git a/Card.tsx b/Card.tsx
--- a/Card.tsx
+++ b/Card.tsx
@@ -1,3 +1,3 @@
-const size = 'md';
+const size = 'lg';
 export { size };`,
  longLine: `curl --request POST --url https://api.example.com/v1/projects/12345/members --header 'Authorization: Bearer <token>' --header 'Content-Type: application/json' --data '{"role":"editor","notify":true}'`,
  log: `2026-09-26 10:14:02 INFO  server listening on :3000
2026-09-26 10:14:09 WARN  slow request GET /reports (2.4s)
2026-09-26 10:14:11 ERROR connection reset by peer`,
} as const;

// The Playground's own args: every `CodeBlock` prop a control can drive, plus one Storybook-only text field.
interface PlaygroundArgs extends CodeBlockProps {
  /** Storybook only — the highlighted lines as typed: single lines and ranges, `2, 4-6`. */
  highlight: string;
}

const noControls = { control: false } as const;

/** The block under test: the args, with the typed highlight list turned into `highlightLines`. */
const DemoBlock = ({ highlight, maxHeight, highlightLines, ...args }: PlaygroundArgs) => (
  <CodeBlock {...args} maxHeight={maxHeight || undefined} highlightLines={highlightLinesFromText(highlight) ?? highlightLines} />
);

const stack = { display: "flex", flexDirection: "column", gap: "var(--dbm-space-5)" } as const;

const meta: Meta<PlaygroundArgs> = {
  title: "Molecules/Typography/CodeBlock",
  component: CodeBlock,
  parameters: { layout: "padded" },
  // Content first, then core visual props, then behavioral/state props, then advanced/escape-hatch props last —
  // the same sequencing as every other component's stories file (07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    code: {
      control: "text",
      description: "The source text to show. Drawn as text, never as HTML, and exactly what the copy button copies. One trailing newline is dropped.",
    },
    language: {
      control: "select",
      options: ["ts", "tsx", "js", "jsx", "json", "css", "html", "bash", "diff", "text"],
      description: "The language to highlight it as. ts, tsx, js, jsx, json, css, html, bash and diff have a grammar; any other value, or none, draws plain text. Shown as a label in the header.",
    },
    title: {
      control: "text",
      description: "A heading for the block, usually a file name. Shown in the header and used as the block's accessible name.",
    },
    showLineNumbers: {
      control: "boolean",
      description: "Numbers the lines, in a gutter that is not selected or copied.",
      table: { defaultValue: { summary: "false" } },
    },
    startLine: {
      control: { type: "number", min: -99, max: 999 },
      description: "The number shown on the first line, for an excerpt from further down a file. highlightLines counts from it too.",
      table: { defaultValue: { summary: "1" } },
    },
    highlight: {
      control: "text",
      description: "Storybook only — not a CodeBlock prop. The lines to highlight as you would type them: single lines and ranges, like 2, 4-6. CodeBlock's own prop is highlightLines, an array such as [2, \"4-6\"].",
      table: { disable: true },
    },
    highlightLines: {
      ...noControls,
      description: "Lines to draw attention to, by the numbers shown: single lines and ranges, [2, \"4-6\"]. Drawn with a band and an edge accent, both in addition to colour. Numbers outside the code are ignored.",
    },
    wrap: {
      control: "boolean",
      description: "Wraps long lines instead of scrolling sideways. A wrapped line continues under its own text, not under its line number.",
      table: { defaultValue: { summary: "false" } },
    },
    maxHeight: {
      control: "text",
      description: "The tallest the code may grow before it scrolls, as a CSS length (24rem). Empty means no limit. A collapsible block uses it once expanded.",
    },
    collapsible: {
      control: "boolean",
      description: "Shows only the first collapsedLines lines, with a button to reveal the rest. No effect on a block that is no longer than that. Everything stays in the page, and the copy button copies all of it.",
      table: { defaultValue: { summary: "false" } },
    },
    collapsedLines: {
      control: { type: "number", min: 1, max: 40 },
      description: "How many lines a collapsed block shows. A line that wraps still counts as one, however many rows it takes.",
      table: { defaultValue: { summary: "10" } },
    },
    expanded: {
      ...noControls,
      description: "Whether a collapsible block is expanded (controlled). Use with onExpandedChange.",
    },
    defaultExpanded: {
      control: "boolean",
      description: "Whether a collapsible block starts expanded (uncontrolled).",
      table: { defaultValue: { summary: "false" } },
    },
    onExpandedChange: {
      ...noControls,
      description: "Called when the expand or collapse button is pressed, with the new state.",
    },
    copyable: {
      control: "boolean",
      description: "Shows a button that copies the code to the clipboard, and announces the result to screen readers.",
      table: { defaultValue: { summary: "true" } },
    },
    stripPrompt: {
      control: "boolean",
      description:
        "For shell code, takes a leading \"$ \" prompt off each line that has one when the code is copied, so a command shown as \"$ pnpm add x\" pastes as \"pnpm add x\". The prompt is still drawn. Lines without a prompt are copied as they are. false copies the code exactly as written.",
      table: { defaultValue: { summary: "true" } },
    },
    copiedDuration: {
      control: { type: "number", min: 0, max: 10000, step: 500 },
      description: "How long, in milliseconds, the copy button shows its check mark (or its warning, if copying failed) before going back.",
      table: { defaultValue: { summary: "2000" } },
    },
    onCopied: {
      ...noControls,
      description: "Called after the copy button has copied the code, with the code. Not called if the copy failed. (The native onCopy is a different thing: it fires when the reader copies a selection.)",
    },
    labels: {
      ...noControls,
      description:
        "The words the block writes itself; translate them here. Give only the ones you change: copy (\"Copy code\"), copied, copyFailed, expand (a function of the number of hidden lines), collapse (\"Show less\"), highlighted (a function of how many lines a highlight covers, said in front of it for screen readers) and region (\"Code\").",
    },
    "aria-label": {
      control: "text",
      description: "Names the block for assistive tech, in place of title. Also names the scrollable region while the code overflows.",
    },
    "aria-labelledby": {
      ...noControls,
      description: "The id of an already-visible element that names the block, in place of aria-label or title.",
    },
    "aria-describedby": { ...noControls, description: "The id of a description of the block." },
    id: { ...noControls, description: "Standard DOM id." },
    className: { ...noControls, description: "Additional CSS classes for customization." },
    style: { ...noControls, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": { ...noControls, description: "Test identifier for automated testing, on the block." },
  },
  // Every controllable prop gets an explicit value here, matching its real default; the source and language
  // start on a small TSX example, which has no default of its own.
  args: {
    code: samples.tsx,
    language: "tsx",
    title: "",
    showLineNumbers: false,
    startLine: 1,
    highlight: "",
    wrap: false,
    maxHeight: "",
    collapsible: false,
    collapsedLines: 10,
    defaultExpanded: false,
    copyable: true,
    stripPrompt: true,
    copiedDuration: 2000,
    "aria-label": "Example code",
  },
  render: (args) => <DemoBlock {...args} />,
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

const playgroundSource = {
  docs: {
    source: {
      type: "dynamic" as const,
      transform: (_code: string, context: StoryContext) => codeBlockPlaygroundSnippet(context.args),
    },
  },
};

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: playgroundSource,
};

export const Languages: Story = {
  parameters: { docs: { source: { code: codeBlockSnippets.languages } } },
  args: {},
  argTypes: { code: noControls, language: noControls, title: noControls, "aria-label": noControls },
  render: (args) => (
    <div style={stack}>
      {(["ts", "tsx", "json", "css", "html", "bash", "diff"] as const).map((language) => (
        <DemoBlock key={language} {...args} code={samples[language]} language={language} title="" aria-label={`${language} example`} />
      ))}
    </div>
  ),
};

export const WithTitle: Story = {
  name: "With a title",
  parameters: { docs: { source: { code: codeBlockSnippets.title } } },
  args: { title: "SaveButton.tsx" },
  argTypes: { title: noControls, "aria-label": noControls },
  render: (args) => <DemoBlock {...args} aria-label="" />,
};

export const LineNumbers: Story = {
  name: "Line numbers",
  parameters: { docs: { source: { code: codeBlockSnippets.lineNumbers } } },
  args: { showLineNumbers: true },
  argTypes: { showLineNumbers: noControls },
};

export const HighlightedLines: Story = {
  name: "Highlighted lines",
  parameters: { docs: { source: { code: codeBlockSnippets.highlightLines } } },
  args: { showLineNumbers: true, highlight: "2, 4-6" },
  argTypes: { highlight: noControls, showLineNumbers: noControls },
};

export const Excerpt: Story = {
  name: "An excerpt, from line 42",
  parameters: { docs: { source: { code: codeBlockSnippets.startLine } } },
  args: { code: samples.ts, language: "ts", showLineNumbers: true, startLine: 42, highlight: "44" },
  argTypes: { code: noControls, language: noControls, highlight: noControls, showLineNumbers: noControls, startLine: noControls },
};

export const Wrapped: Story = {
  name: "Wrapped long lines",
  parameters: { docs: { source: { code: codeBlockSnippets.wrap } } },
  args: { code: samples.longLine, language: "bash", wrap: true, showLineNumbers: true },
  argTypes: { code: noControls, language: noControls, wrap: noControls, showLineNumbers: noControls },
  render: (args) => (
    <div style={{ maxWidth: "32rem" }}>
      <DemoBlock {...args} />
    </div>
  ),
};

export const Scrolling: Story = {
  name: "Long lines that scroll",
  parameters: { docs: { source: { code: codeBlockSnippets.plain } } },
  args: { code: samples.longLine, language: "bash", wrap: false, title: "request.sh" },
  argTypes: { code: noControls, language: noControls, wrap: noControls },
  render: (args) => (
    <div style={{ maxWidth: "32rem" }}>
      <DemoBlock {...args} aria-label="" />
    </div>
  ),
};

export const Collapsible: Story = {
  parameters: { docs: { source: { code: codeBlockSnippets.collapsible } } },
  args: { code: samples.json, language: "json", collapsible: true, collapsedLines: 6 },
  argTypes: { code: noControls, language: noControls, collapsible: noControls, collapsedLines: noControls, expanded: noControls },
};

// A story with state of its own: the parent owns `expanded`. The snippet says so in a comment.
const ControlledBlock = (args: PlaygroundArgs) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={stack}>
      <DemoBlock {...args} expanded={expanded} onExpandedChange={setExpanded} />
      <Text size="sm">The block is {expanded ? "expanded" : "collapsed"}.</Text>
    </div>
  );
};

export const Controlled: Story = {
  name: "Collapsible, controlled",
  parameters: { docs: { source: { code: codeBlockSnippets.controlled } } },
  args: { code: samples.json, language: "json", collapsible: true, collapsedLines: 4 },
  argTypes: { code: noControls, language: noControls, collapsible: noControls, collapsedLines: noControls, expanded: noControls, defaultExpanded: noControls },
  render: ({ expanded: _expanded, ...args }) => <ControlledBlock {...args} />,
};

export const MaxHeight: Story = {
  name: "A tallest height",
  parameters: { docs: { source: { code: codeBlockSnippets.maxHeight } } },
  args: { code: samples.json, language: "json", maxHeight: "10rem", title: "package.json" },
  argTypes: { code: noControls, language: noControls, maxHeight: noControls },
  render: (args) => <DemoBlock {...args} aria-label="" />,
};

export const CopyButton: Story = {
  name: "The copy button",
  parameters: { docs: { source: { code: codeBlockSnippets.copy } } },
  args: { code: "pnpm add @dbm-design-system/components", language: "bash" },
  argTypes: { code: noControls, language: noControls, copyable: noControls, onCopied: noControls },
  render: (args) => (
    <div style={stack}>
      <DemoBlock {...args} copyable aria-label="With a copy button" />
      <DemoBlock {...args} copyable={false} aria-label="Without a copy button" />
    </div>
  ),
};

export const ShellPrompt: Story = {
  name: "Shell commands: the prompt is not copied",
  parameters: { docs: { source: { code: codeBlockSnippets.prompt } } },
  args: { code: "$ pnpm add @dbm-design-system/components\n$ pnpm test", language: "bash" },
  argTypes: { code: noControls, language: noControls, "aria-label": noControls },
  render: (args) => <DemoBlock {...args} aria-label="Install and test" />,
};

export const PlainText: Story = {
  name: "Plain text",
  parameters: { docs: { source: { code: codeBlockSnippets.plain } } },
  args: { code: samples.log, language: "", title: "output.log" },
  argTypes: { code: noControls, language: noControls, title: noControls, "aria-label": noControls },
  render: (args) => <DemoBlock {...args} aria-label="" />,
};

export const Translated: Story = {
  name: "Translated words",
  parameters: { docs: { source: { code: codeBlockSnippets.translated } } },
  args: { code: samples.json, language: "json", collapsible: true, collapsedLines: 3 },
  argTypes: { code: noControls, language: noControls, collapsible: noControls, collapsedLines: noControls, labels: noControls },
  render: (args) => (
    <DemoBlock
      {...args}
      labels={{
        copy: "Copier le code",
        copied: "Copié",
        copyFailed: "Échec de la copie",
        expand: (count) => `Afficher ${count} lignes de plus`,
        collapse: "Réduire",
      }}
    />
  ),
};

export const RightToLeft: Story = {
  name: "Right to left",
  parameters: { docs: { source: { code: codeBlockSnippets.rtl } } },
  args: { code: samples.ts, language: "ts", title: "مثال.ts", showLineNumbers: true },
  argTypes: { code: noControls, language: noControls, title: noControls, showLineNumbers: noControls, "aria-label": noControls },
  render: (args) => (
    <div dir="rtl">
      <DemoBlock {...args} aria-label="" />
    </div>
  ),
};

export const LabelledBy: Story = {
  name: "Named by a visible label",
  parameters: { docs: { source: { code: codeBlockSnippets.labelled } } },
  args: { code: "pnpm add @dbm-design-system/components", language: "bash" },
  argTypes: { code: noControls, language: noControls, "aria-label": noControls, "aria-labelledby": noControls },
  render: ({ "aria-label": _label, ...args }) => (
    <div style={{ ...stack, gap: "var(--dbm-space-2)" }}>
      <Text id="install-label" size="sm" weight="semibold">
        Install
      </Text>
      <DemoBlock {...args} aria-labelledby="install-label" />
    </div>
  ),
};

// ---------------------------------------------------------------------------------------------------------
// The stories below are hidden from the sidebar and the Docs page (`!dev`) but still run as tests. Everything
// they check is what only a real browser computes: layout, the cascade, selection, real focus and contrast.

const rect = (element: Element) => element.getBoundingClientRect();
const px = (value: string) => Number.parseFloat(value);
const linesOf = (root: ParentNode) => [...root.querySelectorAll<HTMLElement>("span[data-line]")];
const resolveLength = (token: string) => {
  const probe = document.createElement("span");
  probe.style.display = "block";
  probe.style.width = `var(${token})`;
  document.body.appendChild(probe);
  const width = probe.getBoundingClientRect().width;
  probe.remove();
  return width;
};
const resolveColor = (token: string) => {
  const probe = document.createElement("span");
  probe.style.color = `var(${token})`;
  document.body.appendChild(probe);
  const colour = getComputedStyle(probe).color;
  probe.remove();
  return colour;
};
/** Relative luminance and contrast ratio from computed `rgb(...)` strings (WCAG 2.x). */
const channels = (colour: string) => (colour.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
const luminance = (colour: string) => {
  const [r = 0, g = 0, b = 0] = channels(colour).map((value) => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

export const TokenContrastInteraction: Story = {
  ...Playground,
  name: "Interaction: every syntax colour is AA on the block and on a highlighted line (this theme)",
  tags: ["!dev"],
  render: () => (
    <div style={stack}>
      {(["tsx", "ts", "json", "css", "html", "bash", "diff"] as const).map((language) => (
        <div key={language} data-testid={language}>
          <CodeBlock code={samples[language]} language={language} aria-label={language} highlightLines={[2, "4-5"]} showLineNumbers />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const seen = new Set<string>();
    for (const language of ["tsx", "ts", "json", "css", "html", "bash", "diff"]) {
      const block = within(canvasElement).getByTestId(language);
      const root = block.firstElementChild as HTMLElement;
      const background = getComputedStyle(root).backgroundColor;
      const band = resolveColor("--dbm-bg-code-highlight");
      for (const line of linesOf(block)) {
        const isHighlighted = line.dataset.highlighted === "true";
        for (const token of line.querySelectorAll<HTMLElement>(":scope > span")) {
          const colour = getComputedStyle(token).color;
          seen.add(colour);
          await expect(contrast(colour, isHighlighted ? band : background)).toBeGreaterThanOrEqual(4.5);
        }
        // The line's own uncoloured text and its number are checked as well.
        await expect(contrast(getComputedStyle(line).color, isHighlighted ? band : background)).toBeGreaterThanOrEqual(4.5);
        await expect(contrast(getComputedStyle(line, "::before").color, isHighlighted ? band : background)).toBeGreaterThanOrEqual(4.5);
        if (isHighlighted) await expect(getComputedStyle(line).backgroundColor).toBe(band);
      }
    }
    // Ten kinds of token, and every kind actually drew somewhere in the samples above.
    await expect(seen.size).toBeGreaterThanOrEqual(8);
  },
};

// The same check pinned to each of the other three themes, since a colour that passes on purple light says
// nothing about emerald dark.
const themedContrast = (brand: "purple" | "emerald", mode: "light" | "dark"): Story => ({
  ...TokenContrastInteraction,
  name: `Interaction: syntax colours are AA in ${brand} ${mode}`,
  globals: { brand, mode },
  play: async (context) => {
    await expect(document.documentElement.dataset.mode ?? mode).toBe(mode);
    await TokenContrastInteraction.play?.(context);
  },
});
export const TokenContrastPurpleDark: Story = themedContrast("purple", "dark");
export const TokenContrastEmeraldLight: Story = themedContrast("emerald", "light");
export const TokenContrastEmeraldDark: Story = themedContrast("emerald", "dark");

export const LineNumbersInteraction: Story = {
  ...Playground,
  name: "Interaction: a wrapped line continues under its own text, and the numbers are not selected",
  tags: ["!dev"],
  render: () => (
    <div style={{ maxWidth: "24rem" }} data-testid="narrow">
      <CodeBlock code={`short\n${samples.longLine}\nend`} language="text" showLineNumbers wrap aria-label="Wrapped" startLine={9} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const block = within(canvasElement).getByTestId("narrow");
    const lines = linesOf(block);
    const [short, long, last] = lines as [HTMLElement, HTMLElement, HTMLElement];
    // The long line wraps onto several rows. Each row's first character is at the same x — under the text, past the
    // number — and that x is where the line's first row starts: two spacing steps and the gutter in from the line.
    const range = document.createRange();
    range.selectNodeContents(long);
    const rowStarts = new Map<number, number>();
    for (const box of range.getClientRects()) {
      if (box.width === 0) continue;
      const row = Math.round(box.top);
      rowStarts.set(row, Math.min(rowStarts.get(row) ?? Number.POSITIVE_INFINITY, box.left));
    }
    await expect(rowStarts.size).toBeGreaterThan(2);
    const firstX = [...rowStarts.values()][0] as number;
    for (const start of rowStarts.values()) await expect(Math.abs(start - firstX)).toBeLessThan(0.5);
    const gutter = px(getComputedStyle(long, "::before").width);
    await expect(Math.abs(firstX - (rect(long).left + 2 * resolveLength("--dbm-space-4") + gutter))).toBeLessThan(1);
    const boxes = [{ left: firstX }];
    // Every line's text starts at the same x, wrapped or not.
    const shortRange = document.createRange();
    shortRange.selectNodeContents(short);
    await expect(Math.abs(shortRange.getBoundingClientRect().left - boxes[0]!.left)).toBeLessThan(1);
    // The numbers are drawn by CSS and not selectable, so selecting the code gives only the code.
    await expect(getComputedStyle(short, "::before").userSelect).toBe("none");
    await expect(getComputedStyle(short, "::before").content).toContain('"9"');
    await expect(getComputedStyle(last, "::before").content).toContain('"11"');
    const selection = window.getSelection() as Selection;
    selection.selectAllChildren(block.querySelector("code") as Node);
    const copied = selection.toString().split("\n").filter(Boolean);
    await expect(copied).toEqual(["short", samples.longLine, "end"]);
    selection.removeAllRanges();
  },
};

export const HighlightInteraction: Story = {
  ...Playground,
  name: "Interaction: a highlighted line is a full-width band with an edge accent, and nothing shifts",
  tags: ["!dev"],
  render: () => (
    <div style={{ maxWidth: "20rem" }} data-testid="narrow">
      <CodeBlock code={samples.longLine.replace(/ --/g, "\n--")} language="bash" aria-label="Highlight" highlightLines={[2]} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const block = within(canvasElement).getByTestId("narrow");
    const [first, second] = linesOf(block) as [HTMLElement, HTMLElement];
    const frame = block.querySelector<HTMLElement>("pre")!.parentElement as HTMLElement;
    // Scrolls sideways, and the band runs the full width of the scrolled content, not just the visible part.
    await expect(frame.scrollWidth).toBeGreaterThan(frame.clientWidth);
    await expect(Math.abs(rect(second).width - frame.scrollWidth)).toBeLessThan(1);
    await expect(getComputedStyle(second).backgroundColor).toBe(resolveColor("--dbm-bg-code-highlight"));
    await expect(getComputedStyle(second).backgroundColor).not.toBe(getComputedStyle(block.firstElementChild as Element).backgroundColor);
    await expect(getComputedStyle(first).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    // The accent is in addition to colour: a 4px edge in the focus colour, transparent on the other lines.
    const accent = resolveLength("--dbm-border-width-4");
    await expect(px(getComputedStyle(second).borderInlineStartWidth)).toBe(accent);
    await expect(getComputedStyle(second).borderInlineStartColor).toBe(resolveColor("--dbm-border-focus"));
    await expect(getComputedStyle(first).borderInlineStartColor).toBe("rgba(0, 0, 0, 0)");
    // Highlighting changes no line's own text position.
    // Where the code starts: its first node, not the hidden cue a highlighted line begins with.
    const rangeOf = (line: HTMLElement) => {
      const start = [...line.childNodes].find((node) => !(node instanceof HTMLElement && node.className.includes("cue"))) as Node;
      const range = document.createRange();
      range.selectNodeContents(start);
      return range.getBoundingClientRect().left;
    };
    await expect(Math.abs(rangeOf(first) - rangeOf(second))).toBeLessThan(0.5);
  },
};

export const CollapseInteraction: Story = {
  ...Playground,
  name: "Interaction: a collapsed block is N lines tall, fades out, and its rest is clipped, not removed",
  tags: ["!dev"],
  render: () => (
    <div data-testid="block">
      <CodeBlock code={Array.from({ length: 20 }, (_, index) => `line ${index + 1}`).join("\n")} language="text" collapsible collapsedLines={5} aria-label="Collapsing" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const block = within(canvasElement).getByTestId("block");
    const frame = block.querySelector<HTMLElement>("pre")!.parentElement as HTMLElement;
    const lines = linesOf(block);
    const lineHeight = px(getComputedStyle(lines[0]!).lineHeight);
    const padding = resolveLength("--dbm-space-4");
    // Exactly five lines, plus the top padding: the bottom edge falls right after line five, so no part of a
    // sixth shows.
    await expect(Math.abs(rect(frame).height - (5 * lineHeight + padding))).toBeLessThan(1.5);
    await expect(rect(lines[5]!).top).toBeGreaterThanOrEqual(rect(frame).bottom - 0.5);
    // The rest is in the page but clipped, and the frame can't be scrolled to it by keyboard: it is not a tab stop.
    await expect(lines).toHaveLength(20);
    await expect(rect(lines[19]!).top).toBeGreaterThanOrEqual(rect(frame).bottom);
    await expect(frame).not.toHaveAttribute("tabindex");
    // A fade sits over the bottom of the code and does not take pointer events.
    const fade = block.querySelector<HTMLElement>("[aria-hidden='true']:empty")!;
    await expect(getComputedStyle(fade).pointerEvents).toBe("none");
    await expect(Math.abs(rect(fade).bottom - rect(frame).bottom)).toBeLessThan(1);
    // Expanding shows everything.
    await userEvent.click(within(block).getByRole("button", { name: "Show 15 more lines" }));
    await expect(rect(frame).height).toBeGreaterThan(15 * lineHeight);
    await expect(block.querySelector("[aria-hidden='true']:empty")).toBeNull();
    await expect(Math.abs(rect(lines[19]!).bottom - (rect(frame).bottom - padding))).toBeLessThan(1.5);
  },
};

export const CollapseWrapInteraction: Story = {
  ...Playground,
  name: "Interaction: a wrapped, collapsed block shows N whole lines, however many rows they wrap to",
  tags: ["!dev"],
  render: () => (
    <div style={{ maxWidth: "22rem" }} data-testid="narrow">
      <CodeBlock code={Array.from({ length: 6 }, (_, index) => `${index + 1}: ${samples.longLine}`).join("\n")} language="text" wrap collapsible collapsedLines={2} aria-label="Wrapped and collapsed" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const block = within(canvasElement).getByTestId("narrow");
    const frame = block.querySelector<HTMLElement>("pre")!.parentElement as HTMLElement;
    const lines = linesOf(block);
    const lineHeight = px(getComputedStyle(lines[0]!).lineHeight);
    // Each line wraps onto several rows, so two lines are far more than two rows tall.
    await expect(rect(lines[0]!).height).toBeGreaterThan(2 * lineHeight);
    // Two whole lines are shown: the second ends inside the frame, and the third starts at or below its edge.
    await expect(rect(lines[1]!).bottom).toBeLessThanOrEqual(rect(frame).bottom + 1);
    await expect(rect(lines[2]!).top).toBeGreaterThanOrEqual(rect(frame).bottom - 1);
    await expect(within(block).getByRole("button", { name: "Show 4 more lines" })).toBeInTheDocument();
    // Expanding shows them all, and collapsing again goes back to two.
    await userEvent.click(within(block).getByRole("button", { name: "Show 4 more lines" }));
    await expect(rect(lines[5]!).bottom).toBeLessThanOrEqual(rect(frame).bottom + 1);
    await userEvent.click(within(block).getByRole("button", { name: "Show less" }));
    await expect(rect(lines[2]!).top).toBeGreaterThanOrEqual(rect(frame).bottom - 1);
    // A different width wraps the lines differently, and the cut follows: still two whole lines, and shorter.
    // Re-measuring must not make the browser report a "ResizeObserver loop" error, which an app's error tracking
    // would log for every block that resizes.
    const errors: string[] = [];
    const onError = (event: ErrorEvent) => {
      errors.push(event.message);
      event.preventDefault();
    };
    window.addEventListener("error", onError);
    const before = rect(frame).height;
    block.style.maxWidth = "60rem";
    await new Promise((resolve) => setTimeout(resolve, 300));
    window.removeEventListener("error", onError);
    await expect(errors.filter((message) => message.includes("ResizeObserver"))).toEqual([]);
    await expect(rect(frame).height).toBeLessThan(before);
    await expect(rect(lines[1]!).bottom).toBeLessThanOrEqual(rect(frame).bottom + 1);
    await expect(rect(lines[2]!).top).toBeGreaterThanOrEqual(rect(frame).bottom - 1);
  },
};

// --- Things only the browser's own accessibility tree and forced-colours emulation can show, both through the
// Chrome DevTools Protocol the test browser already speaks.

type AccessibilityNodes = { nodes: Array<{ role?: { value: string }; name?: { value: string }; ignored?: boolean }> };

/** The text nodes a screen reader can reach on this page, from the browser's accessibility tree. */
async function readableText(): Promise<string[]> {
  await send("Accessibility.enable");
  await send("Page.enable");
  const { frameTree } = (await send("Page.getFrameTree")) as { frameTree: { frame: { id: string; url: string }; childFrames?: Array<{ frame: { id: string; url: string } }> } };
  const frames = [frameTree.frame, ...(frameTree.childFrames ?? []).map((child) => child.frame)];
  const frame = frames.find((candidate) => candidate.url === window.location.href) ?? frames[frames.length - 1]!;
  const tree = (await send("Accessibility.getFullAXTree", { frameId: frame.id })) as AccessibilityNodes;
  return tree.nodes.filter((node) => !node.ignored && node.role?.value === "StaticText" && node.name?.value).map((node) => node.name!.value);
}

export const ReadableTextInteraction: Story = {
  ...Playground,
  name: "Interaction: a screen reader reads the code and a highlight's cue, not the line numbers, and the cue is not selected",
  tags: ["!dev"],
  render: () => (
    <div data-testid="block">
      <CodeBlock code={"alpha\nbeta\ngamma\ndelta"} language="text" showLineNumbers highlightLines={[2, 3]} aria-label="Reading" copyable={false} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const heard = await readableText();
    // The code, and one cue for the two-line highlight, in front of its first line.
    for (const word of ["alpha", "beta", "gamma", "delta"]) await expect(heard).toContain(word);
    await expect(heard.filter((text) => text === "2 highlighted lines:")).toHaveLength(1);
    // The numbers are drawn, but decoration: none of them is in what a screen reader reaches.
    await expect(heard.filter((text) => /^\d+$/.test(text))).toEqual([]);
    await expect(getComputedStyle(linesOf(canvasElement)[0]!, "::before").content).toContain('"1"');
    // Selecting the code gives the code alone: neither the cue nor a number.
    const selection = window.getSelection() as Selection;
    selection.selectAllChildren(canvasElement.querySelector("code") as Node);
    await expect(selection.toString().split("\n").filter(Boolean)).toEqual(["alpha", "beta", "gamma", "delta"]);
    selection.removeAllRanges();
  },
};

export const ForcedColorsInteraction: Story = {
  ...Playground,
  name: "Interaction: in forced colours only a highlighted line has an edge accent, and the fade is gone",
  tags: ["!dev"],
  render: () => (
    <div data-testid="block">
      <CodeBlock code={Array.from({ length: 12 }, (_, index) => `line ${index + 1}`).join("\n")} language="text" highlightLines={[2]} collapsible collapsedLines={4} aria-label="Forced colours" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector("figure") as HTMLElement;
    const lines = linesOf(canvasElement);
    const emulate = (value: "active" | "none") => send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    await emulate("active");
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      await expect(window.matchMedia("(forced-colors: active)").matches).toBe(true);
      const canvas = getComputedStyle(root).backgroundColor;
      // A plain line's accent is the page's own colour, so it is invisible; without this every line shows a bar.
      for (const line of lines.filter((candidate) => candidate.dataset.highlighted !== "true")) {
        await expect(getComputedStyle(line).borderInlineStartColor).toBe(canvas);
      }
      // The highlighted line's is a system colour that shows, still 4px wide: the only cue left.
      const accent = getComputedStyle(lines[1]!);
      await expect(accent.borderInlineStartColor).not.toBe(canvas);
      await expect(px(accent.borderInlineStartWidth)).toBe(resolveLength("--dbm-border-width-4"));
      // The fade is a colour gradient with no meaning here.
      await expect(root.querySelector("[aria-hidden='true']:empty")).not.toBeNull();
      await expect(getComputedStyle(root.querySelector("[aria-hidden='true']:empty") as Element).display).toBe("none");
    } finally {
      await emulate("none");
    }
    // Back to normal colours, the accent is the token again.
    await new Promise((resolve) => setTimeout(resolve, 200));
    await expect(getComputedStyle(lines[1]!).borderInlineStartColor).toBe(resolveColor("--dbm-border-focus"));
  },
};

export const ScrollFocusInteraction: Story = {
  ...Playground,
  name: "Interaction: a long line makes the code a named tab stop; a short one does not",
  tags: ["!dev"],
  render: () => (
    <div style={stack}>
      <div data-testid="long" style={{ maxWidth: "20rem" }}>
        <CodeBlock code={samples.longLine} language="bash" title="request.sh" />
      </div>
      <div data-testid="short">
        <CodeBlock code="pnpm install" language="bash" title="install.sh" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const long = canvas.getByTestId("long");
    const region = within(long).getByRole("region", { name: "request.sh" });
    await expect(region).toHaveAttribute("tabindex", "0");
    await expect(region.scrollWidth).toBeGreaterThan(region.clientWidth);
    await expect(getComputedStyle(region).overflowX).toBe("auto");
    // Real keyboard: the copy button is first, then the scrolling code.
    await userEvent.tab();
    await expect(within(long).getByRole("button", { name: "Copy code" })).toHaveFocus();
    await userEvent.tab();
    await expect(region).toHaveFocus();
    // Its focus ring is drawn inside the block (a negative offset), so the block's clipped edge cannot cut it.
    await expect(px(getComputedStyle(region).outlineOffset)).toBeLessThan(0);
    await expect(px(getComputedStyle(region).outlineWidth)).toBe(resolveLength("--dbm-border-width-2"));
    // The short block's code isn't reachable: nothing to scroll.
    await expect(within(canvas.getByTestId("short")).queryByRole("region")).toBeNull();
    // Scrolling it moves the text (the frame is the scroll container, not the page).
    region.scrollLeft = 40;
    await expect(region.scrollLeft).toBeGreaterThan(0);
  },
};

export const DirectionInteraction: Story = {
  ...Playground,
  name: "Interaction: code stays left to right in a right-to-left page, and the header mirrors",
  tags: ["!dev"],
  render: () => (
    <div dir="rtl" data-testid="rtl">
      <CodeBlock code={samples.ts} language="ts" title="مثال.ts" showLineNumbers aria-label="rtl" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const block = within(canvasElement).getByTestId("rtl");
    const frame = block.querySelector<HTMLElement>("pre")!.parentElement as HTMLElement;
    await expect(getComputedStyle(frame).direction).toBe("ltr");
    const first = linesOf(block)[0] as HTMLElement;
    const range = document.createRange();
    range.selectNodeContents(first);
    // The code's first character is at the left of the block, the number before it.
    await expect(range.getBoundingClientRect().left - rect(frame).left).toBeLessThan(rect(frame).width / 2);
    // The header: the title at the right, the copy button at the left.
    const title = within(block).getByText("مثال.ts");
    const button = within(block).getByRole("button", { name: "Copy code" });
    await expect(rect(button).left).toBeLessThan(rect(title).left);
    // The header's start padding is on the right, and its end padding on the left: mirrored, not fixed to a side.
    const root = block.firstElementChild as HTMLElement;
    const border = resolveLength("--dbm-border-width-1");
    await expect(Math.abs(rect(root).right - rect(title).right - (border + resolveLength("--dbm-space-4")))).toBeLessThan(1);
    await expect(Math.abs(rect(button).left - rect(root).left - (border + resolveLength("--dbm-space-2")))).toBeLessThan(4);
  },
};

export const HeaderInteraction: Story = {
  ...Playground,
  name: "Interaction: a long title is cut short with an ellipsis and never pushes the copy button out",
  tags: ["!dev"],
  render: () => (
    <div style={{ maxWidth: "16rem" }} data-testid="narrow">
      <CodeBlock code="a" language="ts" title="a-very-long-file-name-that-does-not-fit-in-the-header.component.stories.tsx" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const block = within(canvasElement).getByTestId("narrow");
    const root = block.firstElementChild as HTMLElement;
    const title = block.querySelector("figcaption span span") as HTMLElement;
    await expect(title.scrollWidth).toBeGreaterThan(title.clientWidth);
    await expect(getComputedStyle(title).textOverflow).toBe("ellipsis");
    const button = within(block).getByRole("button", { name: "Copy code" });
    await expect(rect(button).right).toBeLessThanOrEqual(rect(root).right);
    await expect(rect(button).left).toBeGreaterThanOrEqual(rect(title).right - 1);
  },
};

export const TargetSizeInteraction: Story = {
  ...Playground,
  name: "Interaction: the copy and expand buttons are at least 24 by 24px",
  tags: ["!dev"],
  render: () => (
    <div data-testid="block">
      <CodeBlock code={Array.from({ length: 20 }, (_, index) => `line ${index + 1}`).join("\n")} language="text" collapsible aria-label="Targets" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const block = within(canvasElement).getByTestId("block");
    for (const button of within(block).getAllByRole("button")) {
      await expect(rect(button).width).toBeGreaterThanOrEqual(24);
      await expect(rect(button).height).toBeGreaterThanOrEqual(24);
    }
  },
};

export const PhoneInteraction: Story = {
  ...Playground,
  name: "Interaction: on a phone the block stays inside the page and scrolls its own code",
  tags: ["!dev"],
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <div data-testid="block">
      <CodeBlock code={samples.longLine} language="bash" title="request.sh" showLineNumbers />
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Fails loudly if the viewport global didn't apply, rather than passing for the wrong reason.
    await expect(window.innerWidth).toBeLessThan(640);
    const block = within(canvasElement).getByTestId("block");
    const root = block.firstElementChild as HTMLElement;
    await expect(rect(root).right).toBeLessThanOrEqual(window.innerWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    const region = within(block).getByRole("region", { name: "request.sh" });
    await expect(region.scrollWidth).toBeGreaterThan(region.clientWidth);
  },
};
