import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { DemoNavbar, GalleryBar, NavbarStage, NavbarViewModeContext, StickyDemo } from "./NavbarStoryKit";

// Hidden real-browser checks (guidelines/adr/0013): what jsdom can't do (layout, the cascade, a breakpoint, stacking, forced
// colours). They run in the `storybook` (Chromium) project; the test window is 1200px wide unless a story pins another.
const meta: Meta = {
  title: "Organisms/Navigation/Navbar/Checks",
  tags: ["!dev"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <NavbarViewModeContext.Provider value="docs">
        <Story />
      </NavbarViewModeContext.Provider>
    ),
  ],
};

export default meta;

type Story = StoryObj;

const px = (value: string) => Number.parseFloat(value);
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** Reads any CSS colour (the tokens are OKLCH) as sRGB channels, by painting one pixel of it. */
function toRgb(color: string): [number, number, number] {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.clearRect(0, 0, 1, 1);
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return [r!, g!, b!];
}

function luminance([r, g, b]: [number, number, number]): number {
  const channel = (value: number) => {
    const scaled = value / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(foreground: string, background: string): number {
  const a = luminance(toRgb(foreground));
  const b = luminance(toRgb(background));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const tokenPx = (name: string) => px(getComputedStyle(document.documentElement).getPropertyValue(name));

export const WideLayout: Story = {
  name: "At a wide window the links are in the bar and the menu button is gone",
  render: () => (
    <NavbarStage minBlockSize="14rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start" }}>
          <DemoNavbar menuContainer={menuContainer} />
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    expect(window.innerWidth).toBeGreaterThanOrEqual(768);
    const canvas = within(canvasElement);
    const nav = canvas.getByRole("navigation", { name: "Main" });
    expect(getComputedStyle(nav).display).not.toBe("none");
    // a hidden element has no computed name, so the button is found by its attribute
    expect(getComputedStyle(canvasElement.querySelector('button[aria-label="Menu"]')!).display).toBe("none");
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(["Products", "Pricing", "Docs", "Beta"]);
    // the zones read in order: brand, links, actions, left to right
    const brand = canvas.getByRole("link", { name: "Acme" }).getBoundingClientRect();
    const first = links[0]!.getBoundingClientRect();
    const action = canvas.getByRole("button", { name: "Sign in" }).getBoundingClientRect();
    expect(brand.right).toBeLessThanOrEqual(first.left);
    expect(links.at(-1)!.getBoundingClientRect().right).toBeLessThanOrEqual(action.left);
  },
};

export const HeightsAndTargets: Story = {
  name: "The bar is as tall as its token says at every size, and every target is 24 pixels or more",
  render: () => (
    <NavbarStage minBlockSize="22rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start", display: "grid", gap: "1rem" }}>
          {(["sm", "md", "lg"] as const).map((size) => (
            <GalleryBar key={size} name={`${size} bar`}>
              <DemoNavbar size={size} linksLabel={`${size} navigation`} collapseBelow="3xl" menuContainer={menuContainer} />
            </GalleryBar>
          ))}
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    // `space.N` tokens are in rem
    const room = { sm: tokenPx("--dbm-space-1") * 16, md: tokenPx("--dbm-space-2") * 16, lg: tokenPx("--dbm-space-2") * 16 };
    const buttonSize = { sm: "--dbm-icon-button-size-sm", md: "--dbm-icon-button-size-md", lg: "--dbm-icon-button-size-lg" };
    for (const size of ["sm", "md", "lg"] as const) {
      const bar = within(canvasElement).getByRole("region", { name: `${size} bar` });
      const header = bar.querySelector("header")!;
      const button = within(bar).getByRole("button", { name: "Menu" });
      const rect = button.getBoundingClientRect();
      // the bar is the button's own height plus the room above and below
      const expected = tokenPx(buttonSize[size]) + 2 * room[size];
      const inner = header.firstElementChild!.getBoundingClientRect();
      expect(Math.abs(inner.height - expected)).toBeLessThan(1);
      expect(rect.top - inner.top).toBeGreaterThanOrEqual(room[size] - 1);
      expect(inner.bottom - rect.bottom).toBeGreaterThanOrEqual(room[size] - 1);
      for (const control of [button, ...within(bar).getAllByRole("link", { hidden: true })]) {
        const box = control.getBoundingClientRect();
        // the links are display: none below the collapse step, and measure zero then; the button is the one on show
        if (box.width === 0) continue;
        expect(box.width).toBeGreaterThanOrEqual(24);
        expect(box.height).toBeGreaterThanOrEqual(24);
      }
    }
  },
};

