import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import type { ComponentPropsWithRef, ElementType, ReactElement } from "react";
import { responsiveStyle } from "../../utils/responsiveStyle";
import styles from "./Container.module.css";
import type { ContainerProps, ContainerSize } from "./Container.types";

type ContainerComponent = {
  <E extends ElementType = "div">(
    props: ContainerProps<E> & { ref?: ComponentPropsWithRef<E>["ref"] },
  ): ReactElement | null;
  displayName?: string;
};

// CSS module imports are typed via an index signature (see
// src/types/css-modules.d.ts), so noUncheckedIndexedAccess makes every
// lookup `string | undefined` even for known keys — cx() already accepts
// undefined, so this map is typed to match rather than asserted away.
const sizeClass: Record<ContainerSize, string | undefined> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
  "2xl": styles.size2xl,
  "3xl": styles.size3xl,
  full: styles.sizeFull,
};

const ContainerImpl = forwardRef<HTMLElement, ContainerProps<ElementType>>(function Container(
  { as, size = "xl", paddingInline = 4, className, style, ...props },
  ref,
) {
  const Component = as ?? "div";
  return (
    <Component
      ref={ref}
      // `Omit<ComponentPropsWithoutRef<ElementType>, ...>` can't resolve
      // cleanly for the fully-abstract `ElementType` this internal
      // implementation is instantiated with, which widens `size`'s
      // inferred type here (not at the public, concrete-`E` call site) —
      // safe to assert back to its real, narrow type.
      className={cx(styles.root, sizeClass[size as ContainerSize], className)}
      style={{
        ...responsiveStyle(
          paddingInline,
          "--container-padding",
          (value: number) => `var(--dbm-space-${value})`,
        ),
        ...style,
      }}
      {...props}
    />
  );
});

/**
 * Centers its children and constrains them to a max-width breakpoint step,
 * with token-driven horizontal padding. The standard top-level wrapper for
 * page/section content. Polymorphic via `as` — render as `<main>`,
 * `<section>`, or any other element/component while keeping Container's own
 * centering/constraint behavior (the same pattern `Box`, `Stack`, `Grid`,
 * and `GridItem` use) — useful here in particular, since a top-level page
 * wrapper often needs to be a real landmark element, not a generic `<div>`.
 *
 * `paddingInline` accepts a single spacing step or a mobile-first
 * responsive map keyed by breakpoint (e.g. `{ base: 4, lg: 8 }`), matching
 * the other layout primitives' responsive props — useful since a fixed
 * padding that feels right on mobile often reads as too tight on a wide,
 * `2xl`/`3xl`-sized container.
 *
 * @example
 * ```tsx
 * <Container as="main" size="lg" paddingInline={{ base: 4, lg: 8 }}>
 *   <PageContent />
 * </Container>
 * ```
 */
export const Container = ContainerImpl as ContainerComponent;

Container.displayName = "Container";
