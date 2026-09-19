// The code shown under each story's "Show code" button on SearchInput's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code
// spells out every default (`isLoading={false}`, `debounceMs={300}`, `name=""`),
// no-op handlers (`onSearch={() => {}}`), and the story's demo wrapper, so a
// one-prop variant hides its one prop among a dozen others, and the clearable
// story freezes its state. Each snippet here is the smallest real usage of what
// its story shows — only exports of the package, no demo scaffolding — and
// `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

export const searchInputSnippets = {
  allSizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" */}
<SearchInput aria-label="Search" size="sm" placeholder="Search…" />`,

  clearable: `{/* You own the value: const [value, setValue] = useState("cats");
    onClear is what makes the clear button appear. */}
<SearchInput
  aria-label="Search"
  value={value}
  onChange={(event) => setValue(event.target.value)}
  onClear={() => setValue("")}
/>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface SearchInputPlaygroundSnippetArgs {
  placeholder?: string;
  size?: string;
  defaultValue?: string;
  hasError?: boolean;
  isLoading?: boolean;
  debounceMs?: number;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  name?: string;
  "aria-label"?: string;
  /** A `ReactNode` — the demo stories only ever pass a keyboard-shortcut hint. */
  suffix?: unknown;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults. Also serves the stories that just change a few args
 * (loading, a suffix hint, no debounce, error, disabled). An input needs an
 * accessible name, so the `aria-label` is always written.
 */
export function searchInputPlaygroundSnippet(args: SearchInputPlaygroundSnippetArgs): string {
  const attributes: string[] = [`aria-label="${args["aria-label"] || "Search"}"`];
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.placeholder) attributes.push(`placeholder="${args.placeholder}"`);
  if (args.defaultValue) attributes.push(`defaultValue="${args.defaultValue}"`);
  // `debounceMs` defaults to 300ms; 0 turns the debounce off.
  if (args.debounceMs !== undefined && args.debounceMs !== 300) attributes.push(`debounceMs={${args.debounceMs}}`);
  if (args.maxLength !== undefined) attributes.push(`maxLength={${args.maxLength}}`);
  if (args.suffix) attributes.push('suffix={<Kbd aria-label="Command K">⌘K</Kbd>}');
  if (args.isLoading) attributes.push("isLoading");
  if (args.hasError) attributes.push("hasError");
  if (args.required) attributes.push("required");
  if (args.readOnly) attributes.push("readOnly");
  if (args.disabled) attributes.push("disabled");
  if (args.name) attributes.push(`name="${args.name}"`);
  return `<SearchInput ${attributes.join(" ")} />`;
}
