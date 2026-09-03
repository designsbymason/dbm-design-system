import { cx, responsiveStyle } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import styles from "./Divider.module.css";
import type {
  DividerOrientation,
  DividerProps,
  DividerThickness,
  DividerTone,
} from "./Divider.types";
import { useResolvedOrientation } from "./useResolvedOrientation";

const THICKNESS_TOKEN: Record<DividerThickness, string> = {
  thin: "var(--dbm-border-width-1)",
  regular: "var(--dbm-border-width-2)",
  thick: "var(--dbm-border-width-4)",
};

const TONE_TOKEN: Record<DividerTone, string> = {
  default: "var(--dbm-border-default)",
  brand: "var(--dbm-border-brand)",
  info: "var(--dbm-border-info)",
  success: "var(--dbm-border-success)",
  warning: "var(--dbm-border-warning)",
  danger: "var(--dbm-border-danger)",
};

// One step up the scale, capped at "thick" — `thickness` is the baseline
// weight (what both lines render at when `emphasis` is "none", and what the
// non-emphasized line stays at otherwise); the emphasized line in a
// "double" variant steps up from that baseline instead of a fixed absolute
// weight, so the pairing scales together as `thickness` changes.
const THICKNESS_STEP_UP: Record<DividerThickness, string> = {
  thin: THICKNESS_TOKEN.regular,
  regular: THICKNESS_TOKEN.thick,
  thick: THICKNESS_TOKEN.thick,
};

// A single orientation choice drives three CSS properties together
// (flex-direction, width, height) — see Divider.module.css for why.
function orientationStyle(value: DividerProps["orientation"]): CSSProperties {
  const toAxisValues = (orientation: DividerOrientation) =>
    orientation === "horizontal"
      ? { flexDirection: "row", width: "100%", height: "auto" }
      : { flexDirection: "column", width: "auto", height: "100%" };

  const flexDirection = responsiveStyle(
    value,
    "--divider-flex-direction",
    (o: DividerOrientation) => toAxisValues(o).flexDirection,
  );
  const width = responsiveStyle(
    value,
    "--divider-width",
    (o: DividerOrientation) => toAxisValues(o).width,
  );
  const height = responsiveStyle(
    value,
    "--divider-height",
    (o: DividerOrientation) => toAxisValues(o).height,
  );
  return { ...flexDirection, ...width, ...height };
}

/**
 * A visual separator between content, horizontal or vertical, with an
 * optional label (e.g. `"OR"`) positioned via `align`. `orientation`
 * accepts a single value or a mobile-first responsive map keyed by
 * breakpoint (e.g. `{ base: "horizontal", lg: "vertical" }`) — the same
 * "stack on mobile, row on desktop" pattern `Stack`'s `direction` uses,
 * applied to a separator instead of a layout container. The divider's
 * `aria-orientation` stays in sync with the currently-active breakpoint via
 * `matchMedia`, since that's a static HTML attribute CSS alone can't drive
 * responsively (see `useResolvedOrientation`) — the *visual* orientation
 * itself is driven entirely by CSS and never depends on that JS timing.
 * When `label` is a plain string, it doubles as the accessible name
 * automatically (override via `aria-label` if needed).
 *
 * @example
 * ```tsx
 * <Divider />
 * <Divider orientation="vertical" />
 * <Divider label="OR" />
 * <Divider label="Section 2" align="start" />
 * <Divider orientation={{ base: "horizontal", lg: "vertical" }} />
 * <Divider variant="dashed" />
 * <Divider variant="dotted" />
 * <Divider variant="double" />
 * <Divider variant="double" emphasis="start" />
 * <Divider thickness="thick" />
 * <Divider tone="danger" />
 * ```
 */
