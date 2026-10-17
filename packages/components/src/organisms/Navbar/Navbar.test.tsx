import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
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
