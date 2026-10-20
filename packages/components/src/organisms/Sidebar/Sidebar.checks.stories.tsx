import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Badge } from "../../atoms/Badge";
import { IconButton } from "../../atoms/IconButton";
import { Sidebar } from "./Sidebar";
import { BellIcon, FolderSimpleIcon, PlusIcon } from "@dbm-design-system/icons";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { DemoSidebar, SidebarFrame, SidebarStage, SidebarViewModeContext } from "./SidebarStoryKit";

// Hidden real-browser checks (guidelines/adr/0013): what jsdom can't do (layout, the cascade, a breakpoint, stacking, forced
// colours). They run in the `storybook` (Chromium) project; the test window is 1200px wide unless a story pins another.
const meta: Meta = {
  title: "Organisms/Navigation/Sidebar/Checks",
  tags: ["!dev"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <SidebarViewModeContext.Provider value="docs">
        <Story />
      </SidebarViewModeContext.Provider>
    ),
  ],
};

export default meta;

type Story = StoryObj;

const px = (value: string) => Number.parseFloat(value);
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** A token's length in pixels: the spacing tokens are in rem and the icon sizes in px. */
function tokenPx(name: string): number {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value.endsWith("rem") ? px(value) * px(getComputedStyle(document.documentElement).fontSize) : px(value);
}

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

/** Waits for every animation and transition on the element to finish, then a frame, so a measurement is of where it settled. */
async function settled(element: Element) {
  await waitFor(() => expect(element.getAnimations().every((animation) => animation.playState === "finished")).toBe(true));
  await nextFrame();
}

// A real mouse, through the Chrome DevTools Protocol: Storybook's `userEvent` sends synthetic events, and a Radix menu opens on the
// pointer's down event. The test page scales its iframe, so a point inside the story is mapped to the page it is drawn on.
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

/** The point where an element's centre is, and whether that point is the element (or inside it): it is on top, so a press reaches it. */
function isOnTop(element: Element): boolean {
  const box = element.getBoundingClientRect();
  const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
  return top === element || element.contains(top);
}

const rootOf = (canvasElement: HTMLElement) => canvasElement.querySelector<HTMLElement>("[data-variant]")!;
const emulate = (feature: "forced-colors" | "prefers-reduced-motion", value: string) =>
  send("Emulation.setEmulatedMedia", { features: [{ name: feature, value }] });

/** An item's box in tokens: its icon plus the padding on each side, which is also what the rail is one of wide. */
const itemBox = (icon: string, pad: string) => tokenPx(icon) + 2 * tokenPx(pad);
const steps = {
  xs: { icon: "--dbm-icon-size-sm", pad: "--dbm-space-1" },
  sm: { icon: "--dbm-icon-size-sm", pad: "--dbm-space-2" },
  md: { icon: "--dbm-icon-size-md", pad: "--dbm-space-2" },
  lg: { icon: "--dbm-icon-size-md", pad: "--dbm-space-3" },
} as const;

export const WideLayout: Story = {
  name: "At a wide window the sidebar is on the page at its token width, with the toggle and no menu button",
  render: () => (
    <SidebarStage minBlockSize="30rem">
      {(menuContainer) => (
        <Sidebar.Provider>
          <div style={{ inlineSize: "100%", display: "grid", gridTemplateRows: "auto 1fr" }}>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Sidebar.MenuButton />
            </div>
            <SidebarFrame height="26rem">
              <DemoSidebar menuContainer={menuContainer} />
            </SidebarFrame>
          </div>
        </Sidebar.Provider>
      )}
    </SidebarStage>
  ),
  play: async ({ canvasElement }) => {
    expect(window.innerWidth).toBeGreaterThanOrEqual(768);
    const root = rootOf(canvasElement);
    expect(getComputedStyle(root).display).not.toBe("none");
    expect(Math.round(root.getBoundingClientRect().width)).toBe(Math.round(tokenPx("--dbm-sidebar-width")));
    // a hidden element has no computed name, so the button is found by its attribute
    expect(getComputedStyle(canvasElement.querySelector('button[aria-label="Menu"]')!).display).toBe("none");
    expect(getComputedStyle(within(canvasElement).getByRole("button", { name: "Collapse sidebar" })).display).not.toBe("none");
    // the header is above the content and the footer below it, and the content takes the rest
    const header = root.firstElementChild!.getBoundingClientRect();
    const footer = root.lastElementChild!.getBoundingClientRect();
    expect(header.bottom).toBeLessThanOrEqual(footer.top);
    expect(Math.round(root.getBoundingClientRect().height)).toBe(root.parentElement!.clientHeight);
  },
};

