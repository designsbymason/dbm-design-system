import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "../../atoms/Button";
import { Dialog } from "../Dialog";
import { AlertDialog } from "./AlertDialog";
import styles from "./AlertDialog.module.css";

function Basic({
  dialog,
  ...content
}: Partial<React.ComponentProps<typeof AlertDialog.Content>> & { dialog?: React.ComponentProps<typeof AlertDialog> }) {
  return (
    <AlertDialog {...dialog}>
      <AlertDialog.Trigger>Open</AlertDialog.Trigger>
      <AlertDialog.Content {...content}>
        <AlertDialog.Header>
          <AlertDialog.Title>Delete project?</AlertDialog.Title>
          <AlertDialog.Description>This removes it for good.</AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
          <AlertDialog.Cancel>Keep it</AlertDialog.Cancel>
          <AlertDialog.Action>Delete</AlertDialog.Action>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AlertDialog", () => {
  it("renders only the trigger while closed", () => {
    render(<Basic />);
    expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("opens as a named, described, modal alertdialog with no Radix warning", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole("button", { name: "Open" }));
    const alert = await screen.findByRole("alertdialog", { name: "Delete project?" });
    expect(alert).toHaveAccessibleDescription("This removes it for good.");
    expect(alert).toHaveAttribute("aria-modal", "true");
    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it("has no close button in the corner", () => {
    render(<Basic dialog={{ defaultOpen: true }} />);
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  describe("focus", () => {
    it("starts on Cancel, the safe choice, and returns to the trigger on close", async () => {
      const user = userEvent.setup();
      render(<Basic />);
      const trigger = screen.getByRole("button", { name: "Open" });
      await user.click(trigger);
      await waitFor(() => expect(screen.getByRole("button", { name: "Keep it" })).toHaveFocus());
      await user.keyboard("{Escape}");
      await waitFor(() => expect(trigger).toHaveFocus());
    });

    it("starts on the Action when there is no Cancel", async () => {
      render(
        <AlertDialog defaultOpen>
          <AlertDialog.Content>
            <AlertDialog.Header>
              <AlertDialog.Title>Saved</AlertDialog.Title>
              <AlertDialog.Description>Your changes were saved.</AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer>
              <AlertDialog.Action>OK</AlertDialog.Action>
            </AlertDialog.Footer>
          </AlertDialog.Content>
        </AlertDialog>,
      );
      await waitFor(() => expect(screen.getByRole("button", { name: "OK" })).toHaveFocus());
    });

    it("lets initialFocus choose the element", async () => {
      function Chosen() {
        const field = createRef<HTMLInputElement>();
        return (
          <AlertDialog defaultOpen>
            <AlertDialog.Content initialFocus={field}>
              <AlertDialog.Header>
                <AlertDialog.Title>Type to confirm</AlertDialog.Title>
                <AlertDialog.Description>Type the name.</AlertDialog.Description>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <input aria-label="Name" ref={field} />
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
              </AlertDialog.Footer>
            </AlertDialog.Content>
          </AlertDialog>
        );
      }
      render(<Chosen />);
      await waitFor(() => expect(screen.getByLabelText("Name")).toHaveFocus());
    });

    it("keeps Tab inside the alert", async () => {
      const user = userEvent.setup();
      render(
        <>
          <button type="button">Behind</button>
          <Basic dialog={{ defaultOpen: true }} />
        </>,
      );
      const alert = screen.getByRole("alertdialog");
      for (let press = 0; press < 5; press += 1) {
        await user.tab();
        expect(alert).toContainElement(document.activeElement as HTMLElement);
      }
    });
  });

  describe("answering and dismissing", () => {
    it("ignores a press on the scrim", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<Basic dialog={{ defaultOpen: true, onOpenChange }} />);
      await user.click(screen.getByRole("alertdialog").parentElement as HTMLElement);
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });

    it("closes on Escape as a cancel, and not with closeOnEscape={false}", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      const { unmount } = render(<Basic dialog={{ defaultOpen: true, onOpenChange }} />);
      await user.keyboard("{Escape}");
      expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "escape" });
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      unmount();

      render(<Basic dialog={{ defaultOpen: true }} closeOnEscape={false} />);
      await user.keyboard("{Escape}");
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });

    it("says which choice closed it", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<Basic dialog={{ onOpenChange }} />);
      const reasons = () => onOpenChange.mock.calls.map(([, details]) => details.reason);
      await user.click(screen.getByRole("button", { name: "Open" }));
      await user.click(await screen.findByRole("button", { name: "Keep it" }));
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      await user.click(screen.getByRole("button", { name: "Open" }));
      await user.click(await screen.findByRole("button", { name: "Delete" }));
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      expect(reasons()).toEqual(["trigger", "cancel", "trigger", "action"]);
    });

    it("runs the Action's own handler first, and stays open when it prevents the default", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
      render(
        <AlertDialog defaultOpen>
          <AlertDialog.Content aria-describedby={undefined}>
            <AlertDialog.Header>
              <AlertDialog.Title>Hold</AlertDialog.Title>
              <AlertDialog.Description>Waits for a request.</AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer>
              <AlertDialog.Action onClick={onClick}>Go</AlertDialog.Action>
            </AlertDialog.Footer>
          </AlertDialog.Content>
        </AlertDialog>,
      );
      await user.click(screen.getByRole("button", { name: "Go" }));
      expect(onClick).toHaveBeenCalled();
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });

    it("works fully controlled", async () => {
      const user = userEvent.setup();
      function Wired() {
        const [open, setOpen] = useState(false);
        return (
          <>
            <button type="button" onClick={() => setOpen(true)}>
              Outside open
            </button>
            <AlertDialog open={open} onOpenChange={setOpen}>
              <AlertDialog.Content>
                <AlertDialog.Header>
                  <AlertDialog.Title>Sure?</AlertDialog.Title>
                  <AlertDialog.Description>Really.</AlertDialog.Description>
                </AlertDialog.Header>
                <AlertDialog.Footer>
                  <AlertDialog.Cancel>No</AlertDialog.Cancel>
                </AlertDialog.Footer>
              </AlertDialog.Content>
            </AlertDialog>
          </>
        );
      }
      render(<Wired />);
      await user.click(screen.getByRole("button", { name: "Outside open" }));
      expect(await screen.findByRole("alertdialog", { name: "Sure?" })).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "No" }));
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    });
  });

  describe("value of a choice", () => {
    it("reports the value of the Action that closed it, and of a Cancel", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(
        <AlertDialog onOpenChange={onOpenChange}>
          <AlertDialog.Trigger>Open</AlertDialog.Trigger>
          <AlertDialog.Content>
            <AlertDialog.Header>
              <AlertDialog.Title>Save changes?</AlertDialog.Title>
              <AlertDialog.Description>They will be lost.</AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer>
              <AlertDialog.Cancel value="stay">Keep editing</AlertDialog.Cancel>
              <AlertDialog.Action value="discard">Don&apos;t save</AlertDialog.Action>
              <AlertDialog.Action value="save">Save</AlertDialog.Action>
            </AlertDialog.Footer>
          </AlertDialog.Content>
        </AlertDialog>,
      );
      const answers = () => onOpenChange.mock.calls.filter(([open]) => open === false).map(([, details]) => details);
      await user.click(screen.getByRole("button", { name: "Open" }));
      await user.click(await screen.findByRole("button", { name: "Save" }));
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      await user.click(screen.getByRole("button", { name: "Open" }));
      await user.click(await screen.findByRole("button", { name: "Don't save" }));
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      await user.click(screen.getByRole("button", { name: "Open" }));
      await user.click(await screen.findByRole("button", { name: "Keep editing" }));
      expect(answers()).toEqual([
        { reason: "action", value: "save" },
        { reason: "action", value: "discard" },
        { reason: "cancel", value: "stay" },
      ]);
    });

    it("leaves value out when the choice has none", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<Basic dialog={{ defaultOpen: true, onOpenChange }} />);
      await user.click(screen.getByRole("button", { name: "Delete" }));
      expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "action" });
    });

    it("does not put the value on the button as an attribute", () => {
      render(
        <AlertDialog defaultOpen>
          <AlertDialog.Content>
            <AlertDialog.Header>
              <AlertDialog.Title>T</AlertDialog.Title>
              <AlertDialog.Description>D</AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer>
              <AlertDialog.Action value="go">Go</AlertDialog.Action>
            </AlertDialog.Footer>
          </AlertDialog.Content>
        </AlertDialog>,
      );
      expect(screen.getByRole("button", { name: "Go" })).not.toHaveAttribute("value");
    });
  });

  describe("nudge", () => {
    const pulsing = () =>
      screen.getByRole("alertdialog").className.includes(styles.nudgeA ?? "?") ||
      screen.getByRole("alertdialog").className.includes(styles.nudgeB ?? "?");

    it("pulses when the scrim is pressed, and not when the panel is", async () => {
      const user = userEvent.setup();
      render(<Basic dialog={{ defaultOpen: true }} />);
      expect(pulsing()).toBe(false);
      await user.click(screen.getByRole("heading", { name: "Delete project?" }));
      expect(pulsing()).toBe(false);
      await user.click(screen.getByRole("alertdialog").parentElement as HTMLElement);
      expect(pulsing()).toBe(true);
    });

    it("alternates between two classes so a second press restarts it", async () => {
      const user = userEvent.setup();
      render(<Basic dialog={{ defaultOpen: true }} />);
      const scrim = screen.getByRole("alertdialog").parentElement as HTMLElement;
      await user.click(scrim);
      const first = screen.getByRole("alertdialog").className;
      await user.click(scrim);
      expect(screen.getByRole("alertdialog").className).not.toBe(first);
    });

    it("pulses when Escape can't close it, because of closeOnEscape or busy", async () => {
      const user = userEvent.setup();
      const { unmount } = render(<Basic dialog={{ defaultOpen: true }} closeOnEscape={false} />);
      await user.keyboard("{Escape}");
      expect(pulsing()).toBe(true);
      unmount();
      render(<Basic dialog={{ defaultOpen: true }} busy />);
      await user.keyboard("{Escape}");
      expect(pulsing()).toBe(true);
    });

    it("is not still pulsing when the alert is reopened", async () => {
      const user = userEvent.setup();
      render(<Basic dialog={{}} />);
      await user.click(screen.getByRole("button", { name: "Open" }));
      await user.click((await screen.findByRole("alertdialog")).parentElement as HTMLElement);
      expect(pulsing()).toBe(true);
      await user.click(screen.getByRole("button", { name: "Keep it" }));
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      await user.click(screen.getByRole("button", { name: "Open" }));
      await screen.findByRole("alertdialog");
      expect(pulsing()).toBe(false);
    });

    it("does nothing with nudge={false}", async () => {
      const user = userEvent.setup();
      render(<Basic dialog={{ defaultOpen: true }} nudge={false} closeOnEscape={false} />);
      await user.click(screen.getByRole("alertdialog").parentElement as HTMLElement);
      await user.keyboard("{Escape}");
      expect(pulsing()).toBe(false);
    });
  });

  describe("busy", () => {
    it("can't be answered or dismissed while busy", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<Basic dialog={{ defaultOpen: true, onOpenChange }} busy />);
      const alert = screen.getByRole("alertdialog");
      expect(alert).toHaveAttribute("aria-busy", "true");
      expect(screen.getByRole("button", { name: "Delete" })).toHaveAttribute("aria-disabled", "true");
      expect(screen.getByRole("button", { name: "Keep it" })).toHaveAttribute("aria-disabled", "true");
      await user.keyboard("{Escape}");
      await user.click(screen.getByRole("button", { name: "Delete" }));
      await user.click(screen.getByRole("button", { name: "Keep it" }));
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });

    it("does not run the caller's onClick for a press that does nothing", async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      const onCancel = vi.fn();
      render(
        <AlertDialog defaultOpen>
          <AlertDialog.Content busy>
            <AlertDialog.Header>
              <AlertDialog.Title>Delete project?</AlertDialog.Title>
              <AlertDialog.Description>It cannot be undone.</AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer>
              <AlertDialog.Cancel onClick={onCancel}>Keep it</AlertDialog.Cancel>
              <AlertDialog.Action onClick={onAction}>Delete</AlertDialog.Action>
            </AlertDialog.Footer>
          </AlertDialog.Content>
        </AlertDialog>,
      );
      await user.click(screen.getByRole("button", { name: "Delete" }));
      await user.click(screen.getByRole("button", { name: "Keep it" }));
      expect(onAction).not.toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe("tone", () => {
    it("draws a decorative icon for every tone, neutral included", () => {
      const { rerender } = render(<Basic dialog={{ defaultOpen: true }} />);
      for (const tone of ["neutral", "info", "warning", "danger"] as const) {
        rerender(<Basic dialog={{ defaultOpen: true }} tone={tone} />);
        const medallion = document.querySelector(`.${styles.medallion}`);
        expect(medallion, tone).toBeInTheDocument();
        expect(medallion).toHaveAttribute("aria-hidden", "true");
      }
    });

    it("draws the neutral icon by default, with no tone given", () => {
      render(<Basic dialog={{ defaultOpen: true }} />);
      expect(document.querySelector(`.${styles.medallion}`)).toBeInTheDocument();
    });

    it("lets icon={false} remove the neutral icon", () => {
      render(<Basic dialog={{ defaultOpen: true }} tone="neutral" icon={false} />);
      expect(document.querySelector(`.${styles.medallion}`)).not.toBeInTheDocument();
    });

    it("lets icon={false} remove it", () => {
      render(<Basic dialog={{ defaultOpen: true }} tone="danger" icon={false} />);
      expect(document.querySelector(`.${styles.medallion}`)).not.toBeInTheDocument();
    });

    it("makes the Action destructive for danger, primary otherwise, and lets variant override", () => {
      const { rerender } = render(<Basic dialog={{ defaultOpen: true }} tone="danger" />);
      const classOf = () => screen.getByRole("button", { name: "Delete" }).className;
      const danger = classOf();
      rerender(<Basic dialog={{ defaultOpen: true }} tone="neutral" />);
      expect(classOf()).not.toBe(danger);
    });
  });

  describe("standard props", () => {
    it("forwards className, style, id, data-testid and ref to the panel", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <AlertDialog defaultOpen>
          <AlertDialog.Content
            ref={ref}
            className="custom"
            style={{ opacity: 0.99 }}
            id="the-alert"
            data-testid="panel"
          >
            <AlertDialog.Header>
              <AlertDialog.Title>T</AlertDialog.Title>
              <AlertDialog.Description>D</AlertDialog.Description>
            </AlertDialog.Header>
          </AlertDialog.Content>
        </AlertDialog>,
      );
      const panel = screen.getByTestId("panel");
      expect(panel).toBe(screen.getByRole("alertdialog"));
      expect(panel).toHaveClass("custom");
      expect(panel).toHaveAttribute("id", "the-alert");
      expect(panel).toHaveStyle({ opacity: "0.99" });
      expect(ref.current).toBe(panel);
    });

    it("does not let a consumer prop replace the role, the state or aria-modal", () => {
      render(
        <AlertDialog defaultOpen>
          <AlertDialog.Content
            data-testid="panel"
            {...({ role: "dialog", "data-state": "closed", "aria-modal": "false" } as object)}
          >
            <AlertDialog.Header>
              <AlertDialog.Title>T</AlertDialog.Title>
              <AlertDialog.Description>D</AlertDialog.Description>
            </AlertDialog.Header>
          </AlertDialog.Content>
        </AlertDialog>,
      );
      const panel = screen.getByTestId("panel");
      expect(panel).toHaveAttribute("role", "alertdialog");
      expect(panel).toHaveAttribute("data-state", "open");
      expect(panel).toHaveAttribute("aria-modal", "true");
    });

    it("forwards the ref, className and data-testid of every sub-part", () => {
      const refs = {
        trigger: createRef<HTMLButtonElement>(),
        header: createRef<HTMLDivElement>(),
        title: createRef<HTMLHeadingElement>(),
        description: createRef<HTMLParagraphElement>(),
        body: createRef<HTMLDivElement>(),
        footer: createRef<HTMLDivElement>(),
        cancel: createRef<HTMLButtonElement>(),
        action: createRef<HTMLButtonElement>(),
      };
      render(
        <AlertDialog defaultOpen>
          <AlertDialog.Trigger ref={refs.trigger} className="t" data-testid="trigger">
            Open
          </AlertDialog.Trigger>
          <AlertDialog.Content>
            <AlertDialog.Header ref={refs.header} className="h" data-testid="header">
              <AlertDialog.Title ref={refs.title} className="ti" data-testid="title">
                Title
              </AlertDialog.Title>
              <AlertDialog.Description ref={refs.description} className="d" data-testid="description">
                Description
              </AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Body ref={refs.body} className="b" data-testid="body">
              Body
            </AlertDialog.Body>
            <AlertDialog.Footer ref={refs.footer} className="f" data-testid="footer">
              <AlertDialog.Cancel ref={refs.cancel} className="c" data-testid="cancel">
                Cancel
              </AlertDialog.Cancel>
              <AlertDialog.Action ref={refs.action} className="a" data-testid="action">
                Go
              </AlertDialog.Action>
            </AlertDialog.Footer>
          </AlertDialog.Content>
        </AlertDialog>,
      );
      const classes: Record<string, string> = {
        trigger: "t", header: "h", title: "ti", description: "d", body: "b", footer: "f", cancel: "c", action: "a",
      };
      for (const [name, ref] of Object.entries(refs)) {
        const element = screen.getByTestId(name);
        expect(ref.current, name).toBe(element);
        expect(element, name).toHaveClass(classes[name] as string);
      }
    });
  });

  describe("composition", () => {
    it("opened from a dialog, answers first on Escape and keeps a scrim press from reaching the dialog", async () => {
      const user = userEvent.setup();
      render(
        <Dialog defaultOpen>
          <Dialog.Content aria-label="Outer">
            <Dialog.Body>
              <AlertDialog>
                <AlertDialog.Trigger>Delete</AlertDialog.Trigger>
                <AlertDialog.Content>
                  <AlertDialog.Header>
                    <AlertDialog.Title>Sure?</AlertDialog.Title>
                    <AlertDialog.Description>This cannot be undone.</AlertDialog.Description>
                  </AlertDialog.Header>
                  <AlertDialog.Footer>
                    <AlertDialog.Cancel>No</AlertDialog.Cancel>
                  </AlertDialog.Footer>
                </AlertDialog.Content>
              </AlertDialog>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog>,
      );
      await user.click(screen.getByRole("button", { name: "Delete" }));
      const alert = await screen.findByRole("alertdialog", { name: "Sure?" });
      await user.click(alert.parentElement as HTMLElement);
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      // while the alert is open the dialog behind it is hidden from assistive technology, so look it up hidden
      expect(screen.getByRole("dialog", { name: "Outer", hidden: true })).toBeInTheDocument();
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
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
      expect(await screen.findByRole("alertdialog", { name: "Delete project?" })).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Keep it" }));
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    });

    it("lets a Button replace the trigger through asChild", async () => {
      const user = userEvent.setup();
      render(
        <AlertDialog>
          <AlertDialog.Trigger asChild>
            <Button variant="destructive">Remove</Button>
          </AlertDialog.Trigger>
          <AlertDialog.Content>
            <AlertDialog.Header>
              <AlertDialog.Title>Remove?</AlertDialog.Title>
              <AlertDialog.Description>Gone.</AlertDialog.Description>
            </AlertDialog.Header>
          </AlertDialog.Content>
        </AlertDialog>,
      );
      await user.click(screen.getByRole("button", { name: "Remove" }));
      expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it.each(["neutral", "info", "warning", "danger"] as const)("has no axe violations (%s)", async (tone) => {
      render(<Basic dialog={{ defaultOpen: true }} tone={tone} />);
      expect((await axe(document.body)).violations).toHaveLength(0);
    });

    it("has no axe violations acknowledge-only, and after a nudge", async () => {
      const user = userEvent.setup();
      render(
        <AlertDialog defaultOpen>
          <AlertDialog.Content tone="danger">
            <AlertDialog.Header>
              <AlertDialog.Title>Couldn&apos;t save</AlertDialog.Title>
              <AlertDialog.Description>The connection dropped.</AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer>
              <AlertDialog.Action>OK</AlertDialog.Action>
            </AlertDialog.Footer>
          </AlertDialog.Content>
        </AlertDialog>,
      );
      expect((await axe(document.body)).violations).toHaveLength(0);
      await user.click(screen.getByRole("alertdialog").parentElement as HTMLElement);
      expect((await axe(document.body)).violations).toHaveLength(0);
    });

    it("has no axe violations with a field in the body and a disabled Action", async () => {
      render(
        <AlertDialog defaultOpen>
          <AlertDialog.Content tone="danger">
            <AlertDialog.Header>
              <AlertDialog.Title>Delete Atlas?</AlertDialog.Title>
              <AlertDialog.Description>Type its name to confirm.</AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <input aria-label="Project name" />
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <AlertDialog.Cancel>Keep it</AlertDialog.Cancel>
              <AlertDialog.Action disabled>Delete</AlertDialog.Action>
            </AlertDialog.Footer>
          </AlertDialog.Content>
        </AlertDialog>,
      );
      expect((await axe(document.body)).violations).toHaveLength(0);
    });

    it("has no axe violations busy, with a body and the largest size", async () => {
      render(
        <AlertDialog defaultOpen>
          <AlertDialog.Content busy size="lg" tone="warning">
            <AlertDialog.Header>
              <AlertDialog.Title>Discard changes?</AlertDialog.Title>
              <AlertDialog.Description>These edits will be lost.</AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <ul>
                <li>Name</li>
              </ul>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <AlertDialog.Cancel>Keep editing</AlertDialog.Cancel>
              <AlertDialog.Action>Discard</AlertDialog.Action>
            </AlertDialog.Footer>
          </AlertDialog.Content>
        </AlertDialog>,
      );
      expect((await axe(document.body)).violations).toHaveLength(0);
    });
  });

  describe("onOpenChangeComplete", () => {
    it("says when it has finished opening and when it has finished closing", async () => {
      const complete = vi.fn();
      const user = userEvent.setup();
      render(<Basic dialog={{ onOpenChangeComplete: complete }} />);
      await user.click(screen.getByRole("button", { name: "Open" }));
      await waitFor(() => expect(complete).toHaveBeenCalledWith(true));
      await user.click(screen.getByRole("button", { name: "Keep it" }));
      await waitFor(() => expect(complete).toHaveBeenCalledWith(false));
      expect(complete.mock.calls.map(([value]) => value)).toEqual([true, false]);
    });
  });

  describe("returning focus", () => {
    // A AlertDialog opened from state has no trigger of its own for Radix to return focus to, so it returns it to
    // whatever had focus when it opened.
    function FromState({ onCloseAutoFocus }: { onCloseAutoFocus?: (event: Event) => void }) {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open from state
          </button>
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialog.Content onCloseAutoFocus={onCloseAutoFocus}>
              <AlertDialog.Header>
                <AlertDialog.Title>Delete?</AlertDialog.Title>
                <AlertDialog.Description>Sure?</AlertDialog.Description>
              </AlertDialog.Header>
              <AlertDialog.Footer>
                <AlertDialog.Cancel>Keep it</AlertDialog.Cancel>
              </AlertDialog.Footer>
            </AlertDialog.Content>
          </AlertDialog>
        </>
      );
    }

    it("returns focus to the element that was focused when it opened", async () => {
      const user = userEvent.setup();
      render(<FromState />);
      await user.click(screen.getByRole("button", { name: "Open from state" }));
      await screen.findByRole("alertdialog");
      await user.click(screen.getByRole("button", { name: "Keep it" }));
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      await waitFor(() => expect(screen.getByRole("button", { name: "Open from state" })).toHaveFocus());
    });

    it("leaves focus where the caller put it when onCloseAutoFocus was prevented", async () => {
      const user = userEvent.setup();
      render(<FromState onCloseAutoFocus={(event) => event.preventDefault()} />);
      await user.click(screen.getByRole("button", { name: "Open from state" }));
      await screen.findByRole("alertdialog");
      await user.click(screen.getByRole("button", { name: "Keep it" }));
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      expect(screen.getByRole("button", { name: "Open from state" })).not.toHaveFocus();
    });
  });
});
