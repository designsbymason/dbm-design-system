// The code shown under each story's "Show code" button on PinInput's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code spells out every default
// (`length={6}`, `type="numeric"`, `hasError={false}`), fills handlers with no-ops and keeps the story's demo wrapper.
// Each snippet here is the smallest real usage of what its story shows — only exports of the package, no demo
// scaffolding — and `storySnippets.test.ts` checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

export const pinInputSnippets = {
  allSizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" */}
<PinInput aria-label="Verification code" size="sm" />`,

  alphanumeric: `{/* type: "numeric" (default) | "alphanumeric" | "text" */}
<PinInput aria-label="Invite code" type="alphanumeric" length={8} />`,

  grouped: `{/* groups: the size of each run of cells, adding up to length. separator: what is drawn between runs. */}
<PinInput aria-label="Verification code" groups={[3, 3]} />`,

  masked: `{/* mask draws a dot for each character; revealable adds the button that shows them. */}
<PinInput aria-label="PIN" length={4} mask revealable />`,

  placeholder: `{/* One character is repeated in every empty cell; several are spread one per cell. */}
<PinInput aria-label="Verification code" placeholder="○" />`,

  inFormField: `<FormField label="Verification code" helperText="We sent a 6-digit code to your phone.">
  {(fieldProps) => <PinInput {...fieldProps} />}
</FormField>`,

  complete: `{/* verify: your function; called with the code once the last cell is filled. */}
<PinInput aria-label="Verification code" onComplete={verify} />`,

  controlled: `{/* You own the value: const [code, setCode] = useState(""); */}
<PinInput aria-label="Verification code" value={code} onValueChange={setCode} />`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface PinInputPlaygroundSnippetArgs {
  length?: number;
  type?: string;
  size?: string;
  placeholder?: string;
  mask?: boolean;
  revealable?: boolean;
  hasError?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  name?: string;
  defaultValue?: string;
  "aria-label"?: string;
}

/**
 * The Playground's snippet, built from its current controls: only the props that differ from their defaults. Also
 * serves the stories that just change a few args (error, disabled, read-only). A field needs an accessible name,
 * so the `aria-label` is always written.
 */
export function pinInputPlaygroundSnippet(args: PinInputPlaygroundSnippetArgs): string {
  const attributes: string[] = [`aria-label="${args["aria-label"] || "Verification code"}"`];
  if (args.length !== undefined && args.length !== 6) attributes.push(`length={${args.length}}`);
  if (args.type && args.type !== "numeric") attributes.push(`type="${args.type}"`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.placeholder) attributes.push(`placeholder="${args.placeholder}"`);
  if (args.defaultValue) attributes.push(`defaultValue="${args.defaultValue}"`);
  if (args.mask) attributes.push("mask");
  if (args.mask && args.revealable) attributes.push("revealable");
  if (args.hasError) attributes.push("hasError");
  if (args.required) attributes.push("required");
  if (args.readOnly) attributes.push("readOnly");
  if (args.disabled) attributes.push("disabled");
  if (args.name) attributes.push(`name="${args.name}"`);
  return `<PinInput ${attributes.join(" ")} />`;
}
