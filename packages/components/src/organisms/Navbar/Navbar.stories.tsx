import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { navbarPlaygroundSnippet, navbarSnippets } from "./Navbar.snippets";
import type { NavbarCollapseBelow, NavbarCurrentVariant, NavbarSize, NavbarVariant } from "./Navbar.types";
import { DemoNavbar, GalleryBar, NavbarStage, RouterDemoNavbar, NavbarViewModeContext, StickyDemo } from "./NavbarStoryKit";

// Combines Navbar's root-level args in one Playground. Each sub-part gets its own Properties table from a hidden,
// docs-only stories file (guidelines/adr/0013).
interface PlaygroundArgs {
  variant: NavbarVariant;
  currentVariant: NavbarCurrentVariant;
  rounded: boolean;
  size: NavbarSize;
  collapseBelow: NavbarCollapseBelow;
  menuSide: "start" | "end" | "top" | "bottom";
  closeMenuOnNavigate: boolean;
  contained: boolean;
  sticky: boolean;
  hideOnScroll: boolean;
  dir: "ltr" | "rtl";
  onMenuOpenChange: (open: boolean) => void;
}

const playgroundSource = {
  type: "dynamic" as const,
  transform: (_code: string, context: StoryContext) => navbarPlaygroundSnippet(context.args),
};

const noControls = {
  variant: { control: false },
  currentVariant: { control: false },
  rounded: { control: false },
  size: { control: false },
  collapseBelow: { control: false },
  menuSide: { control: false },
  closeMenuOnNavigate: { control: false },
  contained: { control: false },
  sticky: { control: false },
  hideOnScroll: { control: false },
  dir: { control: false },
  onMenuOpenChange: { control: false },
} as const;

// The stage is a box with a transform, so the menu panel and its scrim stay inside it (every Canvas on a Docs page shares
// one document); the bar sits at the top of it, as it does in a page.
function Top({ children }: { children: ReactNode }) {
  return <div style={{ inlineSize: "100%", alignSelf: "start" }}>{children}</div>;
}

const meta: Meta<PlaygroundArgs> = {
  title: "Organisms/Navigation/Navbar",
  parameters: { layout: "padded" },
  decorators: [
    (Story, context) => (
      <NavbarViewModeContext.Provider value={context.viewMode === "docs" ? "docs" : "story"}>
        <Story />
      </NavbarViewModeContext.Provider>
    ),
  ],
  argTypes: {
    variant: {
      control: "select",
      options: ["outlined", "filled", "ghost"],
      description: "How the bar itself is drawn: a surface with a line under it, a tinted surface, or nothing of its own.",
      table: { defaultValue: { summary: '"outlined"' } },
    },
    currentVariant: {
      control: "select",
      options: ["underline", "subtle", "solid"],
      description:
        "How the current page's link is marked: a tinted pill, a brand line under it, or a brand fill. aria-current is set whichever it is, and the look is the same in the phone panel.",
      table: { defaultValue: { summary: '"underline"' } },
    },
    rounded: {
      control: "boolean",
      description:
        "Fully rounded links: each link and group button is a pill, with the current link's tint or fill following the shape. The links round, not the bar.",
      table: { defaultValue: { summary: "false" } },
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "The bar's height: as tall as an IconButton of the same step plus room above and below.",
      table: { defaultValue: { summary: '"md"' } },
    },
    collapseBelow: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "2xl", "3xl", "never"],
      description:
        "The width below which the links leave the bar for a menu button. It follows the window's width, not the demo's frame: resize the window to see it.",
      table: { defaultValue: { summary: '"md"' } },
    },
    menuSide: {
      control: "select",
      options: ["start", "end", "top", "bottom"],
      description: "Which edge the menu panel slides in from. start and end swap in right-to-left.",
      table: { defaultValue: { summary: '"start"' } },
    },
    closeMenuOnNavigate: {
      control: "boolean",
      description: "Closes the menu panel when a link in it is chosen.",
      table: { defaultValue: { summary: "true" } },
    },
    contained: {
      control: "boolean",
      description: "Keeps the content to the page's reading width with Container, centred.",
      table: { defaultValue: { summary: "false" } },
    },
    sticky: {
      control: "boolean",
      description:
        "Keeps the bar at the top of the page as it scrolls, with a shadow while stuck. The Playground's frame doesn't scroll, so see the Sticky story.",
      table: { defaultValue: { summary: "false" } },
    },
    hideOnScroll: {
      control: "boolean",
      description:
        "Hides a sticky bar while the reader scrolls down and brings it back on a scroll up. Needs sticky. The Playground's frame doesn't scroll, so see the Hides on scroll story.",
      table: { defaultValue: { summary: "false" } },
    },
    dir: {
      control: "radio",
      options: ["ltr", "rtl"],
      description: "The reading direction, passed to the bar and the menu panel. Not read from the page.",
      table: { defaultValue: { summary: '"ltr"' } },
    },
    onMenuOpenChange: {
      control: false,
      description: "Called with the new open state of the menu panel, and { reason }.",
    },
  },
  args: {
    variant: "outlined",
    currentVariant: "underline",
    rounded: false,
    size: "md",
    collapseBelow: "md",
    menuSide: "start",
    closeMenuOnNavigate: true,
    contained: false,
    sticky: false,
    hideOnScroll: false,
    dir: "ltr",
    onMenuOpenChange: fn(),
  },
  render: (args) => (
    <NavbarStage minBlockSize="22rem">
      {(menuContainer) => (
        <Top>
          <DemoNavbar {...args} menuContainer={menuContainer} />
        </Top>
      )}
    </NavbarStage>
  ),
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: { docs: { source: playgroundSource } },
};

