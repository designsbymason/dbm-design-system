import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Link } from "../../atoms/Link";
import { HoverCard } from "./HoverCard";
import styles from "./HoverCard.module.css";
import { HoverCardProvider } from "./HoverCardProvider";

// Zero delays everywhere except the tests about the delays themselves, so the
// open/close tests don't depend on a timer.
const instant = { openDelay: 0, closeDelay: 0 };

// The card renders in a portal on `document.body`, outside the render
// container, so the open-state scans run on the whole body — where axe's
// page-level `region` rule (content outside a landmark) is meaningless for a
// bare component under test.
const scanBody = () => axe(document.body, { rules: { region: { enabled: false } } });

function Example(props: Partial<React.ComponentProps<typeof HoverCard>> = {}) {
  return (
    <HoverCard {...instant} {...props}>
      <HoverCard.Trigger href="/jane">Jane</HoverCard.Trigger>
      <HoverCard.Content>Card content</HoverCard.Content>
    </HoverCard>
  );
}

// jsdom's own `:focus-visible` depends on which tests ran before it, so a test that
// needs it says what it should be, as `Pagination`'s does.
function stubFocusVisible(value: boolean | "throws") {
  const matches = Element.prototype.matches;
  vi.spyOn(Element.prototype, "matches").mockImplementation(function (this: Element, selector: string) {
    if (selector === ":focus-visible") {
      if (value === "throws") throw new SyntaxError("not a valid selector");
      return value;
    }
    return matches.call(this, selector);
  });
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("HoverCard", () => {
  it("renders the trigger as a link and keeps the content closed", () => {
    render(<Example />);
    expect(screen.getByRole("link", { name: "Jane" })).toHaveAttribute("href", "/jane");
    expect(screen.queryByText("Card content")).not.toBeInTheDocument();
  });

  it("opens when the pointer enters the trigger and closes when it leaves", async () => {
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole("link", { name: "Jane" });

    await user.hover(trigger);
    expect(await screen.findByText("Card content")).toBeInTheDocument();
    expect(trigger).toHaveAttribute("data-state", "open");

    await user.unhover(trigger);
    await waitFor(() => expect(screen.queryByText("Card content")).not.toBeInTheDocument());
  });

  it("waits 300ms to open and 300ms to close by default", () => {
    vi.useFakeTimers();
    render(
      <HoverCard>
        <HoverCard.Trigger href="/jane">Jane</HoverCard.Trigger>
        <HoverCard.Content>Card content</HoverCard.Content>
      </HoverCard>,
    );
    const trigger = screen.getByRole("link", { name: "Jane" });

    fireEvent.pointerEnter(trigger, { pointerType: "mouse" });
    act(() => void vi.advanceTimersByTime(299));
    expect(screen.queryByText("Card content")).not.toBeInTheDocument();
    act(() => void vi.advanceTimersByTime(1));
    expect(screen.getByText("Card content")).toBeInTheDocument();

    fireEvent.pointerLeave(trigger, { pointerType: "mouse" });
    act(() => void vi.advanceTimersByTime(299));
    expect(screen.getByText("Card content")).toBeInTheDocument();
    act(() => void vi.advanceTimersByTime(1));
    expect(screen.queryByText("Card content")).not.toBeInTheDocument();
  });

  it("honours custom openDelay and closeDelay", () => {
    vi.useFakeTimers();
    render(
      <HoverCard openDelay={100} closeDelay={50}>
        <HoverCard.Trigger href="/jane">Jane</HoverCard.Trigger>
        <HoverCard.Content>Card content</HoverCard.Content>
      </HoverCard>,
    );
    const trigger = screen.getByRole("link", { name: "Jane" });

    fireEvent.pointerEnter(trigger, { pointerType: "mouse" });
    act(() => void vi.advanceTimersByTime(99));
    expect(screen.queryByText("Card content")).not.toBeInTheDocument();
    act(() => void vi.advanceTimersByTime(1));
    expect(screen.getByText("Card content")).toBeInTheDocument();

    fireEvent.pointerLeave(trigger, { pointerType: "mouse" });
    act(() => void vi.advanceTimersByTime(50));
    expect(screen.queryByText("Card content")).not.toBeInTheDocument();
  });

  it("does not open while the pointer has already left before openDelay elapses", () => {
    vi.useFakeTimers();
    render(
      <HoverCard>
        <HoverCard.Trigger href="/jane">Jane</HoverCard.Trigger>
        <HoverCard.Content>Card content</HoverCard.Content>
      </HoverCard>,
    );
    const trigger = screen.getByRole("link", { name: "Jane" });
    fireEvent.pointerEnter(trigger, { pointerType: "mouse" });
    act(() => void vi.advanceTimersByTime(150));
    fireEvent.pointerLeave(trigger, { pointerType: "mouse" });
    act(() => void vi.advanceTimersByTime(2000));
    expect(screen.queryByText("Card content")).not.toBeInTheDocument();
  });

  it("opens on keyboard focus and closes on blur", async () => {
    stubFocusVisible(true);
    const user = userEvent.setup();
    render(
      <>
        <Example />
        <button type="button">After</button>
      </>,
    );
    await user.tab();
    expect(screen.getByRole("link", { name: "Jane" })).toHaveFocus();
    expect(await screen.findByText("Card content")).toBeInTheDocument();

    await user.tab();
    await waitFor(() => expect(screen.queryByText("Card content")).not.toBeInTheDocument());
  });

  it("does not open on a focus that is not keyboard focus (a click or a tap leaves one), but still on hover", async () => {
    stubFocusVisible(false);
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole("link", { name: "Jane" });
    act(() => trigger.focus());
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(trigger).toHaveFocus();
    expect(screen.queryByText("Card content")).not.toBeInTheDocument();

    await user.hover(trigger);
    expect(await screen.findByText("Card content")).toBeInTheDocument();
  });

  it("falls back to opening on any focus in a browser that doesn't know :focus-visible", async () => {
    stubFocusVisible("throws");
    render(<Example />);
    act(() => screen.getByRole("link", { name: "Jane" }).focus());
    expect(await screen.findByText("Card content")).toBeInTheDocument();
  });

  it("still calls a caller's own onFocus", () => {
    stubFocusVisible(false);
    const onFocus = vi.fn();
    render(
      <HoverCard>
        <HoverCard.Trigger href="/jane" onFocus={onFocus}>
          Jane
        </HoverCard.Trigger>
        <HoverCard.Content>Card content</HoverCard.Content>
      </HoverCard>,
    );
    act(() => screen.getByRole("link", { name: "Jane" }).focus());
    expect(onFocus).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(<Example defaultOpen />);
    expect(screen.getByText("Card content")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Card content")).not.toBeInTheDocument());
  });

  it("stays open while the pointer moves from the trigger onto the card", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <HoverCard openDelay={0} closeDelay={200}>
        <HoverCard.Trigger href="/jane">Jane</HoverCard.Trigger>
        <HoverCard.Content>Card content</HoverCard.Content>
      </HoverCard>,
    );
    await user.hover(screen.getByRole("link", { name: "Jane" }));
    const card = await screen.findByText("Card content");

    await user.unhover(screen.getByRole("link", { name: "Jane" }));
    await user.hover(card);
    act(() => void vi.advanceTimersByTime(1000));
    expect(screen.getByText("Card content")).toBeInTheDocument();

    await user.unhover(card);
    act(() => void vi.advanceTimersByTime(250));
    await waitFor(() => expect(screen.queryByText("Card content")).not.toBeInTheDocument());
  });

  it("does not open for a touch pointer", () => {
    vi.useFakeTimers();
    render(
      <HoverCard>
        <HoverCard.Trigger href="/jane">Jane</HoverCard.Trigger>
        <HoverCard.Content>Card content</HoverCard.Content>
      </HoverCard>,
    );
    fireEvent.pointerEnter(screen.getByRole("link", { name: "Jane" }), { pointerType: "touch" });
    act(() => void vi.advanceTimersByTime(5000));
    expect(screen.queryByText("Card content")).not.toBeInTheDocument();
  });

  it("never calls preventDefault on touchstart, which React's passive listener only logs a warning for", () => {
    const preventDefault = vi.spyOn(Event.prototype, "preventDefault");
    const onTouchStart = vi.fn();
    render(
      <HoverCard>
        <HoverCard.Trigger href="/jane" onTouchStart={onTouchStart}>
          Jane
        </HoverCard.Trigger>
        <HoverCard.Content>Card content</HoverCard.Content>
      </HoverCard>,
    );
    fireEvent.touchStart(screen.getByRole("link", { name: "Jane" }));
    expect(onTouchStart).toHaveBeenCalledTimes(1);
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it("starts open with defaultOpen", () => {
    render(<Example defaultOpen />);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("supports fully controlled open state", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Example open={open} onOpenChange={setOpen} />
          <output data-testid="state">{String(open)}</output>
        </>
      );
    }
    render(<Controlled />);
    await user.hover(screen.getByRole("link", { name: "Jane" }));
    expect(await screen.findByText("Card content")).toBeInTheDocument();
    expect(screen.getByTestId("state")).toHaveTextContent("true");
  });

  it("stays closed when controlled open is false, however the pointer moves", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Example open={false} onOpenChange={onOpenChange} />);
    await user.hover(screen.getByRole("link", { name: "Jane" }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(true));
    expect(screen.queryByText("Card content")).not.toBeInTheDocument();
  });

  it("calls onOpenChange with the new state", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Example onOpenChange={onOpenChange} />);
    const trigger = screen.getByRole("link", { name: "Jane" });

    await user.hover(trigger);
    await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(true));
    await user.unhover(trigger);
    await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(false));
  });

  it("takes every focusable element inside the card out of the tab order", () => {
    render(
      <HoverCard defaultOpen>
        <HoverCard.Trigger href="/jane">Jane</HoverCard.Trigger>
        <HoverCard.Content>
          <a href="/profile">Profile</a>
          <button type="button">Follow</button>
        </HoverCard.Content>
      </HoverCard>,
    );
    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("button", { name: "Follow" })).toHaveAttribute("tabindex", "-1");
  });

  it("renders the Link atom as the trigger with asChild", async () => {
    const user = userEvent.setup();
    render(
      <HoverCard {...instant}>
        <HoverCard.Trigger asChild>
          <Link href="/jane">Jane</Link>
        </HoverCard.Trigger>
        <HoverCard.Content>Card content</HoverCard.Content>
      </HoverCard>,
    );
    const trigger = screen.getByRole("link", { name: "Jane" });
    expect(trigger.tagName).toBe("A");
    await user.hover(trigger);
    expect(await screen.findByText("Card content")).toBeInTheDocument();
    expect(trigger).toHaveAttribute("data-state", "open");
  });

  it("does not block a click on the trigger link", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
    render(
      <HoverCard {...instant}>
        <HoverCard.Trigger href="/jane" onClick={onClick}>
          Jane
        </HoverCard.Trigger>
        <HoverCard.Content>Card content</HoverCard.Content>
      </HoverCard>,
    );
    await user.click(screen.getByRole("link", { name: "Jane" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  describe("positioning", () => {
    it("defaults to side top and align center", () => {
      render(<Example defaultOpen />);
      expect(screen.getByText("Card content")).toHaveAttribute("data-side", "top");
      expect(screen.getByText("Card content")).toHaveAttribute("data-align", "center");
    });

    it("applies side and align", () => {
      render(
        <HoverCard defaultOpen>
          <HoverCard.Trigger href="/jane">Jane</HoverCard.Trigger>
          <HoverCard.Content side="right" align="end">
            Card content
          </HoverCard.Content>
        </HoverCard>,
      );
      expect(screen.getByText("Card content")).toHaveAttribute("data-side", "right");
      expect(screen.getByText("Card content")).toHaveAttribute("data-align", "end");
    });

    it("resolves a responsive side to its base entry when no query matches", () => {
      render(
        <HoverCard defaultOpen>
          <HoverCard.Trigger href="/jane">Jane</HoverCard.Trigger>
          <HoverCard.Content side={{ base: "top", lg: "right" }}>Card content</HoverCard.Content>
        </HoverCard>,
      );
      expect(screen.getByText("Card content")).toHaveAttribute("data-side", "top");
    });

    it("updates the side live when a matchMedia change fires", async () => {
      const listeners: Record<string, Array<() => void>> = {};
      const matches: Record<string, boolean> = { "(min-width: 1024px)": true };
      vi.stubGlobal(
        "matchMedia",
        vi.fn().mockImplementation((query: string) => ({
          get matches() {
            return matches[query] ?? false;
          },
          media: query,
          addEventListener: (_event: string, cb: () => void) => {
            (listeners[query] ??= []).push(cb);
          },
          removeEventListener: vi.fn(),
        })),
      );
      render(
        <HoverCard defaultOpen>
          <HoverCard.Trigger href="/jane">Jane</HoverCard.Trigger>
          <HoverCard.Content side={{ base: "bottom", lg: "right" }}>Card content</HoverCard.Content>
        </HoverCard>,
      );
      await waitFor(() => expect(screen.getByText("Card content")).toHaveAttribute("data-side", "right"));
      matches["(min-width: 1024px)"] = false;
      act(() => listeners["(min-width: 1024px)"]?.forEach((cb) => cb()));
      await waitFor(() => expect(screen.getByText("Card content")).toHaveAttribute("data-side", "bottom"));
    });

    it("renders an arrow by default and omits it with hideArrow", () => {
      const { rerender } = render(<Example defaultOpen />);
      expect(document.body.querySelector("svg")).toBeInTheDocument();
      rerender(
        <HoverCard defaultOpen>
          <HoverCard.Trigger href="/jane">Jane</HoverCard.Trigger>
          <HoverCard.Content hideArrow>Card content</HoverCard.Content>
        </HoverCard>,
      );
      expect(document.body.querySelector("svg")).not.toBeInTheDocument();
    });

    it("renders into a custom container", () => {
      const container = document.createElement("div");
      document.body.appendChild(container);
      render(
        <HoverCard defaultOpen>
          <HoverCard.Trigger href="/jane">Jane</HoverCard.Trigger>
          <HoverCard.Content container={container}>Card content</HoverCard.Content>
        </HoverCard>,
      );
      expect(container).toContainElement(screen.getByText("Card content"));
      container.remove();
    });
  });

  describe("the trigger's keyboard reachability warning", () => {
    it("warns for an <a> with no href or tabIndex", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(
        <HoverCard>
          <HoverCard.Trigger>No destination</HoverCard.Trigger>
          <HoverCard.Content>Card content</HoverCard.Content>
        </HoverCard>,
      );
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("HoverCard.Trigger: an <a> with no `href`"));
    });

    it("stays quiet with an href, a tabIndex, or asChild", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(
        <>
          <HoverCard>
            <HoverCard.Trigger href="/a">A</HoverCard.Trigger>
            <HoverCard.Content>x</HoverCard.Content>
          </HoverCard>
          <HoverCard>
            <HoverCard.Trigger tabIndex={0}>B</HoverCard.Trigger>
            <HoverCard.Content>x</HoverCard.Content>
          </HoverCard>
          <HoverCard>
            <HoverCard.Trigger asChild>
              <button type="button">C</button>
            </HoverCard.Trigger>
            <HoverCard.Content>x</HoverCard.Content>
          </HoverCard>
        </>,
      );
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe("standard props", () => {
    it("forwards refs to the trigger and the content", () => {
      const triggerRef = createRef<HTMLAnchorElement>();
      const contentRef = createRef<HTMLDivElement>();
      render(
        <HoverCard defaultOpen>
          <HoverCard.Trigger ref={triggerRef} href="/jane">
            Jane
          </HoverCard.Trigger>
          <HoverCard.Content ref={contentRef}>Card content</HoverCard.Content>
        </HoverCard>,
      );
      expect(triggerRef.current).toBeInstanceOf(HTMLAnchorElement);
      expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
    });

    it("passes className, style, id and data-testid to the trigger and the content", () => {
      render(
        <HoverCard defaultOpen>
          <HoverCard.Trigger href="/jane" className="t" style={{ color: "red" }} id="t-id" data-testid="trigger">
            Jane
          </HoverCard.Trigger>
          <HoverCard.Content className="c" style={{ margin: "1px" }} id="c-id" data-testid="content">
            Card content
          </HoverCard.Content>
        </HoverCard>,
      );
      const trigger = screen.getByTestId("trigger");
      expect(trigger).toHaveClass("t");
      expect(trigger).toHaveStyle({ color: "rgb(255, 0, 0)" });
      expect(trigger).toHaveAttribute("id", "t-id");
      const content = screen.getByTestId("content");
      expect(content).toHaveClass("c");
      expect(content).toHaveStyle({ margin: "1px" });
      expect(content).toHaveAttribute("id", "c-id");
    });

    it("passes native attributes straight through to the trigger and the content", () => {
      render(
        <HoverCard defaultOpen>
          <HoverCard.Trigger href="/jane" target="_blank" rel="noreferrer" download>
            Jane
          </HoverCard.Trigger>
          <HoverCard.Content lang="fr" data-testid="content">
            Card content
          </HoverCard.Content>
        </HoverCard>,
      );
      const trigger = screen.getByRole("link", { name: "Jane" });
      expect(trigger).toHaveAttribute("target", "_blank");
      expect(trigger).toHaveAttribute("rel", "noreferrer");
      expect(trigger).toHaveAttribute("download");
      expect(screen.getByTestId("content")).toHaveAttribute("lang", "fr");
    });

    it("keeps an asChild trigger's own className instead of the built-in styles", () => {
      render(
        <HoverCard>
          <HoverCard.Trigger asChild className="mine">
            <a href="/jane">Jane</a>
          </HoverCard.Trigger>
          <HoverCard.Content>x</HoverCard.Content>
        </HoverCard>,
      );
      expect(screen.getByRole("link", { name: "Jane" }).className).toBe("mine");
    });

    it("calls onEscapeKeyDown and lets preventDefault keep the card open", async () => {
      const user = userEvent.setup();
      const onEscapeKeyDown = vi.fn((event: KeyboardEvent) => event.preventDefault());
      render(
        <HoverCard defaultOpen>
          <HoverCard.Trigger href="/jane">Jane</HoverCard.Trigger>
          <HoverCard.Content onEscapeKeyDown={onEscapeKeyDown}>Card content</HoverCard.Content>
        </HoverCard>,
      );
      await user.keyboard("{Escape}");
      expect(onEscapeKeyDown).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Card content")).toBeInTheDocument();
    });
  });

  describe("robustness", () => {
    it("opens and closes inside StrictMode", async () => {
      const user = userEvent.setup();
      render(
        <StrictMode>
          <Example />
        </StrictMode>,
      );
      const trigger = screen.getByRole("link", { name: "Jane" });
      await user.hover(trigger);
      expect(await screen.findByText("Card content")).toBeInTheDocument();
      await user.unhover(trigger);
      await waitFor(() => expect(screen.queryByText("Card content")).not.toBeInTheDocument());
    });

    it("warns once per trigger, not twice, inside StrictMode", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(
        <StrictMode>
          <HoverCard>
            <HoverCard.Trigger>x</HoverCard.Trigger>
            <HoverCard.Content>x</HoverCard.Content>
          </HoverCard>
        </StrictMode>,
      );
      // StrictMode runs the effect twice in development; the message must
      // still be about one trigger.
      expect(warn.mock.calls.every(([message]) => String(message).includes("HoverCard.Trigger"))).toBe(true);
    });

    it("clears its timers on unmount, so a pending open never fires afterwards", () => {
      vi.useFakeTimers();
      const onOpenChange = vi.fn();
      const { unmount } = render(
        <HoverCard onOpenChange={onOpenChange}>
          <HoverCard.Trigger href="/jane">Jane</HoverCard.Trigger>
          <HoverCard.Content>Card content</HoverCard.Content>
        </HoverCard>,
      );
      fireEvent.pointerEnter(screen.getByRole("link", { name: "Jane" }), { pointerType: "mouse" });
      unmount();
      act(() => void vi.advanceTimersByTime(5000));
      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });

  describe("accessibility", () => {
    it("has no axe violations closed", async () => {
      const { container } = render(<Example />);
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no axe violations open", async () => {
      render(<Example defaultOpen />);
      expect(await scanBody()).toHaveNoViolations();
    });

    it("has no axe violations with the Link atom as the trigger", async () => {
      render(
        <HoverCard defaultOpen>
          <HoverCard.Trigger asChild>
            <Link href="/jane">Jane</Link>
          </HoverCard.Trigger>
          <HoverCard.Content>Card content</HoverCard.Content>
        </HoverCard>,
      );
      expect(await scanBody()).toHaveNoViolations();
    });
  });
});

describe("HoverCard disabled", () => {
  it("never opens, however long the pointer rests on the trigger", () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    render(
      <HoverCard disabled onOpenChange={onOpenChange}>
        <HoverCard.Trigger href="/jane">Jane</HoverCard.Trigger>
        <HoverCard.Content>Card content</HoverCard.Content>
      </HoverCard>,
    );
    fireEvent.pointerEnter(screen.getByRole("link", { name: "Jane" }), { pointerType: "mouse" });
    act(() => void vi.advanceTimersByTime(5000));
    expect(screen.queryByText("Card content")).not.toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(true);
  });

  it("does not open on keyboard focus either, and the trigger is still a working link", async () => {
    const user = userEvent.setup();
    render(<Example disabled />);
    await user.tab();
    const trigger = screen.getByRole("link", { name: "Jane" });
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("href", "/jane");
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(screen.queryByText("Card content")).not.toBeInTheDocument();
  });

  it("closes a card that is open when it becomes disabled, and opens it again when enabled", () => {
    const { rerender } = render(<Example defaultOpen />);
    expect(screen.getByText("Card content")).toBeInTheDocument();
    rerender(<Example defaultOpen disabled />);
    expect(screen.queryByText("Card content")).not.toBeInTheDocument();
    rerender(<Example defaultOpen />);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("stays shut when controlled open is true but the card is disabled", () => {
    render(<Example open disabled />);
    expect(screen.queryByText("Card content")).not.toBeInTheDocument();
  });
});

describe("HoverCard size and media", () => {
  it("defaults to the md padding step and takes any of the five", () => {
    const { rerender } = render(<Example defaultOpen />);
    expect(screen.getByText("Card content")).toHaveClass(styles.md as string);
    for (const size of ["xs", "sm", "md", "lg", "xl"] as const) {
      rerender(
        <HoverCard defaultOpen>
          <HoverCard.Trigger href="/jane">Jane</HoverCard.Trigger>
          <HoverCard.Content size={size}>Card content</HoverCard.Content>
        </HoverCard>,
      );
      expect(screen.getByText("Card content")).toHaveClass(styles[size] as string);
    }
  });

  it("sets the bridge's length from sideOffset, and lets a caller's style add to it", () => {
    render(
      <HoverCard defaultOpen>
        <HoverCard.Trigger href="/jane">Jane</HoverCard.Trigger>
        <HoverCard.Content sideOffset={20} style={{ margin: "1px" }}>
          Card content
        </HoverCard.Content>
      </HoverCard>,
    );
    const card = screen.getByText("Card content");
    // The offset plus the arrow Radix adds to it.
    expect(card.style.getPropertyValue("--hover-card-side-offset")).toBe("25px");
    expect(card).toHaveStyle({ margin: "1px" });
  });

  it("bridges only the offset when there is no arrow", () => {
    render(
      <HoverCard defaultOpen>
        <HoverCard.Trigger href="/jane">Jane</HoverCard.Trigger>
        <HoverCard.Content sideOffset={20} hideArrow>
          Card content
        </HoverCard.Content>
      </HoverCard>,
    );
    expect(screen.getByText("Card content").style.getPropertyValue("--hover-card-side-offset")).toBe("20px");
  });

  it("renders Media as a div that forwards its ref and props", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <HoverCard defaultOpen>
        <HoverCard.Trigger href="/jane">Jane</HoverCard.Trigger>
        <HoverCard.Content>
          <HoverCard.Media ref={ref} className="m" id="media" data-testid="media" style={{ color: "red" }}>
            <img src="/x.png" alt="Jane" />
          </HoverCard.Media>
          Card content
        </HoverCard.Content>
      </HoverCard>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toHaveClass("m", styles.media as string);
    expect(screen.getByTestId("media")).toHaveAttribute("id", "media");
    expect(screen.getByTestId("media")).toContainElement(screen.getByRole("img", { name: "Jane" }));
  });
});

describe("HoverCardProvider", () => {
  const hover = (name: string) => fireEvent.pointerEnter(screen.getByRole("link", { name }), { pointerType: "mouse" });
  const leave = (name: string) => fireEvent.pointerLeave(screen.getByRole("link", { name }), { pointerType: "mouse" });
  const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

  function Pair(props: { provider?: React.ComponentProps<typeof HoverCardProvider>; bOpenDelay?: number }) {
    return (
      <HoverCardProvider {...props.provider}>
        <HoverCard>
          <HoverCard.Trigger href="/a">A</HoverCard.Trigger>
          <HoverCard.Content>Card A</HoverCard.Content>
        </HoverCard>
        <HoverCard openDelay={props.bOpenDelay}>
          <HoverCard.Trigger href="/b">B</HoverCard.Trigger>
          <HoverCard.Content>Card B</HoverCard.Content>
        </HoverCard>
      </HoverCardProvider>
    );
  }

  it("supplies the default openDelay and closeDelay, and a card's own props win", () => {
    vi.useFakeTimers();
    render(<Pair provider={{ openDelay: 500, closeDelay: 40 }} bOpenDelay={100} />);
    hover("A");
    advance(499);
    expect(screen.queryByText("Card A")).not.toBeInTheDocument();
    advance(1);
    expect(screen.getByText("Card A")).toBeInTheDocument();
    leave("A");
    advance(39);
    expect(screen.getByText("Card A")).toBeInTheDocument();
    advance(1);
    expect(screen.queryByText("Card A")).not.toBeInTheDocument();
    // B sets its own, but the provider is still warm just after A closed, so it is not the delay under test here.
    advance(1000);
    hover("B");
    advance(99);
    expect(screen.queryByText("Card B")).not.toBeInTheDocument();
    advance(1);
    expect(screen.getByText("Card B")).toBeInTheDocument();
  });

  it("opens the next card at once while another is open, and closes the first", () => {
    vi.useFakeTimers();
    render(<Pair />);
    hover("A");
    advance(300);
    expect(screen.getByText("Card A")).toBeInTheDocument();

    leave("A");
    hover("B");
    advance(0);
    expect(screen.getByText("Card B")).toBeInTheDocument();
    // Never two on screen at once.
    expect(screen.queryByText("Card A")).not.toBeInTheDocument();
  });

  it("opens the next card at once within skipDelayDuration of the last closing, and waits after it", () => {
    vi.useFakeTimers();
    render(<Pair provider={{ skipDelayDuration: 500 }} />);
    hover("A");
    advance(300);
    leave("A");
    advance(300);
    expect(screen.queryByText("Card A")).not.toBeInTheDocument();

    // 200ms after A closed: inside the 500ms window.
    advance(200);
    hover("B");
    advance(0);
    expect(screen.getByText("Card B")).toBeInTheDocument();
    leave("B");
    advance(300);
    expect(screen.queryByText("Card B")).not.toBeInTheDocument();

    // Past the window: the full delay again.
    advance(600);
    hover("A");
    advance(299);
    expect(screen.queryByText("Card A")).not.toBeInTheDocument();
    advance(1);
    expect(screen.getByText("Card A")).toBeInTheDocument();
  });

  it("waits on every card when skipDelayDuration is 0", () => {
    vi.useFakeTimers();
    render(<Pair provider={{ skipDelayDuration: 0 }} />);
    hover("A");
    advance(300);
    leave("A");
    advance(300);
    expect(screen.queryByText("Card A")).not.toBeInTheDocument();
    advance(1);
    hover("B");
    advance(299);
    expect(screen.queryByText("Card B")).not.toBeInTheDocument();
    advance(1);
    expect(screen.getByText("Card B")).toBeInTheDocument();
  });

  it("calls the first card's onOpenChange(false) when the next one takes over", () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    render(
      <HoverCardProvider>
        <HoverCard onOpenChange={onOpenChange}>
          <HoverCard.Trigger href="/a">A</HoverCard.Trigger>
          <HoverCard.Content>Card A</HoverCard.Content>
        </HoverCard>
        <HoverCard>
          <HoverCard.Trigger href="/b">B</HoverCard.Trigger>
          <HoverCard.Content>Card B</HoverCard.Content>
        </HoverCard>
      </HoverCardProvider>,
    );
    hover("A");
    advance(300);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    leave("A");
    hover("B");
    advance(0);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    // And the first card's own pending close does not report a second time.
    advance(1000);
    expect(onOpenChange.mock.calls.filter(([value]) => value === false)).toHaveLength(1);
  });

  it("closes a controlled card by asking its owner, not by closing it itself", () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    render(
      <HoverCardProvider>
        <HoverCard open onOpenChange={onOpenChange}>
          <HoverCard.Trigger href="/a">A</HoverCard.Trigger>
          <HoverCard.Content>Card A</HoverCard.Content>
        </HoverCard>
        <HoverCard>
          <HoverCard.Trigger href="/b">B</HoverCard.Trigger>
          <HoverCard.Content>Card B</HoverCard.Content>
        </HoverCard>
      </HoverCardProvider>,
    );
    hover("B");
    advance(0);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    // The owner didn't act on it, so A is still open: controlled state is theirs.
    expect(screen.getByText("Card A")).toBeInTheDocument();
  });

  it("does not warm the provider for a disabled card", () => {
    vi.useFakeTimers();
    render(
      <HoverCardProvider>
        <HoverCard disabled>
          <HoverCard.Trigger href="/a">A</HoverCard.Trigger>
          <HoverCard.Content>Card A</HoverCard.Content>
        </HoverCard>
        <HoverCard>
          <HoverCard.Trigger href="/b">B</HoverCard.Trigger>
          <HoverCard.Content>Card B</HoverCard.Content>
        </HoverCard>
      </HoverCardProvider>,
    );
    hover("A");
    advance(1000);
    hover("B");
    advance(299);
    expect(screen.queryByText("Card B")).not.toBeInTheDocument();
    advance(1);
    expect(screen.getByText("Card B")).toBeInTheDocument();
  });

  it("survives StrictMode, and clears its timer on unmount", () => {
    vi.useFakeTimers();
    const { unmount } = render(
      <StrictMode>
        <Pair />
      </StrictMode>,
    );
    hover("A");
    advance(300);
    leave("A");
    advance(300);
    unmount();
    expect(() => advance(1000)).not.toThrow();
  });
});
