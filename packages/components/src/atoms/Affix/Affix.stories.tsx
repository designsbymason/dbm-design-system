import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";
import { expect, fn, waitFor, within } from "storybook/test";
import { Text } from "../Text";
import { Affix } from "./Affix";
import type { AffixProps } from "./Affix.types";

const meta: Meta<typeof Affix> = {
  title: "Atoms/Layout/Affix",
  component: Affix,
  // Affix only makes sense against real scroll space — every story here
  // needs its own tall/scrollable canvas, so fullscreen (rather than the
  // usual "padded") applies to the whole file, not just individual demos.
  parameters: { layout: "fullscreen" },
  argTypes: {
    // The Playground composes its own demo header bar around `edge`/
    // `offset` (see below) rather than exposing raw JSX children as a text
    // control — a styled header bar isn't representable as a string, the
    // same reasoning Card-like demos elsewhere fix their own markup.
    children: {
      control: false,
      description: "The content to stick — a table header, filter bar, section nav, etc.",
    },
    axis: { control: "select", options: ["vertical", "horizontal"] },
    edge: { control: "select", options: ["start", "end"] },
    offset: {
      control: "select",
      options: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32],
    },
    // A React ref has no meaningful Controls-panel representation — see
    // the dedicated `WithinScrollContainer` story for a live demo instead.
    scrollContainerRef: {
      control: false,
      description:
        "The scrollable container to detect stuck state against, if not the page itself. Demo via the \"Within a scroll container\" story below.",
    },
    onStickyChange: {
      control: false,
      description: "Called whenever the stuck state changes.",
    },
    // `control: false` — values that only mean something wired up in real
    // consuming code, not in an isolated Storybook canvas. Matches every
    // other reviewed component's established precedent for this same set
    // of four (Button, ProgressBar, Checkbox, IconButton…). Previously
    // missing entirely, which left all four rendering as broken inert
    // "Set string"/"Set object" placeholders instead of "–" (found in
    // review, via direct user report).
    id: { control: false, description: "Standard DOM id." },
    className: {
      control: false,
      description:
        "Additional CSS classes for customization. Merged with the component's own internal classes rather than replacing them.",
    },
    style: {
      control: false,
      description:
        "Inline styles, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description: "Test identifier for automated testing.",
    },
  },
  args: {
    children: "Header content",
    axis: "vertical",
    edge: "start",
    offset: 0,
    onStickyChange: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof Affix>;

/**
 * Drive `axis`/`edge`/`offset` live via the Controls panel below, and
 * scroll the canvas to see it stick — `Affix.mdx` renders this story's
 * Docs-page preview via the custom `PlaygroundCanvas` block (not the
 * standard `<Canvas>`) specifically so both of those actually work
 * together; see that block's own doc comment for why `<Canvas>` alone
 * can't do both at once for a page-scroll-based sticky story like this
 * one. `axis="horizontal"` swaps the whole demo's shape (a horizontally-
 * scrolling row of columns via its own internal `scrollContainerRef`,
 * mirroring `HorizontalScrollInteraction` below) rather than just
 * reinterpreting the same vertical content sideways — a real user report
 * flagged the earlier version, which disabled `axis` entirely here
 * (reasoning the vertical-only content wouldn't make sense as a
 * horizontal demo) as more restrictive than necessary; building the
 * actual alternate shape instead is exactly one more axis of "explore
 * the prop combinations," which is this section's whole job.
 */
export const Playground: Story = {
  render: function PlaygroundStory(args) {
    const [stuck, setStuck] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const isHorizontal = args.axis === "horizontal";
    // Real, previously-shipped bug (found via direct user report): the
    // unstuck label hardcoded "Scroll down" regardless of `side` (`edge`,
    // after the axis/edge rename), which is backwards for `edge="end"`
    // — given this demo's leading-only content on the active axis (see
    // the reordering below), `end` starts *already* stuck and only
    // un-sticks once scrolled past the end of the container, so the
    // direction that re-engages it is the *reverse* of `start`'s own
    // instruction, on whichever axis is active.
    const unstuckLabel = isHorizontal
      ? args.edge === "end"
        ? "Scroll left"
        : "Scroll right"
      : args.edge === "end"
        ? "Scroll up"
        : "Scroll down";
    const header = (
      <Affix
        {...args}
        // Only wired up for the horizontal demo — `scrollContainerRef`
        // isn't itself a Controls-panel prop (a React ref has no
        // meaningful control representation, same reasoning as
        // `WithinScrollContainer`'s own dedicated demo), so this story
        // manages it internally rather than exposing it.
        scrollContainerRef={isHorizontal ? containerRef : undefined}
        onStickyChange={(isStuck) => {
          setStuck(isStuck);
          args.onStickyChange?.(isStuck);
        }}
      >
        <div
          style={
            isHorizontal
              ? {
                  width: "10rem",
                  flexShrink: 0,
                  padding: "0.75rem 1rem",
                  background: "var(--dbm-bg-surface)",
                  borderInlineEnd: stuck
                    ? "var(--dbm-border-width-2) solid var(--dbm-border-neutral)"
                    : "var(--dbm-border-width-1) solid var(--dbm-border-default)",
                }
              : {
                  padding: "1rem 1.5rem",
                  background: "var(--dbm-bg-surface)",
                  borderBlock: stuck
                    ? "var(--dbm-border-width-2) solid var(--dbm-border-neutral)"
                    : "var(--dbm-border-width-1) solid var(--dbm-border-default)",
                }
          }
        >
          <Text weight="semibold">{stuck ? "Stuck!" : unstuckLabel}</Text>
        </div>
      </Affix>
    );
    const content = isHorizontal ? (
      Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          style={{
            flex: "0 0 12rem",
            padding: "0.75rem 1rem",
            borderInlineEnd: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
          }}
        >
          <Text>Column {i + 1}.</Text>
        </div>
      ))
    ) : (
      <div style={{ padding: "var(--dbm-space-6)" }}>
        {Array.from({ length: 30 }, (_, i) => (
          <Text key={i} style={{ marginBlockEnd: "var(--dbm-space-4)" }}>
            Content line {i + 1}.
          </Text>
        ))}
      </div>
    );
    // Real, previously-shipped bug (found via direct user report):
    // content always came *after* the Affix regardless of `side` (now
    // `edge`), which only gives `edge="start"` the room it needs —
    // `edge="end"` sticky is the mirror case and needs substantial
    // *leading* content before the sticky element instead, on whichever
    // axis is active (confirmed while building the dedicated
    // `BottomScrollInteraction` story below; without it, the header just
    // scrolls away immediately with nothing to hold it, since it starts
    // at the very start of a container with no room after it to be
    // "caught" at the end edge). No explicit height/width forced on the
    // outer wrapper for the same reason `BottomScrollInteraction`
    // doesn't have one — a declared size that doesn't match the actual
    // (edge-dependent) content extent reintroduces the exact containing-
    // block mismatch already fixed once on `Affix.tsx` itself; letting
    // it auto-size to whichever ordering is active avoids that.
    const ordered =
      args.edge === "end" ? (
        <>
          {content}
          {header}
        </>
      ) : (
        <>
          {header}
          {content}
        </>
      );

    if (isHorizontal) {
      return (
        <div style={{ padding: "var(--dbm-space-6)" }}>
          <div
            ref={containerRef}
            data-testid="playground-horizontal-panel"
            role="region"
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- same reasoning as `WithinScrollContainer`/`HorizontalScrollInteraction`: a scrollable, non-interactive region genuinely needs tabIndex to be keyboard-scrollable per WCAG 2.1.1.
            tabIndex={0}
            aria-label="Horizontally scrollable demo panel"
            style={{
              display: "flex",
              overflowX: "auto",
              border: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
              borderRadius: "var(--dbm-radius-md)",
            }}
          >
            {ordered}
          </div>
        </div>
      );
    }

    return <div>{ordered}</div>;
  },
};

