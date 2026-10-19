import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { Button } from "../../atoms/Button";
import buttonStyles from "../../atoms/Button/Button.module.css";
import { Tooltip } from "../../atoms/Tooltip";
import { HoverCard } from "../../molecules/HoverCard";
import { Popover } from "../../molecules/Popover";
import { AlertDialog } from "../AlertDialog";
import { Dialog } from "../Dialog";
import { Drawer } from "../Drawer";
import { Menu } from "../Menu";
import { Navbar } from "./Navbar";

// What `Navbar.Actions` hands its buttons (the row's size) crosses a React portal, so a button in a dialog, popover or menu opened from
// the actions would take it too. Each overlay puts its consumer's content out of reach of the group's settings (`ButtonGroupReset`).
const overlays: Array<[string, ReactNode, boolean]> = [
  ["Popover", <Popover key="p"><Popover.Trigger asChild><Button>Open</Button></Popover.Trigger><Popover.Content aria-label="Panel"><Button>Inside</Button></Popover.Content></Popover>, true],
  ["Dialog", <Dialog key="d"><Dialog.Trigger>Open</Dialog.Trigger><Dialog.Content><Dialog.Title>Title</Dialog.Title><Dialog.Description>About</Dialog.Description><Button>Inside</Button></Dialog.Content></Dialog>, true],
  ["Drawer", <Drawer key="r"><Drawer.Trigger>Open</Drawer.Trigger><Drawer.Content><Drawer.Title>Title</Drawer.Title><Drawer.Description>About</Drawer.Description><Button>Inside</Button></Drawer.Content></Drawer>, true],
  ["AlertDialog", <AlertDialog key="a"><AlertDialog.Trigger>Open</AlertDialog.Trigger><AlertDialog.Content><AlertDialog.Title>Title</AlertDialog.Title><AlertDialog.Description>About</AlertDialog.Description><Button>Inside</Button></AlertDialog.Content></AlertDialog>, true],
  ["Menu", <Menu key="m"><Menu.Trigger>Open</Menu.Trigger><Menu.Content><Button>Inside</Button></Menu.Content></Menu>, true],
  ["HoverCard", <HoverCard key="h" defaultOpen><HoverCard.Trigger href="/x">Open</HoverCard.Trigger><HoverCard.Content aria-label="Card"><Button>Inside</Button></HoverCard.Content></HoverCard>, false],
  ["Tooltip", <Tooltip key="t" defaultOpen content={<Button>Inside</Button>}><span>Open</span></Tooltip>, false],
];

describe("Navbar.Actions' size stays out of what its overlays draw", () => {
  it.each(overlays)("%s opened from the actions draws its buttons at the default size, not the bar's", async (_name, overlay, needsClick) => {
    const user = userEvent.setup();
    render(
      <Navbar size="xs">
        <Navbar.Actions>
          <Button>Direct</Button>
          {overlay}
        </Navbar.Actions>
      </Navbar>,
    );
    // a button of the actions' own takes the bar's size
    expect(screen.getByRole("button", { name: "Direct" })).toHaveClass(buttonStyles.sizeXs!);
    if (needsClick) await user.click(screen.getByText("Open"));
    const inside = await screen.findByRole("button", { name: "Inside", hidden: true });
    expect(inside).toHaveClass(buttonStyles.sizeMd!);
    expect(inside).not.toHaveClass(buttonStyles.sizeXs!);
  });
});
