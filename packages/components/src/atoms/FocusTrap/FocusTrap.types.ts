import type { FocusScopeProps as RadixFocusScopeProps } from "@radix-ui/react-focus-scope";
import type { CSSProperties, ReactNode } from "react";

export interface FocusTrapProps extends RadixFocusScopeProps {
  /** The content focus is managed/trapped within. */
  children: ReactNode;
  /**
   * When `true`, tabbing from the last focusable element focuses the first
   * (and shift+tab from the first focuses the last).
   * @default false
   */
  loop?: boolean;
  /**
   * When `true`, focus cannot escape the trap via keyboard, pointer, or a
   * programmatic focus call.
   * @default false
   */
  trapped?: boolean;
  /** Called when focus moves into the trap on mount. Can be prevented. */
  onMountAutoFocus?: (event: Event) => void;
  /** Called when focus moves out of the trap on unmount. Can be prevented. */
  onUnmountAutoFocus?: (event: Event) => void;
  /**
   * Merges the trap's focus-management behavior directly onto `children`
   * instead of rendering an extra wrapping `<div>` around it — useful when
   * `children` is already the element that should own the trap's boundary
   * (a dialog's own root element), avoiding a redundant nested `<div>`.
   * `children` must be a single valid element when this is set (Radix's own
   * `Slot` requirement, enforced at runtime); the default (unset) mode
   * accepts any number of children.
   * @default false
   */
  asChild?: boolean;
  /**
   * Standard DOM id. Needed when another element's `aria-labelledby`/
   * `aria-describedby` must point at this component, or a test/router
   * needs a stable anchor.
   */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
