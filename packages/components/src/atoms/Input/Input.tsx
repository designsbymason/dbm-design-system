import { XIcon } from "@dbm-design-system/icons";
import { cx, mergeRefs } from "@dbm-design-system/primitives";
import { forwardRef, useLayoutEffect, useRef, useState } from "react";
import type { ChangeEvent, MouseEvent as ReactMouseEvent } from "react";
import { Icon } from "../Icon";
import styles from "./Input.module.css";
import type { InputProps, InputSize } from "./Input.types";

const sizeClass: Record<InputSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

// The clear button is a dedicated, locally-implemented control rather than
// the shared `IconButton` atom (2026-08-29, review finding) — same
// reasoning as Tag's own remove button (2026-08-25 review): `IconButton`'s
// size steps are self-contained boxes calibrated to match Button's/Input's
// own *full* outer height, so even its smallest step (xs, 30px) is taller
// than this row's own text content at every Input size — it would always
// dominate the flex row's height and force the wrapper taller than
// intended, and its box/icon never scaled with Input's own `size` prop
// regardless. The icon itself renders one size step down from Input's own
// `size`, same principle as `Tag`'s own `iconSizeForTagSize` — the button
// then gets real padding around that icon for a comfortable hit area
// (`clearButtonSizeClass` below, keyed by Input's own size), with a
// compensating negative margin in Input.module.css so the padded box
// still doesn't inflate `.wrapper` past the Button-matched height.
const clearIconSizeForInputSize: Record<InputSize, "xs" | "sm" | "md" | "lg"> = {
  xs: "xs",
  sm: "xs",
  md: "sm",
  lg: "md",
  xl: "lg",
};

// Keyed by Input's own `size`, not by `clearIconSizeForInputSize`'s icon
// step — `xs`/`sm` share the same icon size but still need their own
// class here, since the hit-area padding and its compensating margin
// (Input.module.css) depend on each Input size's own font-size/
// line-height envelope, which differs between `xs` and `sm` even when
// their icon sizes match.
const clearButtonSizeClass: Record<InputSize, string | undefined> = {
  xs: styles.clearXs,
  sm: styles.clearSm,
  md: styles.clearMd,
  lg: styles.clearLg,
  xl: styles.clearXl,
};

/**
 * A text input with optional leading/trailing slots (icons, currency
 * symbols, unit labels), an optional clear button, an error state, and an
 * optional live character count when `maxLength` is set. `ref` forwards
 * to the native `<input>` element, not the wrapper, so `.focus()`/`.value`
 * work as expected; `className`/`style` both apply to the wrapper (the
 * visual input box) — clicking anywhere in that box, including the
 * `prefix`/`suffix` slots, focuses the input, matching a native input's
 * own click-anywhere-in-box behavior.
 *
 * @example
 * ```tsx
 * <Input placeholder="Search" prefix={<Icon icon={MagnifyingGlassIcon} />} />
 * <Input hasError suffix="@example.com" />
 * <Input value={query} onChange={(e) => setQuery(e.target.value)} onClear={() => setQuery("")} />
 * <Input maxLength={280} showCount />
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
      style,
      disabled,
      onClear,
      onChange,
      value,
      defaultValue,
      maxLength,
      showCount = false,
      ...props
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const isControlled = value !== undefined;
    const [hasTypedValue, setHasTypedValue] = useState(() =>
      Boolean(value ?? defaultValue),
    );
    const [liveLength, setLiveLength] = useState(
      () => (value ?? defaultValue ?? "").toString().length,
    );
    const showClear =
      Boolean(onClear) && (isControlled ? Boolean(value) : hasTypedValue);
    const showCountText = showCount && maxLength != null;

    // Recalculates whenever the *controlled* value changes (e.g. cleared or
    // set programmatically by the caller) — `handleChange` below already
    // covers the user-typing case, but that never fires for
    // externally-driven value changes. Matches Textarea's own
    // `showCount` implementation.
    useLayoutEffect(() => {
      if (value !== undefined) setLiveLength(value.toString().length);
    }, [value]);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      setHasTypedValue(event.target.value.length > 0);
      setLiveLength(event.target.value.length);
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
        style={style}
      >
        {prefix && <span className={styles.affix}>{prefix}</span>}
        {/* `{...props}` is spread before the computed `aria-invalid` so a
            same-named prop a consumer passes can never silently override
            it — the JSX-attribute-ordering bug already found and fixed on
            Skeleton/ProgressBar/ProgressCircle/Spinner/Button/IconButton/
            Checkbox/FieldError (05-component-api-conventions.md §3).
            `disabled`/`className`/`style`/`value`/`defaultValue`/`onChange`/
            `maxLength` are already destructured out above, so they can't
            collide via the spread regardless of order — only
            `aria-invalid` was ever at risk here. */}
        <input
          ref={mergeRefs(ref, inputRef)}
          disabled={disabled}
          className={styles.input}
          value={value}
          defaultValue={defaultValue}
          maxLength={maxLength}
          onChange={handleChange}
          {...props}
          aria-invalid={hasError || undefined}
        />
        {suffix && <span className={styles.affix}>{suffix}</span>}
        {showCountText && (
          <span className={styles.count}>
            {liveLength}/{maxLength}
          </span>
        )}
        {showClear && (
          <button
            type="button"
            aria-label="Clear"
            className={cx(styles.clear, clearButtonSizeClass[size])}
            onClick={() => {
              onClear?.();
              inputRef.current?.focus();
            }}
          >
            <Icon icon={XIcon} size={clearIconSizeForInputSize[size]} tone="brand" />
          </button>
        )}
      </span>
    );
  },
);

Input.displayName = "Input";
