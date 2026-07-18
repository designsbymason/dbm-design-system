import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import type { ElementType } from "react";
import styles from "./List.module.css";
import type { ListMarker, ListProps } from "./List.types";

const defaultMarkerFor: Record<"ul" | "ol", ListMarker> = {
  ul: "disc",
  ol: "decimal",
};

const markerClass: Record<ListMarker, string | undefined> = {
  disc: styles.markerDisc,
  decimal: styles.markerDecimal,
  none: styles.markerNone,
};

/**
 * An ordered or unordered list with a token-driven vertical gap between
 * items and a configurable marker style. Use with `ListItem` for children.
 *
 * @example
 * ```tsx
 * <List as="ol" spacing={2}>
 *   <ListItem>First step</ListItem>
 *   <ListItem>Second step</ListItem>
 * </List>
 * ```
 */
export const List = forwardRef<HTMLUListElement | HTMLOListElement, ListProps>(
  ({ as = "ul", marker, spacing = 2, className, style, ...props }, ref) => {
    const Component = as as ElementType;
    const resolvedMarker = marker ?? defaultMarkerFor[as];
    return (
      <Component
        ref={ref}
        className={cx(styles.root, markerClass[resolvedMarker], className)}
        style={{ gap: `var(--dbm-space-${spacing})`, ...style }}
        {...props}
      />
    );
  },
);

List.displayName = "List";
