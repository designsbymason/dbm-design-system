// The code shown under each story's "Show code" button on Highlight's Docs page.
//
// Hand-written rather than generated from the rendered story: the Playground printed
// `caseSensitive={false}`, and the other four panels showed the story object itself, each with a
// four-entry `argTypes` block of `control: false`. Each snippet here is the smallest real usage
// of what its story shows — only exports of the package, no demo scaffolding — and
// `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import { escapeJsxText, quote } from "../../snippetHelpers";
import type { HighlightTone } from "./Highlight.types";

export const highlightSnippets = {
  allTones: `{/* tone: "warning" (default) | "success" | "info" | "danger" */}
<Highlight tone="success">success</Highlight>`,

  searchMatch: `{/* With no query, the whole child is the highlight — mark up the match yourself */}
<Text>
  Showing results for "<Highlight>design</Highlight> system" — 3 matches found.
</Text>`,

  autoMatching: `{/* With a query, Highlight finds the matches inside its children and marks only those */}
<Text>
  <Highlight query="design">
    Results for the design system — a design-first approach.
  </Highlight>
</Text>`,

  multipleQueries: `{/* query also takes an array, and tone works the same way */}
<Text>
  <Highlight query={["design", "agent"]} tone="info">
    A design system built for AI agents and human engineers alike.
  </Highlight>
</Text>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface HighlightPlaygroundSnippetArgs {
  children?: unknown;
  query?: string | string[];
  tone?: HighlightTone;
  caseSensitive?: boolean;
}

/**
 * The Playground's snippet, built from its current controls: only what differs from the defaults
 * (`warning`, case-insensitive), and `query` only when there is one.
 */
export function highlightPlaygroundSnippet(args: HighlightPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  const queries = (Array.isArray(args.query) ? args.query : [args.query]).filter((q): q is string => typeof q === "string" && q !== "");
  if (queries.length === 1) attributes.push(`query=${quote(queries[0] as string)}`);
  if (queries.length > 1) attributes.push(`query={[${queries.map((q) => JSON.stringify(q)).join(", ")}]}`);
  if (args.tone && args.tone !== "warning") attributes.push(`tone="${args.tone}"`);
  if (args.caseSensitive) attributes.push("caseSensitive");
  const open = attributes.length > 0 ? `<Highlight ${attributes.join(" ")}>` : "<Highlight>";
  return `${open}${escapeJsxText(String(args.children ?? "Results for design system"))}</Highlight>`;
}
