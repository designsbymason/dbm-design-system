import type { Icon as PhosphorIcon } from "@dbm-design-system/icons";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

/** Feedback-type coloring, kept separate from visual `variant` per this system's conventions. `brand` is the one non-status tone — the system's own identity color, matching Badge's own tone scale (which Tag otherwise mirrors) rather than a status. */
export type TagTone = "brand" | "neutral" | "info" | "success" | "warning" | "danger";
export type TagVariant = "subtle" | "solid" | "outline";
export type TagSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface TagProps extends ComponentPropsWithoutRef<"span"> {
  /**
   * Feedback-type coloring, independent of `variant`. `brand` is the
   * system's own identity color rather than a status.
   * @default 'neutral'
   */
  tone?: TagTone;
  /**
   * Low-emphasis subtle-background style, high-emphasis solid-fill, or
   * `outline` — a bordered style with no background of its own (one not
   * shared with Badge, whose own variant scale is subtle/solid only).
   * A selected `outline` tag converges toward `solid`'s own look — full
   * tone fill with on-color text — while keeping the same border it had
   * unselected, rather than an offset-halo ring, since its own border
   * already frames it.
   * @default 'subtle'
   */
  variant?: TagVariant;
  /**
   * Padding and font-size together as one step on the shared size
   * scale — also controls the leading icon's and remove button's own
   * sizing.
   * @default 'md'
   */
  size?: TagSize;
  /** Leading icon — a component reference, not a string name. */
  leadingIcon?: PhosphorIcon;
  /** Trailing icon — a component reference, not a string name. */
  trailingIcon?: PhosphorIcon;
  /**
   * Shows a trailing remove ("×") affordance, calling `onRemove` when
   * activated. Actually removing the tag (e.g. from a filter list) is the
   * caller's responsibility. Normally a real, independently focusable
   * button — but when the tag is *also* clickable/selectable (`onClick`,
   * `selected`, `defaultSelected`, or `onSelectedChange`), a second nested
   * focusable control would be an ARIA violation (confirmed via axe's
   * "nested-interactive" rule), so it renders as a decorative,
   * mouse-clickable-only glyph instead, with Delete/Backspace on the tag
   * itself (already focused, since interactive) as the keyboard path.
   * @default false
   */
  removable?: boolean;
  /**
   * Called when the remove button is clicked. Has no effect unless
   * `removable` is set.
   */
  onRemove?: () => void;
  /**
   * Accessible label for the remove button.
   * @default `Remove ${children}`
   */
  removeLabel?: string;
  /**
   * Called when the tag itself is clicked, or activated via Enter/Space
   * while focused. Passing this — or any of `selected`/`defaultSelected`/
   * `onSelectedChange` — makes the whole tag focusable and keyboard-
   * activatable (`role="button"`), not just visually clickable. Applies
   * no "active" visual treatment on its own; pair with `selected` for
   * that. Coexists with `removable`: clicking the remove button never
   * also triggers this.
   */
  onClick?: () => void;
  /**
   * Controlled selected/active state, for a toggleable filter-style tag —
   * pairs with `onSelectedChange`. Applies `aria-pressed` and a built-in
   * selected visual treatment, and (like `onClick`) makes the whole tag
   * focusable/keyboard-activatable. Omit both this and `defaultSelected`
   * for a tag with no toggle state at all.
   */
  selected?: boolean;
  /**
   * Initial selected state for uncontrolled usage — ignored once
   * `selected` is provided.
   * @default false
   */
  defaultSelected?: boolean;
  /**
   * Called with the next selected state whenever the tag is toggled
   * (click, or Enter/Space while focused). Required for `selected`
   * (controlled) to actually update; optional with `defaultSelected`
   * (uncontrolled), which tracks state internally regardless.
   */
  onSelectedChange?: (selected: boolean) => void;
  /** Tag content — usually a short label. */
  children?: ReactNode;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * tag.
   */
  id?: string;
  /**
   * Additional CSS classes for customization. Merged with the component's
   * own internal classes rather than replacing them.
   */
  className?: string;
  /**
   * Inline styles, merged onto the component's own internal styles.
   */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
