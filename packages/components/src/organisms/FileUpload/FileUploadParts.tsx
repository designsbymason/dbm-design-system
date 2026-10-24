import {
  ArrowClockwiseIcon,
  CheckCircleIcon,
  FileArrowUpIcon,
  FileIcon,
  ImageIcon,
  UploadSimpleIcon,
  WarningCircleIcon,
  XIcon,
} from "@dbm-system/icons";
import { cx, mergeRefs } from "@dbm-system/utils";
import { Fragment, forwardRef, useMemo, useRef, useState } from "react";
import type { ClipboardEvent, DragEvent, MouseEvent } from "react";
import { Button } from "../../atoms/Button";
import { FieldError } from "../../atoms/FieldError";
import { Icon } from "../../atoms/Icon";
import type { IconSize } from "../../atoms/Icon/Icon.types";
import { IconButton } from "../../atoms/IconButton";
import { ProgressBar } from "../../atoms/ProgressBar";
import { Text } from "../../atoms/Text";
import type { TextSize } from "../../atoms/Text/Text.types";
import styles from "./FileUpload.module.css";
import { describeAccept } from "./FileUpload.files";
import type {
  FileUploadDropzoneProps,
  FileUploadItemProps,
  FileUploadListProps,
  FileUploadRejection,
  FileUploadRejectionsProps,
  FileUploadSize,
  FileUploadTriggerProps,
} from "./FileUpload.types";
import { useFileUpload } from "./FileUploadContext";
import type { FileUploadContextValue } from "./FileUploadContext";

const sizeClass: Record<FileUploadSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

// The atoms drawn inside take sizes of their own, which a stylesheet can't set.
const promptTextSize: Record<FileUploadSize, TextSize> = { xs: "xs", sm: "sm", md: "base", lg: "md", xl: "lg" };
const hintTextSize: Record<FileUploadSize, TextSize> = { xs: "xs", sm: "xs", md: "sm", lg: "sm", xl: "base" };
const dropzoneIconSize: Record<FileUploadSize, IconSize> = { xs: "md", sm: "lg", md: "xl", lg: "2xl", xl: "3xl" };
const entryIconSize: Record<FileUploadSize, IconSize> = { xs: "md", sm: "lg", md: "lg", lg: "xl", xl: "xl" };
const statusIconSize: Record<FileUploadSize, IconSize> = { xs: "xs", sm: "xs", md: "sm", lg: "sm", xl: "md" };
const barSize: Record<FileUploadSize, "xs" | "sm" | "md"> = { xs: "xs", sm: "xs", md: "sm", lg: "sm", xl: "md" };
const actionSize: Record<FileUploadSize, "xs" | "sm" | "md"> = { xs: "xs", sm: "xs", md: "sm", lg: "sm", xl: "md" };

const hasFiles = (event: DragEvent) => Array.from(event.dataTransfer?.types ?? []).includes("Files");

/** The sentence for one refusal: each reason in words, with the file's name. */
function describeRejection(rejection: FileUploadRejection, context: FileUploadContextValue, accept: string | undefined): string[] {
  const { labels, formatSize } = context;
  const name = rejection.file.name;
  return rejection.reasons.map((reason) => {
    switch (reason) {
      case "file-type":
        return labels.fileType(name, accept ? describeAccept(accept) : "");
      case "too-large":
        return labels.tooLarge(name, formatSize(context.limits.maxSize ?? 0));
      case "too-small":
        return labels.tooSmall(name, formatSize(context.limits.minSize ?? 0));
      case "too-many":
        return labels.tooMany(name, context.multiple ? (context.limits.maxFiles ?? 1) : 1);
      default:
        return labels.invalid(name, rejection.message ?? labels.couldNotCheck);
    }
  });
}

/**
 * The text under the button naming what is accepted. Used by the default layouts; compose it yourself only through
 * `FileUpload`'s `hint` prop.
 */
export const FileUploadHint = forwardRef<HTMLParagraphElement, { className?: string }>(({ className }, ref) => {
  const { hint, hintId, size, readOnly } = useFileUpload("FileUpload hint");
  if (readOnly || hint === null || hint === false || hint === undefined) return null;
  return (
    <Text ref={ref} id={hintId} size={hintTextSize[size]} color="secondary" className={cx(styles.hint, className)}>
      {hint}
    </Text>
  );
});
FileUploadHint.displayName = "FileUpload.Hint";

/**
 * The button that opens the file picker. Inside `FileUpload.Dropzone` it is the keyboard way in; on its own it is the
 * whole field for `layout="button"`. Takes the `Button` atom's props (`variant`, `tone`, `leadingIcon`, …); its text
 * is "Choose files" unless you give children.
 */
