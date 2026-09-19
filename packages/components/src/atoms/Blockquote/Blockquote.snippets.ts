// The code shown under each story's "Show code" button on Blockquote's Docs page.
//
// Hand-written rather than generated from the rendered story: every panel prints
// `variant="default"` next to the real props, "Playground" and "With attribution" come out
// identical, and the `cite` is the story's own placeholder URL. All six stories only change
// args, so a single builder writes all of them from the live controls (the same way Popover's
// args-only stories share the Playground's). There is no record of named snippets. Each snippet
// here is the smallest real usage of what its story shows — only exports of the package, no demo
// scaffolding — and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import { escapeJsxText, quote } from "../../snippetHelpers";
import type { BlockquoteVariant } from "./Blockquote.types";

/** The Playground's live controls, as far as the snippet cares. */
export interface BlockquotePlaygroundSnippetArgs {
  children?: unknown;
  variant?: BlockquoteVariant;
  attribution?: unknown;
  cite?: string;
}

// The stories' own source URL; a reader's snippet gets a neutral one.
const storyCite = "https://en.wikiquote.org/wiki/Steve_Jobs";

/**
 * The Playground's snippet, built from its current controls: the `variant` only when it isn't
 * the default, and `attribution` / `cite` only when the story sets them. Also serves the five
 * stories that only change args ("Default", "With attribution", "Pull quote", "Pull quote with
 * attribution", "Long quote").
 */
export function blockquotePlaygroundSnippet(args: BlockquotePlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.variant && args.variant !== "default") attributes.push(`variant="${args.variant}"`);
  if (typeof args.attribution === "string" && args.attribution) attributes.push(`attribution=${quote(args.attribution)}`);
  if (args.cite) attributes.push(`cite=${quote(args.cite === storyCite ? "https://example.com/quotes/design" : args.cite)}`);
  const open = attributes.length > 0 ? `<Blockquote ${attributes.join(" ")}>` : "<Blockquote>";
  return `${open}\n  ${escapeJsxText(String(args.children ?? ""))}\n</Blockquote>`;
}
