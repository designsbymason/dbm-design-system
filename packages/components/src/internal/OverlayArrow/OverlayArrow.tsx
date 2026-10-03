import { forwardRef } from "react";
import type { SVGProps } from "react";
import styles from "./OverlayArrow.module.css";

/**
 * The pointer arrow on a floating surface (`Popover.Content`,
 * `HoverCard.Content`), drawn so it reads as one continuous edge with the
 * surface it points out of. Internal: not exported from the package.
 *
 * Render it as the child of a Radix `*.Arrow asChild`, which hands it the size,
 * `viewBox` and ref, so it forwards every prop and its ref to the `<svg>`. The
 * markup is custom rather than Radix's own single `<polygon>`: a filled
 * (unstroked) polygon for the shape, plus a separate *open* path (no closing
 * "Z" segment back to the start) for just the two exposed sides, so the base is
 * never drawn as a path segment at all — see the stylesheet for why.
 *
 * Colours come from the surface's own tokens (`bg.surface`, `border.default`),
 * so a surface that uses a different fill or border can't use it unchanged.
 */
export const OverlayArrow = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>((props, ref) => (
  <svg ref={ref} {...props}>
    <polygon points="0,0 30,0 15,10" className={styles.fill} />
    <path d="M0,0 L15,10 L30,0" className={styles.stroke} />
  </svg>
));
OverlayArrow.displayName = "OverlayArrow";