export const WidthPropAndEnd: Story = {
  name: "The width prop sets the width, and the line is on the edge it does not sit against",
  render: () => (
    <SidebarStage minBlockSize="28rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", display: "grid", gap: "1rem" }}>
          <SidebarFrame height="10rem">
            <DemoSidebar width="20rem" menuContainer={menuContainer} navLabel="Wide" />
          </SidebarFrame>
          <SidebarFrame height="10rem" reverse>
            <DemoSidebar side="end" width={300} menuContainer={menuContainer} navLabel="End" />
          </SidebarFrame>
        </div>
      )}
    </SidebarStage>
  ),
  play: async ({ canvasElement }) => {
    const [wide, end] = [...canvasElement.querySelectorAll<HTMLElement>("[data-variant]")] as [HTMLElement, HTMLElement];
    expect(Math.round(wide.getBoundingClientRect().width)).toBe(Math.round(tokenPx("--dbm-space-1") * 80));
    expect(Math.round(end.getBoundingClientRect().width)).toBe(300);
    // start side: the line is on the right (the inline end); end side: on the left (the inline start)
    expect(getComputedStyle(wide).borderRightWidth).toBe("1px");
    expect(getComputedStyle(wide).borderLeftWidth).toBe("0px");
    expect(getComputedStyle(end).borderLeftWidth).toBe("1px");
    expect(getComputedStyle(end).borderRightWidth).toBe("0px");
  },
};

export const RailGeometry: Story = {
  name: "The rail is one item wide at every size, its items are square, and the icon stays where it was",
  render: () => (
    <SidebarStage minBlockSize="34rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {(["xs", "sm", "md", "lg"] as const).map((size) => (
            <SidebarFrame key={size} height="28rem">
              <DemoSidebar size={size} navLabel={`${size} navigation`} menuContainer={menuContainer} />
            </SidebarFrame>
          ))}
        </div>
      )}
    </SidebarStage>
  ),
  play: async ({ canvasElement, step }) => {
    const roots = [...canvasElement.querySelectorAll<HTMLElement>("[data-variant]")];
    const sizes = ["xs", "sm", "md", "lg"] as const;
    const iconCenters: number[] = [];
    for (const [index, root] of roots.entries()) {
      const home = within(root).getByRole("link", { name: "Home" });
      const icon = home.querySelector("svg")!.getBoundingClientRect();
      iconCenters.push(icon.left + icon.width / 2 - root.getBoundingClientRect().left);
      await userEvent.click(within(root).getByRole("button", { name: "Collapse sidebar" }));
      await settled(root);
      const size = sizes[index]!;
      const box = itemBox(steps[size].icon, steps[size].pad);
      await step(`${size}: the rail is one item plus its padding wide`, async () => {
        const width = root.getBoundingClientRect().width;
        const expected = box + 2 * tokenPx("--dbm-space-2") + 1;
        expect(Math.abs(width - expected)).toBeLessThanOrEqual(1);
      });
      await step(`${size}: every item is a square the size of the item box, and no smaller than 24 pixels`, async () => {
        for (const item of root.querySelectorAll<HTMLElement>("nav a, nav button")) {
          const rect = item.getBoundingClientRect();
          expect(Math.abs(rect.width - box)).toBeLessThanOrEqual(1);
          expect(Math.abs(rect.height - box)).toBeLessThanOrEqual(1);
          expect(rect.width).toBeGreaterThanOrEqual(24);
        }
      });
      await step(`${size}: the icon is in the same place as when the sidebar was open`, async () => {
        const after = within(root).getByRole("link", { name: "Home" }).querySelector("svg")!.getBoundingClientRect();
        expect(Math.abs(after.left + after.width / 2 - root.getBoundingClientRect().left - iconCenters[index]!)).toBeLessThanOrEqual(1);
      });
      await step(`${size}: the collapse button is the same size as an item and inside the rail`, async () => {
        const button = within(root).getByRole("button", { name: "Expand sidebar" }).getBoundingClientRect();
        expect(Math.abs(button.width - box)).toBeLessThanOrEqual(1);
        expect(button.right).toBeLessThanOrEqual(root.getBoundingClientRect().right);
        expect(button.left).toBeGreaterThanOrEqual(root.getBoundingClientRect().left);
      });
    }
  },
};

export const RailHidesTextNotNames: Story = {
  name: "In the rail the text is hidden but still names the item, a badge is a mark inside the rail, and a long label never widens it",
  render: () => (
    <SidebarStage minBlockSize="26rem">
      {(menuContainer) => (
        <SidebarFrame height="22rem">
          <DemoSidebar defaultCollapsed menuContainer={menuContainer} />
        </SidebarFrame>
      )}
    </SidebarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = rootOf(canvasElement);
    const home = canvas.getByRole("link", { name: "Home" });
    const label = [...home.querySelectorAll("span")].find((span) => span.textContent === "Home")!;
    const box = label.getBoundingClientRect();
    expect(box.width).toBeLessThanOrEqual(1);
    expect(box.height).toBeLessThanOrEqual(1);
    // the name keeps the count and the external cue
    expect(canvas.getByRole("link", { name: /^Inbox\s*12$/ })).toBeInTheDocument();
    expect(canvas.getByRole("link", { name: /^Documentation\s*\(opens in a new tab\)$/ })).toBeInTheDocument();
    // the count is a mark on the icon's corner, not wider than the rail
    const badge = canvas.getByRole("link", { name: /^Inbox/ }).querySelector<HTMLElement>("[class*=railBadge]")!;
    const rail = root.getBoundingClientRect();
    expect(badge.getBoundingClientRect().right).toBeLessThanOrEqual(rail.right);
    expect(badge.getBoundingClientRect().left).toBeGreaterThanOrEqual(rail.left);
  },
};

