import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { navbarPlaygroundSnippet, navbarSnippets } from "./Navbar.snippets";
import type { NavbarCollapseBelow, NavbarSize, NavbarVariant } from "./Navbar.types";
import { DemoNavbar, GalleryBar, NavbarStage, NavbarViewModeContext, StickyDemo } from "./NavbarStoryKit";

// Combines Navbar's root-level args in one Playground. Each sub-part gets its own Properties table from a hidden,
// docs-only stories file (guidelines/adr/0013).
interface PlaygroundArgs {
  variant: NavbarVariant;
  size: NavbarSize;
  collapseBelow: NavbarCollapseBelow;
  menuSide: "start" | "end" | "top" | "bottom";
  closeMenuOnNavigate: boolean;
  contained: boolean;
  sticky: boolean;
  dir: "ltr" | "rtl";
  onMenuOpenChange: (open: boolean) => void;
}

const playgroundSource = {
  type: "dynamic" as const,
  transform: (_code: string, context: StoryContext) => navbarPlaygroundSnippet(context.args),
};

const noControls = {
  variant: { control: false },
  size: { control: false },
  collapseBelow: { control: false },
  menuSide: { control: false },
  closeMenuOnNavigate: { control: false },
  contained: { control: false },
  sticky: { control: false },
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
    size: "md",
    collapseBelow: "md",
    menuSide: "start",
    closeMenuOnNavigate: true,
    contained: false,
    sticky: false,
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

export const RouterLinks: Story = {
  name: "With a router's links",
  parameters: { docs: { source: { code: navbarSnippets.routerLinks } } },
  argTypes: { ...noControls },
  render: () => (
    <NavbarStage minBlockSize="12rem">
      {(menuContainer) => (
        <Top>
          {/* A plain anchor stands in for the router's link, which takes the look the same way. */}
          <Navbar menuContainer={menuContainer}>
            <Navbar.Brand asChild>
              <a href="#home">Acme</a>
            </Navbar.Brand>
            <Navbar.Links>
              <Navbar.Link asChild current>
                <a href="#products">Products</a>
              </Navbar.Link>
              <Navbar.Link asChild>
                <a href="#pricing">Pricing</a>
              </Navbar.Link>
            </Navbar.Links>
          </Navbar>
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
    await waitFor(() => expect(stage.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(button).toHaveFocus());
  },
};
