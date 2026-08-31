import type { SpaceValue } from "@dbm-design-system/primitives";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode, RefObject } from "react";

/**
 * Which scroll direction the sticky edge belongs to — `"vertical"` for the
 * page/panel's own up-down scroll (a sticky table header, filter bar), or
 * `"horizontal"` for a sideways-scrolling one (a sticky first column in a
 * comparison table, a sticky lead card in a swiper). `edge` then says
 * which side of that axis to stick to.
 * @default 'vertical'
 */
export type AffixAxis = "vertical" | "horizontal";

/**
 * Which edge of the axis to stick to, using logical (writing-direction-
 * aware) rather than physical naming — `"start"` is the top for
 * `axis="vertical"` and the leading inline edge (left in LTR, right in
 * RTL) for `axis="horizontal"`; `"end"` is the mirror of each. Horizontal
 * positioning uses the CSS logical properties `inset-inline-start`/
 * `inset-inline-end` under the hood specifically so it flips correctly
 * under `direction: rtl` without any extra prop — physical `left`/`right`
 * would silently stick to the wrong side in an RTL layout.
 * @default 'start'
 */
export type AffixEdge = "start" | "end";

export interface AffixProps extends ComponentPropsWithoutRef<"div"> {
  /** The content to stick — a table header, filter bar, section nav, etc. */
  children: ReactNode;
  /**
   * Which scroll direction this sticks within.
   * @default 'vertical'
   */
  axis?: AffixAxis;
  /**
   * Which edge of that axis to stick to.
   * @default 'start'
   */
  edge?: AffixEdge;
  /**
   * Distance from that edge before it sticks, from the spacing token scale.
   * @default 0
   */
  offset?: SpaceValue;
  /**
   * The scrollable container to detect stuck state against, if not the
   * page/viewport itself — e.g. a modal body or dashboard panel with its
   * own internal scroll. `position: sticky` itself already works
   * correctly against any scrolling ancestor with no configuration
   * needed; this only affects the `IntersectionObserver` used to detect
   * *when* it's stuck (`data-stuck`/`onStickyChange`), which otherwise
   * measures against the viewport and won't correlate correctly with a
   * nested scroll container's own scroll position.
   */
  scrollContainerRef?: RefObject<HTMLElement | null>;
  /**
   * Called whenever the stuck state changes. Also reflected on the
   * rendered element as `data-stuck`, so purely presentational reactions
   * (e.g. a shadow once stuck) can be done in CSS without this callback.
   */
  onStickyChange?: (stuck: boolean) => void;
  /**
   * Standard DOM id. Useful when another element's
   * `aria-labelledby`/`aria-describedby` needs to point at this element,
   * or when a test or router needs a stable anchor.
   */
  id?: string;
  /**
   * Additional CSS classes for customization. Merged with the component's
   * own internal classes rather than replacing them.
   */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
