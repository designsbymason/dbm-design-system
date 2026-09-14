import { MagnifyingGlassIcon } from "@dbm-design-system/icons";
import { forwardRef, useEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { Icon } from "../../atoms/Icon";
import { Input } from "../../atoms/Input";
import type { InputSize } from "../../atoms/Input";
import { Spinner } from "../../atoms/Spinner";
import type { SearchInputProps } from "./SearchInput.types";

// Shared with Input's own trailing clear-icon convention
// (`clearIconSizeForInputSize`, Input.tsx) — the leading slot here plays the
// same visual role (one size step down from SearchInput's own `size`), and
// the scale happens to cover every size `Spinner` itself accepts too, so
// one map serves both the icon and the loading-spinner branch below.
const prefixSizeForInputSize: Record<InputSize, "xs" | "sm" | "md" | "lg"> = {
  xs: "xs",
  sm: "xs",
  md: "sm",
  lg: "md",
  xl: "lg",
};

/**
 * A search input wrapping `Input`: a fixed leading search icon (swapped for
 * a spinner via `isLoading`), a clear button, and a debounced `onSearch`
 * callback separate from the raw, per-keystroke `onChange`. `onSearch` also
 * fires immediately — bypassing any pending debounce — on Enter and when
 * the value is cleared (via the clear button or Escape), since those are
 * both "I want an answer right now" moments a debounce should never delay.
 * This component tracks its own value (controlled or not), so the built-in
 * clear button — shown whenever `onClear` is passed — always actually
 * clears it, the same contract `NumberInput`'s own `onClear` establishes.
 * `ref` forwards to the native `<input>` element, same as `Input`'s own.
 *
 * @example
 * ```tsx
 * <SearchInput aria-label="Search" placeholder="Search…" onSearch={runSearch} />
 * <SearchInput aria-label="Search" isLoading onSearch={runSearch} />
 * <SearchInput aria-label="Search" debounceMs={0} onSearch={runSearch} />
 * <SearchInput
 *   aria-label="Search"
 *   value={query}
 *   onChange={(e) => setQuery(e.target.value)}
 *   onSearch={runSearch}
 *   onClear={() => setQuery("")}
 * />
 * ```
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      size = "md",
      value,
      defaultValue,
      onChange,
      onSearch,
      debounceMs = 300,
      onClear,
      isLoading = false,
      disabled,
      readOnly,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const isControlled = value !== undefined;
    const [uncontrolledValue, setUncontrolledValue] = useState(() =>
      defaultValue !== undefined ? String(defaultValue) : "",
    );
    const effectiveValue = isControlled ? String(value) : uncontrolledValue;

    // Tracks the pending debounce timer so a later keystroke (or an
    // immediate trigger — Enter, clearing) can cancel it rather than
    // letting a stale `onSearch` fire after the fact.
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => {
      return () => {
        if (timeoutRef.current !== undefined) clearTimeout(timeoutRef.current);
      };
    }, []);

    const fireSearchNow = (next: string) => {
      if (timeoutRef.current !== undefined) clearTimeout(timeoutRef.current);
      onSearch?.(next);
    };

    const scheduleSearch = (next: string) => {
      if (timeoutRef.current !== undefined) clearTimeout(timeoutRef.current);
      if (debounceMs <= 0) {
        onSearch?.(next);
        return;
      }
      timeoutRef.current = setTimeout(() => onSearch?.(next), debounceMs);
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      if (!isControlled) setUncontrolledValue(next);
      onChange?.(event);
      scheduleSearch(next);
    };

    // Unlike Input's own `onClear` — a bare notification with no value of
    // its own to clear — SearchInput tracks its own value (controlled or
    // not), so the clear button needs to actually reset it, the same
    // reasoning as NumberInput's own `handleClear` (see that component for
    // the full explanation of why Input's own pass-through alone isn't
    // enough).
    const handleClear = () => {
      if (!isControlled) setUncontrolledValue("");
      onClear?.();
      fireSearchNow("");
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        fireSearchNow(effectiveValue);
      } else if (event.key === "Escape" && onClear && effectiveValue !== "") {
        // Stops here rather than also bubbling to, say, a parent Dialog's
        // own Escape-to-close handler — clearing an active query takes
        // priority over dismissing the surrounding surface, matching the
        // common platform convention (macOS Spotlight, browser omnibars).
        event.stopPropagation();
        handleClear();
      }
      onKeyDown?.(event);
    };

    return (
      <Input
        ref={ref}
        {...props}
        type="search"
        size={size}
        disabled={disabled}
        readOnly={readOnly}
        value={effectiveValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClear={onClear ? handleClear : undefined}
        prefix={
          isLoading ? (
            <Spinner size={prefixSizeForInputSize[size]} />
          ) : (
            <Icon
              icon={MagnifyingGlassIcon}
              size={prefixSizeForInputSize[size]}
              tone="default"
            />
          )
        }
      />
    );
  },
);

SearchInput.displayName = "SearchInput";
