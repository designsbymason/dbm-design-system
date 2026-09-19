// The code shown under each story's "Show code" button on ClientOnly's Docs page.
//
// The generated code for these two stories was already usable, but the standard is that every
// visible story points at hand-written code rather than at whatever Storybook generates, so
// they get snippets too — which also gives the Playground one that follows its controls
// without printing the story's `Text` wrappers as if they were part of the API. Each snippet
// here is the smallest real usage of what its story shows — only exports of the package, no
// demo scaffolding — and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

export const clientOnlySnippets = {
  withFallback: `{/* fallback shows on the server and during the first client render, then the children replace it.
    Match its size to the content — a Skeleton is the usual choice — so the layout doesn't jump. */}
<ClientOnly fallback={<Skeleton variant="text" width="16rem" />}>
  <Text>Content that depends on a browser-only API.</Text>
</ClientOnly>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface ClientOnlyPlaygroundSnippetArgs {
  children?: unknown;
  fallback?: unknown;
}

/**
 * The Playground's snippet, built from its current controls: the children as a line of text,
 * and the fallback (when there is one) as the placeholder text shown until the client mounts.
 */
export function clientOnlyPlaygroundSnippet(args: ClientOnlyPlaygroundSnippetArgs): string {
  const fallback = typeof args.fallback === "string" && args.fallback ? args.fallback : undefined;
  const open = fallback ? `<ClientOnly fallback={<Text color="secondary">${fallback}</Text>}>` : "<ClientOnly>";
  return `${open}\n  <Text>${String(args.children ?? "Rendered once mounted on the client.")}</Text>\n</ClientOnly>`;
}