export const StickyHeader: Story = {
  name: "Sticky table-style header",
  // No `docs.story.inline: false` parameter here (despite the same
  // `.docs-story` containing-block issue `Playground` above has) — this
  // story's Docs-page embedding uses `PlaygroundCanvas` instead (see
  // `Affix.mdx`), which solves that same problem without it. Real,
  // previously-shipped bug found this way (during a final review, not a
  // user report): Storybook's own `inline: false`/`IFrameStory`
  // mechanism builds its iframe's `src` from `getStoryHref(story.id, {
  // viewMode: "story" })` alone — no `globals` embedded, confirmed by
  // reading that function's own source (`@storybook/addon-docs/dist/
  // blocks.js`) — so this story stayed stuck showing Purple/Light no
  // matter what the Docs page's own Brand/Mode toolbar was set to,
  // visibly wrong right next to `WithinScrollContainer` (inlined,
  // correctly theme-reactive) in the same Variants section.
  // `PlaygroundCanvas` already reads and embeds the live globals
  // correctly (see its own doc comment) — reusing it here fixes this for
  // free instead of building a second, parallel fix for the same root
  // cause Storybook's own mechanism doesn't handle.
  // `axis`/`edge`/`offset` disabled — this is meant to stay *the* static,
  // fixed-default (vertical, `edge="start"`) variant demo per its own
  // name and the Variants-gallery convention (`07-storybook-and-
  // documentation-standards.md` §4), same reasoning `ScrollInteraction`/
  // `BottomScrollInteraction` already disable them for. `side` (`edge`,
  // after the axis/edge rename) was left controllable before this fix
  // only because nothing had explicitly turned it off — real, previously-
  // shipped bug (found via direct user report): with it enabled,
  // switching to `side="bottom"` inherited the exact same "content
  // always trailing" layout issue `Playground` had before its own fix,
  // since this story's `render` never got the equivalent conditional-
  // reordering treatment. `Playground` is the intended place to explore
  // `axis`/`edge`/`offset` combinations; this one demonstrates one fixed,
  // correct configuration well rather than every configuration
  // adequately.
  argTypes: {
    axis: { control: false },
    edge: { control: false },
    offset: { control: false },
  },
  render: function StickyHeaderStory(args) {
    const [stuck, setStuck] = useState(false);
    return (
      <div style={{ height: "150vh" }}>
        <Affix
          {...args}
          onStickyChange={(isStuck) => {
            setStuck(isStuck);
            args.onStickyChange?.(isStuck);
          }}
        >
          <div
            style={{
              padding: "1rem 1.5rem",
              background: "var(--dbm-bg-surface)",
              borderBlock: stuck
                ? "var(--dbm-border-width-2) solid var(--dbm-border-neutral)"
                : "var(--dbm-border-width-1) solid var(--dbm-border-default)",
            }}
          >
            <Text weight="semibold">{stuck ? "Stuck!" : "Scroll down"}</Text>
          </div>
        </Affix>
        <div style={{ padding: "var(--dbm-space-6)" }}>
          {Array.from({ length: 30 }, (_, i) => (
            <Text key={i} style={{ marginBlockEnd: "var(--dbm-space-4)" }}>
              Content line {i + 1}.
            </Text>
          ))}
        </div>
      </div>
    );
  },
};

