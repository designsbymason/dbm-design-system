import { useEffect, useLayoutEffect, useState } from "react";
import type { Responsive } from "@dbm-design-system/primitives";
import type { DividerOrientation } from "./Divider.types";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Widest-first, matching the CSS cascade's mobile-first fallback (the
// largest matching breakpoint with a defined value wins).
const BREAKPOINT_QUERIES: readonly [
  key: "3xl" | "2xl" | "xl" | "lg" | "md" | "sm",
  string,
][] = [
  ["3xl", "(min-width: 1920px)"],
  ["2xl", "(min-width: 1536px)"],
  ["xl", "(min-width: 1280px)"],
  ["lg", "(min-width: 1024px)"],
  ["md", "(min-width: 768px)"],
  ["sm", "(min-width: 640px)"],
];

function resolve(
  map: Partial<Record<string, DividerOrientation>>,
  matches: (query: string) => boolean,
): DividerOrientation {
  for (const [key, query] of BREAKPOINT_QUERIES) {
    const entry = map[key];
    if (entry !== undefined && matches(query)) return entry;
  }
  return map.base ?? "horizontal";
}

/**
 * `aria-orientation` is a static HTML attribute — it can't track a CSS
 * media-query cascade the way `orientation`'s visual styling does. This
 * resolves a responsive `orientation` value to its concrete,
 * currently-active value via `matchMedia`, so the ARIA attribute stays
 * correct at every breakpoint instead of only ever reflecting `base`.
 *
 * Always resolves to `base` on the very first render (matching what a
 * server render produces), then corrects in a layout effect immediately
 * after mount — the same SSR-safe pattern `ThemeProvider` uses for
 * `mode="system"`. The *visual* orientation is driven separately, entirely
 * by CSS (see Divider.module.css), so it never depends on this JS timing —
 * only the ARIA attribute does, since CSS genuinely can't reach it.
 */
export function useResolvedOrientation(
  value: Responsive<DividerOrientation>,
): DividerOrientation {
  const isResponsive = typeof value === "object" && value !== null;
  const [resolved, setResolved] = useState<DividerOrientation>(() =>
    isResponsive ? (value.base ?? "horizontal") : value,
  );

  useIsomorphicLayoutEffect(() => {
    if (!isResponsive) {
      setResolved(value);
      return undefined;
    }

    const update = () =>
      setResolved(resolve(value, (query) => window.matchMedia(query).matches));
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
    isResponsive ? value.base : undefined,
    isResponsive ? value.sm : undefined,
    isResponsive ? value.md : undefined,
    isResponsive ? value.lg : undefined,
    isResponsive ? value.xl : undefined,
    isResponsive ? value["2xl"] : undefined,
    isResponsive ? value["3xl"] : undefined,
  ]);

  return resolved;
}
