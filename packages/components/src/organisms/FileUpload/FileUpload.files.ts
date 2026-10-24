import type { FileUploadRejection, FileUploadRejectionReason, FileUploadValidateResult } from "./FileUpload.types";

const SIZE_UNITS = ["B", "KB", "MB", "GB"] as const;

/**
 * Writes a size in bytes as `B`, `KB`, `MB` or `GB` in steps of 1024, with at most one decimal. The digits go through
 * `formatNumber`, so the text never depends on the browser's locale.
 */
export function formatFileSize(bytes: number, formatNumber: (value: number) => string = String): string {
  if (!Number.isFinite(bytes) || bytes < 0) return `${formatNumber(0)} ${SIZE_UNITS[0]}`;
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < SIZE_UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded = unit === 0 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${formatNumber(rounded)} ${SIZE_UNITS[unit]}`;
}

/** The `accept` list as people read it: the pieces, trimmed, joined with commas. */
export function describeAccept(accept: string): string {
  return accept
    .split(",")
    .map((piece) => piece.trim())
    .filter(Boolean)
    .join(", ");
}

/**
 * Whether a file matches an `accept` list in the native syntax: `.ext` (case-insensitive), `type/*` and an exact
 * type. An empty or missing list accepts everything. A file with no type is matched by its extension only.
 */
export function matchesAccept(file: Pick<File, "name" | "type">, accept: string | undefined): boolean {
  const pieces = (accept ?? "")
    .split(",")
    .map((piece) => piece.trim().toLowerCase())
    .filter(Boolean);
  if (pieces.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return pieces.some((piece) => {
    if (piece.startsWith(".")) return name.endsWith(piece);
    if (piece.endsWith("/*")) return type.startsWith(piece.slice(0, -1));
    return type === piece;
  });
}

export interface FileRules {
  accept?: string;
  maxSize?: number;
  minSize?: number;
}

/** Splits files into those that pass the type and size rules and those refused, with every reason a file failed. */
export function checkFiles(files: File[], rules: FileRules): { passed: File[]; rejected: FileUploadRejection[] } {
  const passed: File[] = [];
  const rejected: FileUploadRejection[] = [];
  for (const file of files) {
    const reasons: FileUploadRejectionReason[] = [];
    if (!matchesAccept(file, rules.accept)) reasons.push("file-type");
    if (rules.maxSize !== undefined && file.size > rules.maxSize) reasons.push("too-large");
    if (rules.minSize !== undefined && file.size < rules.minSize) reasons.push("too-small");
    if (reasons.length > 0) rejected.push({ file, reasons });
    else passed.push(file);
  }
  return { passed, rejected };
}

/**
 * Keeps as many files as the field has room for and refuses the rest as `"too-many"`. A single-file field replaces what
 * it holds, so its room is one; a field with `maxFiles` has what is left after the entries it already holds.
 */
export function limitCount(
  files: File[],
  held: number,
  multiple: boolean,
  maxFiles: number | undefined,
): { accepted: File[]; rejected: FileUploadRejection[] } {
  const room = multiple ? (maxFiles === undefined ? files.length : Math.max(0, maxFiles - held)) : 1;
  return {
    accepted: files.slice(0, room),
    rejected: files.slice(room).map((file) => ({ file, reasons: ["too-many" as const] })),
  };
}

type Validate = (file: File) => FileUploadValidateResult | PromiseLike<FileUploadValidateResult>;

export const isThenable = (value: unknown): value is PromiseLike<unknown> =>
  typeof value === "object" && value !== null && typeof (value as { then?: unknown }).then === "function";

/** What a rule's answer means: a non-empty string refuses the file, anything else accepts it. */
const messageOf = (result: unknown): string | undefined => (typeof result === "string" && result !== "" ? result : undefined);

/**
 * Runs the consumer's rule on each file. Their function is untrusted: a throw or a rejection refuses the file
 * (reported through `onFault`) rather than taking the field down. The result is a value when every rule answered at
 * once and a promise when any of them did not, so a field without a rule, or with a plain one, adds files in the
 * same turn.
 */
export function runValidate(
  files: File[],
  validate: Validate | undefined,
  onFault: (error: unknown) => void,
): { passed: File[]; rejected: FileUploadRejection[] } | PromiseLike<{ passed: File[]; rejected: FileUploadRejection[] }> {
  if (!validate) return { passed: files, rejected: [] };

  const answers = files.map((file): { message?: string } | PromiseLike<{ message?: string }> => {
    try {
      const result = validate(file);
      if (isThenable(result)) {
        return Promise.resolve(result).then(
          (resolved) => ({ message: messageOf(resolved) }),
          (error: unknown) => {
            onFault(error);
            return { message: "" };
          },
        );
      }
      return { message: messageOf(result) };
    } catch (error) {
      onFault(error);
      return { message: "" };
    }
  });

  const collect = (resolved: { message?: string }[]) => {
    const passed: File[] = [];
    const rejected: FileUploadRejection[] = [];
    resolved.forEach((answer, index) => {
      const file = files[index];
      if (!file) return;
      if (answer.message === undefined) passed.push(file);
      else rejected.push({ file, reasons: ["invalid"], message: answer.message || undefined });
    });
    return { passed, rejected };
  };

  return answers.some(isThenable)
    ? Promise.all(answers).then(collect)
    : collect(answers as { message?: string }[]);
}
