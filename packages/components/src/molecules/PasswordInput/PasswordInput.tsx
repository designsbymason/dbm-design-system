import { EyeIcon, EyeSlashIcon } from "@dbm-design-system/icons";
import { cx, mergeRefs } from "@dbm-design-system/primitives";
import { forwardRef, useRef, useState } from "react";
import { Icon } from "../../atoms/Icon";
import { Input } from "../../atoms/Input";
import type { InputSize } from "../../atoms/Input";
import styles from "./PasswordInput.module.css";
import type { PasswordInputProps } from "./PasswordInput.types";

const toggleIconSizeForInputSize: Record<InputSize, "xs" | "sm" | "md" | "lg"> = {
  xs: "xs",
  sm: "xs",
  md: "sm",
  lg: "md",
  xl: "lg",
};

const toggleSizeClass: Record<InputSize, string | undefined> = {
  xs: styles.toggleXs,
  sm: styles.toggleSm,
  md: styles.toggleMd,
  lg: styles.toggleLg,
  xl: styles.toggleXl,
};

/**
 * A password input with a show/hide visibility toggle, wrapping `Input`.
 * Starts masked (`type="password"`); the trailing toggle switches to
 * `type="text"` so the user can verify what they typed, without ever
 * exposing the value to anything but the DOM's own native rendering. `ref`
 * forwards to the native `<input>` element, same as `Input`'s own.
 *
 * @example
 * ```tsx
 * <PasswordInput placeholder="Enter your password" />
 * <PasswordInput hasError autoComplete="new-password" />
 * <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} onClear={() => setPassword("")} />
 * ```
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ size = "md", disabled, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    return (
      <Input
        ref={mergeRefs(ref, inputRef)}
        {...props}
        size={size}
        disabled={disabled}
        type={visible ? "text" : "password"}
        suffix={
          <button
            type="button"
            aria-label={visible ? "Hide password" : "Show password"}
            disabled={disabled}
            className={cx(styles.toggle, toggleSizeClass[size])}
            onClick={() => {
              setVisible((current) => !current);
              inputRef.current?.focus();
            }}
          >
            <Icon
              icon={visible ? EyeSlashIcon : EyeIcon}
              size={toggleIconSizeForInputSize[size]}
              tone="default"
            />
          </button>
        }
      />
    );
  },
);

PasswordInput.displayName = "PasswordInput";