export const LinkTargetsWhenInTheBar: Story = {
  name: "A link in the bar is a 24 pixel target at every size",
  render: () => (
    <NavbarStage minBlockSize="22rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start", display: "grid", gap: "1rem" }}>
          {(["sm", "md", "lg"] as const).map((size) => (
            <GalleryBar key={size} name={`${size} bar`}>
              <DemoNavbar size={size} linksLabel={`${size} navigation`} collapseBelow="never" menuContainer={menuContainer} />
            </GalleryBar>
          ))}
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    for (const size of ["sm", "md", "lg"] as const) {
      const bar = within(canvasElement).getByRole("region", { name: `${size} bar` });
      for (const link of within(bar).getAllByRole("link")) {
        const box = link.getBoundingClientRect();
        expect(box.width).toBeGreaterThanOrEqual(24);
        expect(box.height).toBeGreaterThanOrEqual(24);
      }
    }
  },
};

export const ColoursAreReadable: Story = {
  name: "Link text clears 4.5:1 on its own surface, in each variant",
  render: () => (
    <NavbarStage minBlockSize="18rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start", display: "grid", gap: "1rem" }}>
          {(["outlined", "filled", "ghost"] as const).map((variant) => (
            <GalleryBar key={variant} name={`${variant} bar`}>
              <DemoNavbar variant={variant} linksLabel={`${variant} navigation`} collapseBelow="never" menuContainer={menuContainer} />
            </GalleryBar>
          ))}
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    for (const variant of ["outlined", "filled"] as const) {
      const bar = within(canvasElement).getByRole("region", { name: `${variant} bar` });
      const surface = getComputedStyle(bar.querySelector("header")!).backgroundColor;
      const pricing = within(bar).getByRole("link", { name: "Pricing" });
      expect(contrast(getComputedStyle(pricing).color, surface)).toBeGreaterThanOrEqual(4.5);
      const current = within(bar).getByRole("link", { name: "Products" });
      const style = getComputedStyle(current);
      expect(contrast(style.color, style.backgroundColor)).toBeGreaterThanOrEqual(4.5);
    }
  },
};

export const RightToLeftOrder: Story = {
  name: "In right-to-left text the brand is at the right and the actions at the left",
  render: () => (
    <NavbarStage minBlockSize="24rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start" }}>
          <DemoNavbar dir="rtl" collapseBelow="never" menuContainer={menuContainer} />
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const brand = canvas.getByRole("link", { name: "Acme" }).getBoundingClientRect();
    const links = within(canvas.getByRole("navigation", { name: "Main" })).getAllByRole("link");
    const action = canvas.getByRole("button", { name: "Sign in" }).getBoundingClientRect();
    expect(brand.left).toBeGreaterThan(links[0]!.getBoundingClientRect().right);
    expect(links[0]!.getBoundingClientRect().left).toBeGreaterThan(links.at(-1)!.getBoundingClientRect().left);
    expect(links.at(-1)!.getBoundingClientRect().left).toBeGreaterThan(action.right);
  },
};

export const StickyAndForcedColours: Story = {
  name: "A sticky bar stays at the top, takes a shadow when stuck, and an outline in forced colours",
  render: function Render() {
    const boxRef = useRef<HTMLDivElement | null>(null);
    return <StickyDemo boxRef={boxRef}>{(ref) => <DemoNavbar sticky scrollContainerRef={ref} />}</StickyDemo>;
  },
  play: async ({ canvasElement }) => {
    const header = within(canvasElement).getByRole("banner");
    const scroller = header.parentElement!;
    expect(getComputedStyle(header).position).toBe("sticky");
    expect(getComputedStyle(header).boxShadow).toBe("none");
    // Stuck is reported by a marker watched with an IntersectionObserver, so scroll until it has been seen.
    for (let attempt = 0; attempt < 4 && !header.hasAttribute("data-stuck"); attempt += 1) {
      scroller.scrollTop = 0;
      await nextFrame();
      await nextFrame();
      scroller.scrollTop = 200;
      try {
        await waitFor(() => expect(header).toHaveAttribute("data-stuck"), { timeout: 1200 });
      } catch {
        // not reported yet: the next attempt scrolls again, and the assertion below is what fails the test
      }
    }
    await expect(header).toHaveAttribute("data-stuck");
    // it is at the top of the box while the page has moved under it, and lifted by a shadow
    expect(Math.abs(header.getBoundingClientRect().top - scroller.getBoundingClientRect().top)).toBeLessThan(2);
    expect(getComputedStyle(header).boxShadow).not.toBe("none");
    const emulate = (value: "active" | "none") =>
      send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    await emulate("active");
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await expect(window.matchMedia("(forced-colors: active)").matches).toBe(true);
      // A shadow isn't drawn in forced colours, so a stuck bar is bounded by an outline instead.
      await expect(getComputedStyle(header).outlineStyle).toBe("solid");
      await expect(getComputedStyle(header).outlineWidth).not.toBe("0px");
      // The current link is told apart by fill alone, which forced colours replaces, so it has an outline too.
      const current = within(canvasElement).getByRole("link", { name: "Products", hidden: true });
      await expect(getComputedStyle(current).outlineStyle).toBe("solid");
    } finally {
      await emulate("none");
    }
  },
};

