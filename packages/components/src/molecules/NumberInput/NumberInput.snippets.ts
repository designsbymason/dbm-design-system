// The code shown under each story's "Show code" button on NumberInput's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code
// spells out every default (`hasError={false}`, `readOnly={false}`, `name=""`),
// empty and no-op props (`aria-label=""`, `onValueChange={() => {}}`), and the
// story's demo wrapper, so a one-prop variant hides its one prop among a dozen
// others, and the clearable story freezes its state. Each snippet here is the
// smallest real usage of what its story shows — only exports of the package, no
// demo scaffolding — and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

export const numberInputSnippets = {
  allSizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" */}
<NumberInput aria-label="Quantity" size="sm" defaultValue={5} min={0} max={10} />`,

  clearable: `{/* You own the value: const [value, setValue] = useState<number | undefined>(5);
    onClear is what makes the clear button appear. */}
<NumberInput
  aria-label="Quantity"
  value={value}
  onValueChange={setValue}
  onClear={() => setValue(undefined)}
/>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface NumberInputPlaygroundSnippetArgs {
  placeholder?: string;
  size?: string;
  defaultValue?: number;
  hasError?: boolean;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  name?: string;
  "aria-label"?: string;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults. Also serves the stories that just change a few args
 * (no bounds, a decimal step, error, disabled). An input needs an accessible name,
 * so the `aria-label` is always written.
 */
export function numberInputPlaygroundSnippet(args: NumberInputPlaygroundSnippetArgs): string {
  const attributes: string[] = [`aria-label="${args["aria-label"] || "Quantity"}"`];
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.defaultValue !== undefined) attributes.push(`defaultValue={${args.defaultValue}}`);
  if (args.min !== undefined) attributes.push(`min={${args.min}}`);
  if (args.max !== undefined) attributes.push(`max={${args.max}}`);
  if (args.step !== undefined && args.step !== 1) attributes.push(`step={${args.step}}`);
  if (args.placeholder) attributes.push(`placeholder="${args.placeholder}"`);
  if (args.hasError) attributes.push("hasError");
  if (args.required) attributes.push("required");
  if (args.readOnly) attributes.push("readOnly");
  if (args.disabled) attributes.push("disabled");
  if (args.name) attributes.push(`name="${args.name}"`);
  return `<NumberInput ${attributes.join(" ")} />`;
}
