// The code shown under each story's "Show code" button on Text's Docs page.
//
// Hand-written rather than generated from the rendered story: every panel printed
// `align="start" color="primary" fontFamily="primary" size="base" weight="regular" wrap="wrap"`
// on every `Text`, the gallery panels ran to 112, 92 and 42 lines of that, and "As label" printed
// the story's own `htmlFor="story-email-input"`. A gallery is one representative `Text` with a
// comment naming the other values. Each snippet here is the smallest real usage of what its story
// shows — only exports of the package, no demo scaffolding — and `storySnippets.test.ts` checks
// that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import { escapeJsxText, truncateValue } from "../../snippetHelpers";
import type { TextAlign, TextColor, TextFontFamily, TextSize, TextWeight, TextWrap } from "./Text.types";

export const textSnippets = {
  allSizes: `{/* size: "xs" | "sm" | "base" (default) | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" */}
<Text size="lg">size="lg" — Design builds meaning</Text>`,

  allWeights: `{/* weight: "regular" (default) | "medium" | "semibold" | "bold" */}
<Text weight="semibold">weight="semibold" — Design builds meaning</Text>`,

  allColors: `{/* color: "primary" (default) | "secondary" | "tertiary" | "disabled" | "link" | "danger" | "warning" |
    "success" | "info" */}
<Text color="secondary">color="secondary" — Design builds meaning</Text>`,

  fontFamily: `{/* fontFamily: "primary" (default, Nunito — body and UI copy) | "secondary" (Lora — long-form editorial
    reading) */}
<Text fontFamily="secondary">A passage of long-form editorial reading content.</Text>`,

  align: `{/* align: "start" (default) | "center" | "end" */}
<Text align="center">align="center"</Text>`,

  wrap: `{/* wrap: "wrap" (default) | "nowrap" | "balance" | "pretty". balance evens out the lines; pretty avoids a
    lone last word. Give it a width to wrap within. */}
<div style={{ maxWidth: "20rem" }}>
  <Text wrap="balance">A longer piece of body copy that wraps with balanced line breaks</Text>
</div>`,

  truncate: `{/* truncate={n} clamps the text to n lines and ends it with an ellipsis. Give it a width to wrap within. */}
<div style={{ maxWidth: "20rem" }}>
  <Text truncate={2}>
    This is a much longer piece of body copy than will fit on two lines, so it should be clamped with an
    ellipsis after the second line instead of overflowing or wrapping onto a third line and beyond.
  </Text>
</div>`,

  asLabel: `{/* as renders a different element, and that element's own props type-check — a label's htmlFor here */}
<Text as="label" htmlFor="email" weight="medium">
  Email address
</Text>
<input id="email" type="email" />`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface TextPlaygroundSnippetArgs {
  children?: unknown;
  size?: TextSize;
  align?: TextAlign;
  weight?: TextWeight;
  color?: TextColor;
  fontFamily?: TextFontFamily;
  wrap?: TextWrap;
  /** The control is a text field: `""` (not set), a numeric string, or a number. */
  truncate?: unknown;
  as?: string;
}

/**
 * The Playground's snippet, built from its current controls: only what differs from the defaults
 * (`p`, `base`, `start`, `regular`, `primary`, `primary`, `wrap`). Also serves the "Narrow
 * viewport" story.
 */
export function textPlaygroundSnippet(args: TextPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.as && args.as !== "p") attributes.push(`as="${args.as}"`);
  if (args.size && args.size !== "base") attributes.push(`size="${args.size}"`);
  if (args.align && args.align !== "start") attributes.push(`align="${args.align}"`);
  if (args.weight && args.weight !== "regular") attributes.push(`weight="${args.weight}"`);
  if (args.color && args.color !== "primary") attributes.push(`color="${args.color}"`);
  if (args.fontFamily && args.fontFamily !== "primary") attributes.push(`fontFamily="${args.fontFamily}"`);
  if (args.wrap && args.wrap !== "wrap") attributes.push(`wrap="${args.wrap}"`);
  const truncate = truncateValue(args.truncate);
  if (truncate !== undefined) attributes.push(`truncate={${truncate}}`);
  const open = attributes.length > 0 ? `<Text ${attributes.join(" ")}>` : "<Text>";
  return `${open}${escapeJsxText(String(args.children ?? "Design builds meaning"))}</Text>`;
}
