import { describe, expect, it, vi } from "vitest";
import { checkFiles, describeAccept, dropDuplicates, formatFileSize, isSameFile, limitCount, matchesAccept, runValidate } from "./FileUpload.files";

const file = (name: string, size = 10, type = "") => {
  const made = new File(["x"], name, { type });
  Object.defineProperty(made, "size", { value: size });
  return made;
};

describe("formatFileSize", () => {
  it.each([
    [0, "0 B"],
    [1, "1 B"],
    [1023, "1023 B"],
    [1024, "1 KB"],
    [1536, "1.5 KB"],
    [1024 * 1024, "1 MB"],
    [5.25 * 1024 * 1024, "5.3 MB"],
    [3 * 1024 ** 3, "3 GB"],
    [5000 * 1024 ** 3, "5000 GB"],
  ])("writes %d bytes as %s", (bytes, expected) => {
    expect(formatFileSize(bytes)).toBe(expected);
  });

  it("treats a size that isn't a size as nothing", () => {
    expect(formatFileSize(Number.NaN)).toBe("0 B");
    expect(formatFileSize(-5)).toBe("0 B");
    expect(formatFileSize(Number.POSITIVE_INFINITY)).toBe("0 B");
  });

  it("writes the digits with the formatter it is given", () => {
    expect(formatFileSize(1536, (value) => `<${value}>`)).toBe("<1.5> KB");
  });
});

describe("matchesAccept", () => {
  it("accepts anything when there is no list", () => {
    expect(matchesAccept(file("a.exe"), undefined)).toBe(true);
    expect(matchesAccept(file("a.exe"), "")).toBe(true);
    expect(matchesAccept(file("a.exe"), " , ")).toBe(true);
  });

  it("matches extensions without regard to case, families and exact types", () => {
    expect(matchesAccept(file("A.PDF"), ".pdf")).toBe(true);
    expect(matchesAccept(file("a.pdf"), ".PDF")).toBe(true);
    expect(matchesAccept(file("a.txt"), ".pdf")).toBe(false);
    expect(matchesAccept(file("a", 1, "image/png"), "image/*")).toBe(true);
    expect(matchesAccept(file("a", 1, "video/mp4"), "image/*")).toBe(false);
    expect(matchesAccept(file("a", 1, "application/pdf"), "application/pdf")).toBe(true);
    expect(matchesAccept(file("a", 1, "application/json"), "application/pdf")).toBe(false);
  });

  it("matches any piece of the list", () => {
    expect(matchesAccept(file("a.csv"), ".pdf, .csv")).toBe(true);
  });

  it("matches a file with no type by its extension only", () => {
    expect(matchesAccept(file("a.md"), "text/*")).toBe(false);
    expect(matchesAccept(file("a.md"), ".md")).toBe(true);
  });
});

describe("describeAccept", () => {
  it("trims the pieces and drops the empty ones", () => {
    expect(describeAccept(" .pdf ,, image/* ,")).toBe("PDF, images");
  });

  it.each([
    [".pdf", "PDF"],
    [".JPEG", "JPEG"],
    ["image/*", "images"],
    ["video/*", "videos"],
    ["audio/*", "audio"],
    ["text/*", "text files"],
    ["text/plain", "plain text"],
    ["application/pdf", "PDF"],
    ["text/csv", "CSV"],
    ["image/png", "PNG"],
    ["application/*", "application/*"],
    ["application/vnd.ms-excel", "application/vnd.ms-excel"],
  ])("names %s as %s", (piece, name) => {
    expect(describeAccept(piece)).toBe(name);
  });

  it("drops a name that repeats, whichever piece it came from", () => {
    expect(describeAccept(".png, image/png, .PNG, .pdf")).toBe("PNG, PDF");
  });

  it("uses a name it is given, matched without regard to case, over the automatic one", () => {
    expect(describeAccept(".docx, .PDF", { ".DOCX": "Word documents", ".pdf": "Portable documents" })).toBe(
      "Word documents, Portable documents",
    );
  });
});

