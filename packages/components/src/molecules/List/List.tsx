import { cx, responsiveStyle } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import type { ComponentPropsWithRef, ElementType, ReactElement } from "react";
import { ListMarkerContext } from "./ListMarkerContext";
import styles from "./List.module.css";
import type { ListElement, ListMarker, ListProps } from "./List.types";

type ListComponent = {
  <E extends ListElement = "ul">(
    props: ListProps<E> & { ref?: ComponentPropsWithRef<E>["ref"] },
  ): ReactElement | null;
  displayName?: string;
};

const defaultMarkerFor: Record<ListElement, ListMarker> = {
  ul: "disc",
  ol: "decimal",
};

const markerClass: Record<ListMarker, string | undefined> = {
  disc: styles.markerDisc,
  decimal: styles.markerDecimal,
  none: styles.markerNone,
};

const ListImpl = forwardRef<HTMLElement, ListProps<ListElement>>(function List(
  { as, marker, spacing = 2, className, style, ...props },
  ref,
) {
  // Same rationale as Text/Heading/Stack: `Omit<ComponentPropsWithoutRef<E>,
  // ...>` can't resolve cleanly for the fully-abstract `E` this internal
  // implementation is instantiated with, which widens `as`/`marker` here
  // (not at the public, concrete-`E` call site) — safe to assert back to
  // their real types. Casting to the broad ElementType separately
  // sidesteps a TS inference limit with union/generic JSX tags.
  const resolvedAs = (as ?? "ul") as ListElement;
  const Component = resolvedAs as ElementType;
  const resolvedMarker = (marker ?? defaultMarkerFor[resolvedAs]) as ListMarker;
  // Safari + VoiceOver (and historically other browser/AT combinations)
  // drop the implicit list/listitem role when list-style is none — role
  //="list" is the standard, documented fix for exactly this case.
  const isMarkerless = resolvedMarker === "none";

  return (
    <ListMarkerContext.Provider value={isMarkerless}>
      <Component
        ref={ref}
        role={isMarkerless ? "list" : undefined}
        className={cx(styles.root, markerClass[resolvedMarker], className)}
        style={{
          ...responsiveStyle(
            spacing,
            "--list-gap",
            (value: number) => `var(--dbm-space-${value})`,
          ),
          ...style,
        }}
        {...props}
      />
    </ListMarkerContext.Provider>
  );
});

/**
 * An ordered or unordered list with a token-driven vertical gap between
 * items and a configurable marker style. Use with `ListItem` for children.
 *
 * `spacing` accepts a single spacing step or a mobile-first responsive map
 * keyed by breakpoint, matching the other layout primitives' responsive
 * props.
 *
 * @example
 * ```tsx
 * <List as="ol" spacing={2}>
 *   <ListItem>First step</ListItem>
 *   <ListItem>Second step</ListItem>
 * </List>
 * <List as="ol" start={5} reversed>
 *   <ListItem>Counts down from 5</ListItem>
 * </List>
 * ```
 */
export const List = ListImpl as ListComponent;

List.displayName = "List";
