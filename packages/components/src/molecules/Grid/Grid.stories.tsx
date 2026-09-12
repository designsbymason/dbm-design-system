import type { Meta, StoryObj } from "@storybook/react-vite";
import { GridItem } from "../../atoms/GridItem";
import { Grid } from "./Grid";
import styles from "./Grid.stories.module.css";

const cellStyle = {
  background: "var(--dbm-bg-brand)",
  borderRadius: "var(--dbm-radius-sm)",
  color: "var(--dbm-text-on-brand)",
  padding: "var(--dbm-space-3)",
  textAlign: "center" as const,
};

// A "chip" sized as a *percentage* of its own cell — deliberately NOT
// full-cell-stretching (unlike `cellStyle` above), so justifyItems/
// alignItems have visible room to position it within its own cell. A grid
// item with no intrinsic size stretches to fill its cell by default (CSS
// `normal` computes to `stretch`), which would make justifyItems/alignItems
// changes invisible.
//
// Deliberately a percentage, not a fixed rem size (found and fixed
// 2026-09-11, user-reported twice): a fixed size can't adapt to whatever
// column/row size the current props actually produce, which breaks in both
// directions — (1) in a wide column, a small fixed chip leaves a huge,
// gap-unrelated margin that swamps the actual `gap` value, making `gap`
// changes hard to perceive or looking like they "don't work"; (2) in a
// narrow column (either a large `gap` value shrinking `1fr` tracks, or
// `ContentAlignment`'s own fixed 4rem tracks), a fixed chip bigger than its
// column visibly overflows past the grid's own boundary. A percentage always
// resolves against the item's own actual cell size, so it scales correctly
// and can never overflow, in every story that reuses it.
const chipStyle = {
  alignItems: "center" as const,
  background: "var(--dbm-bg-brand)",
  borderRadius: "var(--dbm-radius-sm)",
  color: "var(--dbm-text-on-brand)",
  display: "flex",
  height: "80%",
  justifyContent: "center" as const,
  width: "80%",
};

// Mirrors `Grid.tsx`'s own private `CONTENT_ALIGN` map (not exported, so
// duplicated here — this is Storybook-only presentational code, not shipped
// logic) — `justifyContent`/`alignContent`'s "between"/"around"/"evenly"
// aren't real CSS keywords on their own; `ColumnTrackOverlay` needs the
// same translation the real `Grid` applies internally, or its own nested
// grid renders `justify-content: normal` instead (an actual bug found this
// way, not assumed — see `ColumnTrackOverlay`'s own comment).
const toCssContentAlign = (value: string | undefined) => {
  if (value === "between") return "space-between";
  if (value === "around") return "space-around";
  if (value === "evenly") return "space-evenly";
  return value;
};

const Cells = ({ count }: { count: number }) => (
  <>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} style={cellStyle}>
        {i + 1}
      </div>
    ))}
  </>
);

const Chips = ({ count }: { count: number }) => (
  <>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} style={chipStyle}>
        {i + 1}
      </div>
    ))}
  </>
);