export const FileUploadTrigger = forwardRef<HTMLButtonElement, FileUploadTriggerProps>(
  ({ children, onClick, variant = "secondary", leadingIcon = FileArrowUpIcon, "aria-describedby": describedBy, ...props }, ref) => {
    const context = useFileUpload("FileUpload.Trigger");
    const merged = useMemo(() => mergeRefs(ref, context.triggerRef), [ref, context.triggerRef]);
    if (context.readOnly) return null;
    const described = [context.describedBy, describedBy].filter(Boolean).join(" ") || undefined;
    return (
      <Button
        {...props}
        ref={merged}
        type="button"
        variant={variant}
        size={context.size}
        leadingIcon={leadingIcon}
        disabled={context.disabled}
        aria-describedby={described}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) context.open();
        }}
      >
        {children ?? context.labels.choose(context.multiple)}
      </Button>
    );
  },
);
FileUploadTrigger.displayName = "FileUpload.Trigger";

/**
 * The drop area: a dashed box that takes files dropped on it, files pasted while it has focus, and a click, and holds
 * the button that is the keyboard's way in. Left empty it draws an icon, the prompt, the button and the hint. Only
 * dragged files count (not text or links), and nothing happens while the field is disabled.
 */
export const FileUploadDropzone = forwardRef<HTMLDivElement, FileUploadDropzoneProps>(
  ({ children, className, onClick, onPaste, onDragEnter, onDragOver, onDragLeave, onDrop, ...props }, ref) => {
    const context = useFileUpload("FileUpload.Dropzone");
    const [dragging, setDragging] = useState(false);
    // dragenter and dragleave also fire for every child the pointer crosses, so the drag is over when the count of
    // entries minus leaves is back to zero.
    const depth = useRef(0);

    if (context.readOnly) return null;

    const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
      onDragEnter?.(event);
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth.current += 1;
      if (!context.disabled) setDragging(true);
    };
    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
      onDragOver?.(event);
      if (!hasFiles(event)) return;
      // Cancelling dragover is what makes the area a drop target; the effect says whether it is a welcome one.
      event.preventDefault();
      event.dataTransfer.dropEffect = context.disabled ? "none" : "copy";
    };
    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
      onDragLeave?.(event);
      if (!hasFiles(event)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setDragging(false);
    };
    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
      onDrop?.(event);
      if (!hasFiles(event)) return;
      // Always cancelled, so a file dropped on a disabled area is not opened by the browser in place of the page.
      event.preventDefault();
      depth.current = 0;
      setDragging(false);
      context.addFiles(Array.from(event.dataTransfer.files), "drop");
    };
    const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
      onPaste?.(event);
      const files = Array.from(event.clipboardData?.files ?? []);
      if (files.length === 0 || context.disabled) return;
      event.preventDefault();
      context.addFiles(files, "paste");
    };
    const handleClick = (event: MouseEvent<HTMLDivElement>) => {
      onClick?.(event);
      // A click on the button, or on anything else that does its own thing, is that control's; the rest of the
      // area opens the picker for a pointer. The keyboard goes through the button.
      if (event.defaultPrevented || (event.target as Element).closest("button, a, input, select, textarea")) return;
      context.open();
    };

    return (
      // The area's click is a convenience for a pointer: the keyboard and assistive technology reach the same action
      // through the button inside it, so the area itself takes no role or key handler.
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
      <div
        {...props}
        ref={ref}
        data-drag-active={dragging || undefined}
        className={cx(
          styles.dropzone,
          sizeClass[context.size],
          dragging && styles.dragging,
          context.hasError && styles.invalid,
          context.disabled && styles.disabled,
          className,
        )}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handlePaste}
        onClick={handleClick}
      >
        {children ?? (
          <>
            <Icon icon={UploadSimpleIcon} size={dropzoneIconSize[context.size]} tone="secondary" />
            <Text size={promptTextSize[context.size]} color="secondary" align="center">
              {dragging ? context.labels.dropToAdd : context.labels.prompt(context.multiple)}
            </Text>
            <FileUploadTrigger />
            <FileUploadHint className={styles.dropzoneHint} />
          </>
        )}
      </div>
    );
  },
);
FileUploadDropzone.displayName = "FileUpload.Dropzone";

/**
 * The messages for files that were refused, in words and with each file's name, drawn as errors (read out as they
 * appear). They stay until the next files are chosen or an entry is removed. Renders nothing when there are none.
 */
