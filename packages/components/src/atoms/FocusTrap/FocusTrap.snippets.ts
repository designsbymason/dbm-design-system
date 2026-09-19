// The code shown under each story's "Show code" button on FocusTrap's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code runs to 67
// lines — `asChild={false} loop={false} trapped={false}` around the story's styled box and its
// explanatory paragraph. A FocusTrap has nothing to show without focusable things inside it, so
// the snippet keeps a few plain fields and drops the decoration. Each snippet here is the
// smallest real usage of what its story shows — only exports of the package, no demo
// scaffolding — and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

/** The Playground's live controls, as far as the snippet cares. */
export interface FocusTrapPlaygroundSnippetArgs {
  trapped?: boolean;
  loop?: boolean;
  asChild?: boolean;
}

/**
 * The Playground's snippet, built from its current controls: only the props that are on (all
 * three default to off), around a small group of focusable fields.
 */
export function focusTrapPlaygroundSnippet(args: FocusTrapPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.trapped) attributes.push("trapped");
  if (args.loop) attributes.push("loop");
  if (args.asChild) attributes.push("asChild");
  const open = attributes.length > 0 ? `<FocusTrap ${attributes.join(" ")}>` : "<FocusTrap>";
  return `${open}
  <div>
    <input placeholder="First field" />
    <input placeholder="Second field" />
    <button type="button">Third field (button)</button>
  </div>
</FocusTrap>`;
}
