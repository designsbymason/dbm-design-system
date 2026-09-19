import { cx, type Breakpoint, type Responsive } from "@dbm-design-system/primitives";
import { Slot } from "@radix-ui/react-slot";
import { forwardRef, useEffect, type MouseEvent } from "react";
import styles from "./Card.module.css";
import type {
  CardBodyProps,
  CardFooterAlign,
  CardFooterProps,
  CardHeaderProps,
  CardMediaProps,
  CardOrientation,
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

// One class per breakpoint and orientation, each setting the three layout custom
// properties the card's grid reads (see Card.module.css) — so a responsive
// `orientation` is just several classes, applied mobile-first.
const orientationClass: Record<Breakpoint, Record<CardOrientation, string | undefined>> = {
  base: { vertical: styles.orientBaseVertical, horizontal: styles.orientBaseHorizontal },
  sm: { vertical: styles.orientSmVertical, horizontal: styles.orientSmHorizontal },
  md: { vertical: styles.orientMdVertical, horizontal: styles.orientMdHorizontal },
  lg: { vertical: styles.orientLgVertical, horizontal: styles.orientLgHorizontal },
  xl: { vertical: styles.orientXlVertical, horizontal: styles.orientXlHorizontal },
  "2xl": { vertical: styles.orient2xlVertical, horizontal: styles.orient2xlHorizontal },
  "3xl": { vertical: styles.orient3xlVertical, horizontal: styles.orient3xlHorizontal },
};

function orientationClasses(orientation: Responsive<CardOrientation>): string {
  if (typeof orientation === "string") return orientationClass.base[orientation] ?? "";
  const classes: string[] = [];
  for (const breakpoint of Object.keys(orientation) as Breakpoint[]) {
    const value = orientation[breakpoint];
    const name = value === undefined ? undefined : orientationClass[breakpoint]?.[value];
    if (name) classes.push(name);
  }
  return classes.join(" ");
}

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
 * `tone` adds a colour accent (a tinted border and header). `orientation`
 * puts `Card.Media` beside the content instead of above it, and accepts a
 * responsive map (`{ base: "vertical", md: "horizontal" }`); `mediaPosition`
 * pins the media to the start or the end — the top or bottom of a vertical
 * card, the inline-start or inline-end side of a horizontal one; `divided` draws
 * a hairline between the header, body, and footer. Set `interactive` together
 * with `asChild` to make the whole card a link or button:
 * `<Card asChild interactive><a href="…">…</a></Card>`; `interactive` alone is
 * styling only, with no semantics. Add `disabled` to take an interactive card
 * out of use (`aria-disabled`, dimmed, click blocked).
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
 *
 * <Card orientation={{ base: "vertical", md: "horizontal" }} mediaPosition="end" divided>
 *   <Card.Media><img src="/team.jpg" alt="" /></Card.Media>
 *   <Card.Header>Team plan</Card.Header>
 *   <Card.Body>Up to 10 members.</Card.Body>
 * </Card>
 * ```
 */
const CardRoot = forwardRef<HTMLDivElement, CardProps>((cardProps, ref) => {
  const {
    children,
    variant = "outlined",
    tone = "neutral",
    size = "md",
    orientation,
    mediaPosition,
    divided = false,
    interactive = false,
    disabled = false,
    asChild = false,
    onClickCapture,
    className,
    style,
    id,
    "data-testid": dataTestId,
    ...rest
  } = cardProps;

  // Dev-mode misuse warnings, run as effects (no render-time ref access). An
  // `interactive` card that isn't slotted onto a link or button, and hasn't been
  // given a role, looks clickable but has no interactive semantics — invisible to
  // keyboard and assistive-technology users. And `disabled` only means something
  // on an interactive card.
  const { role } = rest;
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && interactive && !asChild && role === undefined) {
      console.warn(
        "Card: `interactive` styles the card as clickable, but a plain <div> has no interactive semantics — it can't be reached or activated from the keyboard. Set `asChild` and render the card as a link or button (e.g. `<Card asChild interactive><a href=\"…\">…</a></Card>`), or provide your own `role` and keyboard handling.",
      );
    }
  }, [interactive, asChild, role]);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && disabled && !interactive) {
      console.warn(
        "Card: `disabled` has no effect without `interactive` — a card that isn't clickable has nothing to disable. Set `interactive` (with `asChild`, on a link or button) or remove `disabled`.",
      );
    }
  }, [disabled, interactive]);

  // A disabled card is `aria-disabled` plus a click guard rather than a native
  // `disabled` attribute, exactly as `Link` does it: an `<a>` has no such
  // attribute, and `aria-disabled` keeps the slotted element focusable, per
  // WAI-ARIA guidance. The guard runs in the capture phase so it stops the click
  // before a slotted child's own handler (e.g. a router's navigation) can run.
  const isDisabled = interactive && disabled;
  const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (isDisabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onClickCapture?.(event);
  };

  const Component = asChild ? Slot : "div";

  return (
    <Component
      {...rest}
      ref={ref}
      id={id}
      style={style}
      data-testid={dataTestId}
      aria-disabled={isDisabled ? true : rest["aria-disabled"]}
      onClickCapture={handleClickCapture}
      className={cx(
        styles.card,
        variantClass[variant],
        sizeClass[size],
        orientation !== undefined && orientationClasses(orientation),
        mediaPosition === "start" && styles.mediaStart,
        mediaPosition === "end" && styles.mediaEnd,
        divided && styles.divided,
        tone !== "neutral" && styles.toned,
        toneClass[tone],
        interactive && styles.interactive,
        isDisabled && styles.disabled,
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

/** Edge-to-edge media (an image, a video, a chart), clipped to the card's rounded corners. Beside the content, filling the full height, in a horizontal card. */
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
