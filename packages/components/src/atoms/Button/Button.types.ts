import type { Icon as PhosphorIcon } from "@dbm-design-system/icons";
import type { ComponentPropsWithoutRef, CSSProperties } from "react";

export type ButtonVariant =
  "primary" | "secondary" | "tertiary" | "ghost" | "destructive";
export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  /**
   * Visual style, signaling emphasis/hierarchy.
   * @default 'primary'
   */
  variant?: ButtonVariant;
  /**
   * Controls padding, gap, and font-size together as one step on the
   * shared size scale.
   * @default 'md'
   */
  size?: ButtonSize;
  /** Leading icon — a component reference, not a string name. */
  leadingIcon?: PhosphorIcon;
  /** Trailing icon — a component reference, not a string name. */
  trailingIcon?: PhosphorIcon;
  /**
   * Shows a spinner in place of the leading icon (or before the label if
   * there is none), swaps in `loadingText`, and disables interaction while
   * `true`. When `asChild` is also set, the spinner and label swap don't
   * render at all — `Slot` always renders `children` directly, since it
   * requires exactly one child — so only dimmed styling and
   * `aria-disabled` (plus a blocked click handler, since the slotted
   * element can't take a native `disabled` attribute) signal the loading
   * state there.
   * @default false
   */
  isLoading?: boolean;
  /**
   * Text shown in place of `children` while `isLoading` is `true` — lets
   * the label reflect the in-progress action (e.g. "Saving…") without the
   * caller managing conditional children. Falls back to `children` when
   * omitted.
   */
  loadingText?: string;
  /**
   * Merge props onto the single child element instead of rendering a
   * `<button>` (via Radix `Slot`). Icons and the loading spinner are not
   * rendered in this mode, since `Slot` requires exactly one child.
   * @default false
   */
  asChild?: boolean;
  /**
   * Stretches the button to fill the width of its container.
   * @default false
   */
  fullWidth?: boolean;
  /**
   * The native button behavior: `submit` submits the nearest `<form>`,
   * `reset` resets it, `button` (the default) does neither. Only relevant
   * for a real `<button>` element — ignored in `asChild` mode, since the
   * slotted element supplies its own semantics.
   * @default 'button'
   */
  type?: "button" | "submit" | "reset";
  /**
   * Accessible label announced by assistive tech instead of the visible
   * `children`. Most buttons don't need this — visible text label content
   * already provides the accessible name — but it's required whenever the
   * button's meaning isn't fully conveyed by its visible label (e.g. an
   * icon-heavy button whose text is purely decorative, or to give a more
   * descriptive name than the visible label alone provides).
   */
  "aria-label"?: string;
  /**
   * Points to the `id` of an existing, already-visible element to use as
   * the accessible name instead — e.g. a heading the button sits next to
   * whose text already says what the button does. Use instead of
   * `aria-label` when that visible element's text is the better accessible
   * name; use `aria-label` when no such element exists.
   */
  "aria-labelledby"?: string;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * button, or when a test or router needs a stable anchor.
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
