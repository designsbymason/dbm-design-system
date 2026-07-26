import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import type { ComponentPropsWithRef, ElementType, ReactElement } from "react";
import styles from "./Center.module.css";
import type { CenterProps } from "./Center.types";

type CenterComponent = {
  <E extends ElementType = "div">(
    props: CenterProps<E> & { ref?: ComponentPropsWithRef<E>["ref"] },
  ): ReactElement | null;
  displayName?: string;
};

// See the identical pattern/comment in Box — the standard workaround for a
// typed polymorphic `as`-prop component with forwardRef.
const CenterImpl = forwardRef<HTMLElement, CenterProps<ElementType>>(
  function Center({ as, inline = false, className, ...props }, ref) {
    const Component = as ?? "div";
    return (
      <Component
        ref={ref}
        className={cx(styles.root, inline && styles.inline, className)}
        {...props}
      />
    );
  },
);

/**
 * Centers its children on both axes (a thin `flex`/`align-items: center`/
 * `justify-content: center` wrapper). Renders a `div` by default; pass
 * `as` for any other element or component.
 *
 * @example
 * ```tsx
 * <Center style={{ height: '100vh' }}>
 *   <Spinner label="Loading" />
 * </Center>
 * <Center as="span" inline>{badge}</Center>
 * ```
 */
export const Center = CenterImpl as CenterComponent;

Center.displayName = "Center";