export const Variants: Story = {
  name: "Variants",
  parameters: { docs: { source: { code: navbarSnippets.variants } } },
  argTypes: { ...noControls },
  render: (args) => (
    <NavbarStage minBlockSize="16rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", display: "grid", gap: "var(--dbm-space-4)", alignSelf: "start" }}>
          {(["outlined", "filled", "ghost"] as const).map((variant) => (
            <GalleryBar key={variant} name={`${variant} bar`}>
              <DemoNavbar
                variant={variant}
                linksLabel={`${variant} navigation`}
                menuContainer={menuContainer}
                collapseBelow={args.collapseBelow}
              />
            </GalleryBar>
          ))}
        </div>
      )}
    </NavbarStage>
  ),
};

export const CurrentVariants: Story = {
  name: "Marking the current page",
  parameters: { docs: { source: { code: navbarSnippets.currentVariants } } },
  argTypes: { ...noControls },
  render: (args) => (
    <NavbarStage minBlockSize="16rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", display: "grid", gap: "var(--dbm-space-4)", alignSelf: "start" }}>
          {(["underline", "subtle", "solid"] as const).map((currentVariant) => (
            <GalleryBar key={currentVariant} name={`${currentVariant} current link`}>
              <DemoNavbar
                currentVariant={currentVariant}
                linksLabel={`${currentVariant} navigation`}
                menuContainer={menuContainer}
                collapseBelow={args.collapseBelow}
              />
            </GalleryBar>
          ))}
        </div>
      )}
    </NavbarStage>
  ),
};

export const Rounded: Story = {
  name: "Rounded links",
  parameters: { docs: { source: { code: navbarSnippets.rounded } } },
  argTypes: { ...noControls },
  render: (args) => (
    <NavbarStage minBlockSize="16rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", display: "grid", gap: "var(--dbm-space-4)", alignSelf: "start" }}>
          {(["subtle", "solid"] as const).map((currentVariant) => (
            <GalleryBar key={currentVariant} name={`rounded ${currentVariant} bar`}>
              <DemoNavbar
                rounded
                currentVariant={currentVariant}
                withGroup
                linksLabel={`rounded ${currentVariant} navigation`}
                menuContainer={menuContainer}
                collapseBelow={args.collapseBelow}
              />
            </GalleryBar>
          ))}
        </div>
      )}
    </NavbarStage>
  ),
};

export const Sizes: Story = {
  name: "Sizes",
  parameters: { docs: { source: { code: navbarSnippets.sizes } } },
  argTypes: { ...noControls },
  render: (args) => (
    <NavbarStage minBlockSize="18rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", display: "grid", gap: "var(--dbm-space-4)", alignSelf: "start" }}>
          {(["sm", "md", "lg"] as const).map((size) => (
            <GalleryBar key={size} name={`${size} bar`}>
              <DemoNavbar
                size={size}
                linksLabel={`${size} navigation`}
                menuContainer={menuContainer}
                collapseBelow={args.collapseBelow}
              />
            </GalleryBar>
          ))}
        </div>
      )}
    </NavbarStage>
  ),
};

