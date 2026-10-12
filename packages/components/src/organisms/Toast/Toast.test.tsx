import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useEffect, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Toast, useToast } from "./Toast";
import styles from "./Toast.module.css";
import type { ToastApi, ToastProviderProps } from "./Toast.types";

// Where the hook's functions are handed out, so a test can call them outside a click.
const captured: { api: ToastApi } = { api: undefined as unknown as ToastApi };
const api = new Proxy({} as ToastApi, { get: (_target, key) => captured.api[key as keyof ToastApi] });
function Capture() {
  const value = useToast();
  useEffect(() => {
    captured.api = value;
  });
  return null;
}

function Provider(props: Partial<ToastProviderProps> & { children?: React.ReactNode }) {
  const { children, ...rest } = props;
  return (
    <Toast.Provider {...rest}>
      <Capture />
      {children}
    </Toast.Provider>
  );
}

// jsdom runs no animations, so a toast that is closing waits for an `animationend` that never comes: say it ended.
const animationEnd = (element: Element | null) => {
  if (element) fireEvent(element, new Event("webkitAnimationEnd", { bubbles: true }));
};
const toasts = () => screen.queryAllByRole("listitem");
const region = () => screen.getByRole("region", { name: /notifications/i });

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Toast.Provider", () => {
  it("is a landmark named for its hotkey, with no toasts to begin with", () => {
    render(<Provider />);
    expect(region()).toHaveAccessibleName("Notifications (F8)");
    expect(toasts()).toHaveLength(0);
  });

  it("takes its name and the text it supplies from `labels`, an undefined one keeping its default", () => {
    render(<Provider labels={{ viewport: "Meldungen ({hotkey})", dismiss: undefined }} />);
    act(() => {
      api.toast({ title: "Gespeichert" });
    });
    expect(screen.getByRole("region", { name: "Meldungen (F8)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
  });

  it("names the hotkey it is given", () => {
    render(<Provider hotkey={["altKey", "KeyT"]} />);
    expect(region()).toHaveAccessibleName("Notifications (alt+T)");
  });

  it("is drawn into the body, or into `container`", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    render(<Provider container={container} />);
    expect(container).toContainElement(region());
    container.remove();
  });

  it("forwards its ref to the list the toasts are in, with className, style, id and data-testid there", () => {
    const ref = createRef<HTMLOListElement>();
    render(<Toast.Provider ref={ref} className="mine" style={{ color: "red" }} id="toasts" data-testid="viewport" />);
    expect(ref.current).toBe(screen.getByTestId("viewport"));
    expect(ref.current?.tagName).toBe("OL");
    expect(ref.current).toHaveClass("mine");
    expect(ref.current).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(ref.current).toHaveAttribute("id", "toasts");
  });

  it("lets a same-named prop not replace the direction or placement in effect", () => {
    render(<Provider placement="top" dir="rtl" data-testid="viewport" {...({ "data-placement": "bottom" } as object)} />);
    expect(screen.getByTestId("viewport")).toHaveAttribute("data-placement", "top");
    expect(screen.getByTestId("viewport")).toHaveAttribute("dir", "rtl");
  });

  it("is placed at the bottom end by default, and takes a responsive map", () => {
    const { unmount } = render(<Provider data-testid="viewport" />);
    expect(screen.getByTestId("viewport")).toHaveAttribute("data-placement", "bottom-end");
    unmount();
    render(<Provider data-testid="viewport" placement={{ base: "top", md: "bottom-start" }} />);
    expect(screen.getByTestId("viewport")).toHaveAttribute("data-placement", "top");
  });
});

