import type { ComponentPropsWithoutRef, ReactNode } from "react";

export interface PortalProps extends ComponentPropsWithoutRef<"div"> {
  /**
   * Element to portal children into.
   * @default document.body
   */
  container?: Element | DocumentFragment | null;
  children: ReactNode;
}
