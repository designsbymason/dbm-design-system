// The code shown under each story's "Show code" button on Center's Docs page.
//
// Hand-written rather than generated from the rendered story: the Playground's
// generated code spells out `as="div" inline={false}` and the story's demo `style`,
// and the two gallery panels show the story object itself (`{ argTypes: …, render:
// () => … }`). Each snippet here is the smallest real usage of what its story shows —
// only exports of the package, no demo scaffolding — and `storySnippets.test.ts`
// checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

export const centerSnippets = {
  default: `{/* Center centers its content on both axes. It fills its container's width, so give it a height (here
    12rem) to see the vertical centering. */}
<Center style={{ height: "12rem" }}>
  <Spinner tone="brand" label="Loading" />
</Center>`,

  inline: `{/* inline makes it an inline-level box that sits within a line of text (and as="span" keeps it valid
    inside a paragraph) */}
<p>
  Text with an{" "}
  <Center as="span" inline>
    inline-centered badge
  </Center>{" "}
  in the middle of a sentence.
</p>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface CenterPlaygroundSnippetArgs {
  as?: string;
  inline?: boolean;
  children?: unknown;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults. A block-level `Center` is written with the height it
 * needs for the centering to show; an inline one, as the `span` it should be.
 */
export function centerPlaygroundSnippet(args: CenterPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.as && args.as !== "div") attributes.push(`as="${args.as}"`);
  if (args.inline) attributes.push("inline");
  else attributes.push('style={{ height: "12rem" }}');
  return `<Center ${attributes.join(" ")}>${String(args.children ?? "Centered content")}</Center>`;
}
