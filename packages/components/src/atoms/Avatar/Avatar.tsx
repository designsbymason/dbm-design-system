import { UserIcon } from "@dbm-design-system/icons";
import { cx } from "@dbm-design-system/primitives";
import { forwardRef, useState } from "react";
import { Icon } from "../Icon";
import type { IconSize } from "../Icon";
import styles from "./Avatar.module.css";
import type { AvatarProps, AvatarSize, AvatarStatus } from "./Avatar.types";

const sizeClass: Record<AvatarSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

// One step smaller than the avatar's own size, so the fallback icon sits
// with a visible inset instead of touching the circle's edges (initials
// text doesn't need this — its own font metrics already provide the
// inset).
const fallbackIconSizeFor: Record<AvatarSize, IconSize> = {
  xs: "xs",
  sm: "xs",
  md: "sm",
  lg: "md",
  xl: "lg",
};

const statusClass: Record<AvatarStatus, string | undefined> = {
  online: styles.statusOnline,
  offline: styles.statusOffline,
  busy: styles.statusBusy,
  away: styles.statusAway,
};

const statusLabel: Record<AvatarStatus, string> = {
  online: "Online",
  offline: "Offline",
  busy: "Busy",
  away: "Away",
};

/**
 * A person/entity avatar — renders an image, falling back to initials (and
 * falling back again to a generic person icon if there are no initials
 * either), with an optional presence status dot.
 *
 * @example
 * ```tsx
 * <Avatar src="/user.jpg" alt="Jane Doe" initials="JD" status="online" />
 * <Avatar alt="Jane Doe" shape="square" />
 * ```
 */
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
  (
    {
      src,
      alt,
      initials,
      size = "md",
      shape = "circle",
      status,
      className,
      ...props
    },
    ref,
  ) => {
    const [imageFailed, setImageFailed] = useState(false);
    // Resets the failure flag when `src` changes to a new URL, so a later
    // valid `src` isn't stuck showing the fallback forever because an
    // earlier, different URL once failed to load.
    const [prevSrc, setPrevSrc] = useState(src);
    if (src !== prevSrc) {
      setPrevSrc(src);
      setImageFailed(false);
    }
    const showImage = Boolean(src) && !imageFailed;
    // Only pair `role="img"` with `aria-label` when there's an actual name
    // to give it — an unlabeled `role="img"` wouldn't expose the visible
    // initials text as a fallback name (img-role elements aren't named
    // from their content), so omitting the role in that case preserves the
    // existing "read the initials themselves" behavior.
    const hasAccessibleName = !showImage && Boolean(alt);

    return (
      <span
        ref={ref}
        role={hasAccessibleName ? "img" : undefined}
        aria-label={hasAccessibleName ? alt : undefined}
        className={cx(
          styles.root,
          sizeClass[size],
          shape === "square" && styles.shapeSquare,
          className,
        )}
        {...props}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt ?? ""}
            className={styles.image}
            onError={() => setImageFailed(true)}
          />
        ) : initials ? (
          <span aria-hidden={alt ? true : undefined}>{initials}</span>
        ) : (
          <Icon icon={UserIcon} size={fallbackIconSizeFor[size]} />
        )}
        {status && (
          <span
            className={cx(styles.status, statusClass[status])}
            role="img"
            aria-label={statusLabel[status]}
          />
        )}
      </span>
    );
  },
);

Avatar.displayName = "Avatar";
