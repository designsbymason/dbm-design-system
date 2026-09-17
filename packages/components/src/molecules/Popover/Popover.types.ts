import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

export type PopoverSide = "top" | "right" | "bottom" | "left";
export type PopoverAlign = "start" | "center" | "end";

export interface PopoverProps {
  /** `Popover.Trigger` and `Popover.Content`. */
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
   * Called with the new open state whenever it changes — a trigger click,
   * an outside click/Escape dismissing it, or a controlled `open` update
   * confirming the value took effect.
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * When `true`, focus is trapped inside the content while open, the rest
   * of the page becomes `aria-hidden`, and clicking outside no longer
   * dismisses it through pointer interaction alone (Escape and an explicit
   * `Popover.Close` still work) — the same modal behavior `Dialog` uses.
   * Reach for this when the popover's own content is the only thing the
   * user should be able to interact with until they finish or dismiss it
   * (e.g. a form); leave it `false` (the default) for a lighter-weight
   * popover that coexists with the rest of the page, like a menu or an
   * info card.
   * @default false
   */
  modal?: boolean;
}

export interface PopoverTriggerProps
  extends Omit<ComponentPropsWithoutRef<"button">, "children"> {
  /**
   * Renders as a single provided child element (via Radix `Slot`
   * composition) instead of the built-in, unstyled native `<button>` —
   * matching this system's `asChild` convention elsewhere (`Button`,
   * `Tooltip`'s own `children`, `Select`'s own `trigger`/`asChild` pair).
   * Reach for this to use one of this system's own interactive components
   * (`Button`, `IconButton`) as the visible trigger, since the built-in
   * fallback brings no chrome of its own.
   * @default false
   */
  asChild?: boolean;
  /** The trigger's own content — a single element when `asChild` is set. */
  children?: ReactNode;
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

export interface PopoverContentProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** The popover's own content. */
  children?: ReactNode;
  /**
   * Which side of the trigger the content renders on. Radix repositions it
   * automatically to stay within the viewport if the requested side would
   * overflow.
   * @default 'bottom'
   */
  side?: PopoverSide;
  /**
   * Alignment along the chosen `side` — e.g. `side="bottom"` with
   * `align="start"` left-aligns the content under the trigger instead of
   * centering it, matching `Tooltip`'s/`Select`'s identical prop.
   * @default 'center'
   */
  align?: PopoverAlign;
  /**
   * Pixel gap between the trigger and the content along `side`.
   * @default 8
   */
  sideOffset?: number;
  /**
   * Pixel offset along `align`'s own axis — e.g. nudging an `align="start"`
   * content further past the trigger's own starting edge.
   * @default 0
   */
  alignOffset?: number;
  /**
   * Whether the content repositions itself (flips side, or shifts along
   * its alignment axis) to stay within the viewport instead of overflowing
   * it. Disable only when a fixed position relative to the trigger matters
   * more than staying fully visible.
   * @default true
   */
  avoidCollisions?: boolean;
  /**
   * Minimum distance, in pixels, kept between the content and the edge of
   * the viewport while repositioning to avoid a collision.
   * @default 8
   */
  collisionPadding?: number | Partial<Record<PopoverSide, number>>;
  /**
   * Hides the small pointer arrow connecting the content to its trigger.
   * @default false
   */
  hideArrow?: boolean;
  /**
   * Shows a `CloseButton` in the content's own top-end corner — an
   * explicit dismiss affordance in addition to the default outside-click/
   * Escape dismissal. Off by default, matching this system's own
   * "opt-in, not automatic" rule for `CloseButton` (see
   * `guidelines/adr/0008`) — turn it on for a popover whose content is
   * substantial enough (a form, a longer read) that a visible close
   * affordance helps, not for a small, quick info bubble.
   * @default false
   */
  showCloseButton?: boolean;
  /**
   * Renders the content into a different DOM node than `document.body`
   * (Radix's own default) — for a specific stacking-context or shadow-DOM
   * requirement. Leave unset for the common case.
   */
  container?: HTMLElement | null;
  /**
   * Accessible name for this `role="dialog"` element — required unless
   * `aria-labelledby` points at an already-visible heading inside the
   * content. Content with neither is invisible to screen reader users.
   */
  "aria-label"?: string;
  /**
   * Points to the `id` of an existing, already-visible element (e.g. a
   * heading inside the content) to use as the accessible name instead of
   * `aria-label` — use whichever one already exists rather than adding a
   * redundant second label.
   */
  "aria-labelledby"?: string;
  /**
   * Standard DOM id, applied to the content element. Also what the
   * trigger's own `aria-controls` points at while open.
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

export interface PopoverCloseProps
  extends Omit<ComponentPropsWithoutRef<"button">, "children"> {
  /**
   * Renders as a single provided child element (via Radix `Slot`
   * composition) instead of the built-in, unstyled native `<button>` —
   * for a custom dismiss control (e.g. a `Button` reading "Done") that
   * should still close the popover on click.
   * @default false
   */
  asChild?: boolean;
  /** The close control's own content — a single element when `asChild` is set. */
  children?: ReactNode;
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
