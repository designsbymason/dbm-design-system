import type {
  Icon as PhosphorIcon,
  IconWeight,
} from "@dbm-design-system/icons";
import type { ComponentPropsWithoutRef, CSSProperties } from "react";

/** Icon size step, matching the primitive icon-size token scale. */
export type IconSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

/** Semantic icon color, matching the `--dbm-icon-*` token set. */
export type IconTone =
  | "default"
  | "secondary"
  | "brand"
  | "disabled"
  | "danger"
  | "warning"
  | "success"
  | "info"
  | "on-brand"
  | "on-danger"
  | "on-warning"
  | "on-success"
  | "on-info"
  | "on-neutral";

export interface IconProps extends Omit<
  ComponentPropsWithoutRef<"svg">,
  "color" | "role" | "aria-hidden" | "aria-label" | "children"
> {
  /**
   * The Phosphor icon component to render — a component reference, not a
   * string name, so unused icons stay tree-shaken and references are
   * type-checked.
   * @example
   * ```tsx
   * import { Wallet } from '@dbm-design-system/icons';
   * <Icon icon={Wallet} />
   * ```
   */
  icon: PhosphorIcon;
  /**
   * @default 'md'
   */
  size?: IconSize;
  /**
   * @default 'bold'
   */
  weight?: IconWeight;
  /**
   * Semantic color tone, mapped to the `--dbm-icon-*` token set. Omit to
   * inherit `currentColor` from surrounding context instead — the right
   * choice when an icon should always match whatever color its container
   * sets (e.g. a component whose own remove/dismiss affordance must track
   * its current tone rather than a fixed brand color). Prefer an explicit
   * `on-{tone}` tone over inheriting from a `text.on-{tone}` fill
   * specifically — `text.*` tokens are for text, not icons, even when the
   * color happens to match.
   */
  tone?: IconTone;
  /**
   * Accessible label. When omitted, the icon is treated as decorative and
   * hidden from the accessibility tree — set this whenever the icon
   * conveys meaning not already provided by adjacent text.
   */
  label?: string;
  /**
   * Flips the icon horizontally (Phosphor's own built-in mechanism, applied
   * as `transform: scale(-1, 1)`) — set this for a directional icon (an
   * arrow, a chevron) whose meaning should mirror under RTL. Whether a
   * given icon's rendered result *should* mirror is a per-usage judgment
   * call, not automatic — see `guidelines/adr/0009`.
   * @default false
   */
  mirrored?: boolean;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * component, or a test/router needs a stable anchor.
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
