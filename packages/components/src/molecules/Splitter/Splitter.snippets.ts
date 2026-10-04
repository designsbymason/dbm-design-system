// The code shown under each story's "Show code" button on Splitter's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code spells out every default,
// fills every handler with a no-op and keeps the story's demo scaffolding (the framed box, the placeholder
// panes). Each snippet here is the smallest real usage of what its story shows — only exports of the package —
// and `storySnippets.test.ts` checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

export const splitterSnippets = {
  orientation: `{/* The splitter fills its parent, so the parent needs a size — a height, for a vertical splitter */}
<div style={{ height: "20rem" }}>
  {/* orientation: "horizontal" (default, panes side by side) | "vertical" (stacked) */}
  <Splitter orientation="vertical">
    <Splitter.Pane>Top</Splitter.Pane>
    <Splitter.Pane>Bottom</Splitter.Pane>
  </Splitter>
</div>`,

  variants: `{/* variant: "line" (default) | "grip" — a grip you can see at rest */}
<div style={{ height: "20rem" }}>
  <Splitter variant="grip">
    <Splitter.Pane>One</Splitter.Pane>
    <Splitter.Pane>Two</Splitter.Pane>
  </Splitter>
</div>`,

  limits: `{/* minSize and maxSize take a percentage (30 or "30%") or a length in pixels ("240px") */}
<div style={{ height: "20rem" }}>
  <Splitter defaultLayout={[30, 70]}>
    <Splitter.Pane minSize="240px" maxSize="50%">Sidebar (at least 240px, at most half)</Splitter.Pane>
    <Splitter.Pane minSize={30}>Content (at least 30%)</Splitter.Pane>
  </Splitter>
</div>`,

  collapsible: `{/* collapsible: pulled past halfway to its minimum a pane snaps shut; Enter or a double click on the handle toggles it.
    collapsedSize: 0 (default, the pane disappears) or a length that stays, such as "48px".
    children can be a function of the pane's state, to show an icon where a label was once it has collapsed */}
{/* SidebarSimpleIcon comes from @dbm-design-system/icons */}
<div style={{ height: "20rem" }}>
  <Splitter defaultLayout={[25, 75]}>
    <Splitter.Pane collapsible collapsedSize="48px" minSize="180px">
      {({ collapsed }) => (collapsed ? <Icon icon={SidebarSimpleIcon} aria-label="Sidebar" /> : "Sidebar")}
    </Splitter.Pane>
    <Splitter.Pane>Content</Splitter.Pane>
  </Splitter>
</div>`,

  controlledCollapsed: `{/* You own whether the pane is open: const [collapsed, setCollapsed] = useState(false); */}
<Button size="sm" variant="secondary" onClick={() => setCollapsed(!collapsed)}>{collapsed ? "Show sidebar" : "Hide sidebar"}</Button>
<div style={{ height: "20rem" }}>
  <Splitter defaultLayout={[25, 75]}>
    <Splitter.Pane collapsible minSize="180px" collapsed={collapsed} onCollapsedChange={setCollapsed}>Sidebar</Splitter.Pane>
    <Splitter.Pane>Content</Splitter.Pane>
  </Splitter>
</div>`,

  controlledLayout: `{/* You own the layout — one percentage per pane, summing to 100: const [layout, setLayout] = useState([30, 70]); */}
<div style={{ height: "20rem" }}>
  <Splitter layout={layout} onLayoutChange={setLayout}>
    <Splitter.Pane>One</Splitter.Pane>
    <Splitter.Pane>Two</Splitter.Pane>
  </Splitter>
</div>
<span>{layout.join(" / ")}</span>`,

  saving: `{/* onLayoutCommit fires once a drag or key press has finished — the moment to save. Splitter keeps no storage itself:
    const saved = JSON.parse(localStorage.getItem("layout") ?? "null") ?? [30, 70]; */}
<div style={{ height: "20rem" }}>
  <Splitter defaultLayout={saved} onLayoutCommit={(layout) => localStorage.setItem("layout", JSON.stringify(layout))}>
    <Splitter.Pane>One</Splitter.Pane>
    <Splitter.Pane>Two</Splitter.Pane>
  </Splitter>
</div>`,

  nested: `{/* A splitter inside a pane of another: a horizontal split whose second pane is split vertically */}
<div style={{ height: "24rem" }}>
  <Splitter defaultLayout={[30, 70]}>
    <Splitter.Pane>Sidebar</Splitter.Pane>
    <Splitter.Pane>
      <Splitter orientation="vertical" defaultLayout={[65, 35]}>
        <Splitter.Pane>Editor</Splitter.Pane>
        <Splitter.Pane>Terminal</Splitter.Pane>
      </Splitter>
    </Splitter.Pane>
  </Splitter>
</div>`,

  responsive: `{/* A breakpoint map for the orientation: stacked on a phone, side by side from md up */}
<div style={{ height: "24rem" }}>
  <Splitter orientation={{ base: "vertical", md: "horizontal" }}>
    <Splitter.Pane>One</Splitter.Pane>
    <Splitter.Pane>Two</Splitter.Pane>
  </Splitter>
</div>`,

  states: `{/* disabled stops every handle resizing or collapsing anything; the handles stay in the tab order, marked disabled */}
<div style={{ height: "20rem" }}>
  <Splitter disabled>
    <Splitter.Pane>One</Splitter.Pane>
    <Splitter.Pane>Two</Splitter.Pane>
  </Splitter>
</div>`,

  threePanes: `{/* A handle sits between each pair of panes, and moves only the two beside it */}
<div style={{ height: "20rem" }}>
  <Splitter defaultLayout={[20, 55, 25]}>
    <Splitter.Pane>Navigation</Splitter.Pane>
    <Splitter.Pane>Content</Splitter.Pane>
    <Splitter.Pane>Details</Splitter.Pane>
  </Splitter>
</div>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface SplitterPlaygroundSnippetArgs {
  orientation?: unknown;
  variant?: string;
  keyboardStep?: number;
  disabled?: boolean;
  dir?: string;
}

/**
 * The Playground's snippet, built from its current controls: only the props that differ from their defaults,
 * around three real panes — the panes are what make a splitter mean anything, so they're always there.
 */
export function splitterPlaygroundSnippet(args: SplitterPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.orientation && args.orientation !== "horizontal") attributes.push(`orientation="${String(args.orientation)}"`);
  if (args.variant && args.variant !== "line") attributes.push(`variant="${args.variant}"`);
  if (args.keyboardStep !== undefined && Number(args.keyboardStep) !== 5) attributes.push(`keyboardStep={${Number(args.keyboardStep)}}`);
  if (args.dir && args.dir !== "ltr") attributes.push(`dir="${args.dir}"`);
  if (args.disabled) attributes.push("disabled");
  const open = attributes.length > 0 ? `<Splitter ${attributes.join(" ")}>` : "<Splitter>";
  return `<div style={{ height: "20rem" }}>
  ${open}
    <Splitter.Pane defaultSize={25} minSize="160px" collapsible>Sidebar</Splitter.Pane>
    <Splitter.Pane>Content</Splitter.Pane>
    <Splitter.Pane defaultSize={25}>Details</Splitter.Pane>
  </Splitter>
</div>`;
}
