// The code shown under each story's "Show code" button on FieldGroup's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code spells out every default,
// keeps the story's demo wrapper, and drops the render-prop children a FormField needs. Each snippet here is
// the smallest real usage of what its story shows — only exports of the package, no demo scaffolding — and
// `storySnippets.test.ts` checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

const field = (label: string, indent = "  ") =>
  `${indent}<FormField label="${label}">{(field) => <Input {...field} />}</FormField>`;

const address = `${field("Street")}
${field("City")}
${field("Postcode")}`;

const group = (attributes: string, children: string) =>
  `<FieldGroup ${attributes}>\n${children}\n</FieldGroup>`;

export const fieldGroupSnippets = {
  variants: `{/* variant: "ghost" (default, no box) | "outlined" | "filled" */}
${group('legend="Shipping address" variant="outlined"', address)}`,

  horizontal: `{/* orientation: "vertical" (default) | "horizontal" — fields side by side, wrapping when a field would get too narrow.
    It also takes a breakpoint map: orientation={{ base: "vertical", md: "horizontal" }} */}
${group('legend="Date of birth" orientation="horizontal"', `${field("Day")}\n${field("Month")}\n${field("Year")}`)}`,

  states: `{/* description sits under the legend; error is about the group as a whole (each field keeps its own error) */}
${group('legend="Contact" description="We only use this to confirm your order." error="Give us an email address or a phone number."', `${field("Email")}\n${field("Phone")}`)}

{/* disabled disables every field in the group */}
${group('legend="Contact" disabled', `${field("Email")}\n${field("Phone")}`)}`,

  hiddenLegend: `{/* hideLegend keeps the legend for screen readers and takes it off the page */}
${group('legend="Search filters" hideLegend', `${field("Keyword")}\n${field("Location")}`)}`,

  nested: `{/* A group inside a group keeps the outer group's size and disabled state */}
<FieldGroup legend="Billing details" variant="outlined">
  <FieldGroup legend="Address">
${field("Street", "    ")}
${field("City", "    ")}
  </FieldGroup>
  <FieldGroup legend="Contact">
${field("Email", "    ")}
  </FieldGroup>
</FieldGroup>`,

  size: `{/* size sets the legend's type size, and is the default size for every FormField inside (a field's own size wins) */}
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
  hideLegend?: boolean;
  variant?: string;
  size?: string;
  orientation?: unknown;
  gap?: number | string;
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
  if (args.hideLegend) attributes.push("hideLegend");
  if (args.variant && args.variant !== "ghost") attributes.push(`variant="${args.variant}"`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.orientation && args.orientation !== "vertical") attributes.push(`orientation="${String(args.orientation)}"`);
  if (args.gap !== undefined && Number(args.gap) !== 4) attributes.push(`gap={${Number(args.gap)}}`);
  if (args.disabled) attributes.push("disabled");
  return group(attributes.join(" "), address);
}
