import { cx, mergeRefs } from "@dbm-design-system/primitives";
import { forwardRef, useLayoutEffect, useRef, useState } from "react";
import type { InputEvent } from "react";
import styles from "./Textarea.module.css";
import type { TextareaProps, TextareaSize } from "./Textarea.types";

const sizeClass: Record<TextareaSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

/**
 * A multi-line text input, sharing `Input`'s size scale, error state, and
 * token-driven visual treatment. Supports `autoResize` to grow with its
 * content instead of scrolling internally, and an optional live character
 * count when `maxLength` is set. `ref` forwards to the native `<textarea>`
 * element; `className` applies to the wrapper.
 *
 * @example
 * ```tsx
 * <Textarea placeholder="Add a comment" />
 * <Textarea autoResize defaultValue="Grows with content…" />
 * <Textarea maxLength={280} showCount />
 * <Textarea hasError />
 * ```
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      hasError = false,
      size = "md",
      autoResize = false,
      resize = "vertical",
      showCount = false,
      className,
      disabled,
      rows = 3,
      maxLength,
      value,
      defaultValue,
      onInput,
      ...props
    },
    ref,
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [liveLength, setLiveLength] = useState(
      () => (value ?? defaultValue ?? "").toString().length,
    );

    const resizeToFitContent = () => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    };

    // Recalculates whenever the *controlled* value changes (e.g. cleared or
    // set programmatically by the caller) — the `onInput` handler below
    // already covers the user-typing case, but that never fires for
    // externally-driven value changes.
    useLayoutEffect(() => {
      if (value !== undefined) setLiveLength(value.toString().length);
      if (autoResize) resizeToFitContent();
    }, [autoResize, value]);

    const handleInput = (event: InputEvent<HTMLTextAreaElement>) => {
      setLiveLength(event.currentTarget.value.length);
      if (autoResize) resizeToFitContent();
      onInput?.(event);
    };

    const showCountText = showCount && maxLength != null;

    return (
      <div
        className={cx(
          styles.wrapper,
          sizeClass[size],
          hasError && styles.error,
          disabled && styles.disabled,
          className,
        )}
      >
        <textarea
          ref={mergeRefs(ref, textareaRef)}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          className={styles.textarea}
          rows={rows}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          onInput={handleInput}
          style={{ resize: autoResize ? "none" : resize }}
          {...props}
        />
        {showCountText && (
          <span className={styles.count}>
            {liveLength}/{maxLength}
          </span>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
