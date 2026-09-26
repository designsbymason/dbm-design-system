// The code shown under each story's "Show code" button on CodeBlock's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code would spell out every default
// and the whole demo source as one long string. Each snippet here is the smallest real usage of what its story
// shows — only exports of the package, no demo scaffolding — and `storySnippets.test.ts` checks that stays
// true. See `07-storybook-and-documentation-standards.md` §4.2.

export const codeBlockSnippets = {
  languages: `{/* language: "ts" | "tsx" | "js" | "jsx" | "json" | "css" | "html" | "bash" | "diff" (and aliases like
    "typescript", "sh", "svg"). Any other value draws plain text. */}
<CodeBlock language="ts" code={"const total = items.reduce((sum, item) => sum + item.price, 0);"} />
<CodeBlock language="json" code={'{ "name": "dbm", "private": true }'} />
<CodeBlock language="bash" code={"pnpm add @dbm-design-system/components"} />
<CodeBlock language="diff" code={"- const size = 'md';\\n+ const size = 'lg';"} />`,

  title: `{/* title: a file name, shown in the header and used as the block's accessible name
    source: the code to show, as a string */}
<CodeBlock language="tsx" title="SaveButton.tsx" code={source} />`,

  lineNumbers: `{/* showLineNumbers: a gutter that isn't selected or copied
    source: the code to show, as a string */}
<CodeBlock language="tsx" showLineNumbers code={source} />`,

  highlightLines: `{/* highlightLines: single lines and ranges, by the numbers shown — a band and an edge accent
    source: the code to show, as a string */}
<CodeBlock language="tsx" showLineNumbers highlightLines={[2, "4-6"]} code={source} />`,

  startLine: `{/* startLine: the number of the first line, for an excerpt from further down a file
    excerpt: the excerpt to show, as a string */}
<CodeBlock language="ts" showLineNumbers startLine={42} highlightLines={[44]} code={excerpt} />`,

  wrap: `{/* wrap: long lines break instead of scrolling sideways; a wrapped line continues under its own text
    command: the command to show, as a string */}
<CodeBlock language="bash" wrap showLineNumbers code={command} />`,

  collapsible: `{/* collapsible: only the first collapsedLines lines (10 by default), with a button for the rest.
    Everything stays in the page, and the copy button still copies all of it.
    config: the JSON text to show, as a string */}
<CodeBlock language="json" collapsible collapsedLines={6} code={config} />`,

  controlled: `{/* expanded + onExpandedChange: you own the state.
    const [expanded, setExpanded] = useState(false);
    config: the JSON text to show, as a string */}
<CodeBlock
  language="json"
  collapsible
  collapsedLines={4}
  expanded={expanded}
  onExpandedChange={setExpanded}
  code={config}
/>`,

  maxHeight: `{/* maxHeight: the tallest the code grows before it scrolls
    config: the JSON text to show, as a string */}
<CodeBlock language="json" maxHeight="10rem" code={config} />`,

  copy: `{/* onCopied runs after the copy button has copied; copyable={false} removes the button */}
<CodeBlock language="bash" code={"pnpm add @dbm-design-system/components"} onCopied={() => track("install-copied")} />
<CodeBlock language="ts" copyable={false} code={"export const version = '1.0.0';"} />`,

  plain: `{/* No language, or one without a grammar: plain text (a log, an error, an output)
    output: the log or output to show, as a string */}
<CodeBlock title="output.log" code={output} />`,

  translated: `{/* labels: the words the block writes itself, one at a time; expand is a function of the count
    config: the JSON text to show, as a string */}
<CodeBlock
  language="json"
  collapsible
  collapsedLines={3}
  labels={{
    copy: "Copier le code",
    copied: "Copié",
    copyFailed: "Échec de la copie",
    expand: (count) => \`Afficher \${count} lignes de plus\`,
    collapse: "Réduire",
  }}
  code={config}
/>`,

  rtl: `{/* The code stays left to right in a right-to-left page; the header mirrors */}
<div dir="rtl">
  <CodeBlock language="ts" title="مثال.ts" code={"const total = 1 + 2;"} />
</div>`,

  labelled: `{/* A visible label names the block */}
<span id="install-label">Install</span>
<CodeBlock aria-labelledby="install-label" language="bash" code={"pnpm add @dbm-design-system/components"} />`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface CodeBlockPlaygroundSnippetArgs {
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
  startLine?: number;
  /** Storybook only: the highlighted lines as typed, `"2, 4-6"`. */
  highlight?: string;
  wrap?: boolean;
  maxHeight?: string;
  collapsible?: boolean;
  collapsedLines?: number;
  copyable?: boolean;
  copiedDuration?: number;
}

const sourceComment = "{/* source: the code to show, as a string */}";

/** Turns what a reader types (`"2, 4-6"`) into the `highlightLines` array literal, or `undefined` for none. */
export function highlightLinesLiteral(typed: string | undefined): string | undefined {
  const entries = (typed ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => /^\d+(?:\s*-\s*\d+)?$/.test(entry))
    .map((entry) => (/^\d+$/.test(entry) ? entry : `"${entry.replace(/\s+/g, "")}"`));
  return entries.length > 0 ? `[${entries.join(", ")}]` : undefined;
}

/** The typed highlight list as the array `highlightLines` takes, ignoring what isn't a line or a range. */
export function highlightLinesFromText(typed: string | undefined): Array<number | string> | undefined {
  const literal = highlightLinesLiteral(typed);
  return literal ? (JSON.parse(literal) as Array<number | string>) : undefined;
}

/**
 * The Playground's snippet, built from its current controls: only the props that differ from their defaults.
 * The source is shown as `code={source}` — the demo text is not the reader's — with a comment saying what it is.
 */
export function codeBlockPlaygroundSnippet(args: CodeBlockPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.language) attributes.push(`language="${args.language}"`);
  if (args.title) attributes.push(`title="${args.title.replace(/"/g, "&quot;")}"`);
  if (args.showLineNumbers) attributes.push("showLineNumbers");
  if (args.showLineNumbers && typeof args.startLine === "number" && Number.isFinite(args.startLine) && args.startLine !== 1) {
    attributes.push(`startLine={${Math.trunc(args.startLine)}}`);
  }
  const highlight = highlightLinesLiteral(args.highlight);
  if (highlight) attributes.push(`highlightLines={${highlight}}`);
  if (args.wrap) attributes.push("wrap");
  if (args.maxHeight?.trim()) attributes.push(`maxHeight="${args.maxHeight.trim().replace(/"/g, "")}"`);
  if (args.collapsible) {
    attributes.push("collapsible");
    if (typeof args.collapsedLines === "number" && args.collapsedLines !== 10) attributes.push(`collapsedLines={${Math.trunc(args.collapsedLines)}}`);
  }
  if (args.copyable === false) attributes.push("copyable={false}");
  if (args.copyable !== false && typeof args.copiedDuration === "number" && args.copiedDuration !== 2000) {
    attributes.push(`copiedDuration={${Math.trunc(args.copiedDuration)}}`);
  }
  attributes.push("code={source}");
  const element = attributes.length > 3 ? `<CodeBlock\n  ${attributes.join("\n  ")}\n/>` : `<CodeBlock ${attributes.join(" ")} />`;
  return `${sourceComment}\n${element}`;
}
