import { useEffect, useState } from "react";
import { FileUpload } from "./FileUpload";
import type { FileUploadEntry, FileUploadProps } from "./FileUpload.types";

// Demo code shared by the stories and the real-browser checks. Not part of the package.

/** A sample file of a given size, without allocating the bytes. */
export function demoFile(name: string, size = 2048, type = "application/octet-stream"): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

/** One entry per state, for a list that shows every status at once. */
export function demoEntries(): FileUploadEntry[] {
  return [
    { id: "one", file: demoFile("quarterly-report.pdf", 1_450_000, "application/pdf"), status: "done" },
    { id: "two", file: demoFile("site-photo.jpg", 3_200_000, "image/jpeg"), status: "uploading", progress: 62 },
    { id: "three", file: demoFile("notes.txt", 820, "text/plain"), status: "idle" },
    { id: "four", file: demoFile("backup.zip", 48_000_000, "application/zip"), status: "error", error: "The connection was lost" },
  ];
}

interface SimulatedFileUploadProps extends Omit<FileUploadProps, "value" | "defaultValue" | "onValueChange" | "onRetry"> {
  /** Files whose name contains this text fail, so the error state and retry can be tried. */
  failWhenNameIncludes?: string;
}

/**
 * A `FileUpload` with a pretend uploader behind it: it owns the list, starts every file it is given, moves its progress
 * along and ends it as done (or failed). It is what a real app writes around the field with a request in place of the
 * timer, and why the field itself needs none.
 */
export function SimulatedFileUpload({ failWhenNameIncludes = "fail", ...props }: SimulatedFileUploadProps) {
  const [entries, setEntries] = useState<FileUploadEntry[]>([]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setEntries((current) => {
        let changed = false;
        const next = current.map((entry): FileUploadEntry => {
          if (entry.status === "idle") {
            changed = true;
            return { ...entry, status: "uploading", progress: 0 };
          }
          if (entry.status !== "uploading") return entry;
          changed = true;
          const progress = Math.min(100, (entry.progress ?? 0) + 9);
          if (progress < 100) return { ...entry, progress };
          return entry.file.name.includes(failWhenNameIncludes)
            ? { ...entry, status: "error", progress: undefined, error: "The connection was lost" }
            : { ...entry, status: "done", progress: 100 };
        });
        return changed ? next : current;
      });
    }, 250);
    return () => window.clearInterval(timer);
  }, [failWhenNameIncludes]);

  return (
    <FileUpload
      {...props}
      value={entries}
      onValueChange={setEntries}
      onCancel={(entry) => setEntries((current) => current.filter((item) => item.id !== entry.id))}
      onRetry={(entry) => setEntries((current) => current.map((item) => (item.id === entry.id ? { ...item, status: "idle", error: undefined } : item)))}
    />
  );
}