export const LongLabelsTruncate: Story = {
  name: "A label longer than the room is cut with an ellipsis, and the sidebar and its items keep their size",
  render: () => (
    <SidebarStage minBlockSize="14rem">
      {(menuContainer) => (
        <SidebarFrame height="10rem">
          <Sidebar collapseBelow="never" menuContainer={menuContainer}>
            <Sidebar.Content>
              <Sidebar.Nav aria-label="Long">
                <Sidebar.Item href="#a" badge="1,204" onClick={(event) => event.preventDefault()}>
                  A very long name for a project that someone typed in a hurry and never shortened
                </Sidebar.Item>
              </Sidebar.Nav>
            </Sidebar.Content>
          </Sidebar>
        </SidebarFrame>
      )}
    </SidebarStage>
  ),
  play: async ({ canvasElement }) => {
    const root = rootOf(canvasElement);
    expect(Math.round(root.getBoundingClientRect().width)).toBe(Math.round(tokenPx("--dbm-sidebar-width")));
    const item = within(canvasElement).getByRole("link");
    const label = item.querySelector<HTMLElement>("span")!;
    expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
    expect(getComputedStyle(label).textOverflow).toBe("ellipsis");
    expect(item.getBoundingClientRect().right).toBeLessThanOrEqual(root.getBoundingClientRect().right);
    // one line tall: a label that wrapped would grow the row
    expect(Math.round(item.getBoundingClientRect().height)).toBe(Math.round(itemBox(steps.md.icon, steps.md.pad)));
  },
};

export const GroupsAlign: Story = {
  name: "An opened group's items start under the group's own text, each level of nesting steps in, and a group animates open",
  render: () => (
    <SidebarStage minBlockSize="30rem">
      {(menuContainer) => (
        <SidebarFrame height="26rem">
          <DemoSidebar initial="emea" toggle={false} footer={false} menuContainer={menuContainer} />
        </SidebarFrame>
      )}
    </SidebarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const labelLeft = (element: Element) => {
      const span = [...element.querySelectorAll("span")].find((candidate) => candidate.className.includes("label"))!;
      return span.getBoundingClientRect().left;
    };
    const projects = canvas.getByRole("button", { name: "Projects" });
    await userEvent.click(projects);
    const active = await canvas.findByRole("link", { name: "Active" });
    await waitFor(() => expect(canvas.getByRole("link", { name: "Active" }).closest("ul")!.getAnimations().length).toBe(0));
    // the first level starts where the parent's text starts
    expect(Math.abs(labelLeft(active) - labelLeft(projects))).toBeLessThanOrEqual(1);
    // a group nested in a group steps in by one more level, and the group holding the current page started open
    const regional = canvas.getByRole("button", { name: "Regional" });
    expect(regional).toHaveAttribute("aria-expanded", "true");
    const emea = canvas.getByRole("link", { name: "EMEA" });
    expect(labelLeft(emea)).toBeGreaterThan(labelLeft(regional));
    // an opened group's button is not marked while the item inside it is the current page
    expect(emea).toHaveAttribute("aria-current", "page");
    expect(regional.className).not.toMatch(/current/);
  },
};

export const ContentScrollsOnItsOwn: Story = {
  name: "Taller than its frame, the content scrolls and the header and footer stay in view",
  render: () => (
    <SidebarStage minBlockSize="14rem">
      {(menuContainer) => (
        <SidebarFrame height="14rem" fixed>
          <DemoSidebar menuContainer={menuContainer} />
        </SidebarFrame>
      )}
    </SidebarStage>
  ),
  play: async ({ canvasElement }) => {
    const root = rootOf(canvasElement);
    // the content is the band between the header and the footer
    const viewport = root.children[1] as HTMLElement;
    expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight);
    const frame = root.getBoundingClientRect();
    const header = root.firstElementChild!.getBoundingClientRect();
    const footer = root.lastElementChild!.getBoundingClientRect();
    expect(Math.round(root.getBoundingClientRect().height)).toBe(Math.round(frame.height));
    viewport.scrollTop = viewport.scrollHeight;
    await nextFrame();
    expect(root.firstElementChild!.getBoundingClientRect().top).toBe(header.top);
    expect(root.lastElementChild!.getBoundingClientRect().bottom).toBe(footer.bottom);
    // a label's width is the viewport's, not a table's: the longest label doesn't stretch the sidebar
    expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);
    // the last item is reachable
    const last = within(root).getByRole("link", { name: /Documentation/ });
    expect(last.getBoundingClientRect().bottom).toBeLessThanOrEqual(footer.top + 1);
  },
};

export const FocusRingInsideAndTabOrder: Story = {
  name: "The focus ring is drawn inside the item, and Tab walks the items in reading order, skipping a shut group's items",
  render: () => (
    <SidebarStage minBlockSize="30rem">
      {(menuContainer) => (
        <SidebarFrame height="26rem">
          <DemoSidebar menuContainer={menuContainer} />
        </SidebarFrame>
      )}
    </SidebarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    const home = canvas.getByRole("link", { name: "Home" });
    await expect(home).toHaveFocus();
    const style = getComputedStyle(home);
    expect(style.outlineStyle).toBe("solid");
    expect(px(style.outlineOffset)).toBeLessThan(0);
    const order: string[] = [];
    for (let index = 0; index < 8; index += 1) {
      await userEvent.tab();
      const active = document.activeElement as HTMLElement;
      order.push(active.getAttribute("aria-label") ?? active.textContent!.replace(/\s+/g, " ").trim());
    }
    expect(order.slice(0, 5)).toEqual(["Inbox12", "Projects", "Reports", "Team", "Settings"]);
    expect(order).not.toContain("Active");
    expect(order).toContain("Collapse sidebar");
  },
};

