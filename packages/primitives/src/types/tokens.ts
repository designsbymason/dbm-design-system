/**
 * Shared token-derived types used across multiple components' props, kept
 * here instead of inside any single component's own types file so components
 * don't end up importing from one another just to reuse these.
 */

/** A spacing scale step, matching the primitive spacing token steps. */
export type SpaceValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 32;

/** A breakpoint step, matching the primitive breakpoint tokens. */
export type Breakpoint = "base" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

/** A single value, or a mobile-first responsive map keyed by breakpoint. */
export type Responsive<T> = T | Partial<Record<Breakpoint, T>>;
