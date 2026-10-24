import { createContext, useContext } from "react";
import type { ReactNode, RefObject } from "react";
import type {
  FileUploadEntry,
  FileUploadLabels,
  FileUploadRejection,
  FileUploadSize,
  FileUploadSource,
} from "./FileUpload.types";

/** What the root hands to its parts. */
export interface FileUploadContextValue {
  entries: FileUploadEntry[];
  rejections: FileUploadRejection[];
  size: FileUploadSize;
  multiple: boolean;
  disabled: boolean;
  readOnly: boolean;
  hasError: boolean;
  labels: FileUploadLabels;
  formatNumber: (value: number) => string;
  formatSize: (bytes: number) => string;
  /** The hint under the button, already worked out; `null` when there is none. */
  hint: ReactNode;
  /** The `id` the hint is drawn with, for the button's `aria-describedby`. */
  hintId: string;
  /** The `id` the refusal messages are drawn with. */
  rejectionsId: string;
  /** The ids the button is described by: the hint, the refusals and the field's own. */
  describedBy: string | undefined;
  /** The limits the refusal messages quote. */
  limits: { accept?: string; maxSize?: number; minSize?: number; maxFiles?: number };
  canRetry: boolean;
  triggerRef: RefObject<HTMLButtonElement | null>;
  open: () => void;
  addFiles: (files: File[], source: FileUploadSource) => void;
  remove: (entry: FileUploadEntry) => void;
  retry: (entry: FileUploadEntry) => void;
}

export const FileUploadContext = createContext<FileUploadContextValue | null>(null);

/** Reads the root's settings; a part drawn outside a `FileUpload` cannot work, so it says so. */
export function useFileUpload(part: string): FileUploadContextValue {
  const context = useContext(FileUploadContext);
  if (!context) throw new Error(`${part} must be rendered inside a <FileUpload>.`);
  return context;
}
