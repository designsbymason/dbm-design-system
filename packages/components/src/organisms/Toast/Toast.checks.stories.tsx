import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { Dialog } from "../Dialog";
import { Toast, useToast } from "./Toast";
import type { ToastOptions, ToastProviderProps } from "./Toast.types";

// Real-browser checks for what jsdom can't evaluate: where the region sits, a swipe with a real pointer, a toast above a
// modal dialog under a real mouse, focus coming back, forced colours and the sizes of targets. Hidden from the sidebar
// and the Docs page, and still run as tests (07 §4.2, guidelines/adr/0013).
const meta: Meta = {
  title: "Organisms/Feedback/Toast/Checks",
  tags: ["!dev"],
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj;

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
// A measurement taken while the entrance is still easing is wrong by the easing's distance (it slides in and scales
// up from 0.96), so wait for every animation on the toast to finish first.
const settled = async (element: HTMLElement) => {
  await nextFrame();
  await Promise.all(element.getAnimations().map((animation) => animation.finished.catch(() => undefined)));
  await nextFrame();
};
const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize);
const toastItems = () => Array.from(document.querySelectorAll<HTMLElement>("li[data-state]"));
const firstToast = async () => {
  await waitFor(() => expect(toastItems().length).toBeGreaterThan(0));
  const item = toastItems()[0] as HTMLElement;
  await settled(item);
  return item;
};

// Raises a toast from a button, so a check starts the way a person does.
function Raise({ options, label = "Raise" }: { options: ToastOptions; label?: string }) {
  const { toast } = useToast();
  return <Button onClick={() => toast(options)}>{label}</Button>;
}

function App({ provider, options, children }: { provider?: Omit<ToastProviderProps, "children">; options?: ToastOptions; children?: React.ReactNode }) {
  return (
    <Toast.Provider {...provider}>
      <div style={{ minBlockSize: "100vh", padding: "var(--dbm-space-4)" }}>
        <Raise options={options ?? { tone: "success", title: "Saved", description: "Your changes are live." }} />
        {children}
      </div>
    </Toast.Provider>
  );
}

// A real mouse and keyboard, through the Chrome DevTools Protocol: Storybook's `userEvent` sends synthetic events.
// The test page scales its iframe, so a point inside the story is mapped to the page it is drawn on.
function pagePoint(x: number, y: number) {
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame ? frame.width / window.innerWidth : 1;
  return { x: (frame?.left ?? 0) + x * scale, y: (frame?.top ?? 0) + y * scale };
}
async function realClick(element: Element) {
  const rect = element.getBoundingClientRect();
  const { x, y } = pagePoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
}
async function realMoveTo(element: Element) {
  const rect = element.getBoundingClientRect();
  const { x, y } = pagePoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
}
async function realDrag(element: Element, dx: number) {
  const rect = element.getBoundingClientRect();
  const start = pagePoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: start.x, y: start.y });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: start.x, y: start.y, button: "left", clickCount: 1 });
  for (let step = 1; step <= 6; step += 1) {
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: start.x + (dx * step) / 6, y: start.y, buttons: 1 });
  }
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: start.x + dx, y: start.y, button: "left", clickCount: 1 });
}
const pressKey = async (key: string, code: string, windowsVirtualKeyCode: number, text?: string) => {
  // `text` makes it a key that types (Enter activates a button on the character event, not the raw key).
  await send("Input.dispatchKeyEvent", { type: text ? "keyDown" : "rawKeyDown", key, code, windowsVirtualKeyCode, text });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode });
};

export const PlacementBottomEnd: Story = {
  name: "Bottom end sits against the corner, one gutter in, at the toast width",
  render: () => <App />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Raise" }));
    const item = await firstToast();
    const rect = item.getBoundingClientRect();
    const gutter = 4 * (rem() / 4); // space-4 is 1rem
    await expect(Math.round(rect.right)).toBe(window.innerWidth - Math.round(gutter));
    await expect(Math.round(rect.bottom)).toBe(window.innerHeight - Math.round(gutter));
    await expect(Math.round(rect.width)).toBe(Math.round(24 * rem()));
    // above the page, on the toast step of the scale
    await expect(getComputedStyle(item.closest("ol") as HTMLElement).zIndex).toBe("1600");
  },
};

