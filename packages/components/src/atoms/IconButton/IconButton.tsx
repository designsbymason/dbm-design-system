import { cx } from "@dbm-design-system/primitives";
import { Slot } from "@radix-ui/react-slot";
import { forwardRef } from "react";
import type { ButtonSize, ButtonVariant } from "../Button/Button.types";
import { Icon } from "../Icon";
import styles from "./IconButton.module.css";
import type { IconButtonProps } from "./IconButton.types";

const variantClass: Record<ButtonVariant, string | undefined> = {
  primary: styles.variantPrimary,
  secondary: styles.variantSecondary,
  tertiary: styles.variantTertiary,
  ghost: styles.variantGhost,
  destructive: styles.variantDestructive,
};

const sizeClass: Record<ButtonSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const iconSizeForButtonSize: Record<ButtonSize, "xs" | "sm" | "md" | "lg"> = {
  xs: "xs",
  sm: "sm",
  md: "md",
  lg: "lg",
  xl: "lg",
};

/**
 * An icon-only button. Shares Button's variant/size scale and loading
 * behavior, but always requires `aria-label` since there's no visible text
 * to derive an accessible name from.
 *
 * @example
 * ```tsx
 * <IconButton icon={TrashIcon} aria-label="Delete item" variant="destructive" />
 * ```
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      variant = "primary",
      size = "md",
      isLoading = false,
      asChild = false,
      disabled,
      className,
      children,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const Component = asChild ? Slot : "button";

    return (
      <Component
        ref={ref}
        type={asChild ? undefined : type}
        disabled={asChild ? undefined : (disabled ?? isLoading)}
        aria-busy={isLoading || undefined}
        className={cx(styles.root, variantClass[variant], sizeClass[size], className)}
        {...props}
      >
        {asChild ? (
          children
        ) : isLoading ? (
          <span className={styles.spinner} aria-hidden="true" />
        ) : (
          <Icon icon={icon} size={iconSizeForButtonSize[size]} />
        )}
      </Component>
    );
  },
);

IconButton.displayName = "IconButton";
