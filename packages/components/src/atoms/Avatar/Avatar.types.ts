import type { ComponentPropsWithoutRef } from "react";

/** Matches the standard xs|sm|md|lg|xl component size scale, mapped to icon-size tokens. */
export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarStatus = "online" | "offline" | "busy" | "away";

export interface AvatarProps extends ComponentPropsWithoutRef<"span"> {
  /** Image URL. Falls back to `initials` if unset or if the image fails to load. */
  src?: string;
  /** Accessible description of the image (e.g. the person's name). */
  alt?: string;
  /** Fallback initials shown when there's no image, or it fails to load. */
  initials?: string;
  /** @default 'md' */
  size?: AvatarSize;
  /** Optional presence indicator, rendered as a small dot. */
  status?: AvatarStatus;
}