export const PlacementTopStartRightToLeft: Story = {
  name: "Top start in right to left is the top-right corner",
  render: () => <App provider={{ placement: "top-start", dir: "rtl" }} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Raise" }));
    const item = await firstToast();
    const rect = item.getBoundingClientRect();
    const gutter = rem();
    await expect(Math.round(rect.top)).toBe(Math.round(gutter));
    await expect(Math.round(rect.right)).toBe(window.innerWidth - Math.round(gutter));
  },
};

export const NewerStackNearestTheEdge: Story = {
  name: "A newer toast sits nearer the edge the list is against",
  render: () => <App provider={{ placement: "bottom" }} />,
  play: async ({ canvasElement }) => {
    const raise = within(canvasElement).getByRole("button", { name: "Raise" });
    await userEvent.click(raise);
    await userEvent.click(raise);
    await waitFor(() => expect(toastItems()).toHaveLength(2));
    await settled(toastItems()[1] as HTMLElement);
    const [older, newer] = toastItems() as [HTMLElement, HTMLElement];
    await expect(newer.getBoundingClientRect().top).toBeGreaterThan(older.getBoundingClientRect().top);
    // centred
    const centre = (element: HTMLElement) => element.getBoundingClientRect().left + element.getBoundingClientRect().width / 2;
    await expect(Math.abs(centre(newer) - window.innerWidth / 2)).toBeLessThan(1);
  },
};

export const OnAPhoneItSpansTheScreen: Story = {
  name: "On a phone a toast spans the screen less its gutter",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => <App provider={{ placement: "top-end" }} />,
  play: async ({ canvasElement }) => {
    // Fails loudly if the viewport didn't apply, rather than passing for the wrong reason at desktop width.
    await expect(window.innerWidth).toBeLessThan(640);
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Raise" }));
    const item = await firstToast();
    const rect = item.getBoundingClientRect();
    await expect(Math.round(rect.width)).toBe(window.innerWidth - 2 * Math.round(rem()));
    await expect(Math.round(rect.left)).toBe(Math.round(rem()));
  },
};

export const ContainedInItsStage: Story = {
  name: "Given a container, the region and its toasts stay inside it",
  render: function Contained() {
    const [box, setBox] = useState<HTMLElement | null>(null);
    return (
      <div style={{ padding: "var(--dbm-space-6)" }}>
        <div
          ref={setBox}
          data-testid="stage"
          style={{ position: "relative", transform: "translateZ(0)", inlineSize: "40rem", blockSize: "20rem", overflow: "hidden" }}
        >
          <Toast.Provider container={box}>
            <Raise options={{ title: "Saved" }} />
          </Toast.Provider>
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Raise" }));
    const item = await firstToast();
    const stage = within(canvasElement).getByTestId("stage").getBoundingClientRect();
    const rect = item.getBoundingClientRect();
    await expect(rect.left).toBeGreaterThanOrEqual(stage.left);
    await expect(rect.right).toBeLessThanOrEqual(stage.right);
    await expect(rect.bottom).toBeLessThanOrEqual(stage.bottom);
  },
};

export const SwipeClosesTowardTheEdge: Story = {
  name: "A swipe toward the edge closes it, and one away does not",
  render: () => <App provider={{ duration: null }} options={{ title: "Saved" }} />,
  play: async ({ canvasElement }) => {
    const raise = within(canvasElement).getByRole("button", { name: "Raise" });
    await userEvent.click(raise);
    let item = await firstToast();
    // away from the edge (left, for a toast against the right edge): nothing happens, and it stays
    await realDrag(item, -140);
    await expect(item).toHaveAttribute("data-state", "open");
    await expect(item).not.toHaveAttribute("data-swipe", "end");
    // toward it, but not far enough: it follows the pointer, springs back and stays
    await realDrag(item, 20);
    await waitFor(() => expect(item).toHaveAttribute("data-swipe", "cancel"));
    await expect(item).toHaveAttribute("data-state", "open");
    // toward it: closed
    await realDrag(item, 140);
    await waitFor(() => expect(document.body.contains(item)).toBe(false), { timeout: 3000 });
    // and again, to be sure what was measured is the toast, not a leftover
    await userEvent.click(raise);
    item = await firstToast();
    await expect(item).toHaveAttribute("data-state", "open");
  },
};

export const SwipeInRightToLeft: Story = {
  name: "In right to left the edge is the other side",
  render: () => <App provider={{ duration: null, dir: "rtl", placement: "bottom-start" }} options={{ title: "Saved" }} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Raise" }));
    const item = await firstToast();
    await expect(item).toHaveAttribute("data-swipe-direction", "right");
    await realDrag(item, 140);
    await waitFor(() => expect(document.body.contains(item)).toBe(false), { timeout: 3000 });
  },
};

