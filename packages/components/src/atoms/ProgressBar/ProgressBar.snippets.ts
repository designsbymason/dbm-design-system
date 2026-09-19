// The code shown under each story's "Show code" button on ProgressBar's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code
// spells out defaults (`showValueLabel={false}`, `max={100}`, `aria-valuetext=""`),
// keeps the story's demo wrapper `div`, and — for "With custom value label" — shows
// `formatValueLabel={() => {}}` in place of the real formatter, hiding the one thing
// that story demonstrates. Each snippet here is the smallest real usage of what its
// story shows — only exports of the package, no demo scaffolding — and
// `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import type { ProgressBarSize, ProgressBarTone } from "./ProgressBar.types";

export const progressBarSnippets = {
  allTones: `{/* tone: "brand" (default) | "info" | "success" | "warning" | "danger" */}
<ProgressBar tone="success" label="success" value={40} />`,

  allSizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" */}
<ProgressBar size="lg" label="Size lg" value={40} />`,

  withCustomValueLabel: `{/* formatValueLabel builds the visible label from the value and max. aria-valuetext gives assistive
    technology its own wording, since the visible text alone may not read well. */}
<ProgressBar
  label="Uploading files"
  value={3}
  max={5}
  showValueLabel
  formatValueLabel={(value, max) => \`\${value} of \${max} files\`}
  aria-valuetext="3 of 5 files uploaded"
/>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface ProgressBarPlaygroundSnippetArgs {
  value?: number;
  max?: number;
  size?: ProgressBarSize;
  tone?: ProgressBarTone;
  label?: string;
  "aria-valuetext"?: string;
  showValueLabel?: boolean;
  /** Playground-only: leaves `value` out, which is what makes a progress bar indeterminate. */
  indeterminate?: boolean;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults. Indeterminate isn't a prop — it's what a missing `value`
 * means — so it's written by leaving `value` out. Also serves the stories that just
 * change a few args (a value label, `aria-valuetext`, indeterminate). A progress bar
 * needs an accessible name, so the `label` is always written.
 */
export function progressBarPlaygroundSnippet(args: ProgressBarPlaygroundSnippetArgs): string {
  const attributes: string[] = [`label="${args.label || "Progress"}"`];
  if (!args.indeterminate && args.value !== undefined) attributes.push(`value={${args.value}}`);
  if (args.max !== undefined && args.max !== 100) attributes.push(`max={${args.max}}`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.tone && args.tone !== "brand") attributes.push(`tone="${args.tone}"`);
  if (args.showValueLabel) attributes.push("showValueLabel");
  if (args["aria-valuetext"]) attributes.push(`aria-valuetext="${args["aria-valuetext"]}"`);
  return `<ProgressBar ${attributes.join(" ")} />`;
}