export const FlyoutWithARealPointer: Story = {
  name: "In the rail a group opens a menu beside it with a real mouse, it is on top, and an item can be chosen",
  render: () => (
    <SidebarStage minBlockSize="26rem">
      {(menuContainer) => (
        <SidebarFrame height="22rem">
          <DemoSidebar defaultCollapsed menuContainer={menuContainer} />
        </SidebarFrame>
      )}
    </SidebarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const rail = rootOf(canvasElement).getBoundingClientRect();
    const trigger = canvas.getByRole("button", { name: "Reports" });
    await realClick(trigger);
    const menu = await body.findByRole("menu");
    await settled(menu);
    // beside the rail, away from the edge it sits against, and not over it
    expect(menu.getBoundingClientRect().left).toBeGreaterThanOrEqual(trigger.getBoundingClientRect().right);
    expect(menu.getBoundingClientRect().left).toBeGreaterThan(rail.left);
    const sales = within(menu).getByRole("menuitem", { name: "Sales" });
    await waitFor(() => expect(isOnTop(sales)).toBe(true));
    // the group's name is the flyout's title
    expect(within(menu).getByText("Reports")).toBeInTheDocument();
    // a nested group is a submenu
    await userEvent.click(within(menu).getByRole("menuitem", { name: "Regional" }));
    expect(await body.findByRole("menuitem", { name: "EMEA" })).toBeInTheDocument();
    await realClick(await body.findByRole("menuitem", { name: "EMEA" }));
    await waitFor(() => expect(body.queryByRole("menu")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const TooltipOnFocusAndHover: Story = {
  name: "In the rail an item's text is a tooltip beside it on keyboard focus, and it is on top",
  render: () => (
    <SidebarStage minBlockSize="26rem">
      {(menuContainer) => (
        <SidebarFrame height="22rem">
          <DemoSidebar defaultCollapsed menuContainer={menuContainer} />
        </SidebarFrame>
      )}
    </SidebarStage>
  ),
  play: async ({ canvasElement }) => {
    const rail = rootOf(canvasElement).getBoundingClientRect();
    await userEvent.tab();
    const tooltip = await within(document.body).findByRole("tooltip");
    expect(tooltip).toHaveTextContent("Home");
    await settled(tooltip.parentElement ?? tooltip);
    expect(tooltip.getBoundingClientRect().left).toBeGreaterThanOrEqual(rail.right - 1);
    await userEvent.keyboard("{Escape}");
  },
};

export const PanelFromAWideWindow: Story = {
  name: "The phone panel is the sidebar at its token width, never a rail, and Escape gives focus back to the menu button",
  render: () => (
    <SidebarStage minBlockSize="30rem">
      {(menuContainer) => (
        <Sidebar.Provider collapseBelow="3xl" defaultCollapsed>
          <div style={{ inlineSize: "100%", alignSelf: "start" }}>
            <Sidebar.MenuButton />
            <DemoSidebar menuContainer={menuContainer} />
          </div>
        </Sidebar.Provider>
      )}
    </SidebarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Menu" });
    await userEvent.click(button);
    const panel = await canvas.findByRole("dialog", { name: "Menu" });
    await settled(panel);
    expect(Math.round(panel.getBoundingClientRect().width)).toBe(Math.round(tokenPx("--dbm-sidebar-width")));
    // the panel opens from the inline start edge, and the rail the page has is not the panel's
    expect(panel.getBoundingClientRect().left).toBeLessThanOrEqual(panel.offsetParent!.getBoundingClientRect().left + 2);
    const home = within(panel).getByRole("link", { name: "Home" });
    expect(home.getBoundingClientRect().width).toBeGreaterThan(panel.getBoundingClientRect().width / 2);
    for (const link of within(panel).getAllByRole("link")) expect(link.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
    expect(within(panel).queryByRole("button", { name: /sidebar/ })).not.toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(button).toHaveFocus());
  },
};

export const OnAPhone: Story = {
  name: "On a phone the sidebar is off the page, the menu button shows and the toggle goes, and the panel fits the window",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <SidebarStage minBlockSize="30rem">
      {(menuContainer) => (
        <Sidebar.Provider>
          <div style={{ inlineSize: "100%", alignSelf: "start", display: "flex", gap: "0.5rem" }}>
            <Sidebar.MenuButton />
            <Sidebar.Toggle aria-label="Outside toggle" />
            <DemoSidebar menuContainer={menuContainer} />
          </div>
        </Sidebar.Provider>
      )}
    </SidebarStage>
  ),
  play: async ({ canvasElement }) => {
    expect(window.innerWidth).toBeLessThan(768);
    const canvas = within(canvasElement);
    expect(getComputedStyle(rootOf(canvasElement)).display).toBe("none");
    expect(getComputedStyle(canvas.getByRole("button", { name: "Menu" })).display).not.toBe("none");
    expect(getComputedStyle(canvasElement.querySelector('button[aria-label="Outside toggle"]')!).display).toBe("none");
    await userEvent.click(canvas.getByRole("button", { name: "Menu" }));
    const panel = await canvas.findByRole("dialog", { name: "Menu" });
    await settled(panel);
    expect(panel.getBoundingClientRect().width).toBeLessThanOrEqual(window.innerWidth);
    // a sliver of the page stays showing, so there is something to press to close it
    expect(panel.getBoundingClientRect().right).toBeLessThan(window.innerWidth);
    await userEvent.click(within(panel).getByRole("link", { name: /^Inbox/ }));
    await waitFor(() => expect(canvas.queryByRole("dialog")).not.toBeInTheDocument());
  },
};

export const RightToLeft: Story = {
  name: "Right to left: the line, the indent and the flyout mirror, and the panel comes from the right",
  render: () => (
    <SidebarStage minBlockSize="30rem">
      {(menuContainer) => (
        <Sidebar.Provider collapseBelow="3xl">
          <div dir="rtl" style={{ inlineSize: "100%", alignSelf: "start" }}>
            <Sidebar.MenuButton />
            <SidebarFrame height="22rem" dir="rtl">
              <DemoSidebar dir="rtl" menuContainer={menuContainer} />
            </SidebarFrame>
          </div>
        </Sidebar.Provider>
      )}
    </SidebarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = rootOf(canvasElement);
    // the sidebar is hidden below the widest step, so open the panel: it comes from the right
    await userEvent.click(canvas.getByRole("button", { name: "Menu" }));
    const panel = await canvas.findByRole("dialog", { name: "Menu" });
    await settled(panel);
    expect(panel.getBoundingClientRect().right).toBeGreaterThanOrEqual(panel.offsetParent!.getBoundingClientRect().right - 2);
    // the page's sidebar has its line on the left (the inner edge of a right-hand sidebar)
    expect(getComputedStyle(root).borderLeftWidth).toBe("1px");
    expect(getComputedStyle(root).borderRightWidth).toBe("0px");
  },
};

export const CurrentLooks: Story = {
  name: "Each way of marking the current page is readable, and the line and the fill follow the brand",
  render: () => (
    <SidebarStage minBlockSize="22rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {(["subtle", "bar", "solid"] as const).map((currentVariant) => (
            <SidebarFrame key={currentVariant} height="18rem">
              <DemoSidebar
                currentVariant={currentVariant}
                width="14rem"
                toggle={false}
                navLabel={`${currentVariant} navigation`}
                menuContainer={menuContainer}
              />
            </SidebarFrame>
          ))}
        </div>
      )}
    </SidebarStage>
  ),
  play: async ({ canvasElement }) => {
    const [subtle, bar, solid] = [...canvasElement.querySelectorAll<HTMLElement>("[data-variant]")].map((root) =>
      within(root).getByRole("link", { name: "Home" }),
    ) as [HTMLElement, HTMLElement, HTMLElement];
    for (const link of [subtle, bar, solid]) expect(link).toHaveAttribute("aria-current", "page");
    const colour = (element: Element) => getComputedStyle(element).color;
    const fill = (element: Element) => getComputedStyle(element).backgroundColor;
    expect(contrast(colour(subtle), fill(subtle))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colour(solid), fill(solid))).toBeGreaterThanOrEqual(4.5);
    // `bar` has no fill and draws a brand line along its start edge, a pseudo-element
    expect(toRgb(fill(bar))).toEqual(toRgb("transparent"));
    const line = getComputedStyle(bar, "::before");
    expect(line.content).not.toBe("none");
    expect(line.backgroundColor).toBe(fill(solid));
    expect(px(line.width)).toBeGreaterThan(0);
  },
};

