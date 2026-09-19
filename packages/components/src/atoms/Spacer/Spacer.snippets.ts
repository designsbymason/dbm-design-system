// The code shown under each story's "Show code" button on Spacer's Docs page.
//
// Hand-written rather than generated from the rendered story: both panels show the story
// object itself (`{ render: () => … }`) and call a `chipStyle` helper defined in the
// stories file. A Spacer has no props, so there is nothing for a Playground builder to
// write; each snippet is just the flex row it needs. Each snippet here is the smallest
// real usage of what its story shows — only exports of the package, no demo scaffolding —
// and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

export const spacerSnippets = {
  playground: `{/* Spacer takes all the free space along a flex row (or column), pushing its neighbours to opposite ends */}
<div style={{ display: "flex", alignItems: "center" }}>
  <span>Logo</span>
  <Spacer />
  <span>Nav actions</span>
</div>`,

  inARow: `{/* The classic use: a header with the title on one side and an action on the other */}
<div style={{ display: "flex", alignItems: "center" }}>
  <Heading level={2}>Dashboard</Heading>
  <Spacer />
  <Button>New report</Button>
</div>`,
} as const;
