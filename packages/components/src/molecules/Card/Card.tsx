import { cx } from "@dbm-design-system/primitives";
import { Slot } from "@radix-ui/react-slot";
import { forwardRef, useEffect } from "react";
import styles from "./Card.module.css";
import type {
  CardBodyProps,
  CardFooterAlign,
  CardFooterProps,
  CardHeaderProps,
  CardMediaProps,
  CardProps,
  CardSize,
  CardTone,
  CardVariant,
} from "./Card.types";

// `outlined` has no class: it's the base styling (see Card.module.css).
const variantClass: Record<CardVariant, string | undefined> = {
  outlined: undefined,
  elevated: styles.elevated,
  filled: styles.filled,
  ghost: styles.ghost,
};

const sizeClass: Record<CardSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

// Each non-neutral tone's class only *defines* that tone's border and header
// tint as local custom properties; `.toned` reads them. `neutral` has no class.
const toneClass: Record<CardTone, string | undefined> = {
  neutral: undefined,
  brand: styles.toneBrand,
  info: styles.toneInfo,
  success: styles.toneSuccess,
  warning: styles.toneWarning,
  danger: styles.toneDanger,
};

const footerAlignClass: Record<CardFooterAlign, string> = {
  start: styles.alignStart ?? "",
  center: styles.alignCenter ?? "",
  end: styles.alignEnd ?? "",
  between: styles.alignBetween ?? "",
};

/**
 * A bordered, shadowed, or filled surface that groups related content — the
 * container for a self-contained chunk of a page (a summary, a profile, a
 * product). A compound component, meaning it's made of named sub-parts you
 * compose together: `Card.Media` (edge-to-edge media), `Card.Header`,
 * `Card.Body`, and `Card.Footer`, in any order, any of them optional.
 *
 * The card itself carries no padding: each section pads itself, and spaces
 * itself evenly from its neighbours, so `Card.Media` can run edge to edge and is
 * clipped to the card's rounded corners. `size` sets that padding on the
 * standard xs–xl scale.
 *
 * `variant` sets the surface (`outlined`, `elevated`, `filled`, `ghost`) and
 * `tone` adds a colour accent (a tinted border and header). Set `interactive`
 * together with `asChild` to make the whole card a link or button:
 * `<Card asChild interactive><a href="…">…</a></Card>`. `interactive` alone is
 * styling only, with no semantics.
 *
 * `ref` forwards to the root element (the `<div>`, or the slotted child under
 * `asChild`).
 *
 * @example
 * ```tsx
 * <Card>
 *   <Card.Header>
 *     <Heading level={3}>Team plan</Heading>
 *     <Badge tone="success">Active</Badge>
 *   </Card.Header>
 *   <Card.Body>Up to 10 members, unlimited projects.</Card.Body>
 *   <Card.Footer>
 *     <Button variant="secondary">Manage</Button>
 *   </Card.Footer>
 * </Card>
 *
 * <Card asChild interactive variant="elevated">
 *   <a href="/plans/team">
 *     <Card.Body>The whole card is a link.</Card.Body>
 *   </a>
 * </Card>
 * ```
 */
const CardRoot = forwardRef<HTMLDivElement, CardProps>((cardProps, ref) => {
  const {
    children,
    variant = "outlined",
    tone = "neutral",
    size = "md",
    interactive = false,
    asChild = false,
    className,
    style,
    id,
    "data-testid": dataTestId,
    ...rest
  } = cardProps;

  // A dev-mode misuse warning, run as an effect (no render-time ref access): an
  // `interactive` card that isn't slotted onto a link or button, and hasn't been
  // given a role, looks clickable but has no interactive semantics — invisible to
  // keyboard and assistive-technology users.
  const { role } = rest;
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && interactive && !asChild && role === undefined) {
      console.warn(
        "Card: `interactive` styles the card as clickable, but a plain <div> has no interactive semantics — it can't be reached or activated from the keyboard. Set `asChild` and render the card as a link or button (e.g. `<Card asChild interactive><a href=\"…\">…</a></Card>`), or provide your own `role` and keyboard handling.",
      );
    }
  }, [interactive, asChild, role]);

  const Component = asChild ? Slot : "div";

  return (
    <Component
      {...rest}
      ref={ref}
      id={id}
      style={style}
      data-testid={dataTestId}
      className={cx(
        styles.card,
        variantClass[variant],
        sizeClass[size],
        tone !== "neutral" && styles.toned,
        toneClass[tone],
        interactive && styles.interactive,
        className,
      )}
    >
      {children}
    </Component>
  );
});
CardRoot.displayName = "Card";

/** The card's header — a row for a title (and description) with an optional action on the end. Tinted when the card has a non-neutral `tone`. */
const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(({ className, ...props }, ref) => (
  <div {...props} ref={ref} className={cx(styles.header, className)} />
));
CardHeader.displayName = "Card.Header";

/** The card's main content. Grows to fill spare height, so footers line up in a row of equal-height cards. */
const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(({ className, ...props }, ref) => (
  <div {...props} ref={ref} className={cx(styles.body, className)} />
));
CardBody.displayName = "Card.Body";

/** The card's footer — a row for actions or supporting meta, aligned per `align`. */
const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ align = "end", className, ...props }, ref) => (
    <div {...props} ref={ref} className={cx(styles.footer, footerAlignClass[align], className)} />
  ),
);
CardFooter.displayName = "Card.Footer";

/** Edge-to-edge media (an image, a video, a chart), clipped to the card's rounded corners. */
const CardMedia = forwardRef<HTMLDivElement, CardMediaProps>(({ className, ...props }, ref) => (
  <div {...props} ref={ref} className={cx(styles.media, className)} />
));
CardMedia.displayName = "Card.Media";

type CardComponent = typeof CardRoot & {
  Media: typeof CardMedia;
  Header: typeof CardHeader;
  Body: typeof CardBody;
  Footer: typeof CardFooter;
};

export const Card: CardComponent = Object.assign(CardRoot, {
  Media: CardMedia,
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
});
