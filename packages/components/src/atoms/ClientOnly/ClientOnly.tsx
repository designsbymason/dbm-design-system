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
 * server rendering, then swaps to `children` once mounted on the client.
 * Use for content that depends on browser-only APIs or produces a different
 * result on the server than the client (e.g. `window`/`localStorage` reads,
 * non-deterministic random IDs), where rendering it during SSR would
 * otherwise cause a hydration mismatch. Purely behavioral — it renders no
 * DOM element of its own (children or fallback render directly), so it
 * takes no `ref` and has no CSS module.
 *
 * **The `fallback` phase is only actually observable while hydrating real
 * server-rendered HTML** (`hydrateRoot`, e.g. a Next.js/Astro SSR page) —
 * that's the only situation where a hydration mismatch is possible in the
 * first place, so it's the only situation where deferring to `fallback`
 * matters. A plain client-only render (`createRoot`, e.g. a CSR-only SPA,
 * this component's own Storybook preview, or `render()` in a unit test) has
 * no server HTML to reconcile against, so `children` render immediately
 * from the very first paint — `fallback` is never shown there. Confirmed
 * empirically, not assumed: a real `hydrateRoot` call shows `fallback`
 * synchronously and only swaps to `children` on a later, separate update,
 * while a plain `createRoot`/`render()` call shows `children` from the
 * start with no intermediate `fallback` frame at all.
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
