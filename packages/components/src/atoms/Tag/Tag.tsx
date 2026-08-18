import { XIcon } from "@dbm-design-system/icons";
import { cx } from "@dbm-design-system/primitives";
import { forwardRef, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { CloseButton } from "../CloseButton";
import { Icon } from "../Icon";
import styles from "./Tag.module.css";
import type { TagProps, TagSize, TagTone, TagVariant } from "./Tag.types";

const classFor: Record<TagVariant, Record<TagTone, string | undefined>> = {
  subtle: {
    neutral: styles.subtleNeutral,
    info: styles.subtleInfo,
    success: styles.subtleSuccess,
    warning: styles.subtleWarning,
    danger: styles.subtleDanger,
  },
  solid: {
    neutral: styles.solidNeutral,
    info: styles.solidInfo,
    success: styles.solidSuccess,
    warning: styles.solidWarning,
    danger: styles.solidDanger,
  },
};

const sizeClass: Record<TagSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

// The remove button mirrors the same mapping — both are accessory glyphs
// flanking the label, sized the same way for visual symmetry.
const iconSizeForTagSize: Record<TagSize, "xs" | "sm" | "md"> = {
  xs: "xs",
  sm: "xs",
  md: "sm",
  lg: "md",
  xl: "md",
};

const removeSizeForTagSize: Record<TagSize, "xs" | "sm" | "md"> =
  iconSizeForTagSize;

/**
 * A labeled pill for categorization or active filters, with an optional
 * leading/trailing icon, an optional removable ("×") affordance, and an
 * optional clickable/selectable mode. Shares `Badge`'s tone/variant scale
 * but at larger, touch-friendly sizes suited to interactive contexts like
 * filter bars.
 *
 * @example
 * ```tsx
 * <Tag tone="info">Design</Tag>
 * <Tag leadingIcon={TagIcon} tone="success" variant="solid">Shipped</Tag>
 * <Tag trailingIcon={CaretDownIcon}>Sort by</Tag>
 * <Tag removable onRemove={() => removeFilter('status')}>Status: Active</Tag>
 * <Tag selected={isActive} onSelectedChange={setIsActive}>Design</Tag>
 * ```
 */
export const Tag = forwardRef<HTMLSpanElement, TagProps>(
  (
    {
      tone = "neutral",
      variant = "subtle",
      size = "md",
      leadingIcon,
      trailingIcon,
      removable = false,
      onRemove,
      removeLabel,
      onClick,
      selected,
      defaultSelected,
      onSelectedChange,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const hasWarnedRemovableRef = useRef(false);

    if (process.env.NODE_ENV !== "production") {
      if (removable && !onRemove && !hasWarnedRemovableRef.current) {
        hasWarnedRemovableRef.current = true;
        console.warn(
          "Tag: `removable` is set without `onRemove` — the remove button will render but clicking it will do nothing. Pass `onRemove` to handle the click, or remove `removable`.",
        );
      }
    }

    // Only `selected`/`defaultSelected`/`onSelectedChange` opt the tag into
    // toggle semantics — checked before `defaultSelected`'s own fallback
    // to `false` below, so an omitted `defaultSelected` doesn't masquerade
    // as "selectable."
    const isSelectable =
      selected !== undefined ||
      defaultSelected !== undefined ||
      onSelectedChange !== undefined;
    const isSelectionControlled = selected !== undefined;
    const [uncontrolledSelected, setUncontrolledSelected] = useState(
      defaultSelected ?? false,
    );
    const isSelected = isSelectionControlled ? selected : uncontrolledSelected;
    const isInteractive = isSelectable || onClick !== undefined;

    const handleActivate = () => {
      if (isSelectable) {
        const next = !isSelected;
        if (!isSelectionControlled) {
          setUncontrolledSelected(next);
        }
        onSelectedChange?.(next);
      }
      onClick?.();
    };

    // Guards against the nested remove button's own Enter/Space keydown
    // bubbling up here and double-firing activation — keyboard focus can
    // only be on one element at a time, so `target === currentTarget`
    // precisely distinguishes "the tag itself is focused" from "a focused
    // descendant's keydown bubbling through." Real mouse clicks don't need
    // the same guard: the remove button's own click handler below already
    // calls `stopPropagation`, which fully prevents a click from bubbling
    // here in the first place.
    const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
      if (event.target !== event.currentTarget) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleActivate();
        return;
      }
      // Only reachable when `isInteractive` (this handler isn't attached
      // otherwise) — see the decorative-remove-icon branch below for why
      // `removable` needs its own keyboard path here at all.
      if (removable && (event.key === "Delete" || event.key === "Backspace")) {
        event.preventDefault();
        onRemove?.();
      }
    };

    const handleRemoveClick = (event: MouseEvent<HTMLElement>) => {
      event.stopPropagation();
      onRemove?.();
    };

    return (
      <span
        ref={ref}
        role={isInteractive ? "button" : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        aria-pressed={isSelectable ? isSelected : undefined}
        // Screen-reader-discoverable annotation for the Delete/Backspace
        // path below — only relevant in the combined mode, where the
        // remove affordance can't be its own separately-focusable control
        // (see that branch's own comment for why).
        aria-keyshortcuts={
          isInteractive && removable ? "Delete Backspace" : undefined
        }
        onClick={isInteractive ? handleActivate : undefined}
        onKeyDown={isInteractive ? handleKeyDown : undefined}
        className={cx(
          styles.root,
          classFor[variant][tone],
          sizeClass[size],
          isInteractive && styles.interactive,
          isSelected && styles.selected,
          className,
        )}
        {...props}
      >
        {leadingIcon && (
          <Icon icon={leadingIcon} size={iconSizeForTagSize[size]} />
        )}
        {children}
        {trailingIcon && (
          <Icon icon={trailingIcon} size={iconSizeForTagSize[size]} />
        )}
        {removable &&
          (isInteractive ? (
            // A real, independently-focusable `<button>` nested inside
            // this span's own `role="button"` (once `isInteractive`) is a
            // genuine WCAG/ARIA violation — confirmed via axe's
            // "nested-interactive" rule, not assumed — since AT then sees
            // two overlapping interactive controls with no way to tell
            // they're related. Rendered as a plain, non-focusable,
            // `aria-hidden` decorative glyph instead: still clickable by
            // mouse (`handleRemoveClick`, same `stopPropagation` guard as
            // the real `CloseButton` below), with Delete/Backspace on the
            // tag itself (already focused, since interactive) as the
            // keyboard path — see `handleKeyDown` and `aria-keyshortcuts`
            // above.
            <span
              aria-hidden="true"
              className={cx(styles.remove, styles.removeDecorative)}
              onClick={handleRemoveClick}
            >
              <Icon icon={XIcon} size={iconSizeForTagSize[size]} />
            </span>
          ) : (
            <CloseButton
              aria-label={removeLabel ?? `Remove ${children?.toString() ?? ""}`}
              size={removeSizeForTagSize[size]}
              className={styles.remove}
              onClick={handleRemoveClick}
            />
          ))}
      </span>
    );
  },
);

Tag.displayName = "Tag";