export const WithActions: Story = {
  name: "Search and an account menu",
  parameters: { docs: { source: { code: navbarSnippets.actions } } },
  argTypes: { ...noControls },
  render: () => (
    <NavbarStage minBlockSize="16rem">
      {(menuContainer) => (
        <Top>
          <DemoNavbar actions="rich" menuContainer={menuContainer} />
        </Top>
      )}
    </NavbarStage>
  ),
};

export const WithGroup: Story = {
  name: "Links that open more links",
  parameters: { docs: { source: { code: navbarSnippets.group } } },
  argTypes: { ...noControls },
  render: () => (
    <NavbarStage minBlockSize="22rem">
      {(menuContainer) => (
        <Top>
          <DemoNavbar withGroup actions="none" collapseBelow="never" menuContainer={menuContainer} />
        </Top>
      )}
    </NavbarStage>
  ),
};

export const GroupInThePanel: Story = {
  name: "A group in the menu panel",
  parameters: { docs: { source: { code: navbarSnippets.group } } },
  argTypes: { ...noControls },
  render: () => (
    // Collapsed below the widest step, so the menu button shows on any window narrower than 1920px.
    <NavbarStage minBlockSize="26rem">
      {(menuContainer) => (
        <Top>
          <DemoNavbar withGroup collapseBelow="3xl" menuContainer={menuContainer} />
        </Top>
      )}
    </NavbarStage>
  ),
};

/** Hidden twin of "Links that open more links": choosing a link in the group marks the group as holding the current page. */
export const GroupCurrentInteraction: Story = {
  ...WithGroup,
  name: "Links that open more links — interaction test",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const address = window.location.href;
    await userEvent.click(canvas.getByRole("button", { name: "Resources" }));
    const item = await within(document.body).findByRole("menuitem", { name: "Guides" });
    await userEvent.click(item);
    await waitFor(() => expect(within(document.body).queryByRole("menu")).not.toBeInTheDocument());
    expect(window.location.href).toBe(address);
    // the group now holds the current page, and the plain link is no longer it
    expect(canvas.getByRole("link", { name: "Products" })).not.toHaveAttribute("aria-current");
    await userEvent.click(canvas.getByRole("button", { name: "Resources" }));
    expect(await within(document.body).findByRole("menuitem", { name: "Guides" })).toHaveAttribute("aria-current", "page");
    await userEvent.keyboard("{Escape}");
    // end with the menu gone: an accessibility check run mid-exit sees the page still hidden behind it
    await waitFor(() => expect(within(document.body).queryByRole("menu")).not.toBeInTheDocument());
  },
};

export const Contained: Story = {
  name: "Contained",
  parameters: { docs: { source: { code: navbarSnippets.contained } } },
  argTypes: { ...noControls },
  render: () => (
    <NavbarStage minBlockSize="14rem">
      {(menuContainer) => (
        <Top>
          <DemoNavbar contained variant="filled" menuContainer={menuContainer} />
        </Top>
      )}
    </NavbarStage>
  ),
};

export const CollapsedMenu: Story = {
  name: "The menu panel",
  parameters: { docs: { source: { code: navbarSnippets.menu } } },
  argTypes: { ...noControls },
  render: () => (
    // `3xl` is the widest step, so this bar shows its menu button on any window narrower than 1920px, which is how the
    // collapse can be shown on a Docs page; an app picks the step that suits its links.
    <NavbarStage minBlockSize="26rem">
      {(menuContainer) => (
        <Top>
          <DemoNavbar collapseBelow="3xl" menuSide="start" menuContainer={menuContainer} />
        </Top>
      )}
    </NavbarStage>
  ),
};

export const CollapseStep: Story = {
  name: "Where it collapses",
  parameters: { docs: { source: { code: navbarSnippets.collapse } } },
  argTypes: { ...noControls },
  render: () => (
    <NavbarStage minBlockSize="14rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", display: "grid", gap: "var(--dbm-space-4)", alignSelf: "start" }}>
          <GalleryBar name="collapses below lg">
            <DemoNavbar collapseBelow="lg" linksLabel="Collapses below lg" menuContainer={menuContainer} />
          </GalleryBar>
          <GalleryBar name="never collapses">
            <DemoNavbar collapseBelow="never" linksLabel="Never collapses" menuContainer={menuContainer} />
          </GalleryBar>
        </div>
      )}
    </NavbarStage>
  ),
};

export const Sticky: Story = {
  name: "Sticky",
  parameters: { docs: { source: { code: navbarSnippets.sticky } } },
  argTypes: { ...noControls },
  render: function Render() {
    const boxRef = useRef<HTMLDivElement | null>(null);
    return (
      <StickyDemo boxRef={boxRef}>{(ref) => <DemoNavbar sticky scrollContainerRef={ref} />}</StickyDemo>
    );
  },
};

