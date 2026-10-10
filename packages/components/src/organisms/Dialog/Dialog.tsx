import { cx, mergeDefined } from "@dbm-design-system/primitives";
import type { Breakpoint, Responsive } from "@dbm-design-system/primitives";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Backdrop } from "../../atoms/Backdrop";
import { CloseButton } from "../../atoms/CloseButton";
import { Heading } from "../../atoms/Heading";
import { Text } from "../../atoms/Text";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { ScrollArea } from "../../molecules/ScrollArea";
import styles from "./Dialog.module.css";
import type {
  DialogBodyProps,
  DialogCloseProps,
  DialogContentProps,
  DialogDescriptionProps,
  DialogFooterAlign,
  DialogFooterProps,
  DialogHeaderProps,
  DialogLabels,
  DialogProps,
  DialogSize,
  DialogTitleProps,
  DialogTriggerProps,
} from "./Dialog.types";

const defaultLabels: DialogLabels = { close: "Close" };

const sizeClass: Record<DialogSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: undefined,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

// One class per breakpoint and value, each setting the custom properties the panel's layout reads (see
// Dialog.module.css), so a responsive `fullScreen` is just several classes, applied mobile-first.
const fullScreenClass: Record<Breakpoint, Record<"true" | "false", string | undefined>> = {
  base: { true: styles.fullBase, false: undefined },
  sm: { true: styles.fullSm, false: styles.windowedSm },
  md: { true: styles.fullMd, false: styles.windowedMd },
  lg: { true: styles.fullLg, false: styles.windowedLg },
  xl: { true: styles.fullXl, false: styles.windowedXl },
  "2xl": { true: styles.full2xl, false: styles.windowed2xl },
  "3xl": { true: styles.full3xl, false: styles.windowed3xl },
};

function fullScreenClasses(fullScreen: Responsive<boolean>): string {
  if (typeof fullScreen === "boolean") return fullScreenClass.base[String(fullScreen) as "true" | "false"] ?? "";
  const classes: string[] = [];
  for (const breakpoint of Object.keys(fullScreen) as Breakpoint[]) {
    const value = fullScreen[breakpoint];
    const name = value === undefined ? undefined : fullScreenClass[breakpoint]?.[String(value) as "true" | "false"];
    if (name) classes.push(name);
  }
  return classes.join(" ");
}

const footerAlignClass: Record<DialogFooterAlign, string | undefined> = {
  start: styles.alignStart,
  end: undefined,
  between: styles.alignBetween,
  stretch: styles.alignStretch,
};

interface DialogContextValue {
  /** The dialog's current open state, held here so the scrim can follow it (see `DialogContent`). */
  open: boolean;
  modal: boolean;
}

const DialogContext = createContext<DialogContextValue | null>(null);

interface DialogContentContextValue {
  registerTitle: () => () => void;
  registerDescription: () => () => void;
}

const DialogContentContext = createContext<DialogContentContextValue | null>(null);

/**
 * A window that interrupts the page for focused work — a form, a detail view, a confirmation — built on Radix
 * Dialog. By default it is **modal**: the page behind is dimmed by a scrim, can't be scrolled, clicked or reached
 * with the keyboard, and focus is held inside until the dialog closes, when it returns to whatever opened it.
 * (`modal={false}` makes a docked panel that leaves the page usable.) Some libraries call this component a "modal".
 *
 * A compound component, meaning it is made of named sub-parts you compose together: `Dialog.Trigger`,
 * `Dialog.Content`, and inside it `Dialog.Header` (holding `Dialog.Title` and `Dialog.Description`),
 * `Dialog.Body` (which scrolls while the header and footer stay put), `Dialog.Footer`, and `Dialog.Close`.
 *
 * `Dialog` itself renders no DOM element of its own — a plain context provider around its sub-parts, matching
 * Radix's `Dialog.Root` — so it takes no `ref`/`className`/`style`/`id`/`data-testid` of its own; those apply to
 * the sub-parts instead, each of which forwards its own ref.
 *
 * Give every dialog a `Dialog.Title`: it names the dialog for screen readers (wrap it in `VisuallyHidden` if the
 * design has no visible heading). Radix reports a missing one in development.
 *
 * Does not cover an alert that needs an explicit answer (`AlertDialog`), a side panel (`Drawer`) or a
 * confirm-and-continue pattern (`ConfirmDialog`) — those are separate components.
 *
 * @example
 * ```tsx
 * <Dialog>
 *   <Dialog.Trigger asChild>
 *     <Button>Edit profile</Button>
 *   </Dialog.Trigger>
 *   <Dialog.Content>
 *     <Dialog.Header>
 *       <Dialog.Title>Edit profile</Dialog.Title>
 *       <Dialog.Description>Changes are saved to your account.</Dialog.Description>
 *     </Dialog.Header>
 *     <Dialog.Body>
 *       <Input aria-label="Name" />
 *     </Dialog.Body>
 *     <Dialog.Footer>
 *       <Dialog.Close asChild>
 *         <Button variant="secondary">Cancel</Button>
 *       </Dialog.Close>
 *       <Button>Save</Button>
 *     </Dialog.Footer>
 *   </Dialog.Content>
 * </Dialog>
 * ```
 */
