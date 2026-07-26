import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import { CloseButton } from "../CloseButton";
import { Icon } from "../Icon";
import styles from "./Tag.module.css";
import type { TagProps, TagSize, TagTone, TagVariant } from "./Tag.types";

const classFor: Record<TagVariant, Record<TagTone, string | undefined>> = {
  subtle: {
    neutral: styles.subtleNeutral,
    info: styles.subtleInfo,
    success: styles.subtleSuccess,
    warning: styles.subtleWarning,
    danger: styles.subtleDanger,
  },
  solid: {
    neutral: styles.solidNeutral,
    info: styles.solidInfo,
    success: styles.solidSuccess,
    warning: styles.solidWarning,
    danger: styles.solidDanger,
  },
};

const sizeClass: Record<TagSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const iconSizeForTagSize: Record<TagSize, "xs" | "sm"> = {
  xs: "xs",
  sm: "xs",
  md: "xs",
  lg: "sm",
  xl: "sm",
};

const removeSizeForTagSize: Record<TagSize, "xs" | "sm"> = {
  xs: "xs",
  sm: "xs",
  md: "xs",
  lg: "xs",
  xl: "sm",
};

/**
 * A labeled pill for categorization or active filters, with an optional
 * leading icon and an optional removable ("×") affordance. Shares `Badge`'s
 * tone/variant scale but at larger, touch-friendly sizes suited to
 * interactive contexts like filter bars.
 *
 * @example
 * ```tsx
 * <Tag tone="info">Design</Tag>
 * <Tag icon={TagIcon} tone="success" variant="solid">Shipped</Tag>
 * <Tag removable onRemove={() => removeFilter('status')}>Status: Active</Tag>
 * ```
 */
export const Tag = forwardRef<HTMLSpanElement, TagProps>(
  (
    {
      tone = "neutral",
      variant = "subtle",
      size = "md",
      icon,
      removable = false,
      onRemove,
      removeLabel,
      className,
      children,
      ...props
    },
    ref,
  ) => (
    <span
      ref={ref}
      className={cx(
        styles.root,
        classFor[variant][tone],
        sizeClass[size],
        className,
      )}
      {...props}
    >
      {icon && <Icon icon={icon} size={iconSizeForTagSize[size]} />}
      {children}
      {removable && (
        <CloseButton
          aria-label={removeLabel ?? `Remove ${children?.toString() ?? ""}`}
          size={removeSizeForTagSize[size]}
          className={styles.remove}
          onClick={onRemove}
        />
      )}
    </span>
  ),
);

Tag.displayName = "Tag";