describe("toast()", () => {
  it("shows a titled and described toast and returns its id", () => {
    render(<Provider />);
    let id = "";
    act(() => {
      id = api.toast({ title: "Saved", description: "Your changes are live." });
    });
    expect(id).not.toBe("");
    const item = within(region()).getByRole("listitem");
    expect(item).toHaveTextContent("Saved");
    expect(item).toHaveTextContent("Your changes are live.");
  });

  it("takes a plain string as the title", () => {
    render(<Provider />);
    act(() => {
      api.toast("Copied");
    });
    expect(within(region()).getByText("Copied")).toBeInTheDocument();
  });

  it("draws each tone with its own look, and the variant and size it is given", () => {
    render(<Provider variant="outlined" size="lg" />);
    act(() => {
      api.toast({ title: "Oops", tone: "danger" });
    });
    const item = toasts()[0] as HTMLElement;
    expect(item).toHaveClass(styles.toneDanger as string);
    expect(item).toHaveClass(styles.variantOutlined as string);
    expect(item).toHaveClass(styles.sizeLg as string);
  });

  it("updates the toast with the same id instead of adding another", () => {
    render(<Provider />);
    act(() => {
      api.toast({ id: "one", title: "First" });
      api.toast({ id: "one", title: "Second" });
    });
    expect(toasts()).toHaveLength(1);
    expect(toasts()[0]).toHaveTextContent("Second");
    expect(toasts()[0]).not.toHaveTextContent("First");
  });

  it("changes a toast with update(), keeping the rest of it", () => {
    render(<Provider />);
    let id = "";
    act(() => {
      id = api.toast({ title: "Uploading", description: "3 files" });
    });
    act(() => api.update(id, { title: "Uploaded" }));
    expect(toasts()[0]).toHaveTextContent("Uploaded");
    expect(toasts()[0]).toHaveTextContent("3 files");
  });

  it("ignores update() and dismiss() for an id that is not there", () => {
    render(<Provider />);
    expect(() => {
      act(() => {
        api.update("nope", { title: "x" });
        api.dismiss("nope");
      });
    }).not.toThrow();
  });

  it("shows at most `limit` at once and brings the rest in as room is made", async () => {
    render(<Provider limit={2} />);
    act(() => {
      api.toast({ id: "a", title: "A" });
      api.toast({ id: "b", title: "B" });
      api.toast({ id: "c", title: "C" });
    });
    expect(toasts().map((item) => item.textContent)).toEqual([expect.stringContaining("A"), expect.stringContaining("B")]);
    act(() => api.dismiss("a"));
    animationEnd(screen.queryByText("A")?.closest("li") ?? null);
    await waitFor(() => expect(screen.queryByText("C")).toBeInTheDocument());
    expect(screen.queryByText("A")).not.toBeInTheDocument();
  });

  it("closes every toast and drops the ones waiting with dismissAll()", async () => {
    render(<Provider limit={1} />);
    act(() => {
      api.toast({ id: "a", title: "A" });
      api.toast({ id: "b", title: "B" });
    });
    act(() => api.dismissAll());
    animationEnd(screen.queryByText("A")?.closest("li") ?? null);
    await waitFor(() => expect(toasts()).toHaveLength(0));
    expect(screen.queryByText("B")).not.toBeInTheDocument();
  });
});

describe("a toast's announcement", () => {
  it("interrupts for danger and warning and waits for the rest", async () => {
    render(<Provider />);
    act(() => {
      api.toast({ title: "Failed", tone: "danger" });
      api.toast({ title: "Heads up", tone: "warning" });
      api.toast({ title: "Saved", tone: "success" });
    });
    // The text goes into the live regions a frame after they are in the page, which is what makes it a change.
    await waitFor(() => expect(document.querySelectorAll("[aria-live]")).toHaveLength(3));
    await waitFor(() => expect(document.querySelector("[aria-live]")?.textContent).not.toBe(""));
    const live = Array.from(document.querySelectorAll("[aria-live]"));
    expect(live.filter((node) => node.getAttribute("aria-live") === "assertive").map((node) => node.textContent)).toEqual([
      expect.stringContaining("Failed"),
      expect.stringContaining("Heads up"),
    ]);
    expect(live.filter((node) => node.getAttribute("aria-live") === "polite").map((node) => node.textContent)).toEqual([
      expect.stringContaining("Saved"),
    ]);
  });

  it("takes the role it is given over the tone's", async () => {
    render(<Provider />);
    act(() => {
      api.toast({ title: "Quiet", tone: "danger", role: "status" });
    });
    await waitFor(() => expect(document.querySelector("[aria-live]")).toHaveAttribute("aria-live", "polite"));
  });

  it("reads the notification label before the text, and the action's alternative in place of the button", async () => {
    render(<Provider />);
    act(() => {
      api.toast({ title: "Deleted", action: { label: "Undo", altText: "Undo from the Edit menu" } });
    });
    await waitFor(() => expect(document.querySelector("[aria-live]")?.textContent).not.toBe(""));
    const announced = document.querySelector("[aria-live]")?.textContent ?? "";
    expect(announced).toContain("Notification");
    expect(announced).toContain("Deleted");
    expect(announced).toContain("Undo from the Edit menu");
  });
});

