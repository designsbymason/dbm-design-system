import { XIcon } from "@dbm-design-system/icons";
import { cx } from "@dbm-design-system/primitives";
import { forwardRef, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { Icon } from "../Icon";
import type { IconTone } from "../Icon";
import styles from "./Tag.module.css";
import type { TagProps, TagSize, TagTone, TagVariant } from "./Tag.types";

// text.on-{tone} (a text token, not an icon one) is what colors the label
// in these two states — solid always, outline once selected (it converges
// to solid's own look, see Tag.module.css). The icon must not just inherit
// that value via currentColor; it gets its own explicit icon.on-{tone}
// instead.
const onToneIcon: Record<TagTone, IconTone> = {
  brand: "on-brand",
  danger: "on-danger",
  warning: "on-warning",
  success: "on-success",
  info: "on-info",
  neutral: "on-neutral",
};

// `subtle`'s and unselected `outline`'s own label color is a plain
// text.{tone} (text.secondary for neutral, no text.neutral token exists)
// — same category problem, same fix, just the non-"on-" sibling since
// neither is a solid-fill pairing. Shared by both variants (2026-08-22 —
// outline's own icon was still inheriting currentColor until this pass,
// pending back when only subtle had been fixed), renamed from
// `subtleToneIcon` since it's no longer subtle-specific.
const standaloneToneIcon: Record<TagTone, IconTone> = {
  brand: "brand",
  danger: "danger",
  warning: "warning",
  success: "success",
  info: "info",
  neutral: "secondary",
};

const classFor: Record<TagVariant, Record<TagTone, string | undefined>> = {
  subtle: {
    brand: styles.subtleBrand,
    neutral: styles.subtleNeutral,
    info: styles.subtleInfo,
    success: styles.subtleSuccess,
    warning: styles.subtleWarning,
    danger: styles.subtleDanger,
  },
  solid: {
    brand: styles.solidBrand,
    neutral: styles.solidNeutral,
    info: styles.solidInfo,
    success: styles.solidSuccess,
    warning: styles.solidWarning,
    danger: styles.solidDanger,
  },
  outline: {
    brand: styles.outlineBrand,
    neutral: styles.outlineNeutral,
    info: styles.outlineInfo,
    success: styles.outlineSuccess,
    warning: styles.outlineWarning,
    danger: styles.outlineDanger,
  },
};

const sizeClass: Record<TagSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

// The remove control mirrors the same mapping — both it and leading/
// trailing are accessory glyphs flanking the label, sized identically for
// visual symmetry. Drives both remove-control code paths below (the
// decorative span and the locally-implemented button) directly, with zero
// extra padding around the glyph in either case.
const iconSizeForTagSize: Record<TagSize, "xs" | "sm" | "md"> = {
  xs: "xs",
  sm: "xs",
  md: "sm",
  lg: "md",
  xl: "md",
};

// Box dimensions for the remove control's real-`<button>` path (below) —
// keyed off the same `"xs" | "sm" | "md"` values `iconSizeForTagSize`
// produces, so the button's own clickable box always exactly matches its
// glyph, zero extra padding, same as the decorative-span path.
const removeButtonSizeClass: Record<"xs" | "sm" | "md", string | undefined> = {
  xs: styles.removeButtonSizeXs,
  sm: styles.removeButtonSizeSm,
  md: styles.removeButtonSizeMd,
};

/**
 * A labeled pill for categorization or active filters, with an optional
 * leading/trailing icon, an optional removable ("×") affordance, and an
 * optional clickable/selectable mode. Shares `Badge`'s tone scale but at
 * larger, touch-friendly sizes suited to interactive contexts like filter
 * bars — its own variant scale adds `outline` (a bordered, no-background
 * style) on top of the subtle/solid pair Badge also has.
 *
 * @example
 * ```tsx
 * <Tag tone="info">Design</Tag>
 * <Tag leadingIcon={TagIcon} tone="success" variant="solid">Shipped</Tag>
 * <Tag tone="brand" variant="outline">Beta</Tag>
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
      disabled = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const hasWarnedRemovableRef = useRef(false);
    const hasWarnedDisabledRef = useRef(false);

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
    // Only meaningful once the tag is already interactive — a plain
    // read-only (or merely removable-but-not-otherwise-interactive) tag
    // has nothing to disable, mirroring Avatar's own `disabled` gate.
    const isDisabled = isInteractive && disabled;

    if (process.env.NODE_ENV !== "production") {
      if (disabled && !isInteractive && !hasWarnedDisabledRef.current) {
        hasWarnedDisabledRef.current = true;
        console.warn(
          "Tag: `disabled` has no effect unless the tag is interactive — pass `onClick`, `selected`, `defaultSelected`, or `onSelectedChange` too, or remove `disabled`.",
        );
      }
    }
    // Every `TagVariant` now resolves to one of these two icon-tone
    // families — `solid` always, `outline` once selected (both real
    // solid-fill pairings); `subtle` always, `outline` unselected (both
    // standalone-on-a-non-solid-fill) — so this covers every case
    // directly, no `undefined` fallback left to reach (2026-08-22, once
    // outline's own unselected icon got the same fix subtle already had).
    const isOnSolidFill = variant === "solid" || (variant === "outline" && isSelected);
    const iconTone = isOnSolidFill ? onToneIcon[tone] : standaloneToneIcon[tone];

    const handleActivate = () => {
      if (isDisabled) return;
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
      // `removable` needs its own keyboard path here at all. `isDisabled`
      // itself already implies `isInteractive` (see its own definition
      // above), so this guard only ever actually blocks anything in
      // exactly the case it's meant to.
      if (
        !isDisabled &&
        removable &&
        (event.key === "Delete" || event.key === "Backspace")
      ) {
        event.preventDefault();
        onRemove?.();
      }
    };

    // Shared by both the decorative-glyph branch (interactive mode, where
    // `isDisabled` can be `true`) and the standalone-button branch
    // (non-interactive mode, where `isDisabled` is always `false` by
    // definition — `disabled` has no meaning without interactivity, see
    // `isDisabled`'s own definition above) — the guard here is a genuine
    // no-op in the latter case, not dead code: it documents that this
    // branch was deliberately never given its own separate disabled
    // concept, rather than silently omitting one.
    const handleRemoveClick = (event: MouseEvent<HTMLElement>) => {
      if (isDisabled) return;
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
        aria-disabled={isDisabled || undefined}
        onClick={isInteractive ? handleActivate : undefined}
        onKeyDown={isInteractive ? handleKeyDown : undefined}
        className={cx(
          styles.root,
          classFor[variant][tone],
          sizeClass[size],
          isInteractive && styles.interactive,
          isSelected && styles.selected,
          isDisabled && styles.disabled,
          className,
        )}
        {...props}
      >
        {leadingIcon && (
          <Icon icon={leadingIcon} size={iconSizeForTagSize[size]} tone={iconTone} />
        )}
        {children}
        {trailingIcon && (
          <Icon icon={trailingIcon} size={iconSizeForTagSize[size]} tone={iconTone} />
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
            // the real button below), with Delete/Backspace on the tag
            // itself (already focused, since interactive) as the keyboard
            // path — see `handleKeyDown` and `aria-keyshortcuts` above.
            <span
              aria-hidden="true"
              className={cx(styles.remove, styles.removeDecorative)}
              onClick={handleRemoveClick}
            >
              <Icon icon={XIcon} size={iconSizeForTagSize[size]} tone={iconTone} />
            </span>
          ) : (
            // Locally implemented rather than the shared `CloseButton`
            // atom (2026-08-25, CloseButton review — detached at explicit
            // direction): this control needs the exact same tone-matched
            // coloring as the decorative span above (`icon.{tone}` via
            // `iconTone`, not a fixed brand color), since it's an
            // accessory glyph of *this* tag, not a standalone dismiss
            // control — `CloseButton` itself is styled to match
            // `IconButton`'s brand-colored `tertiary` variant instead, for
            // its own standalone use (Toast/Alert/Dialog headers). This is
            // otherwise the same real, independently-focusable `<button>`
            // that branch always was, just implemented directly here:
            // there's no outer `role="button"` in this (non-interactive)
            // case for a nested real button to conflict with.
            <button
              type="button"
              aria-label={removeLabel ?? `Remove ${children?.toString() ?? ""}`}
              className={cx(
                styles.remove,
                styles.removeButton,
                removeButtonSizeClass[iconSizeForTagSize[size]],
              )}
              onClick={handleRemoveClick}
            >
              <Icon icon={XIcon} size={iconSizeForTagSize[size]} tone={iconTone} />
            </button>
          ))}
      </span>
    );
  },
);

Tag.displayName = "Tag";