export const WithinScrollContainer: Story = {
  name: "Within a scroll container (scrollContainerRef)",
  // `axis`/`edge`/`offset` now also disabled, alongside `children` —
  // real, previously-shipped bug (found via direct user report): left
  // controllable, `side="bottom"` (`edge="end"`, after the rename)
  // inherited the same "content always trailing the Affix" layout issue
  // `Playground` had before its own fix (this story's panel content
  // `<div>` also only ever comes after the header). `scrollContainerRef`
  // is the one thing this story exists to demonstrate; exploring
  // `axis`/`edge`/`offset` combinations is `Playground`'s job, not this
  // one's.
  argTypes: {
    children: { control: false },
    axis: { control: false },
    edge: { control: false },
    offset: { control: false },
  },
  render: function WithinScrollContainerStory(args) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [stuck, setStuck] = useState(false);
    return (
      <div style={{ padding: "var(--dbm-space-6)" }}>
        <Text style={{ marginBlockEnd: "var(--dbm-space-4)" }}>
          A dashboard-panel-style scrollable container, not the page itself —
          scroll inside the box below.
        </Text>
        <div
          ref={containerRef}
          data-testid="scroll-panel"
          role="region"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable, non-interactive region genuinely needs tabIndex to be keyboard-focusable/scrollable per WCAG 2.1.1 (axe's own scrollable-region-focusable rule requires exactly this pattern); jsx-a11y's rule doesn't special-case role="region" for it.
          tabIndex={0}
          aria-label="Scrollable demo panel"
          style={{
            height: "20rem",
            overflow: "auto",
            border: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
            borderRadius: "var(--dbm-radius-md)",
          }}
        >
          <Affix
            {...args}
            scrollContainerRef={containerRef}
            onStickyChange={setStuck}
          >
            <div
              data-testid="panel-affix-header"
              style={{
                padding: "0.75rem 1rem",
                background: "var(--dbm-bg-surface)",
                borderBlockEnd: stuck
                  ? "var(--dbm-border-width-2) solid var(--dbm-border-neutral)"
                  : "var(--dbm-border-width-1) solid var(--dbm-border-default)",
              }}
            >
              <Text weight="semibold">
                {stuck ? "Stuck!" : "Scroll the panel, not the page"}
              </Text>
            </div>
          </Affix>
          <div style={{ padding: "var(--dbm-space-4)" }}>
            {Array.from({ length: 20 }, (_, i) => (
              <Text key={i} style={{ marginBlockEnd: "var(--dbm-space-3)" }}>
                Panel row {i + 1}.
              </Text>
            ))}
          </div>
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const panel = canvas.getByTestId("scroll-panel");
    const header = canvas.getByTestId("panel-affix-header");
    const affixRoot = header.parentElement as HTMLElement;

    await expect(affixRoot).not.toHaveAttribute("data-stuck");

    // Scrolling the panel itself (not the page) is the whole point of
    // `scrollContainerRef` — proves the IntersectionObserver's `root` is
    // genuinely the panel, not the viewport default, since the panel
    // never leaves the viewport here at all.
    panel.scrollTop = 300;
    panel.dispatchEvent(new Event("scroll"));

    await waitFor(() => {
      expect(affixRoot).toHaveAttribute("data-stuck", "true");
    });
    // Same check as `ScrollInteraction`: `data-stuck` alone isn't proof
    // the element is actually visible, pinned at the panel's own top edge
    // — confirmed via `getBoundingClientRect()` against the panel's own
    // bounds, not just the viewport (which never moves in this story). A
    // couple of pixels' tolerance: the panel's own `border-width.1` sits
    // between its outer border-box edge (what `getBoundingClientRect()`
    // returns) and the content edge the sticky element actually pins to
    // — a real, expected offset, not sub-pixel rendering noise.
    await waitFor(() => {
      expect(
        Math.abs(
          affixRoot.getBoundingClientRect().top - panel.getBoundingClientRect().top,
        ),
      ).toBeLessThan(3);
    });

    panel.scrollTop = 0;
    panel.dispatchEvent(new Event("scroll"));

    await waitFor(() => {
      expect(affixRoot).not.toHaveAttribute("data-stuck");
    });
  },
};

export const ScrollInteraction: Story = {
  name: "Interaction: sticks and reports data-stuck while scrolling",
  argTypes: {
    axis: { control: false },
    edge: { control: false },
    offset: { control: false },
  },
  render: function ScrollInteractionStory(args) {
    const [stuck, setStuck] = useState(false);
    return (
      <div data-testid="scroll-page" style={{ height: "150vh" }}>
        <Affix
          {...args}
          onStickyChange={(isStuck) => {
            setStuck(isStuck);
            args.onStickyChange?.(isStuck);
          }}
        >
          <div data-testid="affix-header" style={{ padding: "1rem 1.5rem" }}>
            <Text weight="semibold">{stuck ? "Stuck!" : "Scroll down"}</Text>
          </div>
        </Affix>
        <div style={{ height: "150vh" }} />
      </div>
    );
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const header = canvas.getByTestId("affix-header");
    // `data-stuck` renders on Affix's own sticky root, not the `children`
    // it wraps — `header`'s direct parent is that root (see Affix.tsx:
    // `<div ref={ref} {...props} data-stuck={...}>{children}</div>`). Not
    // using `.closest("[data-stuck]")`: when unstuck, the attribute is
    // `undefined` and therefore never rendered at all (React omits it), so
    // that selector matches nothing and `.closest()` returns `null` —
    // confirmed live, the original version of this test failed exactly
    // that way.
    const affixRoot = header.parentElement as HTMLElement;

    // Not stuck at the very top of the page.
    await expect(affixRoot).not.toHaveAttribute("data-stuck");

    // Scrolling the real page moves the sentinel out of the viewport,
    // which a real IntersectionObserver in this Chromium-backed test
    // environment genuinely detects — unlike the jsdom-based `unit`
    // project, which stubs IntersectionObserver entirely and can't
    // exercise this at all.
    window.scrollTo({ top: 800 });

    await waitFor(() => {
      expect(affixRoot).toHaveAttribute("data-stuck", "true");
    });
    await expect(args.onStickyChange).toHaveBeenCalledWith(true);

    // `data-stuck` being `true` isn't proof the element is actually
    // *visible*, pinned at the top of the viewport — a real, previously-
    // shipped bug (found via direct user report) had `data-stuck` firing
    // correctly while the element itself drifted off-screen above the
    // viewport instead of staying visible. Confirmed via
    // `getBoundingClientRect()` across further scrolling: `top` must stay
    // at `0`, not just stop changing at some other value.
    expect(affixRoot.getBoundingClientRect().top).toBe(0);
    window.scrollTo({ top: 1400 });
    await waitFor(() => {
      expect(affixRoot.getBoundingClientRect().top).toBe(0);
    });

    window.scrollTo({ top: 0 });

    await waitFor(() => {
      expect(affixRoot).not.toHaveAttribute("data-stuck");
    });
    await expect(args.onStickyChange).toHaveBeenLastCalledWith(false);
  },
};

export const BottomScrollInteraction: Story = {
  name: "Interaction: edge=end sticks to the bottom edge while scrolling",
  // `edge="end"` (`side="bottom"`, before the axis/edge rename) had
  // never been exercised by any test before this review — the sentinel/
  // root reordering it drives (see Affix.tsx's own `edge === "start" ?
  // ... : ...` branch) is a real, distinct code path, not just a
  // mirrored CSS value, so it needs its own coverage rather than
  // assuming symmetry with the `edge="start"` case holds.
  argTypes: {
    axis: { control: false },
    edge: { control: false },
    offset: { control: false },
  },
  args: { edge: "end" } satisfies Partial<AffixProps>,
  render: function BottomScrollInteractionStory(args) {
    const [stuck, setStuck] = useState(false);
    return (
      <div>
        {/* Deliberately more than one viewport's worth of leading content
            — a bottom-sticky bar's natural (unstuck) position sits *after*
            it, so with enough leading content it reads as "stuck" (visibly
            pinned to the bottom) from the very first scroll pixel, staying
            that way until genuinely nearing the end of the page. This is
            the correct real-world shape for this pattern (e.g. a checkout
            bar pinned beneath a long product list) — unlike `side="top"`,
            which naturally starts unstuck at the very top of a page. */}
        <div style={{ height: "230vh" }} />
        <Affix
          {...args}
          onStickyChange={(isStuck) => {
            setStuck(isStuck);
            args.onStickyChange?.(isStuck);
          }}
        >
          <div data-testid="bottom-affix-header" style={{ padding: "1rem 1.5rem" }}>
            <Text weight="semibold">{stuck ? "Stuck!" : "Keep scrolling"}</Text>
          </div>
        </Affix>
      </div>
    );
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const header = canvas.getByTestId("bottom-affix-header");
    const affixRoot = header.parentElement as HTMLElement;

    // Stuck (pinned, visible at the bottom edge) from the very start,
    // given how much leading content precedes it — see the render
    // function's own comment for why that's correct here, unlike
    // `side="top"`.
    await waitFor(() => {
      expect(affixRoot).toHaveAttribute("data-stuck", "true");
    });
    await expect(args.onStickyChange).toHaveBeenCalledWith(true);

    // `data-stuck` alone isn't proof the element is actually visible,
    // pinned at the viewport's bottom edge — the same real, previously-
    // shipped bug already found for `side="top"` (drifting off-screen
    // instead of staying visible, see `ScrollInteraction` above) turned
    // out to affect this side too on the first version of this exact
    // test, before its own demo content was corrected to a realistic
    // shape (see the render function's own comment) — the original
    // geometry made the element appear to scroll away with the page
    // instead of staying pinned. Confirmed via `getBoundingClientRect()`,
    // not just the attribute — a couple of pixels' tolerance for real
    // sub-pixel browser rendering, not the same class of failure as the
    // original bug, which drifted hundreds of pixels off-screen.
    expect(
      Math.abs(affixRoot.getBoundingClientRect().bottom - window.innerHeight),
    ).toBeLessThan(3);

    // Scrolling further down (deeper into the leading content) still
    // keeps it pinned — proves it's genuinely stuck, not just coincidentally
    // positioned correctly at the initial scroll offset.
    window.scrollTo({ top: 1000 });
    await waitFor(() => {
      expect(
        Math.abs(affixRoot.getBoundingClientRect().bottom - window.innerHeight),
      ).toBeLessThan(3);
    });

    // Scrolling all the way to the end genuinely un-sticks it — the
    // element's own natural (end-of-content) position has now caught up
    // with the viewport, the mirror of `side="top"`'s own "scroll to 0"
    // un-stick case above.
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: maxScroll });
    await waitFor(() => {
      expect(affixRoot).not.toHaveAttribute("data-stuck");
    });
    await expect(args.onStickyChange).toHaveBeenLastCalledWith(false);

    // Real, previously-shipped bug (found via direct user report, not
    // caught by this test before this fix): scrolling back up from here
    // — genuinely re-entering the range where the element should
    // re-engage — silently never flipped `data-stuck` back to `true`.
    // Root cause was in `Affix.tsx` itself, not this story: `entry.
    // rootBounds` is reported in a different coordinate frame than
    // `entry.boundingClientRect` whenever this renders inside a nested
    // browsing context (confirmed via a real captured entry —
    // `rootBounds.bottom` matched the *outer* browser tab's height, not
    // this iframe's own; `rootBounds.top` never differs by frame, which
    // is why `side="top"`'s equivalent re-engage check never caught
    // this) — see `Affix.tsx`'s own comment on the fix for the full
    // root cause. This assertion is what would have caught it here.
    window.scrollTo({ top: maxScroll - 300 });
    await waitFor(() => {
      expect(affixRoot).toHaveAttribute("data-stuck", "true");
    });
    await expect(args.onStickyChange).toHaveBeenLastCalledWith(true);
    expect(
      Math.abs(affixRoot.getBoundingClientRect().bottom - window.innerHeight),
    ).toBeLessThan(3);

    window.scrollTo({ top: 0 });
  },
};