describe("a toast's time", () => {
  it("closes by itself after the provider's duration, reporting a timeout", () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    render(<Provider duration={1000} />);
    act(() => {
      api.toast({ title: "Saved", onOpenChange });
    });
    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(onOpenChange).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "timeout" });
  });

  it("takes its own duration over the provider's", () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    render(<Provider duration={10000} />);
    act(() => {
      api.toast({ title: "Quick", duration: 500, onOpenChange });
    });
    act(() => {
      vi.advanceTimersByTime(501);
    });
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });

  it("stays until it is dismissed with a duration of null", () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    render(<Provider duration={100} />);
    act(() => {
      api.toast({ title: "Sticky", duration: null, onOpenChange });
    });
    act(() => {
      vi.advanceTimersByTime(60000);
    });
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(toasts()).toHaveLength(1);
  });

  it("is held while the pointer is over the toasts and carries on with what was left", () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    render(<Provider duration={1000} />);
    act(() => {
      api.toast({ title: "Saved", onOpenChange });
    });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    fireEvent.pointerMove(region());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onOpenChange).not.toHaveBeenCalled();
    fireEvent.pointerLeave(region());
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onOpenChange).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });

  it("is held while focus is inside the toasts", () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    render(<Provider duration={1000} />);
    act(() => {
      api.toast({ title: "Saved", onOpenChange });
    });
    act(() => {
      screen.getByRole("button", { name: "Dismiss" }).focus();
      vi.advanceTimersByTime(5000);
    });
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe("closing", () => {
  it("is done by the dismiss button, with the reason and the exit", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onOpenChangeComplete = vi.fn();
    render(<Provider />);
    act(() => {
      api.toast({ title: "Saved", onOpenChange, onOpenChangeComplete });
    });
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "dismiss" });
    animationEnd(screen.queryByText("Saved")?.closest("li") ?? null);
    await waitFor(() => expect(toasts()).toHaveLength(0));
    expect(onOpenChangeComplete).toHaveBeenLastCalledWith(false);
  });

  it("is done by dismiss() with the reason 'programmatic'", async () => {
    const onOpenChange = vi.fn();
    render(<Provider />);
    let id = "";
    act(() => {
      id = api.toast({ title: "Saved", onOpenChange });
    });
    act(() => api.dismiss(id));
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "programmatic" });
  });

  it("is done by Escape from inside the toast", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Provider />);
    act(() => {
      api.toast({ title: "Saved", onOpenChange });
    });
    screen.getByRole("button", { name: "Dismiss" }).focus();
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "escape" });
  });

  it("has no dismiss button when `dismissible` is false", () => {
    render(<Provider />);
    act(() => {
      api.toast({ title: "Saved", dismissible: false });
    });
    expect(screen.queryByRole("button", { name: "Dismiss" })).not.toBeInTheDocument();
  });
});

describe("an action", () => {
  it("runs its handler, closes the toast and says it was the action", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onOpenChange = vi.fn();
    render(<Provider />);
    act(() => {
      api.toast({ title: "Deleted", action: { label: "Undo", altText: "Undo from the Edit menu", onClick }, onOpenChange });
    });
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "action" });
  });

  it("is a button of the toast's own size, with the variant it is given", () => {
    render(<Provider size="lg" />);
    act(() => {
      api.toast({ title: "Saved", action: { label: "View", altText: "Open it from the list", variant: "tertiary" } });
    });
    expect(screen.getByRole("button", { name: "View" })).toHaveClass(styles.actionTertiary as string);
  });

  it("complains, in development, of an alternative that is missing", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<Provider />);
    act(() => {
      api.toast({ title: "Saved", action: { label: "Undo", altText: "" } });
    });
    expect(error).toHaveBeenCalled();
  });

  it("falls back to primary for a variant that is not one of ours, with a warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(
      <Toast.Provider>
        <Toast>
          <Toast.Action altText="Do it elsewhere" variant={"loud" as never}>
            Go
          </Toast.Action>
        </Toast>
      </Toast.Provider>,
    );
    expect(screen.getByRole("button", { name: "Go" })).toHaveClass(styles.actionPrimary as string);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Toast.Action"));
  });
});

