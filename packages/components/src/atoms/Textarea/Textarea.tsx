import { XIcon } from "@dbm-design-system/icons";
import { cx, mergeRefs } from "@dbm-design-system/primitives";
import {
  forwardRef,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { InputEvent } from "react";
import { Icon } from "../Icon";
import styles from "./Textarea.module.css";
import type { TextareaProps, TextareaSize } from "./Textarea.types";

const sizeClass: Record<TextareaSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

// The clear button's icon scales with Textarea's own `size`, one step
// down — same principle as Input's own `clearIconSizeForInputSize` (and
// Tag's `iconSizeForTagSize` before it) — since Textarea shares Input's
// exact size scale/tokens (see Textarea.module.css's own "shared with
// Input" comment on its size classes).
const clearIconSizeForTextareaSize: Record<
  TextareaSize,
  "xs" | "sm" | "md" | "lg"
> = {
  xs: "xs",
  sm: "xs",
  md: "sm",
  lg: "md",
  xl: "lg",
};

/**
 * A multi-line text input, sharing `Input`'s size scale, error state, and
 * token-driven visual treatment. Supports `autoResize` to grow with its
 * content instead of scrolling internally — optionally bounded by
 * `minRows`/`maxRows` — an optional clear button via `onClear`, and an
 * optional live character count when `maxLength` is set. `ref` forwards
 * to the native `<textarea>` element; `className`/`style` both apply to
 * the wrapper (the visual textarea box).
 *
 * @example
 * ```tsx
 * <Textarea placeholder="Add a comment" />
 * <Textarea autoResize defaultValue="Grows with content…" />
 * <Textarea autoResize minRows={3} maxRows={8} />
 * <Textarea value={value} onChange={(e) => setValue(e.target.value)} onClear={() => setValue("")} />
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
      minRows,
      maxRows,
      showCount = false,
      className,
      style,
      disabled,
      rows = 3,
      maxLength,
      value,
      defaultValue,
      onClear,
      onInput,
      ...props
    },
    ref,
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isControlled = value !== undefined;
    const [hasTypedValue, setHasTypedValue] = useState(() =>
      Boolean(value ?? defaultValue),
    );
    const [liveLength, setLiveLength] = useState(
      () => (value ?? defaultValue ?? "").toString().length,
    );
    // Same show/hide condition as Input's own `onClear` — the clear
    // button only ever appears once there's real content, whether that's
    // the caller's own controlled `value` or the DOM's own uncontrolled
    // value (tracked via `hasTypedValue`, since an uncontrolled value
    // isn't otherwise observable from here).
    const showClear =
      Boolean(onClear) && (isControlled ? Boolean(value) : hasTypedValue);

    // Row-count bounds are converted to pixels from the textarea's own
    // *actual rendered* line-height/padding (read fresh each resize, not
    // memoized) so they track the current `size` step and theme correctly
    // — a fixed pixel-per-row guess would drift the moment either changes.
    // `line-height: normal` (this component sets none of its own) still
    // resolves to a real computed pixel value via `getComputedStyle` in
    // every evergreen browser, so no fallback is needed in practice; the
    // `|| fontSize * 1.2` guard exists only for a hypothetical
    // environment where that resolution doesn't happen.
    const getRowBoundsPx = useCallback(
      (el: HTMLTextAreaElement) => {
        const computed = getComputedStyle(el);
        const lineHeight =
          parseFloat(computed.lineHeight) ||
          parseFloat(computed.fontSize) * 1.2;
        const paddingBlock =
          parseFloat(computed.paddingTop) +
          parseFloat(computed.paddingBottom);
        return {
          minHeightPx:
            minRows != null ? lineHeight * minRows + paddingBlock : undefined,
          maxHeightPx:
            maxRows != null ? lineHeight * maxRows + paddingBlock : undefined,
        };
      },
      [minRows, maxRows],
    );

    // Memoized (rather than a plain function redefined every render) so
    // the `useLayoutEffect` below can depend on it directly instead of on
    // `minRows`/`maxRows` — `react-hooks/exhaustive-deps` can't otherwise
    // prove that listing the raw props covers a function that reads them
    // only transitively, through `getRowBoundsPx`, and flags a genuine
    // missing-dependency warning without this.
    const resizeToFitContent = useCallback(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = "auto";
      const natural = el.scrollHeight;
      const { minHeightPx, maxHeightPx } = getRowBoundsPx(el);
      let next = natural;
      if (minHeightPx != null) next = Math.max(next, minHeightPx);
      if (maxHeightPx != null) next = Math.min(next, maxHeightPx);
      el.style.height = `${next}px`;
      // Only `maxRows` needs internal scrolling once content genuinely
      // exceeds it (compared against `natural`, the unclamped height, not
      // `next`) — otherwise the box always grows to fit, so nothing ever
      // overflows and this stays "hidden" to avoid any UA-default
      // scrollbar flicker right at the exact-fit boundary.
      el.style.overflowY =
        maxHeightPx != null && natural > maxHeightPx ? "auto" : "hidden";
    }, [getRowBoundsPx]);

    const hasWarnedUnusedRowBoundsRef = useRef(false);
    const hasWarnedInvertedRowBoundsRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (
        (minRows != null || maxRows != null) &&
        !autoResize &&
        !hasWarnedUnusedRowBoundsRef.current
      ) {
        hasWarnedUnusedRowBoundsRef.current = true;
        console.warn(
          "Textarea: `minRows`/`maxRows` were provided without `autoResize` — they only bound the auto-grow height, so they have no effect here. Pass `autoResize`, or remove `minRows`/`maxRows`.",
        );
      }
      if (
        minRows != null &&
        maxRows != null &&
        minRows > maxRows &&
        !hasWarnedInvertedRowBoundsRef.current
      ) {
        hasWarnedInvertedRowBoundsRef.current = true;
        console.warn(
          `Textarea: \`minRows\` (${minRows}) is greater than \`maxRows\` (${maxRows}) — the textarea will settle at \`maxRows\`' height, below its own stated minimum. Swap the two values, or remove one.`,
        );
      }
    }

    // Recalculates whenever the *controlled* value changes (e.g. cleared or
    // set programmatically by the caller) — the `onInput` handler below
    // already covers the user-typing case, but that never fires for
    // externally-driven value changes. Also recalculates when the bounds
    // themselves change, so adjusting `minRows`/`maxRows` live re-clamps
    // an already-mounted textarea instead of waiting for the next input.
    useLayoutEffect(() => {
      if (value !== undefined) setLiveLength(value.toString().length);
      if (autoResize) resizeToFitContent();
    }, [autoResize, value, resizeToFitContent]);

    const handleInput = (event: InputEvent<HTMLTextAreaElement>) => {
      setLiveLength(event.currentTarget.value.length);
      setHasTypedValue(event.currentTarget.value.length > 0);
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
        // Applies to the wrapper — the visible bordered/backgrounded box —
        // matching `className`'s own target, not the borderless inner
        // `<textarea>`. Previously unhandled entirely: `style` wasn't
        // destructured, so it fell into `{...props}` below and landed on
        // the `<textarea>` instead, where (a) it had no visible effect for
        // anything targeting the box's own border/background (the same
        // "silently no-op" bug class `Input`'s own review found and fixed
        // for its identical wrapper/inner-element split), and (b) being a
        // plain object, it completely replaced the computed
        // `{ resize: ... }` style outright rather than merging with it —
        // silently breaking `resize`/`autoResize` for any consumer who
        // also passed a `style` prop.
        style={style}
      >
        {/* `{...props}` is spread before the computed `aria-invalid` so a
            same-named prop a consumer passes can never silently override
            it — the JSX-attribute-ordering bug already found and fixed on
            Skeleton/ProgressBar/ProgressCircle/Spinner/Button/IconButton/
            Checkbox/FieldError/Input (05-component-api-conventions.md §3).
            `disabled`/`className`/`style`/`rows`/`maxLength`/`value`/
            `defaultValue`/`onClear`/`onInput` are already destructured out
            above, so they can't collide via the spread regardless of
            order — only `aria-invalid` was ever at risk here. */}
        <textarea
          ref={mergeRefs(ref, textareaRef)}
          disabled={disabled}
          className={cx(styles.textarea, onClear && styles.hasClear)}
          rows={rows}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          onInput={handleInput}
          style={{ resize: autoResize ? "none" : resize }}
          {...props}
          aria-invalid={hasError || undefined}
        />
        {showCountText && (
          <span className={styles.count}>
            {liveLength}/{maxLength}
          </span>
        )}
        {showClear && (
          <button
            type="button"
            aria-label="Clear"
            className={styles.clear}
            onClick={() => {
              onClear?.();
              textareaRef.current?.focus();
            }}
          >
            <Icon
              icon={XIcon}
              size={clearIconSizeForTextareaSize[size]}
              tone="brand"
            />
          </button>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
