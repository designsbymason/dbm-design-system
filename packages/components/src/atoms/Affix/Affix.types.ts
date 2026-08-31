import type { SpaceValue } from "@dbm-design-system/primitives";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode, RefObject } from "react";

export type AffixSide = "top" | "bottom";

export interface AffixProps extends ComponentPropsWithoutRef<"div"> {
  /** The content to stick — a table header, filter bar, section nav, etc. */
  children: ReactNode;
  /**
   * Which edge to stick to.
   * @default 'top'
   */
  side?: AffixSide;
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
