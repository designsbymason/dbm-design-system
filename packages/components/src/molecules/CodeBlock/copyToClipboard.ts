/**
 * Puts `text` on the clipboard, resolving to whether it worked. Uses the async Clipboard API where the page is
 * allowed to (a secure context, and a user gesture), and otherwise falls back to selecting a hidden
 * `<textarea>` and running the older `copy` command, which still works on an insecure page or in an old
 * browser. Never throws: the caller only needs to know whether to say "Copied" or "Copy failed".
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Refused (a permissions policy, or no focus): try the older route before giving up.
    }
  }
  return copyWithSelection(text);
}

function copyWithSelection(text: string): boolean {
  if (typeof document === "undefined") return false;
  const field = document.createElement("textarea");
  field.value = text;
  // Kept out of the way and out of the layout, without `display: none` (which cannot be selected).
  field.setAttribute("readonly", "");
  field.setAttribute("aria-hidden", "true");
  field.style.position = "fixed";
  field.style.insetBlockStart = "0";
  field.style.opacity = "0";
  const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  document.body.appendChild(field);
  try {
    field.select();
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    field.remove();
    previousFocus?.focus();
  }
}
