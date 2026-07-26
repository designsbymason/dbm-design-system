import { cx } from "@dbm-design-system/primitives";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { forwardRef, useId } from "react";
import { Icon } from "../Icon";
import styles from "./Switch.module.css";
import type { SwitchProps, SwitchSize } from "./Switch.types";

const sizeClass: Record<SwitchSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const iconSizeForSwitchSize: Record<SwitchSize, "xs" | "sm"> = {
  xs: "xs",
  sm: "xs",
  md: "xs",
  lg: "xs",
  xl: "sm",
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
 * ```
 */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      size = "md",
      disabled,
      className,
      children,
      checked,
      defaultChecked,
      onCheckedChange,
      checkedIcon,
      uncheckedIcon,
      id,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const switchId = id ?? generatedId;
    const iconSize = iconSizeForSwitchSize[size];

    const control = (
      <SwitchPrimitive.Root
        ref={ref}
        id={switchId}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cx(styles.root, sizeClass[size], className)}
        {...props}
      >
        <SwitchPrimitive.Thumb className={styles.thumb}>
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
        </SwitchPrimitive.Thumb>
      </SwitchPrimitive.Root>
    );

    if (!children) return control;

    return (
      <label
        htmlFor={switchId}
        className={cx(styles.label, disabled && styles.labelDisabled)}
      >
        {control}
        <span className={styles.labelText}>{children}</span>
      </label>
    );
  },
);

Switch.displayName = "Switch";