export const MenuOpensAboveAStickyBar: Story = {
  name: "An account menu opens above the bar and its items can be pressed",
  render: () => (
    <NavbarStage minBlockSize="22rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start" }}>
          <DemoNavbar sticky actions="rich" collapseBelow="never" menuContainer={menuContainer} />
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Account" }));
    const item = await within(document.body).findByRole("menuitem", { name: "Profile" });
    await waitFor(() => {
      const box = item.getBoundingClientRect();
      const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      expect(top === item || item.contains(top)).toBe(true);
    });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.getByRole("button", { name: "Account" })).toHaveFocus());
  },
};

export const PanelFromAWideWindow: Story = {
  name: "The menu panel lists the same links, is no wider than the window, and its links are 24 pixels or more",
  render: () => (
    <NavbarStage minBlockSize="26rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start" }}>
          <DemoNavbar collapseBelow="3xl" menuContainer={menuContainer} />
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Menu" });
    await userEvent.click(button);
    const panel = await canvas.findByRole("dialog", { name: "Menu" });
    await waitFor(() => expect(panel.getAnimations().every((animation) => animation.playState === "finished")).toBe(true));
    await nextFrame();
    const links = within(panel).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(["Products", "Pricing", "Docs", "Beta"]);
    for (const link of links) expect(link.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
    expect(panel.getBoundingClientRect().width).toBeLessThanOrEqual(window.innerWidth);
    // the panel opens from the inline start edge, at the left in left-to-right text
    expect(panel.getBoundingClientRect().left).toBeLessThanOrEqual(panel.offsetParent!.getBoundingClientRect().left + 2);
    // Escape closes it and focus returns to the button
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(button).toHaveFocus());
  },
};

export const GroupMenuInTheBar: Story = {
  name: "A group in the bar opens a menu above a sticky bar, and its items are pressable targets",
  render: () => (
    <NavbarStage minBlockSize="24rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start" }}>
          <DemoNavbar sticky withGroup actions="none" collapseBelow="never" menuContainer={menuContainer} />
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Resources" });
    const box = trigger.getBoundingClientRect();
    expect(box.height).toBeGreaterThanOrEqual(24);
    // it is drawn like the links beside it: the same height and text colour
    const sibling = canvas.getByRole("link", { name: "Docs" });
    expect(Math.abs(box.height - sibling.getBoundingClientRect().height)).toBeLessThan(1);
    expect(getComputedStyle(trigger).color).toBe(getComputedStyle(sibling).color);
    expect(getComputedStyle(trigger).borderTopWidth).toBe("0px");
    await userEvent.click(trigger);
    const menu = await within(document.body).findByRole("menu");
    const items = within(menu).getAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual(["Blog", "Guides", "Changelog"]);
    await waitFor(() => expect(menu.getAnimations().every((animation) => animation.playState === "finished")).toBe(true));
    for (const item of items) {
      const rect = item.getBoundingClientRect();
      expect(rect.height).toBeGreaterThanOrEqual(24);
      // the menu is the top thing at each item's centre, above the sticky bar it opened from
      const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      expect(top === item || item.contains(top)).toBe(true);
    }
    // the caret turns while it is open
    expect(getComputedStyle(trigger.querySelector("svg")!).transform).not.toBe("none");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const GroupInThePanel: Story = {
  name: "A group in the menu panel expands in place, indented, and leaves the panel open",
  render: () => (
    <NavbarStage minBlockSize="30rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start" }}>
          <DemoNavbar withGroup collapseBelow="3xl" menuContainer={menuContainer} />
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const menuButton = canvas.getByRole("button", { name: "Menu" });
    await userEvent.click(menuButton);
    const panel = await canvas.findByRole("dialog", { name: "Menu" });
    await waitFor(() => expect(panel.getAnimations().every((animation) => animation.playState === "finished")).toBe(true));
    const toggle = within(panel).getByRole("button", { name: "Resources" });
    const nested = document.getElementById(toggle.getAttribute("aria-controls")!)!;
    // collapsed: the links take no room and can't be reached
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(getComputedStyle(nested).display).toBe("none");
    const before = panel.getBoundingClientRect();
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(getComputedStyle(nested).display).not.toBe("none");
    const links = within(nested).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(["Blog", "Guides", "Changelog"]);
    for (const link of links) expect(link.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
    // indented beneath the button, inside the panel, and the panel kept its size and stayed open
    const toggleBox = toggle.getBoundingClientRect();
    const first = links[0]!.getBoundingClientRect();
    expect(first.left).toBeGreaterThan(toggleBox.left + 8);
    expect(first.top).toBeGreaterThanOrEqual(toggleBox.bottom - 1);
    expect(panel.getBoundingClientRect().width).toBe(before.width);
    expect(canvas.getByRole("dialog")).toBe(panel);
    // a link in it closes the panel, as the plain ones do
    links[1]!.addEventListener("click", (event) => event.preventDefault(), { once: true });
    await userEvent.click(links[1]!);
    await waitFor(() => expect(canvas.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(menuButton).toHaveFocus());
  },
};
