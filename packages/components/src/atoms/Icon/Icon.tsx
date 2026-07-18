import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import styles from "./Icon.module.css";
import type { IconProps, IconSize } from "./Icon.types";

const sizeClass: Record<IconSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
  "2xl": styles.size2xl,
  "3xl": styles.size3xl,
};

/**
 * Renders a Phosphor icon at a token-driven size. Decorative by default
 * (hidden from the accessibility tree); pass `label` when the icon conveys
 * meaning on its own.
 *
 * @example
 * ```tsx
 * import { Wallet } from '@dbm-design-system/icons';
 * <Icon icon={Wallet} size="lg" />
 * <Icon icon={Wallet} label="Wallet balance" />
 * ```
 */
export const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ icon: IconComponent, size = "md", weight = "regular", label, className, ...props }, ref) => (
    <IconComponent
      ref={ref}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      weight={weight}
      className={cx(styles.root, sizeClass[size], className)}
      {...props}
    />
  ),
);

Icon.displayName = "Icon";
