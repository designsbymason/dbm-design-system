// The code shown under each story's "Show code" button on FieldGroup's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code spells out every default,
// keeps the story's demo wrapper, and drops the render-prop children a FormField needs. Each snippet here is
// the smallest real usage of what its story shows — only exports of the package, no demo scaffolding — and
// `storySnippets.test.ts` checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

const field = (label: string, indent = "  ", inputProps = "", fieldProps = "") =>
  `${indent}<FormField label="${label}"${fieldProps ? ` ${fieldProps}` : ""}>{(field) => <Input {...field}${inputProps ? ` ${inputProps}` : ""} />}</FormField>`;

const address = `${field("Street")}
${field("City")}
${field("Postcode")}`;

const streetAndCity = `${field("Street")}
${field("City")}`;

const contact = `${field("Email", "  ", 'type="email"')}
${field("Phone", "  ", 'type="tel"')}`;

const group = (attributes: string, children: string) =>
  `<FieldGroup ${attributes}>\n${children}\n</FieldGroup>`;

export const fieldGroupSnippets = {
  variants: `{/* variant: "ghost" (default, no box) | "outlined" | "filled" */}
${group('legend="Shipping address" variant="outlined"', streetAndCity)}`,

  horizontal: `{/* orientation: "vertical" (default) | "horizontal" — fields side by side, wrapping when a field would get too narrow.
    It also takes a breakpoint map: orientation={{ base: "vertical", md: "horizontal" }} */}
${group(
    'legend="Date of birth" orientation="horizontal"',
    `${field("Day", "  ", 'inputMode="numeric"')}\n${field("Month", "  ", 'inputMode="numeric"')}\n${field("Year", "  ", 'inputMode="numeric"')}`,
  )}`,

  states: `{/* description sits under the legend; error is about the group as a whole (each field keeps its own error) */}
${group('legend="Contact" description="We only use this to confirm your order." error="Give us an email address or a phone number."', contact)}

{/* disabled disables every field in the group */}
${group('legend="Contact" description="We only use this to confirm your order." disabled', contact)}`,

  hiddenLegend: `{/* hideLegend keeps the legend for screen readers and takes it off the page */}
${group('legend="Search filters" hideLegend orientation="horizontal"', `${field("Keyword")}\n${field("Location")}`)}`,

  nested: `{/* A group inside a group keeps the outer group's size and disabled state */}
<FieldGroup legend="Billing details" variant="outlined">
  <FieldGroup legend="Address">
${field("Street", "    ")}
${field("City", "    ")}
  </FieldGroup>
  <FieldGroup legend="Contact">
${field("Email", "    ", 'type="email"')}
  </FieldGroup>
</FieldGroup>`,

  columns: `{/* columns gives the group a grid; wrap each field in FieldGroup.Item and give it a span (a number, or a breakpoint map) */}
<FieldGroup legend="Delivery address" columns={{ base: 1, md: 3 }}>
  <FieldGroup.Item span={{ base: 1, md: 3 }}>
${field("Street", "    ")}
  </FieldGroup.Item>
  <FieldGroup.Item span={{ base: 1, md: 2 }}>
${field("City", "    ")}
  </FieldGroup.Item>
  <FieldGroup.Item>
${field("Postcode", "    ")}
  </FieldGroup.Item>
</FieldGroup>`,

  legend: `{/* legendSize sizes the legend alone; size is the default for every field inside; required marks the legend (visual only) */}
<FieldGroup
  legend="Account details"
  legendSize="xl"
  size="sm"
  required
  description="All of these are needed to create your account."
>
${contact}
</FieldGroup>`,

  gaps: `{/* gap is the space between rows, columnGap between side-by-side fields (it defaults to gap); both take a breakpoint map */}
<FieldGroup
  legend="Tight rows, wide columns"
  orientation="horizontal"
  gap={{ base: 2, md: 3 }}
  columnGap={{ base: 4, md: 10 }}
>
${field("First name")}
${field("Middle name")}
${field("Last name")}
</FieldGroup>`,

  size: `{/* size is the default for every FormField inside — its label, and the control it hands its size to when you spread
    {...field} (a field's own size wins) — and the legend's size unless legendSize is set */}
<FieldGroup legend="Large group" size="lg">
  <FormField label="Inherits lg">{(field) => <Input {...field} />}</FormField>
  <FormField label="Own size: sm" size="sm">{(field) => <Input {...field} />}</FormField>
</FieldGroup>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface FieldGroupPlaygroundSnippetArgs {
  legend?: string;
  description?: string;
  error?: string;
  required?: boolean;
  hideLegend?: boolean;
  variant?: string;
  size?: string;
  legendSize?: string;
  orientation?: unknown;
  columns?: number;
  gap?: number | string;
  columnGap?: number | string;
  disabled?: boolean;
}

/**
 * The Playground's snippet, built from its current controls: only the props that differ from their defaults,
 * around three real fields — the fields are what make a group mean anything, so they're always there.
 */
export function fieldGroupPlaygroundSnippet(args: FieldGroupPlaygroundSnippetArgs): string {
  const quote = (text: string) => (/["&<{]/.test(text) ? `{${JSON.stringify(text)}}` : `"${text}"`);
  const attributes: string[] = [`legend=${quote(args.legend || "Shipping address")}`];
  if (args.description) attributes.push(`description=${quote(args.description)}`);
  if (args.error) attributes.push(`error=${quote(args.error)}`);
  if (args.required) attributes.push("required");
  if (args.hideLegend) attributes.push("hideLegend");
  if (args.variant && args.variant !== "ghost") attributes.push(`variant="${args.variant}"`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.legendSize) attributes.push(`legendSize="${args.legendSize}"`);
  if (args.orientation && args.orientation !== "vertical") attributes.push(`orientation="${String(args.orientation)}"`);
  if (args.columns) attributes.push(`columns={${args.columns}}`);
  if (args.gap !== undefined && Number(args.gap) !== 4) attributes.push(`gap={${Number(args.gap)}}`);
  if (args.columnGap !== undefined && !Number.isNaN(args.columnGap)) attributes.push(`columnGap={${Number(args.columnGap)}}`);
  if (args.disabled) attributes.push("disabled");
  return group(attributes.join(" "), address);
}
