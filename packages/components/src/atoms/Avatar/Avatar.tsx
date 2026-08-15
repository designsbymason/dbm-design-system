import { UserIcon } from "@dbm-design-system/icons";
import { cx, responsiveStyle } from "@dbm-design-system/primitives";
import { forwardRef, useRef, useState } from "react";
import type {
  ComponentPropsWithRef,
  ElementType,
  MouseEvent,
  ReactElement,
} from "react";
import { Icon } from "../Icon";
import type { IconSize } from "../Icon";
import styles from "./Avatar.module.css";
import type { AvatarProps, AvatarSize, AvatarStatus } from "./Avatar.types";

type AvatarComponent = {
  <E extends ElementType = "span">(
    props: AvatarProps<E> & { ref?: ComponentPropsWithRef<E>["ref"] },
  ): ReactElement | null;
  displayName?: string;
};

// `size` drives three independent CSS custom properties (not one, unlike
// Stack's/Container's single-value responsive props) since each step
// bundles a dimension, a font size, and a status-dot size together —
// `responsiveStyle` is called once per property below, all three keyed off
// the same `size` value. See Avatar.module.css's `--avatar-*` custom
// properties and their breakpoint fallback chains (mirroring Stack's own).
const AVATAR_DIMENSION: Record<AvatarSize, string> = {
  xs: "var(--dbm-avatar-size-xs)",
  sm: "var(--dbm-avatar-size-sm)",
  md: "var(--dbm-avatar-size-md)",
  lg: "var(--dbm-avatar-size-lg)",
  xl: "var(--dbm-avatar-size-xl)",
};

const AVATAR_FONT_SIZE: Record<AvatarSize, string> = {
  xs: "var(--dbm-font-size-sm)",
  sm: "var(--dbm-font-size-base)",
  md: "var(--dbm-font-size-md)",
  lg: "var(--dbm-font-size-lg)",
  xl: "var(--dbm-font-size-xl)",
};

const AVATAR_STATUS_DOT_SIZE: Record<AvatarSize, string> = {
  xs: "var(--dbm-avatar-status-size-xs)",
  sm: "var(--dbm-avatar-status-size-sm)",
  md: "var(--dbm-avatar-status-size-md)",
  lg: "var(--dbm-avatar-status-size-lg)",
  xl: "var(--dbm-avatar-status-size-xl)",
};

// Roughly half the avatar's own box (initials text doesn't need this —
// its own font metrics already provide the inset), picked from the
// icon-size scale rather than the avatar's own size scale — the two are
// independent token sets, so this can't be derived arithmetically.
const fallbackIconSizeFor: Record<AvatarSize, IconSize> = {
  xs: "md",
  sm: "md",
  md: "lg",
  lg: "lg",
  xl: "xl",
};

const statusClass: Record<AvatarStatus, string | undefined> = {
  online: styles.statusOnline,
  offline: styles.statusOffline,
  busy: styles.statusBusy,
  away: styles.statusAway,
};

const statusLabel: Record<AvatarStatus, string> = {
  online: "Online",
  offline: "Offline",
  busy: "Busy",
  away: "Away",
};

// First + last word's first letter (e.g. "Jane Doe" -> "JD"); a single word
// just takes its own first letter (e.g. "Cher" -> "C") rather than its
// first two, matching the common convention (GitHub, Slack) over an
// arbitrary character count.
function initialsFromName(name: string): string | undefined {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return undefined;
  const first = words[0]?.[0];
  const last = words.length > 1 ? words[words.length - 1]?.[0] : undefined;
  const initials = last ? `${first}${last}` : first;
  return initials?.toUpperCase();
}

// `colorful`'s palette — each entry pairs a semantic "-subtle" background
// with its matching saturated text color, reusing existing, already
// contrast-verified tokens rather than inventing new ones (see
// Avatar.module.css's `.color*` classes for the exact numbers). `brand`
// needs no override class since it's `.content`'s own base style already.
const colorFamilies = ["brand", "danger", "warning", "success", "info"] as const;
type ColorFamily = (typeof colorFamilies)[number];
const colorClass: Partial<Record<ColorFamily, string>> = {
  danger: styles.colorDanger,
  warning: styles.colorWarning,
  success: styles.colorSuccess,
  info: styles.colorInfo,
};

// Small, fast, deterministic (not cryptographic) string hash — the same
// identity string always picks the same color family, which is the whole
// point of `colorful` ("different people, different but *stable* colors").
// No new dependency: this is the well-known djb2 hash, sized down to fit
// the palette via modulo.
function hashToColorFamily(identity: string): ColorFamily {
  let hash = 5381;
  for (let i = 0; i < identity.length; i++) {
    hash = (hash * 33) ^ identity.charCodeAt(i);
  }
  return colorFamilies[Math.abs(hash) % colorFamilies.length] as ColorFamily;
}

