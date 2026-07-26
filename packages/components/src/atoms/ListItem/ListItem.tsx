import { cx } from "@dbm-design-system/primitives";
import { forwardRef, useContext } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { Icon } from "../Icon";
import { ListMarkerContext } from "../List/ListMarkerContext";
import styles from "./ListItem.module.css";
import type { ListItemProps } from "./ListItem.types";

/**
 * A single item within a `List`. Accepts an optional custom marker `icon`,
 * and can become an interactive, keyboard-activatable row (`interactive`)
 * for nav-menu-style lists, with an optional `selected` state.
 *
 * @example
 * ```tsx
 * <List>
 *   <ListItem>First item</ListItem>
 *   <ListItem icon={CheckIcon}>Done</ListItem>
 * </List>
 * <List marker="none">
 *   <ListItem interactive selected onClick={goToCurrent}>Current page</ListItem>
 *   <ListItem interactive onClick={goToOther}>Other page</ListItem>
 * </List>
 * ```
 */
export const ListItem = forwardRef<HTMLLIElement, ListItemProps>(
  (
    {
      icon,
      interactive = false,
      selected = false,
      className,
      onKeyDown,
      onClick,
      children,
      ...props
    },
    ref,
  ) => {
    const isAncestorMarkerless = useContext(ListMarkerContext);
    const hidesOwnMarker = Boolean(icon);
    // Same Safari/VoiceOver rationale as List's `role="list"` fix: a
    // non-interactive item loses its implicit "listitem" role whenever its
    // own marker is suppressed — whether inherited from the ancestor
    // `List` (`marker="none"`) or caused by this item's own `icon`.
    const role = !interactive && (isAncestorMarkerless || hidesOwnMarker) ? "listitem" : undefined;

    // Interactive rows render their clickable/focusable surface as an
    // inner <span>, not the <li> itself: giving the <li> role="button"
    // fails WAI-ARIA's required-owned-elements check on its ancestor
    // `<ul role="list">` (confirmed with axe-core: aria-allowed-role +
    // aria-required-children — a real, measured violation, not a style
    // preference). Real implementations of this exact pattern (e.g. MUI's
    // ListItemButton) do the same: nest the interactive element inside
    // the <li>, don't repurpose the <li> itself. `onClick`/`onKeyDown` are
    // typed for the <li> element `ListItem` normally renders as — the
    // casts below just re-target them to the inner <span>; the event
    // shape is otherwise identical.
    const handleRowClick = (event: MouseEvent<HTMLSpanElement>) => {
      onClick?.(event as unknown as MouseEvent<HTMLLIElement>);
    };
    const handleRowKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
      onKeyDown?.(event as unknown as KeyboardEvent<HTMLLIElement>);
      if (event.defaultPrevented) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.currentTarget.click();
      }
    };

    const content = (
      <>
        {icon && <Icon icon={icon} size="sm" className={styles.icon} />}
        {children}
      </>
    );

    return (
      <li
        ref={ref}
        role={role}
        onClick={interactive ? undefined : onClick}
        onKeyDown={interactive ? undefined : onKeyDown}
        className={cx(styles.root, !interactive && hidesOwnMarker && styles.hasIcon, className)}
        {...props}
      >
        {interactive ? (
          <span
            role="button"
            tabIndex={0}
            aria-current={selected ? "true" : undefined}
            onClick={handleRowClick}
            onKeyDown={handleRowKeyDown}
            className={cx(styles.interactive, selected && styles.selected)}
          >
            {content}
          </span>
        ) : (
          content
        )}
      </li>
    );
  },
);

ListItem.displayName = "ListItem";