export const HoverHoldsTheTimer: Story = {
  name: "A real pointer over the toasts holds the time, and leaving carries on",
  render: () => <App provider={{ duration: 700 }} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Raise" }));
    const item = await firstToast();
    await realMoveTo(item);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await expect(document.body.contains(item)).toBe(true);
    await expect(item).toHaveAttribute("data-state", "open");
    // away from the toasts, onto the page's own button
    await realMoveTo(within(canvasElement).getByRole("button", { name: "Raise" }));
    await waitFor(() => expect(document.body.contains(item)).toBe(false), { timeout: 3000 });
  },
};

export const KeyboardAndFocusReturn: Story = {
  name: "F8 moves into the toasts, an action closes one, and focus goes back to where it was",
  render: () => <App provider={{ duration: null }} options={{ title: "Deleted", action: { label: "Undo", altText: "Undo from the Edit menu" } }} />,
  play: async ({ canvasElement }) => {
    const raise = within(canvasElement).getByRole("button", { name: "Raise" });
    await userEvent.click(raise);
    await firstToast();
    raise.focus();
    await pressKey("F8", "F8", 119);
    const region = document.querySelector<HTMLElement>("ol[data-placement]") as HTMLElement;
    await waitFor(() => expect(document.activeElement).toBe(region));
    // The first Tab from the list lands on the toast, the next on its action: a real tab stop, in a real order.
    await pressKey("Tab", "Tab", 9);
    const action = within(document.body).getByRole("button", { name: "Undo" });
    for (let presses = 0; presses < 3 && document.activeElement !== action; presses += 1) await pressKey("Tab", "Tab", 9);
    await expect(document.activeElement).toBe(action);
    await pressKey("Enter", "Enter", 13, "\r");
    await waitFor(() => expect(toastItems()).toHaveLength(0));
    await waitFor(() => expect(document.activeElement).toBe(raise));
  },
};

export const FocusIsNotStolenAfterALateFinish: Story = {
  name: "Focus that has moved on stays where it is when the toasts go",
  render: () => (
    <App provider={{ duration: null }} options={{ title: "Saved" }}>
      <button type="button">Elsewhere</button>
    </App>
  ),
  play: async ({ canvasElement }) => {
    const raise = within(canvasElement).getByRole("button", { name: "Raise" });
    await userEvent.click(raise);
    await firstToast();
    raise.focus();
    await pressKey("F8", "F8", 119);
    const dismiss = within(document.body).getByRole("button", { name: "Dismiss" });
    dismiss.focus();
    // the person moves on to somewhere else on the page before the toast is closed from code
    const elsewhere = within(canvasElement).getByRole("button", { name: "Elsewhere" });
    elsewhere.focus();
    await userEvent.click(dismiss);
    await waitFor(() => expect(toastItems()).toHaveLength(0));
    await expect(document.activeElement).not.toBe(raise);
  },
};

function DialogApp({ onUndo }: { onUndo: () => void }) {
  const { toast } = useToast();
  return (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="Settings">
        <Dialog.Body>
          <Button
            onClick={() =>
              toast({
                title: "Archived",
                duration: null,
                action: { label: "Undo", altText: "Undo from the Edit menu", onClick: onUndo },
              })
            }
          >
            Archive
          </Button>
        </Dialog.Body>
      </Dialog.Content>
    </Dialog>
  );
}

export const AboveAModalDialog: Story = {
  name: "Raised while a modal dialog is open, a toast is on top and answers a real click",
  render: () => {
    const onUndo = fn();
    return (
      <Toast.Provider>
        <DialogApp onUndo={onUndo} />
      </Toast.Provider>
    );
  },
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Archive" }));
    const item = await firstToast();
    // hidden: true, because the modal dialog hides the rest of the page from assistive technology, the toasts' region
    // included; the announcement is made separately, and the action is also available elsewhere (altText)
    const action = within(item).getByRole("button", { name: "Undo", hidden: true });
    const rect = action.getBoundingClientRect();
    // the toast's own button is the top element at its own point: not under the dialog's scrim (z-index 1300)
    await expect(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)).toBe(action);
    await expect(getComputedStyle(action).pointerEvents).not.toBe("none");
    await realClick(action);
    await waitFor(() => expect(toastItems()).toHaveLength(0));
    // the dialog is still open: a press in the toast is not "outside" it
    await expect(within(document.body).getByRole("dialog")).toBeInTheDocument();
  },
};

