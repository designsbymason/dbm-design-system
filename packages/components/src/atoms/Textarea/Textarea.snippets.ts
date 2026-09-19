// The code shown under each story's "Show code" button on Textarea's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code
// spells out every default (`hasError={false}`, `autoResize={false}`,
// `resize="vertical"`, `rows={3}`), empty placeholders (`aria-label=""`, `name=""`),
// no-op handlers, and the story's demo wrapper; and the four stateful stories
// (auto-resize, bounded, clearable, character count) freeze `value=""` with no state.
// Each snippet here is the smallest real usage of what its story shows — only
// exports of the package, no demo scaffolding — and `storySnippets.test.ts` checks
// that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import type { TextareaResize, TextareaSize } from "./Textarea.types";

export const textareaSnippets = {
  allSizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" */}
<Textarea aria-label="Size lg" size="lg" placeholder="Size lg" />`,

  autoResize: `{/* autoResize grows the field as you type. You own the value: const [value, setValue] = useState(""); */}
<Textarea
  aria-label="Comment"
  autoResize
  value={value}
  onChange={(event) => setValue(event.target.value)}
  placeholder="Type multiple lines and watch it grow…"
/>`,

  boundedAutoResize: `{/* minRows and maxRows bound the growth: it starts at 3 rows and scrolls past 6.
    You own the value: const [value, setValue] = useState(""); */}
<Textarea
  aria-label="Comment"
  autoResize
  minRows={3}
  maxRows={6}
  value={value}
  onChange={(event) => setValue(event.target.value)}
  placeholder="Grows up to 6 rows, then scrolls…"
/>`,

  clearable: `{/* You own the value: const [value, setValue] = useState("Some existing text to clear…");
    onClear is what makes the clear button appear. */}
<Textarea
  aria-label="Comment"
  value={value}
  onChange={(event) => setValue(event.target.value)}
  onClear={() => setValue("")}
  placeholder="Add a comment…"
/>`,

  characterCount: `{/* showCount shows how much of maxLength is used. You own the value:
    const [value, setValue] = useState("Getting started…"); */}
<Textarea
  aria-label="Bio"
  value={value}
  onChange={(event) => setValue(event.target.value)}
  maxLength={140}
  showCount
  placeholder="Tell us about yourself"
/>`,

  narrowViewport: `{/* A Textarea fills the width of its container, so on a narrow screen it simply gets narrower */}
<Textarea aria-label="Full width" placeholder="Full width on narrow screens" />`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface TextareaPlaygroundSnippetArgs {
  placeholder?: string;
  hasError?: boolean;
  size?: TextareaSize;
  autoResize?: boolean;
  resize?: TextareaResize;
  rows?: number;
  minRows?: number;
  maxRows?: number;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  showCount?: boolean;
  name?: string;
  "aria-label"?: string;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults. A textarea needs an accessible name, so the
 * `aria-label` is always written. Also serves the error and disabled stories.
 */
export function textareaPlaygroundSnippet(args: TextareaPlaygroundSnippetArgs): string {
  const attributes: string[] = [`aria-label="${args["aria-label"] || "Comment"}"`];
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.placeholder) attributes.push(`placeholder="${args.placeholder}"`);
  if (args.defaultValue) attributes.push(`defaultValue="${args.defaultValue}"`);
  if (args.autoResize) attributes.push("autoResize");
  if (args.rows !== undefined && args.rows !== 3) attributes.push(`rows={${args.rows}}`);
  if (args.minRows !== undefined) attributes.push(`minRows={${args.minRows}}`);
  if (args.maxRows !== undefined) attributes.push(`maxRows={${args.maxRows}}`);
  if (args.resize && args.resize !== "vertical") attributes.push(`resize="${args.resize}"`);
  if (args.maxLength !== undefined) attributes.push(`maxLength={${args.maxLength}}`);
  if (args.showCount) attributes.push("showCount");
  if (args.hasError) attributes.push("hasError");
  if (args.required) attributes.push("required");
  if (args.readOnly) attributes.push("readOnly");
  if (args.disabled) attributes.push("disabled");
  if (args.name) attributes.push(`name="${args.name}"`);
  return `<Textarea ${attributes.join(" ")} />`;
}
