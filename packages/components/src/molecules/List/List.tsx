import { cx, responsiveStyle } from "@dbm-design-system/primitives";
import { forwardRef, useRef } from "react";
import type { ComponentPropsWithRef, ElementType, ReactElement } from "react";
import { ListMarkerContext } from "./ListMarkerContext";
import styles from "./List.module.css";
import type { ListElement, ListMarker, ListOrderedType, ListProps } from "./List.types";

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

// CSS `list-style-type` always takes precedence over the native `<ol
// type="...">` HTML attribute when both are present (found live 2026-09-13:
// `type="A"` reached the DOM correctly as a real attribute, but rendered as
// plain digits regardless, since `markerClass.decimal`'s own
// `list-style-type: decimal` was unconditionally overriding it) — `type`
// only has any visible effect at all when translated into its CSS
// counterpart and applied the same way `marker` already is, not left to the
// native attribute alone.
const TYPE_TO_LIST_STYLE: Record<ListOrderedType, string> = {
  "1": "decimal",
  a: "lower-alpha",
  A: "upper-alpha",
  i: "lower-roman",
  I: "upper-roman",
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

  const hasWarnedOlPropsOnUlRef = useRef(false);
  if (process.env.NODE_ENV !== "production") {
    // `reversed === true` (not `"reversed" in props`) — a caller explicitly
    // passing `reversed={false}` (e.g. a Playground/Storybook control's own
    // default arg) is a no-op matching the attribute's own natural default,
    // not a real ol-only usage worth warning about.
    const hasOlOnlyProps =
      props.start !== undefined ||
      props.reversed === true ||
      props.type !== undefined;
    if (resolvedAs !== "ol" && hasOlOnlyProps && !hasWarnedOlPropsOnUlRef.current) {
      hasWarnedOlPropsOnUlRef.current = true;
      console.warn(
        'List: `start`/`reversed`/`type` have no effect without `as="ol"` — the browser silently ignores them on a `ul`. Pass `as="ol"`, or remove them.',
      );
    }
  }

  return (
    <ListMarkerContext.Provider value={isMarkerless}>
      <Component
        // `{...props}` spread first so none of the attributes below can be
        // silently overridden by a same-named prop the caller passes —
        // including `role`, which TypeScript's JSX checker permits on any
        // component regardless of whether it's declared in its prop type
        // (found and fixed 2026-09-13: this was previously spread *last*,
        // letting a stray consumer-supplied `role` silently win over this
        // component's own computed `role="list"` fix — the same ordering
        // bug already fixed on Button/Skeleton/ProgressBar/FieldError/etc.,
        // see `05-component-api-conventions.md` §3).
        {...props}
        ref={ref}
        role={isMarkerless ? "list" : undefined}
        className={cx(styles.root, markerClass[resolvedMarker], className)}
        style={{
          ...responsiveStyle(
            spacing,
            "--list-gap",
            (value: number) => `var(--dbm-space-${value})`,
          ),
          ...(props.type !== undefined && resolvedMarker === "decimal"
            ? { listStyleType: TYPE_TO_LIST_STYLE[props.type] }
            : {}),
          ...style,
        }}
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
