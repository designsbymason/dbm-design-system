import { cx, mergeDefined } from "@dbm-design-system/primitives";
import { Children, forwardRef, isValidElement, useEffect, useMemo } from "react";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import { Avatar } from "../../atoms/Avatar";
import type { AvatarShape } from "../../atoms/Avatar";
import { AvatarGroupProvider, useAvatarGroup } from "../../atoms/Avatar/avatarGroupContext";
import styles from "./AvatarGroup.module.css";
import type { AvatarGroupLabels, AvatarGroupProps } from "./AvatarGroup.types";

const defaultLabels: AvatarGroupLabels = {
  overflow: (count) => `${count} more`,
  overflowButton: (count) => `Show ${count} more`,
};

// Past this the tile's text wouldn't fit inside the avatar, so it says "99+"; the accessible name keeps the truth.
const MAX_SHOWN_COUNT = 99;

const defaultFormatNumber = (count: number) => String(count);

/** The `shape` an avatar child sets itself, if it sets one; the group can only see a direct child's props. */
function shapeOf(child: ReactNode): AvatarShape | undefined {
  if (!isValidElement<{ shape?: AvatarShape }>(child)) return undefined;
  return child.props.shape;
}

/**
 * One avatar's box. `role="listitem"` is stated outright although `<li>` has it implicitly: Safari with
 * VoiceOver drops the list semantics of a `<ul>` whose markers are removed (`list-style: none`), so neither the
 * list nor its items are announced without them (05-component-api-conventions.md §6). `jsx-a11y` rightly calls
 * it redundant on paper.
 */
const Entry = ({ children, ...props }: ComponentPropsWithoutRef<"li">) => (
  // eslint-disable-next-line jsx-a11y/no-redundant-roles -- deliberate; see the comment above.
  <li {...props} role="listitem" className={styles.item}>
    {children}
  </li>
);

/**
 * A row of `Avatar`s that overlap into a stack, collapsing the ones past `max` into a "+N" tile. It hands
 * its `size`, `shape` and `colorful` to the avatars inside it as defaults — an avatar's own prop still wins —
 * so a group of five needs them said once. A group inside another keeps the
 * outer one's settings for whatever it leaves out.
 *
 * It is a list (`<ul>`), one avatar per item, with a name, so a screen reader says "Project members, list,
 * 5 items" and reads each avatar's own name. Give each avatar an `alt` or `name`. The "+N" tile is named
 * "3 more", or, given `onOverflowClick`, is a button named "Show 3 more".
 *
 * @example
 * ```tsx
 * <AvatarGroup aria-label="Project members" max={3}>
 *   <Avatar name="Jane Doe" src="/jane.jpg" />
 *   <Avatar name="John Smith" />
 *   <Avatar name="Alex Kim" />
 *   <Avatar name="Maria Garcia" />
 * </AvatarGroup>
 * <AvatarGroup aria-label="Reviewers" size="sm" total={24} max={4} onOverflowClick={openReviewers}>…</AvatarGroup>
 * ```
 */
