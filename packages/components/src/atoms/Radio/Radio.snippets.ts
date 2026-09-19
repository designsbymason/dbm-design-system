// The code shown under each story's "Show code" button on Radio's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code
// spells out every default (`hasError={false}`, `required={false}`, `name=""`),
// empty placeholders (`aria-label=""`), no-op handlers, and the story's demo wrapper;
// and the "Inside a RadioGroup" story printed Radix internals — `<React.ForwardRef>`
// around a `<React.Context>` — because it was wired by hand from before `RadioGroup`
// existed. Each snippet here is the smallest real usage of what its story shows —
// only exports of the package, no demo scaffolding — and `storySnippets.test.ts`
// checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import type { RadioSize } from "./Radio.types";

export const radioSnippets = {
  allSizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" */}
<Radio size="lg" value="email" defaultChecked>Size lg</Radio>`,

  states: `<Radio value="email">Unchecked</Radio>
<Radio value="email" defaultChecked>Checked</Radio>
<Radio value="email" disabled>Disabled</Radio>
<Radio value="email" disabled defaultChecked>Disabled + checked</Radio>

{/* hasError marks the radio invalid — pair it with a FieldError that says what's wrong */}
<Radio value="email" hasError>Error state</Radio>`,

  withoutLabel: `{/* With no visible label, aria-label is required */}
<Radio value="row" aria-label="Select row" />`,

  insideARadioGroup: `{/* Radios belong in a RadioGroup, which owns the selection and keyboard navigation between them:
    const [value, setValue] = useState("email"); */}
<RadioGroup aria-label="Contact method" value={value} onValueChange={setValue}>
  <Radio value="email">Email</Radio>
  <Radio value="sms">SMS</Radio>
  <Radio value="phone">Phone call</Radio>
</RadioGroup>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface RadioPlaygroundSnippetArgs {
  children?: unknown;
  size?: RadioSize;
  hasError?: boolean;
  disabled?: boolean;
  defaultChecked?: boolean;
  required?: boolean;
  name?: string;
  value?: string;
  "aria-label"?: string;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults. A radio's `value` is what it means, so it's always
 * written.
 */
export function radioPlaygroundSnippet(args: RadioPlaygroundSnippetArgs): string {
  const attributes: string[] = [`value="${args.value || "email"}"`];
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.defaultChecked) attributes.push("defaultChecked");
  if (args.hasError) attributes.push("hasError");
  if (args.required) attributes.push("required");
  if (args.name) attributes.push(`name="${args.name}"`);
  if (args["aria-label"]) attributes.push(`aria-label="${args["aria-label"]}"`);
  if (args.disabled) attributes.push("disabled");
  const open = `<Radio ${attributes.join(" ")}`;
  const label = args.children === undefined || args.children === "" ? undefined : String(args.children);
  return label ? `${open}>${label}</Radio>` : `${open} />`;
}
