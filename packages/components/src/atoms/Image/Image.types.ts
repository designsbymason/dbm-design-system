import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type ImageObjectFit =
  | "cover"
  | "contain"
  | "fill"
  | "none"
  | "scale-down";

export type ImageRadius =
  | "none"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "full";

export interface ImageProps extends Omit<ComponentPropsWithoutRef<"img">, "alt"> {
  src?: string;
  /**
   * Required — pass `""` for a purely decorative image. `Image` always
   * needs this explicitly (no silent decorative default), since it's also
   * used as the fallback state's accessible label.
   */
  alt: string;
  /**
   * Rendered in place of the image when `src` is missing or fails to
   * load — e.g. a placeholder icon or initials.
   */
  fallback?: ReactNode;
  /** Locks the image to a ratio (e.g. `16 / 9`), like the CSS `aspect-ratio` property. */
  aspectRatio?: number;
  /** @default 'cover' */
  objectFit?: ImageObjectFit;
  /** @default 'none' */
  radius?: ImageRadius;
  /** @default 'lazy' */
  loading?: "lazy" | "eager";
}