export const ForcedColours: Story = {
  name: "In forced colours the current item is outlined, a filled sidebar has a line, and the bar names a system colour",
  render: () => (
    <SidebarStage minBlockSize="22rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <SidebarFrame height="18rem">
            <DemoSidebar variant="filled" width="14rem" toggle={false} navLabel="Filled" menuContainer={menuContainer} />
          </SidebarFrame>
          <SidebarFrame height="18rem">
            <DemoSidebar currentVariant="bar" width="14rem" toggle={false} navLabel="Bar" menuContainer={menuContainer} />
          </SidebarFrame>
        </div>
      )}
    </SidebarStage>
  ),
  play: async ({ canvasElement }) => {
    const [filled, bar] = [...canvasElement.querySelectorAll<HTMLElement>("[data-variant]")] as [HTMLElement, HTMLElement];
    await emulate("forced-colors", "active");
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(window.matchMedia("(forced-colors: active)").matches).toBe(true);
      // a fill is replaced in forced colours, so the current item is told apart by an outline instead
      expect(getComputedStyle(within(filled).getByRole("link", { name: "Home" })).outlineStyle).toBe("solid");
      // a filled sidebar has no border of its own, so forced colours draws one
      expect(getComputedStyle(filled).borderRightStyle).toBe("solid");
      // the bar is a background, which forced colours replaces, so it names a system colour: the item has no outline of its own
      expect(getComputedStyle(within(bar).getByRole("link", { name: "Home" })).outlineStyle).toBe("none");
      expect(toRgb(getComputedStyle(within(bar).getByRole("link", { name: "Home" }), "::before").backgroundColor)).not.toEqual([0, 0, 0]);
      // the rule that draws a separator is a border, which forced colours keeps
      expect(getComputedStyle(bar.querySelector("[class*=sectionLabel]")!).display).not.toBe("none");
    } finally {
      await emulate("forced-colors", "none");
    }
  },
};