function RaiseEverySize() {
  const { toast } = useToast();
  return (
    <Button
      onClick={() => {
        for (const size of ["xs", "sm", "md", "lg", "xl"] as const) {
          toast({
            id: size,
            size,
            title: `Size ${size}`,
            duration: null,
            action: { label: "Open", altText: "Open it from the list" },
          });
        }
      }}
    >
      Raise
    </Button>
  );
}

function OpenDialogAfterToast({ onUndo }: { onUndo: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        onClick={() => {
          toast({ title: "Archived", duration: null, action: { label: "Undo", altText: "Undo from the Edit menu", onClick: onUndo } });
        }}
      >
        Archive
      </Button>
      <Button onClick={() => setOpen(true)}>Settings</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <Dialog.Content aria-label="Settings">
          <Dialog.Body>Body</Dialog.Body>
        </Dialog.Content>
      </Dialog>
    </>
  );
}

export const ShowingBeforeAModalDialogOpens: Story = {
  name: "A toast already showing when a modal dialog opens still answers a real click",
  render: () => {
    const onUndo = fn();
    return (
      <Toast.Provider>
        <OpenDialogAfterToast onUndo={onUndo} />
      </Toast.Provider>
    );
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Archive" }));
    const item = await firstToast();
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Settings" }));
    await within(document.body).findByRole("dialog");
    const action = within(item).getByRole("button", { name: "Undo", hidden: true });
    await expect(getComputedStyle(action).pointerEvents).not.toBe("none");
    const rect = action.getBoundingClientRect();
    await expect(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)).toBe(action);
  },
};

export const EscapeInADialogClosesTheToastFirst: Story = {
  name: "With focus in a modal dialog, Escape closes the newest toast, and the next one the dialog",
  render: () => (
    <Toast.Provider>
      <DialogApp onUndo={() => undefined} />
    </Toast.Provider>
  ),
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Archive" }));
    await firstToast();
    within(dialog).getByRole("button", { name: "Archive" }).focus();
    await pressKey("Escape", "Escape", 27);
    await waitFor(() => expect(toastItems()).toHaveLength(0));
    await expect(within(document.body).queryByRole("dialog")).toBeInTheDocument();
    await pressKey("Escape", "Escape", 27);
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
  },
};

export const TargetsAreAtLeast24px: Story = {
  name: "The dismiss button and the action are at least 24 by 24 at every size",
  render: () => (
    <Toast.Provider limit={5} duration={null}>
      <RaiseEverySize />
    </Toast.Provider>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Raise" }));
    await waitFor(() => expect(toastItems()).toHaveLength(5));
    await settled(toastItems()[4] as HTMLElement);
    for (const item of toastItems()) {
      for (const name of ["Dismiss", "Open"]) {
        const target = within(item).getByRole("button", { name });
        const rect = target.getBoundingClientRect();
        await expect(rect.width).toBeGreaterThanOrEqual(24);
        await expect(rect.height).toBeGreaterThanOrEqual(24);
      }
    }
  },
};

export const ForcedColoursKeepAnEdge: Story = {
  name: "In forced colours a toast keeps an edge, in a system colour",
  render: () => <App provider={{ duration: null, variant: "solid" }} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Raise" }));
    const item = await firstToast();
    await send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value: "active" }] });
    try {
      await nextFrame();
      await nextFrame();
      const style = getComputedStyle(item);
      await expect(parseFloat(style.borderTopWidth)).toBeGreaterThan(0);
      await expect(style.borderTopStyle).toBe("solid");
      // a system colour: not the transparent that would draw as nothing
      await expect(style.borderTopColor).not.toBe("rgba(0, 0, 0, 0)");
    } finally {
      await send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value: "none" }] });
    }
  },
};

export const ReducedMotionIsAFade: Story = {
  name: "With reduced motion the entrance is a fade, not a slide",
  render: () => <App provider={{ duration: null }} />,
  play: async ({ canvasElement }) => {
    await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    try {
      await userEvent.click(within(canvasElement).getByRole("button", { name: "Raise" }));
      await waitFor(() => expect(toastItems().length).toBeGreaterThan(0));
      const item = toastItems()[0] as HTMLElement;
      await expect(getComputedStyle(item).animationName).toMatch(/toastFadeIn/);
    } finally {
      await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
    }
  },
};
