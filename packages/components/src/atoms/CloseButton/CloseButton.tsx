import { XIcon } from "@dbm-design-system/icons";
import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import type { ButtonSize } from "../Button/Button.types";
import { Icon } from "../Icon";
import styles from "./CloseButton.module.css";
import type { CloseButtonProps } from "./CloseButton.types";

const sizeClass: Record<ButtonSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

/**
 * A dedicated dismiss control — a small, circular, icon-only button
 * defaulting to `aria-label="Close"` (override for context, e.g. "Dismiss
 * notification"). Styled to match `IconButton`'s own `tertiary` variant
 * exactly (transparent at rest, `icon.brand` icon color, `bg.brand-subtle-
 * hover` on hover, and the same box sizing) — the standalone dismiss
 * control for genuinely standalone surfaces (Toast/Alert/Dialog headers),
 * not a context-adaptive one. A component that needs its remove/dismiss
 * affordance to match its own local tone (e.g. `Tag`) implements that
 * locally rather than reusing this component.
 *
 * @example
 * ```tsx
 * <CloseButton onClick={() => setOpen(false)} />
 * <CloseButton size="sm" aria-label="Dismiss notification" onClick={onDismiss} />
 * ```
 */
export const CloseButton = forwardRef<HTMLButtonElement, CloseButtonProps>(
  (
    {
      size = "md",
      className,
      type = "button",
      "aria-label": ariaLabel,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      aria-label={ariaLabel ?? "Close"}
      className={cx(styles.root, sizeClass[size], className)}
      {...props}
    >
      <Icon icon={XIcon} size={size} />
    </button>
  ),
);

CloseButton.displayName = "CloseButton";
