// The code shown under each story's "Show code" button on Code's Docs page.
//
// Hand-written rather than generated from the rendered story: the Playground and Default panels
// were usable but identical, and the other two showed the story object itself
// (`{ argTypes: { children: { control: false } }, render: () => … }`). Each snippet here is the
// smallest real usage of what its story shows — only exports of the package, no demo
// scaffolding — and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import { escapeJsxText } from "../../snippetHelpers";

export const codeSnippets = {
  withinText: `{/* Code is inline: it sits in a sentence and takes the text around it as its size and line height */}
<Text>
  Run <Code>pnpm install</Code> to install dependencies, then{" "}
  <Code>pnpm dev</Code> to start the dev server.
</Text>`,

  inheritsSurroundingSize: `{/* Code follows the font size of the text it's in, so it scales with it */}
<Text size="sm">
  Small text with <Code>inline code</Code>
</Text>
<Text size="lg">
  Large text with <Code>inline code</Code>
</Text>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface CodePlaygroundSnippetArgs {
  children?: unknown;
}

/** The Playground's snippet: the code text, as an inline `Code`. Also serves the "Default" story. */
export function codePlaygroundSnippet(args: CodePlaygroundSnippetArgs): string {
  return `<Code>${escapeJsxText(String(args.children ?? "pnpm install"))}</Code>`;
}
