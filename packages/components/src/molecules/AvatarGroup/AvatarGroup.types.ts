import type { Responsive } from "@dbm-design-system/primitives";
import type { ComponentPropsWithoutRef, CSSProperties, MouseEvent, ReactNode } from "react";
import type { AvatarShape, AvatarSize } from "../../atoms/Avatar";

/**
 * The words `AvatarGroup` writes itself, so they can be translated. Every one is a function of the number of
 * avatars the "+N" tile stands for, since a language's plural rules (and word order) can't be built from a
 * fixed string.
 */
export interface AvatarGroupLabels {
  /**
   * The accessible name of the "+N" tile when it is plain, not a button. Say what it stands for: "3 more".
   * @default (count) => `${count} more`
   */
  overflow: (count: number) => string;
  /**
   * The accessible name of the "+N" tile when it is a button (`onOverflowClick`), which should say what
   * pressing it does: "Show 3 more".
   * @default (count) => `Show ${count} more`
   */
  overflowButton: (count: number) => string;
}

export interface AvatarGroupProps extends Omit<ComponentPropsWithoutRef<"ul">, "role" | "children"> {
  /**
   * The `Avatar`s to show, one child each (a fragment counts as one). Each is put in its own list item, so
   * a screen reader announces the group as a list of people. A child may be wrapped — in a `Tooltip`, say —
   * and still takes the group's settings, but set `shape` on the group rather than on a wrapped avatar,
   * which the group can't see.
   */
  children?: ReactNode;
  /**
   * The size every avatar in the group uses unless it sets its own `size`. A single value, or a mobile-first
   * map keyed by breakpoint (`{ base: "sm", md: "lg" }`). Set it here rather than on each avatar, so they
   * all match.
   * @default 'md'
   */
  size?: Responsive<AvatarSize>;
  /**
   * The shape every avatar in the group uses unless it sets its own `shape`. It also shapes the ring drawn
   * between overlapping avatars.
   * @default 'circle'
   */
  shape?: AvatarShape;
  /**
   * Gives every avatar in the group a colour of its own, derived from its identity, unless it sets its own
   * `colorful`. The "+N" tile is never coloured this way.
   * @default false
   */
  colorful?: boolean;
  /**
   * The most avatars to draw. The rest collapse into one "+N" tile after them. Left out, every avatar is
   * drawn. A stacked group is as wide as its avatars and overflows a container that is narrower, so set
   * this to keep a long list to a width.
   */
  max?: number;
  /**
   * The real number of people, when the group holds only some of them (a list loaded a page at a time). The
   * tile then reads `total` minus the avatars drawn, even when every child fits under `max`. Left out, the
   * tile counts the children that `max` cut off.
   */
  total?: number;
  /**
   * Overlaps the avatars, with a ring in the page surface colour between them (`true`), or keeps them apart,
   * spaced by a gap and wrapping onto more lines when they don't fit (`false`). The first avatar sits on
   * top, so a status dot at each avatar's corner stays visible; a focused avatar rises above the rest. The
   * ring is `bg.surface`: on another background, set `--avatar-group-ring-color` in `style`.
   * @default true
   */
  stacked?: boolean;
  /**
   * Makes the "+N" tile a button that calls this when pressed — open a popover or a dialog listing the
   * rest. Left out, the tile is not interactive. Its accessible name is `labels.overflowButton`.
   */
  onOverflowClick?: (event: MouseEvent<HTMLElement>) => void;
  /**
   * Turns the number in the "+N" tile into text — a unit, or a locale's own numerals. A count over 99 is
   * shown as "99+", and the accessible name always has the real count.
   * @default (count) => String(count)
   */
  formatNumber?: (count: number) => string;
  /** The words the group writes itself; translate them here. Give only the ones you change. */
  labels?: Partial<AvatarGroupLabels>;
  /**
   * Names the group for assistive tech ("Project members"), announced with the list. Required unless
   * `aria-labelledby` points at a visible label.
   */
  "aria-label"?: string;
  /** The id of an already-visible element that names the group, in place of `aria-label`. */
  "aria-labelledby"?: string;
  /** The id of a description of the group. */
  "aria-describedby"?: string;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes, merged with the component's own. */
  className?: string;
  /** Inline styles, merged onto the component's own. */
  style?: CSSProperties;
  /** Test identifier for automated testing; rendered as `data-testid` on the list. */
  "data-testid"?: string;
}
