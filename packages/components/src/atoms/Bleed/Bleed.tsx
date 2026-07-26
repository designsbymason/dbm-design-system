import { forwardRef } from "react";
import type { CSSProperties } from "react";
import type { BleedProps } from "./Bleed.types";

/**
 * Breaks its children out of a parent's padding via a negative margin —
 * e.g. a full-width image inside an otherwise-padded article body. Purely
 * an inline-style transform (a negative `margin-inline`/`margin-block`/
 * `margin`), so it renders no static classes and has no CSS module.
 *
 * @example
 * ```tsx
 * <Container style={{ paddingInline: 'var(--dbm-space-6)' }}>
 *   <Text>Padded article copy.</Text>
 *   <Bleed inset={6}>
 *     <img src="/hero.jpg" alt="Full-width photo" style={{ width: '100%' }} />
 *   </Bleed>
 * </Container>
 * ```
 */
export const Bleed = forwardRef<HTMLDivElement, BleedProps>(
  ({ inset, side = "inline", style, children, ...props }, ref) => {
    const value = `calc(var(--dbm-space-${inset}) * -1)`;
    // Logical longhands, not the `margin`/`marginInline`/`marginBlock`
    // shorthands — jsdom's test environment doesn't reliably resolve
    // `calc(var())` through the shorthand parser (same issue documented in
    // IconButton.module.css for `padding`).
    const bleedStyle: CSSProperties =
      side === "all"
        ? {
            marginBlockStart: value,
            marginBlockEnd: value,
            marginInlineStart: value,
            marginInlineEnd: value,
          }
        : side === "inline"
          ? { marginInlineStart: value, marginInlineEnd: value }
          : { marginBlockStart: value, marginBlockEnd: value };

    return (
      <div ref={ref} style={{ ...bleedStyle, ...style }} {...props}>
        {children}
      </div>
    );
  },
);

Bleed.displayName = "Bleed";
