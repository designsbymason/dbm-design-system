// The code shown under each story's "Show code" button on Spinner's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code
// is close already, but it keeps the story's demo wrapper `div`, and the Playground
// prints an empty `label=""`. Each snippet here is the smallest real usage of what
// its story shows — only exports of the package, no demo scaffolding — and
// `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import type { SpinnerSize } from "./Spinner.types";

export const spinnerSnippets = {
  allSizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" */}
<Spinner size="lg" tone="brand" label="Loading" />`,

  allTones: `{/* tone: the same scale Icon uses — "default" | "secondary" | "brand" | "disabled" (and more).
    With no tone it takes the colour of the text around it, so it suits a coloured button or banner. */}
<Spinner tone="secondary" label="Loading" />`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface SpinnerPlaygroundSnippetArgs {
  size?: SpinnerSize;
  tone?: string;
  label?: string;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults. Also serves the labelled story. A spinner with no
 * `label` is decorative and silent to assistive technology, so it's written as
 * `<Spinner />` only when the label really is empty.
 */
export function spinnerPlaygroundSnippet(args: SpinnerPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.tone) attributes.push(`tone="${args.tone}"`);
  if (args.label) attributes.push(`label="${args.label}"`);
  return attributes.length > 0 ? `<Spinner ${attributes.join(" ")} />` : "<Spinner />";
}
