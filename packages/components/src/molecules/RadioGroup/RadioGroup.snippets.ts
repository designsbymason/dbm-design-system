// The code shown under each story's "Show code" button on RadioGroup's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code
// spells out every default (`hasError={false}`, `loop`, `name=""`), no-op
// handlers (`onValueChange={() => {}}`), and the story's demo wrapper, and for the
// controlled story it freezes the state at its first value. Each snippet here is
// the smallest real usage of what its story shows — only exports of the package,
// no demo scaffolding — and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import type { RadioGroupOrientation } from "./RadioGroup.types";

const contactMethods = `  <Radio value="email">Email</Radio>
  <Radio value="sms">SMS</Radio>
  <Radio value="phone">Phone call</Radio>`;

const group = (attributes: string, children: string) =>
  `<RadioGroup${attributes ? ` ${attributes}` : ""}>\n${children}\n</RadioGroup>`;

export const radioGroupSnippets = {
  orientation: `{/* orientation: "vertical" (default) | "horizontal" */}
${group('aria-label="Contact method" orientation="horizontal" defaultValue="email"', contactMethods)}`,

  sizeCascade: `{/* size on the group cascades to every Radio in it; an individual Radio can override it */}
<RadioGroup aria-label="Large group, one option overridden to xs" size="lg">
  <Radio value="email">Email</Radio>
  <Radio value="sms" size="xs">SMS (overridden to xs)</Radio>
</RadioGroup>`,

  states: `{/* disabled on the group disables every option; on one Radio, just that option */}
<RadioGroup aria-label="One option individually disabled" defaultValue="email">
  <Radio value="email">Email</Radio>
  <Radio value="sms" disabled>SMS (unavailable)</Radio>
</RadioGroup>

{/* hasError marks the group as invalid — pair it with a FieldError that says what's wrong */}
<RadioGroup aria-label="Error state" hasError>
  <Radio value="email">Email</Radio>
  <Radio value="sms">SMS</Radio>
</RadioGroup>
<FieldError>Please choose a contact method</FieldError>`,

  controlled: `{/* You own the selection: const [value, setValue] = useState("email"); */}
<RadioGroup aria-label="Contact method" value={value} onValueChange={setValue}>
${contactMethods}
</RadioGroup>
<span>Selected: {value}</span>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface RadioGroupPlaygroundSnippetArgs {
  size?: string;
  defaultValue?: string;
  hasError?: boolean;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  orientation?: RadioGroupOrientation;
  dir?: "ltr" | "rtl";
  loop?: boolean;
  "aria-label"?: string;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults, around three real radios. A group needs an
 * accessible name, so the `aria-label` is always written.
 */
export function radioGroupPlaygroundSnippet(args: RadioGroupPlaygroundSnippetArgs): string {
  const attributes: string[] = [`aria-label="${args["aria-label"] || "Contact method"}"`];
  if (args.defaultValue) attributes.push(`defaultValue="${args.defaultValue}"`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.orientation && args.orientation !== "vertical") attributes.push(`orientation="${args.orientation}"`);
  // `loop` defaults to true, so it only needs writing when it's off.
  if (args.loop === false) attributes.push("loop={false}");
  // Left-to-right is what an unset `dir` already gives, so only `rtl` is worth writing.
  if (args.dir === "rtl") attributes.push('dir="rtl"');
  if (args.hasError) attributes.push("hasError");
  if (args.required) attributes.push("required");
  if (args.disabled) attributes.push("disabled");
  if (args.name) attributes.push(`name="${args.name}"`);
  return group(attributes.join(" "), contactMethods);
}
