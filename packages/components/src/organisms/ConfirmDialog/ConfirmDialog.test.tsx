import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode } from "react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "../../atoms/Button";
import { Dialog } from "../Dialog";
import { ConfirmDialog } from "./ConfirmDialog";

type Props = Partial<ComponentProps<typeof ConfirmDialog>>;

function Basic(props: Props) {
  return (
    <ConfirmDialog
      trigger={<Button>Open</Button>}
      title="Delete project?"
      description="This removes it for good."
      labels={{ confirm: "Delete", cancel: "Keep it" }}
      {...props}
    />
  );
}

// A promise the test settles by hand, so "pending" can be looked at.
function deferred() {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ConfirmDialog", () => {
  it("renders only the trigger while closed", () => {
    render(<Basic />);
    expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("opens as a named, described, modal alertdialog with no warning", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole("button", { name: "Open" }));
    const dialog = await screen.findByRole("alertdialog", { name: "Delete project?" });
    expect(dialog).toHaveAccessibleDescription("This removes it for good.");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it("warns once in development when nothing can open it", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(<ConfirmDialog title="Nothing opens me" />);
    expect(warn.mock.calls.filter(([message]) => String(message).includes("nothing can open it"))).toHaveLength(1);
  });

  it("does not warn when it is controlled closed", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(<ConfirmDialog title="Controlled" open={false} />);
    expect(warn).not.toHaveBeenCalled();
  });

  describe("words", () => {
    it("uses English defaults for the buttons", async () => {
      render(<ConfirmDialog defaultOpen title="Sure?" description="Really." />);
      expect(await screen.findByRole("button", { name: "Confirm" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    });

    it("keeps a default whose label is passed as undefined", async () => {
      render(<ConfirmDialog defaultOpen title="Sure?" description="Really." labels={{ confirm: undefined, cancel: "Back" }} />);
      expect(await screen.findByRole("button", { name: "Confirm" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
    });
  });

  describe("answering", () => {
    it("closes on confirm, calling onConfirm once and reporting the reason", async () => {
      const onConfirm = vi.fn();
      const onOpenChange = vi.fn();
      const onCancel = vi.fn();
      const user = userEvent.setup();
      render(<Basic onConfirm={onConfirm} onOpenChange={onOpenChange} onCancel={onCancel} />);
      await user.click(screen.getByRole("button", { name: "Open" }));
      await user.click(await screen.findByRole("button", { name: "Delete" }));
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: "action" });
      expect(onCancel).not.toHaveBeenCalled();
    });

    it("reports the trigger as the reason it opened", async () => {
      const onOpenChange = vi.fn();
      const user = userEvent.setup();
      render(<Basic onOpenChange={onOpenChange} />);
      await user.click(screen.getByRole("button", { name: "Open" }));
      expect(onOpenChange).toHaveBeenCalledWith(true, { reason: "trigger" });
    });

    it("closes on cancel and calls onCancel, not onConfirm", async () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      const onOpenChange = vi.fn();
      const user = userEvent.setup();
      render(<Basic onConfirm={onConfirm} onCancel={onCancel} onOpenChange={onOpenChange} defaultOpen />);
      await user.click(await screen.findByRole("button", { name: "Keep it" }));
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onConfirm).not.toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: "cancel" });
    });

    it("answers Escape as a cancel", async () => {
      const onCancel = vi.fn();
      const onOpenChange = vi.fn();
      const user = userEvent.setup();
      render(<Basic onCancel={onCancel} onOpenChange={onOpenChange} defaultOpen />);
      await screen.findByRole("alertdialog");
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: "escape" });
    });

    it("ignores Escape when closeOnEscape is off", async () => {
      const user = userEvent.setup();
      render(<Basic closeOnEscape={false} defaultOpen />);
      await screen.findByRole("alertdialog");
      await user.keyboard("{Escape}");
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });

    it("does not close on a press on the scrim", async () => {
      const user = userEvent.setup();
      render(<Basic defaultOpen />);
      const dialog = await screen.findByRole("alertdialog");
      await user.click(dialog.parentElement as HTMLElement);
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });
  });

  describe("a promise from onConfirm", () => {
    it("stays open and busy until it resolves, then closes with the reason action", async () => {
      const pending = deferred();
      const onOpenChange = vi.fn();
      const user = userEvent.setup();
      render(<Basic onConfirm={() => pending.promise} onOpenChange={onOpenChange} defaultOpen />);
      await user.click(await screen.findByRole("button", { name: "Delete" }));
      const dialog = screen.getByRole("alertdialog");
      expect(dialog).toHaveAttribute("aria-busy", "true");
      expect(onOpenChange).not.toHaveBeenCalled();
      // the button keeps its name and stays focusable, with a spinner drawn in it
      const confirm = screen.getByRole("button", { name: "Delete" });
      expect(confirm).toHaveAttribute("aria-disabled", "true");
      expect(confirm).not.toBeDisabled();
      await act(async () => pending.resolve());
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "action" });
    });

    it("ignores a second press, Escape and cancel while it is pending", async () => {
      const pending = deferred();
      const onConfirm = vi.fn(() => pending.promise);
      const onCancel = vi.fn();
      const user = userEvent.setup();
      render(<Basic onConfirm={onConfirm} onCancel={onCancel} defaultOpen />);
      await user.click(await screen.findByRole("button", { name: "Delete" }));
      await user.click(screen.getByRole("button", { name: "Delete" }));
      await user.click(screen.getByRole("button", { name: "Keep it" }));
      await user.keyboard("{Escape}");
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onCancel).not.toHaveBeenCalled();
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      await act(async () => pending.resolve());
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    });

    it("stays open and stops being busy when it rejects, reporting the error", async () => {
      const failure = new Error("network down");
      const pending = deferred();
      const onConfirmError = vi.fn();
      const onOpenChange = vi.fn();
      const user = userEvent.setup();
      render(
        <Basic onConfirm={() => pending.promise} onConfirmError={onConfirmError} onOpenChange={onOpenChange} defaultOpen />,
      );
      await user.click(await screen.findByRole("button", { name: "Delete" }));
      expect(screen.getByRole("alertdialog")).toHaveAttribute("aria-busy", "true");
      await act(async () => pending.reject(failure));
      await waitFor(() => expect(screen.getByRole("alertdialog")).not.toHaveAttribute("aria-busy"));
      expect(onConfirmError).toHaveBeenCalledWith(failure);
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      // and it can be answered again
      expect(screen.getByRole("button", { name: "Delete" })).not.toHaveAttribute("aria-disabled");
    });

    it("can be confirmed again after a failure", async () => {
      const first = deferred();
      const onConfirm = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(undefined);
      const user = userEvent.setup();
      render(<Basic onConfirm={onConfirm} onConfirmError={() => undefined} defaultOpen />);
      await user.click(await screen.findByRole("button", { name: "Delete" }));
      await act(async () => first.reject(new Error("no")));
      await waitFor(() => expect(screen.getByRole("alertdialog")).not.toHaveAttribute("aria-busy"));
      await user.click(screen.getByRole("button", { name: "Delete" }));
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      expect(onConfirm).toHaveBeenCalledTimes(2);
    });

    it("leaves a controlled dialog open until the owner closes it, after reporting the reason", async () => {
      const pending = deferred();
      const onOpenChange = vi.fn();
      const user = userEvent.setup();
      render(<Basic open onConfirm={() => pending.promise} onOpenChange={onOpenChange} />);
      await user.click(await screen.findByRole("button", { name: "Delete" }));
      await act(async () => pending.resolve());
      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "action" }));
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });

    it("sets no state and reports nothing once it has unmounted", async () => {
      const pending = deferred();
      const onOpenChange = vi.fn();
      const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
      const user = userEvent.setup();
      const { unmount } = render(<Basic onConfirm={() => pending.promise} onOpenChange={onOpenChange} defaultOpen />);
      await user.click(await screen.findByRole("button", { name: "Delete" }));
      unmount();
      await act(async () => pending.resolve());
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
    });

    it("works in StrictMode", async () => {
      const pending = deferred();
      const user = userEvent.setup();
      render(
        <StrictMode>
          <Basic onConfirm={() => pending.promise} defaultOpen />
        </StrictMode>,
      );
      await user.click(await screen.findByRole("button", { name: "Delete" }));
      expect(screen.getByRole("alertdialog")).toHaveAttribute("aria-busy", "true");
      await act(async () => pending.resolve());
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    });
  });

  describe("busy", () => {
    it("marks the dialog busy and blocks Escape, cancel and confirm", async () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      const user = userEvent.setup();
      render(<Basic busy onConfirm={onConfirm} onCancel={onCancel} defaultOpen />);
      const dialog = await screen.findByRole("alertdialog");
      expect(dialog).toHaveAttribute("aria-busy", "true");
      await user.keyboard("{Escape}");
      await user.click(screen.getByRole("button", { name: "Keep it" }));
      await user.click(screen.getByRole("button", { name: "Delete" }));
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      expect(onConfirm).not.toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe("focus", () => {
    it("starts on cancel, and returns to the trigger on close", async () => {
      const user = userEvent.setup();
      render(<Basic />);
      const trigger = screen.getByRole("button", { name: "Open" });
      await user.click(trigger);
      await waitFor(() => expect(screen.getByRole("button", { name: "Keep it" })).toHaveFocus());
      await user.keyboard("{Escape}");
      await waitFor(() => expect(trigger).toHaveFocus());
    });

    it("lets initialFocus choose the element", async () => {
      const target = createRef<HTMLButtonElement>();
      render(
        <ConfirmDialog
          defaultOpen
          title="Sure?"
          description="Really."
          initialFocus={target}
          // a child the ref can point at
        >
          <button type="button" ref={target}>
            Chosen
          </button>
        </ConfirmDialog>,
      );
      await waitFor(() => expect(screen.getByRole("button", { name: "Chosen" })).toHaveFocus());
    });
  });

  describe("requireText", () => {
    it("adds a labelled field that takes focus, and keeps confirm disabled until it matches", async () => {
      const onConfirm = vi.fn();
      const user = userEvent.setup();
      render(<Basic requireText="Atlas" onConfirm={onConfirm} defaultOpen />);
      const field = await screen.findByRole("textbox", { name: "Type “Atlas” to confirm" });
      await waitFor(() => expect(field).toHaveFocus());
      const confirm = screen.getByRole("button", { name: "Delete" });
      expect(confirm).toBeDisabled();
      await user.type(field, "atlas");
      expect(confirm).toBeDisabled();
      await user.clear(field);
      await user.type(field, "Atlas");
      expect(confirm).toBeEnabled();
      await user.click(confirm);
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("ignores spaces at either end of what is typed", async () => {
      const user = userEvent.setup();
      render(<Basic requireText="Atlas" defaultOpen />);
      await user.type(await screen.findByRole("textbox"), "  Atlas ");
      expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled();
    });

    it("confirms on Enter once it matches, and not before", async () => {
      const onConfirm = vi.fn();
      const user = userEvent.setup();
      render(<Basic requireText="Atlas" onConfirm={onConfirm} defaultOpen />);
      const field = await screen.findByRole("textbox");
      await user.type(field, "Atl{Enter}");
      expect(onConfirm).not.toHaveBeenCalled();
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      await user.type(field, "as{Enter}");
      expect(onConfirm).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    });

    it("holds the field read-only, not disabled, while an answer is pending", async () => {
      const pending = deferred();
      const user = userEvent.setup();
      render(<Basic requireText="Atlas" onConfirm={() => pending.promise} defaultOpen />);
      const field = await screen.findByRole("textbox");
      await user.type(field, "Atlas{Enter}");
      expect(field).toHaveAttribute("readonly");
      expect(field).not.toBeDisabled();
      expect(field).toHaveFocus();
      await act(async () => pending.resolve());
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    });

    it("starts empty every time it opens", async () => {
      const user = userEvent.setup();
      render(<Basic requireText="Atlas" />);
      await user.click(screen.getByRole("button", { name: "Open" }));
      await user.type(await screen.findByRole("textbox"), "Atl");
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      await user.click(screen.getByRole("button", { name: "Open" }));
      expect(await screen.findByRole("textbox")).toHaveValue("");
    });

    it("draws no field for an empty string", async () => {
      render(<Basic requireText="" defaultOpen />);
      await screen.findByRole("alertdialog");
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled();
    });

    it("uses the label function from labels", async () => {
      render(<Basic requireText="Atlas" labels={{ requireText: (text) => `Écrivez ${text}` }} defaultOpen />);
      expect(await screen.findByRole("textbox", { name: "Écrivez Atlas" })).toBeInTheDocument();
    });

    it("starts focus on the field, not cancel, even though cancel is the safe choice", async () => {
      render(<Basic requireText="Atlas" defaultOpen />);
      const field = await screen.findByRole("textbox");
      await waitFor(() => expect(field).toHaveFocus());
      expect(screen.getByRole("button", { name: "Keep it" })).not.toHaveFocus();
    });
  });

  describe("content and the standard props", () => {
    it("draws children between the description and the buttons", async () => {
      render(
        <Basic defaultOpen>
          <p>Three files are affected.</p>
        </Basic>,
      );
      expect(await screen.findByText("Three files are affected.")).toBeInTheDocument();
    });

    it("forwards the ref and the standard props to the panel", async () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <Basic ref={ref} id="confirm" className="mine" style={{ color: "red" }} data-testid="panel" defaultOpen />,
      );
      const dialog = await screen.findByRole("alertdialog");
      expect(ref.current).toBe(dialog);
      expect(dialog).toHaveAttribute("id", "confirm");
      expect(dialog).toHaveAttribute("data-testid", "panel");
      expect(dialog).toHaveClass("mine");
      expect(dialog).toHaveStyle({ color: "rgb(255, 0, 0)" });
    });

    it("cannot have its role, modality or state replaced by a prop", async () => {
      const hostile = { role: "dialog", "aria-modal": "false", "data-state": "closed" } as unknown as Props;
      render(<Basic {...hostile} defaultOpen />);
      const dialog = await screen.findByRole("alertdialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("data-state", "open");
    });

    it("shows each tone's icon, and none for icon={false}", async () => {
      const { rerender } = render(<Basic tone="danger" defaultOpen />);
      const dialog = await screen.findByRole("alertdialog");
      expect(dialog.querySelector("svg")).not.toBeNull();
      rerender(<Basic tone="danger" icon={false} defaultOpen />);
      expect(screen.getByRole("alertdialog").querySelector("svg")).toBeNull();
    });

    it("makes the confirm destructive for the danger tone", async () => {
      const { rerender } = render(<Basic tone="danger" defaultOpen />);
      const danger = (await screen.findByRole("button", { name: "Delete" })).className;
      rerender(<Basic tone="neutral" defaultOpen />);
      const neutral = screen.getByRole("button", { name: "Delete" }).className;
      expect(danger).toContain("variantDestructive");
      expect(neutral).toContain("variantPrimary");
    });
  });

  describe("controlled", () => {
    it("follows the open prop and reports changes without changing itself", async () => {
      const onOpenChange = vi.fn();
      const user = userEvent.setup();
      const { rerender } = render(<Basic open={false} onOpenChange={onOpenChange} />);
      await user.click(screen.getByRole("button", { name: "Open" }));
      expect(onOpenChange).toHaveBeenCalledWith(true, { reason: "trigger" });
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      rerender(<Basic open onOpenChange={onOpenChange} />);
      expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    });
  });

  describe("over a dialog", () => {
    it("answers Escape on the confirmation first, leaving the dialog open", async () => {
      const user = userEvent.setup();
      render(
        <Dialog defaultOpen>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Settings</Dialog.Title>
            </Dialog.Header>
            <Dialog.Footer>
              <ConfirmDialog
                trigger={<Button variant="destructive">Delete project</Button>}
                tone="danger"
                title="Delete project?"
                description="It cannot be undone."
              />
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog>,
      );
      await user.click(await screen.findByRole("button", { name: "Delete project" }));
      await screen.findByRole("alertdialog", { name: "Delete project?" });
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      expect(screen.getByRole("dialog", { name: "Settings" })).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it.each(["neutral", "info", "warning", "danger"] as const)("has no axe violations (%s)", async (tone) => {
      render(<Basic tone={tone} defaultOpen />);
      await screen.findByRole("alertdialog");
      expect((await axe(document.body)).violations).toHaveLength(0);
    });

    it("has no axe violations while an answer is pending", async () => {
      const pending = deferred();
      const user = userEvent.setup();
      render(<Basic tone="danger" onConfirm={() => pending.promise} defaultOpen />);
      await user.click(await screen.findByRole("button", { name: "Delete" }));
      expect((await axe(document.body)).violations).toHaveLength(0);
      await act(async () => pending.resolve());
    });

    it("has no axe violations with a type-to-confirm field and a body", async () => {
      render(
        <Basic tone="danger" requireText="Atlas" defaultOpen>
          <p>Everything in it goes too.</p>
        </Basic>,
      );
      await screen.findByRole("alertdialog");
      expect((await axe(document.body)).violations).toHaveLength(0);
    });
  });
});
