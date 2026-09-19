// The code shown under each story's "Show code" button on BackToTop's Docs page.
//
// Hand-written rather than generated from the rendered story: the Playground and "Visible
// state" panels print `<BoundedScrollDemo …>`, a helper defined in the stories file (a
// BackToTop is fixed to the viewport, so the stories wrap it in a scroll area of their own);
// "Within a scroll container" runs to 198 lines with `ref={{ current: '[Circular]' }}` and a
// `data-testid`. BackToTop only ever needs to be mounted once, so the snippets are just the
// component — the one exception keeps the scroll container and ref that the third story is
// about. Each snippet here is the smallest real usage of what its story shows — only exports
// of the package, no demo scaffolding — and `storySnippets.test.ts` checks that stays true.
// See `07-storybook-and-documentation-standards.md` §4.2.

import type { BackToTopProps } from "./BackToTop.types";
import { quote } from "../../snippetHelpers";

export const backToTopSnippets = {
  withinScrollContainer: `{/* const containerRef = useRef<HTMLDivElement>(null); */}
{/* scrollContainerRef points BackToTop at a scrolling element that isn't the page: it appears once that
    element has scrolled past the threshold, and scrolls it back to the top. The button itself stays
    fixed to the viewport's corner. */}
<div ref={containerRef} style={{ height: "20rem", overflow: "auto" }}>
  <p>Long content…</p>
</div>
<BackToTop scrollContainerRef={containerRef} threshold={200} />`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface BackToTopPlaygroundSnippetArgs {
  size?: BackToTopProps["size"];
  variant?: BackToTopProps["variant"];
  threshold?: number;
  label?: string;
}

/**
 * The Playground's snippet, built from its current controls: only the props that differ from
 * their defaults (`md`, `primary`, a threshold of 400, "Back to top"). With none of them changed
 * it's just `<BackToTop />`, mounted once anywhere in the page. Also serves the "Visible state"
 * story, whose threshold of -1 is what makes the button show without scrolling.
 */
export function backToTopPlaygroundSnippet(args: BackToTopPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.variant && args.variant !== "primary") attributes.push(`variant="${args.variant}"`);
  if (args.threshold !== undefined && args.threshold !== 400) attributes.push(`threshold={${args.threshold}}`);
  if (args.label && args.label !== "Back to top") attributes.push(`label=${quote(args.label)}`);
  return `<BackToTop${attributes.length > 0 ? ` ${attributes.join(" ")}` : ""} />`;
}
