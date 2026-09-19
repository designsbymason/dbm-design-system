// The code shown under each story's "Show code" button on Portal's Docs page.
//
// Hand-written rather than generated from the rendered story: the Playground's generated code
// runs to 57 lines of the story's dashed box and explanatory prose, and the other two panels
// show the story object itself — with development notes inside it ("A real, confirmed bug
// (found during this component's own review pass)…", "see Default's own comment above") that
// were never meant for a reader. Each snippet here is the smallest real usage of what its story
// shows — only exports of the package, no demo scaffolding — and `storySnippets.test.ts`
// checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

export const portalSnippets = {
  customContainer: `{/* const [container, setContainer] = useState<HTMLDivElement | null>(null); */}
{/* container takes the element to render into instead of document.body. Capture it with a ref callback: the
    element doesn't exist during the first render, so mount the Portal once it does. */}
<div ref={setContainer} />
{container && (
  <Portal container={container}>
    <span>Portaled into custom container</span>
  </Portal>
)}`,

  disabledPortal: `{/* disablePortal renders the children exactly where they're declared — no portal, no wrapper element.
    Useful for switching a portaled component off in a test or a constrained layout. */}
<Portal disablePortal>
  <div>Not portaled — rendered in place</div>
</Portal>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface PortalPlaygroundSnippetArgs {
  disablePortal?: boolean;
  asChild?: boolean;
}

/**
 * The Playground's snippet, built from its current controls: only the props that are on (both
 * default to off), around one element. With `asChild` the element is the portaled root itself.
 */
export function portalPlaygroundSnippet(args: PortalPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.disablePortal) attributes.push("disablePortal");
  if (args.asChild) attributes.push("asChild");
  const open = attributes.length > 0 ? `<Portal ${attributes.join(" ")}>` : "<Portal>";
  const comment = args.disablePortal ? "" : "{/* Renders into document.body by default; see container for rendering somewhere else. */}\n";
  return `${comment}${open}\n  <span>Portaled content</span>\n</Portal>`;
}
