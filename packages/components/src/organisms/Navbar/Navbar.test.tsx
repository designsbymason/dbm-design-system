import { HouseIcon } from "@dbm-design-system/icons";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Button } from "../../atoms/Button";
import { Navbar } from "./Navbar";
import styles from "./Navbar.module.css";

// jsdom applies the stylesheet but matches no media query, so below the breakpoint the bar's own links are `display: none`
// (as on a phone) and only the menu panel's copy is reachable. Tests of the bar's links read them with `hidden: true`, or set
// `collapseBelow="never"` to keep them on show. A hidden element has no computed accessible name, so the bar's own
// navigation is checked by its `aria-label` attribute.
const inline = { hidden: true } as const;

function Basic(props: Partial<React.ComponentProps<typeof Navbar>>) {
  return (
    <Navbar {...props}>
      <Navbar.Brand href="/">Acme</Navbar.Brand>
      <Navbar.Links>
        <Navbar.Link href="/products" current>
          Products
        </Navbar.Link>
        <Navbar.Link href="/pricing">Pricing</Navbar.Link>
        <Navbar.Link href="/docs" disabled>
          Docs
        </Navbar.Link>
      </Navbar.Links>
      <Navbar.Actions>
        <Button size="sm">Sign in</Button>
      </Navbar.Actions>
    </Navbar>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Navbar", () => {
  it("is a banner with a named navigation holding a list of links", () => {
    render(<Basic />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    const nav = screen.getByRole("navigation", inline);
    expect(nav).toHaveAttribute("aria-label", "Main");
    const list = within(nav).getByRole("list", inline);
    expect(within(list).getAllByRole("listitem", inline)).toHaveLength(3);
    expect(screen.getByRole("link", { name: "Acme" })).toHaveAttribute("href", "/");
  });

  it("marks the current page and no other", () => {
    render(<Basic />);
    expect(screen.getByRole("link", { name: "Products", ...inline })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Pricing", ...inline })).not.toHaveAttribute("aria-current");
  });

  it("names the navigation from aria-label, aria-labelledby or labels", () => {
    const { rerender } = render(
      <Navbar labels={{ navigation: "Primary" }}>
        <Navbar.Links>
          <Navbar.Link href="/a">A</Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    expect(screen.getByRole("navigation", inline)).toHaveAttribute("aria-label", "Primary");
    rerender(
      <Navbar>
        <Navbar.Links aria-label="Site">
          <Navbar.Link href="/a">A</Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    expect(screen.getByRole("navigation", inline)).toHaveAttribute("aria-label", "Site");
  });

  it("keeps a label whose override is undefined", () => {
    render(
      <Navbar labels={{ menu: undefined, navigation: undefined }}>
        <Navbar.Links>
          <Navbar.Link href="/a">A</Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    expect(screen.getByRole("button", { name: "Menu" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", inline)).toHaveAttribute("aria-label", "Main");
  });

  it("forwards its ref to the header and the standard props", () => {
    const ref = createRef<HTMLElement>();
    render(<Basic ref={ref} id="top" className="mine" data-testid="bar" aria-label="Site header" />);
    const header = screen.getByTestId("bar");
    expect(ref.current).toBe(header);
    expect(header.tagName).toBe("HEADER");
    expect(header).toHaveAttribute("id", "top");
    expect(header).toHaveClass("mine");
    expect(screen.getByRole("banner", { name: "Site header" })).toBe(header);
  });

  it("keeps its own computed attributes when the same props are passed", () => {
    render(<Basic {...({ "data-variant": "x", "data-size": "x" } as object)} variant="filled" size="lg" />);
    const header = screen.getByRole("banner");
    expect(header).toHaveAttribute("data-variant", "filled");
    expect(header).toHaveAttribute("data-size", "lg");
  });

  it("applies variant, size and collapse classes", () => {
    render(<Basic variant="filled" size="sm" collapseBelow="lg" />);
    const header = screen.getByRole("banner");
    expect(header).toHaveClass(styles.filled!);
    expect(header).toHaveClass(styles.sizeSm!);
    expect(header).toHaveClass(styles.collapseLg!);
  });

  it("sets the direction on the bar", () => {
    render(<Basic dir="rtl" />);
    expect(screen.getByRole("banner")).toHaveAttribute("dir", "rtl");
  });

  it("draws a menu button for the links, closed, and none without links", () => {
    const { rerender } = render(<Basic />);
    const button = screen.getByRole("button", { name: "Menu" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    rerender(
      <Navbar>
        <Navbar.Brand href="/">Acme</Navbar.Brand>
      </Navbar>,
    );
    expect(screen.queryByRole("button", { name: "Menu" })).not.toBeInTheDocument();
  });

  it("draws no automatic menu button when collapseBelow is never, or when the caller placed one", () => {
    const { rerender } = render(<Basic collapseBelow="never" />);
    expect(screen.queryByRole("button", { name: "Menu" })).not.toBeInTheDocument();
    rerender(
      <Navbar>
        <Navbar.MenuButton aria-label="Open navigation" data-testid="mine" />
        <Navbar.Links>
          <Navbar.Link href="/a">A</Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Open navigation" })).toHaveAttribute("data-testid", "mine");
  });

  it("opens the menu panel with the same links, named and modal", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const panel = await screen.findByRole("dialog", { name: "Menu" });
    expect(panel).toHaveAttribute("aria-modal", "true");
    const nav = within(panel).getByRole("navigation", { name: "Main" });
    expect(within(nav).getAllByRole("link").map((link) => link.textContent)).toEqual(["Products", "Pricing", "Docs"]);
    expect(within(nav).getByRole("link", { name: "Products" })).toHaveAttribute("aria-current", "page");
  });

  it("closes the panel on a link a router handles with preventDefault", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const panel = await screen.findByRole("dialog");
    const link = within(panel).getByRole("link", { name: "Pricing" });
    link.addEventListener("click", (event) => event.preventDefault());
    await user.click(link);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("closes the panel on a plain link click and restores focus", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    const button = screen.getByRole("button", { name: "Menu" });
    await user.click(button);
    const panel = await screen.findByRole("dialog");
    await user.click(within(panel).getByRole("link", { name: "Pricing" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(button).toHaveFocus());
  });

  it("keeps the panel open on a link when closeMenuOnNavigate is off", async () => {
    const user = userEvent.setup();
    render(<Basic closeMenuOnNavigate={false} />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const panel = await screen.findByRole("dialog");
    await user.click(within(panel).getByRole("link", { name: "Pricing" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not close the panel, nor run a click, on a disabled link", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Navbar>
        <Navbar.Links>
          <Navbar.Link href="/off" disabled onClick={onClick}>
            Off
          </Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const panel = await screen.findByRole("dialog");
    const link = within(panel).getByRole("link", { name: "Off" });
    expect(link).toHaveAttribute("aria-disabled", "true");
    await user.click(link);
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("keeps a disabled link in the tab order", async () => {
    const user = userEvent.setup();
    render(<Basic collapseBelow="never" />);
    await user.tab();
    expect(screen.getByRole("link", { name: "Acme" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: "Products" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: "Pricing" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: "Docs" })).toHaveFocus();
  });

  it("runs a slotted child's click once for asChild links and closes the panel", async () => {
    const user = userEvent.setup();
    const navigate = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(
      <Navbar>
        <Navbar.Links>
          <Navbar.Link asChild>
            <a href="/router" onClick={navigate}>
              Router
            </a>
          </Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const panel = await screen.findByRole("dialog");
    await user.click(within(panel).getByRole("link", { name: "Router" }));
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it("supports a controlled menu and reports changes", async () => {
    const user = userEvent.setup();
    const onMenuOpenChange = vi.fn();
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <Basic
          menuOpen={open}
          onMenuOpenChange={(next, details) => {
            onMenuOpenChange(next, details);
            setOpen(next);
          }}
        />
      );
    }
    render(<Controlled />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(onMenuOpenChange).toHaveBeenLastCalledWith(true, { reason: "trigger" });
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onMenuOpenChange).toHaveBeenLastCalledWith(false, { reason: "escape" });
  });

  it("starts open with defaultMenuOpen", () => {
    render(<Basic defaultMenuOpen />);
    expect(screen.getByRole("dialog", { name: "Menu" })).toBeInTheDocument();
  });

  it("closes an open panel when the page grows past the collapse width", async () => {
    let listener: ((event: MediaQueryListEvent) => void) | undefined;
    vi.spyOn(window, "matchMedia").mockImplementation(
      () =>
        ({
          matches: false,
          media: "",
          addEventListener: (_type: string, callback: (event: MediaQueryListEvent) => void) => {
            listener = callback;
          },
          removeEventListener: () => {},
        }) as unknown as MediaQueryList,
    );
    render(<Basic defaultMenuOpen />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    listener?.({ matches: true } as MediaQueryListEvent);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("wraps the bar in a sticky element with a surface when sticky", () => {
    render(<Basic sticky />);
    expect(screen.getByRole("banner")).toHaveClass(styles.sticky!);
  });

  it("puts the content in a Container when contained", () => {
    const { container } = render(<Basic contained />);
    const inner = container.querySelector(`.${styles.inner}`);
    expect(inner).not.toBeNull();
    expect(inner).not.toHaveClass(styles.plainInner!);
  });

  it("throws a clear error for a part outside a Navbar", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Navbar.Link href="/a">A</Navbar.Link>)).toThrow("Navbar.Link must be used inside <Navbar>.");
  });

  it("survives StrictMode", async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <Basic />
      </StrictMode>,
    );
    await user.click(screen.getByRole("button", { name: "Menu" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("nests inside itself without losing its own settings", () => {
    render(
      <Navbar size="lg">
        <Navbar.Links>
          <Navbar.Link href="/a">A</Navbar.Link>
        </Navbar.Links>
        <Navbar.Actions>
          <Navbar variant="ghost" aria-label="Inner">
            <Navbar.Brand>Inner</Navbar.Brand>
          </Navbar>
        </Navbar.Actions>
      </Navbar>,
    );
    expect(screen.getByRole("banner", { name: "Inner" })).toHaveAttribute("data-size", "md");
  });

  describe("accessibility", () => {
    it("has no axe violations, closed", async () => {
      const { container } = render(<Basic />);
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no axe violations with the menu panel open", async () => {
      const user = userEvent.setup();
      render(<Basic />);
      await user.click(screen.getByRole("button", { name: "Menu" }));
      const panel = await screen.findByRole("dialog");
      expect(await axe(panel)).toHaveNoViolations();
    });

    it("has no axe violations as a router-link asChild navbar", async () => {
      const { container } = render(
        <Navbar>
          <Navbar.Brand asChild>
            <a href="/">Acme</a>
          </Navbar.Brand>
          <Navbar.Links>
            <Navbar.Link asChild current>
              <a href="/a">A</a>
            </Navbar.Link>
          </Navbar.Links>
        </Navbar>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});

function WithGroup(props: Partial<React.ComponentProps<typeof Navbar>> & { groupCurrent?: boolean; groupDisabled?: boolean } = {}) {
  const { groupCurrent, groupDisabled, ...root } = props;
  return (
    <Navbar {...root}>
      <Navbar.Links>
        <Navbar.Link href="/products">Products</Navbar.Link>
        <Navbar.Group label="Resources" current={groupCurrent} disabled={groupDisabled}>
          <Navbar.Link href="/blog" current={groupCurrent}>
            Blog
          </Navbar.Link>
          <Navbar.Link href="/guides">Guides</Navbar.Link>
          <Navbar.Link href="/archive" disabled>
            Archive
          </Navbar.Link>
        </Navbar.Group>
      </Navbar.Links>
    </Navbar>
  );
}

describe("Navbar in the menu panel", () => {
  it("leaves the panel open when a button drawn with the link look is pressed, and closes it for a link", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(
      <Navbar>
        <Navbar.Links>
          <Navbar.Link asChild>
            <button type="button" onClick={onPress}>
              Action
            </button>
          </Navbar.Link>
          <Navbar.Link href="/a">Page</Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const panel = await screen.findByRole("dialog");
    await user.click(within(panel).getByRole("button", { name: "Action" }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(within(panel).getByRole("link", { name: "Page" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});

describe("Navbar.Group in the bar", () => {
  it("opens a menu of its links from a button, with the current one marked", async () => {
    const user = userEvent.setup();
    render(<WithGroup collapseBelow="never" groupCurrent />);
    const trigger = screen.getByRole("button", { name: "Resources" });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    const menu = await screen.findByRole("menu");
    const items = within(menu).getAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual(["Blog", "Guides", "Archive"]);
    expect(items[0]).toHaveAttribute("href", "/blog");
    expect(items[0]).toHaveAttribute("aria-current", "page");
    expect(items[2]).toHaveAttribute("aria-disabled", "true");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("opens with the arrow key, moves through the items, and closes with Escape and focus back on the button", async () => {
    const user = userEvent.setup();
    render(<WithGroup collapseBelow="never" />);
    const trigger = screen.getByRole("button", { name: "Resources" });
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    const menu = await screen.findByRole("menu");
    await waitFor(() => expect(within(menu).getByRole("menuitem", { name: "Blog" })).toHaveFocus());
    await user.keyboard("{ArrowDown}");
    expect(within(menu).getByRole("menuitem", { name: "Guides" })).toHaveFocus();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("draws the group as a list item holding the button, and a disabled group takes no focus", async () => {
    const user = userEvent.setup();
    render(<WithGroup collapseBelow="never" groupDisabled />);
    const trigger = screen.getByRole("button", { name: "Resources" });
    expect(trigger).toBeDisabled();
    expect(trigger.closest("li")).toHaveAttribute("role", "listitem");
    await user.click(trigger);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("forwards the button's ref, id, class and test id, and keeps its own type", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Navbar collapseBelow="never">
        <Navbar.Links>
          <Navbar.Group ref={ref} label="More" id="more" className="mine" data-testid="group" {...({ type: "submit" } as object)}>
            <Navbar.Link href="/a">A</Navbar.Link>
          </Navbar.Group>
        </Navbar.Links>
      </Navbar>,
    );
    const button = screen.getByTestId("group");
    expect(ref.current).toBe(button);
    expect(button).toHaveAttribute("id", "more");
    expect(button).toHaveClass("mine");
    expect(button).toHaveAttribute("type", "button");
  });

  it("closes its menu on a link a router handles with preventDefault, which Menu alone would leave open", async () => {
    const user = userEvent.setup();
    const navigate = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(
      <Navbar collapseBelow="never">
        <Navbar.Links>
          <Navbar.Group label="Resources">
            <Navbar.Link asChild>
              <a href="/blog" onClick={navigate}>
                Blog
              </a>
            </Navbar.Link>
          </Navbar.Group>
        </Navbar.Links>
      </Navbar>,
    );
    const trigger = screen.getByRole("button", { name: "Resources" });
    await user.click(trigger);
    await user.click(await screen.findByRole("menuitem", { name: "Blog" }));
    expect(navigate).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("has no axe violations closed or open", async () => {
    const user = userEvent.setup();
    const { container } = render(<WithGroup collapseBelow="never" />);
    expect(await axe(container)).toHaveNoViolations();
    await user.click(screen.getByRole("button", { name: "Resources" }));
    const menu = await screen.findByRole("menu");
    expect(await axe(menu)).toHaveNoViolations();
  });
});

describe("Navbar.Group in the menu panel", () => {
  it("is an expandable group: collapsed, it hides its links, and the button toggles them without closing the panel", async () => {
    const user = userEvent.setup();
    render(<WithGroup />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const panel = await screen.findByRole("dialog");
    const toggle = within(panel).getByRole("button", { name: "Resources" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(within(panel).queryByRole("link", { name: "Blog" })).not.toBeInTheDocument();
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAttribute("aria-controls", within(panel).getByRole("link", { name: "Blog" }).closest("ul")!.id);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("starts expanded when it holds the current page, or with defaultOpen, and a chosen link closes the panel", async () => {
    const user = userEvent.setup();
    render(<WithGroup groupCurrent />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const panel = await screen.findByRole("dialog");
    expect(within(panel).getByRole("button", { name: "Resources" })).toHaveAttribute("aria-expanded", "true");
    await user.click(within(panel).getByRole("link", { name: "Guides" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("keeps its own link-in-a-list structure and has no axe violations with the group open", async () => {
    const user = userEvent.setup();
    render(
      <Navbar defaultMenuOpen>
        <Navbar.Links>
          <Navbar.Group label="Resources" defaultOpen>
            <Navbar.Link href="/blog">Blog</Navbar.Link>
          </Navbar.Group>
        </Navbar.Links>
      </Navbar>,
    );
    const panel = screen.getByRole("dialog");
    const nested = within(panel).getByRole("link", { name: "Blog" }).closest("ul")!;
    expect(nested).toHaveAttribute("role", "list");
    expect(within(panel).getAllByRole("list")).toHaveLength(2);
    expect(await axe(panel)).toHaveNoViolations();
    await user.keyboard("{Escape}");
  });
});

describe("Navbar currentVariant", () => {
  const currentLink = () => screen.getByRole("link", { name: "Products", ...inline });

  it("marks the current link with the underline by default, and adds nothing for the other looks' classes", () => {
    render(<Basic />);
    expect(currentLink()).toHaveClass(styles.current!, styles.currentUnderline!);
    expect(currentLink()).not.toHaveClass(styles.currentSolid!);
  });

  it("marks it with the tint alone for subtle", () => {
    render(<Basic currentVariant="subtle" />);
    expect(currentLink()).toHaveClass(styles.current!);
    expect(currentLink()).not.toHaveClass(styles.currentUnderline!);
    expect(currentLink()).not.toHaveClass(styles.currentSolid!);
  });

  it.each([
    ["underline", () => styles.currentUnderline!],
    ["solid", () => styles.currentSolid!],
  ] as const)("marks the current link with the %s look, and only that link", (variant, className) => {
    render(<Basic currentVariant={variant} />);
    expect(currentLink()).toHaveClass(styles.current!, className());
    expect(screen.getByRole("link", { name: "Pricing", ...inline })).not.toHaveClass(styles.current!, className());
  });

  it("keeps aria-current on whichever look is chosen", () => {
    render(<Basic currentVariant="solid" />);
    expect(currentLink()).toHaveAttribute("aria-current", "page");
  });

  it("gives the menu panel's copy of the current link the same look, though the panel is outside the bar", async () => {
    const user = userEvent.setup();
    render(<Basic currentVariant="underline" />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const panel = await screen.findByRole("dialog");
    expect(within(panel).getByRole("link", { name: "Products" })).toHaveClass(styles.currentUnderline!);
    expect(within(panel).getByRole("link", { name: "Pricing" })).not.toHaveClass(styles.currentUnderline!);
  });

  it("gives a group that holds the current page the same look on its button", () => {
    render(
      <Navbar collapseBelow="never" currentVariant="solid">
        <Navbar.Links>
          <Navbar.Group label="Resources" current>
            <Navbar.Link href="/a">A</Navbar.Link>
          </Navbar.Group>
          <Navbar.Group label="More">
            <Navbar.Link href="/b">B</Navbar.Link>
          </Navbar.Group>
        </Navbar.Links>
      </Navbar>,
    );
    expect(screen.getByRole("button", { name: "Resources" })).toHaveClass(styles.currentSolid!);
    expect(screen.getByRole("button", { name: "More" })).not.toHaveClass(styles.currentSolid!);
  });
});

describe("Navbar rounded", () => {
  it("is off by default, and rounds every link and a group's button when set", () => {
    const { rerender } = render(<WithGroup collapseBelow="never" />);
    expect(screen.getByRole("link", { name: "Products" })).not.toHaveClass(styles.rounded!);
    rerender(<WithGroup collapseBelow="never" rounded />);
    expect(screen.getByRole("link", { name: "Products" })).toHaveClass(styles.rounded!);
    expect(screen.getByRole("button", { name: "Resources" })).toHaveClass(styles.rounded!);
  });

  it("rounds the menu panel's copy of the links, though the panel is outside the bar", async () => {
    const user = userEvent.setup();
    render(<Basic rounded />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const panel = await screen.findByRole("dialog");
    expect(within(panel).getByRole("link", { name: "Pricing" })).toHaveClass(styles.rounded!);
  });

  it("rounds the links and not the bar", () => {
    render(<Basic rounded />);
    expect(screen.getByRole("banner")).not.toHaveClass(styles.rounded!);
  });
});

describe("Navbar's underline growing in", () => {
  function Switching() {
    const [path, setPath] = useState("products");
    return (
      <Navbar collapseBelow="never">
        <Navbar.Links>
          {["products", "pricing", "docs"].map((id) => (
            <Navbar.Link key={id} href={`#${id}`} current={path === id} onClick={() => setPath(id)}>
              {id}
            </Navbar.Link>
          ))}
        </Navbar.Links>
        <Navbar.Actions>
          <button type="button">rerender</button>
        </Navbar.Actions>
      </Navbar>
    );
  }

  it("does not grow a link that was current when it was drawn", () => {
    render(<Switching />);
    expect(screen.getByRole("link", { name: "products" })).not.toHaveClass(styles.currentGrow!);
  });

  it("grows the link that becomes current, and only that one, and not the one that stopped being it", async () => {
    const user = userEvent.setup();
    render(<Switching />);
    await user.click(screen.getByRole("link", { name: "pricing" }));
    expect(screen.getByRole("link", { name: "pricing" })).toHaveClass(styles.currentGrow!);
    expect(screen.getByRole("link", { name: "products" })).not.toHaveClass(styles.currentGrow!);
    expect(screen.getByRole("link", { name: "docs" })).not.toHaveClass(styles.currentGrow!);
  });

  it("keeps the class through other updates and drops it when the link stops being current", async () => {
    const user = userEvent.setup();
    render(<Switching />);
    await user.click(screen.getByRole("link", { name: "pricing" }));
    await user.click(screen.getByRole("button", { name: "rerender" }));
    expect(screen.getByRole("link", { name: "pricing" })).toHaveClass(styles.currentGrow!);
    await user.click(screen.getByRole("link", { name: "docs" }));
    expect(screen.getByRole("link", { name: "pricing" })).not.toHaveClass(styles.currentGrow!);
    expect(screen.getByRole("link", { name: "docs" })).toHaveClass(styles.currentGrow!);
  });

  it("does not grow the current link in a menu panel that opens on it", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const panel = await screen.findByRole("dialog");
    expect(within(panel).getByRole("link", { name: "Products" })).not.toHaveClass(styles.currentGrow!);
  });

  it("grows a group's button when it becomes the one that holds the current page", async () => {
    const user = userEvent.setup();
    function Grouped() {
      const [inside, setInside] = useState(false);
      return (
        <Navbar collapseBelow="never">
          <Navbar.Links>
            <Navbar.Group label="Resources" current={inside}>
              <Navbar.Link href="#blog">Blog</Navbar.Link>
            </Navbar.Group>
          </Navbar.Links>
          <Navbar.Actions>
            <button type="button" onClick={() => setInside(true)}>
              go
            </button>
          </Navbar.Actions>
        </Navbar>
      );
    }
    render(<Grouped />);
    const trigger = screen.getByRole("button", { name: "Resources" });
    expect(trigger).not.toHaveClass(styles.currentGrow!);
    await user.click(screen.getByRole("button", { name: "go" }));
    expect(trigger).toHaveClass(styles.currentGrow!);
  });
});

describe("Navbar.Action and Navbar.PanelActions", () => {
  function Actions(props: Partial<React.ComponentProps<typeof Navbar>> = {}) {
    return (
      <Navbar {...props}>
        <Navbar.Links>
          <Navbar.Link href="/a">A</Navbar.Link>
        </Navbar.Links>
        <Navbar.Actions>
          <Navbar.Action hideBelow="md" data-testid="signin">
            <Button size="sm">Sign in</Button>
          </Navbar.Action>
          <Navbar.Action data-testid="always">
            <Button size="sm">Search</Button>
          </Navbar.Action>
        </Navbar.Actions>
        <Navbar.PanelActions data-testid="panel-actions">
          <Button>Sign in (panel)</Button>
        </Navbar.PanelActions>
      </Navbar>
    );
  }

  it("hides an action below its width by class, and leaves the others alone", () => {
    render(<Actions />);
    expect(screen.getByTestId("signin")).toHaveClass(styles.hideBelowMd!);
    expect(screen.getByTestId("always")).not.toHaveClass(styles.hideBelowMd!);
  });

  it("forwards a ref and standard props on an action", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Navbar>
        <Navbar.Actions>
          <Navbar.Action ref={ref} id="one" className="mine" data-testid="one">
            x
          </Navbar.Action>
        </Navbar.Actions>
      </Navbar>,
    );
    expect(ref.current).toBe(screen.getByTestId("one"));
    expect(ref.current).toHaveAttribute("id", "one");
    expect(ref.current).toHaveClass("mine", styles.action!);
  });

  it("draws nothing for the panel's actions in the bar or while the panel is closed", () => {
    render(<Actions />);
    expect(screen.queryByText("Sign in (panel)")).not.toBeInTheDocument();
    expect(screen.queryByTestId("panel-actions")).not.toBeInTheDocument();
  });

  it("draws them in the panel's footer once it is open", async () => {
    const user = userEvent.setup();
    render(<Actions />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const panel = await screen.findByRole("dialog");
    const actions = await within(panel).findByTestId("panel-actions");
    expect(within(actions).getByRole("button", { name: "Sign in (panel)" })).toBeInTheDocument();
    expect(actions).toHaveClass(styles.panelActions!);
    // in the panel's footer, after the links
    const links = within(panel).getByRole("navigation");
    expect(links.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("draws no footer when there are no panel actions", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const panel = await screen.findByRole("dialog");
    expect(panel.querySelector('[data-testid="panel-actions"]')).toBeNull();
    expect(within(panel).queryAllByRole("button")).toHaveLength(1); // only the close button
  });

  it("has no axe violations with the panel open", async () => {
    const user = userEvent.setup();
    render(<Actions />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    expect(await axe(await screen.findByRole("dialog"))).toHaveNoViolations();
  });
});

describe("Navbar.SkipLink", () => {
  it("is the first link, names itself, and points at main by default", async () => {
    const user = userEvent.setup();
    render(
      <Navbar collapseBelow="never">
        <Navbar.SkipLink />
        <Navbar.Brand href="/">dbM</Navbar.Brand>
      </Navbar>,
    );
    const skip = screen.getByRole("link", { name: "Skip to content" });
    expect(skip).toHaveAttribute("href", "#main");
    expect(skip).toHaveClass(styles.skipLink!);
    await user.tab();
    expect(skip).toHaveFocus();
  });

  it("takes its own href and text, and the label from labels", () => {
    const { rerender } = render(
      <Navbar labels={{ skipLink: "Jump" }}>
        <Navbar.SkipLink />
      </Navbar>,
    );
    expect(screen.getByRole("link", { name: "Jump" })).toBeInTheDocument();
    rerender(
      <Navbar>
        <Navbar.SkipLink href="#content" data-testid="skip">
          Go to the content
        </Navbar.SkipLink>
      </Navbar>,
    );
    expect(screen.getByRole("link", { name: "Go to the content" })).toHaveAttribute("href", "#content");
  });
});

describe("Navbar.Link icon, badge and external", () => {
  it("draws an icon before the text and a badge after it, in the link's name", () => {
    render(
      <Navbar collapseBelow="never">
        <Navbar.Links>
          <Navbar.Link href="/inbox" icon={HouseIcon} badge="3">
            Inbox
          </Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    const link = screen.getByRole("link", { name: "Inbox 3" });
    expect(link.querySelector("svg")).not.toBeNull();
    expect(link.querySelector(`.${styles.badge}`)).toHaveTextContent("3");
    expect(link.firstElementChild?.tagName.toLowerCase()).toBe("svg");
  });

  it("marks an external href: new tab, rel, a trailing icon and a hidden cue", () => {
    render(
      <Navbar collapseBelow="never">
        <Navbar.Links>
          <Navbar.Link href="https://example.com/docs">Docs</Navbar.Link>
          <Navbar.Link href="/local">Local</Navbar.Link>
          <Navbar.Link href="https://example.com" external={false}>
            Forced
          </Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    // (the cue is read after the text, as one name; the space is its own leading one)
    const external = screen.getByRole("link", { name: /^Docs\s*\(opens in a new tab\)$/ });
    expect(external).toHaveAttribute("target", "_blank");
    expect(external).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("link", { name: "Local" })).not.toHaveAttribute("target");
    expect(screen.getByRole("link", { name: "Forced" })).not.toHaveAttribute("target");
  });

  it("takes the cue's wording from labels, and draws none of it for asChild", () => {
    render(
      <Navbar collapseBelow="never" labels={{ externalLink: "(nouvel onglet)" }}>
        <Navbar.Links>
          <Navbar.Link href="https://example.com">Docs</Navbar.Link>
          <Navbar.Link asChild icon={HouseIcon} badge="9">
            <a href="https://example.com/x">Child</a>
          </Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    expect(screen.getByRole("link", { name: /^Docs\s*\(nouvel onglet\)$/ })).toBeInTheDocument();
    const child = screen.getByRole("link", { name: "Child" });
    expect(child.querySelector("svg")).toBeNull();
    expect(child).not.toHaveAttribute("target");
  });

  it("draws the same content for a link in a group's menu", async () => {
    const user = userEvent.setup();
    render(
      <Navbar collapseBelow="never">
        <Navbar.Links>
          <Navbar.Group label="More">
            <Navbar.Link href="https://example.com" icon={HouseIcon} badge="2">
              Docs
            </Navbar.Link>
          </Navbar.Group>
        </Navbar.Links>
      </Navbar>,
    );
    await user.click(screen.getByRole("button", { name: "More" }));
    const item = await screen.findByRole("menuitem", { name: "Docs 2 (opens in a new tab)" });
    expect(item).toHaveAttribute("target", "_blank");
  });
});

describe("Navbar.Links align", () => {
  it.each(["start", "center", "end"] as const)("puts align=%s on the navigation", (align) => {
    render(
      <Navbar collapseBelow="never">
        <Navbar.Links align={align}>
          <Navbar.Link href="/a">A</Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    expect(screen.getByRole("navigation")).toHaveAttribute("data-align", align);
  });

  it("is start by default, and a same-named attribute can't replace it", () => {
    render(
      <Navbar collapseBelow="never">
        <Navbar.Links {...({ "data-align": "end" } as object)}>
          <Navbar.Link href="/a">A</Navbar.Link>
        </Navbar.Links>
      </Navbar>,
    );
    expect(screen.getByRole("navigation")).toHaveAttribute("data-align", "start");
  });
});

describe("Navbar hideOnScroll", () => {
  function scrollTo(y: number) {
    Object.defineProperty(window, "scrollY", { value: y, configurable: true });
    window.dispatchEvent(new Event("scroll"));
  }

  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } });
    // a frame that comes after the handler returns, as a real one does (calling it inline would run the read before the
    // hook has noted that one is pending)
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback: FrameRequestCallback) => {
      queueMicrotask(() => callback(0));
      return 1;
    });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ height: 60, width: 0, top: 0, left: 0, right: 0, bottom: 60, x: 0, y: 0, toJSON() {} } as DOMRect);
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("slides away on a scroll down past the bar, returns on a scroll up, and stays shown near the top", async () => {
    render(<Basic sticky hideOnScroll />);
    const bar = screen.getByRole("banner");
    expect(bar).not.toHaveClass(styles.awayFromView!);
    await act(async () => scrollTo(30));
    expect(bar).not.toHaveClass(styles.awayFromView!);
    await act(async () => scrollTo(300));
    expect(bar).toHaveClass(styles.awayFromView!);
    await act(async () => scrollTo(250));
    expect(bar).not.toHaveClass(styles.awayFromView!);
    await act(async () => scrollTo(400));
    expect(bar).toHaveClass(styles.awayFromView!);
    await act(async () => scrollTo(20));
    expect(bar).not.toHaveClass(styles.awayFromView!);
  });

  it("does nothing without hideOnScroll, and warns when it is set without sticky", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { rerender } = render(<Basic sticky />);
    await act(async () => scrollTo(300));
    expect(screen.getByRole("banner")).not.toHaveClass(styles.awayFromView!);
    expect(warn).not.toHaveBeenCalled();
    rerender(<Basic hideOnScroll />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("hideOnScroll"));
    await act(async () => scrollTo(500));
    expect(screen.getByRole("banner")).not.toHaveClass(styles.awayFromView!);
  });

  it("stops listening when it unmounts", async () => {
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<Basic sticky hideOnScroll />);
    unmount();
    expect(remove).toHaveBeenCalledWith("scroll", expect.any(Function));
  });
});
