import { cx } from "@dbm-design-system/primitives";
import { Slot } from "@radix-ui/react-slot";
import { forwardRef } from "react";
import { Icon } from "../Icon";
import styles from "./Button.module.css";
import type { ButtonProps, ButtonSize, ButtonVariant } from "./Button.types";

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

const iconSizeForButtonSize: Record<ButtonSize, "xs" | "sm" | "md"> = {
  xs: "xs",
  sm: "xs",
  md: "sm",
  lg: "sm",
  xl: "md",
};

/**
 * The primary interactive action element. Five variants (`primary` is the
 * default, high-emphasis action; `destructive` for irreversible/dangerous
 * actions), five sizes, optional leading/trailing icons, a loading state,
 * and `asChild` for composing with other elements (e.g. a router link
 * styled as a button).
 *
 * @example
 * ```tsx
 * <Button>Save</Button>
 * <Button variant="destructive" icon={TrashIcon}>Delete</Button>
 * <Button isLoading>Saving…</Button>
 * <Button asChild><a href="/next">Continue</a></Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      icon,
      trailingIcon,
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
    const iconSize = iconSizeForButtonSize[size];

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
        ) : (
          <>
            {isLoading ? (
              <span className={styles.spinner} aria-hidden="true" />
            ) : (
              icon && <Icon icon={icon} size={iconSize} />
            )}
            {children}
            {!isLoading && trailingIcon && <Icon icon={trailingIcon} size={iconSize} />}
          </>
        )}
      </Component>
    );
  },
);

Button.displayName = "Button";
