import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { Popover } from "../../molecules/Popover";
import { Select } from "../../molecules/Select";
import { Dialog } from "./Dialog";
import { LongText } from "./DialogStoryKit";

// Real-browser checks for what jsdom can't evaluate: layout, the scroll lock, a press on a portaled child, the
// breakpoint, computed style from the cascade and the stylesheet's own rules. Hidden from the sidebar and the
// Docs page, and still run as tests (07 §4.2, guidelines/adr/0013).
const meta: Meta = {
  title: "Organisms/Overlay/Dialog/Checks",
  tags: ["!dev"],
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj;

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
// A measurement taken while the entrance is still easing is wrong by the easing's distance (the panel scales
// from 0.98), so wait for every animation on the panel and its scrim to finish first.
const settled = async (dialog: HTMLElement) => {
  await nextFrame();
  const running = [dialog, dialog.parentElement as HTMLElement].flatMap((element) => element.getAnimations());
  await Promise.all(running.map((animation) => animation.finished.catch(() => undefined)));
  await nextFrame();
};
const openFrom = async (name: string) => {
  const trigger = within(document.body).getByRole("button", { name });
  await userEvent.click(trigger);
  return within(document.body).findByRole("dialog");
};

function Form({ children, dir }: { children?: React.ReactNode; dir?: "ltr" | "rtl" }) {
  return (
    <div style={{ minBlockSize: "100vh", padding: "var(--dbm-space-4)" }}>
      <Dialog>
        <Dialog.Trigger asChild>
          <Button>Open</Button>
        </Dialog.Trigger>
        <Dialog.Content dir={dir} data-testid="panel">
          <Dialog.Header data-testid="header">
            <Dialog.Title>Edit profile</Dialog.Title>
            <Dialog.Description>Changes are saved to your account.</Dialog.Description>
          </Dialog.Header>
          <Dialog.Body data-testid="body">{children ?? <p>Short body</p>}</Dialog.Body>
          <Dialog.Footer data-testid="footer">
            <Dialog.Close asChild>
              <Button variant="secondary">Cancel</Button>
            </Dialog.Close>
            <Button>Save</Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </div>
  );
}

export const ScrimAndLayout: Story = {
  name: "Scrim fills the viewport and the panel is centred at md",
  render: () => <Form />,
  play: async () => {
    const dialog = await openFrom("Open");
    await settled(dialog);
    const scrim = dialog.parentElement as HTMLElement;
    const scrimRect = scrim.getBoundingClientRect();
    await expect(Math.round(scrimRect.width)).toBe(window.innerWidth);
    await expect(Math.round(scrimRect.height)).toBe(window.innerHeight);
    const rect = dialog.getBoundingClientRect();
    // size md is 32rem (the dialog.max-width.md token)
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    await expect(Math.round(rect.width)).toBe(Math.round(32 * rem));
    await expect(Math.abs(rect.left + rect.width / 2 - window.innerWidth / 2)).toBeLessThan(1);
    await expect(Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2)).toBeLessThan(1);
    await expect(parseFloat(getComputedStyle(dialog).borderTopLeftRadius)).toBeGreaterThan(0);
    await userEvent.keyboard("{Escape}");
  },
};

export const LockedPage: Story = {
  name: "The page behind is locked and inert while open",
  render: () => (
    <>
      <div style={{ blockSize: "300vh" }}>
        <button type="button">Behind</button>
      </div>
      <Form />
    </>
  ),
  play: async () => {
    const dialog = await openFrom("Open");
    await expect(document.body).toHaveAttribute("data-scroll-locked");
    await expect(getComputedStyle(document.body).overflow).toBe("hidden");
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    // the page behind is hidden from assistive technology
    await expect(within(document.body).queryByRole("button", { name: "Behind" })).toBeNull();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(document.body).not.toHaveAttribute("data-scroll-locked"));
    await expect(within(document.body).getByRole("button", { name: "Behind" })).toBeInTheDocument();
  },
};

