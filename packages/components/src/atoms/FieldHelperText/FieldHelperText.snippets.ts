// The code shown under each story's "Show code" button on FieldHelperText's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code
// spells out `disabled={false}` on the Playground. Both panels are just the Playground
// with a prop or two, so one builder serves them. The snippet is the smallest real
// usage of what its story shows — only exports of the package, no demo scaffolding —
// and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

/** The Playground's live controls, as far as the snippet cares. */
export interface FieldHelperTextPlaygroundSnippetArgs {
  children?: unknown;
  disabled?: boolean;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults. Also serves the disabled story.
 */
export function fieldHelperTextPlaygroundSnippet(args: FieldHelperTextPlaygroundSnippetArgs): string {
  const text = String(args.children ?? "At least 8 characters, including a number");
  return `<FieldHelperText${args.disabled ? " disabled" : ""}>${text}</FieldHelperText>`;
}
