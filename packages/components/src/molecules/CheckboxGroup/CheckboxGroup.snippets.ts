// The code shown under each story's "Show code" button on CheckboxGroup's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code
// spells out every default (`hasError={false}`, `name=""`), no-op handlers
// (`onValueChange={() => {}}`), and the story's demo wrapper, and for the
// controlled story it freezes the state at its first value. Each snippet here is
// the smallest real usage of what its story shows — only exports of the package,
// no demo scaffolding — and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import type { CheckboxGroupOrientation } from "./CheckboxGroup.types";

const interests = `  <Checkbox value="sports">Sports</Checkbox>
  <Checkbox value="music">Music</Checkbox>
  <Checkbox value="travel">Travel</Checkbox>`;

const group = (attributes: string, children: string) =>
  `<CheckboxGroup${attributes ? ` ${attributes}` : ""}>\n${children}\n</CheckboxGroup>`;

export const checkboxGroupSnippets = {
  orientation: `{/* orientation: "vertical" (default) | "horizontal" */}
${group('aria-label="Interests" orientation="horizontal" defaultValue={["sports"]}', interests)}`,

  sizeCascade: `{/* size on the group cascades to every Checkbox in it; an individual Checkbox can override it */}
<CheckboxGroup aria-label="Large group, one option overridden to xs" size="lg">
  <Checkbox value="sports">Sports</Checkbox>
  <Checkbox value="music" size="xs">Music (overridden to xs)</Checkbox>
</CheckboxGroup>`,

  states: `{/* disabled on the group disables every option; on one Checkbox, just that option */}
<CheckboxGroup aria-label="One option individually disabled" defaultValue={["sports"]}>
  <Checkbox value="sports">Sports</Checkbox>
  <Checkbox value="music" disabled>Music (unavailable)</Checkbox>
</CheckboxGroup>

{/* hasError marks the group as invalid — pair it with a FieldError that says what's wrong */}
<CheckboxGroup aria-label="Error state" hasError>
  <Checkbox value="sports">Sports</Checkbox>
  <Checkbox value="music">Music</Checkbox>
</CheckboxGroup>
<FieldError>Please choose at least one interest</FieldError>`,

  controlled: `{/* You own the selection: const [value, setValue] = useState<string[]>(["sports"]); */}
<CheckboxGroup aria-label="Interests" value={value} onValueChange={setValue}>
${interests}
</CheckboxGroup>
<span>Selected: {value.length > 0 ? value.join(", ") : "none"}</span>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface CheckboxGroupPlaygroundSnippetArgs {
  size?: string;
  defaultValue?: string[];
  hasError?: boolean;
  disabled?: boolean;
  name?: string;
  orientation?: CheckboxGroupOrientation;
  "aria-label"?: string;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults, around three real checkboxes. A group needs an
 * accessible name, so the `aria-label` is always written.
 */
export function checkboxGroupPlaygroundSnippet(args: CheckboxGroupPlaygroundSnippetArgs): string {
  const attributes: string[] = [`aria-label="${args["aria-label"] || "Interests"}"`];
  if (args.defaultValue && args.defaultValue.length > 0) {
    attributes.push(`defaultValue={[${args.defaultValue.map((value) => `"${value}"`).join(", ")}]}`);
  }
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.orientation && args.orientation !== "vertical") attributes.push(`orientation="${args.orientation}"`);
  if (args.hasError) attributes.push("hasError");
  if (args.disabled) attributes.push("disabled");
  if (args.name) attributes.push(`name="${args.name}"`);
  return group(attributes.join(" "), interests);
}
