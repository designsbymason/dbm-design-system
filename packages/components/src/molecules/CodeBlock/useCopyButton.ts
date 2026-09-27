import { useAnnouncement } from "@dbm-design-system/primitives";
import { useEffect, useState } from "react";
import { copyToClipboard } from "./copyToClipboard";
import { textToCopy } from "./textToCopy";

/** What the copy button is showing: nothing yet, that it worked, or that it did not. */
export type CopyStatus = "idle" | "copied" | "failed";

interface UseCopyButtonOptions {
  /** The code the block holds. */
  text: string;
  /** The block's `language`, which decides whether a shell prompt is taken off. */
  language: string | undefined;
  stripPrompt: boolean;
  /** How long the result is shown before the button goes back, in milliseconds. */
  duration: number;
  /** What is announced once it has been copied, and if copying was blocked. */
  copied: string;
  copyFailed: string;
  onCopied?: (code: string) => void;
}

/**
 * The copy button's behaviour: copy the code (without a shell prompt, unless told to keep it), show the result for
 * `duration`, announce it in a live region that is already in the page, and tell the app what was copied. Copying again
 * while a result is showing starts the time over.
 */
export function useCopyButton({ text, language, stripPrompt, duration, copied, copyFailed, onCopied }: UseCopyButtonOptions) {
  const [state, setState] = useState<{ status: CopyStatus }>({ status: "idle" });
  const { message, announce } = useAnnouncement();
  useEffect(() => {
    if (state.status === "idle") return;
    const timer = window.setTimeout(() => setState({ status: "idle" }), duration);
    return () => window.clearTimeout(timer);
  }, [state, duration]);
  const copy = async () => {
    const toCopy = textToCopy(text, language, stripPrompt);
    const worked = await copyToClipboard(toCopy);
    // A new object each time, so copying again while a result is showing starts the time over.
    setState({ status: worked ? "copied" : "failed" });
    announce(worked ? copied : copyFailed);
    if (worked) onCopied?.(toCopy);
  };
  return { status: state.status, message, copy };
}
