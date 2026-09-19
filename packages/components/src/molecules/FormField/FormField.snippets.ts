// The code shown under each story's "Show code" button on FormField's Docs page.
//
// Hand-written rather than generated from the rendered story: `FormField`'s child
// is a render function, which the generated code drops entirely — it shows a
// `<FormField label="…" />` with no control in it — and it also spells out every
// default and the story's demo wrapper. Each snippet here is the smallest real
// usage of what its story shows — only exports of the package, no demo
// scaffolding — and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

const emailInput = `  {(fieldProps) => <Input {...fieldProps} type="email" placeholder="you@example.com" />}`;

const field = (attributes: string, child = emailInput) =>
  `<FormField${attributes ? ` ${attributes}` : ""}>\n${child}\n</FormField>`;

export const formFieldSnippets = {
  withDifferentControls: `{/* FormField hands its label, helper text, error, and ids to whatever control you render, via
    the fieldProps render prop — spread them onto the control. */}
<FormField label="Email address" helperText="We'll never share this">
  {(fieldProps) => <Input {...fieldProps} type="email" placeholder="you@example.com" />}
</FormField>

<FormField label="Bio" helperText="Up to 280 characters">
  {(fieldProps) => <Textarea {...fieldProps} placeholder="Tell us about yourself" />}
</FormField>

<FormField label="Accept terms">
  {(fieldProps) => <Checkbox {...fieldProps}>I agree to the Terms of Service</Checkbox>}
</FormField>

<FormField label="Contact method">
  {(fieldProps) => (
    <RadioGroup {...fieldProps} defaultValue="email">
      <Radio value="email">Email</Radio>
      <Radio value="sms">SMS</Radio>
    </RadioGroup>
  )}
</FormField>

<FormField label="Interests">
  {(fieldProps) => (
    <CheckboxGroup {...fieldProps} defaultValue={["sports"]}>
      <Checkbox value="sports">Sports</Checkbox>
      <Checkbox value="music">Music</Checkbox>
    </CheckboxGroup>
  )}
</FormField>

<FormField label="Plan">
  {(fieldProps) => (
    <Select {...fieldProps} placeholder="Choose a plan" defaultValue="monthly">
      <Select.Option value="monthly">Monthly</Select.Option>
      <Select.Option value="annual">Annual</Select.Option>
    </Select>
  )}
</FormField>`,

  states: `{/* required adds the required marker; error shows the message and marks the control invalid;
    disabled disables the control. */}
<FormField label="Default" helperText="We'll never share this">
  {(fieldProps) => <Input {...fieldProps} placeholder="you@example.com" />}
</FormField>

<FormField label="Required" helperText="We'll never share this" required>
  {(fieldProps) => <Input {...fieldProps} placeholder="you@example.com" />}
</FormField>

<FormField label="Error" helperText="We'll never share this" error="Enter a valid email address">
  {(fieldProps) => <Input {...fieldProps} placeholder="you@example.com" />}
</FormField>

<FormField label="Disabled" helperText="We'll never share this" disabled>
  {(fieldProps) => <Input {...fieldProps} placeholder="you@example.com" />}
</FormField>`,

  controlledWithLiveValidation: `{/* You own the value and derive the error from it:
    const [value, setValue] = useState("");
    const error = value.length > 0 && !value.includes("@") ? "Enter a valid email address" : undefined; */}
<FormField label="Email address" helperText="We'll never share this" error={error}>
  {(fieldProps) => (
    <Input
      {...fieldProps}
      type="email"
      placeholder="you@example.com"
      value={value}
      onChange={(event) => setValue(event.target.value)}
    />
  )}
</FormField>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface FormFieldPlaygroundSnippetArgs {
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  size?: string;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults, around a real text input — the control is what
 * makes a `FormField` mean anything, so it's always there.
 */
export function formFieldPlaygroundSnippet(args: FormFieldPlaygroundSnippetArgs): string {
  const attributes: string[] = [`label="${args.label || "Email address"}"`];
  if (args.helperText) attributes.push(`helperText="${args.helperText.replace(/"/g, "&quot;")}"`);
  if (args.error) attributes.push(`error="${args.error.replace(/"/g, "&quot;")}"`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.required) attributes.push("required");
  if (args.disabled) attributes.push("disabled");
  return field(attributes.join(" "));
}
