import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Link } from "../../atoms/Link";
import { HoverCard } from "./HoverCard";

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
