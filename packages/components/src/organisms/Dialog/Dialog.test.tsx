import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "../../atoms/Button";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { Dialog } from "./Dialog";
import styles from "./Dialog.module.css";

function Basic(props: Partial<React.ComponentProps<typeof Dialog.Content>> & { dialog?: React.ComponentProps<typeof Dialog> }) {
  return (
    <Dialog {...props.dialog}>
      <Dialog.Trigger>Open</Dialog.Trigger>
      <Dialog.Content {...props}>
        <Dialog.Header>
          <Dialog.Title>Edit profile</Dialog.Title>
          <Dialog.Description>Changes are saved to your account.</Dialog.Description>
        </Dialog.Header>
        <Dialog.Body>Body text</Dialog.Body>
        <Dialog.Footer>
          <Dialog.Close>Cancel</Dialog.Close>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Dialog", () => {
  it("renders only the trigger while closed", () => {
    render(<Basic />);
    expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens on a trigger click as a named, described, modal dialog", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole("button", { name: "Open" }));
    const dialog = await screen.findByRole("dialog", { name: "Edit profile" });
    expect(dialog).toHaveAccessibleDescription("Changes are saved to your account.");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("data-state", "open");
  });

  it("starts open with defaultOpen", () => {
    render(<Basic dialog={{ defaultOpen: true }} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("reports changes from an uncontrolled dialog", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Basic dialog={{ onOpenChange }} />);
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("supports a fully controlled open state and leaves it alone until the prop changes", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Basic dialog={{ open: true, onOpenChange }} />);
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
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
          <Dialog open={open} onOpenChange={setOpen}>
            <Dialog.Content aria-label="Wired">
              <Dialog.Body>Wired body</Dialog.Body>
            </Dialog.Content>
          </Dialog>
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
      render(<Basic dialog={{ defaultOpen: true }} />);
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("stays open on Escape with closeOnEscape={false}", async () => {
      const user = userEvent.setup();
      render(<Basic dialog={{ defaultOpen: true }} closeOnEscape={false} />);
      await user.keyboard("{Escape}");
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("runs onEscapeKeyDown first and lets it prevent the close", async () => {
      const user = userEvent.setup();
      const onEscapeKeyDown = vi.fn((event: KeyboardEvent) => event.preventDefault());
      render(<Basic dialog={{ defaultOpen: true }} onEscapeKeyDown={onEscapeKeyDown} />);
      await user.keyboard("{Escape}");
      expect(onEscapeKeyDown).toHaveBeenCalled();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("closes on a press on the scrim, not on a press inside the panel", async () => {
      const user = userEvent.setup();
      render(<Basic dialog={{ defaultOpen: true }} />);
      const dialog = screen.getByRole("dialog");
      await user.click(screen.getByText("Body text"));
      expect(dialog).toBeInTheDocument();
      await user.click(dialog.parentElement as HTMLElement);
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("ignores a press on the scrim with closeOnOutsideClick={false}", async () => {
      const user = userEvent.setup();
      render(<Basic dialog={{ defaultOpen: true }} closeOnOutsideClick={false} />);
      const dialog = screen.getByRole("dialog");
      await user.click(dialog.parentElement as HTMLElement);
      expect(dialog).toBeInTheDocument();
    });

    it("closes from Dialog.Close", async () => {
      const user = userEvent.setup();
      render(<Basic dialog={{ defaultOpen: true }} />);
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("lets Dialog.Close take a Button through asChild", async () => {
      const user = userEvent.setup();
      render(
        <Dialog defaultOpen>
          <Dialog.Content aria-label="x">
            <Dialog.Footer>
              <Dialog.Close asChild>
                <Button>Done</Button>
              </Dialog.Close>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog>,
      );
      await user.click(screen.getByRole("button", { name: "Done" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });
  });

  describe("close button", () => {
    it("is shown by default and closes the dialog", async () => {
      const user = userEvent.setup();
      render(<Basic dialog={{ defaultOpen: true }} />);
      await user.click(screen.getByRole("button", { name: "Close" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("can be hidden", () => {
      render(<Basic dialog={{ defaultOpen: true }} showCloseButton={false} />);
      expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    });

    it("takes its name from labels.close, and keeps the default when it is undefined", () => {
      const { unmount } = render(<Basic dialog={{ defaultOpen: true }} labels={{ close: "Fermer" }} />);
      expect(screen.getByRole("button", { name: "Fermer" })).toBeInTheDocument();
      unmount();
      render(<Basic dialog={{ defaultOpen: true }} labels={{ close: undefined }} />);
      expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    });
  });

  describe("focus", () => {
    it("moves focus into the dialog on open and back to the trigger on close", async () => {
      const user = userEvent.setup();
      render(<Basic />);
      const trigger = screen.getByRole("button", { name: "Open" });
      await user.click(trigger);
      const dialog = await screen.findByRole("dialog");
      await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement));
      await user.keyboard("{Escape}");
      await waitFor(() => expect(trigger).toHaveFocus());
    });

    it("keeps Tab inside the dialog", async () => {
      const user = userEvent.setup();
      render(
        <>
          <button type="button">Behind</button>
          <Basic dialog={{ defaultOpen: true }} />
        </>,
      );
      const dialog = screen.getByRole("dialog");
      for (let press = 0; press < 6; press += 1) {
        await user.tab();
        expect(dialog).toContainElement(document.activeElement as HTMLElement);
      }
    });

    it("lets onOpenAutoFocus choose where focus lands", async () => {
      const user = userEvent.setup();
      function Chosen() {
        return (
          <Dialog defaultOpen>
            <Dialog.Content
              aria-label="Chosen"
              showCloseButton={false}
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                (document.getElementById("second") as HTMLElement).focus();
              }}
            >
              <input id="first" aria-label="first" />
              <input id="second" aria-label="second" />
            </Dialog.Content>
          </Dialog>
        );
      }
      render(<Chosen />);
      await waitFor(() => expect(screen.getByLabelText("second")).toHaveFocus());
      await user.keyboard("{Escape}");
    });
  });

  describe("non-modal", () => {
    it("draws no scrim and does not claim to be modal", () => {
      render(<Basic dialog={{ defaultOpen: true, modal: false }} />);
      const dialog = screen.getByRole("dialog");
      expect(dialog).not.toHaveAttribute("aria-modal");
      expect(dialog).toHaveClass(styles.nonModal ?? "");
      expect(dialog.parentElement).toBe(document.body);
    });

    it("leaves the page behind interactive", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <>
          <button type="button" onClick={onClick}>
            Behind
          </button>
          <Basic dialog={{ defaultOpen: true, modal: false }} />
        </>,
      );
      await user.click(screen.getByRole("button", { name: "Behind" }));
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe("naming", () => {
    it("renders the title as an h2 by default, and as another level on request", () => {
      const { unmount } = render(<Basic dialog={{ defaultOpen: true }} />);
      expect(screen.getByRole("heading", { level: 2, name: "Edit profile" })).toBeInTheDocument();
      unmount();
      render(
        <Dialog defaultOpen>
          <Dialog.Content>
            <Dialog.Title level={3}>Third</Dialog.Title>
          </Dialog.Content>
        </Dialog>,
      );
      expect(screen.getByRole("heading", { level: 3, name: "Third" })).toBeInTheDocument();
    });

    it("names a dialog that has only an aria-label, with no Radix warning", () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(
        <Dialog defaultOpen>
          <Dialog.Content aria-label="Only a label">
            <Dialog.Body>Content</Dialog.Body>
          </Dialog.Content>
        </Dialog>,
      );
      expect(screen.getByRole("dialog", { name: "Only a label" })).toBeInTheDocument();
      expect(error).not.toHaveBeenCalled();
      expect(warn).not.toHaveBeenCalled();
    });

    it("takes a visually hidden title", () => {
      render(
        <Dialog defaultOpen>
          <Dialog.Content>
            <VisuallyHidden asChild>
              <Dialog.Title>Hidden title</Dialog.Title>
            </VisuallyHidden>
          </Dialog.Content>
        </Dialog>,
      );
      expect(screen.getByRole("dialog", { name: "Hidden title" })).toBeInTheDocument();
    });

    it("has no aria-describedby, and no Radix warning, without a description", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(
        <Dialog defaultOpen>
          <Dialog.Content>
            <Dialog.Title>No description</Dialog.Title>
          </Dialog.Content>
        </Dialog>,
      );
      expect(screen.getByRole("dialog")).not.toHaveAttribute("aria-describedby");
      expect(warn).not.toHaveBeenCalled();
    });

    it("lets an explicit aria-describedby win", () => {
      render(
        <>
          <p id="elsewhere">Described elsewhere</p>
          <Dialog defaultOpen>
            <Dialog.Content aria-describedby="elsewhere">
              <Dialog.Title>Title</Dialog.Title>
            </Dialog.Content>
          </Dialog>
        </>,
      );
      expect(screen.getByRole("dialog")).toHaveAccessibleDescription("Described elsewhere");
    });
  });

  describe("standard props", () => {
    it("forwards className, style, id, data-testid and ref to the panel", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <Dialog defaultOpen>
          <Dialog.Content
            ref={ref}
            aria-label="x"
            className="custom"
            style={{ opacity: 0.99 }}
            id="the-dialog"
            data-testid="panel"
          />
        </Dialog>,
      );
      const panel = screen.getByTestId("panel");
      expect(panel).toBe(screen.getByRole("dialog"));
      expect(panel).toHaveClass("custom");
      expect(panel).toHaveAttribute("id", "the-dialog");
      expect(panel).toHaveStyle({ opacity: "0.99" });
      expect(ref.current).toBe(panel);
    });

    it("does not let a consumer prop replace the role, the state or aria-modal", () => {
      render(
        <Dialog defaultOpen>
          <Dialog.Content
            aria-label="x"
            data-testid="panel"
            {...({ role: "alert", "data-state": "closed", "aria-modal": "false" } as object)}
          />
        </Dialog>,
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
        <Dialog defaultOpen>
          <Dialog.Trigger ref={refs.trigger} className="t" data-testid="trigger">
            Open
          </Dialog.Trigger>
          <Dialog.Content aria-label="x">
            <Dialog.Header ref={refs.header} className="h" id="header" data-testid="header">
              <Dialog.Title ref={refs.title} className="ti" data-testid="title">
                Title
              </Dialog.Title>
              <Dialog.Description ref={refs.description} className="d" data-testid="description">
                Description
              </Dialog.Description>
            </Dialog.Header>
            <Dialog.Body ref={refs.body} className="b" id="body" data-testid="body">
              Body
            </Dialog.Body>
            <Dialog.Footer ref={refs.footer} className="f" id="footer" data-testid="footer">
              <Dialog.Close ref={refs.close} className="c" data-testid="close">
                Close it
              </Dialog.Close>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog>,
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

    it("applies size, fullScreen, divided and footer alignment as classes", () => {
      const { unmount } = render(
        <Dialog defaultOpen>
          <Dialog.Content aria-label="x" size="lg" fullScreen divided data-testid="panel">
            <Dialog.Footer align="between" data-testid="footer" />
          </Dialog.Content>
        </Dialog>,
      );
      const panel = screen.getByTestId("panel");
      expect(panel).toHaveClass(styles.sizeLg ?? "");
      expect(panel).toHaveClass(styles.fullBase ?? "");
      expect(panel).toHaveClass(styles.divided ?? "");
      expect(screen.getByTestId("footer")).toHaveClass(styles.alignBetween ?? "");
      unmount();

      render(
        <Dialog defaultOpen>
          <Dialog.Content aria-label="x" fullScreen={{ base: true, md: false }} data-testid="panel" />
        </Dialog>,
      );
      expect(screen.getByTestId("panel")).toHaveClass(styles.fullBase ?? "", styles.windowedMd ?? "");
    });
  });

  describe("composition", () => {
    it("closes only the inner dialog on Escape when one is opened from another", async () => {
      const user = userEvent.setup();
      render(
        <Dialog defaultOpen>
          <Dialog.Content aria-label="Outer">
            <Dialog.Body>
              <Dialog>
                <Dialog.Trigger>Open inner</Dialog.Trigger>
                <Dialog.Content aria-label="Inner">
                  <Dialog.Body>Inner body</Dialog.Body>
                </Dialog.Content>
              </Dialog>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog>,
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
        <Dialog defaultOpen>
          <Dialog.Content aria-label="x" container={container} />
        </Dialog>,
      );
      expect(container).toContainElement(screen.getByRole("dialog"));
      container.remove();
    });
  });

  describe("accessibility", () => {
    it("has no axe violations open", async () => {
      render(<Basic dialog={{ defaultOpen: true }} />);
      expect((await axe(document.body)).violations).toHaveLength(0);
    });

    it("has no axe violations with only an aria-label, non-modal and full screen", async () => {
      render(
        <Dialog defaultOpen modal={false}>
          <Dialog.Content aria-label="Docked" fullScreen showCloseButton={false}>
            <Dialog.Body>Content</Dialog.Body>
          </Dialog.Content>
        </Dialog>,
      );
      expect((await axe(document.body)).violations).toHaveLength(0);
    });
  });
});
