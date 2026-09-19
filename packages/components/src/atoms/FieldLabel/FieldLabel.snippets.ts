// The code shown under each story's "Show code" button on FieldLabel's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code
// spells out every default (`required={false}`, `disabled={false}`, `size="md"`) and
// the "All sizes" story's demo wrapper. Each snippet here is the smallest real usage
// of what its story shows — only exports of the package, no demo scaffolding — and
// `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import type { FieldLabelSize } from "./FieldLabel.types";

export const fieldLabelSnippets = {
  allSizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" */}
<FieldLabel htmlFor="field-lg" size="lg">Size lg</FieldLabel>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface FieldLabelPlaygroundSnippetArgs {
  children?: unknown;
  htmlFor?: string;
  size?: FieldLabelSize;
  required?: boolean;
  disabled?: boolean;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults. `htmlFor` is always written — it's what ties the label
 * to its control. Also serves the required and disabled stories.
 */
export function fieldLabelPlaygroundSnippet(args: FieldLabelPlaygroundSnippetArgs): string {
  const attributes: string[] = [`htmlFor="${args.htmlFor || "email"}"`];
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.required) attributes.push("required");
  if (args.disabled) attributes.push("disabled");
  return `<FieldLabel ${attributes.join(" ")}>${String(args.children ?? "Email address")}</FieldLabel>`;
}
