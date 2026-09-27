import { optInExportFor } from "./optInLanguages";

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

  moreLanguages: `{/* Python, YAML, SQL, Markdown, Go, Rust and Java are opt-in: register the ones you use once, when the app
    starts, and every block can use them (aliases: "py", "yml", "postgres", "md", "golang", "rs").
    import { pythonLanguage, yamlLanguage, registerCodeLanguage } from "@dbm-design-system/components";
    registerCodeLanguage(pythonLanguage);
    registerCodeLanguage(yamlLanguage);
    The others are sqlLanguage, markdownLanguage, goLanguage, rustLanguage and javaLanguage. */}
<CodeBlock language="python" code={"def total(items):\\n    return sum(i.price for i in items)"} />
<CodeBlock language="yaml" code={"name: build\\non:\\n  push:\\n    branches: [main]"} />
<CodeBlock language="sql" code={"SELECT id, COUNT(*) FROM users GROUP BY id;"} />
<CodeBlock language="markdown" code={"# Title\\n\\n- one **bold** item"} />
<CodeBlock language="go" code={"func main() {\\n\\tfmt.Println(\\"hi\\")\\n}"} />
<CodeBlock language="rust" code={"fn main() {\\n    println!(\\"hi\\");\\n}"} />
<CodeBlock language="java" code={"public class Main {\\n  void run() {}\\n}"} />`,

  furtherLanguages: `{/* C, C++, C#, Kotlin, Swift, Ruby, PHP and TOML are opt-in too: register each one you use once, when the app starts.
    import { cLanguage, cppLanguage, csharpLanguage, kotlinLanguage, swiftLanguage, rubyLanguage, phpLanguage, tomlLanguage,
      registerCodeLanguage } from "@dbm-design-system/components";
    registerCodeLanguage(csharpLanguage);
    Aliases: "h", "c++", "cc", "hpp", "cs", "kt", "kts", "rb". */}
<CodeBlock language="c" code={"#include <stdio.h>\\nint main(void) { return 0; }"} />
<CodeBlock language="cpp" code={"template <typename T>\\nclass Box final { T value; };"} />
<CodeBlock language="csharp" code={"public class Greeter {\\n  public string Name { get; set; }\\n}"} />
<CodeBlock language="kotlin" code={"fun greet(name: String) = println(\\"Hi $name\\")"} />
<CodeBlock language="swift" code={"func greet(_ name: String) -> String {\\n  return \\"Hi \\\\(name)\\"\\n}"} />
<CodeBlock language="ruby" code={"class Greeter\\n  def greet = :hello\\nend"} />
<CodeBlock language="php" code={"<?php\\nfunction greet(string $name): string { return \\"Hi $name\\"; }"} />
<CodeBlock language="toml" code={"[server]\\nport = 8080"} />`,

  ownLanguage: `{/* A language of your own: a name and a function from the code to lines of { type?, text } tokens (never HTML).
    Register it once, when the app starts, and it wins over a built-in language of the same name:
    registerCodeLanguage({ name: "ini", tokenize: (code) => code.split("\\n").map(iniLine) });
    A block can also highlight itself: return the lines, or undefined to leave it to the registered and built-in
    languages. Whatever comes back must join back to the code, or the block is drawn plain.
    const logHighlighter: CodeHighlighter = (code, language) => language === "log" ? tokensFor(code) : undefined;
    Define it outside the component, so it isn't a new function on every render.
    settings: the ini text to show, as a string
    output: the log text to show, as a string */}
<CodeBlock language="ini" title="settings.ini" code={settings} />
<CodeBlock language="log" title="server.log" highlighter={logHighlighter} code={output} />`,

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

  size: `{/* size: xs | sm | md | lg | xl. md, the default, is the size the block has always had; xs and sm share the
    smallest font and differ in the space around the code. It also sets the size of the header buttons.
    source: the code to show, as a string */}
<CodeBlock language="ts" size="sm" code={source} />
<CodeBlock language="ts" size="lg" code={source} />`,

  wrapToggle: `{/* wrapToggle: a button in the header that turns wrapping on and off (a toggle: its pressed state says which).
    defaultWrap starts it on; wrap and onWrapChange let you own the state, like expanded on a collapsible block.
    command: the command to show, as a string */}
<CodeBlock language="bash" wrapToggle code={command} />
<CodeBlock language="bash" wrapToggle defaultWrap code={command} />`,

  header: `{/* showLanguage={false}: the title and the buttons, without the language label.
    showHeader={false}: no strip at all, and the copy button (and the wrap toggle, if it is on) sit in the top corner
    of the code. Set copyable={false} too for nothing but the code. A title still names the block, but is not drawn.
    source: the code to show, as a string */}
<CodeBlock language="ts" title="total.ts" showLanguage={false} code={source} />
<CodeBlock language="ts" title="total.ts" showHeader={false} code={source} />
<CodeBlock language="bash" showHeader={false} copyable={false} aria-label="Install command" code={"pnpm add @dbm-design-system/components"} />`,

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

  prompt: `{/* stripPrompt (on by default, for shell code): a leading "$ " is drawn but not copied, so the command pastes
    and runs. Pass stripPrompt={false} to copy the code exactly as written. */}
<CodeBlock language="bash" code={"$ pnpm add @dbm-design-system/components\\n$ pnpm test"} />`,

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
  size?: string;
  showHeader?: boolean;
  showLanguage?: boolean;
  wrap?: boolean;
  wrapToggle?: boolean;
  maxHeight?: string;
  collapsible?: boolean;
  collapsedLines?: number;
  copyable?: boolean;
  stripPrompt?: boolean;
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
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.showHeader === false) attributes.push("showHeader={false}");
  if (args.showHeader !== false && args.showLanguage === false && args.language) attributes.push("showLanguage={false}");
  // With a toggle the block owns its wrapping, so a wrap that is on is where it starts, not a fixed setting.
  if (args.wrapToggle) attributes.push(args.wrap ? "wrapToggle defaultWrap" : "wrapToggle");
  else if (args.wrap) attributes.push("wrap");
  if (args.maxHeight?.trim()) attributes.push(`maxHeight="${args.maxHeight.trim().replace(/"/g, "")}"`);
  if (args.collapsible) {
    attributes.push("collapsible");
    if (typeof args.collapsedLines === "number" && args.collapsedLines !== 10) attributes.push(`collapsedLines={${Math.trunc(args.collapsedLines)}}`);
  }
  if (args.copyable === false) attributes.push("copyable={false}");
  if (args.copyable !== false && args.stripPrompt === false && (args.language === "bash" || args.language === "sh" || args.language === "shell")) attributes.push("stripPrompt={false}");
  if (args.copyable !== false && typeof args.copiedDuration === "number" && args.copiedDuration !== 2000) {
    attributes.push(`copiedDuration={${Math.trunc(args.copiedDuration)}}`);
  }
  attributes.push("code={source}");
  const element = attributes.length > 3 ? `<CodeBlock\n  ${attributes.join("\n  ")}\n/>` : `<CodeBlock ${attributes.join(" ")} />`;
  const optIn = optInExportFor(args.language);
  // A language outside the core draws plain until the app registers it, so a snippet that uses one says how.
  const register = optIn ? `{/* ${optIn}: register it once, when the app starts, with registerCodeLanguage(${optIn}) */}\n` : "";
  return `${register}${sourceComment}\n${element}`;
}
