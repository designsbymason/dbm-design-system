import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "../../atoms/Button";
import { Checkbox } from "../../atoms/Checkbox";
import { FieldLabel } from "../../atoms/FieldLabel";
import { Input } from "../../atoms/Input";
import { Stack } from "../../atoms/Stack";
import { Drawer } from "./Drawer";
import type { DrawerContentProps, DrawerProps } from "./Drawer.types";

/** Whether a story is drawn inside a Docs page or on its own; set by the stories' decorator. */
export const DrawerViewModeContext = createContext<"story" | "docs">("story");

/**
 * A box that keeps an open drawer inside it, for Storybook only: every `<Canvas>` on a Docs page shares one
 * document, so a drawer's `position: fixed` scrim would otherwise cover the whole page. A `transform` makes the
 * box the containing block of its fixed descendants, and the drawer is portaled into it through `container`, so it
 * attaches to the box's edge as it would to the viewport's.
 *
 * On a Docs page the box is a compact frame (`minBlockSize`). Viewed on its own, a story has the whole canvas, so
 * the box grows to fill it (less the preview's own padding) and a drawer attached to the top or bottom has
 * somewhere to be, and a side drawer is as tall as it would be on a page.
 */
export function DrawerStage({
  children,
  minBlockSize = "28rem",
}: {
  children: (container: HTMLElement | null) => ReactNode;
  /** How tall the box is on a Docs page; a story with more to show needs more room than a form does. */
  minBlockSize?: string;
}) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const viewMode = useContext(DrawerViewModeContext);
  const blockSize =
    viewMode === "docs" ? minBlockSize : `max(${minBlockSize}, calc(100vh - 2 * var(--dbm-space-6)))`;
  return (
    <div
      ref={setContainer}
      style={{
        position: "relative",
        transform: "translateZ(0)",
        minBlockSize: blockSize,
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
        border: "var(--dbm-border-width-1) dashed var(--dbm-border-default)",
        borderRadius: "var(--dbm-radius-lg)",
        background: "var(--dbm-bg-canvas)",
      }}
    >
      {children(container)}
    </div>
  );
}

/** The filter panel every gallery story opens, so the stories differ only in what they set on the drawer. */
export function FiltersDrawer({
  container,
  drawer,
  content,
  triggerLabel = "Filters",
  withFooter = true,
  children,
}: {
  container: HTMLElement | null;
  drawer?: Omit<DrawerProps, "children">;
  content?: DrawerContentProps;
  triggerLabel?: string;
  withFooter?: boolean;
  children?: ReactNode;
}) {
  return (
    <Drawer {...drawer}>
      <Drawer.Trigger asChild>
        <Button>{triggerLabel}</Button>
      </Drawer.Trigger>
      <Drawer.Content container={container} {...content}>
        <Drawer.Header>
          <Drawer.Title>Filters</Drawer.Title>
          <Drawer.Description>Narrow the list of results.</Drawer.Description>
        </Drawer.Header>
        <Drawer.Body>
          {children ?? (
            <Stack gap={3}>
              <div>
                <FieldLabel htmlFor="story-drawer-keyword">Keyword</FieldLabel>
                <Input id="story-drawer-keyword" placeholder="Search the catalogue" />
              </div>
              <Checkbox defaultChecked>In stock</Checkbox>
              <Checkbox>On sale</Checkbox>
            </Stack>
          )}
        </Drawer.Body>
        {withFooter && (
          <Drawer.Footer>
            <Drawer.Close asChild>
              <Button variant="secondary">Cancel</Button>
            </Drawer.Close>
            <Drawer.Close asChild>
              <Button>Apply</Button>
            </Drawer.Close>
          </Drawer.Footer>
        )}
      </Drawer.Content>
    </Drawer>
  );
}