export const ResponsiveActions: Story = {
  name: "Actions that move into the menu panel",
  parameters: { docs: { source: { code: navbarSnippets.responsiveActions } } },
  argTypes: { ...noControls },
  render: () => (
    // `3xl` is the widest step, so the button leaves the bar and shows in the panel on any window narrower than 1920px.
    <NavbarStage minBlockSize="28rem">
      {(menuContainer) => (
        <Top>
          <DemoNavbar actions="responsive" collapseBelow="3xl" menuContainer={menuContainer} />
        </Top>
      )}
    </NavbarStage>
  ),
};

export const SkipLink: Story = {
  name: "A skip link",
  parameters: { docs: { source: { code: navbarSnippets.skipLink } } },
  argTypes: { ...noControls },
  render: () => (
    <NavbarStage minBlockSize="16rem">
      {(menuContainer) => (
        <Top>
          <p style={{ margin: "var(--dbm-space-3)", fontSize: "var(--dbm-font-size-sm)" }}>
            Click here, then press Tab: the skip link is the first thing reached, and appears over the top corner.
          </p>
          <DemoNavbar skipLink menuContainer={menuContainer} />
        </Top>
      )}
    </NavbarStage>
  ),
};

export const LinkExtras: Story = {
  name: "Icons, counts and external links",
  parameters: { docs: { source: { code: navbarSnippets.linkExtras } } },
  argTypes: { ...noControls },
  render: () => (
    <NavbarStage minBlockSize="14rem">
      {(menuContainer) => (
        <Top>
          <DemoNavbar extras actions="none" collapseBelow="never" menuContainer={menuContainer} />
        </Top>
      )}
    </NavbarStage>
  ),
};

export const LinksAlign: Story = {
  name: "Where the links sit",
  parameters: { docs: { source: { code: navbarSnippets.linksAlign } } },
  argTypes: { ...noControls },
  render: () => (
    <NavbarStage minBlockSize="16rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", display: "grid", gap: "var(--dbm-space-4)", alignSelf: "start" }}>
          {(["start", "center", "end"] as const).map((align) => (
            <GalleryBar key={align} name={`${align} links`}>
              <DemoNavbar
                linksAlign={align}
                linksLabel={`${align} navigation`}
                collapseBelow="never"
                menuContainer={menuContainer}
              />
            </GalleryBar>
          ))}
        </div>
      )}
    </NavbarStage>
  ),
};

export const GhostOverAHero: Story = {
  name: "Transparent until it sticks",
  parameters: { docs: { source: { code: navbarSnippets.ghostSticky } } },
  argTypes: { ...noControls },
  render: function Render() {
    const boxRef = useRef<HTMLDivElement | null>(null);
    return (
      <StickyDemo boxRef={boxRef} hero>
        {(ref) => <DemoNavbar sticky variant="ghost" scrollContainerRef={ref} />}
      </StickyDemo>
    );
  },
};

export const HidesOnScroll: Story = {
  name: "Hides on scroll",
  parameters: { docs: { source: { code: navbarSnippets.hideOnScroll } } },
  argTypes: { ...noControls },
  render: function Render() {
    const boxRef = useRef<HTMLDivElement | null>(null);
    return (
      <StickyDemo boxRef={boxRef}>
        {(ref) => <DemoNavbar sticky hideOnScroll scrollContainerRef={ref} />}
      </StickyDemo>
    );
  },
};

export const CurrentPage: Story = {
  name: "Current page and a disabled link",
  parameters: { docs: { source: { code: navbarSnippets.current } } },
  argTypes: { ...noControls },
  render: () => (
    <NavbarStage minBlockSize="12rem">
      {(menuContainer) => (
        <Top>
          <DemoNavbar actions="none" menuContainer={menuContainer} />
        </Top>
      )}
    </NavbarStage>
  ),
};

