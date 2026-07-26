import { XIcon } from "@dbm-design-system/icons";
import { cx, mergeRefs } from "@dbm-design-system/primitives";
import { forwardRef, useRef, useState } from "react";
import type { ChangeEvent, MouseEvent as ReactMouseEvent } from "react";
import { IconButton } from "../IconButton";
import styles from "./Input.module.css";
import type { InputProps, InputSize } from "./Input.types";

const sizeClass: Record<InputSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

/**
 * A text input with optional leading/trailing slots (icons, currency
 * symbols, unit labels), an optional clear button, and an error state.
 * `ref` forwards to the native `<input>` element, not the wrapper, so
 * `.focus()`/`.value` work as expected; `className` applies to the wrapper
 * (the visual input box) — clicking anywhere in that box, including the
 * `prefix`/`suffix` slots, focuses the input, matching a native input's own
 * click-anywhere-in-box behavior.
 *
 * @example
 * ```tsx
 * <Input placeholder="Search" prefix={<Icon icon={MagnifyingGlassIcon} />} />
 * <Input hasError suffix="@example.com" />
 * <Input value={query} onChange={(e) => setQuery(e.target.value)} onClear={() => setQuery("")} />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      prefix,
      suffix,
      hasError = false,
      size = "md",
      className,
      disabled,
      onClear,
      onChange,
      value,
      defaultValue,
      ...props
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const isControlled = value !== undefined;
    const [hasTypedValue, setHasTypedValue] = useState(() =>
      Boolean(value ?? defaultValue),
    );
    const showClear =
      Boolean(onClear) && (isControlled ? Boolean(value) : hasTypedValue);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      setHasTypedValue(event.target.value.length > 0);
      onChange?.(event);
    };

    const handleWrapperMouseDown = (
      event: ReactMouseEvent<HTMLSpanElement>,
    ) => {
      const target = event.target as HTMLElement;
      // Don't steal focus from the input itself, or from an interactive
      // element nested in `prefix`/`suffix` (e.g. the clear button below).
      if (
        target === inputRef.current ||
        target.closest("button, a, input, select, textarea")
      ) {
        return;
      }
      event.preventDefault();
      inputRef.current?.focus();
    };

    return (
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- this span isn't its own interactive widget; it's a hit-area extension that forwards mousedown to the already fully keyboard-navigable <input> inside it, same as clicking a <label>. No role/keyboard handling is needed since the wrapper itself does nothing independently interactive.
      <span
        onMouseDown={handleWrapperMouseDown}
        className={cx(
          styles.wrapper,
          sizeClass[size],
          hasError && styles.error,
          disabled && styles.disabled,
          className,
        )}
      >
        {prefix && <span className={styles.affix}>{prefix}</span>}
        <input
          ref={mergeRefs(ref, inputRef)}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          className={styles.input}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          {...props}
        />
        {suffix && <span className={styles.affix}>{suffix}</span>}
        {showClear && (
          <IconButton
            icon={XIcon}
            aria-label="Clear"
            size="xs"
            variant="ghost"
            className={styles.clear}
            onClick={() => {
              onClear?.();
              inputRef.current?.focus();
            }}
          />
        )}
      </span>
    );
  },
);

Input.displayName = "Input";
