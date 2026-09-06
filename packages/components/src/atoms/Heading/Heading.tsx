import { cx } from "@dbm-design-system/primitives";
import { forwardRef, useRef } from "react";
import type { ComponentPropsWithRef, ElementType, ReactElement } from "react";
import type { TextColor, TextFontFamily, TextWeight } from "../Text/Text.types";
import styles from "./Heading.module.css";
import type {
  HeadingAlign,
  HeadingLevel,
  HeadingProps,
  HeadingSize,
  HeadingWrap,
} from "./Heading.types";

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

const headingTags = new Set<string>(Object.values(elementForLevel) as string[]);

/**
 * `level`'s own matched default `size` — exported (package-internal use
 * only, not re-exported from the public barrel) so `Heading.stories.tsx`
 * can reuse this exact mapping for the Playground's `size` control, rather
 * than duplicating it, to show the size that will actually render when
 * `size` itself is left unset.
 */
export const defaultSizeForLevel: Record<HeadingLevel, HeadingSize> = {
  1: "5xl",
  2: "4xl",
  3: "3xl",
  4: "2xl",
  5: "xl",
  6: "lg",
};

const sizeClass: Record<HeadingSize, string | undefined> = {
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

const alignClass: Record<HeadingAlign, string | undefined> = {
  start: styles.alignStart,
  center: styles.alignCenter,
  end: styles.alignEnd,
};

const wrapClass: Record<HeadingWrap, string | undefined> = {
  wrap: styles.wrapWrap,
  nowrap: styles.wrapNowrap,
  balance: styles.wrapBalance,
  pretty: styles.wrapPretty,
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
    align,
    weight = "bold",
    color = "primary",
    fontFamily = "secondary",
    wrap,
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

  const hasWarnedAsHeadingTagRef = useRef(false);
  const hasWarnedNowrapTruncateRef = useRef(false);

  if (process.env.NODE_ENV !== "production") {
    if (
      as !== undefined &&
      headingTags.has(as as string) &&
      !hasWarnedAsHeadingTagRef.current
    ) {
      hasWarnedAsHeadingTagRef.current = true;
      console.warn(
        `Heading: \`as="${String(as)}"\` renders a native heading element, which already carries its own implicit level — the \`role="heading"\`/\`aria-level\` fallback this component adds for a non-heading \`as\` still applies on top of it and can conflict with the tag's own native level. \`as\` is meant for overriding to a *non*-heading element (e.g. "div"); to change which heading tag renders, use \`level\` instead.`,
      );
    }
    if (
      wrap === "nowrap" &&
      truncate !== undefined &&
      truncate > 1 &&
      !hasWarnedNowrapTruncateRef.current
    ) {
      hasWarnedNowrapTruncateRef.current = true;
      console.warn(
        `Heading: \`wrap="nowrap"\` conflicts with \`truncate={${truncate}}\` — nowrap keeps the heading on a single line, so a multi-line clamp never has more than one line to clamp. Use \`truncate={1}\`, or remove \`wrap="nowrap"\`.`,
      );
    }
  }

  return (
    <Component
      ref={ref}
      className={cx(
        styles.root,
        sizeClass[resolvedSize as HeadingSize],
        align !== undefined && alignClass[align as HeadingAlign],
        weightClass[weight as TextWeight],
        colorClass[color as TextColor],
        fontFamilyClass[fontFamily as TextFontFamily],
        wrap !== undefined && wrapClass[wrap as HeadingWrap],
        truncate !== undefined && styles.truncate,
        className,
      )}
      style={{
        ...(truncate !== undefined ? { WebkitLineClamp: truncate } : {}),
        ...style,
      }}
      {...props}
      role={usesAriaFallback ? "heading" : undefined}
      aria-level={usesAriaFallback ? level : undefined}
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
 * `align` sets text alignment; `wrap` controls line-wrapping (e.g.
 * `wrap="balance"` for a more evenly-broken multi-line heading); `truncate`
 * clamps to a fixed number of lines with an ellipsis.
 *
 * @example
 * ```tsx
 * <Heading level={1}>Page title</Heading>
 * <Heading level={2} size="xl">Visually smaller section heading</Heading>
 * <Heading level={3} as="div">Card title (not in the page's heading outline)</Heading>
 * <Heading level={1} align="center" wrap="balance">Centered hero title</Heading>
 * ```
 */
export const Heading = HeadingImpl as HeadingComponent;

Heading.displayName = "Heading";
