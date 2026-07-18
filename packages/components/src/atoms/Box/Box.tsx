import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import type { ComponentPropsWithRef, ElementType, ReactElement } from "react";
import styles from "./Box.module.css";
import type { BoxProps } from "./Box.types";

type BoxComponent = {
  <E extends ElementType = "div">(
    props: BoxProps<E> & { ref?: ComponentPropsWithRef<E>["ref"] },
  ): ReactElement | null;
  displayName?: string;
};

// React's forwardRef signature doesn't support a generic render function, so
// it's called here with concrete types and the polymorphic BoxComponent
// type is applied at the export boundary instead — the standard workaround
// for a typed polymorphic `as`-prop component.
const BoxImpl = forwardRef<HTMLElement, BoxProps<ElementType>>(function Box(
  { as, className, ...props },
  ref,
) {
  const Component = as ?? "div";
  return <Component ref={ref} className={cx(styles.root, className)} {...props} />;
});

/**
 * The base polymorphic primitive most other DBM components compose. Renders
 * a `div` by default; pass `as` to render any other element or component
 * while keeping full type-checking on that element's native props.
 *
 * @example
 * ```tsx
 * <Box as="section" className="custom">Content</Box>
 * <Box as="button" onClick={() => {}}>Click</Box>
 * ```
 */
export const Box = BoxImpl as BoxComponent;

Box.displayName = "Box";
