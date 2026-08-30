import { cx } from "@dbm-design-system/primitives";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { forwardRef, useId, useRef } from "react";
import { Icon } from "../Icon";
import { Spinner } from "../Spinner";
import styles from "./Switch.module.css";
import type { SwitchProps, SwitchSize } from "./Switch.types";

const sizeClass: Record<SwitchSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const iconSizeForSwitchSize: Record<SwitchSize, "xs" | "sm" | "md"> = {
  xs: "xs",
  sm: "xs",
  md: "sm",
  lg: "sm",
  xl: "md",
};

/**
 * A binary on/off toggle built on Radix Switch, with a token-driven
 * sliding-thumb track and an optional inline label. Accepts both
 * controlled (`checked`/`onCheckedChange`) and uncontrolled
 * (`defaultChecked`) usage, mirroring Radix's own pattern. `ref` forwards
 * to the underlying `<button role="switch">`.
 *
 * @example
 * ```tsx
 * <Switch defaultChecked>Email notifications</Switch>
 * <Switch checked={isDark} onCheckedChange={setIsDark} checkedIcon={MoonIcon} uncheckedIcon={SunIcon} />
 * <Switch aria-label="Airplane mode" />
 * <Switch hasError>Required setting</Switch>
 * <Switch loading>Saving…</Switch>
 * ```
 */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      size = "md",
      hasError = false,
      disabled,
      className,
      children,
      checked,
      defaultChecked,
      onCheckedChange,
      checkedIcon,
      uncheckedIcon,
      loading = false,
      id,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const switchId = id ?? generatedId;
    const iconSize = iconSizeForSwitchSize[size];
    // `||`, not `??` — `loading` must disable the switch even when a
    // consumer explicitly passes `disabled={false}`; `??` would let that
    // explicit `false` win and leave a "loading" switch fully toggleable.
    const isDisabled = disabled || loading;

    const hasWarnedNoAccessibleNameRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (
        !children &&
        !props["aria-label"] &&
        !props["aria-labelledby"] &&
        !hasWarnedNoAccessibleNameRef.current
      ) {
        hasWarnedNoAccessibleNameRef.current = true;
        console.warn(
          "Switch: no accessible name — pass a visible label as `children`, or `aria-label`/`aria-labelledby`, so assistive tech has something to announce. A switch with no label is invisible to screen reader users.",
        );
      }
    }

    const control = (
      <SwitchPrimitive.Root
        ref={ref}
        {...props}
        // These are always applied last (after `...props`) so they can
        // never be silently overridden by a same-named prop the caller
        // passes — including `aria-invalid`/`aria-busy`, which
        // TypeScript's JSX checker permits on any component regardless of
        // whether they're declared in its prop type (the same confirmed
        // bug class already fixed on Button/Checkbox/Skeleton/ProgressBar/
        // ProgressCircle/Spinner). Not currently exploitable via the props
        // this component destructures out (`id`/`checked`/`defaultChecked`/
        // `onCheckedChange`/`className` can't reappear in `...props`), but
        // kept consistent with the standing convention so newly-added
        // computed attributes stay protected by construction.
        id={switchId}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={isDisabled}
        aria-invalid={hasError || undefined}
        aria-busy={loading || undefined}
        className={cx(
          styles.root,
          sizeClass[size],
          hasError && styles.error,
          className,
        )}
      >
        <SwitchPrimitive.Thumb className={styles.thumb}>
          {loading ? (
            <Spinner size={iconSize} tone="secondary" />
          ) : (
            <>
              {uncheckedIcon && (
                <Icon
                  icon={uncheckedIcon}
                  size={iconSize}
                  className={styles.uncheckedIcon}
                />
              )}
              {checkedIcon && (
                <Icon
                  icon={checkedIcon}
                  size={iconSize}
                  className={styles.checkedIcon}
                />
              )}
            </>
          )}
        </SwitchPrimitive.Thumb>
      </SwitchPrimitive.Root>
    );

    if (!children) return control;

    return (
      <label
        htmlFor={switchId}
        className={cx(styles.label, isDisabled && styles.labelDisabled)}
      >
        {control}
        <span className={styles.labelText}>{children}</span>
      </label>
    );
  },
);

Switch.displayName = "Switch";
