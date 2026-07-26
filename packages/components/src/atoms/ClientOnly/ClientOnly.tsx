import { useSyncExternalStore } from "react";
import type { ClientOnlyProps } from "./ClientOnly.types";

// No external store actually changes here — this never notifies, so the
// snapshot is only ever read once per render. `useSyncExternalStore` is
// used purely for its client/server snapshot split, which is the
// React-recommended way to detect "has this mounted on the client yet"
// without the cascading extra render an effect + setState causes (and
// without a hydration-mismatch risk, since it's the same mechanism
// `useId`/`useDeferredValue`-style APIs use internally).
const subscribe = () => () => {};

function useHasMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

/**
 * An SSR-safe render guard — renders `fallback` (`null` by default) during
 * server rendering and the very first client render, then swaps to
 * `children` after mounting. Use for content that depends on browser-only
 * APIs or produces a different result on the server than the client (e.g.
 * `window`/`localStorage` reads, non-deterministic random IDs), where
 * rendering it during SSR would otherwise cause a hydration mismatch.
 * Purely behavioral — it renders no DOM element of its own (children or
 * fallback render directly), so it takes no `ref` and has no CSS module.
 *
 * @example
 * ```tsx
 * <ClientOnly fallback={<Skeleton variant="rectangular" />}>
 *   <ChartThatReadsWindowWidth />
 * </ClientOnly>
 * ```
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const hasMounted = useHasMounted();
  return <>{hasMounted ? children : fallback}</>;
}
