import type { Responsive } from "@dbm-design-system/primitives";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import type { ButtonSize, ButtonVariant } from "../../atoms/Button";

export type ButtonGroupOrientation = "horizontal" | "vertical";

export interface ButtonGroupProps
  extends Omit<ComponentPropsWithoutRef<"div">, "role"> {
  /**
   * The buttons to group: `Button`s and `IconButton`s, including ones wrapped for a tooltip or a menu
   * trigger (`asChild`). Anything else in the group is laid out but takes none of its settings.
   */
  children?: ReactNode;
  /**
   * The visual style every button in the group uses unless it sets its own `variant`. Left out, each
   * button keeps its own (`primary` by default). An attached group draws the separator between buttons
   * to suit each button's variant: a hairline of the surface between solid ones (`primary`, `destructive`), a
   * shared border between `secondary` ones, a faint rule between `tertiary` and `ghost` ones.
   */
  variant?: ButtonVariant;
  /**
   * The size every button in the group uses unless it sets its own `size`. Left out, each button keeps
   * its own (`md` by default).
   */
  size?: ButtonSize;
  /**
   * Gives the group fully rounded ends, a pill: the outer corners of the first and last button are
   * circular, and, attached, the corners where buttons meet stay square. Also the default for each
   * button's own `rounded`. Left out, each button keeps its own.
   */
  rounded?: boolean;
  /**
   * Disables every button in the group. A button that is disabled itself stays disabled either way.
   * @default false
   */
  disabled?: boolean;
  /**
   * Fuses the buttons into one segmented control: square corners where they meet, one separator between
   * them, no gap. `false` keeps them apart, spaced by a gap, and lets a horizontal group wrap onto more
   * lines when it doesn't fit.
   * @default true
   */
  attached?: boolean;
  /**
   * Lays the buttons out in a row or a column. Also takes a mobile-first map keyed by breakpoint, so a
   * row on a wide screen can stack on a phone (`{ base: "vertical", md: "horizontal" }`).
   * @default 'horizontal'
   */
  orientation?: Responsive<ButtonGroupOrientation>;
  /**
   * Stretches the group to the width of its container. A horizontal group shares that width equally
   * between its buttons; a vertical group makes every button as wide as the group already is.
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Names the group for assistive tech ("Text alignment", "Document actions") — announced when focus
   * enters it. Required unless `aria-labelledby` points at a visible label: a group with no name is just
   * a set of buttons.
   */
  "aria-label"?: string;
  /** The `id` of an already-visible element that names the group, in place of `aria-label`. */
  "aria-labelledby"?: string;
  /** The `id` of a helper text or description for the group. */
  "aria-describedby"?: string;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing. Rendered as the DOM `data-testid` attribute on the group's
   * element; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