export const Divider = forwardRef<HTMLDivElement, DividerProps>(
  (
    {
      orientation = "horizontal",
      variant = "solid",
      thickness = "thin",
      emphasis = "none",
      tone = "default",
      align = "center",
      label,
      className,
      style,
      "aria-label": ariaLabel,
      ...props
    },
    ref,
  ) => {
    const resolvedOrientation = useResolvedOrientation(orientation);
    const lineClassName =
      variant === "dashed"
        ? resolvedOrientation === "horizontal"
          ? styles.lineDashedHorizontal
          : styles.lineDashedVertical
        : variant === "dotted"
          ? resolvedOrientation === "horizontal"
            ? styles.lineDottedHorizontal
            : styles.lineDottedVertical
          : styles.line;

    // `solid`/`dashed`/`dotted` all render as one element — `.line` sets
    // both height/width and background (only one of height/width is ever
    // the cross axis, depending on orientation; flex-grow takes over the
    // other, main-axis one regardless), while `dashed`/`dotted` set only
    // the one logical border-width/border-color property their own CSS
    // class already scopes a border to (the border's *style* — dashed vs
    // dotted — stays in the CSS class; only width and color are overridden
    // here).
    const primaryThickness = THICKNESS_TOKEN[thickness];
    const toneColor = TONE_TOKEN[tone];
    const singleLineStyle: CSSProperties =
      variant === "solid"
        ? {
            height: primaryThickness,
            width: primaryThickness,
            backgroundColor: toneColor,
          }
        : resolvedOrientation === "horizontal"
          ? {
              borderBlockEndWidth: primaryThickness,
              borderBlockEndColor: toneColor,
            }
          : {
              borderInlineEndWidth: primaryThickness,
              borderInlineEndColor: toneColor,
            };

    // `double`'s two bars: `emphasis` picks which one (if either) steps up
    // one level from `thickness`; the other stays at the `thickness`
    // baseline.
    const emphasizedThickness = THICKNESS_STEP_UP[thickness];
    const startBarThickness =
      emphasis === "start" ? emphasizedThickness : primaryThickness;
    const endBarThickness =
      emphasis === "end" ? emphasizedThickness : primaryThickness;
    const doubleGroupClassName =
      resolvedOrientation === "horizontal"
        ? styles.doubleGroupHorizontal
        : styles.doubleGroupVertical;
    const doubleBarClassName =
      resolvedOrientation === "horizontal"
        ? styles.doubleBarHorizontal
        : styles.doubleBarVertical;
    const doubleBarStyle = (thicknessValue: string): CSSProperties => ({
      ...(resolvedOrientation === "horizontal"
        ? { height: thicknessValue }
        : { width: thicknessValue }),
      backgroundColor: toneColor,
    });

    const renderLine = (short: boolean): ReactNode => {
      const shortClass = short ? styles.lineShort : undefined;
      if (variant === "double") {
        return (
          <span className={cx(doubleGroupClassName, shortClass)}>
            <span
              className={doubleBarClassName}
              style={doubleBarStyle(startBarThickness)}
            />
            <span
              className={doubleBarClassName}
              style={doubleBarStyle(endBarThickness)}
            />
          </span>
        );
      }
      return (
        <span
          className={cx(lineClassName, shortClass)}
          style={singleLineStyle}
        />
      );
    };

    // An empty string or a boolean counts as "no label" — matches what
    // React itself does for those values (renders nothing), so a
    // conditional `label={condition && "OR"}` or a cleared Storybook text
    // control doesn't leave a labeled-but-invisible gap between the two
    // line segments.
    const hasLabel =
      label != null && label !== "" && typeof label !== "boolean";
    const leadingShort = hasLabel && align === "start";
    const trailingShort = hasLabel && align === "end";
    // `||`, not `??` — an empty string is treated as "not set" so the
    // label-derived fallback still applies (matches Avatar's own precedent
    // for the same explicit-override-vs-computed-fallback shape).
    const resolvedAriaLabel =
      ariaLabel ||
      (typeof label === "string" && label !== "" ? label : undefined);

    return (
      <div
        ref={ref}
        className={cx(styles.root, className)}
        style={{ ...orientationStyle(orientation), ...style }}
        {...props}
        role="separator"
        aria-orientation={resolvedOrientation}
        aria-label={resolvedAriaLabel}
      >
        {hasLabel ? (
          <>
            {renderLine(leadingShort)}
            <span className={styles.label}>{label}</span>
            {renderLine(trailingShort)}
          </>
        ) : (
          renderLine(false)
        )}
      </div>
    );
  },
);

Divider.displayName = "Divider";
