import { useEffect, useLayoutEffect, useState } from "react";
import type { Breakpoint, Responsive } from "../types/tokens";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Widest-first, matching the CSS cascade's mobile-first fallback (the
// largest matching breakpoint with a defined value wins).
const BREAKPOINT_QUERIES: readonly [key: Exclude<Breakpoint, "base">, string][] = [
  ["3xl", "(min-width: 1920px)"],
  ["2xl", "(min-width: 1536px)"],
  ["xl", "(min-width: 1280px)"],
  ["lg", "(min-width: 1024px)"],
  ["md", "(min-width: 768px)"],
  ["sm", "(min-width: 640px)"],
];

function resolve<T>(
  map: Partial<Record<Breakpoint, T>>,
  fallback: T,
  matches: (query: string) => boolean,
): T {
  for (const [key, query] of BREAKPOINT_QUERIES) {
    const entry = map[key];
    if (entry !== undefined && matches(query)) return entry;
  }
  return map.base ?? fallback;
}

/**
 * Resolves a `Responsive<T>` value (a plain value, or a mobile-first map
 * keyed by breakpoint) to its concrete, currently-active value via
 * `matchMedia` — for the cases where a responsive prop drives something
 * that can't be expressed as a CSS cascade alone (a static HTML/ARIA
 * attribute, or a value handed to a non-CSS positioning engine like Radix
 * Popper's `side`), unlike `responsiveStyle`, which generates per-breakpoint
 * CSS custom properties for a purely CSS-driven responsive value instead.
 *
 * Always resolves to `base` (or `fallback` if `base` isn't set) on the very
 * first render, matching what a server render produces, then corrects in a
 * layout effect immediately after mount — the same SSR-safe pattern
 * `ThemeProvider` uses for `mode="system"`. Extracted from `Divider`'s own
 * `useResolvedOrientation` (2026-09-17) once a second consumer (`Popover`'s
 * `side`) needed the identical resolution logic — `Divider`'s own
 * already-Finalized file is left as its own local implementation rather
 * than retroactively migrated onto this, per the standing rule that
 * Finalized components aren't touched without asking first.
 */
export function useResolvedResponsiveValue<T>(
  value: Responsive<T>,
  fallback: T,
): T {
  const isResponsive = typeof value === "object" && value !== null;
  const [resolved, setResolved] = useState<T>(() =>
    isResponsive
      ? ((value as Partial<Record<Breakpoint, T>>).base ?? fallback)
      : (value as T),
  );

  useIsomorphicLayoutEffect(() => {
    if (!isResponsive) {
      setResolved(value as T);
      return undefined;
    }

    const map = value as Partial<Record<Breakpoint, T>>;
    const update = () =>
      setResolved(resolve(map, fallback, (query) => window.matchMedia(query).matches));
    update();

    const mediaQueryLists = BREAKPOINT_QUERIES.map(([, query]) =>
      window.matchMedia(query),
    );
    mediaQueryLists.forEach((mql) => mql.addEventListener("change", update));
    return () =>
      mediaQueryLists.forEach((mql) =>
        mql.removeEventListener("change", update),
      );
  }, [
    isResponsive,
    isResponsive ? undefined : value,
    isResponsive ? (value as Partial<Record<Breakpoint, T>>).base : undefined,
    isResponsive ? (value as Partial<Record<Breakpoint, T>>).sm : undefined,
    isResponsive ? (value as Partial<Record<Breakpoint, T>>).md : undefined,
    isResponsive ? (value as Partial<Record<Breakpoint, T>>).lg : undefined,
    isResponsive ? (value as Partial<Record<Breakpoint, T>>).xl : undefined,
    isResponsive ? (value as Partial<Record<Breakpoint, T>>)["2xl"] : undefined,
    isResponsive ? (value as Partial<Record<Breakpoint, T>>)["3xl"] : undefined,
  ]);

  return resolved;
}
