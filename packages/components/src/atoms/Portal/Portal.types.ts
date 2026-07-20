import type { PortalProps as RadixPortalProps } from "@radix-ui/react-portal";
import type { ReactNode } from "react";

export interface PortalProps extends RadixPortalProps {
  /**
   * Element to portal children into. Ignored when `disablePortal` is true.
   * @default document.body
   */
  container?: Element | DocumentFragment | null;
  /** The content to render into `container` (or in place, if `disablePortal` is set). */
  children: ReactNode;
  /**
   * Renders `children` in place, with no portal and no wrapper element,
   * instead of moving them to `container`. Useful for print views, tests
   * that need the DOM structure kept in place, or conditionally disabling
   * portaling without the consumer having to branch around whether
   * `<Portal>` is rendered at all. `ref`, `container`, and other div props
   * are ignored in this mode since there's no element left to apply them to.
   * @default false
   */
  disablePortal?: boolean;
}
