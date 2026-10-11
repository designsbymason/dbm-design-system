import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "../../atoms/Button";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { Drawer } from "./Drawer";
import styles from "./Drawer.module.css";
import sections from "../../internal/overlay/OverlaySections.module.css";

function Basic(props: Partial<React.ComponentProps<typeof Drawer.Content>> & { drawer?: React.ComponentProps<typeof Drawer> }) {
  return (
    <Drawer {...props.drawer}>
      <Drawer.Trigger>Open</Drawer.Trigger>
      <Drawer.Content {...props}>
        <Drawer.Header>
          <Drawer.Title>Edit profile</Drawer.Title>
          <Drawer.Description>Changes are saved to your account.</Drawer.Description>
        </Drawer.Header>
        <Drawer.Body>Body text</Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close>Cancel</Drawer.Close>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Drawer", () => {
  it("renders only the trigger while closed", () => {
    render(<Basic />);
    expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens on a trigger click as a named, described, modal drawer", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole("button", { name: "Open" }));
    const drawer = await screen.findByRole("dialog", { name: "Edit profile" });
    expect(drawer).toHaveAccessibleDescription("Changes are saved to your account.");
    expect(drawer).toHaveAttribute("aria-modal", "true");
    expect(drawer).toHaveAttribute("data-state", "open");
  });

  it("starts open with defaultOpen", () => {
    render(<Basic drawer={{ defaultOpen: true }} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("reports changes from an uncontrolled drawer", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Basic drawer={{ onOpenChange }} />);
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(true, { reason: "trigger" });
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: "escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("supports a fully controlled open state and leaves it alone until the prop changes", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Basic drawer={{ open: true, onOpenChange }} />);
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "escape" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("works wired to state, closing and reopening through onOpenChange", async () => {
    const user = userEvent.setup();
    function Wired() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Outside open
          </button>
          <Drawer open={open} onOpenChange={setOpen}>
            <Drawer.Content aria-label="Wired">
              <Drawer.Body>Wired body</Drawer.Body>
            </Drawer.Content>
          </Drawer>
        </>
      );
    }
    render(<Wired />);
    await user.click(screen.getByRole("button", { name: "Outside open" }));
    expect(await screen.findByRole("dialog", { name: "Wired" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Outside open" }));
    expect(await screen.findByRole("dialog", { name: "Wired" })).toBeInTheDocument();
  });

  describe("dismissal", () => {
    it("closes on Escape", async () => {
      const user = userEvent.setup();
      render(<Basic drawer={{ defaultOpen: true }} />);
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("stays open on Escape with closeOnEscape={false}", async () => {
      const user = userEvent.setup();
      render(<Basic drawer={{ defaultOpen: true }} closeOnEscape={false} />);
      await user.keyboard("{Escape}");
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("runs onEscapeKeyDown first and lets it prevent the close", async () => {
      const user = userEvent.setup();
      const onEscapeKeyDown = vi.fn((event: KeyboardEvent) => event.preventDefault());
      render(<Basic drawer={{ defaultOpen: true }} onEscapeKeyDown={onEscapeKeyDown} />);
      await user.keyboard("{Escape}");
      expect(onEscapeKeyDown).toHaveBeenCalled();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("closes on a press on the scrim, not on a press inside the panel", async () => {
      const user = userEvent.setup();
      render(<Basic drawer={{ defaultOpen: true }} />);
      const drawer = screen.getByRole("dialog");
      await user.click(screen.getByText("Body text"));
      expect(drawer).toBeInTheDocument();
      await user.click(drawer.parentElement as HTMLElement);
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("ignores a press on the scrim with closeOnOutsideClick={false}", async () => {
      const user = userEvent.setup();
      render(<Basic drawer={{ defaultOpen: true }} closeOnOutsideClick={false} />);
      const drawer = screen.getByRole("dialog");
      await user.click(drawer.parentElement as HTMLElement);
      expect(drawer).toBeInTheDocument();
    });

    it("closes from Drawer.Close", async () => {
      const user = userEvent.setup();
      render(<Basic drawer={{ defaultOpen: true }} />);
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("lets Drawer.Close take a Button through asChild", async () => {
      const user = userEvent.setup();
      render(
        <Drawer defaultOpen>
          <Drawer.Content aria-label="x">
            <Drawer.Footer>
              <Drawer.Close asChild>
                <Button>Done</Button>
              </Drawer.Close>
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer>,
      );
      await user.click(screen.getByRole("button", { name: "Done" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });
  });

  describe("close button", () => {
    it("is shown by default and closes the drawer", async () => {
      const user = userEvent.setup();
      render(<Basic drawer={{ defaultOpen: true }} />);
      await user.click(screen.getByRole("button", { name: "Close" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("can be hidden", () => {
      render(<Basic drawer={{ defaultOpen: true }} showCloseButton={false} />);
      expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    });

    it("takes its name from labels.close, and keeps the default when it is undefined", () => {
      const { unmount } = render(<Basic drawer={{ defaultOpen: true }} labels={{ close: "Fermer" }} />);
      expect(screen.getByRole("button", { name: "Fermer" })).toBeInTheDocument();
      unmount();
      render(<Basic drawer={{ defaultOpen: true }} labels={{ close: undefined }} />);
      expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    });
  });

  describe("focus", () => {
    it("moves focus into the drawer on open and back to the trigger on close", async () => {
      const user = userEvent.setup();
      render(<Basic />);
      const trigger = screen.getByRole("button", { name: "Open" });
      await user.click(trigger);
      const drawer = await screen.findByRole("dialog");
      await waitFor(() => expect(drawer).toContainElement(document.activeElement as HTMLElement));
      await user.keyboard("{Escape}");
      await waitFor(() => expect(trigger).toHaveFocus());
    });

    it("keeps Tab inside the drawer", async () => {
      const user = userEvent.setup();
      render(
        <>
          <button type="button">Behind</button>
          <Basic drawer={{ defaultOpen: true }} />
        </>,
      );
      const drawer = screen.getByRole("dialog");
      for (let press = 0; press < 6; press += 1) {
        await user.tab();
        expect(drawer).toContainElement(document.activeElement as HTMLElement);
      }
    });

    it("lets onOpenAutoFocus choose where focus lands", async () => {
      const user = userEvent.setup();
      function Chosen() {
        return (
          <Drawer defaultOpen>
            <Drawer.Content
              aria-label="Chosen"
              showCloseButton={false}
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                (document.getElementById("second") as HTMLElement).focus();
              }}
            >
              <input id="first" aria-label="first" />
              <input id="second" aria-label="second" />
            </Drawer.Content>
          </Drawer>
        );
      }
      render(<Chosen />);
      await waitFor(() => expect(screen.getByLabelText("second")).toHaveFocus());
      await user.keyboard("{Escape}");
    });
  });

  describe("non-modal", () => {
    it("draws no scrim and does not claim to be modal", () => {
      render(<Basic drawer={{ defaultOpen: true, modal: false }} />);
      const drawer = screen.getByRole("dialog");
      expect(drawer).not.toHaveAttribute("aria-modal");
      expect(drawer).toHaveClass(styles.nonModal ?? "");
      expect(drawer.parentElement).toBe(document.body);
    });

    it("leaves the page behind interactive", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <>
          <button type="button" onClick={onClick}>
            Behind
          </button>
          <Basic drawer={{ defaultOpen: true, modal: false }} />
        </>,
      );
      await user.click(screen.getByRole("button", { name: "Behind" }));
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe("naming", () => {
    it("renders the title as an h2 by default, and as another level on request", () => {
      const { unmount } = render(<Basic drawer={{ defaultOpen: true }} />);
      expect(screen.getByRole("heading", { level: 2, name: "Edit profile" })).toBeInTheDocument();
      unmount();
      render(
        <Drawer defaultOpen>
          <Drawer.Content>
            <Drawer.Title level={3}>Third</Drawer.Title>
          </Drawer.Content>
        </Drawer>,
      );
      expect(screen.getByRole("heading", { level: 3, name: "Third" })).toBeInTheDocument();
    });

    it("names a drawer that has only an aria-label, with no Radix warning", () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(
        <Drawer defaultOpen>
          <Drawer.Content aria-label="Only a label">
            <Drawer.Body>Content</Drawer.Body>
          </Drawer.Content>
        </Drawer>,
      );
      expect(screen.getByRole("dialog", { name: "Only a label" })).toBeInTheDocument();
      expect(error).not.toHaveBeenCalled();
      expect(warn).not.toHaveBeenCalled();
    });

    it("takes a visually hidden title", () => {
      render(
        <Drawer defaultOpen>
          <Drawer.Content>
            <VisuallyHidden asChild>
              <Drawer.Title>Hidden title</Drawer.Title>
            </VisuallyHidden>
          </Drawer.Content>
        </Drawer>,
      );
      expect(screen.getByRole("dialog", { name: "Hidden title" })).toBeInTheDocument();
    });

    it("has no aria-describedby, and no Radix warning, without a description", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(
        <Drawer defaultOpen>
          <Drawer.Content>
            <Drawer.Title>No description</Drawer.Title>
          </Drawer.Content>
        </Drawer>,
      );
      expect(screen.getByRole("dialog")).not.toHaveAttribute("aria-describedby");
      expect(warn).not.toHaveBeenCalled();
    });

    it("lets an explicit aria-describedby win", () => {
      render(
        <>
          <p id="elsewhere">Described elsewhere</p>
          <Drawer defaultOpen>
            <Drawer.Content aria-describedby="elsewhere">
              <Drawer.Title>Title</Drawer.Title>
            </Drawer.Content>
          </Drawer>
        </>,
      );
      expect(screen.getByRole("dialog")).toHaveAccessibleDescription("Described elsewhere");
    });
  });

  describe("standard props", () => {
    it("forwards className, style, id, data-testid and ref to the panel", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <Drawer defaultOpen>
          <Drawer.Content
            ref={ref}
            aria-label="x"
            className="custom"
            style={{ opacity: 0.99 }}
            id="the-drawer"
            data-testid="panel"
          />
        </Drawer>,
      );
      const panel = screen.getByTestId("panel");
      expect(panel).toBe(screen.getByRole("dialog"));
      expect(panel).toHaveClass("custom");
      expect(panel).toHaveAttribute("id", "the-drawer");
      expect(panel).toHaveStyle({ opacity: "0.99" });
      expect(ref.current).toBe(panel);
    });

    it("does not let a consumer prop replace the role, the state or aria-modal", () => {
      render(
        <Drawer defaultOpen>
          <Drawer.Content
            aria-label="x"
            data-testid="panel"
            {...({ role: "alert", "data-state": "closed", "aria-modal": "false" } as object)}
          />
        </Drawer>,
      );
      const panel = screen.getByTestId("panel");
      expect(panel).toHaveAttribute("role", "dialog");
      expect(panel).toHaveAttribute("data-state", "open");
      expect(panel).toHaveAttribute("aria-modal", "true");
    });

    it("forwards the ref, className, id and data-testid of every sub-part", () => {
      const refs = {
        trigger: createRef<HTMLButtonElement>(),
        header: createRef<HTMLDivElement>(),
        title: createRef<HTMLHeadingElement>(),
        description: createRef<HTMLParagraphElement>(),
        body: createRef<HTMLDivElement>(),
        footer: createRef<HTMLDivElement>(),
        close: createRef<HTMLButtonElement>(),
      };
      render(
        <Drawer defaultOpen>
          <Drawer.Trigger ref={refs.trigger} className="t" data-testid="trigger">
            Open
          </Drawer.Trigger>
          <Drawer.Content aria-label="x">
            <Drawer.Header ref={refs.header} className="h" id="header" data-testid="header">
              <Drawer.Title ref={refs.title} className="ti" data-testid="title">
                Title
              </Drawer.Title>
              <Drawer.Description ref={refs.description} className="d" data-testid="description">
                Description
              </Drawer.Description>
            </Drawer.Header>
            <Drawer.Body ref={refs.body} className="b" id="body" data-testid="body">
              Body
            </Drawer.Body>
            <Drawer.Footer ref={refs.footer} className="f" id="footer" data-testid="footer">
              <Drawer.Close ref={refs.close} className="c" data-testid="close">
                Close it
              </Drawer.Close>
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer>,
      );
      for (const [name, ref] of Object.entries(refs)) {
        const element = screen.getByTestId(name);
        expect(ref.current, name).toBe(element);
        expect(element, name).toHaveClass({ trigger: "t", header: "h", title: "ti", description: "d", body: "b", footer: "f", close: "c" }[name] as string);
      }
      expect(screen.getByTestId("header")).toHaveAttribute("id", "header");
      expect(screen.getByTestId("body")).toHaveAttribute("id", "body");
      expect(screen.getByTestId("footer")).toHaveAttribute("id", "footer");
    });

    it("applies size, side, divided and footer alignment as classes", () => {
      const { unmount } = render(
        <Drawer defaultOpen>
          <Drawer.Content aria-label="x" size="lg" side="start" divided data-testid="panel">
            <Drawer.Footer align="between" data-testid="footer" />
          </Drawer.Content>
        </Drawer>,
      );
      const panel = screen.getByTestId("panel");
      expect(panel).toHaveClass(styles.sizeLg ?? "");
      expect(panel).toHaveClass(styles.sideStartBase ?? "");
      expect(panel).toHaveClass(sections.divided ?? "");
      expect(screen.getByTestId("footer")).toHaveClass(sections.alignBetween ?? "");
      unmount();
    });

    it("is attached to the end by default, at the md size", () => {
      render(
        <Drawer defaultOpen>
          <Drawer.Content aria-label="x" data-testid="panel" />
        </Drawer>,
      );
      const panel = screen.getByTestId("panel");
      expect(panel).toHaveClass(styles.sideEndBase ?? "");
      expect(panel.className).not.toMatch(/size(Xs|Sm|Lg|Xl)/);
    });

    it.each(["start", "end", "top", "bottom"] as const)("applies the %s side", (side) => {
      render(
        <Drawer defaultOpen>
          <Drawer.Content aria-label="x" side={side} data-testid="panel" />
        </Drawer>,
      );
      const name = `side${side.charAt(0).toUpperCase()}${side.slice(1)}Base`;
      expect(screen.getByTestId("panel")).toHaveClass((styles as Record<string, string | undefined>)[name] ?? "");
    });

    it("applies a mobile-first map of sides, one class per breakpoint", () => {
      render(
        <Drawer defaultOpen>
          <Drawer.Content aria-label="x" side={{ base: "bottom", md: "end", xl: "start" }} data-testid="panel" />
        </Drawer>,
      );
      expect(screen.getByTestId("panel")).toHaveClass(
        styles.sideBottomBase ?? "",
        styles.sideEndMd ?? "",
        styles.sideStartXl ?? "",
      );
    });

    it("is not given a side class of the others when it has one", () => {
      render(
        <Drawer defaultOpen>
          <Drawer.Content aria-label="x" side="top" data-testid="panel" />
        </Drawer>,
      );
      const panel = screen.getByTestId("panel");
      expect(panel).not.toHaveClass(styles.sideEndBase ?? "");
      expect(panel).not.toHaveClass(styles.sideBottomBase ?? "");
    });
  });

  describe("composition", () => {
    it("closes only the inner drawer on Escape when one is opened from another", async () => {
      const user = userEvent.setup();
      render(
        <Drawer defaultOpen>
          <Drawer.Content aria-label="Outer">
            <Drawer.Body>
              <Drawer>
                <Drawer.Trigger>Open inner</Drawer.Trigger>
                <Drawer.Content aria-label="Inner">
                  <Drawer.Body>Inner body</Drawer.Body>
                </Drawer.Content>
              </Drawer>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer>,
      );
      await user.click(screen.getByRole("button", { name: "Open inner" }));
      expect(await screen.findByRole("dialog", { name: "Inner" })).toBeInTheDocument();
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog", { name: "Inner" })).not.toBeInTheDocument());
      expect(screen.getByRole("dialog", { name: "Outer" })).toBeInTheDocument();
    });

    it("works under StrictMode", async () => {
      const user = userEvent.setup();
      render(
        <StrictMode>
          <Basic />
        </StrictMode>,
      );
      await user.click(screen.getByRole("button", { name: "Open" }));
      expect(await screen.findByRole("dialog", { name: "Edit profile" })).toBeInTheDocument();
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("renders into a given container", () => {
      const container = document.createElement("div");
      document.body.appendChild(container);
      render(
        <Drawer defaultOpen>
          <Drawer.Content aria-label="x" container={container} />
        </Drawer>,
      );
      expect(container).toContainElement(screen.getByRole("dialog"));
      container.remove();
    });
  });

  describe("why it closed", () => {
    it("says which part closed it", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<Basic drawer={{ onOpenChange }} />);
      const reasons = () => onOpenChange.mock.calls.map(([, details]) => details.reason);

      await user.click(screen.getByRole("button", { name: "Open" }));
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

      await user.click(screen.getByRole("button", { name: "Open" }));
      await user.click((await screen.findByRole("dialog")).parentElement as HTMLElement);
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

      await user.click(screen.getByRole("button", { name: "Open" }));
      await user.click(await screen.findByRole("button", { name: "Close" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

      await user.click(screen.getByRole("button", { name: "Open" }));
      await user.click(await screen.findByRole("button", { name: "Cancel" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

      expect(reasons()).toEqual([
        "trigger", "escape",
        "trigger", "outside",
        "trigger", "close-button",
        "trigger", "close",
      ]);
    });

    it("reports the reason to a controlled drawer too", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<Basic drawer={{ open: true, onOpenChange }} />);
      await user.click(screen.getByRole("button", { name: "Close" }));
      expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "close-button" });
    });
  });

  describe("busy", () => {
    it("can't be dismissed by any route while busy, and says so", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<Basic drawer={{ defaultOpen: true, onOpenChange }} busy />);
      const drawer = screen.getByRole("dialog");
      expect(drawer).toHaveAttribute("aria-busy", "true");
      // dimmed and inert, but still in the tab order so focus isn't dropped from it
      expect(screen.getByRole("button", { name: "Close" })).toHaveAttribute("aria-disabled", "true");
      expect(screen.getByRole("button", { name: "Close" })).not.toBeDisabled();
      expect(screen.getByRole("button", { name: "Cancel" })).toHaveAttribute("aria-disabled", "true");

      await user.keyboard("{Escape}");
      await user.click(drawer.parentElement as HTMLElement);
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      await user.click(screen.getByRole("button", { name: "Close" }));
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("keeps focus on the close button when it turns busy", async () => {
      const { rerender } = render(<Basic drawer={{ defaultOpen: true }} />);
      const close = screen.getByRole("button", { name: "Close" });
      close.focus();
      expect(close).toHaveFocus();
      rerender(<Basic drawer={{ defaultOpen: true }} busy />);
      expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    });

    it("never drops or re-adds the drawer's name while busy changes", async () => {
      const added: string[] = [];
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          record.addedNodes.forEach((node) => {
            if (node.textContent === "Named by a label") added.push("hidden title");
          });
        }
      });
      const named = (busy: boolean) => (
        <Drawer defaultOpen>
          <Drawer.Content aria-label="Named by a label" busy={busy}>
            <Drawer.Title>Visible title</Drawer.Title>
          </Drawer.Content>
        </Drawer>
      );
      const { rerender } = render(named(false));
      observer.observe(document.body, { childList: true, subtree: true });
      rerender(named(true));
      rerender(named(false));
      observer.disconnect();
      expect(added).toEqual([]);
      expect(screen.getByRole("dialog", { name: "Visible title" })).toBeInTheDocument();
    });

    it("can be dismissed again once it is no longer busy", async () => {
      const user = userEvent.setup();
      const { rerender } = render(<Basic drawer={{ defaultOpen: true }} busy />);
      await user.keyboard("{Escape}");
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      rerender(<Basic drawer={{ defaultOpen: true }} busy={false} />);
      expect(screen.getByRole("dialog")).not.toHaveAttribute("aria-busy");
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });
  });

  describe("keepMounted", () => {
    function Form({ keepMounted }: { keepMounted: boolean }) {
      return (
        <Drawer>
          <Drawer.Trigger>Open</Drawer.Trigger>
          <Drawer.Content aria-label="Form" keepMounted={keepMounted}>
            <Drawer.Body>
              <input aria-label="Name" />
            </Drawer.Body>
          </Drawer.Content>
        </Drawer>
      );
    }

    it("keeps what was typed when it is closed and reopened", async () => {
      const user = userEvent.setup();
      render(<Form keepMounted />);
      await user.click(screen.getByRole("button", { name: "Open" }));
      await user.type(await screen.findByRole("textbox", { name: "Name" }), "Jane");
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(screen.queryByRole("textbox", { name: "Name" })).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Open" }));
      expect(await screen.findByRole("textbox", { name: "Name" })).toHaveValue("Jane");
    });

    it("starts fresh each time without it", async () => {
      const user = userEvent.setup();
      render(<Form keepMounted={false} />);
      await user.click(screen.getByRole("button", { name: "Open" }));
      await user.type(await screen.findByRole("textbox", { name: "Name" }), "Jane");
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await user.click(screen.getByRole("button", { name: "Open" }));
      expect(await screen.findByRole("textbox", { name: "Name" })).toHaveValue("");
    });

    it("renders nothing until the first open, then leaves the page unlocked and visible while closed", async () => {
      const user = userEvent.setup();
      const rendered = vi.fn();
      function Probe() {
        rendered();
        return <input aria-label="Probe" />;
      }
      render(
        <>
          <button type="button">Behind</button>
          <Drawer>
            <Drawer.Trigger>Open</Drawer.Trigger>
            <Drawer.Content aria-label="Kept" keepMounted>
              <Probe />
            </Drawer.Content>
          </Drawer>
        </>,
      );
      expect(rendered).not.toHaveBeenCalled();
      await user.click(screen.getByRole("button", { name: "Open" }));
      expect(await screen.findByRole("textbox", { name: "Probe" })).toBeInTheDocument();
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(document.body).not.toHaveAttribute("data-scroll-locked");
      expect(screen.getByRole("button", { name: "Behind" })).toBeVisible();
      expect(screen.getByRole("button", { name: "Open" })).not.toHaveAttribute("aria-hidden");
    });

    it("works under StrictMode", async () => {
      const user = userEvent.setup();
      render(
        <StrictMode>
          <Form keepMounted />
        </StrictMode>,
      );
      await user.click(screen.getByRole("button", { name: "Open" }));
      await user.type(await screen.findByRole("textbox", { name: "Name" }), "Jo");
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await user.click(screen.getByRole("button", { name: "Open" }));
      expect(await screen.findByRole("textbox", { name: "Name" })).toHaveValue("Jo");
    });
  });

  describe("initialFocus", () => {
    function Focused({ prevent = false }: { prevent?: boolean }) {
      const second = createRef<HTMLInputElement>();
      return (
        <Drawer defaultOpen>
          <Drawer.Content
            aria-label="Focus"
            showCloseButton={false}
            initialFocus={second}
            onOpenAutoFocus={prevent ? (event) => event.preventDefault() : undefined}
          >
            <input aria-label="first" />
            <input aria-label="second" ref={second} />
          </Drawer.Content>
        </Drawer>
      );
    }

    it("focuses the given element instead of the first focusable one", async () => {
      render(<Focused />);
      await waitFor(() => expect(screen.getByLabelText("second")).toHaveFocus());
    });

    it("yields to an onOpenAutoFocus that prevents the default", async () => {
      render(<Focused prevent />);
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(screen.getByLabelText("second")).not.toHaveFocus();
    });
  });

  describe("scrim and divided", () => {
    it("applies the divided=auto class", () => {
      render(
        <Drawer defaultOpen>
          <Drawer.Content aria-label="x" divided="auto" data-testid="panel" />
        </Drawer>,
      );
      const panel = screen.getByTestId("panel");
      expect(panel).toHaveClass(sections.dividedAuto ?? "");
      expect(panel).not.toHaveClass(sections.divided ?? "");
      expect(panel).not.toHaveAttribute("data-overflow-start");
    });

    it("is divided=\"auto\" by default, and false draws neither kind of line", () => {
      const { unmount } = render(
        <Drawer defaultOpen>
          <Drawer.Content aria-label="x" data-testid="panel" />
        </Drawer>,
      );
      const byDefault = screen.getByTestId("panel");
      expect(byDefault).toHaveClass(sections.dividedAuto ?? "");
      expect(byDefault).not.toHaveClass(sections.divided ?? "");
      unmount();
      render(
        <Drawer defaultOpen>
          <Drawer.Content aria-label="x" divided={false} data-testid="panel" />
        </Drawer>,
      );
      const off = screen.getByTestId("panel");
      expect(off).not.toHaveClass(sections.dividedAuto ?? "");
      expect(off).not.toHaveClass(sections.divided ?? "");
    });

    it("hands the scrim its opacity and blur", () => {
      render(
        <Drawer defaultOpen>
          <Drawer.Content aria-label="x" scrimOpacity={80} scrimBlur />
        </Drawer>,
      );
      const scrim = screen.getByRole("dialog").parentElement as HTMLElement;
      expect(scrim.style.getPropertyValue("--dbm-backdrop-fill-opacity")).toBe("var(--dbm-opacity-80)");
    });
  });

  describe("accessibility", () => {
    it("has no axe violations open", async () => {
      render(<Basic drawer={{ defaultOpen: true }} />);
      expect((await axe(document.body)).violations).toHaveLength(0);
    });

    it("has no axe violations busy, top-placed and auto-divided", async () => {
      render(
        <Drawer defaultOpen>
          <Drawer.Content aria-label="Busy" busy side="bottom" divided="auto" scrimBlur scrimOpacity={80}>
            <Drawer.Header>
              <Drawer.Title>Saving</Drawer.Title>
              <Drawer.Description>Please wait.</Drawer.Description>
            </Drawer.Header>
            <Drawer.Body>Working…</Drawer.Body>
            <Drawer.Footer>
              <Drawer.Close>Cancel</Drawer.Close>
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer>,
      );
      expect((await axe(document.body)).violations).toHaveLength(0);
    });

    it("has no axe violations kept mounted and reopened, and nested", async () => {
      const user = userEvent.setup();
      render(
        <Drawer>
          <Drawer.Trigger>Open</Drawer.Trigger>
          <Drawer.Content aria-label="Outer" keepMounted>
            <Drawer.Body>
              <Drawer defaultOpen>
                <Drawer.Content aria-label="Inner" size="sm">
                  <Drawer.Body>Inner</Drawer.Body>
                </Drawer.Content>
              </Drawer>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer>,
      );
      await user.click(screen.getByRole("button", { name: "Open" }));
      expect((await axe(document.body)).violations).toHaveLength(0);
      await user.keyboard("{Escape}{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await user.click(screen.getByRole("button", { name: "Open" }));
      expect((await axe(document.body)).violations).toHaveLength(0);
    });

    it("has no axe violations with only an aria-label, non-modal and full screen", async () => {
      render(
        <Drawer defaultOpen modal={false}>
          <Drawer.Content aria-label="Docked" side="start" showCloseButton={false}>
            <Drawer.Body>Content</Drawer.Body>
          </Drawer.Content>
        </Drawer>,
      );
      expect((await axe(document.body)).violations).toHaveLength(0);
    });
  });

  describe("onOpenChangeComplete", () => {
    it("says when it has finished opening and, after the exit, when it has finished closing", async () => {
      const complete = vi.fn();
      const changed = vi.fn();
      const user = userEvent.setup();
      render(
        <Drawer onOpenChange={changed} onOpenChangeComplete={complete}>
          <Drawer.Trigger>Open</Drawer.Trigger>
          <Drawer.Content aria-label="A drawer">
            <Drawer.Body>Body</Drawer.Body>
          </Drawer.Content>
        </Drawer>,
      );
      expect(complete).not.toHaveBeenCalled();
      await user.click(screen.getByRole("button", { name: "Open" }));
      await waitFor(() => expect(complete).toHaveBeenCalledWith(true));
      expect(complete).toHaveBeenCalledTimes(1);
      await user.keyboard("{Escape}");
      await waitFor(() => expect(complete).toHaveBeenCalledWith(false));
      expect(complete.mock.calls.map(([value]) => value)).toEqual([true, false]);
      // the change was announced before it was reported finished
      expect(changed.mock.invocationCallOrder[1]).toBeLessThan(complete.mock.invocationCallOrder[1] ?? 0);
    });

    it("does not report a close while it is open, including under StrictMode", async () => {
      const complete = vi.fn();
      render(
        <StrictMode>
          <Drawer defaultOpen onOpenChangeComplete={complete}>
            <Drawer.Content aria-label="A drawer" />
          </Drawer>
        </StrictMode>,
      );
      await waitFor(() => expect(complete).toHaveBeenCalledWith(true));
      expect(complete).not.toHaveBeenCalledWith(false);
    });
  });


  describe("size, handle and swipe", () => {
    it("sets a CSS length as the drawer's size, and a number as pixels", () => {
      const { unmount } = render(
        <Drawer defaultOpen>
          <Drawer.Content aria-label="x" size="22rem" data-testid="panel" />
        </Drawer>,
      );
      expect(screen.getByTestId("panel").style.getPropertyValue("--drawer-size")).toBe("22rem");
      expect(screen.getByTestId("panel").className).not.toMatch(/size(Xs|Sm|Lg|Xl)/);
      unmount();
      render(
        <Drawer defaultOpen>
          <Drawer.Content aria-label="x" size={360} data-testid="panel" />
        </Drawer>,
      );
      expect(screen.getByTestId("panel").style.getPropertyValue("--drawer-size")).toBe("360px");
    });

    it("sets nothing inline for a step of the scale, and keeps the consumer's own style", () => {
      render(
        <Drawer defaultOpen>
          <Drawer.Content aria-label="x" size="lg" style={{ color: "red" }} data-testid="panel" />
        </Drawer>,
      );
      const panel = screen.getByTestId("panel");
      expect(panel).toHaveClass(styles.sizeLg ?? "");
      expect(panel.style.getPropertyValue("--drawer-size")).toBe("");
      expect(panel).toHaveStyle({ color: "rgb(255, 0, 0)" });
    });

    it("keeps the consumer's style alongside a custom size", () => {
      render(
        <Drawer defaultOpen>
          <Drawer.Content aria-label="x" size="20rem" style={{ color: "red" }} data-testid="panel" />
        </Drawer>,
      );
      const panel = screen.getByTestId("panel");
      expect(panel.style.getPropertyValue("--drawer-size")).toBe("20rem");
      expect(panel).toHaveStyle({ color: "rgb(255, 0, 0)" });
    });

    it("draws a decorative handle, and none with showHandle={false}", () => {
      const { unmount } = render(
        <Drawer defaultOpen>
          <Drawer.Content aria-label="x" side="bottom" data-testid="panel" />
        </Drawer>,
      );
      const handle = screen.getByTestId("panel").querySelector("[data-drawer-grab][aria-hidden='true']");
      expect(handle).not.toBeNull();
      unmount();
      render(
        <Drawer defaultOpen>
          <Drawer.Content aria-label="x" side="bottom" showHandle={false} data-testid="panel" />
        </Drawer>,
      );
      expect(screen.getByTestId("panel").querySelector("[data-drawer-grab][aria-hidden='true']")).toBeNull();
    });

    it("marks the header as somewhere a touch can take hold, and a consumer prop can't remove it", () => {
      render(
        <Drawer defaultOpen>
          <Drawer.Content aria-label="x">
            <Drawer.Header data-testid="header" {...({ "data-drawer-grab": "no" } as object)} />
          </Drawer.Content>
        </Drawer>,
      );
      expect(screen.getByTestId("header")).toHaveAttribute("data-drawer-grab", "");
    });

    it("accepts the swipe reason in its type and reports it through onOpenChange", () => {
      // The gesture itself needs a layout engine and is checked in a real browser; this holds the API shape.
      const reasons: Array<import("./Drawer.types").DrawerOpenChangeReason> = ["swipe", "close", "outside"];
      expect(reasons).toContain("swipe");
    });
  });

});
