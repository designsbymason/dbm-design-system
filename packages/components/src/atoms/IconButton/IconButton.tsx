import { cx } from "@dbm-design-system/primitives";
import { Slot } from "@radix-ui/react-slot";
import { forwardRef } from "react";
import type { MouseEvent } from "react";
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

const iconSizeForButtonSize: Record<
  ButtonSize,
  "xs" | "sm" | "md" | "lg" | "xl"
> = {
  xs: "xs",
  sm: "sm",
  md: "md",
  lg: "lg",
  xl: "xl",
};

/**
 * An icon-only button. Shares Button's variant/size scale and loading
 * behavior, but always requires `aria-label` since there's no visible text
 * to derive an accessible name from.
 *
 * @example
 * ```tsx
 * <IconButton icon={TrashIcon} aria-label="Delete item" variant="destructive" />
 * <IconButton icon={TrashIcon} aria-label="Delete" isLoading loadingLabel="Deleting…" />
 * <IconButton icon={PlusIcon} aria-label="Add" rounded />
 * ```
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingLabel,
      asChild = false,
      rounded = false,
      disabled,
      className,
      children,
      type = "button",
      onClick,
      "aria-label": ariaLabel,
      ...props
    },
    ref,
  ) => {
    const Component = asChild ? Slot : "button";
    const isDisabled = disabled ?? isLoading;
    // `Slot` can't take a native `disabled` attribute (the child might be
    // an <a> or any other element) — `aria-disabled` plus this handler
    // conveys and enforces the same state instead. Same rationale as
    // Button's identical fix.
    const slottedDisabled = asChild && isDisabled;

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      if (slottedDisabled) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      onClick?.(event);
    };

    return (
      <Component
        ref={ref}
        type={asChild ? undefined : type}
        disabled={asChild ? undefined : isDisabled}
        aria-disabled={slottedDisabled || undefined}
        aria-busy={isLoading || undefined}
        aria-label={isLoading ? (loadingLabel ?? ariaLabel) : ariaLabel}
        onClick={handleClick}
        className={cx(
          styles.root,
          variantClass[variant],
          sizeClass[size],
          rounded && styles.rounded,
          slottedDisabled && styles.disabled,
          className,
        )}
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