export const ReducedMotion: Story = {
  name: "With reduced motion the width, the hover tint and the caret do not animate",
  render: () => (
    <SidebarStage minBlockSize="24rem">
      {(menuContainer) => (
        <SidebarFrame height="20rem">
          <DemoSidebar menuContainer={menuContainer} />
        </SidebarFrame>
      )}
    </SidebarStage>
  ),
  play: async ({ canvasElement }) => {
    const root = rootOf(canvasElement);
    await settled(root);
    expect(getComputedStyle(root).transitionDuration).not.toBe("0s");
    await emulate("prefers-reduced-motion", "reduce");
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(getComputedStyle(root).transitionDuration).toBe("0s");
      expect(getComputedStyle(within(root).getByRole("link", { name: "Home" })).transitionDuration).toBe("0s");
    } finally {
      await emulate("prefers-reduced-motion", "no-preference");
    }
  },
};

export const StickyStaysInView: Story = {
  name: "A sticky sidebar stays at its offset and as tall as the rest of the window while the page scrolls",
  render: () => (
    <div style={{ display: "flex", blockSize: "300vh" }}>
      <DemoSidebar sticky stickyOffset={4} />
      <div style={{ flex: 1, padding: "1rem" }}>A page much taller than its window.</div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = rootOf(canvasElement);
    expect(getComputedStyle(root).position).toBe("sticky");
    const offset = tokenPx("--dbm-space-4");
    window.scrollTo(0, 500);
    await nextFrame();
    await nextFrame();
    expect(window.scrollY).toBeGreaterThan(0);
    expect(Math.abs(root.getBoundingClientRect().top - offset)).toBeLessThanOrEqual(1);
    expect(Math.abs(root.getBoundingClientRect().height - (window.innerHeight - offset))).toBeLessThanOrEqual(1);
    // the footer is still in view at the bottom of the window, and the content scrolls inside it
    expect(root.lastElementChild!.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight);
    window.scrollTo(0, 0);
  },
};

export const PassedBadgeIsDrawnAsWritten: Story = {
  name: "A Badge passed as an item's badge keeps its own tone and variant, is one pill, and stays within the item's height, expanded and in the rail",
  render: () => (
    <SidebarStage minBlockSize="16rem">
      {(menuContainer) => (
        <div style={{ display: "flex", gap: "1rem" }}>
          {[false, true].map((collapsed) => (
            <SidebarFrame key={String(collapsed)} height="10rem" contentLabel="">
              <Sidebar collapseBelow="never" defaultCollapsed={collapsed} menuContainer={menuContainer} width="14rem">
                <Sidebar.Content>
                  <Sidebar.Nav aria-label={collapsed ? "Rail" : "Expanded"}>
                    <Sidebar.Item href="#a" icon={BellIcon} badge="4" onClick={(event) => event.preventDefault()}>
                      Plain
                    </Sidebar.Item>
                    <Sidebar.Item
                      href="#b"
                      icon={BellIcon}
                      badge={<Badge tone="danger" variant="solid">9</Badge>}
                      onClick={(event) => event.preventDefault()}
                    >
                      Alerts
                    </Sidebar.Item>
                  </Sidebar.Nav>
                </Sidebar.Content>
              </Sidebar>
            </SidebarFrame>
          ))}
        </div>
      )}
    </SidebarStage>
  ),
  play: async ({ canvasElement }) => {
    for (const root of canvasElement.querySelectorAll<HTMLElement>("[data-variant]")) {
      const plain = within(root).getByRole("link", { name: /^Plain/ });
      const alerts = within(root).getByRole("link", { name: /^Alerts/ });
      const builtIn = within(plain).getByText("4");
      const own = within(alerts).getByText("9");
      // different fills: the passed Badge is danger-solid, the plain text is the built-in solid brand pill
      expect(getComputedStyle(own).backgroundColor).not.toBe(getComputedStyle(builtIn).backgroundColor);
      expect(toRgb(getComputedStyle(own).backgroundColor)).not.toEqual(toRgb(getComputedStyle(builtIn).backgroundColor));
      // one pill, not a pill in a pill, and no taller than its item
      expect(own.querySelector("span")).toBeNull();
      expect(own.getBoundingClientRect().height).toBeLessThanOrEqual(alerts.getBoundingClientRect().height);
      // within the sidebar
      expect(own.getBoundingClientRect().right).toBeLessThanOrEqual(root.getBoundingClientRect().right);
    }
  },
};

