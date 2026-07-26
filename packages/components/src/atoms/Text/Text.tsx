import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import type { ComponentPropsWithRef, ElementType, ReactElement } from "react";
import styles from "./Text.module.css";
import type {
  TextColor,
  TextElement,
  TextFontFamily,
  TextProps,
  TextSize,
  TextWeight,
} from "./Text.types";

type TextComponent = {
  <E extends TextElement = "p">(
    props: TextProps<E> & { ref?: ComponentPropsWithRef<E>["ref"] },
  ): ReactElement | null;
  displayName?: string;
};

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

const fontFamilyClass: Record<TextFontFamily, string | undefined> = {
  primary: styles.fontFamilyPrimary,
  secondary: styles.fontFamilySecondary,
};

const TextImpl = forwardRef<HTMLElement, TextProps<TextElement>>(function Text(
  {
    as,
    size = "base",
    weight = "regular",
    color = "primary",
    fontFamily = "primary",
    truncate,
    className,
    style,
    ...props
  },
  ref,
) {
  // A variable holding a *union* of JSX intrinsic tag literals makes TS
  // compute an intersection of every possible ref/prop type (since it can't
  // narrow which tag at compile time), which no single ref value can
  // satisfy. ElementType sidesteps that inference entirely; TextElement
  // (the exported, generic prop type) still gives consumers full per-tag
  // checking at the call site.
  const Component = (as ?? "p") as ElementType;
  return (
    <Component
      ref={ref}
      className={cx(
        styles.root,
        // See the identical `as StackAlign`-style comment pattern in Stack —
        // `Omit<ComponentPropsWithoutRef<E>, ...>` widens these to `any` at
        // this internal, abstract-`E` call site, not at the public,
        // concrete-`E` call site.
        sizeClass[size as TextSize],
        weightClass[weight as TextWeight],
        colorClass[color as TextColor],
        fontFamilyClass[fontFamily as TextFontFamily],
        truncate !== undefined && styles.truncate,
        className,
      )}
      style={{
        ...(truncate !== undefined ? { WebkitLineClamp: truncate } : {}),
        ...style,
      }}
      {...props}
    />
  );
});

/**
 * The base text primitive for body copy, with semantic size/weight/color
 * props. Renders a `<p>` by default; use `as` for inline (`span`) or other
 * text-container elements — restricted to a curated set of sensible tags
 * (`p | span | div | label | legend`) rather than any element, unlike
 * `Box`'s fully-open polymorphism, since Text specifically represents
 * styled text content. For page/section headings, use `Heading` instead.
 *
 * `fontFamily="secondary"` switches to Lora, the token system's editorial
 * family, for longer-form reading content. `truncate` clamps to a fixed
 * number of lines with an ellipsis.
 *
 * @example
 * ```tsx
 * <Text size="sm" color="secondary">Helper text</Text>
 * <Text as="span" weight="semibold">Inline emphasis</Text>
 * <Text as="label" htmlFor="email">Email address</Text>
 * <Text fontFamily="secondary">Long-form editorial copy set in Lora.</Text>
 * <Text truncate={2}>A long description clamped to two lines…</Text>
 * ```
 */
export const Text = TextImpl as TextComponent;

Text.displayName = "Text";
