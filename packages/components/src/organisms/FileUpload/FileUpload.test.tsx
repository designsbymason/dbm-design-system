import { act, createEvent, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { StrictMode, createRef, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FormField } from "../../molecules/FormField";
import { FileUpload } from "./FileUpload";
import type { FileUploadEntry, FileUploadProps } from "./FileUpload.types";

function makeFile(name: string, size = 1024, type = "text/plain"): File {
  const file = new File(["x"], name, { type });
  // The size is what the rules read; a real buffer of that length is never needed.
  Object.defineProperty(file, "size", { value: size });
  return file;
}

const entryOf = (file: File, patch: Partial<FileUploadEntry> = {}): FileUploadEntry => ({
  id: file.name,
  file,
  status: "idle",
  ...patch,
});

// The drop area is the box the button sits in.
const dropzone = () => screen.getByRole("button", { name: /^Choose/ }).parentElement as HTMLElement;
const hiddenInput = () => document.querySelector<HTMLInputElement>('input[type="file"]') as HTMLInputElement;
const filesDrag = (files: File[] = []) => ({ dataTransfer: { files, types: ["Files"], dropEffect: "none" } });

function drop(files: File[]) {
  fireEvent.drop(dropzone(), filesDrag(files));
}

beforeEach(() => {
  // The field warns once per message in development; most tests are not about the warning.
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("FileUpload", () => {
  describe("structure and naming", () => {
    it("is a named group holding a drop area, a button, a hint and nothing else", () => {
      render(<FileUpload aria-label="Attachments" accept=".pdf" maxSize={2048} />);
      expect(screen.getByRole("group", { name: "Attachments" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Choose files" })).toBeInTheDocument();
      expect(screen.getByText("Drag and drop files here, or")).toBeInTheDocument();
      expect(screen.getByText("Accepted: .pdf · Up to 2 KB each")).toBeInTheDocument();
      expect(screen.queryByRole("list")).toBeNull();
    });

    it("writes the single-file wording when it takes one file", () => {
      render(<FileUpload aria-label="Résumé" multiple={false} />);
      expect(screen.getByRole("button", { name: "Choose a file" })).toBeInTheDocument();
      expect(screen.getByText("Drag and drop a file here, or")).toBeInTheDocument();
    });

    it("draws only a button for layout=button", () => {
      render(<FileUpload aria-label="Photos" layout="button" accept="image/*" />);
      expect(screen.getByRole("button", { name: "Choose files" })).toBeInTheDocument();
      expect(screen.queryByText("Drag and drop files here, or")).toBeNull();
      expect(screen.getByText("Accepted: image/*")).toBeInTheDocument();
    });

    it("describes the button by the hint", () => {
      render(<FileUpload aria-label="Attachments" accept=".pdf" />);
      const hint = screen.getByText("Accepted: .pdf");
      expect(screen.getByRole("button", { name: "Choose files" })).toHaveAttribute("aria-describedby", hint.id);
    });

    it("takes a hint of its own, or none", () => {
      const { rerender } = render(<FileUpload aria-label="A" accept=".pdf" hint="Only PDFs, please" />);
      expect(screen.getByText("Only PDFs, please")).toBeInTheDocument();
      rerender(<FileUpload aria-label="A" accept=".pdf" hint={null} />);
      expect(screen.queryByText(/PDF|pdf/)).toBeNull();
      expect(screen.getByRole("button", { name: "Choose files" })).not.toHaveAttribute("aria-describedby");
    });

    it("forwards its ref to the group and puts the id on the file input", () => {
      const ref = createRef<HTMLDivElement>();
      render(<FileUpload ref={ref} aria-label="A" id="upload" data-testid="field" className="extra" />);
      expect(ref.current).toBe(screen.getByRole("group"));
      expect(hiddenInput()).toHaveAttribute("id", "upload");
      expect(screen.getByTestId("field")).toBe(ref.current);
      expect(ref.current).toHaveClass("extra");
    });

    it("keeps its group role against a same-named prop", () => {
      render(<FileUpload aria-label="A" {...({ role: "presentation" } as object)} />);
      expect(screen.getByRole("group")).toBeInTheDocument();
    });

    it("keeps a default label whose override is undefined", () => {
      render(<FileUpload aria-label="A" labels={{ choose: undefined, dropToAdd: "Release" }} />);
      expect(screen.getByRole("button", { name: "Choose files" })).toBeInTheDocument();
    });

    it("rejects a part drawn outside the field", () => {
      expect(() => render(<FileUpload.List />)).toThrow(/inside a <FileUpload>/);
    });

    it("warns, once, when it has no accessible name", () => {
      render(<FileUpload data-testid="nameless-warning" />);
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("neither `aria-label` nor `aria-labelledby`"));
    });
  });

  describe("choosing files", () => {
    it("adds dropped files to the list and asks for the new value", () => {
      const onValueChange = vi.fn();
      const onFilesAdded = vi.fn();
      const file = makeFile("report.pdf", 1536, "application/pdf");
      render(<FileUpload aria-label="A" onValueChange={onValueChange} onFilesAdded={onFilesAdded} />);
      drop([file]);
      expect(onFilesAdded).toHaveBeenCalledWith([file], "drop");
      const [value] = onValueChange.mock.calls[0] as [FileUploadEntry[]];
      expect(value).toHaveLength(1);
      expect(value[0]).toMatchObject({ file, status: "idle" });
      expect(value[0]?.id).toBeTruthy();
      expect(screen.getByRole("list", { name: "Selected files" })).toBeInTheDocument();
      expect(screen.getByText("report.pdf")).toBeInTheDocument();
      expect(screen.getByText("1.5 KB")).toBeInTheDocument();
    });

    it("adds files chosen with the picker, and opens the picker from the button", async () => {
      const user = userEvent.setup();
      const onFilesAdded = vi.fn();
      const click = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => undefined);
      render(<FileUpload aria-label="A" onFilesAdded={onFilesAdded} />);
      await user.click(screen.getByRole("button", { name: "Choose files" }));
      expect(click).toHaveBeenCalledTimes(1);
      const file = makeFile("a.txt");
      fireEvent.change(hiddenInput(), { target: { files: [file] } });
      expect(onFilesAdded).toHaveBeenCalledWith([file], "picker");
      expect(screen.getByText("a.txt")).toBeInTheDocument();
    });

    it("opens the picker once when the drop area itself is clicked, and not for the button inside it", async () => {
      const user = userEvent.setup();
      const click = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => undefined);
      render(<FileUpload aria-label="A" />);
      await user.click(screen.getByText("Drag and drop files here, or"));
      expect(click).toHaveBeenCalledTimes(1);
      await user.click(screen.getByRole("button", { name: "Choose files" }));
      expect(click).toHaveBeenCalledTimes(2);
    });

    it("opens the picker from the keyboard", async () => {
      const user = userEvent.setup();
      const click = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => undefined);
      render(<FileUpload aria-label="A" />);
      await user.tab();
      expect(screen.getByRole("button", { name: "Choose files" })).toHaveFocus();
      await user.keyboard("{Enter}");
      expect(click).toHaveBeenCalledTimes(1);
      await user.keyboard(" ");
      expect(click).toHaveBeenCalledTimes(2);
    });

    it("lets a click handler on the trigger keep the picker closed", async () => {
      const user = userEvent.setup();
      const click = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => undefined);
      render(
        <FileUpload aria-label="A">
          <FileUpload.Trigger onClick={(event) => event.preventDefault()}>Browse</FileUpload.Trigger>
        </FileUpload>,
      );
      await user.click(screen.getByRole("button", { name: "Browse" }));
      expect(click).not.toHaveBeenCalled();
    });

    it("adds pasted files while the area has focus", () => {
      const onFilesAdded = vi.fn();
      render(<FileUpload aria-label="A" onFilesAdded={onFilesAdded} />);
      const file = makeFile("clip.png", 10, "image/png");
      const event = createEvent.paste(screen.getByRole("button", { name: "Choose files" }), {
        clipboardData: { files: [file] },
      });
      fireEvent(screen.getByRole("button", { name: "Choose files" }), event);
      expect(event.defaultPrevented).toBe(true);
      expect(onFilesAdded).toHaveBeenCalledWith([file], "paste");
    });

    it("leaves a paste with no files alone", () => {
      const onFilesAdded = vi.fn();
      render(<FileUpload aria-label="A" onFilesAdded={onFilesAdded} />);
      const event = createEvent.paste(screen.getByRole("button", { name: "Choose files" }), {
        clipboardData: { files: [] },
      });
      fireEvent(screen.getByRole("button", { name: "Choose files" }), event);
      expect(event.defaultPrevented).toBe(false);
      expect(onFilesAdded).not.toHaveBeenCalled();
    });
  });

  describe("dragging", () => {
    it("cancels a drag of files, so the area is a drop target, and says it will copy", () => {
      render(<FileUpload aria-label="A" />);
      const over = createEvent.dragOver(dropzone(), filesDrag());
      fireEvent(dropzone(), over);
      expect(over.defaultPrevented).toBe(true);
      expect((over as unknown as { dataTransfer: { dropEffect: string } }).dataTransfer.dropEffect).toBe("copy");
    });

    it("ignores a drag that carries no files", () => {
      const onFilesAdded = vi.fn();
      render(<FileUpload aria-label="A" onFilesAdded={onFilesAdded} />);
      const over = createEvent.dragOver(dropzone(), { dataTransfer: { types: ["text/plain"], files: [] } });
      fireEvent(dropzone(), over);
      expect(over.defaultPrevented).toBe(false);
      const dropped = createEvent.drop(dropzone(), { dataTransfer: { types: ["text/plain"], files: [] } });
      fireEvent(dropzone(), dropped);
      expect(dropped.defaultPrevented).toBe(false);
      expect(onFilesAdded).not.toHaveBeenCalled();
    });

    it("shows the drag over the area, and survives the pointer crossing its children", () => {
      render(<FileUpload aria-label="A" />);
      const child = screen.getByText("Drag and drop files here, or");
      fireEvent.dragEnter(dropzone(), filesDrag());
      expect(dropzone()).toHaveAttribute("data-drag-active", "true");
      expect(screen.getByText("Drop to add")).toBeInTheDocument();
      // Into a child (enter) and out of the area's own box (leave): still over.
      fireEvent.dragEnter(child, filesDrag());
      fireEvent.dragLeave(dropzone(), filesDrag());
      expect(dropzone()).toHaveAttribute("data-drag-active", "true");
      fireEvent.dragLeave(child, filesDrag());
      expect(dropzone()).not.toHaveAttribute("data-drag-active");
      expect(screen.getByText("Drag and drop files here, or")).toBeInTheDocument();
    });

    it("clears the drag when the files are dropped", () => {
      render(<FileUpload aria-label="A" />);
      fireEvent.dragEnter(dropzone(), filesDrag());
      drop([makeFile("a.txt")]);
      expect(dropzone()).not.toHaveAttribute("data-drag-active");
    });

    it("cancels a drop on a disabled field without adding the files", () => {
      const onFilesAdded = vi.fn();
      render(<FileUpload aria-label="A" disabled onFilesAdded={onFilesAdded} />);
      const dropped = createEvent.drop(dropzone(), filesDrag([makeFile("a.txt")]));
      fireEvent(dropzone(), dropped);
      expect(dropped.defaultPrevented).toBe(true);
      expect(onFilesAdded).not.toHaveBeenCalled();
      const over = createEvent.dragOver(dropzone(), filesDrag());
      fireEvent(dropzone(), over);
      expect((over as unknown as { dataTransfer: { dropEffect: string } }).dataTransfer.dropEffect).toBe("none");
    });
  });

  describe("guarding the page", () => {
    const fileDropOnThePage = () => {
      const event = createEvent.drop(document.body, filesDrag([makeFile("a.txt")]));
      fireEvent(document.body, event);
      return event.defaultPrevented;
    };

    it("leaves a file dropped elsewhere on the page to the browser unless asked", () => {
      render(<FileUpload aria-label="A" />);
      expect(fileDropOnThePage()).toBe(false);
    });

    it("cancels a file dropped elsewhere on the page when asked, and stops when it goes", () => {
      const { rerender, unmount } = render(<FileUpload aria-label="A" guardPage />);
      expect(fileDropOnThePage()).toBe(true);
      const text = createEvent.drop(document.body, { dataTransfer: { types: ["text/plain"], files: [] } });
      fireEvent(document.body, text);
      expect(text.defaultPrevented).toBe(false);
      rerender(<FileUpload aria-label="A" guardPage={false} />);
      expect(fileDropOnThePage()).toBe(false);
      rerender(<FileUpload aria-label="A" guardPage />);
      unmount();
      expect(fileDropOnThePage()).toBe(false);
    });
  });

  describe("rules", () => {
    it("refuses a type that isn't accepted, by extension, family and exact type, and says so", () => {
      const onFilesRejected = vi.fn();
      render(<FileUpload aria-label="A" accept=".PDF,image/*,text/csv" onFilesRejected={onFilesRejected} />);
      drop([makeFile("a.pdf"), makeFile("b.png", 5, "image/png"), makeFile("c.csv", 5, "text/csv"), makeFile("d.exe", 5, "application/x-msdownload")]);
      expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(
        expect.arrayContaining([expect.stringContaining("a.pdf"), expect.stringContaining("b.png"), expect.stringContaining("c.csv")]),
      );
      expect(screen.getByRole("alert")).toHaveTextContent("d.exe is not an accepted file type (.PDF, image/*, text/csv)");
      expect(onFilesRejected).toHaveBeenCalledWith([expect.objectContaining({ reasons: ["file-type"] })]);
    });

    it("refuses a file that is too large or too small, with the limit in words", () => {
      render(<FileUpload aria-label="A" maxSize={2048} minSize={100} />);
      drop([makeFile("big.bin", 4096), makeFile("tiny.bin", 10), makeFile("ok.bin", 500)]);
      expect(screen.getByText("big.bin is larger than 2 KB")).toBeInTheDocument();
      expect(screen.getByText("tiny.bin is smaller than 100 B")).toBeInTheDocument();
      expect(screen.getByRole("list", { name: "Selected files" })).toHaveTextContent("ok.bin");
    });

    it("lists every reason a file was refused", () => {
      render(<FileUpload aria-label="A" accept=".pdf" maxSize={10} />);
      drop([makeFile("big.exe", 100)]);
      expect(screen.getAllByRole("alert")).toHaveLength(2);
    });

    it("refuses files past maxFiles, counting the ones already held", () => {
      const onValueChange = vi.fn();
      render(<FileUpload aria-label="A" maxFiles={2} defaultValue={[entryOf(makeFile("held.txt"))]} onValueChange={onValueChange} />);
      drop([makeFile("one.txt"), makeFile("two.txt")]);
      const [value] = onValueChange.mock.calls[0] as [FileUploadEntry[]];
      expect(value.map((entry) => entry.file.name)).toEqual(["held.txt", "one.txt"]);
      expect(screen.getByRole("alert")).toHaveTextContent("two.txt was not added: no more than 2 files");
    });

    it("lets a single-file field replace its file, and refuses the extras of one drop", () => {
      render(<FileUpload aria-label="A" multiple={false} defaultValue={[entryOf(makeFile("old.txt"))]} />);
      drop([makeFile("new.txt"), makeFile("extra.txt")]);
      const list = screen.getByRole("list", { name: "Selected files" });
      expect(within(list).getAllByRole("listitem")).toHaveLength(1);
      expect(list).toHaveTextContent("new.txt");
      expect(screen.getByRole("alert")).toHaveTextContent("extra.txt was not added: no more than 1 files");
    });

    it("clears the refusals on the next choice, and when a file is removed", async () => {
      const user = userEvent.setup();
      render(<FileUpload aria-label="A" maxSize={10} />);
      drop([makeFile("big.bin", 100), makeFile("ok.bin", 5)]);
      expect(screen.getByRole("alert")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Remove ok.bin" }));
      expect(screen.queryByRole("alert")).toBeNull();
      drop([makeFile("big.bin", 100)]);
      drop([makeFile("fine.bin", 5)]);
      expect(screen.queryByRole("alert")).toBeNull();
    });

    it("runs a rule of its own and refuses with its message", () => {
      render(<FileUpload aria-label="A" validate={(file) => (file.name.includes(" ") ? "no spaces in names" : undefined)} />);
      drop([makeFile("my file.txt"), makeFile("fine.txt")]);
      expect(screen.getByText("my file.txt: no spaces in names")).toBeInTheDocument();
      expect(screen.getByRole("list", { name: "Selected files" })).toHaveTextContent("fine.txt");
    });

    it("waits for a rule that returns a promise", async () => {
      const onFilesAdded = vi.fn();
      render(
        <FileUpload
          aria-label="A"
          onFilesAdded={onFilesAdded}
          validate={(file) => Promise.resolve(file.name === "bad.txt" ? "not allowed" : null)}
        />,
      );
      drop([makeFile("bad.txt"), makeFile("good.txt")]);
      await waitFor(() => expect(onFilesAdded).toHaveBeenCalled());
      expect(screen.getByText("bad.txt: not allowed")).toBeInTheDocument();
      expect(screen.getByRole("list", { name: "Selected files" })).toHaveTextContent("good.txt");
    });

    it("refuses a file whose rule throws or rejects, and warns", async () => {
      render(
        <FileUpload
          aria-label="A"
          validate={(file) => {
            if (file.name === "throws.txt") throw new Error("boom");
            return Promise.reject(new Error("nope"));
          }}
        />,
      );
      drop([makeFile("throws.txt"), makeFile("rejects.txt")]);
      await waitFor(() => expect(screen.getAllByRole("alert")).toHaveLength(2));
      expect(screen.getByText("throws.txt: it could not be checked")).toBeInTheDocument();
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("`validate` threw or rejected"));
    });

    it("writes sizes with the formatter it is given", () => {
      render(<FileUpload aria-label="A" maxSize={4096} formatSize={(bytes) => `${bytes} bytes`} />);
      expect(screen.getByText("Up to 4096 bytes each")).toBeInTheDocument();
      drop([makeFile("a.txt", 12)]);
      expect(screen.getByText("12 bytes")).toBeInTheDocument();
    });
  });

  describe("controlled and uncontrolled", () => {
    it("keeps what it was given until the value changes, and asks for the change", () => {
      const onValueChange = vi.fn();
      render(<FileUpload aria-label="A" value={[]} onValueChange={onValueChange} />);
      drop([makeFile("a.txt")]);
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("list")).toBeNull();
    });

    it("shows the status and progress the owner writes", () => {
      function Owner() {
        const [value, setValue] = useState<FileUploadEntry[]>([]);
        return (
          <>
            <FileUpload aria-label="A" value={value} onValueChange={setValue} />
            <button type="button" onClick={() => setValue((current) => current.map((entry) => ({ ...entry, status: "uploading", progress: 40 })))}>
              start
            </button>
          </>
        );
      }
      render(<Owner />);
      drop([makeFile("a.txt")]);
      fireEvent.click(screen.getByText("start"));
      expect(screen.getByRole("progressbar", { name: "Uploading a.txt" })).toHaveAttribute("aria-valuenow", "40");
      expect(screen.getByText("Uploading… 40%")).toBeInTheDocument();
    });

    it("starts from defaultValue", () => {
      render(<FileUpload aria-label="A" defaultValue={[entryOf(makeFile("a.txt"))]} />);
      expect(screen.getByText("a.txt")).toBeInTheDocument();
    });

    it("reads a value that isn't an array as no files", () => {
      render(<FileUpload aria-label="A" value={"nope" as unknown as FileUploadEntry[]} />);
      expect(screen.queryByRole("list")).toBeNull();
    });

    it("warns when given both value and defaultValue", () => {
      render(<FileUpload aria-label="A" value={[]} defaultValue={[]} />);
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("both `value` and `defaultValue`"));
    });
  });

  describe("the list", () => {
    it("shows an entry's status in words, not only by colour or icon", () => {
      const done = entryOf(makeFile("done.txt", 2048), { status: "done" });
      const failed = entryOf(makeFile("failed.txt"), { status: "error", error: "Server said no" });
      const failedPlain = entryOf(makeFile("plain.txt"), { status: "error" });
      const waiting = entryOf(makeFile("wait.txt", 100), { status: "uploading" });
      render(<FileUpload aria-label="A" defaultValue={[done, failed, failedPlain, waiting]} />);
      expect(screen.getByText("Uploaded · 2 KB")).toBeInTheDocument();
      expect(screen.getByText("Server said no")).toBeInTheDocument();
      expect(screen.getByText("Upload failed")).toBeInTheDocument();
      expect(screen.getByText("Uploading…")).toBeInTheDocument();
      // An uploading file whose progress can't be measured has an indeterminate bar.
      expect(screen.getByRole("progressbar", { name: "Uploading wait.txt" })).not.toHaveAttribute("aria-valuenow");
    });

    it("clamps progress to 0–100 and rounds it", () => {
      render(<FileUpload aria-label="A" defaultValue={[entryOf(makeFile("a.txt"), { status: "uploading", progress: 133.6 })]} />);
      expect(screen.getByText("Uploading… 100%")).toBeInTheDocument();
    });

    it("draws each entry with a function of your own", () => {
      render(
        <FileUpload aria-label="A" defaultValue={[entryOf(makeFile("a.txt"))]}>
          <FileUpload.List>{(entry) => <FileUpload.Item entry={entry} data-testid="mine" />}</FileUpload.List>
        </FileUpload>,
      );
      expect(screen.getByTestId("mine")).toHaveTextContent("a.txt");
    });

    it("offers retry only for a failed entry and only when it can be handled", async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();
      const failed = entryOf(makeFile("a.txt"), { status: "error" });
      const { rerender } = render(<FileUpload aria-label="A" defaultValue={[failed]} />);
      expect(screen.queryByRole("button", { name: "Retry a.txt" })).toBeNull();
      rerender(<FileUpload aria-label="A" defaultValue={[failed]} onRetry={onRetry} />);
      await user.click(screen.getByRole("button", { name: "Retry a.txt" }));
      expect(onRetry).toHaveBeenCalledWith(failed);
    });
  });

  describe("removing", () => {
    it("asks for the shorter list, reports the entry and announces it", async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      const onValueChange = vi.fn();
      const a = entryOf(makeFile("a.txt"));
      const b = entryOf(makeFile("b.txt"));
      render(<FileUpload aria-label="A" defaultValue={[a, b]} onRemove={onRemove} onValueChange={onValueChange} />);
      await user.click(screen.getByRole("button", { name: "Remove a.txt" }));
      expect(onValueChange).toHaveBeenCalledWith([b]);
      expect(onRemove).toHaveBeenCalledWith(a);
      expect(screen.queryByText("a.txt")).toBeNull();
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("a.txt removed"));
    });

    it("starts each change from the list the last one left, even within one turn", () => {
      render(<FileUpload aria-label="A" defaultValue={[entryOf(makeFile("a.txt")), entryOf(makeFile("b.txt")), entryOf(makeFile("c.txt"))]} />);
      act(() => {
        screen.getByRole("button", { name: "Remove a.txt" }).click();
        screen.getByRole("button", { name: "Remove b.txt" }).click();
      });
      expect(screen.getAllByRole("listitem")).toHaveLength(1);
      expect(screen.getByText("c.txt")).toBeInTheDocument();
    });

    it("leaves a controlled list alone, and focus where it is", async () => {
      const user = userEvent.setup();
      const a = entryOf(makeFile("a.txt"));
      render(<FileUpload aria-label="A" value={[a]} onValueChange={() => undefined} />);
      const button = screen.getByRole("button", { name: "Remove a.txt" });
      await user.click(button);
      expect(screen.getByText("a.txt")).toBeInTheDocument();
      expect(button).toHaveFocus();
    });

    it("moves focus to the next entry's remove button, and then to the picker button", async () => {
      const user = userEvent.setup();
      render(<FileUpload aria-label="A" defaultValue={[entryOf(makeFile("a.txt")), entryOf(makeFile("b.txt"))]} />);
      await user.click(screen.getByRole("button", { name: "Remove a.txt" }));
      expect(screen.getByRole("button", { name: "Remove b.txt" })).toHaveFocus();
      await user.click(screen.getByRole("button", { name: "Remove b.txt" }));
      expect(screen.getByRole("button", { name: "Choose files" })).toHaveFocus();
    });

    it("does not take focus back from where the person has moved on to", async () => {
      const user = userEvent.setup();
      function Slow() {
        const [value, setValue] = useState<FileUploadEntry[]>([entryOf(makeFile("a.txt"))]);
        return (
          <>
            <FileUpload aria-label="A" value={value} onValueChange={() => undefined} />
            <button type="button" onClick={() => setValue([])}>
              finish later
            </button>
          </>
        );
      }
      render(<Slow />);
      await user.click(screen.getByRole("button", { name: "Remove a.txt" }));
      await user.click(screen.getByText("finish later"));
      expect(screen.getByText("finish later")).toHaveFocus();
    });
  });

  describe("announcements", () => {
    it("announces files being added", async () => {
      render(<FileUpload aria-label="A" />);
      drop([makeFile("a.txt"), makeFile("b.txt")]);
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("2 files added"));
    });

    it("announces a change of status, and not the first appearance of a list", async () => {
      const waiting = entryOf(makeFile("a.txt"), { status: "uploading" });
      const { rerender } = render(<FileUpload aria-label="A" value={[waiting]} />);
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 250));
      });
      expect(screen.getByRole("status")).toBeEmptyDOMElement();
      rerender(<FileUpload aria-label="A" value={[{ ...waiting, status: "done" }]} />);
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("a.txt uploaded"));
      rerender(<FileUpload aria-label="A" value={[{ ...waiting, status: "error", error: "too big" }]} />);
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("a.txt failed: too big"));
    });

    it("still announces under StrictMode, which mounts and remounts it", async () => {
      const waiting = entryOf(makeFile("a.txt"), { status: "uploading" });
      const props: FileUploadProps = { "aria-label": "A" };
      const { rerender } = render(
        <StrictMode>
          <FileUpload {...props} value={[waiting]} />
        </StrictMode>,
      );
      rerender(
        <StrictMode>
          <FileUpload {...props} value={[{ ...waiting, status: "done" }]} />
        </StrictMode>,
      );
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("a.txt uploaded"));
    });

    it("writes its announcements from the labels it is given", async () => {
      render(<FileUpload aria-label="A" labels={{ added: (count, first) => `${first} + ${count}` }} />);
      drop([makeFile("a.txt")]);
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("a.txt + 1"));
    });
  });

  describe("disabled and read-only", () => {
    it("disables the button, the remove buttons and the input", () => {
      render(<FileUpload aria-label="A" disabled defaultValue={[entryOf(makeFile("a.txt"))]} />);
      expect(screen.getByRole("button", { name: "Choose files" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Remove a.txt" })).toBeDisabled();
      expect(hiddenInput()).toBeDisabled();
      expect(screen.getByRole("group")).toHaveAttribute("aria-disabled", "true");
    });

    it("shows only the list when read-only", () => {
      render(<FileUpload aria-label="A" readOnly defaultValue={[entryOf(makeFile("a.txt"))]} />);
      expect(screen.queryByRole("button")).toBeNull();
      expect(screen.getByText("a.txt")).toBeInTheDocument();
    });

    it("adds nothing when read-only", () => {
      render(<FileUpload aria-label="A" readOnly />);
      expect(screen.queryByText("Drag and drop files here, or")).toBeNull();
    });
  });

  describe("forms", () => {
    it("carries the name, form, accept and multiple on a real, hidden file input", () => {
      render(<FileUpload aria-label="A" name="docs" form="f" accept=".pdf" multiple />);
      // jsdom has no `DataTransfer`, and this is the first test in the file to name the field, so it also sees the
      // development warning, which is given once per process.
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("no `DataTransfer` constructor"));
      const input = hiddenInput();
      expect(input).toHaveAttribute("name", "docs");
      expect(input).toHaveAttribute("form", "f");
      expect(input).toHaveAttribute("accept", ".pdf");
      expect(input).toHaveAttribute("multiple");
      expect(input).toHaveAttribute("tabindex", "-1");
      expect(input).toHaveAttribute("aria-hidden", "true");
    });

    it("refuses a form's submit while it is required and empty, with its own message", () => {
      const { rerender } = render(<FileUpload aria-label="A" required value={[]} />);
      expect(hiddenInput()).toBeRequired();
      expect(hiddenInput().validationMessage).toBe("Choose at least one file");
      rerender(<FileUpload aria-label="A" required value={[entryOf(makeFile("a.txt"))]} />);
      expect(hiddenInput().validity.customError).toBe(false);
    });

    it("hands focus to the button when the browser focuses the invalid input", () => {
      render(<FileUpload aria-label="A" required />);
      act(() => hiddenInput().focus());
      expect(screen.getByRole("button", { name: "Choose files" })).toHaveFocus();
    });

    it("writes the list's files into the input, and takes them out again", async () => {
      const user = userEvent.setup();
      const written: File[][] = [];
      class FakeTransfer {
        files: File[] = [];
        items = { add: (file: File) => this.files.push(file) };
      }
      vi.stubGlobal("DataTransfer", FakeTransfer);
      const filesDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "files");
      Object.defineProperty(HTMLInputElement.prototype, "files", {
        configurable: true,
        get() {
          const list = (this as { __files?: File[] }).__files ?? [];
          return Object.assign([...list], { item: (index: number) => list[index] ?? null });
        },
        set(value: File[]) {
          (this as { __files?: File[] }).__files = value;
          written.push(value);
        },
      });
      try {
        render(<FileUpload aria-label="A" name="docs" />);
        drop([makeFile("a.txt"), makeFile("b.txt")]);
        expect(written.at(-1)?.map((file) => file.name)).toEqual(["a.txt", "b.txt"]);
        await user.click(screen.getByRole("button", { name: "Remove a.txt" }));
        expect(written.at(-1)?.map((file) => file.name)).toEqual(["b.txt"]);
      } finally {
        if (filesDescriptor) Object.defineProperty(HTMLInputElement.prototype, "files", filesDescriptor);
        vi.unstubAllGlobals();
      }
    });

    it("is named by a FormField's label and takes its id and error", () => {
      render(
        <FormField label="Résumé" error="Choose a file" name="resume">
          {(field) => <FileUpload {...field} accept=".pdf" />}
        </FormField>,
      );
      const group = screen.getByRole("group", { name: "Résumé" });
      expect(group).toBeInTheDocument();
      expect(group).toHaveAccessibleDescription("Choose a file");
      // The label points at the file input, so it opens the picker when clicked and the button keeps its own name.
      expect(screen.getByText("Résumé").closest("label")).toHaveAttribute("for", hiddenInput().id);
      expect(screen.getByRole("button", { name: "Choose files" })).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has no axe violations at rest, with files, with refusals and when disabled", async () => {
      const { container, rerender } = render(<FileUpload aria-label="Attachments" accept=".pdf" />);
      expect(await axe(container)).toHaveNoViolations();
      rerender(
        <FileUpload
          aria-label="Attachments"
          accept=".pdf"
          onRetry={() => undefined}
          defaultValue={[
            entryOf(makeFile("a.pdf"), { status: "done" }),
            entryOf(makeFile("b.pdf"), { status: "uploading", progress: 30 }),
            entryOf(makeFile("c.pdf"), { status: "error", error: "Failed" }),
          ]}
        />,
      );
      expect(await axe(container)).toHaveNoViolations();
      drop([makeFile("bad.exe")]);
      expect(await axe(container)).toHaveNoViolations();
      rerender(<FileUpload aria-label="Attachments" disabled layout="button" />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