export const FillsTheDemoBox: Story = {
  name: "A sidebar fills the height of the box it is drawn in, and a section's heading is in capitals",
  render: () => (
    <SidebarStage minBlockSize="40rem">
      {(menuContainer) => (
        <SidebarFrame height="12rem">
          <DemoSidebar menuContainer={menuContainer} />
        </SidebarFrame>
      )}
    </SidebarStage>
  ),
  play: async ({ canvasElement }) => {
    const root = rootOf(canvasElement);
    const frame = root.parentElement!;
    const box = frame.parentElement!.parentElement!;
    // the frame takes the box's whole height (less its own border), and the sidebar the frame's
    expect(Math.abs(frame.getBoundingClientRect().height - box.clientHeight)).toBeLessThanOrEqual(2);
    expect(root.getBoundingClientRect().height).toBeGreaterThan(tokenPx("--dbm-space-1") * 150);
    expect(root.getBoundingClientRect().height).toBe(frame.clientHeight);
    expect(getComputedStyle(within(root).getByText("Workspace")).textTransform).toBe("uppercase");
  },
};

export const CountBadgeIsBadgesOwnCircle: Story = {
  name: "A two-digit count is a circle (Badge's xs in an item, a smaller 20px mark in the rail), and a badged row is as tall as a plain one",
  render: () => (
    <SidebarStage minBlockSize="26rem">
      {(menuContainer) => (
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {(["xs", "sm", "md", "lg"] as const).flatMap((size) =>
            [false, true].map((collapsed) => (
              <SidebarFrame key={`${size}${collapsed}`} height="9rem" contentLabel="">
                <Sidebar collapseBelow="never" size={size} defaultCollapsed={collapsed} menuContainer={menuContainer} width="12rem">
                  <Sidebar.Content>
                    <Sidebar.Nav aria-label={`${size}${collapsed ? " rail" : ""}`}>
                      <Sidebar.Item href="#a" icon={BellIcon} onClick={(event) => event.preventDefault()}>
                        Plain
                      </Sidebar.Item>
                      <Sidebar.Item href="#b" icon={BellIcon} badge="12" onClick={(event) => event.preventDefault()}>
                        Inbox
                      </Sidebar.Item>
                    </Sidebar.Nav>
                  </Sidebar.Content>
                </Sidebar>
              </SidebarFrame>
            )),
          )}
        </div>
      )}
    </SidebarStage>
  ),
  play: async ({ canvasElement }) => {
    for (const root of canvasElement.querySelectorAll<HTMLElement>("[data-variant]")) {
      const rail = root.hasAttribute("data-collapsed");
      const size = within(root).getByRole("navigation").getAttribute("aria-label")!.split(" ")[0]!;
      const inbox = within(root).getByRole("link", { name: /Inbox/ });
      const badge = within(inbox).getByText("12").getBoundingClientRect();
      // an `xs` item's row is a pixel shorter than the smallest badge, so there it is held to 24px (`space.6`); the rail's mark is 20px (`space.5`)
      const expected = rail ? tokenPx("--dbm-space-5") : size === "xs" ? tokenPx("--dbm-space-6") : tokenPx("--dbm-badge-size-xs");
      expect(Math.round(badge.height)).toBe(Math.round(expected));
      expect(Math.abs(badge.width - badge.height)).toBeLessThanOrEqual(2.5);
      expect(Math.abs(inbox.getBoundingClientRect().height - within(root).getByRole("link", { name: "Plain" }).getBoundingClientRect().height)).toBeLessThan(1);
    }
  },
};

export const PanelOpensOnItsFirstItem: Story = {
  name: "The phone panel opens with focus on its first item, wherever a group or the close button comes in the page",
  render: () => (
    <SidebarStage minBlockSize="30rem">
      {(menuContainer) => (
        <Sidebar.Provider collapseBelow="3xl">
          <div style={{ inlineSize: "100%", alignSelf: "start" }}>
            <Sidebar.MenuButton />
            <Sidebar collapseBelow="3xl" menuContainer={menuContainer}>
              <Sidebar.Content>
                <Sidebar.Nav aria-label="Main">
                  <Sidebar.Item href="#a" onClick={(event) => event.preventDefault()}>
                    First link
                  </Sidebar.Item>
                  <Sidebar.Group label="Group">
                    <Sidebar.Item href="#b">B</Sidebar.Item>
                  </Sidebar.Group>
                </Sidebar.Nav>
              </Sidebar.Content>
            </Sidebar>
          </div>
        </Sidebar.Provider>
      )}
    </SidebarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Menu" }));
    const panel = await canvas.findByRole("dialog", { name: "Menu" });
    await settled(panel);
    expect(within(panel).getByRole("link", { name: "First link" })).toHaveFocus();
    // Tab goes on through the navigation in order, and the close button is not first
    await userEvent.tab();
    expect(within(panel).getByRole("button", { name: "Group" })).toHaveFocus();
  },
};

