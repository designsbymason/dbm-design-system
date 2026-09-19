// The code shown under each story's "Show code" button on Select's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code
// shows a `<DemoOptions />` placeholder where the options should be, spells out
// every default (`hasError={false}`, `autoComplete=""`, `form=""`, `dir="ltr"`),
// no-op handlers, and the story's demo wrapper, and the controlled story freezes
// its state and its "Selected: none" text. Each snippet here is the smallest real
// usage of what its story shows — only exports of the package, no demo
// scaffolding — and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import type { SelectAlign, SelectSide, SelectSize } from "./Select.types";

const variantOptions = `  <Select.Option value="primary">Primary</Select.Option>
  <Select.Option value="secondary">Secondary</Select.Option>
  <Select.Option value="tertiary">Tertiary</Select.Option>
  <Select.Option value="ghost">Ghost</Select.Option>
  <Select.Option value="destructive">Destructive</Select.Option>`;

const select = (attributes: string, children: string) =>
  `<Select${attributes ? ` ${attributes}` : ""}>\n${children}\n</Select>`;

export const selectSnippets = {
  allSizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" */}
<Select aria-label="Size sm" size="sm" defaultValue="md">
  <Select.Option value="sm">Small</Select.Option>
  <Select.Option value="md">Medium</Select.Option>
  <Select.Option value="lg">Large</Select.Option>
</Select>`,

  states: `{/* Filled: defaultValue picks the selected option, so the placeholder isn't shown */}
<Select aria-label="Filled" defaultValue="primary">
  <Select.Option value="primary">Primary</Select.Option>
</Select>

{/* disabled disables the whole select; hasError marks it invalid */}
<Select aria-label="Disabled" placeholder="Choose a variant" disabled>
  <Select.Option value="primary">Primary</Select.Option>
</Select>

<Select aria-label="Error state" placeholder="Choose a variant" hasError>
  <Select.Option value="primary">Primary</Select.Option>
</Select>`,

  disabledOption: `{/* disabled on an Option keeps just that option from being chosen */}
<Select aria-label="Variant" placeholder="Choose a variant">
  <Select.Option value="primary">Primary</Select.Option>
  <Select.Option value="secondary" disabled>Secondary (unavailable)</Select.Option>
  <Select.Option value="tertiary">Tertiary</Select.Option>
</Select>`,

  clearable: `{/* onClear is what makes the clear button appear — use it to react to the value being cleared */}
${select('aria-label="Variant" placeholder="Choose a variant" defaultValue="primary" onClear={handleClear}', variantOptions)}`,

  longList: `{/* A long list scrolls, with scroll buttons at each end of the dropdown */}
<Select aria-label="Country" placeholder="Choose a country">
  <Select.Option value="Argentina">Argentina</Select.Option>
  <Select.Option value="Australia">Australia</Select.Option>
  <Select.Option value="Belgium">Belgium</Select.Option>
  <Select.Option value="Brazil">Brazil</Select.Option>
  <Select.Option value="Canada">Canada</Select.Option>
  {/* …and so on, as many as you have */}
</Select>`,

  sideAndAlign: `{/* side: "top" | "right" | "bottom" (default) | "left" — which side of the trigger the dropdown opens on.
    align: "start" (default) | "center" | "end" — how it lines up along that side. */}
${select('aria-label="Variant" placeholder="Choose a variant" side="right" align="start"', variantOptions)}`,

  customTrigger: `{/* asChild + trigger renders your own element as the trigger (here a Button) instead of the
    default select-style one */}
${select('aria-label="Variant" asChild trigger={<Button variant="primary">Open the custom trigger</Button>}', variantOptions)}`,

  customOptionRow: `{/* Select.Option asChild renders your own row. textValue is the plain text used for typeahead
    and for what the trigger shows once the option is chosen. */}
<Select aria-label="Framework" placeholder="Choose a framework">
  <Select.Option value="react" asChild textValue="React">
    <div>
      <span>React</span>
      <span>UI library</span>
    </div>
  </Select.Option>
  <Select.Option value="vue" asChild textValue="Vue">
    <div>
      <span>Vue</span>
      <span>Progressive framework</span>
    </div>
  </Select.Option>
  <Select.Option value="svelte" asChild textValue="Svelte">
    <div>
      <span>Svelte</span>
      <span>Compiler-based</span>
    </div>
  </Select.Option>
</Select>`,

  controlled: `{/* You own the value: const [value, setValue] = useState<string | undefined>(undefined); */}
<Select
  aria-label="Variant"
  placeholder="Choose a variant"
  value={value}
  onValueChange={setValue}
>
  <Select.Option value="primary">Primary</Select.Option>
  <Select.Option value="secondary">Secondary</Select.Option>
</Select>
<span>Selected: {value ?? "none"}</span>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface SelectPlaygroundSnippetArgs {
  "aria-label"?: string;
  placeholder?: string;
  size?: SelectSize;
  defaultValue?: string;
  hasError?: boolean;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  defaultOpen?: boolean;
  dir?: "ltr" | "rtl";
  form?: string;
  autoComplete?: string;
  side?: SelectSide;
  align?: SelectAlign;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults, around five real options. The Default story, which
 * only renders the Playground's controls, uses the same builder. A select needs an
 * accessible name, so the `aria-label` is always written.
 */
export function selectPlaygroundSnippet(args: SelectPlaygroundSnippetArgs): string {
  const attributes: string[] = [`aria-label="${args["aria-label"] || "Variant"}"`];
  if (args.placeholder) attributes.push(`placeholder="${args.placeholder}"`);
  if (args.defaultValue) attributes.push(`defaultValue="${args.defaultValue}"`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.side && args.side !== "bottom") attributes.push(`side="${args.side}"`);
  if (args.align && args.align !== "start") attributes.push(`align="${args.align}"`);
  if (args.defaultOpen) attributes.push("defaultOpen");
  // Left-to-right is what an unset `dir` already gives, so only `rtl` is worth writing.
  if (args.dir === "rtl") attributes.push('dir="rtl"');
  if (args.hasError) attributes.push("hasError");
  if (args.required) attributes.push("required");
  if (args.disabled) attributes.push("disabled");
  if (args.name) attributes.push(`name="${args.name}"`);
  if (args.form) attributes.push(`form="${args.form}"`);
  if (args.autoComplete) attributes.push(`autoComplete="${args.autoComplete}"`);
  return select(attributes.join(" "), variantOptions);
}
