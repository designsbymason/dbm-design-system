import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import styles from "./Icon.module.css";
import type { IconProps, IconSize, IconTone } from "./Icon.types";

const sizeClass: Record<IconSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
  "2xl": styles.size2xl,
  "3xl": styles.size3xl,
};

const toneClass: Record<IconTone, string | undefined> = {
  default: styles.toneDefault,
  secondary: styles.toneSecondary,
  brand: styles.toneBrand,
  disabled: styles.toneDisabled,
  danger: styles.toneDanger,
  warning: styles.toneWarning,
  success: styles.toneSuccess,
  info: styles.toneInfo,
  "on-brand": styles.toneOnBrand,
  "on-danger": styles.toneOnDanger,
  "on-warning": styles.toneOnWarning,
  "on-success": styles.toneOnSuccess,
  "on-info": styles.toneOnInfo,
  "on-neutral": styles.toneOnNeutral,
};

/**
 * Renders a Phosphor icon at a token-driven size. Decorative by default
 * (hidden from the accessibility tree); pass `label` when the icon conveys
 * meaning on its own. Inherits `currentColor` unless `tone` is set.
 *
 * @example
 * ```tsx
 * import { Wallet } from '@dbm-design-system/icons';
 * <Icon icon={Wallet} size="lg" />
 * <Icon icon={Wallet} label="Wallet balance" />
 * <Icon icon={Wallet} tone="brand" />
 * <Icon icon={Wallet} tone="on-brand" />
 * ```
 */
export const Icon = forwardRef<SVGSVGElement, IconProps>(
  (
    {
      icon: IconComponent,
      size = "md",
      weight = "regular",
      tone,
      label,
      className,
      ...props
    },
    ref,
  ) => (
    <IconComponent
      ref={ref}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      weight={weight}
      className={cx(
        styles.root,
        sizeClass[size],
        tone && toneClass[tone],
        className,
      )}
      {...props}
    />
  ),
);

Icon.displayName = "Icon";
