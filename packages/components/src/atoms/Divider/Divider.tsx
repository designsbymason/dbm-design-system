import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import type { CSSProperties } from "react";
import { responsiveStyle } from "../../utils/responsiveStyle";
import styles from "./Divider.module.css";
import type { DividerOrientation, DividerProps } from "./Divider.types";
import { useResolvedOrientation } from "./useResolvedOrientation";

// A single orientation choice drives three CSS properties together
// (flex-direction, width, height) — see Divider.module.css for why.
function orientationStyle(value: DividerProps["orientation"]): CSSProperties {
  const toAxisValues = (orientation: DividerOrientation) =>
    orientation === "horizontal"
      ? { flexDirection: "row", width: "100%", height: "auto" }
      : { flexDirection: "column", width: "auto", height: "100%" };

  const flexDirection = responsiveStyle(value, "--divider-flex-direction", (o: DividerOrientation) =>
    toAxisValues(o).flexDirection,
  );
  const width = responsiveStyle(value, "--divider-width", (o: DividerOrientation) => toAxisValues(o).width);
  const height = responsiveStyle(value, "--divider-height", (o: DividerOrientation) => toAxisValues(o).height);
  return { ...flexDirection, ...width, ...height };
}

/**
 * A visual separator between content, horizontal or vertical, with an
 * optional centered label (e.g. `"OR"`). `orientation` accepts a single
 * value or a mobile-first responsive map keyed by breakpoint (e.g.
 * `{ base: "horizontal", lg: "vertical" }`) — the same "stack on mobile,
 * row on desktop" pattern `Stack`'s `direction` uses, applied to a
 * separator instead of a layout container. The divider's `aria-orientation`
 * stays in sync with the currently-active breakpoint via `matchMedia`,
 * since that's a static HTML attribute CSS alone can't drive responsively
 * (see `useResolvedOrientation`) — the *visual* orientation itself is
 * driven entirely by CSS and never depends on that JS timing.
 *
 * @example
 * ```tsx
 * <Divider />
 * <Divider orientation="vertical" />
 * <Divider label="OR" />
 * <Divider orientation={{ base: "horizontal", lg: "vertical" }} />
 * <Divider variant="dashed" />
 * ```
 */
export const Divider = forwardRef<HTMLDivElement, DividerProps>(
  ({ orientation = "horizontal", variant = "solid", label, className, style, ...props }, ref) => {
    const resolvedOrientation = useResolvedOrientation(orientation);
    const lineClassName =
      variant === "dashed"
        ? resolvedOrientation === "horizontal"
          ? styles.lineDashedHorizontal
          : styles.lineDashedVertical
        : styles.line;

    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation={resolvedOrientation}
        className={cx(styles.root, className)}
        style={{ ...orientationStyle(orientation), ...style }}
        {...props}
      >
        {label != null ? (
          <>
            <span className={lineClassName} />
            <span className={styles.label}>{label}</span>
            <span className={lineClassName} />
          </>
        ) : (
          <span className={lineClassName} />
        )}
      </div>
    );
  },
);

Divider.displayName = "Divider";