export const FileUploadRejections = forwardRef<HTMLUListElement, FileUploadRejectionsProps>(
  ({ className, ...props }, ref) => {
    const context = useFileUpload("FileUpload.Rejections");
    if (context.rejections.length === 0) return null;
    return (
      // eslint-disable-next-line jsx-a11y/no-redundant-roles -- Safari with VoiceOver drops list semantics otherwise
      <ul {...props} ref={ref} role="list" id={context.rejectionsId} className={cx(styles.rejections, className)}>
        {context.rejections.flatMap((rejection, index) =>
          describeRejection(rejection, context, context.limits.accept).map((message, reasonIndex) => (
            // eslint-disable-next-line jsx-a11y/no-redundant-roles -- Safari with VoiceOver drops list semantics otherwise
            <li key={`${index}-${reasonIndex}`} role="listitem">
              <FieldError>{message}</FieldError>
            </li>
          )),
        )}
      </ul>
    );
  },
);
FileUploadRejections.displayName = "FileUpload.Rejections";

/** The list of chosen files, one `FileUpload.Item` each (or whatever you draw for an entry). Renders nothing while it is empty. */
export const FileUploadList = forwardRef<HTMLUListElement, FileUploadListProps>(
  ({ children, className, ...props }, ref) => {
    const context = useFileUpload("FileUpload.List");
    if (context.entries.length === 0) return null;
    return (
      // eslint-disable-next-line jsx-a11y/no-redundant-roles -- Safari with VoiceOver drops list semantics otherwise
      <ul
        aria-label={context.labels.listLabel}
        {...props}
        ref={ref}
        role="list"
        className={cx(styles.list, sizeClass[context.size], className)}
      >
        {context.entries.map((entry) =>
          children ? <Fragment key={entry.id}>{children(entry)}</Fragment> : <FileUploadItem key={entry.id} entry={entry} />,
        )}
      </ul>
    );
  },
);
FileUploadList.displayName = "FileUpload.List";

/** One chosen file: an icon for its kind, its name and size, where it has got to, and its remove (and retry) button. */
export const FileUploadItem = forwardRef<HTMLLIElement, FileUploadItemProps>(({ entry, className, ...props }, ref) => {
  const context = useFileUpload("FileUpload.Item");
  const { labels, size } = context;
  const status = entry.status ?? "idle";
  const name = entry.file.name;
  const isImage = entry.file.type.startsWith("image/");
  const sizeText = context.formatSize(entry.file.size);
  const percent = entry.progress === undefined ? undefined : Math.round(Math.min(Math.max(entry.progress, 0), 100));

  return (
    // eslint-disable-next-line jsx-a11y/no-redundant-roles -- Safari with VoiceOver drops list semantics otherwise
    <li
      {...props}
      ref={ref}
      role="listitem"
      data-status={status}
      className={cx(styles.item, sizeClass[size], status === "error" && styles.itemError, context.disabled && styles.disabled, className)}
    >
      <Icon icon={isImage ? ImageIcon : FileIcon} size={entryIconSize[size]} tone="secondary" className={styles.entryIcon} />
      <div className={styles.entryBody}>
        <Text size={promptTextSize[size]} weight="medium" wrap="nowrap" dir="auto" className={styles.entryName}>
          {name}
        </Text>
        <Text size={hintTextSize[size]} color={status === "error" ? "danger" : status === "done" ? "success" : "secondary"} className={styles.entryStatus}>
          {status === "error" && <Icon icon={WarningCircleIcon} size={statusIconSize[size]} className={styles.statusIcon} />}
          {status === "done" && <Icon icon={CheckCircleIcon} size={statusIconSize[size]} className={styles.statusIcon} />}
          {status === "uploading"
            ? labels.uploadingStatus(percent)
            : status === "done"
              ? `${labels.uploaded} · ${sizeText}`
              : status === "error"
                ? (entry.error ?? labels.failed)
                : sizeText}
        </Text>
        {status === "uploading" && (
          <ProgressBar size={barSize[size]} value={percent} label={labels.uploading(name)} className={styles.entryBar} />
        )}
      </div>
      {!context.readOnly && (
        <div className={styles.entryActions}>
          {status === "error" && context.canRetry && (
            <IconButton
              icon={ArrowClockwiseIcon}
              variant="ghost"
              tone="neutral"
              size={actionSize[size]}
              aria-label={labels.retry(name)}
              disabled={context.disabled}
              onClick={() => context.retry(entry)}
            />
          )}
          <IconButton
            icon={XIcon}
            variant="ghost"
            tone="neutral"
            size={actionSize[size]}
            aria-label={labels.remove(name)}
            disabled={context.disabled}
            data-fileupload-remove=""
            onClick={() => context.remove(entry)}
          />
        </div>
      )}
    </li>
  );
});
FileUploadItem.displayName = "FileUpload.Item";