const AvatarImpl = forwardRef<HTMLElement, AvatarProps<ElementType>>(
  function Avatar(
    {
      as,
      src,
      alt,
      onError,
      loading,
      initials,
      name,
      colorful = false,
      size = "md",
      shape = "circle",
      status,
      disabled = false,
      className,
      style,
      onClick,
      "aria-label": ariaLabelProp,
      ...props
    },
    ref,
  ) {
    const Component = as ?? "span";
    // Same `any`-widening quirk as `resolvedStatus` below — re-typed
    // explicitly rather than indexed/called directly off the raw
    // destructured value.
    const onClickProp = onClick as
      | ((event: MouseEvent<HTMLElement>) => void)
      | undefined;
    // `disabled` only means anything once `as` has made this an
    // interactive element — the default `span` has no click/keyboard
    // behavior to block in the first place.
    const isInteractive = Boolean(as);
    const isDisabled = isInteractive && disabled;
    const handleClick = (event: MouseEvent<HTMLElement>) => {
      if (isDisabled) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      onClickProp?.(event);
    };

    // The generic icon fallback can't itself be responsive (`Icon` has no
    // `Responsive<T>` size prop) — resolved once from whichever step
    // applies at the `base` breakpoint, falling back to `md` if `size` is
    // a responsive map with no `base` entry of its own.
    const baseSize: AvatarSize =
      typeof size === "object" ? (size.base ?? "md") : size;
    // Explicitly re-typed, same reason as `baseSize` above: under the
    // polymorphic `AvatarProps<ElementType>` signature (unconstrained
    // `ElementType`), TS widens some destructured prop types to `any` —
    // confirmed via `tsup`'s DTS build (not caught by `.storybook`'s own
    // narrower typecheck), which flagged direct `statusLabel[status]`/
    // `statusClass[status]` indexing below as implicit-`any` lookups.
    const resolvedStatus: AvatarStatus | undefined = status;

    const [imageFailed, setImageFailed] = useState(false);
    // Resets the failure flag when `src` changes to a new URL, so a later
    // valid `src` isn't stuck showing the fallback forever because an
    // earlier, different URL once failed to load.
    const [prevSrc, setPrevSrc] = useState(src);
    if (src !== prevSrc) {
      setPrevSrc(src);
      setImageFailed(false);
    }
    const showImage = Boolean(src) && !imageFailed;

    // `name` is the convenience prop: fills in `initials`/`alt` when they
    // aren't explicitly provided, but never overrides either once given.
    const resolvedInitials = initials ?? (name ? initialsFromName(name) : undefined);
    const resolvedAlt = alt ?? name;
    const identity = name ?? alt ?? initials;
    const activeColorClass =
      colorful && identity ? colorClass[hashToColorFamily(identity)] : undefined;

    const hasWarnedSrcRef = useRef(false);
    const hasWarnedNoNameRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (src && !resolvedAlt && !hasWarnedSrcRef.current) {
        hasWarnedSrcRef.current = true;
        console.warn(
          "Avatar: `src` was provided without `alt` (or `name`) — screen readers won't have a name for this image until it loads (or a fallback name if it fails to).",
        );
      }
      if (
        !src &&
        !resolvedInitials &&
        !resolvedAlt &&
        !hasWarnedNoNameRef.current
      ) {
        hasWarnedNoNameRef.current = true;
        console.warn(
          "Avatar: rendering with no `src`, `initials`, `name`, or `alt` — this avatar has no accessible name at all. Pass `alt` (or `name`/`initials`) unless it's intentionally decorative.",
        );
      }
    }

    // When there's a real name (`alt`, possibly derived from `name`) *and*
    // a status, fold both into one accessible-name announcement instead of
    // two separate `role="img"` stops — confirmed live: "Jane Doe, image"
    // then "Online, image" back-to-back is noisy, especially across a list
    // of avatars. Without a name there's nothing to merge the status into,
    // so the dot keeps announcing itself separately, same as before
    // merging was added — folding it away in that case would silently
    // drop the only accessible signal this avatar has.
    const statusIsMerged = Boolean(resolvedAlt && resolvedStatus);
    const computedLabel =
      resolvedAlt && resolvedStatus
        ? `${resolvedAlt}, ${statusLabel[resolvedStatus]}`
        : resolvedAlt;
    // An explicit `aria-label` always wins over the computed name — but an
    // *empty string* is treated the same as not having provided one at all
    // (falls through to `computedLabel`), not as "deliberately blank."
    // Without this, an empty-string default (needed to keep this prop's
    // own Storybook control genuinely interactive rather than an inert
    // placeholder — see Avatar.stories.tsx) would silently null out the
    // Playground's own accessible name by default — confirmed live via a
    // real axe violation before this fallback was added.
    const combinedLabel = ariaLabelProp || computedLabel;
    // Only pair `role="img"` with `aria-label` when there's an actual name
    // to give it — an unlabeled `role="img"` wouldn't expose the visible
    // initials text as a fallback name (img-role elements aren't named
    // from their content), so omitting the role in that case preserves the
    // existing "read the initials themselves" behavior.
    const hasAccessibleName = !showImage && Boolean(combinedLabel);
    // `role="img"` is only valid on the default `<span>` — confirmed via a
    // real axe "aria-allowed-role" violation once `as="button"` existed:
    // ARIA doesn't permit overriding a native interactive element's own
    // role (button/link/etc.) with `img`, since that would hide the
    // element's actual interactive semantics from assistive tech. `as`
    // being set means the consumer deliberately chose different native
    // semantics, so this defers to those instead — `aria-label` still
    // applies regardless, since it's valid on (and useful for) any element.
    const canUseImgRole = !as;

    return (
      <Component
        ref={ref}
        role={hasAccessibleName && canUseImgRole ? "img" : undefined}
        aria-label={hasAccessibleName ? combinedLabel : undefined}
        // Native `disabled` only applies where the DOM actually supports
        // it — `as="button"` specifically. Every other interactive `as`
        // (an `<a>`, a router `Link`, ...) relies on `aria-disabled` plus
        // `handleClick`'s own guard instead, mirroring `Button`'s
        // `asChild`-disabled handling for the same underlying reason: you
        // can't rely on a native attribute an arbitrary element might not
        // support.
        disabled={as === "button" ? isDisabled : undefined}
        aria-disabled={isDisabled || undefined}
        onClick={isInteractive ? handleClick : onClickProp}
        className={cx(
          styles.root,
          shape === "square" && styles.rootSquare,
          isInteractive && styles.interactive,
          isDisabled && styles.disabled,
          className,
        )}
        style={{
          ...responsiveStyle(
            size,
            "--avatar-dimension",
            (value: AvatarSize) => AVATAR_DIMENSION[value],
          ),
          ...responsiveStyle(
            size,
            "--avatar-font-size",
            (value: AvatarSize) => AVATAR_FONT_SIZE[value],
          ),
          ...responsiveStyle(
            size,
            "--avatar-status-size",
            (value: AvatarSize) => AVATAR_STATUS_DOT_SIZE[value],
          ),
          ...style,
        }}
        {...props}
      >
        {/*
          The circular/square clip lives here, one level in from `root` —
          `root` itself stays unclipped so the status dot (a sibling of this
          span, not a child) can sit at `root`'s bounding-box corner without
          being cut off. A circle's arc doesn't reach its own bounding-box
          corner, so when the clip and the dot shared one element, the
          corner-positioned dot fell partly outside the circle and got
          clipped by that same element's `overflow: hidden` — confirmed live
          (circle shape only; square's corner has no such gap).
        */}
        <span
          className={cx(
            styles.content,
            shape === "square" && styles.shapeSquare,
            !showImage && activeColorClass,
          )}
        >
          {showImage ? (
            <img
              src={src}
              alt={resolvedAlt ?? ""}
              aria-label={
                statusIsMerged || ariaLabelProp ? combinedLabel : undefined
              }
              loading={loading}
              className={styles.image}
              onError={(event) => {
                setImageFailed(true);
                onError?.(event);
              }}
            />
          ) : resolvedInitials ? (
            <span aria-hidden={combinedLabel ? true : undefined}>
              {resolvedInitials}
            </span>
          ) : (
            <Icon icon={UserIcon} size={fallbackIconSizeFor[baseSize]} />
          )}
        </span>
        {resolvedStatus &&
          (statusIsMerged ? (
            <span
              className={cx(styles.status, statusClass[resolvedStatus])}
              aria-hidden="true"
            />
          ) : (
            <span
              className={cx(styles.status, statusClass[resolvedStatus])}
              role="img"
              aria-label={statusLabel[resolvedStatus]}
            />
          ))}
      </Component>
    );
  },
);

/**
 * A person/entity avatar — renders an image, falling back to initials (and
 * falling back again to a generic person icon if there are no initials
 * either), with an optional presence status dot. Polymorphic via `as` —
 * render as a `<button>` or other interactive element to make the avatar
 * itself a trigger (e.g. a profile menu), while keeping all of its own
 * generated content exactly as-is (the same pattern `Stack`/`Container`/
 * `GridItem` use).
 *
 * @example
 * ```tsx
 * <Avatar src="/user.jpg" alt="Jane Doe" initials="JD" status="online" />
 * <Avatar alt="Jane Doe" shape="square" />
 * <Avatar as="button" alt="Jane Doe" initials="JD" onClick={openProfileMenu} />
 * ```
 */
export const Avatar = AvatarImpl as AvatarComponent;

Avatar.displayName = "Avatar";
