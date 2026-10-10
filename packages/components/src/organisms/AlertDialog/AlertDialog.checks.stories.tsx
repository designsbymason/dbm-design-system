import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { Dialog } from "../Dialog";
import { AlertDialog } from "./AlertDialog";

// Real-browser checks for what jsdom can't evaluate: layout, a real mouse, the breakpoint, computed colour from the
// cascade. Hidden from the sidebar and the Docs page, and still run as tests (07 §4.2, guidelines/adr/0013).
const meta: Meta = {
  title: "Organisms/Overlay/AlertDialog/Checks",
  tags: ["!dev"],
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj;

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
// A measurement taken while the entrance is still easing is wrong by the easing's distance, so wait for every
// animation on the panel and its scrim to finish first.
const settled = async (alert: HTMLElement) => {
  await nextFrame();
  const running = [alert, alert.parentElement as HTMLElement].flatMap((element) => element.getAnimations());
  await Promise.all(running.map((animation) => animation.finished.catch(() => undefined)));
  await nextFrame();
};

// A real mouse through the Chrome DevTools Protocol, mapped through the test iframe's scale.
async function realClick(element: Element) {
  const rect = element.getBoundingClientRect();
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame ? frame.width / window.innerWidth : 1;
  const x = (frame?.left ?? 0) + (rect.left + rect.width / 2) * scale;
  const y = (frame?.top ?? 0) + (rect.top + rect.height / 2) * scale;
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
}

function Delete({
  tone = "danger",
  busy = false,
  dir,
  defaultOpen = true,
}: {
  tone?: "neutral" | "info" | "warning" | "danger";
  busy?: boolean;
  dir?: "ltr" | "rtl";
  defaultOpen?: boolean;
}) {
  return (
    <AlertDialog defaultOpen={defaultOpen}>
      <AlertDialog.Trigger asChild>
        <Button>Open</Button>
      </AlertDialog.Trigger>
      <AlertDialog.Content tone={tone} busy={busy} dir={dir} data-testid="panel">
        <AlertDialog.Header data-testid="header">
          <AlertDialog.Title>Delete project?</AlertDialog.Title>
          <AlertDialog.Description>It cannot be undone.</AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer data-testid="footer">
          <AlertDialog.Cancel>Keep it</AlertDialog.Cancel>
          <AlertDialog.Action>Delete</AlertDialog.Action>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog>
  );
}

export const ScrimPressIsIgnored: Story = {
  name: "A real press on the scrim does not close it",
  render: () => <Delete />,
  play: async () => {
    const alert = await within(document.body).findByRole("alertdialog");
    await settled(alert);
    await realClick(alert.parentElement as HTMLElement);
    await nextFrame();
    await expect(within(document.body).getByRole("alertdialog")).toBeInTheDocument();
  },
};

export const FocusStartsOnCancelAndLoops: Story = {
  name: "Focus starts on Cancel, loops with Tab, and returns to the trigger",
  render: () => <Delete defaultOpen={false} />,
  play: async () => {
    const body = within(document.body);
    const trigger = body.getByRole("button", { name: "Open" });
    await userEvent.click(trigger);
    const alert = await body.findByRole("alertdialog");
    await waitFor(() => expect(body.getByRole("button", { name: "Keep it" })).toHaveFocus());
    for (let press = 0; press < 6; press += 1) {
      await userEvent.tab();
      await expect(alert.contains(document.activeElement)).toBe(true);
    }
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const FooterStacksOnAPhone: Story = {
  name: "On a phone the buttons stack full width with the action on top",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => <Delete />,
  play: async () => {
    await expect(window.innerWidth).toBeLessThan(640);
    const alert = await within(document.body).findByRole("alertdialog");
    await settled(alert);
    const footer = within(alert).getByTestId("footer").getBoundingClientRect();
    const action = within(alert).getByRole("button", { name: "Delete" }).getBoundingClientRect();
    const cancel = within(alert).getByRole("button", { name: "Keep it" }).getBoundingClientRect();
    await expect(action.top).toBeLessThan(cancel.top);
    // each fills the footer's content width (its padding is the panel's, 24px a side)
    await expect(Math.round(action.width)).toBe(Math.round(footer.width - 48));
    await expect(Math.round(cancel.width)).toBe(Math.round(action.width));
  },
};

export const FooterIsARowFromSm: Story = {
  name: "From sm the buttons sit in a row, Cancel before Action",
  render: () => <Delete />,
  play: async () => {
    const alert = await within(document.body).findByRole("alertdialog");
    await settled(alert);
    const action = within(alert).getByRole("button", { name: "Delete" }).getBoundingClientRect();
    const cancel = within(alert).getByRole("button", { name: "Keep it" }).getBoundingClientRect();
    await expect(Math.abs(action.top - cancel.top)).toBeLessThan(2);
    await expect(cancel.right).toBeLessThanOrEqual(action.left);
  },
};

export const IconAtTheStartInRightToLeft: Story = {
  name: "Right to left puts the icon at the start (the right) and the actions mirrored",
  render: () => <Delete dir="rtl" />,
  play: async () => {
    const alert = await within(document.body).findByRole("alertdialog");
    await settled(alert);
    const medallion = alert.querySelector("[aria-hidden='true']") as HTMLElement;
    const title = within(alert).getByRole("heading").getBoundingClientRect();
    await expect(medallion.getBoundingClientRect().left).toBeGreaterThan(title.left);
    const action = within(alert).getByRole("button", { name: "Delete" }).getBoundingClientRect();
    const cancel = within(alert).getByRole("button", { name: "Keep it" }).getBoundingClientRect();
    // in rtl the first button in the DOM sits to the right
    await expect(cancel.left).toBeGreaterThan(action.left);
  },
};

const channel = (value: number) => {
  const scaled = value / 255;
  return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]: number[]) => 0.2126 * channel(r ?? 0) + 0.7152 * channel(g ?? 0) + 0.0722 * channel(b ?? 0);
const parse = (colour: string) => (colour.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
const ratio = (a: number[], b: number[]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

export const ToneIconContrast: Story = {
  name: "Each tone's icon clears 3:1 against its disc, in all four themes",
  render: () => (
    <>
      {(["info", "warning", "danger"] as const).map((tone) => (
        <Delete key={tone} tone={tone} defaultOpen={false} />
      ))}
    </>
  ),
  play: async () => {
    // Open each in turn and read the icon colour against the disc the stylesheet draws behind it.
    const body = within(document.body);
    const results: Record<string, number> = {};
    for (const theme of ["purple-light", "purple-dark", "emerald-light", "emerald-dark"]) {
      document.documentElement.dataset.theme = theme;
      for (const [index, tone] of (["info", "warning", "danger"] as const).entries()) {
        await userEvent.click(body.getAllByRole("button", { name: "Open" })[index] as HTMLElement);
        const alert = await body.findByRole("alertdialog");
        await settled(alert);
        const disc = alert.querySelector("[aria-hidden='true']") as HTMLElement;
        const glyph = disc.querySelector("svg") as SVGElement;
        results[`${theme}/${tone}`] = ratio(parse(getComputedStyle(disc).backgroundColor), parse(getComputedStyle(glyph).color));
        await userEvent.keyboard("{Escape}");
        await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
      }
    }
    for (const [name, value] of Object.entries(results)) {
      await expect(value, name).toBeGreaterThanOrEqual(3);
    }
  },
};

export const BusyAlertCannotBeLeft: Story = {
  name: "A busy alert ignores Escape and real presses, and its buttons stay focusable",
  render: () => <Delete busy />,
  play: async () => {
    const body = within(document.body);
    const alert = await body.findByRole("alertdialog");
    await settled(alert);
    const cancel = body.getByRole("button", { name: "Keep it" });
    await expect(cancel).toHaveAttribute("aria-disabled", "true");
    cancel.focus();
    await expect(cancel).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await realClick(alert.parentElement as HTMLElement);
    await realClick(body.getByRole("button", { name: "Delete" }));
    await realClick(cancel);
    await nextFrame();
    await expect(body.getByRole("alertdialog")).toBeInTheDocument();
  },
};

export const OverADialogStacksScrims: Story = {
  name: "Opened over a dialog: two scrims, the alert's on top, and the dialog stays legible",
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Content data-testid="outer">
        <Dialog.Header>
          <Dialog.Title>Project settings</Dialog.Title>
        </Dialog.Header>
        <Dialog.Footer>
          <Delete defaultOpen={false} />
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  ),
  play: async () => {
    const body = within(document.body);
    const outer = await body.findByRole("dialog", { name: "Project settings" });
    await settled(outer);
    await userEvent.click(body.getByRole("button", { name: "Open" }));
    const alert = await body.findByRole("alertdialog");
    await settled(alert);
    const outerScrim = outer.parentElement as HTMLElement;
    const alertScrim = alert.parentElement as HTMLElement;
    await expect(outerScrim).not.toBe(alertScrim);
    await expect(Number(getComputedStyle(alertScrim).zIndex)).toBeGreaterThanOrEqual(
      Number(getComputedStyle(outerScrim).zIndex),
    );
    // painted later, so above it
    await expect(outerScrim.compareDocumentPosition(alertScrim) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // the dialog behind sits under the alert's scrim (black at 60%): its text and surface, both dimmed alike,
    // keep a legible ratio. An inactive layer is exempt from contrast, so this is for legibility, not conformance.
    const style = getComputedStyle(outer);
    const dim = (colour: number[]) => colour.map((value) => value * 0.4);
    await expect(ratio(dim(parse(style.color)), dim(parse(style.backgroundColor)))).toBeGreaterThanOrEqual(3);
    // a real press on the alert's scrim reaches neither
    await realClick(alertScrim);
    await nextFrame();
    await expect(body.getByRole("alertdialog")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
    // the dialog behind is exposed again once the alert has gone (its `aria-hidden` is removed with the panel)
    await waitFor(() => expect(body.getByRole("dialog", { name: "Project settings" })).toBeInTheDocument());
  },
};
