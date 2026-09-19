// The code shown under each story's "Show code" button on Skeleton's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code
// is close already, but a story's demo wrapper `div` and style objects come with
// it, and the args-only variants (text, circular, rectangular, wave) are only the
// Playground plus a few props. Each snippet here is the smallest real usage of what
// its story shows — only exports of the package, no demo scaffolding — and
// `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import type { SkeletonAnimation, SkeletonVariant } from "./Skeleton.types";

export const skeletonSnippets = {
  defaultSizes: `{/* With no width or height, a circular skeleton and a rectangular one fall back to a default size */}
<Skeleton variant="circular" />
<Skeleton variant="rectangular" />`,

  cardPlaceholder: `{/* Compose skeletons into the shape of the content they stand in for */}
<Stack direction="row" gap={3}>
  <Skeleton variant="circular" width={40} height={40} />
  <Stack gap={2} style={{ flex: 1 }}>
    <Skeleton variant="text" width="60%" />
    <Skeleton variant="text" width="90%" />
  </Stack>
</Stack>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface SkeletonPlaygroundSnippetArgs {
  variant?: SkeletonVariant;
  /** A CSS length as a string (`"12rem"`), or a number of pixels. `""` means "not set". */
  width?: string | number;
  height?: string | number;
  animation?: SkeletonAnimation;
}

const sizeAttribute = (name: string, value: string | number | undefined) => {
  if (value === undefined || value === "") return undefined;
  return typeof value === "number" ? `${name}={${value}}` : `${name}="${value}"`;
};

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults. Also serves the stories that just change a few args
 * (text, circular, rectangular, and the wave animation).
 */
export function skeletonPlaygroundSnippet(args: SkeletonPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.variant && args.variant !== "text") attributes.push(`variant="${args.variant}"`);
  const width = sizeAttribute("width", args.width);
  const height = sizeAttribute("height", args.height);
  if (width) attributes.push(width);
  if (height) attributes.push(height);
  if (args.animation && args.animation !== "pulse") attributes.push(`animation="${args.animation}"`);
  return attributes.length > 0 ? `<Skeleton ${attributes.join(" ")} />` : "<Skeleton />";
}
