import type { ReactNode } from "react";

export interface ClientOnlyProps {
  /** Rendered only after mounting on the client. */
  children: ReactNode;
  /** Rendered during SSR and on the very first client render, before mount. */
  fallback?: ReactNode;
}
