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
 * A dedicated dismiss control — a small, icon-only button defaulting to
 * `aria-label="Close"` (override for context, e.g. "Dismiss notification")
 * and a square-ish shape (pass `rounded` for a circle), with an optional
 * translucent grounding layer (`hasBackground`) for use over unpredictable
 * external content. Styled to match
 * `IconButton`'s own `tertiary` variant exactly (transparent at rest,
 * `icon.brand` icon color, `bg.brand-subtle-hover` on hover, the same box
 * sizing, and the same `rounded` prop/default) — not a context-adaptive
 * control. Reserved for surfaces where a modal-style overlay is involved
 * (Dialog, Drawer, lightbox, and similar cards/panels), which have no local
 * tone of their own to track. A component whose own tone/color varies per
 * instance (Tag, Alert, Toast) implements its own local remove/dismiss
 * button instead of reusing this one — see `Tag`'s own removable variant
 * for the established pattern, and `05-component-api-conventions.md` §10
 * for the full rule. Default to that local pattern unless `CloseButton` is
 * explicitly what's wanted.
 *
 * @example
 * ```tsx
 * <CloseButton onClick={() => setOpen(false)} />
 * <CloseButton size="sm" aria-label="Dismiss notification" onClick={onDismiss} />
 * <CloseButton rounded aria-label="Close" onClick={() => setOpen(false)} />
 * <CloseButton hasBackground aria-label="Close" onClick={() => setOpen(false)} />
 * ```
 */
export const CloseButton = forwardRef<HTMLButtonElement, CloseButtonProps>(
  (
    {
      size = "md",
      rounded = false,
      hasBackground = false,
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
      className={cx(
        styles.root,
        sizeClass[size],
        rounded && styles.rounded,
        hasBackground && styles.hasBackground,
        className,
      )}
      {...props}
    >
      <Icon icon={XIcon} size={size} />
    </button>
  ),
);

CloseButton.displayName = "CloseButton";