export const HorizontalScrollInteraction: Story = {
  name: "Interaction: axis=horizontal sticks to the leading edge while scrolling",
  // `axis="horizontal"` had never been exercised by any test before this
  // addition — direct user request, after confirming the real-world use
  // cases (a sticky lead column in a horizontally-scrolling comparison
  // table, a sticky lead card in a swiper). Uses `scrollContainerRef`
  // rather than page-level scroll, unlike the vertical interaction
  // stories above — page-level *horizontal* scroll is rare in practice,
  // so this demo models the realistic case directly (a dashboard-panel-
  // style horizontally scrolling row, same shape as `WithinScrollContainer`
  // but sideways) rather than the less common page-scroll one.
  argTypes: {
    axis: { control: false },
    edge: { control: false },
    offset: { control: false },
  },
  args: { axis: "horizontal" } satisfies Partial<AffixProps>,
  render: function HorizontalScrollInteractionStory(args) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [stuck, setStuck] = useState(false);
    return (
      <div style={{ padding: "var(--dbm-space-6)" }}>
        <Text style={{ marginBlockEnd: "var(--dbm-space-4)" }}>
          A comparison-table-style horizontally scrolling row — the lead
          column stays pinned to the left while the rest scroll underneath
          it. Scroll inside the box below.
        </Text>
        <div
          ref={containerRef}
          data-testid="horizontal-scroll-panel"
          role="region"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- same reasoning as `WithinScrollContainer` above: a scrollable, non-interactive region genuinely needs tabIndex to be keyboard-scrollable per WCAG 2.1.1, regardless of which axis it scrolls on.
          tabIndex={0}
          aria-label="Horizontally scrollable demo panel"
          style={{
            display: "flex",
            overflowX: "auto",
            border: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
            borderRadius: "var(--dbm-radius-md)",
          }}
        >
          <Affix
            {...args}
            scrollContainerRef={containerRef}
            onStickyChange={(isStuck) => {
              setStuck(isStuck);
              args.onStickyChange?.(isStuck);
            }}
          >
            <div
              data-testid="horizontal-affix-column"
              style={{
                width: "10rem",
                flexShrink: 0,
                padding: "0.75rem 1rem",
                background: "var(--dbm-bg-surface)",
                borderInlineEnd: stuck
                  ? "var(--dbm-border-width-2) solid var(--dbm-border-neutral)"
                  : "var(--dbm-border-width-1) solid var(--dbm-border-default)",
              }}
            >
              <Text weight="semibold">{stuck ? "Stuck!" : "Scroll right"}</Text>
            </div>
          </Affix>
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              style={{
                flex: "0 0 12rem",
                padding: "0.75rem 1rem",
                borderInlineEnd: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
              }}
            >
              <Text>Column {i + 1}.</Text>
            </div>
          ))}
        </div>
      </div>
    );
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const panel = canvas.getByTestId("horizontal-scroll-panel");
    const column = canvas.getByTestId("horizontal-affix-column");
    const affixRoot = column.parentElement as HTMLElement;

    await expect(affixRoot).not.toHaveAttribute("data-stuck");

    // Scrolling the panel itself (not the page) — same reasoning as
    // `WithinScrollContainer`, just on the inline axis instead of the
    // block one.
    panel.scrollLeft = 300;
    panel.dispatchEvent(new Event("scroll"));

    await waitFor(() => {
      expect(affixRoot).toHaveAttribute("data-stuck", "true");
    });
    await expect(args.onStickyChange).toHaveBeenCalledWith(true);

    // Same "data-stuck alone isn't proof of visual position" check
    // already established for the vertical axis (`ScrollInteraction`/
    // `BottomScrollInteraction` above) — confirmed via
    // `getBoundingClientRect()` against the panel's own left edge, with
    // the same few-pixels tolerance for the panel's own border-width.
    await waitFor(() => {
      expect(
        Math.abs(
          affixRoot.getBoundingClientRect().left - panel.getBoundingClientRect().left,
        ),
      ).toBeLessThan(3);
    });

    panel.scrollLeft = 0;
    panel.dispatchEvent(new Event("scroll"));

    await waitFor(() => {
      expect(affixRoot).not.toHaveAttribute("data-stuck");
    });
    await expect(args.onStickyChange).toHaveBeenLastCalledWith(false);
  },
};

