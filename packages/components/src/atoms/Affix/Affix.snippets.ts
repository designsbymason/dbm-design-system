// The code shown under each story's "Show code" button on Affix's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code
// prints refs as `ref={{ current: '[Circular]' }}` and
// `scrollContainerRef={{ current: '[Circular]' }}`, carries `data-testid`
// attributes and a no-op `onStickyChange={() => {}}`, and runs to 197, 163 and 915
// lines — the third is a table with eleven columns of demo cells. Affix only means
// something inside a scroll container, so each snippet keeps that one container and
// the ref that points at it, and nothing else. Each snippet here is the smallest
// real usage of what its story shows — only exports of the package, no demo
// scaffolding — and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

export const affixSnippets = {
  withinScrollContainer: `{/* Affix sticks its content to the edge of the scrolling ancestor. position: sticky works against any
    scrolling ancestor with no setup; scrollContainerRef only tells Affix which element to watch to detect
    *when* it's stuck (data-stuck, onStickyChange). Give the stuck content a background so the rest scrolls
    underneath it.
    const containerRef = useRef<HTMLDivElement>(null);
    handleStickyChange receives true while it's stuck. */}
<div ref={containerRef} style={{ height: "20rem", overflow: "auto" }}>
  <Affix scrollContainerRef={containerRef} onStickyChange={handleStickyChange}>
    <div style={{ background: "var(--dbm-bg-surface)", padding: "0.75rem 1rem" }}>Sticky header</div>
  </Affix>
  <p>Long content that scrolls underneath…</p>
</div>`,

  horizontalScrollInteraction: `{/* axis="horizontal" sticks to the leading inline edge of a sideways-scrolling container — a lead column
    that stays put while the rest scrolls beneath it. edge is logical ("start" | "end"), so it flips in
    right-to-left text.
    const containerRef = useRef<HTMLDivElement>(null); */}
<div ref={containerRef} style={{ display: "flex", overflowX: "auto" }}>
  <Affix axis="horizontal" scrollContainerRef={containerRef} onStickyChange={handleStickyChange}>
    <div style={{ background: "var(--dbm-bg-surface)", padding: "0.75rem 1rem" }}>Lead column</div>
  </Affix>
  <div style={{ flexShrink: 0, width: "60rem" }}>Content wider than the container</div>
</div>`,

  withinTable: `{/* In a real <table> a <div> can't sit inside a row, so asChild makes the sticky element the <th> itself,
    and sentinelAs="th" makes Affix's hidden one-pixel sentinel a valid cell too. Position: sticky is per
    cell, so the body cells of that column carry the same CSS by hand.
    const containerRef = useRef<HTMLDivElement>(null); */}
<div ref={containerRef} style={{ overflowX: "auto" }}>
  <table style={{ borderCollapse: "collapse", width: "max-content" }}>
    <thead>
      <tr>
        <th>Rows</th>
        <Affix
          asChild
          axis="horizontal"
          sentinelAs="th"
          scrollContainerRef={containerRef}
          onStickyChange={handleStickyChange}
        >
          <th style={{ position: "sticky", insetInlineStart: 0, background: "var(--dbm-bg-surface)" }}>Metric 1</th>
        </Affix>
        <th>Metric 2</th>
        <th>Metric 3</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th>Row A</th>
        <td style={{ position: "sticky", insetInlineStart: 0, background: "var(--dbm-bg-surface)" }}>10</td>
        <td>20</td>
        <td>30</td>
      </tr>
    </tbody>
  </table>
</div>`,
} as const;
