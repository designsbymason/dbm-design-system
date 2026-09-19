// The code shown under each story's "Show code" button on Container's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code
// spells out `as="div"`, `paddingInline={4}` and the story's demo content wrapper, and
// three panels show the story object itself — two calling a `demoContent` helper
// defined in the stories file. Each snippet here is the smallest real usage of what its
// story shows — only exports of the package, no demo scaffolding — and
// `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import type { ContainerSize } from "./Container.types";

export const containerSnippets = {
  allSizes: `{/* size: "sm" | "md" | "lg" | "xl" (default) | "2xl" | "3xl" | "full" — the maximum width the content
    is centered within */}
<Container size="md">
  <p>Content, centered and no wider than size="md".</p>
</Container>`,

  responsivePadding: `{/* paddingInline takes a mobile-first map: tight on mobile, roomy from lg up */}
<Container size="xl" paddingInline={{ base: 2, lg: 8 }}>
  <p>Page content.</p>
</Container>`,

  asMain: `{/* as="main" renders a real <main> landmark, with Container's layout */}
<Container as="main" size="lg">
  <p>Page content.</p>
</Container>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface ContainerPlaygroundSnippetArgs {
  as?: string;
  size?: ContainerSize;
  paddingInline?: number;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults (`div`, `xl`, and a padding of 4). Also serves the
 * default and narrow-viewport stories.
 */
export function containerPlaygroundSnippet(args: ContainerPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.as && args.as !== "div") attributes.push(`as="${args.as}"`);
  if (args.size && args.size !== "xl") attributes.push(`size="${args.size}"`);
  if (args.paddingInline !== undefined && args.paddingInline !== 4) attributes.push(`paddingInline={${args.paddingInline}}`);
  const open = `<Container${attributes.length > 0 ? ` ${attributes.join(" ")}` : ""}>`;
  return `${open}\n  <p>Page content, centered and constrained by size.</p>\n</Container>`;
}
