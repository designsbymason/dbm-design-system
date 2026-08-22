import { XIcon } from "@dbm-design-system/icons";
import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import { Icon } from "../Icon";
import styles from "./CloseButton.module.css";
import type { CloseButtonProps, CloseButtonSize } from "./CloseButton.types";

const sizeClass: Record<CloseButtonSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const iconSizeForCloseButtonSize: Record<CloseButtonSize, "xs" | "sm" | "md"> = {
  xs: "xs",
  sm: "xs",
  md: "xs",
  lg: "sm",
  xl: "md",
};

/**
 * A dedicated dismiss control — a small, circular, icon-only button
 * defaulting to `aria-label="Close"` (override for context, e.g. "Remove
 * tag"). Unlike `IconButton`, its icon color always inherits `currentColor`
 * from context instead of a fixed token, so it reads correctly whether
 * it's sitting in a `Tag`, an `Alert`, a `Toast`, or a `Dialog` header —
 * each with a different text color.
 *
 * @example
 * ```tsx
 * <CloseButton onClick={() => setOpen(false)} />
 * <CloseButton size="sm" aria-label="Remove tag" onClick={onRemove} />
 * <CloseButton size="md" iconSize="md" aria-label="Remove tag" onClick={onRemove} />
 * ```
 */
export const CloseButton = forwardRef<HTMLButtonElement, CloseButtonProps>(
  (
    {
      size = "md",
      iconSize,
      className,
      type = "button",
      "aria-label": ariaLabel,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      aria-label={ariaLabel ?? "Close"}
      className={cx(styles.root, sizeClass[size], className)}
      {...props}
    >
      <Icon icon={XIcon} size={iconSize ?? iconSizeForCloseButtonSize[size]} />
    </button>
  ),
);

CloseButton.displayName = "CloseButton";