function DialogRoot({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  modal = true,
}: DialogProps) {
  // The open state is kept here, not left to Radix, because the scrim (`Backdrop`) draws its own fade from an
  // `open` prop and a scrim that isn't told the dialog is closing would vanish with no fade-out.
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const value = useMemo(() => ({ open, modal }), [open, modal]);

  return (
    <DialogContext.Provider value={value}>
      <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange} modal={modal}>
        {children}
      </DialogPrimitive.Root>
    </DialogContext.Provider>
  );
}

/**
 * The element that opens the dialog on click. Renders an unstyled native `<button>` by default — pass `asChild`
 * to use one of this system's own interactive components (`Button`, `IconButton`) instead.
 */
const DialogTrigger = forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ asChild = false, className, ...props }, ref) => (
    <DialogPrimitive.Trigger
      ref={ref}
      asChild={asChild}
      className={asChild ? className : cx(styles.trigger, className)}
      {...props}
    />
  ),
);
DialogTrigger.displayName = "Dialog.Trigger";

/**
 * The dialog panel itself, with its scrim. Radix renders it in a portal appended to `document.body` by default,
 * outside the trigger's own tree. A press on the scrim, Escape and the built-in close button all close it; see
 * `closeOnOutsideClick` and `closeOnEscape` to take any of them away.
 */
const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  (
    {
      size = "md",
      fullScreen = false,
      divided = false,
      showCloseButton = true,
      closeOnOutsideClick = true,
      closeOnEscape = true,
      labels: labelOverrides,
      container,
      className,
      children,
      onEscapeKeyDown,
      onInteractOutside,
      "aria-label": ariaLabel,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const dialog = useContext(DialogContext);
    const open = dialog?.open ?? true;
    const modal = dialog?.modal ?? true;
    const labels: DialogLabels = mergeDefined(defaultLabels, labelOverrides);

    // How many titles and descriptions are mounted. Radix wires `aria-labelledby`/`aria-describedby` to them by
    // id, and reports a missing one: a dialog named only by `aria-label` still needs something for it to point
    // at, and a dialog with no description must say so rather than have Radix warn about a dangling reference.
    const [titleCount, setTitleCount] = useState(0);
    const [descriptionCount, setDescriptionCount] = useState(0);
    const registerTitle = useCallback(() => {
      setTitleCount((count) => count + 1);
      return () => setTitleCount((count) => count - 1);
    }, []);
    const registerDescription = useCallback(() => {
      setDescriptionCount((count) => count + 1);
      return () => setDescriptionCount((count) => count - 1);
    }, []);
    const contentContext = useMemo(
      () => ({ registerTitle, registerDescription }),
      [registerTitle, registerDescription],
    );

    const describedByProps =
      ariaDescribedBy !== undefined
        ? { "aria-describedby": ariaDescribedBy }
        : descriptionCount === 0
          ? { "aria-describedby": undefined }
          : {};

    const content = (
      <DialogPrimitive.Content
        ref={ref}
        {...props}
        {...describedByProps}
        aria-label={ariaLabel}
        // The attributes below are computed from the dialog's own state, so they come after `{...props}`: a
        // same-named consumer prop must not replace the role or the state the exit animation is keyed to.
        role="dialog"
        data-state={open ? "open" : "closed"}
        aria-modal={modal ? true : undefined}
        onEscapeKeyDown={(event) => {
          onEscapeKeyDown?.(event);
          if (!closeOnEscape) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          onInteractOutside?.(event);
          if (!closeOnOutsideClick) event.preventDefault();
        }}
        className={cx(
          styles.content,
          sizeClass[size],
          fullScreenClasses(fullScreen),
          divided && styles.divided,
          showCloseButton && styles.withCloseButton,
          !modal && styles.nonModal,
          className,
        )}
      >
        <DialogContentContext.Provider value={contentContext}>
          {ariaLabel && titleCount === 0 && (
            <DialogPrimitive.Title asChild>
              <VisuallyHidden>{ariaLabel}</VisuallyHidden>
            </DialogPrimitive.Title>
          )}
          {children}
        </DialogContentContext.Provider>
        {showCloseButton && (
          // Last in the DOM so a body that comes first can clear it with `:first-child`, and so Tab reaches the
          // dialog's own controls before it. It is placed in the corner by CSS, not by order.
          <DialogPrimitive.Close asChild>
            <CloseButton size="sm" aria-label={labels.close} className={styles.closeButton} />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    );

    return (
      <DialogPrimitive.Portal container={container}>
        {modal ? (
          <DialogPrimitive.Overlay asChild>
            <Backdrop inPortal={false} open={open}>
              {content}
            </Backdrop>
          </DialogPrimitive.Overlay>
        ) : (
          content
        )}
      </DialogPrimitive.Portal>
    );
  },
);
DialogContent.displayName = "Dialog.Content";

/** The top section of the dialog: usually a `Dialog.Title` and optionally a `Dialog.Description`. */
const DialogHeader = forwardRef<HTMLDivElement, DialogHeaderProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cx(styles.header, className)} {...props} />
));
DialogHeader.displayName = "Dialog.Header";

