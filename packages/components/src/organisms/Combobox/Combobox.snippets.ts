// The code shown under each story's "Show code" button on Combobox's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code spells out
// every default (`allowCustomValue={false}`, `loading={false}`), fills handlers with no-ops and
// freezes controlled state. Each snippet is the smallest real usage of what its story shows,
// and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import { quote } from "../../snippetHelpers";

export const comboboxSnippets = {
  allSizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" */}
{/* countries: [{ value: "ca", label: "Canada" }, { value: "mx", label: "Mexico" }, …] */}
<Combobox aria-label="Country" size="sm" options={countries} />`,

  controlled: `{/* You own the value: const [country, setCountry] = useState("ca"); */}
<Combobox aria-label="Country" options={countries} value={country} onValueChange={setCountry} />`,

  groups: `{/* Options with the same group are listed together under its heading. */}
<Combobox
  aria-label="Plan"
  options={[
    { value: "free", label: "Free", group: "Personal" },
    { value: "plus", label: "Plus", group: "Personal" },
    { value: "team", label: "Team", group: "Work" },
  ]}
/>`,

  rich: `{/* A description under the label, a reason for an option that can't be chosen, an icon before the label. */}
{/* GlobeIcon comes from @dbm-system/icons */}
<Combobox
  aria-label="Plan"
  options={[
    { value: "team", label: "Team", description: "Shared projects and roles", icon: GlobeIcon },
    { value: "enterprise", label: "Enterprise", description: "Contact sales", disabled: "Available on request" },
  ]}
/>`,

  customRow: `{/* Draw the row yourself. Rows have a fixed height, so the content must fit it. */}
<Combobox
  aria-label="Person"
  options={people}
  renderOption={(option, { selected }) => (
    <strong>{selected ? \`\${option.label} (you)\` : option.label}</strong>
  )}
/>`,

  async: `{/* You fetch: filter={false} shows options as given. Search on "input"; a pick writes a label, not a query. */}
{/* const [results, setResults] = useState([]); const [loading, setLoading] = useState(false); */}
<Combobox
  aria-label="Search countries"
  options={results}
  filter={false}
  loading={loading}
  onInputValueChange={(text, reason) => reason === "input" && search(text)}
/>`,

  create: `{/* You own the options: const [options, setOptions] = useState(countries); */}
{/* Return the new option to have it chosen. A promise works too: the row waits for it. */}
<Combobox
  aria-label="Country"
  options={options}
  onCreate={(text) => {
    const option = { value: text.toLowerCase(), label: text };
    setOptions((current) => [...current, option]);
    return option;
  }}
/>`,

  customValue: `{/* The typed text is the value when it isn't an option; Enter or leaving the field commits it. */}
<Combobox aria-label="Destination" options={countries} allowCustomValue />`,

  fullWidth: `{/* Across the visible screen below the sm breakpoint, above or below the field, whichever has room. */}
<Combobox
  aria-label="Country"
  options={countries}
  presentation={{ base: "full-width", sm: "anchored" }}
/>`,

  highlightTone: `{/* The match is bold by default; a tone adds colour: "warning" | "highlight" | "success" | "info" | "danger". */}
<Combobox aria-label="Country" options={countries} highlightTone="highlight" />`,

  keywords: `{/* keywords are matched but never shown: "uk" or "britain" finds "United Kingdom". */}
<Combobox
  aria-label="Country"
  options={[
    { value: "gb", label: "United Kingdom", keywords: ["UK", "Britain"] },
    { value: "us", label: "United States", keywords: ["USA", "America"] },
  ]}
/>`,

  clearable: `<Combobox aria-label="Country" options={countries} defaultValue="ca" clearable />`,

  states: `{/* loading: shows a spinner and a "Loading…" row; error: a note under the options. */}
<Combobox aria-label="Country" options={countries} loading />
<Combobox aria-label="Country" options={countries} error />
<Combobox aria-label="Country" options={countries} emptyContent="No country by that name" />`,

  longList: `{/* Only the rows in view are drawn, so thousands of options cost the same as dozens. */}
<Combobox aria-label="Item" options={items} />`,

  error: `<Combobox aria-label="Country" options={countries} hasError />`,

  disabled: `<Combobox aria-label="Country" options={countries} defaultValue="ca" disabled />
<Combobox aria-label="Country" options={countries} defaultValue="ca" readOnly />`,

  openOnFocus: `<Combobox aria-label="Country" options={countries} openOnFocus />`,

  inFormField: `<FormField label="Country" helperText="Where the order ships" required>
  {(fieldProps) => <Combobox {...fieldProps} name="country" options={countries} />}
</FormField>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface ComboboxPlaygroundSnippetArgs {
  size?: string;
  placeholder?: string;
  allowCustomValue?: boolean;
  autoHighlight?: boolean;
  openOnFocus?: boolean;
  clearable?: boolean;
  loading?: boolean;
  error?: boolean;
  required?: boolean;
  hasError?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  name?: string;
  presentation?: string;
  highlightTone?: string;
  side?: string;
  align?: string;
  "aria-label"?: string;
}

/**
 * The Playground's snippet, built from its current controls: only the props that differ from
 * their defaults. The field needs a name and options, so those are always written.
 */
export function comboboxPlaygroundSnippet(args: ComboboxPlaygroundSnippetArgs): string {
  const attributes: string[] = [`aria-label=${quote(args["aria-label"] || "Country")}`, "options={countries}"];
  if (args.placeholder) attributes.push(`placeholder=${quote(args.placeholder)}`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.allowCustomValue) attributes.push("allowCustomValue");
  if (args.autoHighlight === false && !args.allowCustomValue) attributes.push("autoHighlight={false}");
  if (args.autoHighlight === true && args.allowCustomValue) attributes.push("autoHighlight");
  if (args.openOnFocus) attributes.push("openOnFocus");
  if (args.clearable) attributes.push("clearable");
  if (args.loading) attributes.push("loading");
  if (args.error) attributes.push("error");
  if (args.highlightTone && args.highlightTone !== "none") attributes.push(`highlightTone="${args.highlightTone}"`);
  if (args.presentation && args.presentation !== "anchored") attributes.push(`presentation="${args.presentation}"`);
  if (args.side && args.side !== "bottom") attributes.push(`side="${args.side}"`);
  if (args.align && args.align !== "start") attributes.push(`align="${args.align}"`);
  if (args.required) attributes.push("required");
  if (args.hasError) attributes.push("hasError");
  if (args.readOnly) attributes.push("readOnly");
  if (args.disabled) attributes.push("disabled");
  if (args.name) attributes.push(`name=${quote(args.name)}`);
  return `{/* countries: [{ value: "ca", label: "Canada" }, { value: "mx", label: "Mexico" }, …] */}\n<Combobox ${attributes.join(" ")} />`;
}