export const CutLabelHasATooltip: Story = {
  name: "A label cut with an ellipsis shows all of its text in a tooltip on keyboard focus, and one that fits shows none",
  render: () => (
    <SidebarStage minBlockSize="22rem">
      {(menuContainer) => (
        <SidebarFrame height="16rem">
          <Sidebar collapseBelow="never" menuContainer={menuContainer} width="13rem">
            <Sidebar.Content>
              <Sidebar.Nav aria-label="Long">
                <Sidebar.Item href="#a" icon={FolderSimpleIcon} badge="12" onClick={(event) => event.preventDefault()}>
                  Quarterly planning and budget review
                </Sidebar.Item>
                <Sidebar.Item href="#b" icon={FolderSimpleIcon} onClick={(event) => event.preventDefault()}>
                  Short
                </Sidebar.Item>
                <Sidebar.Group label="Customer success and account management" icon={FolderSimpleIcon}>
                  <Sidebar.Item href="#c">Inside</Sidebar.Item>
                </Sidebar.Group>
              </Sidebar.Nav>
            </Sidebar.Content>
          </Sidebar>
        </SidebarFrame>
      )}
    </SidebarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const label = (element: HTMLElement) => [...element.querySelectorAll("span")].find((span) => span.className.includes("label"))!;
    const long = canvas.getByRole("link", { name: /Quarterly/ });
    expect(label(long).scrollWidth).toBeGreaterThan(label(long).clientWidth);
    expect(label(canvas.getByRole("link", { name: "Short" })).scrollWidth).toBeLessThanOrEqual(label(canvas.getByRole("link", { name: "Short" })).clientWidth);
    await userEvent.tab();
    expect(long).toHaveFocus();
    const tooltip = await within(document.body).findByRole("tooltip");
    expect(tooltip).toHaveTextContent("Quarterly planning and budget review");
    await waitFor(() => expect(isOnTop(tooltip.parentElement ?? tooltip)).toBe(true));
    await userEvent.tab();
    expect(canvas.getByRole("link", { name: "Short" })).toHaveFocus();
    await waitFor(() => expect(within(document.body).queryByRole("tooltip")).not.toBeInTheDocument());
    await userEvent.tab();
    const group = canvas.getByRole("button", { name: /Customer success/ });
    expect(group).toHaveFocus();
    expect(await within(document.body).findByRole("tooltip")).toHaveTextContent("Customer success and account management");
    await userEvent.keyboard("{Escape}");
  },
};

export const RowActionIsShownOnHoverAndFocus: Story = {
  name: "A row's control is faint until the row is hovered or focused, makes room for itself, and never changes the row's height",
  render: () => (
    <SidebarStage minBlockSize="22rem">
      {(menuContainer) => (
        <SidebarFrame height="16rem">
          <Sidebar collapseBelow="never" menuContainer={menuContainer} width="16rem">
            <Sidebar.Content>
              <Sidebar.Nav aria-label="Actions">
                <Sidebar.Section label="Projects" action={<IconButton icon={PlusIcon} aria-label="New project" />}>
                  <Sidebar.Item href="#a" icon={FolderSimpleIcon} onClick={(event) => event.preventDefault()}>
                    Plain
                  </Sidebar.Item>
                  <Sidebar.Item
                    href="#b"
                    icon={FolderSimpleIcon}
                    badge="12"
                    onClick={(event) => event.preventDefault()}
                    action={<IconButton icon={PlusIcon} aria-label="Add to Alpha" />}
                  >
                    Alpha
                  </Sidebar.Item>
                </Sidebar.Section>
              </Sidebar.Nav>
            </Sidebar.Content>
          </Sidebar>
        </SidebarFrame>
      )}
    </SidebarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alpha = canvas.getByRole("link", { name: /^Alpha/ });
    const add = canvas.getByRole("button", { name: "Add to Alpha" });
    const slot = add.parentElement!;
    const root = rootOf(canvasElement);
    // at rest it is faint, but present and focusable
    expect(Number(getComputedStyle(slot).opacity)).toBe(0);
    // the row is the height of a plain one, and the control sits inside it at its end
    const plain = canvas.getByRole("link", { name: "Plain" }).getBoundingClientRect();
    expect(Math.abs(alpha.getBoundingClientRect().height - plain.height)).toBeLessThan(1);
    const row = alpha.parentElement!.getBoundingClientRect();
    expect(slot.getBoundingClientRect().right).toBeLessThanOrEqual(row.right + 0.5);
    expect(slot.getBoundingClientRect().top).toBeGreaterThanOrEqual(row.top - 0.5);
    // the link leaves the control's room: its badge ends before the control begins
    const badge = within(alpha).getByText("12").getBoundingClientRect();
    expect(badge.right).toBeLessThanOrEqual(slot.getBoundingClientRect().left + 0.5);
    // focus brings it in (and a real pointer over the row does too)
    add.focus();
    await waitFor(() => expect(Number(getComputedStyle(slot).opacity)).toBe(1));
    (document.activeElement as HTMLElement).blur();
    await waitFor(() => expect(Number(getComputedStyle(slot).opacity)).toBe(0));
    const rect = alpha.getBoundingClientRect();
    const frame = window.frameElement?.getBoundingClientRect();
    const scale = frame ? frame.width / window.innerWidth : 1;
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: (frame?.left ?? 0) + (rect.left + 40) * scale, y: (frame?.top ?? 0) + (rect.top + rect.height / 2) * scale });
    await waitFor(() => expect(Number(getComputedStyle(slot).opacity)).toBe(1));
    expect(isOnTop(add)).toBe(true);
    // the section heading's control sits in the heading's row and is shown the same way
    const heading = canvas.getByRole("button", { name: "New project" });
    expect(heading.getBoundingClientRect().right).toBeLessThanOrEqual(root.getBoundingClientRect().right);
    // pressing it does not follow the link
    const address = window.location.href;
    await userEvent.click(add);
    expect(window.location.href).toBe(address);
  },
};