export const AvatarGroup = forwardRef<HTMLUListElement, AvatarGroupProps>(
  (
    {
      children,
      size,
      shape,
      colorful,
      max,
      total,
      stacked = true,
      onOverflowClick,
      formatNumber = defaultFormatNumber,
      labels,
      className,
      style,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      ...props
    },
    ref,
  ) => {
    // A group inside another keeps what the outer one set: its own settings win, what it leaves out comes from
    // the outer group. Without this the inner context would replace the outer and silently drop all three.
    const parent = useAvatarGroup();
    const parentSize = parent?.size;
    const parentShape = parent?.shape;
    const parentColorful = parent?.colorful;
    const resolvedSize = size ?? parentSize;
    const resolvedShape = shape ?? parentShape;
    const settings = useMemo(
      () => ({
        size: resolvedSize,
        shape: resolvedShape,
        colorful: colorful ?? parentColorful,
      }),
      [resolvedSize, resolvedShape, colorful, parentColorful],
    );

    const avatars = Children.toArray(children);
    // Development-only misuse warnings, from an effect so they run once per change rather than on every render.
    const hasNoName = !ariaLabel && !ariaLabelledBy;
    // A number that isn't one (`NaN`, from a failed parse) counts as not given, rather than hiding every avatar.
    const knownMax = max === undefined || Number.isNaN(max) ? undefined : Math.max(0, Math.floor(max));
    const knownTotal = total === undefined || Number.isNaN(total) ? undefined : Math.floor(total);
    const totalIsTooSmall = knownTotal !== undefined && knownTotal < avatars.length;
    useEffect(() => {
      if (process.env.NODE_ENV === "production") return;
      if (hasNoName) {
        console.warn(
          "AvatarGroup: no accessible name — pass `aria-label`, or `aria-labelledby` pointing at a visible label, so assistive tech can say who the group is.",
        );
      }
    }, [hasNoName]);
    useEffect(() => {
      if (process.env.NODE_ENV === "production") return;
      if (totalIsTooSmall) {
        console.warn(
          `AvatarGroup: \`total\` (${knownTotal}) is smaller than the number of avatars given (${avatars.length}), so it is ignored for the ones already drawn — it should be the real number of people, not fewer than the children.`,
        );
      }
    }, [totalIsTooSmall, knownTotal, avatars.length]);

    const words = mergeDefined(defaultLabels, labels);
    const shown = avatars.slice(0, knownMax ?? avatars.length);
    const hiddenCount =
      knownTotal === undefined ? avatars.length - shown.length : Math.max(0, knownTotal - shown.length);
    const layerCount = shown.length + (hiddenCount > 0 ? 1 : 0);

    const overflowText =
      hiddenCount > MAX_SHOWN_COUNT ? `${formatNumber(MAX_SHOWN_COUNT)}+` : `+${formatNumber(hiddenCount)}`;
    const overflowName = onOverflowClick ? words.overflowButton(hiddenCount) : words.overflow(hiddenCount);

    const groupStyle: CSSProperties = {
      "--avatar-group-count": layerCount,
      ...style,
    } as CSSProperties;
    // The first avatar is on top, each later one a layer lower; the stylesheet lifts whichever has focus.
    const layer = (index: number): CSSProperties => ({ "--avatar-group-layer": layerCount - index }) as CSSProperties;

    return (
      <AvatarGroupProvider value={settings}>
        {/* The `list` role is stated outright, for the reason given at `Entry`. */}
        {/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- deliberate; see `Entry`. */}
        <ul
          ref={ref}
          {...props}
          // Applied after `{...props}` so a same-named consumer prop can never replace them
          // (05-component-api-conventions.md §3).
          role="list"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          style={groupStyle}
          className={cx(styles.root, stacked ? styles.stacked : styles.spaced, className)}
        >
          {shown.map((child, index) => (
            <Entry
              // `Children.toArray` gave every child a stable key.
              key={isValidElement(child) ? child.key : index}
              data-shape={shapeOf(child) ?? resolvedShape ?? "circle"}
              style={layer(index)}
            >
              {child}
            </Entry>
          ))}
          {hiddenCount > 0 && (
            <Entry data-shape={resolvedShape ?? "circle"} style={layer(shown.length)}>
              {/* Never coloured by the group's `colorful`: it stands for people, not a person. */}
              {onOverflowClick ? (
                <Avatar
                  as="button"
                  type="button"
                  onClick={onOverflowClick}
                  initials={overflowText}
                  aria-label={overflowName}
                  colorful={false}
                />
              ) : (
                <Avatar initials={overflowText} aria-label={overflowName} colorful={false} />
              )}
            </Entry>
          )}
        </ul>
      </AvatarGroupProvider>
    );
  },
);

AvatarGroup.displayName = "AvatarGroup";
