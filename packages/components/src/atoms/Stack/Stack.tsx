import { cx } from "@dbm-design-system/primitives";
import { Children, cloneElement, forwardRef, isValidElement, Fragment } from "react";
import type { ComponentPropsWithRef, ElementType, ReactElement, ReactNode } from "react";
import { responsiveStyle } from "../../utils/responsiveStyle";
import styles from "./Stack.module.css";
import type { StackAlign, StackJustify, StackProps } from "./Stack.types";

type StackComponent = {
  <E extends ElementType = "div">(
    props: StackProps<E> & { ref?: ComponentPropsWithRef<E>["ref"] },
  ): ReactElement | null;
  displayName?: string;
};

const ALIGN_ITEMS: Record<StackAlign, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
  baseline: "baseline",
};

const JUSTIFY_CONTENT: Record<StackJustify, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
  around: "space-around",
  evenly: "space-evenly",
};

// Interleaves `divider` between every child, cloning it (with a fresh key)
// at each insertion point rather than reusing one element reference.
function withDividers(children: ReactNode, divider: ReactNode): ReactNode {
  const items = Children.toArray(children);
  return items.flatMap((child, index) => {
    if (index === 0) return [child];
    const key = `divider-${index}`;
    const dividerNode = isValidElement(divider) ? (
      cloneElement(divider, { key })
    ) : (
      <Fragment key={key}>{divider}</Fragment>
    );
    return [dividerNode, child];
  });
}

const StackImpl = forwardRef<HTMLElement, StackProps<ElementType>>(function Stack(
  {
    as,
    direction = "column",
    gap = 0,
    align = "stretch",
    justify = "start",
    wrap = false,
    divider,
    className,
    style,
    children,
    ...props
  },
  ref,
) {
  const Component = as ?? "div";
  return (
    <Component
      ref={ref}
      className={cx(styles.root, className)}
      style={{
        ...responsiveStyle(direction, "--stack-direction", (value: string) => value),
        ...responsiveStyle(align, "--stack-align", (value: StackAlign) => ALIGN_ITEMS[value]),
        ...responsiveStyle(
          justify,
          "--stack-justify",
          (value: StackJustify) => JUSTIFY_CONTENT[value],
        ),
        ...responsiveStyle(wrap, "--stack-wrap", (value: boolean) => (value ? "wrap" : "nowrap")),
        ...responsiveStyle(gap, "--stack-gap", (value: number) => `var(--dbm-space-${value})`),
        ...style,
      }}
      {...props}
    >
      {divider ? withDividers(children, divider) : children}
    </Component>
  );
});

/**
 * A flex layout primitive for stacking children vertically or horizontally
 * with a consistent, token-driven gap. Polymorphic via `as` — render as a
 * `<ul>`, `<nav>`, or any other element/component while keeping Stack's own
 * flex-layout behavior (the same pattern `Box` uses).
 *
 * `direction`, `align`, `justify`, `wrap`, and `gap` each accept a single
 * value or a mobile-first responsive map keyed by breakpoint (e.g.
 * `{ base: "column", md: "row" }`), matching `Grid`'s `columns` prop — the
 * standard way to express "stack on mobile, row on desktop" (or re-justify,
 * re-align, wrap, or re-space at any breakpoint).
 *
 * `divider` automatically inserts the given element between every child
 * (typically a `Divider`), so consumers don't have to hand-interleave one
 * themselves.
 *
 * @example
 * ```tsx
 * <Stack direction={{ base: "column", md: "row" }} gap={4} align="center" divider={<Divider />}>
 *   <Icon />
 *   <Text>Label</Text>
 * </Stack>
 * ```
 */
export const Stack = StackImpl as StackComponent;

Stack.displayName = "Stack";
