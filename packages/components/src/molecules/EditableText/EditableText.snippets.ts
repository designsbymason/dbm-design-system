// The code shown under each story's "Show code" button on EditableText's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code spells out
// every default (`multiline={false}`, `showControls={false}`), fills handlers with no-ops and
// freezes controlled state. Each snippet is the smallest real usage of what its story shows,
// and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import { quote } from "../../snippetHelpers";

export const editableTextSnippets = {
  allSizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" */}
<EditableText aria-label="Project name" size="sm" defaultValue="Apollo" />`,

  multiline: `{/* Enter adds a line; Ctrl or Cmd + Enter commits. */}
<EditableText
  aria-label="Notes"
  multiline
  maxRows={6}
  placeholder="Add notes"
  defaultValue={"Kick-off on Monday.\\nBring the launch plan."}
/>`,

  controls: `{/* Confirm and cancel buttons beside the field, for touch screens. */}
<EditableText aria-label="Project name" defaultValue="Apollo" showControls />`,

  doubleClick: `{/* A click selects the row; a double click (or Enter on the focused text) edits. */}
<EditableText aria-label="Owner" defaultValue="Ada Lovelace" activation="doubleClick" />`,

  cancelOnBlur: `{/* Leaving the field throws the edit away; only Enter or the buttons keep it. */}
<EditableText aria-label="Project name" defaultValue="Apollo" blurBehavior="cancel" showControls />`,

  validation: `{/* A message from validate (or required) refuses the commit and keeps the field open. */}
<EditableText
  aria-label="Project name"
  defaultValue="Apollo"
  required
  validate={(draft) => (draft.length > 20 ? "Keep it under 20 characters" : undefined)}
/>`,

  inheritFont: `{/* Takes the heading's type, so the title still reads as a title. */}
<h2>
  <EditableText aria-label="Page title" defaultValue="Quarterly plan" inheritFont size="lg" />
</h2>`,

  placeholder: `<EditableText aria-label="Nickname" placeholder="Add a nickname" />`,

  errorState: `{/* hasError marks a value invalid from outside, such as a server rejection. */}
<EditableText aria-label="Project name" defaultValue="Apollo" hasError />`,

  disabled: `<EditableText aria-label="Project name" defaultValue="Apollo" disabled />`,

  readOnly: `{/* Plain text, same size, still submitted under name. */}
<EditableText aria-label="Project name" defaultValue="Apollo" readOnly name="project" />`,

  saving: `{/* You own the request and the flags:
    const [value, setValue] = useState("Apollo");
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    onValueChange: setSaving(true), send the request, and on success setValue(next),
    setSaving(false) and setEditing(false). Ignore onEditingChange(false) while saving. */}
<EditableText
  aria-label="Project name"
  value={value}
  onValueChange={save}
  editing={editing}
  onEditingChange={requestEditing}
  isLoading={saving}
/>`,

  counter: `{/* The count shows beside the field while it is open; onDraftChange sees each change. */}
<EditableText
  aria-label="Bio"
  multiline
  maxLength={160}
  showCount
  onDraftChange={(draft) => checkAvailability(draft)}
/>`,

  formattedValue: `{/* The text reads formatted; the field edits the raw string. */}
<EditableText
  aria-label="Price"
  defaultValue="1250"
  renderValue={(raw) => \`$\${Number(raw).toFixed(2)}\`}
  inputMode="decimal"
/>`,

  actionRef: `{/* const actions = useRef<EditableTextActions>(null);
    <Button onClick={() => actions.current?.edit()}>Rename</Button> */}
<EditableText aria-label="Project name" defaultValue="Apollo" actionRef={actions} />`,

  inFormField: `<FormField label="Project name" helperText="Shown on the dashboard">
  {(fieldProps) => <EditableText {...fieldProps} defaultValue="Apollo" />}
</FormField>`,

  controlled: `{/* You own both: const [value, setValue] = useState("Apollo");
    const [editing, setEditing] = useState(false); */}
<EditableText
  aria-label="Project name"
  value={value}
  onValueChange={setValue}
  editing={editing}
  onEditingChange={setEditing}
/>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface EditableTextPlaygroundSnippetArgs {
  defaultValue?: string;
  placeholder?: string;
  size?: string;
  multiline?: boolean;
  blurBehavior?: string;
  activation?: string;
  showControls?: boolean;
  showEditIcon?: boolean;
  selectOnFocus?: boolean;
  inheritFont?: boolean;
  required?: boolean;
  isLoading?: boolean;
  showCount?: boolean;
  hasError?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  name?: string;
  "aria-label"?: string;
}

/**
 * The Playground's snippet, built from its current controls: only the props that differ from
 * their defaults. Also serves the stories that just change a few args. The component needs a
 * name, so the `aria-label` is always written.
 */
export function editableTextPlaygroundSnippet(args: EditableTextPlaygroundSnippetArgs): string {
  const attributes: string[] = [`aria-label=${quote(args["aria-label"] || "Project name")}`];
  if (args.defaultValue) attributes.push(`defaultValue=${quote(args.defaultValue)}`);
  if (args.placeholder) attributes.push(`placeholder=${quote(args.placeholder)}`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.multiline) attributes.push("multiline");
  if (args.blurBehavior && args.blurBehavior !== "commit") attributes.push(`blurBehavior="${args.blurBehavior}"`);
  if (args.activation && args.activation !== "click") attributes.push(`activation="${args.activation}"`);
  if (args.showControls) attributes.push("showControls");
  if (args.showEditIcon === false) attributes.push("showEditIcon={false}");
  if (args.selectOnFocus === false) attributes.push("selectOnFocus={false}");
  if (args.inheritFont) attributes.push("inheritFont");
  if (args.required) attributes.push("required");
  if (args.isLoading) attributes.push("isLoading");
  if (args.showCount) attributes.push("showCount");
  if (args.hasError) attributes.push("hasError");
  if (args.readOnly) attributes.push("readOnly");
  if (args.disabled) attributes.push("disabled");
  if (args.maxLength !== undefined) attributes.push(`maxLength={${args.maxLength}}`);
  if (args.name) attributes.push(`name=${quote(args.name)}`);
  return `<EditableText ${attributes.join(" ")} />`;
}
