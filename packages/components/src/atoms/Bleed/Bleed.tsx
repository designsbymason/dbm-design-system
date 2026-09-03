import { cx, responsiveStyle } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import styles from "./Bleed.module.css";
import type { BleedProps, BleedSide } from "./Bleed.types";

// CSS module imports are typed via an index signature (see
// src/types/css-modules.d.ts), so noUncheckedIndexedAccess makes every
// lookup `string | undefined` even for known keys — cx() already accepts
// undefined, so this map is typed to match rather than asserted away.
// Matches Container's identical `sizeClass` pattern.
const sideClass: Record<BleedSide, string | undefined> = {
  inline: styles.sideInline,
  block: styles.sideBlock,
  all: styles.sideAll,
};

/**
 * Breaks its children out of a parent's padding via a negative margin —
 * e.g. a full-width image inside an otherwise-padded article body. `inset`
 * accepts a single spacing step or a mobile-first responsive map keyed by
 * breakpoint, matching `Container`'s own `paddingInline` — the prop this is
 * most often counteracting, which supports the identical responsive shape.
 * `ref` forwards to the outer element.
 *
 * @example
 * ```tsx
 * <Container paddingInline={{ base: 4, lg: 8 }}>
 *   <Text>Padded article copy.</Text>
 *   <Bleed inset={{ base: 4, lg: 8 }}>
 *     <img src="/hero.jpg" alt="Full-width photo" style={{ width: '100%' }} />
 *   </Bleed>
 * </Container>
 * ```
 */
export const Bleed = forwardRef<HTMLDivElement, BleedProps>(
  ({ inset, side = "inline", className, style, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cx(styles.root, sideClass[side], className)}
      style={{
        ...responsiveStyle(
          inset,
          "--bleed-inset",
          (value: number) => `var(--dbm-space-${value})`,
        ),
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  ),
);

Bleed.displayName = "Bleed";