export const HorizontalEndScrollInteraction: Story = {
  name: "Interaction: axis=horizontal edge=end sticks to the trailing edge while scrolling",
  // `axis="horizontal" edge="end"` — unlike the other three axis/edge
  // combinations, this one was only ever unit-tested (a fake
  // `IntersectionObserver` entry), never exercised by a real-browser
  // story — found and closed during a final review pass, matching the
  // same "every distinct sentinel/root ordering needs its own coverage"
  // reasoning `BottomScrollInteraction` was originally built for. Mirrors
  // that story's own shape on the inline axis instead of the block one:
  // genuinely *leading* content (not trailing) so it reads as stuck from
  // the first scroll pixel, via `scrollContainerRef` rather than page
  // scroll (page-level horizontal scroll is rare — same reasoning
  // `HorizontalScrollInteraction` above already uses).
  argTypes: {
    axis: { control: false },
    edge: { control: false },
    offset: { control: false },
  },
  args: { axis: "horizontal", edge: "end" } satisfies Partial<AffixProps>,
  render: function HorizontalEndScrollInteractionStory(args) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [stuck, setStuck] = useState(false);
    return (
      <div style={{ padding: "var(--dbm-space-6)" }}>
        <Text style={{ marginBlockEnd: "var(--dbm-space-4)" }}>
          The mirror of the leading-edge case above — this column stays
          pinned to the right while genuinely leading content scrolls past
          it, the horizontal counterpart of <code>edge=&quot;end&quot;</code>{" "}
          on the vertical axis. Scroll inside the box below.
        </Text>
        <div
          ref={containerRef}
          data-testid="horizontal-end-scroll-panel"
          role="region"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- same reasoning as the sibling horizontal story above: a scrollable, non-interactive region genuinely needs tabIndex to be keyboard-scrollable per WCAG 2.1.1.
          tabIndex={0}
          aria-label="Horizontally scrollable demo panel"
          style={{
            display: "flex",
            overflowX: "auto",
            border: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
            borderRadius: "var(--dbm-radius-md)",
          }}
        >
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              style={{
                flex: "0 0 12rem",
                padding: "0.75rem 1rem",
                borderInlineEnd: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
              }}
            >
              <Text>Column {i + 1}.</Text>
            </div>
          ))}
          <Affix
            {...args}
            scrollContainerRef={containerRef}
            onStickyChange={(isStuck) => {
              setStuck(isStuck);
              args.onStickyChange?.(isStuck);
            }}
          >
            <div
              data-testid="horizontal-end-affix-column"
              style={{
                width: "10rem",
                flexShrink: 0,
                padding: "0.75rem 1rem",
                background: "var(--dbm-bg-surface)",
                borderInlineStart: stuck
                  ? "var(--dbm-border-width-2) solid var(--dbm-border-neutral)"
                  : "var(--dbm-border-width-1) solid var(--dbm-border-default)",
              }}
            >
              <Text weight="semibold">{stuck ? "Stuck!" : "Scroll left"}</Text>
            </div>
          </Affix>
        </div>
      </div>
    );
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const panel = canvas.getByTestId("horizontal-end-scroll-panel");
    const column = canvas.getByTestId("horizontal-end-affix-column");
    const affixRoot = column.parentElement as HTMLElement;

    // Stuck (pinned, visible at the right edge) from the very start,
    // given how much leading content precedes it — mirrors
    // `BottomScrollInteraction`'s own reasoning on the other axis.
    await waitFor(() => {
      expect(affixRoot).toHaveAttribute("data-stuck", "true");
    });
    await expect(args.onStickyChange).toHaveBeenCalledWith(true);

    // Same "data-stuck alone isn't proof of visual position" check
    // already established elsewhere in this file.
    await waitFor(() => {
      expect(
        Math.abs(
          affixRoot.getBoundingClientRect().right - panel.getBoundingClientRect().right,
        ),
      ).toBeLessThan(3);
    });

    // Scrolling all the way to the end genuinely un-sticks it — the
    // mirror of `BottomScrollInteraction`'s own "scroll to the end"
    // un-stick case, on the inline axis instead of the block one.
    const maxScroll = panel.scrollWidth - panel.clientWidth;
    panel.scrollLeft = maxScroll;
    panel.dispatchEvent(new Event("scroll"));
    await waitFor(() => {
      expect(affixRoot).not.toHaveAttribute("data-stuck");
    });
    await expect(args.onStickyChange).toHaveBeenLastCalledWith(false);

    // Scrolling back into range re-engages it — the same cross-frame
    // `rootBounds` regression class already fixed for the vertical axis,
    // now covered here too.
    panel.scrollLeft = maxScroll - 200;
    panel.dispatchEvent(new Event("scroll"));
    await waitFor(() => {
      expect(affixRoot).toHaveAttribute("data-stuck", "true");
    });
    await expect(args.onStickyChange).toHaveBeenLastCalledWith(true);
    expect(
      Math.abs(affixRoot.getBoundingClientRect().right - panel.getBoundingClientRect().right),
    ).toBeLessThan(3);

    panel.scrollLeft = 0;
    panel.dispatchEvent(new Event("scroll"));
  },
};

