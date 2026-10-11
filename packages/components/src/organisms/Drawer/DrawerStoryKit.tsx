import type { ReactNode } from "react";
import { Button } from "../../atoms/Button";
import { Checkbox } from "../../atoms/Checkbox";
import { FieldLabel } from "../../atoms/FieldLabel";
import { Input } from "../../atoms/Input";
import { Stack } from "../../atoms/Stack";
import { Drawer } from "./Drawer";
import type { DrawerContentProps, DrawerProps } from "./Drawer.types";

/**
 * A box that keeps an open drawer inside it, for Storybook only: every `<Canvas>` on a Docs page shares one
 * document, so a drawer's `position: fixed` scrim would otherwise cover the whole page. A `transform` makes the box
 * the containing block of its fixed descendants, and the drawer is portaled into it through `container`, so it
 * attaches to the box's edge as it would to the viewport's.
 */
export { DialogStage as DrawerStage } from "../Dialog/DialogStoryKit";

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