// A decorative overlay, one stripe per column track, so the grid's own
// column structure is visible independent of where the real content
// happens to sit — added 2026-09-11, at explicit user direction, to make
// spanning/gaps/auto-placement easier to read at a glance.
//
// Deliberately NOT implemented as extra grid items inside the same grid
// (the first approach tried): a ghost item with an explicit gridColumn/
// gridRow span is treated by the CSS Grid placement algorithm as
// "occupying" those cells for every other item's own auto-placement —
// confirmed against the spec before building this, not assumed — so a
// full-height stripe in column 1 would silently exclude every
// auto-placed real child from ever landing in column 1 at all, breaking
// the very layout the story is trying to demonstrate. Runs its own
// separate absolutely-positioned nested grid instead, matching the real
// grid's `columns`/`gap` exactly so its track boundaries land pixel-for-
// pixel on the real ones, with no interaction with the real grid's own
// placement algorithm at all.
//
// Requires the real `<Grid>` to have both `position: "relative"` AND an
// explicit `zIndex: 0` in its own style — found and fixed 2026-09-11,
// user-reported "not displayed at all" (a *third*, distinct bug from the
// same report, alongside the row-height and border/contrast fixes above):
// `position: "relative"` alone does not establish a new CSS stacking
// context (only `position` combined with a non-`auto` `z-index` does), so
// without an explicit `zIndex` on `Grid` itself, the overlay's `zIndex: -1`
// doesn't resolve locally against its own parent — it escapes to whichever
// ancestor further up the tree *does* establish one, painting behind that
// instead and disappearing entirely. Confirmed by direct experiment, not
// assumed: setting `zIndex: 0` on `Grid` alone (with the overlay still at
// `zIndex: -1`) was the one change that made the already-correctly-sized,
// already-correctly-colored overlay actually visible, behind the real
// content, exactly as intended.
const ColumnTrackOverlay = ({
  columns,
  gap,
  gridTemplateColumns,
  justifyContent,
  alignContent,
  responsiveColumns = false,
  responsiveGap = false,
  as: As = "div",
}: {
  columns: number;
  gap: number;
  // Escape hatch for a story like `ContentAlignment` that bypasses `Grid`'s
  // own `columns` prop entirely (fixed, non-`1fr` tracks via its own
  // `style.gridTemplateColumns` override) — lets the overlay mirror that
  // same literal template instead of assuming `1fr` tracks.
  gridTemplateColumns?: string;
  // Must mirror the real grid's own `justifyContent`/`alignContent` — found
  // and fixed 2026-09-11, confirmed via measured `getBoundingClientRect()`
  // on `ContentAlignment` (not just visual impression): without these, the
  // overlay's own nested grid falls back to `justify-content: normal`
  // (tracks packed at the start), while the real grid's tracks were
  // actually spread via `justifyContent="between"` — the two landed in
  // completely different positions, not just off by a few pixels.
  justifyContent?: string;
  alignContent?: string;
  // Applies `.responsiveColumnsOverlay`/`.responsiveGapOverlay`
  // (Grid.stories.module.css) instead of the inline `gridTemplateColumns`/
  // `gap` — inline styles can't express `@media` queries, so a genuinely
  // responsive story (`ResponsiveColumns`/`ResponsiveGap`) needs the real
  // breakpoint cascade to live in an actual CSS class instead. `columns`
  // still governs how many stripe `<div>`s get rendered (the *maximum*
  // across all breakpoints) — at a narrower breakpoint where fewer column
  // tracks actually exist, the excess stripes auto-place into additional
  // implicit rows below the first, which `overflow: hidden` on the outer
  // element (below) crops away cleanly rather than letting them bleed out
  // past the real grid's own box.
  responsiveColumns?: boolean;
  responsiveGap?: boolean;
  // `<div>` isn't valid content for a real `<ul>` (only `<li>`/`<script>`/
  // `<template>` are) — `AsUnorderedList` renders this overlay as `as="li"`
  // instead, so the DOM stays spec-valid even though React's own direct
  // DOM APIs (unlike innerHTML/HTML-string parsing) don't actually enforce
  // this and would have silently accepted a stray `<div>` there too
  // (confirmed live before fixing, not assumed).
  as?: "div" | "li";
}) => (
  <As
    aria-hidden="true"
    className={
      [
        responsiveColumns ? styles.responsiveColumnsOverlay : "",
        responsiveGap ? styles.responsiveGapOverlay : "",
      ]
        .filter(Boolean)
        .join(" ") || undefined
    }
    style={{
      position: "absolute",
      inset: 0,
      zIndex: -1,
      overflow: "hidden",
      display: "grid",
      gridTemplateColumns: responsiveColumns
        ? undefined
        : (gridTemplateColumns ?? `repeat(${columns}, minmax(0, 1fr))`),
      // Explicit, not left to auto-size (found and fixed 2026-09-11,
      // user-reported "not displayed at all" — root-caused with computed
      // `getBoundingClientRect()`, not assumed from a screenshot): with no
      // `grid-template-rows` of its own, the overlay's single implicit row
      // sized to its own (empty, contentless) stripe divs' natural
      // min-content height — 0 — so every stripe rendered at ~2px tall
      // (its own top+bottom border only), not the full grid height. `1fr`
      // forces the one row to fill the overlay's own already-definite box
      // (sized via `inset: 0` against the real grid) regardless of its
      // content.
      gridTemplateRows: "1fr",
      gap: responsiveGap ? undefined : `var(--dbm-space-${gap})`,
      justifyContent,
      alignContent,
      pointerEvents: "none",
    }}
  >
    {Array.from({ length: columns }, (_, i) => (
      <div key={i} style={{ background: "var(--dbm-bg-brand-subtle)" }} />
    ))}
  </As>
);

