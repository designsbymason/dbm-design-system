import type { Icon as PhosphorIcon } from "@dbm-design-system/icons";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

export interface ListItemProps extends ComponentPropsWithoutRef<"li"> {
  /** The item's content. */
  children?: ReactNode;
  /**
   * A custom marker icon rendered in place of this item's default bullet —
   * a component reference, not a string name (matches `Button`'s `icon`
   * convention). The item's own marker is suppressed and the icon is
   * rendered decoratively before its content instead.
   * @example
   * ```tsx
   * import { CheckIcon } from '@dbm-design-system/icons';
   * <ListItem icon={CheckIcon}>Done</ListItem>
   * ```
   */
  icon?: PhosphorIcon;
  /**
   * Makes the item focusable and clickable — `role="button"`, keyboard
   * activatable (Enter/Space), with hover/focus-visible styling. Use for
   * nav-menu-style lists; leave unset for plain content lists.
   * @default false
   */
  interactive?: boolean;
  /**
   * Marks the item as the current selection within an interactive list —
   * applies `aria-current="true"` and selected styling. Only meaningful
   * when `interactive` is true (warns once in development if passed
   * without it).
   * @default false
   */
  selected?: boolean;
  /**
   * Disables an interactive item: applies `aria-disabled`, blocks
   * click/keyboard activation, and dims the visual treatment. Only
   * meaningful when `interactive` is true (warns once in development if
   * passed without it). The item stays focusable, per WAI-ARIA APG
   * guidance for `aria-disabled` — the interactive surface is a `<span
   * role="button">`, not a real `<button>`, so there's no native
   * `disabled` attribute to apply instead.
   * @default false
   */
  disabled?: boolean;
  /**
   * Trailing content — a count, an icon button, a switch — rendered at the
   * end of the item, pushed opposite the leading icon/content. Rendered as
   * a sibling of the item's own interactive surface, never nested inside
   * it, so a focusable element passed here (e.g. an `IconButton`) is its
   * own separate tab stop rather than an invalid control-inside-a-control.
   */
  trailing?: ReactNode;
  /**
   * Accessible name override for an interactive item with no readable text
   * content of its own (e.g. an icon-only nav item). Only applied when
   * `interactive` is true — a non-interactive `ListItem` isn't a control,
   * so there's nothing for it to name.
   */
  "aria-label"?: string;
  /**
   * References the id of an element that labels this item, as an
   * alternative to `aria-label`. Same `interactive`-only scope as
   * `aria-label`.
   */
  "aria-labelledby"?: string;
  /**
   * Native `<li>` `value` — overrides this specific item's ordinal number
   * within an ancestor `<ol>`. Has no effect within a `<ul>`.
   */
  value?: number;
  /**
   * Standard DOM id. Needed when another element's `aria-labelledby`/
   * `aria-describedby` must point at this component, or a test/router
   * needs a stable anchor.
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
