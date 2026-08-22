import { cx } from "@dbm-design-system/primitives";
import { Slot } from "@radix-ui/react-slot";
import { forwardRef } from "react";
import type { MouseEvent } from "react";
import { Icon } from "../Icon";
import type { IconTone } from "../Icon";
import styles from "./Button.module.css";
import type { ButtonProps, ButtonSize, ButtonVariant } from "./Button.types";

const variantClass: Record<ButtonVariant, string | undefined> = {
  primary: styles.variantPrimary,
  secondary: styles.variantSecondary,
  tertiary: styles.variantTertiary,
  ghost: styles.variantGhost,
  destructive: styles.variantDestructive,
};

// `primary`/`destructive` sit on a solid bg.brand/bg.danger fill, so their
// text uses text.on-brand/text.on-danger — the icon must NOT simply inherit
// that (text.* tokens are for text, not icons), so it gets its own explicit
// icon.on-{tone} instead. `secondary`/`tertiary`/`ghost` use text.primary/
// text.secondary for their label, which the icon inheriting via
// `currentColor` is fine for (those aren't "on-a-solid-fill" tokens).
const iconToneForVariant: Record<ButtonVariant, IconTone | undefined> = {
  primary: "on-brand",
  secondary: undefined,
  tertiary: undefined,
  ghost: undefined,
  destructive: "on-danger",
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
 * actions), five sizes, optional leading/trailing icons, a loading state
 * with an optional `loadingText`, `fullWidth` for stretching to the
 * container, and `asChild` for composing with other elements (e.g. a
 * router link styled as a button).
 *
 * @example
 * ```tsx
 * <Button>Save</Button>
 * <Button variant="destructive" leadingIcon={TrashIcon}>Delete</Button>
 * <Button isLoading loadingText="Saving…">Save</Button>
 * <Button fullWidth>Continue</Button>
 * <Button asChild><a href="/next">Continue</a></Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      leadingIcon,
      trailingIcon,
      isLoading = false,
      loadingText,
      asChild = false,
      fullWidth = false,
      disabled,
      className,
      children,
      type = "button",
      onClick,
      ...props
    },
    ref,
  ) => {
    const Component = asChild ? Slot : "button";
    const iconSize = iconSizeForButtonSize[size];
    const iconTone = iconToneForVariant[variant];
    const isDisabled = disabled ?? isLoading;
    // `Slot` can't take a native `disabled` attribute (the child might be
    // an <a> or any other element) — `aria-disabled` plus this handler
    // conveys and enforces the same state instead.
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
        onClick={handleClick}
        className={cx(
          styles.root,
          variantClass[variant],
          sizeClass[size],
          fullWidth && styles.fullWidth,
          slottedDisabled && styles.disabled,
          className,
        )}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {isLoading ? (
              <span className={styles.spinner} aria-hidden="true" />
            ) : (
              leadingIcon && (
                <Icon icon={leadingIcon} size={iconSize} tone={iconTone} />
              )
            )}
            {isLoading ? (loadingText ?? children) : children}
            {!isLoading && trailingIcon && (
              <Icon icon={trailingIcon} size={iconSize} tone={iconTone} />
            )}
          </>
        )}
      </Component>
    );
  },
);

Button.displayName = "Button";
