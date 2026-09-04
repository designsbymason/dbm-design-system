import { ImageIcon } from "@dbm-design-system/icons";
import { cx } from "@dbm-design-system/primitives";
import { forwardRef, useRef, useState } from "react";
import { Icon } from "../Icon";
import styles from "./Image.module.css";
import type { ImageObjectPosition, ImageProps, ImageRadius } from "./Image.types";

const radiusClass: Record<ImageRadius, string | undefined> = {
  none: undefined,
  xs: styles.radiusXs,
  sm: styles.radiusSm,
  md: styles.radiusMd,
  lg: styles.radiusLg,
  xl: styles.radiusXl,
  "2xl": styles.radius2xl,
  "3xl": styles.radius3xl,
  full: styles.radiusFull,
};

const objectPositionValue: Record<ImageObjectPosition, string> = {
  center: "center",
  top: "top",
  bottom: "bottom",
  left: "left",
  right: "right",
  "top-left": "left top",
  "top-right": "right top",
  "bottom-left": "left bottom",
  "bottom-right": "right bottom",
};

/**
 * An image with lazy-loading by default, an optional locked aspect ratio,
 * and a `fallback` shown in place of the image when `src` is missing or
 * fails to load — a generic image icon on a `bg.neutral-subtle` background
 * by default, or pass `fallback` to override it with your own icon,
 * initials, or other content. `ref` forwards to the outer wrapper (stable
 * across the image/fallback swap); `id`/`className`/`style`/`data-testid`
 * apply there too, so they survive the fallback swap.
 *
 * `width`/`height`/`aspectRatio` size that same wrapper — pass any one of
 * them alone, any two together, or all three (see each prop's own JSDoc for
 * how they combine). `width`/`height` also stay on the `<img>` itself as
 * native attributes, same as any other passed-through native prop.
 *
 * @example
 * ```tsx
 * <Image src="/hero.jpg" alt="Product photo" aspectRatio={16 / 9} />
 * <Image src="/hero.jpg" alt="Product photo" width={320} aspectRatio={16 / 9} />
 * <Image src="/portrait.jpg" alt="Team member" aspectRatio={1} position="top" />
 * <Image src={brokenUrl} alt="Team member" radius="full" />
 * <Image src={brokenUrl} alt="Team member" fallback={<Icon icon={UserIcon} />} radius="full" />
 * ```
 */
export const Image = forwardRef<HTMLSpanElement, ImageProps>(
  (
    {
      src,
      alt,
      fallback,
      aspectRatio,
      objectFit = "cover",
      position = "center",
      radius = "none",
      loading = "lazy",
      onError,
      width,
      height,
      id,
      className,
      style,
      "data-testid": dataTestId,
      ...props
    },
    ref,
  ) => {
    const [failed, setFailed] = useState(false);
    // Resets the failure flag when `src` changes to a new URL, so a later
    // valid `src` isn't stuck showing the fallback forever because an
    // earlier, different URL once failed to load — same pattern as Avatar.
    const [prevSrc, setPrevSrc] = useState(src);
    if (src !== prevSrc) {
      setPrevSrc(src);
      setFailed(false);
    }
    const showFallback = failed || !src;
    const isDecorative = alt === "";

    const hasWarnedInvalidRatioRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (
        aspectRatio !== undefined &&
        (!Number.isFinite(aspectRatio) || aspectRatio <= 0) &&
        !hasWarnedInvalidRatioRef.current
      ) {
        hasWarnedInvalidRatioRef.current = true;
        console.warn(
          `Image: \`aspectRatio\` must be a positive, finite number — received ${aspectRatio}. The browser ignores an invalid CSS \`aspect-ratio\` value, so the box will fall back to its content's own intrinsic size instead of the intended ratio.`,
        );
      }
    }

    // `width`/`height` size the wrapper directly (see below) — CSS itself
    // already ignores `aspect-ratio` once both are definite, non-auto
    // values (it only ever fills in a *missing* dimension), so no
    // conditional logic is needed to pick a winner for rendering. Only
    // genuinely conflicting numeric values are worth a dev-mode warning —
    // a `width`/`height` pair that happens to already match `aspectRatio`
    // is redundant, not wrong, and warning about it would just be noise. A
    // string dimension (e.g. `"100%"`) can't be compared numerically at
    // all, so it's skipped rather than guessed at.
    const hasWarnedDimensionMismatchRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (
        typeof width === "number" &&
        typeof height === "number" &&
        height !== 0 &&
        aspectRatio !== undefined &&
        Number.isFinite(aspectRatio) &&
        aspectRatio > 0 &&
        !hasWarnedDimensionMismatchRef.current
      ) {
        const impliedRatio = width / height;
        if (Math.abs(impliedRatio - aspectRatio) > 0.01) {
          hasWarnedDimensionMismatchRef.current = true;
          console.warn(
            `Image: \`width\`/\`height\` (${width}/${height}, a ${impliedRatio.toFixed(2)}:1 ratio) conflicts with \`aspectRatio\` (${aspectRatio.toFixed(2)}:1) — \`width\`/\`height\` win, since both are already definite; \`aspectRatio\` is ignored (this is standard CSS \`aspect-ratio\` behavior, not Image-specific). Pass only one sizing mechanism, or make them consistent, to avoid this warning.`,
          );
        }
      }
    }

    return (
      <span
        ref={ref}
        id={id}
        data-testid={dataTestId}
        className={cx(styles.root, radiusClass[radius], className)}
        style={{ aspectRatio, width, height, ...style }}
      >
        {showFallback ? (
          <span
            className={styles.fallback}
            role={isDecorative ? undefined : "img"}
            aria-hidden={isDecorative ? true : undefined}
            aria-label={isDecorative ? undefined : alt}
          >
            {fallback ?? <Icon icon={ImageIcon} size="xl" />}
          </span>
        ) : (
          <img
            src={src}
            alt={alt}
            loading={loading}
            width={width}
            height={height}
            className={styles.image}
            style={{ objectFit, objectPosition: objectPositionValue[position] }}
            onError={(event) => {
              setFailed(true);
              onError?.(event);
            }}
            {...props}
          />
        )}
      </span>
    );
  },
);

Image.displayName = "Image";
