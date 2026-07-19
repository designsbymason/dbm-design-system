import { cx } from "@dbm-design-system/primitives";
import { forwardRef, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ThemeContext } from "./ThemeContext";
import styles from "./ThemeProvider.module.css";
import type { ThemeProviderProps } from "./ThemeProvider.types";

/**
 * `useLayoutEffect` on the client, `useEffect` on the server — avoids React's
 * "useLayoutEffect does nothing on the server" warning while still resolving
 * synchronously after commit but before paint on the client, which is what
 * keeps the flash-of-unthemed-content window as small as possible.
 */
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Used only if `--dbm-motion-duration-base` can't be read (token CSS not loaded yet). */
const FALLBACK_THEME_TRANSITION_MS = 200;

function getThemeTransitionDurationMs(): number {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--dbm-motion-duration-base")
    .trim();
  const parsed = Number.parseFloat(raw);
  return Number.isNaN(parsed) ? FALLBACK_THEME_TRANSITION_MS : parsed;
}

/**
 * Applies a DBM Design System brand + color mode by setting `data-theme` on
 * the document element (e.g. `data-theme="purple-light"`), matching the
 * `:root[data-theme="..."]`-scoped CSS custom properties emitted by
 * `@dbm-design-system/tokens`.
 *
 * Theming is applied document-wide — not scoped to this component's own DOM
 * subtree — so that portaled content (dialogs, tooltips, toasts mounted on
 * `document.body`) inherits the theme correctly. The component still renders
 * a `display: contents` wrapper around `children` so it has a DOM node to
 * forward its ref to, per this system's component conventions. Nesting is
 * supported: an inner `ThemeProvider` restores whatever value was on
 * `document.documentElement` before it mounted when it unmounts, so control
 * correctly hands back to an outer provider instead of leaving a stale value.
 *
 * `mode="system"` always renders `light` on the very first render (matching
 * what a server render produces) and corrects to the real OS preference in a
 * layout effect immediately after mount, before the browser paints. This
 * keeps the server's and the client's first render in agreement — no React
 * hydration mismatch — at the cost of resolving the real preference just
 * after mount rather than before it. On a true SSR app this means the very
 * first server-rendered paint can briefly show the `light` theme before
 * hydration corrects it; a fully flash-free SSR experience needs a blocking
 * pre-hydration script outside this component's control (the same tradeoff
 * documented by libraries like `next-themes`).
 *
 * Descendants can read the resolved brand/mode reactively via `useTheme()`
 * instead of reaching into the DOM directly.
 *
 * Any brand/mode change *after* the initial mount briefly transitions every
 * themed surface's `background-color`/`border-color`/`color`/`box-shadow`
 * (duration from `--dbm-motion-duration-base`, skipped under
 * `prefers-reduced-motion: reduce`) instead of hard-cutting to the new
 * colors. The initial mount is intentionally excluded so first paint never
 * fades in.
 *
 * @example
 * ```tsx
 * <ThemeProvider brand="emerald" mode="dark">
 *   <App />
 * </ThemeProvider>
 * ```
 */
export const ThemeProvider = forwardRef<HTMLDivElement, ThemeProviderProps>(
  ({ brand = "purple", mode = "system", className, children, ...props }, ref) => {
    const [systemMode, setSystemMode] = useState<"light" | "dark">("light");
    const isInitialThemeRef = useRef(true);

    useIsomorphicLayoutEffect(() => {
      if (mode !== "system") return undefined;

      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (event: MediaQueryListEvent) => {
        setSystemMode(event.matches ? "dark" : "light");
      };

      setSystemMode(mediaQuery.matches ? "dark" : "light");
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }, [mode]);

    const resolvedMode = mode === "system" ? systemMode : mode;
    const theme = `${brand}-${resolvedMode}`;

    useIsomorphicLayoutEffect(() => {
      const root = document.documentElement;
      const previousTheme = root.dataset.theme;
      root.dataset.theme = theme;
      return () => {
        if (previousTheme === undefined) {
          delete root.dataset.theme;
        } else {
          root.dataset.theme = previousTheme;
        }
      };
    }, [theme]);

    useIsomorphicLayoutEffect(() => {
      if (isInitialThemeRef.current) {
        isInitialThemeRef.current = false;
        return undefined;
      }

      const root = document.documentElement;
      // Non-null: `.themeTransition` is a literal class this component's own
      // CSS module always defines — `noUncheckedIndexedAccess` can't know
      // that a specific key of the generic CSS-module index type is present.
      const transitionClass = styles.themeTransition!;
      root.classList.add(transitionClass);
      const timeoutId = window.setTimeout(() => {
        root.classList.remove(transitionClass);
      }, getThemeTransitionDurationMs());

      return () => {
        window.clearTimeout(timeoutId);
        root.classList.remove(transitionClass);
      };
    }, [theme]);

    const contextValue = useMemo(() => ({ brand, mode, resolvedMode }), [brand, mode, resolvedMode]);

    return (
      <ThemeContext.Provider value={contextValue}>
        <div ref={ref} className={cx(styles.root, className)} data-theme={theme} {...props}>
          {children}
        </div>
      </ThemeContext.Provider>
    );
  },
);

ThemeProvider.displayName = "ThemeProvider";
