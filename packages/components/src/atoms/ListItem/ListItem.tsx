import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import styles from "./ListItem.module.css";
import type { ListItemProps } from "./ListItem.types";

/**
 * A single item within a `List`.
 *
 * @example
 * ```tsx
 * <List>
 *   <ListItem>First item</ListItem>
 * </List>
 * ```
 */
export const ListItem = forwardRef<HTMLLIElement, ListItemProps>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cx(styles.root, className)} {...props} />
  ),
);

ListItem.displayName = "ListItem";
