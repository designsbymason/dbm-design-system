import type { ReactNode } from "react";

export interface ClientOnlyProps {
  /**
   * Rendered once mounted on the client — immediately, in a plain
   * client-only render with no server HTML involved; after hydration
   * finishes, in a real SSR app.
   */
  children: ReactNode;
  /**
   * Rendered during server-side rendering and, while hydrating that server
   * HTML on the client, until hydration finishes. Not shown in a plain
   * client-only render (no SSR involved) — `children` render immediately
   * in that case, since there's no hydration mismatch to guard against.
   * @default null
   */
  fallback?: ReactNode;
}
