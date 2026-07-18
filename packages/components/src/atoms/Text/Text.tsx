import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import type { ElementType } from "react";
import styles from "./Text.module.css";
import type { TextColor, TextProps, TextSize, TextWeight } from "./Text.types";

const sizeClass: Record<TextSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  base: styles.sizeBase,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
  "2xl": styles.size2xl,
  "3xl": styles.size3xl,
  "4xl": styles.size4xl,
  "5xl": styles.size5xl,
  "6xl": styles.size6xl,
};

const weightClass: Record<TextWeight, string | undefined> = {
  regular: styles.weightRegular,
  medium: styles.weightMedium,
  semibold: styles.weightSemibold,
  bold: styles.weightBold,
};

const colorClass: Record<TextColor, string | undefined> = {
  primary: styles.colorPrimary,
  secondary: styles.colorSecondary,
  tertiary: styles.colorTertiary,
  disabled: styles.colorDisabled,
  link: styles.colorLink,
  danger: styles.colorDanger,
  warning: styles.colorWarning,
  success: styles.colorSuccess,
  info: styles.colorInfo,
};

/**
 * The base text primitive for body copy, with semantic size/weight/color
 * props. Renders a `<p>` by default; use `as` for inline (`span`) or other
 * text-container elements. For page/section headings, use `Heading` instead.
 *
 * @example
 * ```tsx
 * <Text size="sm" color="secondary">Helper text</Text>
 * <Text as="span" weight="semibold">Inline emphasis</Text>
 * ```
 */
export const Text = forwardRef<HTMLElement, TextProps>(
  (
    { as = "p", size = "base", weight = "regular", color = "primary", className, ...props },
    ref,
  ) => {
    // Cast to the broader ElementType: a variable holding a *union* of JSX
    // intrinsic tag literals makes TS compute an intersection of every
    // possible ref/prop type (since it can't narrow which tag at compile
    // time), which no single ref value can satisfy. ElementType sidesteps
    // that inference entirely; TextElement (the exported prop type) still
    // gives consumers full per-tag checking at the call site.
    const Component = as as ElementType;
    return (
      <Component
        ref={ref}
        className={cx(
          styles.root,
          sizeClass[size],
          weightClass[weight],
          colorClass[color],
          className,
        )}
        {...props}
      />
    );
  },
);

Text.displayName = "Text";