describe("dropDuplicates", () => {
  const same = (name: string, size: number, modified: number) => {
    const made = file(name, size, "text/plain");
    Object.defineProperty(made, "lastModified", { value: modified });
    return made;
  };

  it("tells two files apart by name, size, type and modified time", () => {
    expect(isSameFile(same("a", 1, 5), same("a", 1, 5))).toBe(true);
    expect(isSameFile(same("a", 1, 5), same("b", 1, 5))).toBe(false);
    expect(isSameFile(same("a", 1, 5), same("a", 2, 5))).toBe(false);
    expect(isSameFile(same("a", 1, 5), same("a", 1, 6))).toBe(false);
    expect(isSameFile(file("a", 1, "x/y"), file("a", 1, "x/z"))).toBe(false);
  });

  it("refuses a file that is held, and a repeat in the batch, keeping the first", () => {
    const { passed, rejected } = dropDuplicates([same("a", 1, 5), same("b", 1, 5), same("b", 1, 5)], [same("a", 1, 5)], false);
    expect(passed.map((f) => f.name)).toEqual(["b"]);
    expect(rejected.map((r) => [r.file.name, r.reasons])).toEqual([["a", ["duplicate"]], ["b", ["duplicate"]]]);
  });

  it("lets everything through when it is allowed", () => {
    const files = [same("a", 1, 5), same("a", 1, 5)];
    expect(dropDuplicates(files, [same("a", 1, 5)], true)).toEqual({ passed: files, rejected: [] });
  });
});

describe("checkFiles", () => {
  it("reports every reason a file failed, in order", () => {
    const { passed, rejected } = checkFiles([file("a.exe", 500), file("b.pdf", 5)], { accept: ".pdf", maxSize: 100, minSize: 10 });
    expect(passed).toEqual([]);
    expect(rejected.map((r) => r.reasons)).toEqual([["file-type", "too-large"], ["too-small"]]);
  });

  it("passes a file exactly on a limit", () => {
    expect(checkFiles([file("a", 100)], { maxSize: 100, minSize: 100 }).passed).toHaveLength(1);
  });
});

describe("limitCount", () => {
  const four = [file("1"), file("2"), file("3"), file("4")];

  it("keeps everything when there is no limit", () => {
    expect(limitCount(four, 2, true, undefined).accepted).toHaveLength(4);
  });

  it("keeps what is left after the files already held", () => {
    const { accepted, rejected } = limitCount(four, 3, true, 5);
    expect(accepted.map((f) => f.name)).toEqual(["1", "2"]);
    expect(rejected.map((r) => r.file.name)).toEqual(["3", "4"]);
    expect(rejected[0]?.reasons).toEqual(["too-many"]);
  });

  it("keeps nothing when the field is full", () => {
    expect(limitCount(four, 5, true, 5).accepted).toEqual([]);
  });

  it("keeps one for a single-file field, whatever it holds", () => {
    expect(limitCount(four, 9, false, undefined).accepted.map((f) => f.name)).toEqual(["1"]);
  });
});

describe("runValidate", () => {
  it("passes everything through when there is no rule", () => {
    const files = [file("a")];
    expect(runValidate(files, undefined, vi.fn())).toEqual({ passed: files, rejected: [] });
  });

  it("answers at once for a rule that answers at once", () => {
    const result = runValidate([file("a"), file("b")], (f) => (f.name === "b" ? "no" : undefined), vi.fn());
    expect(result).not.toHaveProperty("then");
    expect(result).toMatchObject({ rejected: [{ reasons: ["invalid"], message: "no" }] });
  });

  it("treats an empty string, null and non-strings as acceptance", () => {
    const result = runValidate([file("a"), file("b"), file("c")], (f) => ({ a: "", b: null, c: 5 })[f.name as "a"] as never, vi.fn());
    expect(result).toMatchObject({ rejected: [] });
  });

  it("becomes a promise when any rule does, keeping the order", async () => {
    const result = runValidate([file("a"), file("b")], (f) => (f.name === "a" ? Promise.resolve("late") : undefined), vi.fn());
    expect(result).toHaveProperty("then");
    const settled = await result;
    expect(settled.passed.map((f) => f.name)).toEqual(["b"]);
    expect(settled.rejected[0]?.message).toBe("late");
  });

  it("refuses a file whose rule throws or rejects, and reports the fault", async () => {
    const onFault = vi.fn();
    const sync = runValidate([file("a")], () => {
      throw new Error("boom");
    }, onFault);
    expect(sync).toMatchObject({ rejected: [{ reasons: ["invalid"], message: undefined }] });
    const asynchronous = await runValidate([file("b")], () => Promise.reject(new Error("nope")), onFault);
    expect(asynchronous.rejected).toHaveLength(1);
    expect(onFault).toHaveBeenCalledTimes(2);
  });
});