/**
 * The dialog's name, announced when it opens, rendered as a heading. Every dialog should have one; use
 * `VisuallyHidden` around it when the design shows no heading.
 */
const DialogTitle = forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ level = 2, size = "xl", className, children, ...props }, ref) => {
    const content = useContext(DialogContentContext);
    useEffect(() => content?.registerTitle(), [content]);
    return (
      <DialogPrimitive.Title asChild>
        <Heading ref={ref} level={level} size={size} className={cx(styles.title, className)} {...props}>
          {children}
        </Heading>
      </DialogPrimitive.Title>
    );
  },
);
DialogTitle.displayName = "Dialog.Title";

/** A sentence or two on what the dialog is for, read out after its title when it opens. */
const DialogDescription = forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    const content = useContext(DialogContentContext);
    useEffect(() => content?.registerDescription(), [content]);
    return (
      <DialogPrimitive.Description asChild>
        <Text ref={ref} size="sm" color="secondary" className={cx(styles.description, className)} {...props}>
          {children}
        </Text>
      </DialogPrimitive.Description>
    );
  },
);
DialogDescription.displayName = "Dialog.Description";

/**
 * The main content, a scroll region that takes whatever height is left between the header and the footer, so
 * long content scrolls inside the dialog while they stay in view.
 */
const DialogBody = forwardRef<HTMLDivElement, DialogBodyProps>(({ className, children, ...props }, ref) => (
  <ScrollArea ref={ref} variant="ghost" className={cx(styles.body, className)} {...props}>
    <div className={styles.bodyContent}>{children}</div>
  </ScrollArea>
));
DialogBody.displayName = "Dialog.Body";

/** The bottom section of the dialog: its actions, usually `Button`s. */
const DialogFooter = forwardRef<HTMLDivElement, DialogFooterProps>(
  ({ align = "end", className, ...props }, ref) => (
    <div ref={ref} className={cx(styles.footer, footerAlignClass[align], className)} {...props} />
  ),
);
DialogFooter.displayName = "Dialog.Footer";

/** An element that closes the dialog on click, placed anywhere inside `Dialog.Content`. */
const DialogClose = forwardRef<HTMLButtonElement, DialogCloseProps>(
  ({ asChild = false, className, ...props }, ref) => (
    <DialogPrimitive.Close ref={ref} asChild={asChild} className={className} {...props} />
  ),
);
DialogClose.displayName = "Dialog.Close";

type DialogComponent = typeof DialogRoot & {
  Trigger: typeof DialogTrigger;
  Content: typeof DialogContent;
  Header: typeof DialogHeader;
  Title: typeof DialogTitle;
  Description: typeof DialogDescription;
  Body: typeof DialogBody;
  Footer: typeof DialogFooter;
  Close: typeof DialogClose;
};

export const Dialog: DialogComponent = Object.assign(DialogRoot, {
  Trigger: DialogTrigger,
  Content: DialogContent,
  Header: DialogHeader,
  Title: DialogTitle,
  Description: DialogDescription,
  Body: DialogBody,
  Footer: DialogFooter,
  Close: DialogClose,
});
