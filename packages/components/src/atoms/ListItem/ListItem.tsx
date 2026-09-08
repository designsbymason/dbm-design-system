import { cx } from "@dbm-design-system/primitives";
import { forwardRef, useContext, useRef } from "react";
import type { KeyboardEvent, MouseEvent, SyntheticEvent } from "react";
import { Icon } from "../Icon";
import { ListMarkerContext } from "../../molecules/List/ListMarkerContext";
import styles from "./ListItem.module.css";
import type { ListItemProps } from "./ListItem.types";

/**
 * A single item within a `List`. Accepts an optional custom marker `icon`,
 * trailing content (`trailing`), and can become an interactive,
 * keyboard-activatable row (`interactive`) for nav-menu-style lists, with
 * `selected` and `disabled` states.
 *
 * @example
 * ```tsx
 * <List>
 *   <ListItem>First item</ListItem>
 *   <ListItem icon={CheckIcon}>Done</ListItem>
 *   <ListItem trailing={<Badge>3</Badge>}>Inbox</ListItem>
 * </List>
 * <List marker="none">
 *   <ListItem interactive selected onClick={goToCurrent}>Current page</ListItem>
 *   <ListItem interactive disabled onClick={goToOther}>Unavailable page</ListItem>
 * </List>
 * ```
 */
export const ListItem = forwardRef<HTMLLIElement, ListItemProps>(
  (
    {
      icon,
      interactive = false,
      selected = false,
      disabled = false,
      trailing,
      className,
      onKeyDown,
      onClick,
      children,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
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
    // Only a custom `icon` deliberately replacing the native bullet
    // suppresses it — `trailing` alone must not, so this is intentionally
    // narrower than `needsRowLayout` below.
    const suppressesMarker = !interactive && hidesOwnMarker;
    // Row layout (icon+text, or content alongside `trailing`) always lives
    // on an inner wrapper <span>, never the <li> itself: a list item only
    // generates its marker while its own computed `display` stays
    // `list-item`, and switching it to `flex` drops the marker outright —
    // `list-style` notwithstanding (confirmed empirically: a plain `<li
    // style="display:flex; list-style:disc">` renders no bullet at all).
    // Putting row layout on a wrapper instead keeps the <li>'s own display
    // untouched, so its marker survives whenever `trailing` is used without
    // also suppressing it via a custom `icon`.
    const needsRowLayout = suppressesMarker || Boolean(trailing);

    const hasWarnedSelectedWithoutInteractiveRef = useRef(false);
    const hasWarnedDisabledWithoutInteractiveRef = useRef(false);
    const hasWarnedNoAccessibleNameRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (selected && !interactive && !hasWarnedSelectedWithoutInteractiveRef.current) {
        hasWarnedSelectedWithoutInteractiveRef.current = true;
        console.warn(
          "ListItem: `selected` has no effect without `interactive` — there's no interactive surface for it to mark as current. Pass `interactive`, or remove `selected`.",
        );
      }
      if (disabled && !interactive && !hasWarnedDisabledWithoutInteractiveRef.current) {
        hasWarnedDisabledWithoutInteractiveRef.current = true;
        console.warn(
          "ListItem: `disabled` has no effect without `interactive` — there's no interactive surface for it to disable. Pass `interactive`, or remove `disabled`.",
        );
      }
      if (
        interactive &&
        !children &&
        !ariaLabel &&
        !ariaLabelledBy &&
        !hasWarnedNoAccessibleNameRef.current
      ) {
        hasWarnedNoAccessibleNameRef.current = true;
        console.warn(
          "ListItem: interactive item has no accessible name — pass visible text as `children`, or `aria-label`/`aria-labelledby` (e.g. for an icon-only nav item). Screen reader users won't know what this item does.",
        );
      }
    }

    // Interactive rows render their clickable/focusable surface as an
    // inner <span>, not the <li> itself: giving the <li> role="button"
    // fails WAI-ARIA's required-owned-elements check on its ancestor
    // `<ul role="list">` (confirmed with axe-core: aria-allowed-role +
    // aria-required-children — a real, measured violation, not a style
    // preference) — nesting the interactive element inside the <li>,
    // rather than repurposing the <li> itself, is the standard, accessible
    // way to build this pattern. `onClick`/`onKeyDown` are
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
    // Capture-phase, not bubble — must run before handleRowClick/
    // handleRowKeyDown (and before the Enter/Space-to-click bridging inside
    // the latter) so a disabled row blocks interaction outright rather than
    // only preventing a default action after the fact. Same reasoning as
    // Link's own onClickCapture fix (05-component-api-conventions.md §3),
    // extended to keydown too since this row's "activation" is entirely
    // this component's own bridging logic, not a native element's default
    // action.
    const handleDisabledGuardCapture = (event: SyntheticEvent) => {
      if (disabled) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const content = (
      <>
        {icon && <Icon icon={icon} size="sm" className={styles.icon} />}
        {children}
      </>
    );

    const mainContent = interactive ? (
      <span
        role="button"
        tabIndex={0}
        aria-current={selected ? "true" : undefined}
        aria-disabled={disabled || undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        onClick={handleRowClick}
        onKeyDown={handleRowKeyDown}
        onClickCapture={handleDisabledGuardCapture}
        onKeyDownCapture={handleDisabledGuardCapture}
        className={cx(styles.interactive, selected && styles.selected, disabled && styles.disabled)}
      >
        {content}
      </span>
    ) : (
      content
    );

    return (
      <li
        {...props}
        // Applied last (after `...props`) so none of these can be silently
        // overridden by a same-named prop the caller passes — including
        // `role`, which TypeScript's JSX checker permits on any component
        // regardless of whether it's declared in its prop type (confirmed
        // empirically: a caller-supplied `role` previously won over this
        // component's own computed `role="listitem"` fix, the same
        // ordering bug already fixed on Button/Skeleton/ProgressBar/etc.
        // — see `05-component-api-conventions.md` §3).
        ref={ref}
        role={role}
        onClick={interactive ? undefined : onClick}
        onKeyDown={interactive ? undefined : onKeyDown}
        aria-label={interactive ? undefined : ariaLabel}
        aria-labelledby={interactive ? undefined : ariaLabelledBy}
        className={cx(styles.root, suppressesMarker && styles.noMarker, className)}
      >
        {needsRowLayout ? (
          <span className={styles.row}>
            {mainContent}
            {trailing != null && <span className={styles.trailing}>{trailing}</span>}
          </span>
        ) : (
          mainContent
        )}
      </li>
    );
  },
);

ListItem.displayName = "ListItem";
