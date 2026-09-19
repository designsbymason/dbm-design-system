// The code shown under each story's "Show code" button on VisuallyHidden's Docs page.
//
// Hand-written rather than generated from the rendered story: the Playground's generated code
// prints `focusable={false} tabIndex={0}` inside the story's explanatory paragraph (the
// `tabIndex` is only there so the demo can be tabbed into), and the other three panels show the
// story object itself — one with a development comment about `IconButton` and `aria-labelledby`
// inside it. Each snippet here is the smallest real usage of what its story shows — only
// exports of the package, no demo scaffolding — and `storySnippets.test.ts` checks that stays
// true. See `07-storybook-and-documentation-standards.md` §4.2.

export const visuallyHiddenSnippets = {
  iconOnlyButtonLabel: `{/* IconButton doesn't render children, so the hidden text sits beside it and aria-labelledby points at it —
    it takes precedence over aria-label when the button's name is worked out. XIcon comes from
    @dbm-design-system/icons. */}
<VisuallyHidden id="close-label">Close dialog</VisuallyHidden>
<IconButton icon={XIcon} variant="ghost" aria-label="Close dialog" aria-labelledby="close-label" />`,

  inlineWithinText: `{/* Screen-reader-only text can sit inside a sentence, unseen and still announced in order */}
<p>
  This paragraph has{" "}
  <VisuallyHidden>text that only a screen reader announces, </VisuallyHidden>
  extra content hidden in the middle of otherwise normal text.
</p>`,

  skipLink: `{/* focusable keeps the element out of sight until it takes keyboard focus, then shows it in place.
    asChild puts that on your own <a> instead of wrapping it. Point href at your main content's id, and
    style the link for its focused state. */}
<VisuallyHidden asChild focusable>
  <a href="#main-content">Skip to main content</a>
</VisuallyHidden>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface VisuallyHiddenPlaygroundSnippetArgs {
  children?: unknown;
  focusable?: boolean;
}

/**
 * The Playground's snippet, built from its current controls: the hidden text, and `focusable`
 * only when it's on. The story's `tabIndex` is scaffolding for tabbing into the demo, so it
 * never appears.
 */
export function visuallyHiddenPlaygroundSnippet(args: VisuallyHiddenPlaygroundSnippetArgs): string {
  const open = args.focusable ? "<VisuallyHidden focusable>" : "<VisuallyHidden>";
  return `${open}${String(args.children ?? "Screen-reader-only text")}</VisuallyHidden>`;
}
