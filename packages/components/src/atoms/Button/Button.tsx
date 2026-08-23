import { cx } from "@dbm-design-system/primitives";
import { Slot } from "@radix-ui/react-slot";
import { forwardRef, useRef } from "react";
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

// Every variant's icon gets its own explicit tone rather than ever relying
// on `currentColor` inheritance from its label — `text.*` tokens are for
// text, not icons, so even where a variant's label color would otherwise
// produce the "right" icon color as an inheritance side effect (e.g.
// `secondary`/`tertiary`/`ghost`'s shared text.brand/icon.brand pairing),
// making it explicit keeps the two concerns independently adjustable and
// documents the intent directly instead of leaning on a CSS accident.
const iconToneForVariant: Record<ButtonVariant, IconTone> = {
  primary: "on-brand",
  secondary: "brand",
  tertiary: "brand",
  ghost: "brand",
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
    // `||`, not `??` — `isLoading` must disable the button even when a
    // consumer explicitly passes `disabled={false}`; `??` would let that
    // explicit `false` win and leave a "loading" button fully clickable.
    const isDisabled = disabled || isLoading;
    // `Slot` can't take a native `disabled` attribute (the child might be
    // an <a> or any other element) — `aria-disabled` plus this handler
    // conveys and enforces the same state instead.
    const slottedDisabled = asChild && isDisabled;
    // In `asChild` mode the rendered label always comes from `children`
    // (the slotted element) regardless of `isLoading`/`loadingText` — the
    // spinner/label-swap branch below is skipped entirely in that mode.
    const effectiveLabel = !asChild && isLoading ? loadingText || children : children;

    const hasWarnedNoAccessibleNameRef = useRef(false);
    const hasWarnedAsChildIgnoredPropsRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (
        !effectiveLabel &&
        !props["aria-label"] &&
        !props["aria-labelledby"] &&
        !hasWarnedNoAccessibleNameRef.current
      ) {
        hasWarnedNoAccessibleNameRef.current = true;
        console.warn(
          "Button: no accessible name — pass visible text as `children`, or `aria-label`/`aria-labelledby`, so assistive tech has something to announce. An icon-only button with no label is invisible to screen reader users.",
        );
      }
      if (
        asChild &&
        (leadingIcon || trailingIcon || isLoading) &&
        !hasWarnedAsChildIgnoredPropsRef.current
      ) {
        hasWarnedAsChildIgnoredPropsRef.current = true;
        console.warn(
          "Button: `leadingIcon`/`trailingIcon`/`isLoading` have no effect when `asChild` is set — icons and the loading spinner aren't rendered in that mode, since Radix `Slot` requires exactly one child. Remove `asChild`, or remove these props.",
        );
      }
    }

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
        {...props}
        // These are always applied last (after `...props`) so they can
        // never be silently overridden by a same-named prop the caller
        // passes — including `aria-disabled`/`aria-busy`, which
        // TypeScript's JSX checker permits on any component regardless of
        // whether they're declared in its prop type (found and fixed on
        // Skeleton/ProgressBar/ProgressCircle/Spinner first — the same
        // ordering bug existed here too: `aria-busy={false}` or
        // `aria-disabled={false}` from a caller would have silently won
        // over Button's own computed loading/disabled state).
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
            {effectiveLabel}
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
