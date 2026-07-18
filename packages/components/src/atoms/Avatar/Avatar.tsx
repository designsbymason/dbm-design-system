import { cx } from "@dbm-design-system/primitives";
import { forwardRef, useState } from "react";
import styles from "./Avatar.module.css";
import type { AvatarProps, AvatarSize, AvatarStatus } from "./Avatar.types";

const sizeClass: Record<AvatarSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
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
 * falling back again to initials if the image fails to load), with an
 * optional presence status dot.
 *
 * @example
 * ```tsx
 * <Avatar src="/user.jpg" alt="Jane Doe" initials="JD" status="online" />
 * ```
 */
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
  ({ src, alt, initials, size = "md", status, className, ...props }, ref) => {
    const [imageFailed, setImageFailed] = useState(false);
    const showImage = Boolean(src) && !imageFailed;

    return (
      <span
        ref={ref}
        // When falling back to initials, the root carries the accessible
        // name (so a screen reader announces "Jane Doe", not "J D") and the
        // initials text itself is hidden as redundant. The <img> case
        // already gets its accessible name from its own `alt`.
        aria-label={!showImage ? alt : undefined}
        className={cx(styles.root, sizeClass[size], className)}
        {...props}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt ?? ""}
            className={styles.image}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span aria-hidden={alt ? true : undefined}>{initials}</span>
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
