import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import type { ElementType } from "react";
import styles from "./Heading.module.css";
import type { HeadingLevel, HeadingProps, HeadingSize } from "./Heading.types";

const elementForLevel: Record<HeadingLevel, ElementType> = {
  1: "h1",
  2: "h2",
  3: "h3",
  4: "h4",
  5: "h5",
  6: "h6",
};

const defaultSizeForLevel: Record<HeadingLevel, HeadingSize> = {
  1: "5xl",
  2: "4xl",
  3: "3xl",
  4: "2xl",
  5: "xl",
  6: "lg",
};

const sizeClass: Record<HeadingSize, string | undefined> = {
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
  "2xl": styles.size2xl,
  "3xl": styles.size3xl,
  "4xl": styles.size4xl,
  "5xl": styles.size5xl,
  "6xl": styles.size6xl,
};

const weightClass = {
  regular: styles.weightRegular,
  medium: styles.weightMedium,
  semibold: styles.weightSemibold,
  bold: styles.weightBold,
} as const;

const colorClass = {
  primary: styles.colorPrimary,
  secondary: styles.colorSecondary,
  tertiary: styles.colorTertiary,
  disabled: styles.colorDisabled,
  link: styles.colorLink,
  danger: styles.colorDanger,
  warning: styles.colorWarning,
  success: styles.colorSuccess,
  info: styles.colorInfo,
} as const;

/**
 * A page/section heading, rendered as `h1`-`h6` per `level`. Uses the
 * editorial/display font family (Lora) per the type system's font-family
 * spec. `size` (visual) and `level` (document structure) default to a
 * matched pair but can be set independently.
 *
 * @example
 * ```tsx
 * <Heading level={1}>Page title</Heading>
 * <Heading level={2} size="xl">Visually smaller section heading</Heading>
 * ```
 */
export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ level = 2, size, weight = "bold", color = "primary", className, ...props }, ref) => {
    const Component = elementForLevel[level];
    const resolvedSize = size ?? defaultSizeForLevel[level];
    return (
      <Component
        ref={ref}
        className={cx(
          styles.root,
          sizeClass[resolvedSize],
          weightClass[weight],
          colorClass[color],
          className,
        )}
        {...props}
      />
    );
  },
);

Heading.displayName = "Heading";