export const PressesInPortaledChildren: Story = {
  name: "A press inside a popover opened from the dialog does not close it",
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="With a popover">
        <Dialog.Body>
          <Popover>
            <Popover.Trigger asChild>
              <Button>Pop</Button>
            </Popover.Trigger>
            <Popover.Content aria-label="Popover">
              <Button>Inside popover</Button>
            </Popover.Content>
          </Popover>
          <Select aria-label="Pick one" defaultValue="a">
            <Select.Option value="a">Alpha</Select.Option>
            <Select.Option value="b">Beta</Select.Option>
          </Select>
        </Dialog.Body>
      </Dialog.Content>
    </Dialog>
  ),
  play: async () => {
    const body = within(document.body);
    await userEvent.click(await body.findByRole("button", { name: "Pop" }));
    const inside = await body.findByRole("button", { name: "Inside popover" });
    // a popover opened from the dialog is clickable (one layer stack, not two)
    await expect(getComputedStyle(inside).pointerEvents).not.toBe("none");
    await userEvent.click(inside);
    await expect(body.getByRole("dialog", { name: "With a popover" })).toBeInTheDocument();
    // Escape closes the popover first, then the dialog
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("button", { name: "Inside popover" })).toBeNull());
    await expect(body.getByRole("dialog", { name: "With a popover" })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};

export const ExitFades: Story = {
  name: "The scrim and the panel fade out before they leave the document",
  render: () => <Form />,
  play: async () => {
    const dialog = await openFrom("Open");
    const scrim = dialog.parentElement as HTMLElement;
    await userEvent.keyboard("{Escape}");
    await expect(scrim).toHaveAttribute("data-state", "closed");
    await expect(scrim.isConnected).toBe(true);
    await waitFor(() => expect(scrim.isConnected).toBe(false), { timeout: 1500 });
  },
};

export const LongContentScrollsInside: Story = {
  name: "Long content scrolls inside the panel, header and footer stay in view",
  render: () => (
    <Form>
      <LongText />
    </Form>
  ),
  play: async () => {
    const dialog = await openFrom("Open");
    await settled(dialog);
    const viewport = dialog.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]") as HTMLElement;
    await expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight);
    const panel = dialog.getBoundingClientRect();
    // the panel stays inside the viewport, less a gutter on each side
    await expect(panel.height).toBeLessThanOrEqual(window.innerHeight - 2 * 16 + 1);
    // header at the top, footer at the bottom, both fully inside the panel
    const header = within(dialog).getByTestId("header").getBoundingClientRect();
    const footer = within(dialog).getByTestId("footer").getBoundingClientRect();
    await expect(header.top).toBeGreaterThanOrEqual(panel.top);
    await expect(footer.bottom).toBeLessThanOrEqual(panel.bottom + 1);
    // a body that scrolls is a focusable region, so a keyboard user can scroll it
    await expect(viewport).toHaveAttribute("tabindex", "0");
    viewport.scrollTop = 200;
    await nextFrame();
    await expect(within(dialog).getByTestId("header").getBoundingClientRect().top).toBe(header.top);
    await userEvent.keyboard("{Escape}");
  },
};

export const FullScreenOnAPhone: Story = {
  name: "Fills a phone screen and has no rounded corners",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="Phone" fullScreen={{ base: true, md: false }}>
        <Dialog.Body>Body</Dialog.Body>
      </Dialog.Content>
    </Dialog>
  ),
  play: async () => {
    await expect(window.innerWidth).toBeLessThan(768);
    const dialog = await within(document.body).findByRole("dialog");
    await settled(dialog);
    const rect = dialog.getBoundingClientRect();
    await expect(Math.round(rect.width)).toBe(window.innerWidth);
    await expect(Math.round(rect.height)).toBe(window.innerHeight);
    await expect(parseFloat(getComputedStyle(dialog).borderTopLeftRadius)).toBe(0);
  },
};

