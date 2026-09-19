// The code shown under each story's "Show code" button on PasswordInput's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code
// spells out every default (`hasError={false}`, `readOnly={false}`, `name=""`),
// empty props (`aria-label=""`), and the story's demo wrapper, so a one-prop
// variant hides its one prop among a dozen others, and the clearable story
// freezes its state. Each snippet here is the smallest real usage of what its
// story shows — only exports of the package, no demo scaffolding — and
// `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

export const passwordInputSnippets = {
  allSizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" */}
<PasswordInput aria-label="Password" size="sm" placeholder="Size sm" />`,

  clearable: `{/* You own the value: const [value, setValue] = useState("hunter2");
    onClear is what makes the clear button appear. */}
<PasswordInput
  aria-label="Password"
  value={value}
  onChange={(event) => setValue(event.target.value)}
  onClear={() => setValue("")}
/>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface PasswordInputPlaygroundSnippetArgs {
  placeholder?: string;
  size?: string;
  defaultValue?: string;
  hasError?: boolean;
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
 * differ from their defaults. Also serves the stories that just change a few args
 * (error, disabled). An input needs an accessible name, so the `aria-label` is
 * always written.
 */
export function passwordInputPlaygroundSnippet(args: PasswordInputPlaygroundSnippetArgs): string {
  const attributes: string[] = [`aria-label="${args["aria-label"] || "Password"}"`];
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.placeholder) attributes.push(`placeholder="${args.placeholder}"`);
  if (args.defaultValue) attributes.push(`defaultValue="${args.defaultValue}"`);
  if (args.maxLength !== undefined) attributes.push(`maxLength={${args.maxLength}}`);
  if (args.showCount) attributes.push("showCount");
  if (args.hasError) attributes.push("hasError");
  if (args.required) attributes.push("required");
  if (args.readOnly) attributes.push("readOnly");
  if (args.disabled) attributes.push("disabled");
  if (args.name) attributes.push(`name="${args.name}"`);
  return `<PasswordInput ${attributes.join(" ")} />`;
}