describe("loading and toast.promise()", () => {
  it("shows a spinner in place of the icon and stays until it is updated", () => {
    vi.useFakeTimers();
    render(<Provider duration={100} />);
    act(() => {
      api.toast({ title: "Saving…", loading: true });
    });
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(toasts()).toHaveLength(1);
    expect(toasts()[0]?.querySelector(`.${styles.icon}`)?.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("replaces the loading toast with the success one, in the same place", async () => {
    render(<Provider />);
    let resolve: (value: number) => void = () => undefined;
    const pending = new Promise<number>((done) => {
      resolve = done;
    });
    act(() => {
      void api.toast.promise(pending, {
        loading: "Saving…",
        success: (count) => ({ title: `Saved ${count} files`, description: "All done." }),
        error: "Could not save",
      });
    });
    expect(screen.getByText("Saving…")).toBeInTheDocument();
    await act(async () => {
      resolve(3);
      await pending;
    });
    expect(toasts()).toHaveLength(1);
    expect(toasts()[0]).toHaveTextContent("Saved 3 files");
    expect(toasts()[0]).toHaveClass(styles.toneSuccess as string);
    expect(screen.queryByText("Saving…")).not.toBeInTheDocument();
  });

  it("shows the error one on a rejection, and leaves the rejection to the caller", async () => {
    render(<Provider />);
    const failure = new Error("nope");
    const pending = Promise.reject(failure);
    let outcome: unknown;
    act(() => {
      outcome = api.toast.promise(pending, {
        loading: "Saving…",
        success: "Saved",
        error: (reason) => `Failed: ${(reason as Error).message}`,
      });
    });
    await expect(outcome).rejects.toBe(failure);
    await waitFor(() => expect(toasts()[0]).toHaveTextContent("Failed: nope"));
    expect(toasts()[0]).toHaveClass(styles.toneDanger as string);
  });
});

describe("Toast, declared as parts", () => {
  function Declared({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
    const [open, setOpen] = useState(true);
    return (
      <Toast.Provider>
        <Toast
          tone="success"
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            onOpenChange?.(next);
          }}
        >
          <Toast.Title>Saved</Toast.Title>
          <Toast.Description>Your changes are live.</Toast.Description>
        </Toast>
        <button type="button" onClick={() => setOpen(true)}>
          Again
        </button>
      </Toast.Provider>
    );
  }

  it("draws its parts and takes the controlled open state", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Declared onOpenChange={onOpenChange} />);
    expect(toasts()[0]).toHaveTextContent("Saved");
    expect(toasts()[0]).toHaveTextContent("Your changes are live.");
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    animationEnd(screen.queryByText("Saved")?.closest("li") ?? null);
    await waitFor(() => expect(toasts()).toHaveLength(0));
    await user.click(screen.getByRole("button", { name: "Again" }));
    expect(toasts()).toHaveLength(1);
  });

  it("starts closed with defaultOpen={false}", () => {
    render(
      <Toast.Provider>
        <Toast defaultOpen={false}>
          <Toast.Title>Hidden</Toast.Title>
        </Toast>
      </Toast.Provider>,
    );
    expect(toasts()).toHaveLength(0);
  });

  it("forwards its ref and takes className, style, id and data-testid on the list item", () => {
    const ref = createRef<HTMLLIElement>();
    render(
      <Toast.Provider>
        <Toast ref={ref} className="mine" style={{ color: "red" }} id="t" data-testid="toast">
          <Toast.Title>Saved</Toast.Title>
        </Toast>
      </Toast.Provider>,
    );
    const item = screen.getByTestId("toast");
    expect(ref.current).toBe(item);
    expect(item.tagName).toBe("LI");
    expect(item).toHaveClass("mine");
    expect(item).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(item).toHaveAttribute("id", "t");
  });

  it("keeps a same-named prop from replacing the part's own class", () => {
    render(
      <Toast.Provider>
        <Toast tone="danger" {...({ "data-state": "closed" } as object)}>
          <Toast.Title data-testid="title">Saved</Toast.Title>
        </Toast>
      </Toast.Provider>,
    );
    expect(screen.getByTestId("title")).toHaveClass(styles.title as string);
    expect(toasts()[0]).toHaveAttribute("data-state", "open");
  });

  it("takes the provider's variant and size unless it says its own", () => {
    render(
      <Toast.Provider variant="solid" size="sm">
        <Toast data-testid="a">
          <Toast.Title>A</Toast.Title>
        </Toast>
        <Toast data-testid="b" variant="outlined" size="xl">
          <Toast.Title>B</Toast.Title>
        </Toast>
      </Toast.Provider>,
    );
    expect(screen.getByTestId("a")).toHaveClass(styles.variantSolid as string, styles.sizeSm as string);
    expect(screen.getByTestId("b")).toHaveClass(styles.variantOutlined as string, styles.sizeXl as string);
  });
});

describe("outside a provider", () => {
  it("does nothing from useToast(), with a warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    function Lonely() {
      const { toast } = useToast();
      return <button onClick={() => toast("Hi")}>Go</button>;
    }
    render(<Lonely />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Toast.Provider"));
    expect(() => fireEvent.click(screen.getByRole("button"))).not.toThrow();
  });
});

describe("StrictMode", () => {
  it("still closes by itself, and only once", () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    render(
      <StrictMode>
        <Provider duration={1000} />
      </StrictMode>,
    );
    act(() => {
      api.toast({ title: "Saved", onOpenChange });
    });
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });
});

describe("accessibility", () => {
  it.each(["info", "success", "warning", "danger", "neutral"] as const)("has no axe violations for a %s toast", async (tone) => {
    const { container } = render(<Provider />);
    act(() => {
      api.toast({ title: "Heads up", description: "Something happened.", tone, action: { label: "View", altText: "Open the list" } });
    });
    expect(await axe(document.body)).toHaveNoViolations();
    expect(container).toBeInTheDocument();
  });

  it.each(["subtle", "outlined", "solid"] as const)("has no axe violations for a %s toast", async (variant) => {
    render(<Provider variant={variant} />);
    act(() => {
      api.toast({ title: "Saved" });
    });
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