const meta: Meta<typeof Grid> = {
  title: "Molecules/Layout/Grid",
  component: Grid,
  parameters: { layout: "padded" },
  // Ordered to match GridProps' own declaration order (as, columns,
  // minChildWidth, gap, autoFlow, autoRows, autoColumns, justifyItems,
  // alignItems, justifyContent, alignContent, children, then the inherited
  // native escape-hatch props last) — same sequencing principle the
  // Properties table uses (07-storybook-and-documentation-standards.md §4
  // item 3).
  argTypes: {
    // `control: false` — matches GridItem's/Heading's/Text's own identical
    // `as` argType: toggling it changes the rendered element, but a plain
    // <div> vs <ul> at otherwise-identical styling is indistinguishable
    // without opening devtools. Fully demonstrated on its own dedicated
    // "Polymorphic: as=ul" story instead, which renders real <li> children
    // so the semantic change is actually observable.
    as: {
      control: false,
      description: "The HTML element (or component) to render as.",
    },
    columns: {
      control: "number",
      description:
        "Number of columns, or a responsive map keyed by breakpoint, e.g. { base: 1, md: 2, lg: 3 }. Breakpoints follow a mobile-first cascade — each one applies at its min-width and above until overridden by a larger breakpoint. Ignored when minChildWidth is set.",
    },
    // `text` control + `""` starting arg, parsed back to `undefined` in
    // every render below — an empty string must NOT reach the component,
    // since Grid.tsx's own `minChildWidth !== undefined` check would then
    // apply `minmax(, 1fr)`, invalid CSS. Mirrors GridItem's own
    // `parseNumberArg` pattern for the same reason (a control needs a real,
    // defined starting value to read as "live," not `undefined`).
    minChildWidth: {
      control: "text",
      description:
        'Renders a fluid grid — as many columns as fit, each at least this CSS size wide (e.g. "12rem") — via repeat(auto-fill, minmax(minChildWidth, 1fr)), instead of a fixed or responsive column count. Takes precedence over columns when set.',
    },
    // `select`, not a plain `number` — `gap` is a spacing *token* step, not
    // an arbitrary integer, and the scale skips several numbers entirely
    // (no `space.7`, `space.9`, `space.11`, etc.). A plain number control
    // let you type an invalid step, which silently resolved to nothing and
    // collapsed to 0 with no error — found and fixed 2026-09-11,
    // user-reported ("no value associated with gap 7"). `SpaceValue` itself
    // already enforces this exact set at the type level; `Stack.stories.tsx`
    // already gets this right for its own `gap` — this matches it.
    gap: {
      control: "select",
      options: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32],
      description:
        "Gap between grid cells (both row and column), as a spacing token step — a single value, or a mobile-first responsive map keyed by breakpoint.",
    },
    autoFlow: {
      control: "select",
      options: ["row", "column", "row dense", "column dense"],
      description:
        "Controls grid-auto-flow — how implicitly-placed items are auto-arranged.",
    },
    autoRows: {
      control: "text",
      description: "Sets grid-auto-rows — the size of implicitly-created rows.",
    },
    autoColumns: {
      control: "text",
      description:
        "Sets grid-auto-columns — the size of implicitly-created columns.",
    },
    justifyItems: {
      control: "select",
      options: ["start", "center", "end", "stretch", "baseline"],
      description:
        "justify-items — how each item aligns within its own cell along the inline (horizontal) axis — a single value, or a mobile-first responsive map keyed by breakpoint.",
    },
    alignItems: {
      control: "select",
      options: ["start", "center", "end", "stretch", "baseline"],
      description:
        "align-items — how each item aligns within its own cell along the block (vertical) axis — a single value, or a mobile-first responsive map keyed by breakpoint.",
    },
    // `control: false` — genuinely inert in this Playground's own demo:
    // both `columns` and `minChildWidth` generate 1fr-based column tracks,
    // which always fill 100% of the container's inline size by definition,
    // leaving justify-content nothing to position (see this prop's own
    // JSDoc in Grid.types.ts). Demonstrated on its own dedicated "Content
    // alignment" story instead, via a fixed (non-fr) gridTemplateColumns
    // override — the one real case where it has a visible effect.
    justifyContent: {
      control: false,
      options: ["start", "center", "end", "stretch", "between", "around", "evenly"],
      description:
        "justify-content — how the grid's own column tracks are positioned within the container along the inline axis, when their total size is smaller than the container. Has no visible effect under Grid's own default track sizing — see the Content alignment story.",
    },
    alignContent: {
      control: "select",
      options: ["start", "center", "end", "stretch", "between", "around", "evenly"],
      description:
        "align-content — how the grid's own row tracks are positioned within the container along the block axis, when their total size is smaller than the container — a single value, or a mobile-first responsive map keyed by breakpoint.",
    },
    // `children` isn't a meaningful live-editable control for a layout
    // container rendering multiple structured child cells — every story
    // (including the Playground) hardcodes its own children in `render`.
    children: {
      control: false,
      description: "The content to lay out in the grid.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Needed when another element's aria-labelledby/aria-describedby must point at this component, or a test/router needs a stable anchor.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization.",
    },
    style: {
      control: false,
      description: "Inline styles, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  // Every controllable prop gets an explicit value matching its real
  // component default where one exists (columns=12, gap=0, autoFlow="row" —
  // CSS's own initial value, since autoFlow has no JS-level default either).
  // `minChildWidth`/`autoRows`/`autoColumns` get "" (parses to `undefined`,
  // see each argType's own comment) rather than a real value, since none of
  // the three has a safe non-empty default that wouldn't override `columns`
  // or otherwise change every other prop's own demonstrated behavior.
  // `justifyItems`/`alignItems`/`alignContent` have no true default (all
  // three are genuinely unset/`normal` until a consumer opts in) — per
  // 06-engineering-standards.md §9, a prop with no true default gets a
  // sensible non-blank demo value instead, so the demo starts from a
  // visibly non-trivial state rather than every chip stacked at its cell's
  // natural corner.
  args: {
    columns: 3,
    minChildWidth: "",
    gap: 4,
    autoFlow: "row",
    autoRows: "",
    autoColumns: "",
    justifyItems: "start",
    alignItems: "center",
    alignContent: "start",
    as: undefined,
  },
  render: (args) => {
    // `columns`/`gap`'s Playground controls only ever produce a plain
    // number (never a responsive map) — this narrowing is a type-safe
    // fallback, not a real runtime case, same reasoning as `ItemAlignment`'s
    // own `describe` helper below.
    const columns = typeof args.columns === "number" ? args.columns : 3;
    const gap = typeof args.gap === "number" ? args.gap : 4;
    const alignContent = toCssContentAlign(
      typeof args.alignContent === "string" ? args.alignContent : undefined,
    );
    return (
      <Grid
        {...args}
        minChildWidth={args.minChildWidth || undefined}
        autoRows={args.autoRows || "6rem"}
        autoColumns={args.autoColumns || undefined}
        style={{
          position: "relative",
          zIndex: 0,
          height: "16rem",
          outline: "1px dashed var(--dbm-border-focus)",
        }}
      >
        <ColumnTrackOverlay columns={columns} gap={gap} alignContent={alignContent} />
        <Chips count={6} />
      </Grid>
    );
  },
};

export default meta;

type Story = StoryObj<typeof Grid>;

export const Playground: Story = {
  name: "Playground",
};

export const DefaultColumns: Story = {
  name: "Default (12 columns, no columns prop)",
  // `columns` isn't just hidden — it must never actually reach `Grid` at
  // all (the whole point of this story is the *default*, un-set value), so
  // it's explicitly overridden to `undefined` after the spread below, not
  // just given `control: false`. Every other prop stays genuinely live and
  // shared, spread via `{...args}` — this story previously used an
  // args-free `render: () => (...)`, which silently no-opped every control
  // except the ones each story explicitly hardcoded (found and fixed
  // 2026-09-11, user-reported: the "story ignores its own args" bug class
  // `06-engineering-standards.md` §9 already warns about).
  argTypes: { columns: { control: false }, children: { control: false } },
  args: { gap: 2 },
  render: (args) => {
    const gap = typeof args.gap === "number" ? args.gap : 2;
    const alignContent = toCssContentAlign(
      typeof args.alignContent === "string" ? args.alignContent : undefined,
    );
    return (
      <Grid
        {...args}
        columns={undefined}
        style={{
          position: "relative",
          zIndex: 0,
          outline: "1px dashed var(--dbm-border-focus)",
        }}
      >
        <ColumnTrackOverlay columns={12} gap={gap} alignContent={alignContent} />
        <Cells count={12} />
      </Grid>
    );
  },
};

export const FixedColumns: Story = {
  name: "Fixed 4 columns",
  argTypes: { columns: { control: false }, children: { control: false } },
  render: (args) => {
    const gap = typeof args.gap === "number" ? args.gap : 4;
    const alignContent = toCssContentAlign(
      typeof args.alignContent === "string" ? args.alignContent : undefined,
    );
    return (
      <Grid
        {...args}
        columns={4}
        style={{
          position: "relative",
          zIndex: 0,
          outline: "1px dashed var(--dbm-border-focus)",
        }}
      >
        <ColumnTrackOverlay columns={4} gap={gap} alignContent={alignContent} />
        <Cells count={8} />
      </Grid>
    );
  },
};

export const ResponsiveColumns: Story = {
  name: "Responsive: 1 column mobile, 2 tablet, 3 desktop",
  // `columns` is hardcoded to a responsive map here — no single `number`
  // control could represent "base=1, md=2, lg=3" as one value, the
  // multi-instance-gallery exception (06-engineering-standards.md §9).
  // Every other prop stays live via `{...args}`. `ColumnTrackOverlay` here
  // uses `responsiveColumns` (found and fixed 2026-09-12, user-reported —
  // the earlier version of this story had no overlay at all, since a
  // single static column count couldn't represent "1 at mobile, 2 at
  // tablet, 3 at desktop" without misaligning at two of the three): a real
  // CSS class (Grid.stories.module.css) mirrors the exact same
  // `{ base: 1, md: 2, lg: 3 }` breakpoint cascade via `@media` queries,
  // which an inline style alone can't express.
  // `parameters.chromatic` removed (2026-08-29) — Chromatic is a paid SaaS
  // tool this project never adopted (02-tech-stack-and-structure.md picked
  // Playwright's own self-hosted visual regression instead); this
  // parameter was always inert here. See Input.stories.tsx's own review
  // finding for the full writeup.
  argTypes: { columns: { control: false }, children: { control: false } },
  render: (args) => {
    const gap = typeof args.gap === "number" ? args.gap : 4;
    const alignContent = toCssContentAlign(
      typeof args.alignContent === "string" ? args.alignContent : undefined,
    );
    return (
      <Grid
        {...args}
        columns={{ base: 1, md: 2, lg: 3 }}
        style={{
          position: "relative",
          zIndex: 0,
          outline: "1px dashed var(--dbm-border-focus)",
        }}
      >
        <ColumnTrackOverlay
          columns={3}
          gap={gap}
          alignContent={alignContent}
          responsiveColumns
        />
        <Cells count={6} />
      </Grid>
    );
  },
};

export const WithSpanningItems: Story = {
  name: "With GridItem colSpan/rowSpan",
  // `columns` is fixed at 4 — structural to this demo's own colSpan={2}/
  // colSpan={4} values, which assume a 4-column grid. Every other prop
  // (gap, autoFlow, alignment, etc.) stays live via `{...args}`.
  argTypes: { columns: { control: false }, children: { control: false } },
  render: (args) => {
    const gap = typeof args.gap === "number" ? args.gap : 4;
    const alignContent = toCssContentAlign(
      typeof args.alignContent === "string" ? args.alignContent : undefined,
    );
    return (
      <Grid
        {...args}
        columns={4}
        style={{
          position: "relative",
          zIndex: 0,
          outline: "1px dashed var(--dbm-border-focus)",
        }}
      >
        <ColumnTrackOverlay columns={4} gap={gap} alignContent={alignContent} />
        <GridItem colSpan={2} style={cellStyle}>
          colSpan=2
        </GridItem>
        <GridItem style={cellStyle}>1x1</GridItem>
        <GridItem style={cellStyle}>1x1</GridItem>
        <GridItem colSpan={4} style={cellStyle}>
          colSpan=4 (full width)
        </GridItem>
      </Grid>
    );
  },
};

export const ResponsiveGap: Story = {
  name: "Responsive gap (tight on mobile, roomy from lg up)",
  // `gap` is hardcoded to a responsive map here — same multi-instance-
  // gallery exception as ResponsiveColumns above. `columns` stays live via
  // `{...args}` (its own meta default, 3, already matches this story's
  // original fixed value). `ColumnTrackOverlay` here uses `responsiveGap`
  // (found and fixed 2026-09-12, user-reported — same gap as
  // ResponsiveColumns had): a real CSS class mirrors the exact
  // `{ base: 1, lg: 8 }` cascade via `@media`, matching this story's own
  // `gap` prop exactly.
  // `parameters.chromatic` removed (2026-08-29) — see ResponsiveColumns
  // above, same file, for why.
  argTypes: { gap: { control: false }, children: { control: false } },
  render: (args) => {
    const columns = typeof args.columns === "number" ? args.columns : 3;
    const alignContent = toCssContentAlign(
      typeof args.alignContent === "string" ? args.alignContent : undefined,
    );
    return (
      <Grid
        {...args}
        gap={{ base: 1, lg: 8 }}
        style={{
          position: "relative",
          zIndex: 0,
          outline: "1px dashed var(--dbm-border-focus)",
        }}
      >
        <ColumnTrackOverlay
          columns={columns}
          gap={0}
          alignContent={alignContent}
          responsiveGap
        />
        <Cells count={6} />
      </Grid>
    );
  },
};

export const FluidMinChildWidth: Story = {
  name: "Fluid: minChildWidth (no explicit breakpoints)",
  argTypes: { minChildWidth: { control: false }, children: { control: false } },
  render: (args) => {
    const gap = typeof args.gap === "number" ? args.gap : 4;
    const alignContent = toCssContentAlign(
      typeof args.alignContent === "string" ? args.alignContent : undefined,
    );
    return (
      <Grid
        {...args}
        minChildWidth="var(--dbm-space-32)"
        style={{
          position: "relative",
          zIndex: 0,
          outline: "1px dashed var(--dbm-border-focus)",
        }}
      >
        {/* The real column count here is however many `auto-fill` tracks
            fit the current container width — genuinely unknowable ahead of
            render (found and fixed 2026-09-12, user-reported — the earlier
            version of this story had no overlay at all for this reason).
            Reusing the exact same `repeat(auto-fill, minmax(...))` formula
            `Grid`/`Grid.tsx` itself applies means the overlay computes the
            *same* track count from the *same* container width natively, no
            JS measurement needed — 12 stripe `<div>`s is a generous supply
            for any realistic width at this `minChildWidth`; any that don't
            fit the first row wrap into implicit rows below, cropped away by
            `overflow: hidden` (see `ColumnTrackOverlay`'s own comment). */}
        <ColumnTrackOverlay
          columns={12}
          gap={gap}
          gridTemplateColumns="repeat(auto-fill, minmax(var(--dbm-space-32), 1fr))"
          alignContent={alignContent}
        />
        <Cells count={9} />
      </Grid>
    );
  },
};

export const DensePacking: Story = {
  name: 'autoFlow="row dense" (backfills gaps from mixed spans)',
  // `autoFlow` and `columns` are both fixed — the demo's specific colSpan
  // values and gap-backfilling behavior are only meaningful against this
  // exact 4-column, row-dense combination. Every other prop stays live.
  argTypes: {
    autoFlow: { control: false },
    columns: { control: false },
    children: { control: false },
  },
  render: (args) => {
    const gap = typeof args.gap === "number" ? args.gap : 4;
    const alignContent = toCssContentAlign(
      typeof args.alignContent === "string" ? args.alignContent : undefined,
    );
    return (
      <Grid
        {...args}
        columns={4}
        autoFlow="row dense"
        style={{
          position: "relative",
          zIndex: 0,
          outline: "1px dashed var(--dbm-border-focus)",
        }}
      >
        <ColumnTrackOverlay columns={4} gap={gap} alignContent={alignContent} />
        <GridItem colSpan={2} style={cellStyle}>
          colSpan=2
        </GridItem>
        <GridItem style={cellStyle}>1x1</GridItem>
        <GridItem colSpan={2} style={cellStyle}>
          colSpan=2
        </GridItem>
        <GridItem style={cellStyle}>1x1</GridItem>
        <GridItem style={cellStyle}>1x1</GridItem>
      </Grid>
    );
  },
};

export const ItemAlignment: Story = {
  name: "justifyItems/alignItems (aligning every item within its own cell)",
  // `justifyItems`/`alignItems` are set on the *grid container* and apply
  // uniformly to every item in it (the CSS Grid item-alignment properties
  // are not settable per-item through Grid alone — GridItem has no such
  // props). Demonstrated via two grids, each its own full-width row (found
  // and fixed 2026-09-12, user-requested — previously side-by-side at a
  // fixed 13rem each), that share every prop via `{...args}` — columns,
  // gap, autoRows, etc. all stay live and update both grids identically —
  // except `justifyItems`/`alignItems` themselves: the top grid always
  // forces them `undefined` (the fixed "unset" baseline), the bottom grid
  // uses their live value from `args`. This keeps the comparison
  // meaningful under any combination of the other controls, rather than
  // the two grids silently drifting apart.
  argTypes: { children: { control: false } },
  args: { columns: 2, autoRows: "6rem" },
  render: (args) => {
    const sharedProps = {
      ...args,
      minChildWidth: args.minChildWidth || undefined,
      autoRows: args.autoRows || "6rem",
      autoColumns: args.autoColumns || undefined,
    };
    // `justifyItems`/`alignItems` are typed `Responsive<GridItemsAlign>` —
    // a responsive breakpoint map is a valid value but isn't renderable as
    // plain text; the Playground's own `select` control only ever produces
    // a plain string, so this is just a type-safe display fallback, not a
    // real runtime case.
    const describe = (value: unknown) =>
      typeof value === "string" ? value : "unset";
    const columns = typeof args.columns === "number" ? args.columns : 2;
    const gap = typeof args.gap === "number" ? args.gap : 4;
    const alignContent = toCssContentAlign(
      typeof args.alignContent === "string" ? args.alignContent : undefined,
    );
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-8)" }}>
        <div>
          <p style={{ margin: "0 0 var(--dbm-space-2)" }}>
            Unset (default — items keep their own size, positioned at start)
          </p>
          <Grid
            {...sharedProps}
            justifyItems={undefined}
            alignItems={undefined}
            style={{
              position: "relative",
              zIndex: 0,
              width: "100%",
              outline: "1px dashed var(--dbm-border-focus)",
            }}
          >
            <ColumnTrackOverlay columns={columns} gap={gap} alignContent={alignContent} />
            <Chips count={4} />
          </Grid>
        </div>
        <div>
          <p style={{ margin: "0 0 var(--dbm-space-2)" }}>
            justifyItems=&quot;{describe(args.justifyItems)}&quot; alignItems=&quot;
            {describe(args.alignItems)}&quot;
          </p>
          <Grid
            {...sharedProps}
            style={{
              position: "relative",
              zIndex: 0,
              width: "100%",
              outline: "1px dashed var(--dbm-border-focus)",
            }}
          >
            <ColumnTrackOverlay columns={columns} gap={gap} alignContent={alignContent} />
            <Chips count={4} />
          </Grid>
        </div>
      </div>
    );
  },
};

