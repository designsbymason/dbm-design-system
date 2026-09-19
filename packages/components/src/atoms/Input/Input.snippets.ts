// The code shown under each story's "Show code" button on Input's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code
// spells out every default (`hasError={false}`, `readOnly={false}`, `type="text"`),
// empty placeholders (`aria-label=""`, `name=""`), no-op handlers, and the story's
// demo wrapper; it prints the prefix icon as `{{ $$typeof: Symbol(react.forward_ref),
// ... }}`; and the clearable and character-count stories freeze `value` with no
// state. Each snippet here is the smallest real usage of what its story shows — only
// exports of the package, no demo scaffolding — and `storySnippets.test.ts` checks
// that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import type { InputSize } from "./Input.types";

export const inputSnippets = {
  allSizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" */}
<Input aria-label="Size lg" size="lg" placeholder="Size lg" />`,

  withPrefixIcon: `{/* prefix takes any node — here an Icon. MagnifyingGlassIcon comes from @dbm-design-system/icons. */}
<Input
  aria-label="Search"
  prefix={<Icon icon={MagnifyingGlassIcon} size="sm" />}
  placeholder="Search"
/>`,

  withSuffix: `{/* suffix is text shown after the value */}
<Input aria-label="Username" suffix="@example.com" placeholder="username" />`,

  clearable: `{/* You own the value: const [value, setValue] = useState("Search term");
    onClear is what makes the clear button appear. MagnifyingGlassIcon comes from @dbm-design-system/icons. */}
<Input
  aria-label="Search"
  prefix={<Icon icon={MagnifyingGlassIcon} size="sm" />}
  value={value}
  onChange={(event) => setValue(event.target.value)}
  onClear={() => setValue("")}
  placeholder="Search"
/>`,

  characterCount: `{/* showCount shows how much of maxLength is used. You own the value:
    const [value, setValue] = useState("Getting started…"); */}
<Input
  aria-label="Bio"
  value={value}
  onChange={(event) => setValue(event.target.value)}
  maxLength={140}
  showCount
  placeholder="Tell us about yourself"
/>`,

  narrowViewport: `{/* An Input fills the width of its container, so on a narrow screen it simply gets narrower */}
<Input aria-label="Full width" placeholder="Full width on narrow screens" />`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface InputPlaygroundSnippetArgs {
  placeholder?: string;
  size?: InputSize;
  type?: string;
  defaultValue?: string;
  hasError?: boolean;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  showCount?: boolean;
  name?: string;
  "aria-label"?: string;
  suffix?: string;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults. An input needs an accessible name, so the `aria-label`
 * is always written. Also serves the error and disabled stories.
 */
export function inputPlaygroundSnippet(args: InputPlaygroundSnippetArgs): string {
  const attributes: string[] = [`aria-label="${args["aria-label"] || "Text"}"`];
  if (args.type && args.type !== "text") attributes.push(`type="${args.type}"`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.placeholder) attributes.push(`placeholder="${args.placeholder}"`);
  if (args.defaultValue) attributes.push(`defaultValue="${args.defaultValue}"`);
  if (args.suffix) attributes.push(`suffix="${args.suffix}"`);
  if (args.maxLength !== undefined) attributes.push(`maxLength={${args.maxLength}}`);
  if (args.showCount) attributes.push("showCount");
  if (args.hasError) attributes.push("hasError");
  if (args.required) attributes.push("required");
  if (args.readOnly) attributes.push("readOnly");
  if (args.disabled) attributes.push("disabled");
  if (args.name) attributes.push(`name="${args.name}"`);
  return `<Input ${attributes.join(" ")} />`;
}
