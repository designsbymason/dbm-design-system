import type * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import type { Responsive } from "@dbm-design-system/primitives";
import type { ComponentPropsWithoutRef, CSSProperties, HTMLAttributeAnchorTarget, ReactNode } from "react";

type HoverCardPrimitiveContentProps = ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>;

export type HoverCardSide = "top" | "right" | "bottom" | "left";
export type HoverCardAlign = "start" | "center" | "end";
export type HoverCardSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface HoverCardProps {
  /** `HoverCard.Trigger` and `HoverCard.Content`. */
  children?: ReactNode;
  /** The controlled open state. Omit (along with `defaultOpen`) to manage open state uncontrolled internally. */
  open?: boolean;
  /**
   * The initial open state for uncontrolled usage — ignored once `open` is
   * provided.
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Called with the new open state whenever it changes — the pointer or
   * keyboard focus arriving at the trigger (after `openDelay`), leaving it
   * (after `closeDelay`), or Escape dismissing it.
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Milliseconds the pointer or keyboard focus must stay on the trigger
   * before the card opens — long enough that sweeping the pointer across a
   * page of links doesn't flash a card for each one. Inside a
   * `HoverCardProvider` the default comes from it, and a card opens at once
   * while another is open or has just closed.
   * @default 300
   */
  openDelay?: number;
  /**
   * Milliseconds the card stays open after the pointer or focus leaves the
   * trigger and the card — the grace period that lets the pointer cross the
   * gap from the trigger onto the card without closing it. Inside a
   * `HoverCardProvider` the default comes from it.
   * @default 300
   */
  closeDelay?: number;
  /**
   * Turns the card off: it never opens, and one that is open closes. The
   * trigger stays a working link. Use it for a row that doesn't need a
   * preview right now (already selected, still loading) without unmounting
   * the card or controlling `open` yourself.
   * @default false
   */
  disabled?: boolean;
}

export interface HoverCardTriggerProps extends Omit<ComponentPropsWithoutRef<"a">, "children"> {
  /**
   * Renders as a single provided child element (via Radix `Slot`
   * composition) instead of the built-in `<a>` — reach for this to use this
   * system's own `Link` (or `Avatar` with `as="a"`) as the visible trigger,
   * since the built-in fallback brings almost no chrome of its own.
   * @default false
   */
  asChild?: boolean;
  /** The trigger's own content — a single element when `asChild` is set. */
  children?: ReactNode;
  /**
   * Where the link goes. A trigger with no `href` (and no `tabIndex`) is not
   * keyboard-focusable, so a keyboard user could never open the card — and
   * the card's content is a preview of what the link leads to, so a trigger
   * should always lead somewhere.
   */
  href?: string;
  /**
   * Where to open the link — `"_blank"` for a new tab. When opening in a new
   * tab, also set `rel="noreferrer"` (or `"noopener"`).
   */
  target?: HTMLAttributeAnchorTarget;
  /**
   * The link's relationship to the destination (`"noreferrer"`,
   * `"noopener"`, `"nofollow"`…). Required alongside `target="_blank"` for a
   * link to a page you don't control.
   */
  rel?: string;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * trigger, or when a test or router needs a stable anchor.
   */
  id?: string;
  /** Additional CSS classes for customization. */
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

export interface HoverCardContentProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** The card's own content — a short preview, never the only way to reach anything. */
  children?: ReactNode;
  /**
   * The padding step around the content, on the standard scale
   * (`xs`…`xl` = 8, 12, 16, 20, 24px). A `HoverCard.Media` bleeds out to the
   * card's edges whatever the step.
   * @default 'md'
   */
  size?: HoverCardSize;
  /**
   * Which side of the trigger the content renders on. Radix repositions it
   * automatically to stay within the viewport if the requested side would
   * overflow — but only within the same axis (`left`↔`right`,
   * `top`↔`bottom`), never across them. Pass a mobile-first responsive map
   * instead of a single value (e.g. `{ base: "bottom", lg: "right" }`) to
   * switch axes deliberately at a chosen breakpoint.
   * @default 'top'
   */
  side?: Responsive<HoverCardSide>;
  /**
   * Alignment along the chosen `side` — e.g. `side="top"` with
   * `align="start"` left-aligns the content under the trigger instead of
   * centering it.
   * @default 'center'
   */
  align?: HoverCardAlign;
  /**
   * Pixel gap between the trigger and the content along `side`. A
   * transparent bridge, as long as the gap, is part of the card, so the
   * pointer can cross it onto the card without the card closing, whatever
   * the offset.
   * @default 8
   */
  sideOffset?: number;
  /**
   * Pixel offset along `align`'s own axis.
   * @default 0
   */
  alignOffset?: number;
  /**
   * Whether the content repositions itself (flips side, or shifts along
   * its alignment axis) to stay within the viewport instead of overflowing
   * it.
   * @default true
   */
  avoidCollisions?: boolean;
  /**
   * Minimum distance, in pixels, kept between the content and the edge of
   * the viewport while repositioning to avoid a collision.
   * @default 8
   */
  collisionPadding?: number | Partial<Record<HoverCardSide, number>>;
  /**
   * Element(s) to use as the collision boundary instead of the viewport —
   * e.g. a scrollable container the card should stay within.
   * @default []
   */
  collisionBoundary?: HoverCardPrimitiveContentProps["collisionBoundary"];
  /**
   * Hides the content entirely when its trigger is fully scrolled out of
   * view (clipped by an ancestor) instead of leaving it floating in a
   * now-meaningless position.
   * @default false
   */
  hideWhenDetached?: HoverCardPrimitiveContentProps["hideWhenDetached"];
  /**
   * Hides the small pointer arrow connecting the content to its trigger.
   * @default false
   */
  hideArrow?: boolean;
  /**
   * Renders the content into a different DOM node than `document.body`
   * (Radix's own default) — for a specific stacking-context or shadow-DOM
   * requirement. Leave unset for the common case.
   */
  container?: HTMLElement | null;
  /**
   * Called when Escape is pressed while open. Call `event.preventDefault()`
   * inside to keep the card open instead of the default dismissal.
   */
  onEscapeKeyDown?: HoverCardPrimitiveContentProps["onEscapeKeyDown"];
  /**
   * Called on a pointer-down outside the content. Call
   * `event.preventDefault()` inside to keep the card open instead of the
   * default dismissal.
   */
  onPointerDownOutside?: HoverCardPrimitiveContentProps["onPointerDownOutside"];
  /**
   * Called when focus moves outside the content. The card ignores a focus
   * move on its own (it closes when the trigger loses focus instead), so
   * this is for observing it.
   */
  onFocusOutside?: HoverCardPrimitiveContentProps["onFocusOutside"];
  /**
   * Called on any interaction outside the content — a pointer-down or a
   * focus move. Call `event.preventDefault()` inside to keep the card open
   * instead of the default dismissal. Fires alongside
   * `onPointerDownOutside`/`onFocusOutside`, not instead of them.
   */
  onInteractOutside?: HoverCardPrimitiveContentProps["onInteractOutside"];
  /**
   * Standard DOM id, applied to the content element.
   */
  id?: string;
  /** Additional CSS classes for customization. */
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

export interface HoverCardMediaProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /**
   * An image or video that fills the card's width — `<img>`, `<video>` or a
   * DBM `Image`. It is laid out as a block, full width, and clipped to the
   * card's rounded top corners.
   */
  children?: ReactNode;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * element, or when a test or router needs a stable anchor.
   */
  id?: string;
  /** Additional CSS classes for customization. */
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