export const ContentAlignment: Story = {
  name: "justifyContent/alignContent (positioning the grid's own tracks)",
  // `justifyContent`/`alignContent` only have a visible effect when the
  // grid's own tracks total less than the container's size — not the case
  // for `columns`/`minChildWidth`, both of which always generate 1fr-based
  // tracks that fill 100% of the container (see each prop's own JSDoc in
  // Grid.types.ts). Demonstrated via a direct `gridTemplateColumns`
  // override through the `style` escape hatch — three fixed 4rem tracks,
  // deliberately narrower than the container — the one real way these
  // props become relevant today, which is also why `columns` is disabled
  // here (it would be silently overridden by that same `style`, same as
  // `justifyContent` was found to be genuinely inert in the Playground).
  // `justifyContent`'s control is explicitly re-enabled here, overriding
  // the `control: false` set at the meta level — that meta-level setting
  // is correct for the Playground/every other story (where the prop is
  // genuinely inert), but this is the one story where it actually has a
  // visible effect, and a per-story `argTypes` override was needed or it
  // would have silently inherited "disabled" here too (found and fixed
  // 2026-09-11, user-reported).
  argTypes: {
    columns: { control: false },
    justifyContent: {
      control: "select",
      options: ["start", "center", "end", "stretch", "between", "around", "evenly"],
    },
    children: { control: false },
  },
  args: { justifyContent: "between", alignContent: "center" },
  render: (args) => {
    const gap = typeof args.gap === "number" ? args.gap : 4;
    const justifyContent = toCssContentAlign(
      typeof args.justifyContent === "string" ? args.justifyContent : undefined,
    );
    const alignContent = toCssContentAlign(
      typeof args.alignContent === "string" ? args.alignContent : undefined,
    );
    return (
      <Grid
        {...args}
        columns={undefined}
        minChildWidth={args.minChildWidth || undefined}
        autoRows={args.autoRows || undefined}
        autoColumns={args.autoColumns || undefined}
        style={{
          position: "relative",
          zIndex: 0,
          gridTemplateColumns: "repeat(3, 4rem)",
          height: "12rem",
          outline: "1px dashed var(--dbm-border-focus)",
        }}
      >
        <ColumnTrackOverlay
          columns={3}
          gap={gap}
          gridTemplateColumns="repeat(3, 4rem)"
          justifyContent={justifyContent}
          alignContent={alignContent}
        />
        <Chips count={3} />
      </Grid>
    );
  },
};

export const AsUnorderedList: Story = {
  name: 'Polymorphic: as="ul" (real semantic list, Grid layout behavior)',
  // `as` is fixed to "ul" — necessary for valid list markup, the whole
  // point of this story. Every other prop (columns/gap default to 3 here,
  // overriding the Playground's own meta defaults) stays live via
  // `{...args}`.
  argTypes: { as: { control: false }, children: { control: false } },
  args: { columns: 3, gap: 3 },
  render: (args) => {
    const columns = typeof args.columns === "number" ? args.columns : 3;
    const gap = typeof args.gap === "number" ? args.gap : 3;
    const alignContent = toCssContentAlign(
      typeof args.alignContent === "string" ? args.alignContent : undefined,
    );
    return (
      <Grid
        {...args}
        as="ul"
        style={{
          position: "relative",
          zIndex: 0,
          listStyle: "none",
          margin: 0,
          padding: 0,
          outline: "1px dashed var(--dbm-border-focus)",
        }}
      >
        <ColumnTrackOverlay
          columns={columns}
          gap={gap}
          alignContent={alignContent}
          as="li"
        />
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} style={cellStyle}>
            {i + 1}
          </li>
        ))}
      </Grid>
    );
  },
};
