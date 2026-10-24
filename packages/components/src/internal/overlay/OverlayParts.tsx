import { cx } from "@dbm-system/primitives";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { forwardRef, useContext, useEffect, useRef } from "react";
import type { ComponentPropsWithoutRef, ReactNode, RefObject } from "react";
import { Heading } from "../../atoms/Heading";
import type { HeadingLevel, HeadingSize } from "../../atoms/Heading/Heading.types";
import { Text } from "../../atoms/Text";
import { ScrollArea } from "../../molecules/ScrollArea";
import { OverlayContentContext } from "./overlayContext";
import styles from "./OverlaySections.module.css";

// The sections of a modal panel built on Radix Dialog, shared by `Dialog` and `Drawer`. Each public part wraps
// one of these in its own forwardRef component, so its own JSDoc and types document it. (`AlertDialog` draws its
// own title and description over Radix's alert primitive, and shares this module's body, footer and stylesheet.)

export type OverlayFooterAlign = "start" | "end" | "between" | "stretch";

const footerAlignClass: Record<OverlayFooterAlign, string | undefined> = {
  start: styles.alignStart,
  end: undefined,
  between: styles.alignBetween,
  stretch: styles.alignStretch,
};

export const OverlayHeader = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, ref) => <div ref={ref} className={cx(styles.header, className)} {...props} />,
);
OverlayHeader.displayName = "OverlayHeader";

export interface OverlayTitleProps extends Omit<ComponentPropsWithoutRef<"h2">, "color"> {
  level?: HeadingLevel;
  size?: HeadingSize;
}

export const OverlayTitle = forwardRef<HTMLHeadingElement, OverlayTitleProps>(
  ({ level = 2, size = "xl", className, children, ...props }, ref) => {
    // Depends on the stable function, not the context object: that is rebuilt whenever `busy` or `divided`
    // changes, which would unregister and re-register the title and briefly leave the panel unnamed.
    const registerTitle = useContext(OverlayContentContext)?.registerTitle;
    useEffect(() => registerTitle?.(), [registerTitle]);
    return (
      <DialogPrimitive.Title asChild>
        <Heading ref={ref} level={level} size={size} className={cx(styles.title, className)} {...props}>
          {children}
        </Heading>
      </DialogPrimitive.Title>
    );
  },
);
OverlayTitle.displayName = "OverlayTitle";

export const OverlayDescription = forwardRef<HTMLParagraphElement, Omit<ComponentPropsWithoutRef<"p">, "color">>(
  ({ className, children, ...props }, ref) => {
    const registerDescription = useContext(OverlayContentContext)?.registerDescription;
    useEffect(() => registerDescription?.(), [registerDescription]);
    return (
      <DialogPrimitive.Description asChild>
        <Text ref={ref} size="sm" color="secondary" className={cx(styles.description, className)} {...props}>
          {children}
        </Text>
      </DialogPrimitive.Description>
    );
  },
);
OverlayDescription.displayName = "OverlayDescription";

/**
 * The main content, a scroll region that takes whatever height is left between the header and the footer, so
 * long content scrolls inside the panel while they stay in view.
 */
export type OverlayBodyProps = Omit<ComponentPropsWithoutRef<typeof ScrollArea>, "children"> & { children?: ReactNode };

export const OverlayBody = forwardRef<HTMLDivElement, OverlayBodyProps>(
  ({ className, children, ...props }, ref) => {
    const content = useContext(OverlayContentContext);
    const viewportRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
    const watch = content?.watchScroll ?? false;
    const reportScroll = content?.reportScroll;

    // Which sides have content out of view, read from the scroll position: `useScrollEdges` compares the first
    // and last *item* with the box, and a body is one tall item, which is out of view on both sides always.
    useEffect(() => {
      const viewport = viewportRef.current;
      if (!watch || !viewport || !reportScroll) return undefined;
      const read = () => {
        const EPSILON = 1;
        reportScroll({
          start: viewport.scrollTop > EPSILON,
          end: viewport.scrollTop + viewport.clientHeight < viewport.scrollHeight - EPSILON,
        });
      };
      read();
      viewport.addEventListener("scroll", read, { passive: true });
      // The viewport's own size changing (the panel growing or shrinking) and its content's (text added).
      const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(read);
      observer?.observe(viewport);
      if (viewport.firstElementChild) observer?.observe(viewport.firstElementChild);
      return () => {
        viewport.removeEventListener("scroll", read);
        observer?.disconnect();
        reportScroll({ start: false, end: false });
      };
    }, [watch, reportScroll]);

    return (
      <ScrollArea ref={ref} viewportRef={viewportRef} variant="ghost" className={cx(styles.body, className)} {...props}>
        <div className={styles.bodyContent}>{children}</div>
      </ScrollArea>
    );
  },
);
OverlayBody.displayName = "OverlayBody";

export interface OverlayFooterProps extends ComponentPropsWithoutRef<"div"> {
  align?: OverlayFooterAlign;
}

export const OverlayFooter = forwardRef<HTMLDivElement, OverlayFooterProps>(
  ({ align = "end", className, ...props }, ref) => (
    <div ref={ref} className={cx(styles.footer, footerAlignClass[align], className)} {...props} />
  ),
);
OverlayFooter.displayName = "OverlayFooter";
