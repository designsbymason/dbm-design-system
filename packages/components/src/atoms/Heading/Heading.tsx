import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import type { ComponentPropsWithRef, ElementType, ReactElement } from "react";
import type { TextColor, TextFontFamily, TextWeight } from "../Text/Text.types";
import styles from "./Heading.module.css";
import type { HeadingLevel, HeadingProps, HeadingSize } from "./Heading.types";

type HeadingComponent = {
  <E extends ElementType = "h1">(
    props: HeadingProps<E> & { ref?: ComponentPropsWithRef<E>["ref"] },
  ): ReactElement | null;
  displayName?: string;
};

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

const HeadingImpl = forwardRef<HTMLElement, HeadingProps<ElementType>>(function Heading(
  {
    as,
    level = 2,
    size,
    weight = "bold",
    color = "primary",
    fontFamily = "secondary",
    truncate,
    className,
    style,
    ...props
  },
  ref,
) {
  // Same rationale as Text/Stack: `Omit<ComponentPropsWithoutRef<E>, ...>`
  // can't resolve cleanly for the fully-abstract `E` this internal
  // implementation is instantiated with, which widens `level` here (not at
  // the public, concrete-`E` call site) — safe to assert back to its real
  // type. Casting to the broad ElementType separately sidesteps a TS
  // inference limit with union/generic JSX tags.
  const Component = (as ?? elementForLevel[level as HeadingLevel]) as ElementType;
  const resolvedSize = size ?? defaultSizeForLevel[level as HeadingLevel];
  const usesAriaFallback = as !== undefined;

  return (
    <Component
      ref={ref}
      role={usesAriaFallback ? "heading" : undefined}
      aria-level={usesAriaFallback ? level : undefined}
      className={cx(
        styles.root,
        sizeClass[resolvedSize as HeadingSize],
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
 * A page/section heading, rendered as `h1`-`h6` per `level` by default. Uses
 * the editorial/display font family (Lora) per the token system's
 * font-family spec. `size` (visual) and `level` (document structure)
 * default to a matched pair but can be set independently.
 *
 * `as` overrides the rendered element (e.g. for a repeated card title that
 * shouldn't add another entry to the page's heading outline) — in that case
 * `role="heading"` and `aria-level={level}` are applied automatically, so
 * the element is still discoverable as a heading to assistive technology.
 *
 * `fontFamily="primary"` switches to Nunito, for UI-dense/enterprise
 * sections that want headings to stay in the interface's primary family.
 * `truncate` clamps to a fixed number of lines with an ellipsis.
 *
 * @example
 * ```tsx
 * <Heading level={1}>Page title</Heading>
 * <Heading level={2} size="xl">Visually smaller section heading</Heading>
 * <Heading level={3} as="div">Card title (not in the page's heading outline)</Heading>
 * ```
 */
export const Heading = HeadingImpl as HeadingComponent;

Heading.displayName = "Heading";
