import type { ComponentPropsWithoutRef, CSSProperties, ReactNode, Ref, UIEventHandler } from "react";

/**
 * Scrollbar track/thumb thickness, on the standard 5-step scale
 * (`05-component-api-conventions.md` §2) — never a component-specific
 * scale. Maps directly onto the existing spacing tokens (4/8/12/16/20px);
 * no dedicated component-layer token was needed.
 */
export type ScrollAreaSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * `"bordered"` (the default) draws an outer border and rounded corners
 * around the whole region — a self-contained scroll panel meant to stand on
 * its own. `"ghost"` removes the outer border/corners for embedding inside a
 * container that already provides its own boundary, e.g. a `Card` or a
 * `Popover`. Matches `Table`'s own `variant` vocabulary and default.
 */
export type ScrollAreaVariant = "bordered" | "ghost";

/**
 * Which scrollbar(s) are offered. `"vertical"` (the default) and
 * `"horizontal"` render one scrollbar and enable scrolling only along that
 * axis — content that overflows the *other* axis is clipped, not
 * scrollable, so choose `"both"` when content can genuinely overflow in
 * either direction (e.g. a wide, tall grid or code block).
 */
export type ScrollAreaScrollbars = "vertical" | "horizontal" | "both";

/**
 * When the scrollbar(s) are shown. `"hover"` (the default) shows them while
 * the pointer is over the region, fading out after `scrollHideDelay`.
 * `"scroll"` shows them only while actively scrolling, fading out the same
 * way. `"auto"` shows them whenever the content actually overflows,
 * permanently. `"always"` always shows them.
 */
export type ScrollAreaScrollbarVisibility = "auto" | "always" | "scroll" | "hover";

export interface ScrollAreaProps
  extends Omit<ComponentPropsWithoutRef<"div">, "dir" | "onScroll" | "children"> {
  /**
   * The content to make scrollable. Renders inside Radix ScrollArea's own
   * internal measuring wrapper (`display: table`, full width) — a direct
   * child relying on a percentage height (e.g. `height: "100%"`) may need
   * its own explicit height instead, the same caveat `Slider`'s vertical
   * orientation documents for a percentage height with no definite
   * ancestor.
   */
  children: ReactNode;
  /**
   * The region's own outer frame — a self-contained bordered panel, or a
   * borderless treatment for embedding inside an already-bordered
   * container.
   * @default 'bordered'
   */
  variant?: ScrollAreaVariant;
  /**
   * Scrollbar track/thumb thickness.
   * @default 'md'
   */
  size?: ScrollAreaSize;
  /**
   * Which scrollbar(s) to render, and which axis (or axes) actually scroll
   * — the other axis's overflow is clipped, not scrollable.
   * @default 'vertical'
   */
  scrollbars?: ScrollAreaScrollbars;
  /**
   * When the scrollbar(s) are visible. Purely a visual/interaction
   * preference — every value still allows scrolling by wheel, trackpad,
   * touch, or keyboard once the region is focused.
   * @default 'hover'
   */
  scrollbarVisibility?: ScrollAreaScrollbarVisibility;
  /**
   * How long, in milliseconds, a scrollbar stays visible after the pointer
   * leaves or scrolling stops before fading out. Only meaningful when
   * `scrollbarVisibility` is `"hover"` or `"scroll"` — ignored otherwise.
   * @default 600
   */
  scrollHideDelay?: number;
  /**
   * A shortcut for constraining the region's own block-axis size (applied
   * as `max-block-size`, so it respects a vertical writing mode) — the
   * region has no intrinsic height of its own, so without this (or an
   * equivalent `style`/`className` rule) it simply grows to fit its content
   * and never scrolls vertically. Merged with, and overridable by, `style`.
   */
  maxHeight?: CSSProperties["maxHeight"];
  /**
   * Text direction, passed to the underlying Radix primitive and defaulted
   * — not read from the page, matching `Slider`/`Tabs`/`Accordion`/
   * `RadioGroup`'s own convention. Radix positions the vertical scrollbar
   * and the corner on the correct side automatically; nothing else in this
   * component needs its own mirroring.
   * @default 'ltr'
   */
  dir?: "ltr" | "rtl";
  /**
   * Fires on the actual scrolling element (the internal viewport), not the
   * outer frame this component's other native props apply to — a plain
   * native `onScroll` passed the usual way would never fire, since the
   * outer frame itself never scrolls.
   */
  onScroll?: UIEventHandler<HTMLDivElement>;
  /**
   * A ref to the actual scrolling element, distinct from `ref` (which
   * forwards to the outer frame) — for imperative scrolling or measuring
   * (`scrollTo`, `scrollTop`, `scrollHeight`) that the outer frame can't
   * provide, since it never scrolls itself.
   */
  viewportRef?: Ref<HTMLDivElement>;
  /**
   * Accessible name for the scrollable region, announced by assistive tech
   * once the region is actually scrollable (a region that currently fits
   * its content isn't announced as one at all). Optional — most content is
   * already self-describing; set this when it isn't.
   */
  "aria-label"?: string;
  /**
   * Points to the `id` of an existing, already-visible element to use as
   * the accessible name instead of `aria-label`, once the region is
   * actually scrollable.
   */
  "aria-labelledby"?: string;
  /**
   * Standard DOM id, applied to the region's own outer frame — needed
   * whenever another element's `aria-labelledby`/`aria-describedby` must
   * point at it, or a test/router needs a stable anchor.
   */
  id?: string;
  /**
   * Additional CSS classes for customization. Applies to the region's own
   * outer frame — the box `variant`/`maxHeight` style — not the internal
   * scrolling viewport.
   */
  className?: string;
  /**
   * Inline styles, merged onto the component's own internal styles. Applies
   * to the region's own outer frame, matching `className`'s own target; set
   * an explicit height/`max-block-size` here (or use `maxHeight`) to make
   * vertical scrolling possible.
   */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute on the region's own outer frame; has no visual
   * or behavioral effect.
   */
  "data-testid"?: string;
}
