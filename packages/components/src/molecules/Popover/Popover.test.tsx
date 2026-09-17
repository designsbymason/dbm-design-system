import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Popover } from "./Popover";
import styles from "./Popover.module.css";

describe("Popover", () => {
  it("renders the trigger and keeps content closed by default", () => {
    render(
      <Popover>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>Content</Popover.Content>
      </Popover>,
    );
    expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("opens the content when the trigger is clicked, and closes it on a second click", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>Content</Popover.Content>
      </Popover>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });

    await user.click(trigger);
    expect(await screen.findByText("Content")).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.click(trigger);
    await waitFor(() => expect(screen.queryByText("Content")).not.toBeInTheDocument());
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("starts open when defaultOpen is set", () => {
    render(
      <Popover defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>Content</Popover.Content>
      </Popover>,
    );
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("supports fully controlled open state", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <Popover open={open} onOpenChange={setOpen}>
          <Popover.Trigger>Open</Popover.Trigger>
          <Popover.Content>Content</Popover.Content>
        </Popover>
      );
    }
    render(<Controlled />);
    expect(screen.queryByText("Content")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(await screen.findByText("Content")).toBeInTheDocument();
  });

  it("calls onOpenChange with the new state on open and close", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Popover onOpenChange={onOpenChange}>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>Content</Popover.Content>
      </Popover>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });

    await user.click(trigger);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);

    await user.keyboard("{Escape}");
    await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(false));
  });

  it("dismisses on an outside click, non-modal", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Popover>
          <Popover.Trigger>Open</Popover.Trigger>
          <Popover.Content>Content</Popover.Content>
        </Popover>
        <button type="button">Outside</button>
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(await screen.findByText("Content")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Outside" }));
    await waitFor(() => expect(screen.queryByText("Content")).not.toBeInTheDocument());
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(
      <Popover defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>Content</Popover.Content>
      </Popover>,
    );
    expect(screen.getByText("Content")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Content")).not.toBeInTheDocument());
  });

  it("does not open when the trigger is disabled", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <Popover.Trigger asChild>
          <button type="button" disabled>
            Open
          </button>
        </Popover.Trigger>
        <Popover.Content>Content</Popover.Content>
      </Popover>,
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("applies side and align to the content element", () => {
    render(
      <Popover defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content side="right" align="end">
          Content
        </Popover.Content>
      </Popover>,
    );
    expect(screen.getByText("Content")).toHaveAttribute("data-side", "right");
    expect(screen.getByText("Content")).toHaveAttribute("data-align", "end");
  });

  it("defaults to side bottom and align center", () => {
    render(
      <Popover defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>Content</Popover.Content>
      </Popover>,
    );
    expect(screen.getByText("Content")).toHaveAttribute("data-side", "bottom");
    expect(screen.getByText("Content")).toHaveAttribute("data-align", "center");
  });

  it("resolves side from a responsive map via matchMedia, defaulting to base", () => {
    render(
      <Popover defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content side={{ base: "bottom", lg: "right" }}>Content</Popover.Content>
      </Popover>,
    );
    // jsdom's default matchMedia (see src/test/setup.ts) reports no query as
    // matching, so this resolves to the `base` entry.
    expect(screen.getByText("Content")).toHaveAttribute("data-side", "bottom");
  });

  it("updates the popover's side live when a matchMedia change listener fires", async () => {
    const listeners: Record<string, Array<() => void>> = {};
    const currentMatches: Record<string, boolean> = {
      "(min-width: 1024px)": true,
    };

    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        get matches() {
          return currentMatches[query] ?? false;
        },
        media: query,
        addEventListener: (_event: string, cb: () => void) => {
          (listeners[query] ??= []).push(cb);
        },
        removeEventListener: vi.fn(),
      })),
    );

    render(
      <Popover defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content side={{ base: "bottom", lg: "right" }}>Content</Popover.Content>
      </Popover>,
    );
    await waitFor(() =>
      expect(screen.getByText("Content")).toHaveAttribute("data-side", "right"),
    );

    // Simulate the viewport dropping back below the lg breakpoint.
    currentMatches["(min-width: 1024px)"] = false;
    listeners["(min-width: 1024px)"]?.forEach((cb) => cb());

    await waitFor(() =>
      expect(screen.getByText("Content")).toHaveAttribute("data-side", "bottom"),
    );
  });

  it("renders an arrow by default, and omits it when hideArrow is set", () => {
    // Content renders in a Radix `Portal` appended to `document.body`, not
    // inside RTL's own render `container` — same reasoning as Slider's/
    // Tooltip's own portal-aware tests elsewhere in this package.
    const { rerender } = render(
      <Popover defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>Content</Popover.Content>
      </Popover>,
    );
    expect(document.body.querySelector("svg")).toBeInTheDocument();

    rerender(
      <Popover defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content hideArrow>Content</Popover.Content>
      </Popover>,
    );
    expect(document.body.querySelector("svg")).not.toBeInTheDocument();
  });

  it("does not render a close button by default", () => {
    render(
      <Popover defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>Content</Popover.Content>
      </Popover>,
    );
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("reserves extra inline-end padding when showCloseButton is set, so content doesn't run under the close icon (found in user-reported overlap regression)", () => {
    const { rerender } = render(
      <Popover defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>Content</Popover.Content>
      </Popover>,
    );
    expect(screen.getByText("Content")).not.toHaveClass(
      styles.contentWithCloseButton as string,
    );

    rerender(
      <Popover defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content showCloseButton>Content</Popover.Content>
      </Popover>,
    );
    expect(screen.getByText("Content")).toHaveClass(
      styles.contentWithCloseButton as string,
    );
  });

  it("shows a close button when showCloseButton is set, and it closes the popover on click", async () => {
    const user = userEvent.setup();
    render(
      <Popover defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content showCloseButton>Content</Popover.Content>
      </Popover>,
    );
    const closeButton = screen.getByRole("button", { name: "Close" });
    expect(closeButton).toBeInTheDocument();

    await user.click(closeButton);
    await waitFor(() => expect(screen.queryByText("Content")).not.toBeInTheDocument());
  });

  it("forwards ref to the close element", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Popover defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>
          Content
          <Popover.Close ref={ref}>Done</Popover.Close>
        </Popover.Content>
      </Popover>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("closes when Popover.Close is clicked, wherever it's placed", async () => {
    const user = userEvent.setup();
    render(
      <Popover defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>
          Content
          <Popover.Close>Done</Popover.Close>
        </Popover.Content>
      </Popover>,
    );
    await user.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() => expect(screen.queryByText("Content")).not.toBeInTheDocument());
  });

  it("stays open while genuinely modal (outside pointer interaction blocked), and Escape still closes it", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Popover modal defaultOpen>
          <Popover.Trigger>Open</Popover.Trigger>
          <Popover.Content>Content</Popover.Content>
        </Popover>
        <button type="button">Outside</button>
      </div>,
    );
    expect(screen.getByText("Content")).toBeInTheDocument();

    // `modal` marks the rest of the page `aria-hidden` (needing `hidden:
    // true` to even query it here, since `getByRole` excludes aria-hidden
    // content by default) *and* sets `pointer-events: none` on it — real
    // enough that `userEvent.click` itself refuses to perform the click at
    // all, the same sanity check a real browser's own hit-testing would
    // apply. That refusal (not a completed-but-ineffective click) is this
    // test's own actual proof that outside pointer interaction is blocked.
    const outsideButton = screen.getByRole("button", { name: "Outside", hidden: true });
    await expect(user.click(outsideButton)).rejects.toThrow(/pointer-events: none/);
    expect(screen.getByText("Content")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Content")).not.toBeInTheDocument());
  });

  it("onEscapeKeyDown can prevent the default Escape dismissal", async () => {
    const user = userEvent.setup();
    const onEscapeKeyDown = vi.fn((event: KeyboardEvent) => event.preventDefault());
    render(
      <Popover defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content onEscapeKeyDown={onEscapeKeyDown}>Content</Popover.Content>
      </Popover>,
    );

    await user.keyboard("{Escape}");
    expect(onEscapeKeyDown).toHaveBeenCalled();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("onPointerDownOutside can prevent the default outside-click dismissal", async () => {
    const user = userEvent.setup();
    const onPointerDownOutside = vi.fn((event: Event) => event.preventDefault());
    render(
      <div>
        <Popover defaultOpen>
          <Popover.Trigger>Open</Popover.Trigger>
          <Popover.Content onPointerDownOutside={onPointerDownOutside}>Content</Popover.Content>
        </Popover>
        <button type="button">Outside</button>
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(onPointerDownOutside).toHaveBeenCalled();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("passes id, className, style, and data-testid through to the content element", () => {
    render(
      <Popover defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content
          id="my-popover"
          className="extra"
          style={{ color: "red" }}
          data-testid="popover-content"
        >
          Content
        </Popover.Content>
      </Popover>,
    );
    const content = screen.getByTestId("popover-content");
    expect(content).toHaveAttribute("id", "my-popover");
    expect(content).toHaveClass("extra");
    expect(content).toHaveStyle({ color: "rgb(255, 0, 0)" });
  });

  it("forwards ref to the content element", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Popover defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content ref={ref}>Content</Popover.Content>
      </Popover>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toHaveTextContent("Content");
  });

  it("forwards ref to the trigger element", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Popover>
        <Popover.Trigger ref={ref}>Open</Popover.Trigger>
        <Popover.Content>Content</Popover.Content>
      </Popover>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("passes id, className, style, and data-testid through to the trigger element", () => {
    render(
      <Popover>
        <Popover.Trigger
          id="my-trigger"
          className="extra"
          style={{ color: "red" }}
          data-testid="popover-trigger"
        >
          Open
        </Popover.Trigger>
        <Popover.Content>Content</Popover.Content>
      </Popover>,
    );
    const trigger = screen.getByTestId("popover-trigger");
    expect(trigger).toHaveAttribute("id", "my-trigger");
    expect(trigger).toHaveClass("extra");
    expect(trigger).toHaveStyle({ color: "rgb(255, 0, 0)" });
  });

  it("passes id, className, style, and data-testid through to the close element", () => {
    render(
      <Popover defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>
          Content
          <Popover.Close
            id="my-close"
            className="extra"
            style={{ color: "red" }}
            data-testid="popover-close"
          >
            Done
          </Popover.Close>
        </Popover.Content>
      </Popover>,
    );
    const close = screen.getByTestId("popover-close");
    expect(close).toHaveAttribute("id", "my-close");
    expect(close).toHaveClass("extra");
    expect(close).toHaveStyle({ color: "rgb(255, 0, 0)" });
  });

  it("renders asChild on the trigger without introducing an extra wrapper element", () => {
    render(
      <Popover>
        <Popover.Trigger asChild>
          <a href="#open">Open</a>
        </Popover.Trigger>
        <Popover.Content>Content</Popover.Content>
      </Popover>,
    );
    expect(screen.getByRole("link", { name: "Open" })).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("warns in development when the content has no accessible name", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Popover defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>Content</Popover.Content>
      </Popover>,
    );
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("no accessible name"));
    warnSpy.mockRestore();
  });

  it("does not warn when aria-label is provided", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Popover defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content aria-label="Info">Content</Popover.Content>
      </Popover>,
    );
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("does not warn when aria-labelledby is provided", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Popover defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content aria-labelledby="some-heading">Content</Popover.Content>
      </Popover>,
    );
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("has no accessibility violations, default, with a close button, or modal", async () => {
    const { container: defaultContainer } = render(
      <Popover defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content aria-label="Info">Content</Popover.Content>
      </Popover>,
    );
    expect((await axe(defaultContainer)).violations).toHaveLength(0);

    const { container: closeButtonContainer } = render(
      <Popover defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content aria-label="Info" showCloseButton>
          Content
        </Popover.Content>
      </Popover>,
    );
    expect((await axe(closeButtonContainer)).violations).toHaveLength(0);

    const { container: modalContainer } = render(
      <Popover modal defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content aria-label="Info">Content</Popover.Content>
      </Popover>,
    );
    expect((await axe(modalContainer)).violations).toHaveLength(0);
  });
});
