import { cx } from "@dbm-design-system/primitives";
import { forwardRef, useRef } from "react";
import styles from "./AspectRatio.module.css";
import type { AspectRatioProps } from "./AspectRatio.types";

/**
 * Locks its child content to a fixed width/height ratio, regardless of the
 * child's own intrinsic size — video embeds, map embeds, and image
 * placeholders all stretch to fill the box. `ref` forwards to the outer
 * element.
 *
 * @example
 * ```tsx
 * <AspectRatio ratio={16 / 9}>
 *   <img src="/hero.jpg" alt="Product photo" style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
 * </AspectRatio>
 * <AspectRatio ratio={1}>
 *   <iframe src="https://example.com/embed" title="Embed" />
 * </AspectRatio>
 * ```
 */
export const AspectRatio = forwardRef<HTMLDivElement, AspectRatioProps>(
  ({ ratio = 16 / 9, className, style, children, ...props }, ref) => {
    const hasWarnedInvalidRatioRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if ((!Number.isFinite(ratio) || ratio <= 0) && !hasWarnedInvalidRatioRef.current) {
        hasWarnedInvalidRatioRef.current = true;
        console.warn(
          `AspectRatio: \`ratio\` must be a positive, finite number — received ${ratio}. The browser ignores an invalid CSS \`aspect-ratio\` value, so the box will fall back to its content's own intrinsic size instead of the intended ratio.`,
        );
      }
    }

    return (
      <div
        ref={ref}
        className={cx(styles.root, className)}
        style={{ aspectRatio: ratio, ...style }}
        {...props}
      >
        <div className={styles.content}>{children}</div>
      </div>
    );
  },
);

AspectRatio.displayName = "AspectRatio";
