// The code shown under each story's "Show code" button on Heading's Docs page.
//
// Hand-written rather than generated from the rendered story: every panel printed
// `align="start" color="primary" fontFamily="secondary" weight="bold" wrap="wrap"` on every
// heading (plus a `size` that was only the level's own default), and the gallery panels ran to
// 62, 123 and 121 lines of that — "Leading-trim" with the story's label boxes and its `trimRows`
// constant besides. A gallery is one representative heading with a comment naming the other
// values. Each snippet here is the smallest real usage of what its story shows — only exports of
// the package, no demo scaffolding — and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import { escapeJsxText, truncateValue } from "../../snippetHelpers";
import type { TextColor, TextFontFamily, TextWeight } from "../Text/Text.types";
import { defaultSizeForLevel } from "./Heading";
import type { HeadingAlign, HeadingLevel, HeadingSize, HeadingTrim, HeadingWrap } from "./Heading.types";

export const headingSnippets = {
  allLevels: `{/* level sets the element (h1–h6) and, unless size says otherwise, a matching size. Use one h1 per page
    and don't skip levels. */}
<Heading level={1}>Heading level 1</Heading>
<Heading level={2}>Heading level 2</Heading>
<Heading level={3}>Heading level 3</Heading>`,

  sizeIndependentOfLevel: `{/* size changes how big a heading looks without changing its level — an h2 that's visually smaller */}
<Heading level={2} size="xl">
  Semantic h2, visually smaller
</Heading>`,

  allSizes: `{/* size: "xs" | "sm" | "base" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl". Left out, it
    follows level: h1 is 5xl, h2 4xl, h3 3xl, h4 2xl, h5 xl, h6 lg. */}
<Heading size="2xl">size="2xl"</Heading>`,

  fontFamily: `{/* fontFamily: "secondary" (default, Lora — editorial) | "primary" (Nunito — denser UI and enterprise
    headings) */}
<Heading fontFamily="primary">A heading in the UI typeface</Heading>`,

  align: `{/* align: "start" (default) | "center" | "end" */}
<Heading level={3} align="center">
  align="center"
</Heading>`,

  wrap: `{/* wrap: "wrap" (default) | "nowrap" | "balance" | "pretty". balance evens out the lines of a heading that
    wraps. Give it a width to wrap within. */}
<div style={{ maxWidth: "20rem" }}>
  <Heading wrap="balance">A longer heading that wraps with balanced line breaks</Heading>
</div>`,

  trim: `{/* trim: "start" | "end" | "both" — removes the empty space a font reserves above the letters and/or below
    the baseline, so the heading lines up flush with what sits next to it. Unset (default) leaves it. */}
<Heading trim="both">Typography</Heading>`,

  truncate: `{/* truncate={n} clamps the heading to n lines and ends it with an ellipsis. Give it a width to wrap
    within. */}
<div style={{ maxWidth: "20rem" }}>
  <Heading level={3} truncate={2}>
    A much longer card title than will fit on two lines, so it should be clamped with an ellipsis instead of
    overflowing or wrapping onto a third line.
  </Heading>
</div>`,

  asCardTitle: `{/* as="div" renders a div with role="heading" and aria-level, so a card title is announced at the right
    level without adding another entry to the page's heading outline */}
<Heading as="div" level={3} size="lg">
  Product card title
</Heading>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface HeadingPlaygroundSnippetArgs {
  children?: unknown;
  level?: HeadingLevel;
  size?: HeadingSize;
  align?: HeadingAlign;
  weight?: TextWeight;
  color?: TextColor;
  fontFamily?: TextFontFamily;
  wrap?: HeadingWrap;
  trim?: HeadingTrim;
  /** The control is a text field: `""` (not set), a numeric string, or a number. */
  truncate?: unknown;
  as?: string;
}

/**
 * The Playground's snippet, built from its current controls: only what differs from the defaults
 * (`level` 2, `start`, `bold`, `primary`, `secondary`, `wrap`). `size` follows `level` when it's
 * left out, so it's written only where it differs from that level's own default — which is what
 * the Playground's level-synced `size` control would otherwise print every time. Also serves the
 * "Narrow viewport" story.
 */
export function headingPlaygroundSnippet(args: HeadingPlaygroundSnippetArgs): string {
  const level = args.level ?? 2;
  const attributes: string[] = [];
  if (args.as) attributes.push(`as="${args.as}"`);
  if (level !== 2) attributes.push(`level={${level}}`);
  if (args.size && args.size !== defaultSizeForLevel[level]) attributes.push(`size="${args.size}"`);
  if (args.align && args.align !== "start") attributes.push(`align="${args.align}"`);
  if (args.weight && args.weight !== "bold") attributes.push(`weight="${args.weight}"`);
  if (args.color && args.color !== "primary") attributes.push(`color="${args.color}"`);
  if (args.fontFamily && args.fontFamily !== "secondary") attributes.push(`fontFamily="${args.fontFamily}"`);
  if (args.wrap && args.wrap !== "wrap") attributes.push(`wrap="${args.wrap}"`);
  if (args.trim) attributes.push(`trim="${args.trim}"`);
  const truncate = truncateValue(args.truncate);
  if (truncate !== undefined) attributes.push(`truncate={${truncate}}`);
  const open = attributes.length > 0 ? `<Heading ${attributes.join(" ")}>` : "<Heading>";
  return `${open}${escapeJsxText(String(args.children ?? "Design builds meaning"))}</Heading>`;
}
