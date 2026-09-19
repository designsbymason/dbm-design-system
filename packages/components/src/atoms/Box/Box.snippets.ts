// The code shown under each story's "Show code" button on Box's Docs page.
//
// Hand-written rather than generated from the rendered story: the Playground's
// generated code spells out `as="div"` and the story's demo `style`, the two
// `as="button"` / `as={CustomComponent}` panels show the story object itself — one
// with an internal document's name in a comment, the other calling a helper defined in
// the stories file — and the "as section" story's text contains `<section>`, which the
// generated code would print unescaped. Each snippet here is the smallest real usage of
// what its story shows — only exports of the package, no demo scaffolding — and
// `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

export const boxSnippets = {
  asButton: `{/* as renders a different element, and that element's own props type-check — here a native button's type */}
<Box as="button" type="button">Save</Box>`,

  asCustomComponent: `{/* as also takes a React component, not only a tag. Here CustomLabel is a component that renders
    <span><strong>{label}: </strong>{children}</span>, and its own label prop type-checks too. */}
<Box as={CustomLabel} label="Status">Ready</Box>`,
} as const;

// Text that goes inside JSX: the characters JSX would read as markup or an expression.
const escapeJsxText = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\{/g, "&#123;").replace(/\}/g, "&#125;");

/** The Playground's live controls, as far as the snippet cares. */
export interface BoxPlaygroundSnippetArgs {
  as?: string;
  children?: unknown;
}

/**
 * The Playground's snippet, built from its current controls: the element only when it
 * isn't the default `div`. The Playground's demo `style` is left out — it's there to
 * make the box visible, not part of using one. Also serves the "as section" story.
 */
export function boxPlaygroundSnippet(args: BoxPlaygroundSnippetArgs): string {
  const attribute = args.as && args.as !== "div" ? ` as="${args.as}"` : "";
  return `<Box${attribute}>${escapeJsxText(String(args.children ?? "A Box, rendered as a div."))}</Box>`;
}
