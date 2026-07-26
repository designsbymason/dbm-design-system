import { cx } from "@dbm-design-system/primitives";
import { forwardRef, useState } from "react";
import styles from "./Image.module.css";
import type { ImageProps, ImageRadius } from "./Image.types";

const radiusClass: Record<ImageRadius, string | undefined> = {
  none: undefined,
  xs: styles.radiusXs,
  sm: styles.radiusSm,
  md: styles.radiusMd,
  lg: styles.radiusLg,
  xl: styles.radiusXl,
  "2xl": styles.radius2xl,
  full: styles.radiusFull,
};

/**
 * An image with lazy-loading by default, an optional locked aspect ratio,
 * and a `fallback` shown in place of the image when `src` is missing or
 * fails to load. `ref` forwards to the outer wrapper (stable across the
 * image/fallback swap); `className`/`style` apply there too.
 *
 * @example
 * ```tsx
 * <Image src="/hero.jpg" alt="Product photo" aspectRatio={16 / 9} />
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
      radius = "none",
      loading = "lazy",
      className,
      style,
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

    return (
      <span
        ref={ref}
        className={cx(styles.root, radiusClass[radius], className)}
        style={{ aspectRatio, ...style }}
      >
        {showFallback ? (
          <span className={styles.fallback} role="img" aria-label={alt}>
            {fallback}
          </span>
        ) : (
          <img
            src={src}
            alt={alt}
            loading={loading}
            className={styles.image}
            style={{ objectFit }}
            onError={() => setFailed(true)}
            {...props}
          />
        )}
      </span>
    );
  },
);

Image.displayName = "Image";
