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
    // The Playground composes its own demo header bar around `side`/
    // `offset` (see below) rather than exposing raw JSX children as a text
    // control — a styled header bar isn't representable as a string, the
    // same reasoning Card-like demos elsewhere fix their own markup.
    children: {
      control: false,
      description: "The content to stick — a table header, filter bar, section nav, etc.",
    },
    side: { control: "select", options: ["top", "bottom"] },
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
    side: "top",
    offset: 0,
    onStickyChange: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof Affix>;

/**
 * Drive `side`/`offset` live via the Controls panel below, and scroll the
 * canvas to see it stick — `Affix.mdx` renders this story's Docs-page
 * preview via the custom `PlaygroundCanvas` block (not the standard
 * `<Canvas>`) specifically so both of those actually work together; see
 * that block's own doc comment for why `<Canvas>` alone can't do both at
 * once for a page-scroll-based sticky story like this one.
 */
export const Playground: Story = {
  render: function PlaygroundStory(args) {
    const [stuck, setStuck] = useState(false);
    // Real, previously-shipped bug (found via direct user report): the
    // unstuck label hardcoded "Scroll down" regardless of `side`, which
    // is backwards for `side="bottom"` — given this demo's leading-only
    // content (see the reordering below), `bottom` starts *already*
    // stuck and only un-sticks once scrolled past the end of the page,
    // so the direction that re-engages it is *up*, not down.
    const unstuckLabel = args.side === "bottom" ? "Scroll up" : "Scroll down";
    const header = (
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
          <Text weight="semibold">{stuck ? "Stuck!" : unstuckLabel}</Text>
        </div>
      </Affix>
    );
    const content = (
      <div style={{ padding: "var(--dbm-space-6)" }}>
        {Array.from({ length: 30 }, (_, i) => (
          <Text key={i} style={{ marginBlockEnd: "var(--dbm-space-4)" }}>
            Content line {i + 1}.
          </Text>
        ))}
      </div>
    );
    // Real, previously-shipped bug (found via direct user report):
    // content always came *after* the Affix regardless of `side`, which
    // only gives `side="top"` the room it needs — `bottom: 0` sticky is
    // the mirror case and needs substantial *leading* content before the
    // sticky element instead (confirmed while building the dedicated
    // `BottomScrollInteraction` story below; without it, the header just
    // scrolls away immediately with nothing to hold it, since it starts
    // at the very top of a container with no room below to be "caught"
    // at the bottom edge). No explicit height on the outer wrapper for
    // the same reason `BottomScrollInteraction` doesn't have one — a
    // declared height that doesn't match the actual (side-dependent)
    // content height reintroduces the exact containing-block mismatch
    // already fixed once on `Affix.tsx` itself; letting it auto-size to
    // whichever ordering is active avoids that.
    return (
      <div>
        {args.side === "bottom" ? (
          <>
            {content}
            {header}
          </>
        ) : (
          <>
            {header}
            {content}
          </>
        )}
      </div>
    );
  },
};

export const StickyHeader: Story = {
  name: "Sticky table-style header",
  // Same `.docs-story` containing-block issue as `Playground` above —
  // see that story's comment for the full root cause.
  parameters: { docs: { story: { inline: false, iframeHeight: 500 } } },
  // `side`/`offset` disabled — this is meant to stay *the* static,
  // fixed-default (`side="top"`) variant demo per its own name and the
  // Variants-gallery convention (`07-storybook-and-documentation-
  // standards.md` §4), same reasoning `ScrollInteraction`/
  // `BottomScrollInteraction` already disable them for. Left controllable
  // before this fix only because nothing had explicitly turned it off —
  // real, previously-shipped bug (found via direct user report): with
  // it enabled, switching to `side="bottom"` inherited the exact same
  // "content always trailing" layout issue `Playground` had before its
  // own fix, since this story's `render` never got the equivalent
  // conditional-reordering treatment. `Playground` is the intended place
  // to explore `side`/`offset` combinations; this one demonstrates one
  // fixed, correct configuration well rather than every configuration
  // adequately.
  argTypes: { side: { control: false }, offset: { control: false } },
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
  // `side`/`offset` now also disabled, alongside `children` — real,
  // previously-shipped bug (found via direct user report): left
  // controllable, `side="bottom"` inherited the same "content always
  // trailing the Affix" layout issue `Playground` had before its own
  // fix (this story's panel content `<div>` also only ever comes after
  // the header). `scrollContainerRef` is the one thing this story exists
  // to demonstrate; exploring `side`/`offset` combinations is
  // `Playground`'s job, not this one's.
  argTypes: { children: { control: false }, side: { control: false }, offset: { control: false } },
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
  argTypes: { side: { control: false }, offset: { control: false } },
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
  name: "Interaction: side=bottom sticks to the bottom edge while scrolling",
  // `side="bottom"` had never been exercised by any test before this
  // review — the sentinel/root reordering it drives (see Affix.tsx's own
  // `side === "top" ? ... : ...` branch) is a real, distinct code path,
  // not just a mirrored CSS value, so it needs its own coverage rather
  // than assuming symmetry with the `side="top"` case holds.
  argTypes: { side: { control: false }, offset: { control: false } },
  args: { side: "bottom" } satisfies Partial<AffixProps>,
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