/** Hidden twin of "Current page and a disabled link": a link chosen takes the current mark and the page stays where it is. */
export const CurrentPageInteraction: Story = {
  ...CurrentPage,
  name: "Current page and a disabled link — interaction test",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const address = window.location.href;
    expect(canvas.getByRole("link", { name: "Products" })).toHaveAttribute("aria-current", "page");
    await userEvent.click(canvas.getByRole("link", { name: "Pricing" }));
    expect(canvas.getByRole("link", { name: "Pricing" })).toHaveAttribute("aria-current", "page");
    expect(canvas.getByRole("link", { name: "Products" })).not.toHaveAttribute("aria-current");
    // a demo link goes nowhere: the address is what it was, and a disabled link can't take the mark
    expect(window.location.href).toBe(address);
    await userEvent.click(canvas.getByRole("link", { name: "Beta" }));
    expect(canvas.getByRole("link", { name: "Pricing" })).toHaveAttribute("aria-current", "page");
    expect(canvas.getByRole("link", { name: "Beta" })).not.toHaveAttribute("aria-current");
    await userEvent.click(canvas.getByRole("link", { name: "dbM" }));
    expect(window.location.href).toBe(address);
  },
};

export const RouterLinks: Story = {
  name: "With a router's links",
  parameters: { docs: { source: { code: navbarSnippets.routerLinks } } },
  argTypes: { ...noControls },
  render: () => (
    <NavbarStage minBlockSize="12rem">
      {(menuContainer) => (
        <Top>
          {/* A plain anchor stands in for the router's link, which takes the look the same way. */}
          <RouterDemoNavbar menuContainer={menuContainer} />
        </Top>
      )}
    </NavbarStage>
  ),
};

export const ControlledMenu: Story = {
  name: "Controlled from your own state",
  parameters: { docs: { source: { code: navbarSnippets.controlledMenu } } },
  argTypes: { ...noControls },
  render: function Render() {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState("nothing yet");
    return (
      <NavbarStage minBlockSize="26rem">
        {(menuContainer) => (
          <Top>
            <DemoNavbar
              collapseBelow="3xl"
              menuOpen={open}
              onMenuOpenChange={(next, details) => {
                setOpen(next);
                setReason(details.reason);
              }}
              menuContainer={menuContainer}
            />
            <p style={{ margin: "var(--dbm-space-3)", fontSize: "var(--dbm-font-size-sm)" }}>
              Menu {open ? "open" : "closed"}; last change reported: {reason}.
            </p>
          </Top>
        )}
      </NavbarStage>
    );
  },
};

export const RightToLeft: Story = {
  name: "Right to left",
  parameters: { docs: { source: { code: navbarSnippets.rightToLeft } } },
  argTypes: { ...noControls },
  render: () => (
    <NavbarStage minBlockSize="24rem">
      {(menuContainer) => (
        <Top>
          <DemoNavbar
            dir="rtl"
            collapseBelow="3xl"
            labels={{ menu: "القائمة", navigation: "الرئيسية", close: "إغلاق" }}
            menuContainer={menuContainer}
          />
        </Top>
      )}
    </NavbarStage>
  ),
};

export const OnAPhone: Story = {
  name: "On a phone",
  // Opened on its own, this story is shown at a phone's width (and it is in the test run); on the Docs page it sits in the
  // wide page like every other story, so narrow the window there.
  globals: { viewport: { value: "mobile1", isRotated: false } },
  argTypes: { ...noControls },
  parameters: { docs: { source: { code: navbarSnippets.menu } } },
  render: () => (
    <NavbarStage minBlockSize="26rem">
      {(menuContainer) => (
        <Top>
          <DemoNavbar menuContainer={menuContainer} />
        </Top>
      )}
    </NavbarStage>
  ),
};

/** Hidden twin of "On a phone": presses the button, chooses a link, and checks the bar and the panel behave as on a phone. */
export const OnAPhoneInteraction: Story = {
  ...OnAPhone,
  name: "On a phone — interaction test",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    expect(window.innerWidth).toBeLessThan(768);
    const stage = within(canvasElement);
    const nav = stage.getByRole("navigation", { hidden: true });
    expect(getComputedStyle(nav).display).toBe("none");
    const button = stage.getByRole("button", { name: "Menu" });
    expect(getComputedStyle(button).display).not.toBe("none");
    await userEvent.click(button);
    const panel = await within(canvasElement).findByRole("dialog", { name: "Menu" });
    const link = within(panel).getByRole("link", { name: "Pricing" });
    // Stand in for a router: handle the navigation without a page load (a hash change would reload the test page).
    link.addEventListener("click", (event) => event.preventDefault(), { once: true });
    await userEvent.click(link);
    // the panel's exit takes a moment, longer when the run is busy
    await waitFor(() => expect(stage.queryByRole("dialog")).not.toBeInTheDocument(), { timeout: 3000 });
    await waitFor(() => expect(button).toHaveFocus(), { timeout: 3000 });
  },
};
