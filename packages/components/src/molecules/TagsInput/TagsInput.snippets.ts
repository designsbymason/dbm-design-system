// The code shown under each story's "Show code" button on TagsInput's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code spells out
// every default (`allowDuplicates={false}`, `clearable={false}`), fills handlers with no-ops and
// freezes controlled state. Each snippet is the smallest real usage of what its story shows,
// and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import { quote } from "../../snippetHelpers";

export const tagsInputSnippets = {
  allSizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" */}
<TagsInput aria-label="Labels" size="sm" defaultValue={["design", "urgent"]} />`,

  controlled: `{/* You own the tags: const [tags, setTags] = useState(["design", "urgent"]); */}
<TagsInput aria-label="Labels" value={tags} onValueChange={setTags} />`,

  separators: `{/* Enter always adds; these end a tag when typed, and split a paste. */}
<TagsInput aria-label="Emails" separators={[",", ";", " "]} />`,

  limit: `{/* A repeat and a sixth tag are refused, with a message that is also announced. */}
<TagsInput aria-label="Labels" maxTags={5} maxTagLength={20} />`,

  validation: `{/* A message refuses the tag; the text stays in the entry so it can be fixed. */}
<TagsInput
  aria-label="Recipients"
  placeholder="Add an email"
  validate={(tag) => (/^\\S+@\\S+\\.\\S+$/.test(tag) ? undefined : "Not an email address")}
  spellCheck={false}
  autoCapitalize="off"
/>`,

  transform: `{/* Normalize each piece before it is checked: here, lower-case with no # prefix. */}
<TagsInput aria-label="Topics" transform={(raw) => raw.trim().replace(/^#/, "").toLowerCase()} />`,

  duplicates: `<TagsInput aria-label="Ingredients" allowDuplicates defaultValue={["egg", "egg"]} />`,

  clearable: `<TagsInput aria-label="Labels" clearable defaultValue={["design", "urgent", "review"]} />`,

  tones: `{/* tone (brand by default) and variant are Tag's own; every chip shares them. */}
<TagsInput aria-label="Labels" tone="success" variant="outlined" defaultValue={["design", "urgent"]} />`,

  errorState: `<TagsInput aria-label="Labels" hasError defaultValue={["design"]} />`,

  disabled: `<TagsInput aria-label="Labels" disabled defaultValue={["design", "urgent"]} />`,

  readOnly: `{/* Chips with no remove buttons, same size, still submitted under name. */}
<TagsInput aria-label="Labels" readOnly name="labels" defaultValue={["design", "urgent"]} />`,

  inFormField: `<FormField label="Labels" helperText="Press Enter or type a comma to add one">
  {(fieldProps) => <TagsInput {...fieldProps} name="labels" />}
</FormField>`,

  form: `{/* Each tag is submitted as its own value: new FormData(form).getAll("labels"). */}
<form onSubmit={handleSubmit}>
  <TagsInput aria-label="Labels" name="labels" required defaultValue={["design"]} />
</form>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface TagsInputPlaygroundSnippetArgs {
  defaultValue?: string[];
  placeholder?: string;
  size?: string;
  tone?: string;
  variant?: string;
  addOnBlur?: boolean;
  allowDuplicates?: boolean;
  maxTags?: number;
  clearable?: boolean;
  required?: boolean;
  hasError?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  name?: string;
  "aria-label"?: string;
}

/**
 * The Playground's snippet, built from its current controls: only the props that differ from
 * their defaults. Also serves the stories that just change a few args. The field needs a name,
 * so the `aria-label` is always written.
 */
export function tagsInputPlaygroundSnippet(args: TagsInputPlaygroundSnippetArgs): string {
  const attributes: string[] = [`aria-label=${quote(args["aria-label"] || "Labels")}`];
  if (args.defaultValue && args.defaultValue.length > 0) {
    attributes.push(`defaultValue={[${args.defaultValue.map((tag) => JSON.stringify(tag)).join(", ")}]}`);
  }
  if (args.placeholder) attributes.push(`placeholder=${quote(args.placeholder)}`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.tone && args.tone !== "brand") attributes.push(`tone="${args.tone}"`);
  if (args.variant && args.variant !== "subtle") attributes.push(`variant="${args.variant}"`);
  if (args.addOnBlur === false) attributes.push("addOnBlur={false}");
  if (args.allowDuplicates) attributes.push("allowDuplicates");
  if (args.maxTags !== undefined && args.maxTags > 0) attributes.push(`maxTags={${args.maxTags}}`);
  if (args.clearable) attributes.push("clearable");
  if (args.required) attributes.push("required");
  if (args.hasError) attributes.push("hasError");
  if (args.readOnly) attributes.push("readOnly");
  if (args.disabled) attributes.push("disabled");
  if (args.name) attributes.push(`name=${quote(args.name)}`);
  return `<TagsInput ${attributes.join(" ")} />`;
}
