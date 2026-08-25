import { cx } from "@dbm-design-system/primitives";
import { Slot } from "@radix-ui/react-slot";
import { forwardRef, useRef, useState } from "react";
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
 * <IconButton icon={HeartIcon} aria-label="Favorite" variant="ghost" pressed={isFavorited} onPressedChange={setIsFavorited} />
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
      rounded = false,
      pressed,
      defaultPressed,
      onPressedChange,
      asChild = false,
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
    // Naming/shape mirrors Radix `Toggle`'s own `pressed`/`defaultPressed`/
    // `onPressedChange` (this system's established convention for
    // controlled/uncontrolled state, `05-component-api-conventions.md`
    // §3) — a plain button (the common case) has neither prop set, so
    // `isToggle` stays `false` and `aria-pressed` is never rendered at
    // all, not even as `"false"`.
    const isToggle =
      pressed !== undefined ||
      defaultPressed !== undefined ||
      onPressedChange !== undefined;
    const [uncontrolledPressed, setUncontrolledPressed] = useState(
      defaultPressed ?? false,
    );
    const isPressed = pressed !== undefined ? pressed : uncontrolledPressed;
    // `||`, not `??` — `isLoading` must disable the button even when a
    // consumer explicitly passes `disabled={false}`; `??` would let that
    // explicit `false` win and leave a "loading" button fully clickable.
    // Same fix as Button's identical bug.
    const isDisabled = disabled || isLoading;
    // `Slot` can't take a native `disabled` attribute (the child might be
    // an <a> or any other element) — `aria-disabled` plus this handler
    // conveys and enforces the same state instead. Same rationale as
    // Button's identical fix.
    const slottedDisabled = asChild && isDisabled;
    // `||`, not `??` — an explicit `loadingLabel=""` must still fall back
    // to `aria-label` while loading; `??` would let that empty string win
    // and leave the button with no accessible name at all. Same bug and
    // fix as Button's own `loadingText ?? children`.
    const effectiveAriaLabel = isLoading ? loadingLabel || ariaLabel : ariaLabel;

    const hasWarnedNoAccessibleNameRef = useRef(false);
    const hasWarnedAsChildIgnoredPropsRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (
        !ariaLabel &&
        !props["aria-labelledby"] &&
        !hasWarnedNoAccessibleNameRef.current
      ) {
        hasWarnedNoAccessibleNameRef.current = true;
        console.warn(
          "IconButton: no accessible name — pass `aria-label` or `aria-labelledby` so assistive tech has something to announce. An icon-only button with no label is invisible to screen reader users.",
        );
      }
      if (asChild && !hasWarnedAsChildIgnoredPropsRef.current) {
        hasWarnedAsChildIgnoredPropsRef.current = true;
        console.warn(
          "IconButton: `icon` has no effect when `asChild` is set — Radix `Slot` always renders `children` directly, and `icon` has no fallback role in that mode (though it's still a required prop, since it's the only accessible-icon path outside `asChild`). `isLoading`'s spinner is skipped the same way, though its dimming/`aria-disabled` state still applies. Render the icon as part of the slotted child instead.",
        );
      }
    }

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      if (slottedDisabled) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (isToggle) {
        const nextPressed = !isPressed;
        // Only track internal state when uncontrolled — a controlled
        // `pressed` consumer owns the value entirely; this component just
        // reports the intended next value via `onPressedChange`.
        if (pressed === undefined) {
          setUncontrolledPressed(nextPressed);
        }
        onPressedChange?.(nextPressed);
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
        // whether they're declared in its prop type (same ordering bug
        // already found and fixed on Skeleton/ProgressBar/ProgressCircle/
        // Spinner/Button — `aria-busy={false}` or `aria-disabled={false}`
        // from a caller would have silently won over this component's own
        // computed loading/disabled state).
        type={asChild ? undefined : type}
        disabled={asChild ? undefined : isDisabled}
        aria-disabled={slottedDisabled || undefined}
        aria-busy={isLoading || undefined}
        aria-pressed={isToggle ? isPressed : undefined}
        aria-label={effectiveAriaLabel}
        onClick={handleClick}
        className={cx(
          styles.root,
          variantClass[variant],
          sizeClass[size],
          rounded && styles.rounded,
          isToggle && isPressed && styles.pressed,
          slottedDisabled && styles.disabled,
          className,
        )}
      >
        {asChild ? (
          children
        ) : isLoading ? (
          <span className={styles.spinner} aria-hidden="true" />
        ) : (
          <Icon
            icon={icon}
            size={size}
            weight={isToggle && isPressed ? "fill" : "regular"}
          />
        )}
      </Component>
    );
  },
);

IconButton.displayName = "IconButton";
