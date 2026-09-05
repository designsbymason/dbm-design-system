import type { ComponentPropsWithoutRef, CSSProperties, ReactElement, ReactNode } from "react";

export type TooltipSide = "top" | "right" | "bottom" | "left";
export type TooltipAlign = "start" | "center" | "end";

export interface TooltipProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children" | "content"> {
  /**
   * The tooltip's own content, rendered inside the portaled bubble shown on
   * hover/focus. Keep this short and non-interactive — Radix's own
   * `DismissableLayer` doesn't trap focus or accept pointer input inside
   * it, matching the WAI-ARIA tooltip pattern (a hint, not a popover).
   */
  content: ReactNode;
  /**
   * The trigger — a single element that accepts a ref (via Radix `Slot`
   * composition), matching this system's `asChild` convention elsewhere.
   * Must itself be focusable (a real `<button>`, a native form control, or
   * anything else that natively receives keyboard focus) for the tooltip
   * to be reachable without a pointer — `Tooltip` adds no `tabIndex` of
   * its own.
   */
  children: ReactElement;
  /**
   * Which side of the trigger the tooltip renders on. Radix repositions it
   * automatically to stay within the viewport if the requested side would
   * overflow.
   * @default 'top'
   */
  side?: TooltipSide;
  /**
   * Alignment along the chosen `side` — e.g. `side="top"` with
   * `align="start"` left-aligns the tooltip over the trigger instead of
   * centering it.
   * @default 'center'
   */
  align?: TooltipAlign;
  /**
   * Milliseconds the trigger must be hovered/focused before the tooltip
   * opens. Standalone (no ambient `TooltipProvider` in the tree — see that
   * component), this defaults to 400ms; nested inside one, leaving this
   * unset inherits its `delayDuration` instead, so every tooltip in that
   * subtree shares one timing unless it sets its own.
   * @default 400
   */
  delayDuration?: number;
  /**
   * When `true`, moving the pointer from the trigger toward the tooltip
   * content closes it immediately instead of leaving it open while the
   * pointer travels there. Same standalone-vs-`TooltipProvider`
   * inheritance as `delayDuration`.
   * @default false
   */
  disableHoverableContent?: boolean;
  /**
   * Hides the small pointer arrow connecting the tooltip to its trigger.
   * @default false
   */
  hideArrow?: boolean;
  /**
   * The controlled open state. Omit (along with `defaultOpen`) to manage
   * open state uncontrolled internally.
   */
  open?: boolean;
  /**
   * The initial open state for uncontrolled usage — ignored once `open` is
   * provided.
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Called with the new open state whenever it changes — a hover/focus
   * that opens or closes it, an Escape press, or a controlled `open`
   * update confirming the value took effect.
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * A plain-text accessible description used instead of the visible
   * `content` — Radix's own escape hatch for when `content` isn't
   * suitable as an accessible description on its own (rich/non-text
   * content, or a clearer standalone string). Setting this doesn't change
   * what's visually shown: the rendered bubble still displays `content`
   * as normal, but a separate visually-hidden element carrying this
   * string is what the trigger's `aria-describedby` actually points at
   * and what assistive technology announces, instead of `content`
   * itself. Leave unset for the common case (plain-text `content` that
   * already reads fine as a description).
   */
  "aria-label"?: string;
  /**
   * Standard DOM id, applied to the tooltip's content element (not the
   * trigger). Also what the trigger's own `aria-describedby` points at
   * while open — passing your own here keeps that reference stable and
   * predictable (e.g. for a test or router anchor) instead of Radix's
   * generated one.
   */
  id?: string;
  /**
   * Additional CSS classes for the tooltip's content element. Merged with
   * the component's own internal classes rather than replacing them.
   */
  className?: string;
  /**
   * Inline styles for the tooltip's content element, merged onto the
   * component's own internal styles.
   */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors), applied to the
   * tooltip's content element. Has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
