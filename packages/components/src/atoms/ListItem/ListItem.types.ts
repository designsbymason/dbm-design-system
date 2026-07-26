import type { Icon as PhosphorIcon } from "@dbm-design-system/icons";
import type { ComponentPropsWithoutRef } from "react";

export type ListItemProps = ComponentPropsWithoutRef<"li"> & {
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
   * when `interactive` is true.
   * @default false
   */
  selected?: boolean;
};
