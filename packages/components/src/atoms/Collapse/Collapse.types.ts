import type { ComponentPropsWithoutRef, CSSProperties, ReactElement, ReactNode } from "react";

/**
 * Which dimension the content region expands/collapses along — matches
 * `Indicators`' own `orientation` convention (`"horizontal" | "vertical"`).
 * `"vertical"` (the default) animates `height`, for the common disclosure
 * case (an FAQ answer, a details panel). `"horizontal"` animates `width`,
 * for a region that grows/shrinks sideways (a collapsible sidebar/rail) —
 * only actually reads as a "collapse" when its container is laid out so
 * the element doesn't get stretched back to full width regardless (a flex
 * row, or an explicit `inline-block` context); see Best practices.
 */
export type CollapseOrientation = "horizontal" | "vertical";

export interface CollapseProps extends ComponentPropsWithoutRef<"div"> {
  /**
   * The controlled open state. Omit (along with `defaultOpen`) to manage
   * open state uncontrolled internally — matches the same controlled/
   * uncontrolled pattern every other stateful component in this system
   * follows (`Switch`, `Select`, …), mirroring Radix's own convention
   * since this wraps Radix `Collapsible` directly.
   */
  open?: boolean;
  /**
   * The initial open state for uncontrolled usage — ignored once `open`
   * is provided. Has no effect in controlled usage.
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Called with the new open state whenever it changes — whether from the
   * built-in `trigger` being activated, or (in controlled usage) confirms
   * the value the consumer's own `open` state should update to. Radix's
   * own callback shape; note this reports the *next* value, not the event.
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Blocks the built-in `trigger` from toggling `open` — has no effect
   * without one (there's nothing else in this component to disable): if
   * `open`/`defaultOpen` drive visibility externally with no `trigger`,
   * toggling still happens wherever the consumer's own external control
   * lives, unaffected by this prop. Warns once in development when set
   * without a `trigger`, the same class of dev-mode warning as `Tag`'s own
   * unpaired-prop check (`06-engineering-standards.md` §9).
   * @default false
   */
  disabled?: boolean;
  /**
   * An optional trigger element rendered above the content, toggling
   * `open` when activated (via Radix `Slot` composition, matching this
   * system's `asChild` convention). Omit to drive `open` entirely
   * externally — e.g. `Accordion`'s own trigger UI, which uses `Collapse`
   * only for its animated content region. Mutually exclusive with
   * `asChild` (see that prop) — combining both would give the root element
   * two children where Radix's own `Slot` requires exactly one, so
   * `trigger` wins and `asChild` is ignored, with a dev-mode warning.
   */
  trigger?: ReactElement;
  /**
   * Which dimension the content region expands/collapses along.
   * @default 'vertical'
   */
  orientation?: CollapseOrientation;
  /**
   * Renders the collapsible root behavior onto `children` directly (via
   * Radix `Slot`) instead of wrapping it in its own `<div>` — the same
   * composability need `Affix` already established `asChild` for: a
   * consumer-provided host element that can't have an extra wrapper
   * around it (a `<li>` in a list of collapsible items, where a `<div>`
   * ancestor would be invalid between the `<ul>` and its `<li>`
   * children). Only meaningful without `trigger` — see that prop.
   * @default false
   */
  asChild?: boolean;
  /** The content to reveal/hide. */
  children: ReactNode;
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