export const GutterOnANarrowScreen: Story = {
  name: "A panel on a phone keeps a gutter on each side",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="Narrow" size="xl">
        <Dialog.Body>Body</Dialog.Body>
      </Dialog.Content>
    </Dialog>
  ),
  play: async () => {
    await expect(window.innerWidth).toBeLessThan(640);
    const dialog = await within(document.body).findByRole("dialog");
    await settled(dialog);
    const rect = dialog.getBoundingClientRect();
    await expect(Math.round(rect.left)).toBe(16);
    await expect(Math.round(window.innerWidth - rect.right)).toBe(16);
  },
};

export const CloseButtonTarget: Story = {
  name: "The close button is at least 24 by 24 and sits in the end corner",
  render: () => <Form />,
  play: async () => {
    const dialog = await openFrom("Open");
    await settled(dialog);
    const close = within(dialog).getByRole("button", { name: "Close" });
    const rect = close.getBoundingClientRect();
    await expect(rect.width).toBeGreaterThanOrEqual(24);
    await expect(rect.height).toBeGreaterThanOrEqual(24);
    const panel = dialog.getBoundingClientRect();
    await expect(panel.right - rect.right).toBeLessThan(24);
    await expect(rect.top - panel.top).toBeLessThan(24);
    await userEvent.keyboard("{Escape}");
  },
};

export const RightToLeft: Story = {
  name: "Right to left puts the close button and the actions at the other side",
  render: () => <Form dir="rtl" />,
  play: async () => {
    const dialog = await openFrom("Open");
    await settled(dialog);
    const panel = dialog.getBoundingClientRect();
    const close = within(dialog).getByRole("button", { name: "Close" }).getBoundingClientRect();
    await expect(close.left - panel.left).toBeLessThan(24);
    const footer = within(dialog).getByTestId("footer");
    const buttons = within(footer).getAllByRole("button");
    const first = buttons[0]?.getBoundingClientRect();
    const last = buttons[buttons.length - 1]?.getBoundingClientRect();
    // in rtl the actions end at the left, so the first one in the DOM sits to the right of the last
    await expect((first as DOMRect).left).toBeGreaterThan((last as DOMRect).left);
    await userEvent.keyboard("{Escape}");
  },
};

export const FocusLoopsInTheBrowser: Story = {
  name: "Tab and Shift+Tab loop inside the dialog, and focus returns to the trigger",
  render: () => <Form />,
  play: async () => {
    const trigger = within(document.body).getByRole("button", { name: "Open" });
    const dialog = await openFrom("Open");
    for (let press = 0; press < 8; press += 1) {
      await userEvent.tab();
      await expect(dialog.contains(document.activeElement)).toBe(true);
    }
    for (let press = 0; press < 8; press += 1) {
      await userEvent.tab({ shift: true });
      await expect(dialog.contains(document.activeElement)).toBe(true);
    }
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const ForcedColoursAndReducedMotionRulesExist: Story = {
  name: "The stylesheet carries a forced-colours border and a reduced-motion fade",
  render: () => <Form />,
  play: async () => {
    // jsdom can't evaluate either media query, and a story can't switch them on, so prove the rules exist from
    // the stylesheet itself.
    const mediaRules: CSSMediaRule[] = [];
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList;
      try {
        rules = sheet.cssRules;
      } catch {
        continue; // a cross-origin sheet can't be read; none of ours is one
      }
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSMediaRule) mediaRules.push(rule);
      }
    }
    const forced = mediaRules.find((rule) => rule.conditionText.includes("forced-colors: active") && rule.cssText.includes("CanvasText") && /content/i.test(rule.cssText));
    const reduced = mediaRules.find((rule) => rule.conditionText.includes("prefers-reduced-motion: reduce") && /dialogFadeIn/.test(rule.cssText));
    await expect(forced).toBeDefined();
    await expect(reduced).toBeDefined();
  },
};
